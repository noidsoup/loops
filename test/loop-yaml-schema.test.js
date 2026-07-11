'use strict';

/**
 * Validates every loop.yaml (and the dispatcher loop.yaml) against
 * schema/loop.schema.json. Hand-rolled to avoid pulling in ajv.
 *
 * The schema only enforces:
 *   - top-level required: name, version, description
 *   - types + minLength for top-level strings
 *   - pattern on version (semver-ish: "X.Y.Z...")
 *   - enum on model_class (top-level) and per-phase
 *   - phases: array of objects with required: name, model_class, goal, exit_condition
 *   - additionalProperties: true (we don't reject unknown keys)
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const { REPO, listLoopDirs } = require('../adapters/emit.js');

const SCHEMA = JSON.parse(
  fs.readFileSync(path.join(REPO, 'schema', 'loop.schema.json'), 'utf8')
);

const VALID_MC = new Set(SCHEMA.properties.model_class.enum);
const VERSION_RE = new RegExp(SCHEMA.properties.version.pattern);
const TOP_REQUIRED = SCHEMA.required;
const PHASE_REQUIRED = SCHEMA.properties.phases.items.required;
const PHASE_VALID_MC = new Set(
  SCHEMA.properties.phases.items.properties.model_class.enum
);

/**
 * Tiny YAML reader for the subset this repo uses. We don't need a full parser
 * — just top-level keys, nested array-of-objects via "  - name:" indentation,
 * and block-scalar descriptions. The emit.js code already proves this subset
 * is what the project uses.
 */
function parseSimpleYaml(text) {
  const lines = text.split('\n');
  const out = {};
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim() || line.trim().startsWith('#')) {
      i++;
      continue;
    }
    const top = line.match(/^([A-Za-z_][A-Za-z0-9_]*):\s*(.*)$/);
    if (!top) {
      i++;
      continue;
    }
    const [, key, inline] = top;
    if (inline === '|' || inline === '>') {
      // Block scalar: collect indented lines, dedent by 2
      const collected = [];
      i++;
      while (i < lines.length) {
        const child = lines[i];
        if (child.match(/^\s{2,}\S/)) {
          collected.push(child.replace(/^\s{2}/, ''));
          i++;
        } else {
          break;
        }
      }
      out[key] = collected.join(inline === '|' ? '\n' : ' ').trim();
      continue;
    }
    if (inline === '') {
      // Look for a list of objects (phases)
      const items = [];
      i++;
      while (i < lines.length) {
        const child = lines[i];
        const itemStart = child.match(/^\s{2}-\s+(.*)$/);
        if (!itemStart) break;
        const obj = {};
        const firstInline = itemStart[1];
        const firstKv = firstInline.match(/^([A-Za-z_][A-Za-z0-9_]*):\s*(.*)$/);
        if (firstKv) obj[firstKv[1]] = firstKv[2].trim();
        i++;
        while (i < lines.length) {
          const next = lines[i];
          if (!next.match(/^\s{4,}\S/)) break;
          const kv = next.match(/^\s+(.+?):\s*(.*)$/);
          if (kv) obj[kv[1]] = kv[2].trim();
          i++;
        }
        items.push(obj);
      }
      out[key] = items;
      continue;
    }
    out[key] = inline.replace(/^['"]|['"]$/g, '').trim();
    i++;
  }
  return out;
}

function validateYamlFile(name, yamlText) {
  const errors = [];
  let parsed;
  try {
    parsed = parseSimpleYaml(yamlText);
  } catch (e) {
    return [`${name}: failed to parse: ${e.message}`];
  }

  for (const req of TOP_REQUIRED) {
    if (parsed[req] === undefined || parsed[req] === null || parsed[req] === '') {
      errors.push(`${name}: missing required field "${req}"`);
    }
  }

  if (typeof parsed.name !== 'string' || parsed.name.length < 1) {
    errors.push(`${name}: name must be a non-empty string`);
  }

  if (typeof parsed.version === 'string' && !VERSION_RE.test(parsed.version)) {
    errors.push(
      `${name}: version "${parsed.version}" does not match pattern ${SCHEMA.properties.version.pattern}`
    );
  }

  if (typeof parsed.description !== 'string') {
    errors.push(`${name}: description must be a string`);
  }

  if (parsed.model_class !== undefined && !VALID_MC.has(parsed.model_class)) {
    errors.push(
      `${name}: model_class "${parsed.model_class}" not in ${[...VALID_MC].join('|')}`
    );
  }

  if (parsed.phases !== undefined) {
    if (!Array.isArray(parsed.phases)) {
      errors.push(`${name}: phases must be an array`);
    } else {
      parsed.phases.forEach((phase, idx) => {
        for (const req of PHASE_REQUIRED) {
          if (!phase[req]) errors.push(`${name}: phases[${idx}] missing "${req}"`);
        }
        if (phase.model_class && !PHASE_VALID_MC.has(phase.model_class)) {
          errors.push(
            `${name}: phases[${idx}].model_class "${phase.model_class}" invalid`
          );
        }
      });
    }
  }

  if (parsed.triggers !== undefined && !Array.isArray(parsed.triggers)) {
    errors.push(`${name}: triggers must be an array`);
  }

  return errors;
}

describe('loop.yaml schema validation', () => {
  const allLoops = listLoopDirs();

  for (const [name, dir] of allLoops) {
    it(`${name}/loop.yaml is schema-valid`, () => {
      const yamlText = fs.readFileSync(path.join(dir, 'loop.yaml'), 'utf8');
      const errors = validateYamlFile(name, yamlText);
      assert.deepEqual(errors, [], errors.join('\n'));
    });
  }

  it('all loops have a non-empty description', () => {
    for (const [name, dir] of allLoops) {
      const text = fs.readFileSync(path.join(dir, 'loop.yaml'), 'utf8');
      const parsed = parseSimpleYaml(text);
      assert.ok(parsed.description && parsed.description.length > 0, `${name} has empty description`);
    }
  });

  it('every regular loop has at least one phase', () => {
    // The schema allows 0 phases; the project's emit.js validator rejects 0.
    // This test locks in the project's stricter rule so we don't accidentally
    // ship a loop with no phases.
    for (const [name, dir] of allLoops) {
      if (name === 'dispatcher') continue;
      const text = fs.readFileSync(path.join(dir, 'loop.yaml'), 'utf8');
      const parsed = parseSimpleYaml(text);
      assert.ok(
        Array.isArray(parsed.phases) && parsed.phases.length > 0,
        `${name}: must have at least one phase`
      );
    }
  });

  it('every phase has a non-empty goal and exit_condition', () => {
    for (const [name, dir] of allLoops) {
      if (name === 'dispatcher') continue;
      const text = fs.readFileSync(path.join(dir, 'loop.yaml'), 'utf8');
      const parsed = parseSimpleYaml(text);
      if (!Array.isArray(parsed.phases)) continue;
      for (const [i, phase] of parsed.phases.entries()) {
        assert.ok(phase.goal && phase.goal.length > 0, `${name}.phases[${i}].goal empty`);
        assert.ok(
          phase.exit_condition && phase.exit_condition.length > 0,
          `${name}.phases[${i}].exit_condition empty`
        );
      }
    }
  });

  it('phase names are unique within a loop', () => {
    for (const [name, dir] of allLoops) {
      if (name === 'dispatcher') continue;
      const text = fs.readFileSync(path.join(dir, 'loop.yaml'), 'utf8');
      const parsed = parseSimpleYaml(text);
      if (!Array.isArray(parsed.phases)) continue;
      const names = parsed.phases.map((p) => p.name);
      assert.equal(new Set(names).size, names.length, `${name} has duplicate phase names`);
    }
  });
});
