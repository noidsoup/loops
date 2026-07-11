'use strict';

/**
 * Cross-reference tests for persona usage across loops.
 *
 * Invariants enforced:
 *   1. Every persona named in any loop.yaml exists as personas/<name>.md.
 *   2. Every persona named in any loop.yaml is reflected in the loop.md
 *      — either in the ## Personas table, or in a per-phase "Read" line.
 *   3. Loops that should use personas (build/review work) have a personas:
 *      field. Loops that should NOT (dispatcher, explain-codebase,
 *      use-the-loop, swarm) don't claim to.
 *   4. A loop can't add a persona to its loop.yaml without also adding it
 *      to loop.md (and vice versa).
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const { REPO, listLoopDirs } = require('../adapters/emit.js');

const PERSONAS_DIR = path.join(REPO, 'personas');
const LOOPS_WITH_PERSONAS = new Set([
  'sar',
  'adversarial-gate',
  'tdd',
  'plan-and-implement',
  'reproduce-and-fix',
  'migrate',
]);
const LOOPS_WITHOUT_PERSONAS = new Set([
  'dispatcher',
  'explain-codebase',
  'use-the-loop',
  'swarm',
]);

function listPersonaFiles() {
  return new Set(
    fs.readdirSync(PERSONAS_DIR)
      .filter((f) => f.endsWith('.md') && f !== 'README.md')
      .map((f) => f.replace(/\.md$/, ''))
  );
}

/** Parse loop.yaml just enough to grab the personas: block. */
function readPersonasBlock(yamlText) {
  const m = yamlText.match(/^personas:\s*\n((?:\s+.+\n?)+)/m);
  if (!m) return null;
  const block = m[1];
  const out = {};
  // Each line: "  phase: name" or "  phase: [a, b]" or "  phase: true" (flag)
  for (const line of block.split('\n')) {
    if (!line.trim()) continue;
    const kv = line.match(/^\s+([a-zA-Z_][a-z0-9_-]*):\s*(.+?)\s*$/);
    if (!kv) continue;
    const [, key, raw] = kv;
    if (raw === 'true' || raw === 'false') {
      out[key] = raw;
      continue;
    }
    if (raw.startsWith('[') && raw.endsWith(']')) {
      out[key] = raw
        .slice(1, -1)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    } else {
      out[key] = raw.replace(/^['"]|['"]$/g, '');
    }
  }
  return out;
}

/** Extract every persona name that appears in a loop.md. */
function findPersonaReferencesInMd(loopMd) {
  // Backticked names: `persona-name`. Skip dispatcher table rows, etc.
  // We only count names that look like persona filenames (lowercase, hyphenated).
  const backticked = [...loopMd.matchAll(/`([a-z][a-z0-9-]*)`/g)].map((m) => m[1]);
  // Read LOOPS_ROOT/personas/<name>.md references
  const readRefs = [
    ...loopMd.matchAll(/personas\/([a-z][a-z0-9-]*)\.md/g),
  ].map((m) => m[1]);
  return new Set([...backticked, ...readRefs]);
}

describe('persona coverage', () => {
  const personaFiles = listPersonaFiles();

  it('persona files exist for the 9 documented personas', () => {
    const expected = [
      'skeptic',
      'security-auditor',
      'simplicity-advocate',
      'perf-critic',
      'regression-hunter',
      'edge-case-analyst',
      'a11y-advocate',
      'api-contract-guardian',
      'dx-critic',
    ];
    for (const p of expected) {
      assert.ok(personaFiles.has(p), `missing personas/${p}.md`);
    }
  });

  it('every loop that should use personas declares them in loop.yaml', () => {
    for (const name of LOOPS_WITH_PERSONAS) {
      const dir = path.join(REPO, 'loops', name);
      if (!fs.existsSync(dir)) continue; // dispatcher lives elsewhere
      const yaml = fs.readFileSync(path.join(dir, 'loop.yaml'), 'utf8');
      const personas = readPersonasBlock(yaml);
      assert.ok(
        personas !== null,
        `${name}/loop.yaml is missing a personas: block (expected; this loop should use personas)`
      );
    }
  });

  it('loops that should NOT use personas do not declare any', () => {
    for (const name of LOOPS_WITHOUT_PERSONAS) {
      // dispatcher lives at dispatcher/ not loops/
      const candidatePaths = [
        path.join(REPO, 'dispatcher', 'loop.yaml'),
        path.join(REPO, 'loops', name, 'loop.yaml'),
      ];
      for (const p of candidatePaths) {
        if (!fs.existsSync(p)) continue;
        const yaml = fs.readFileSync(p, 'utf8');
        assert.equal(
          readPersonasBlock(yaml),
          null,
          `${path.basename(path.dirname(p))}/loop.yaml declares personas but should not (this loop is not a build/review loop)`
        );
      }
    }
  });

  it('every persona name in every loop.yaml exists as personas/<name>.md', () => {
    const allLoopYamls = [
      path.join(REPO, 'dispatcher', 'loop.yaml'),
      ...listLoopDirs()
        .filter(([n]) => n !== 'dispatcher')
        .map(([, dir]) => path.join(dir, 'loop.yaml')),
    ];
    for (const yp of allLoopYamls) {
      const yaml = fs.readFileSync(yp, 'utf8');
      const block = readPersonasBlock(yaml);
      if (!block) continue;
      for (const [phase, value] of Object.entries(block)) {
        if (typeof value === 'string' && value !== 'true' && value !== 'false') {
          assert.ok(
            personaFiles.has(value),
            `${path.basename(path.dirname(yp))}/loop.yaml personas.${phase} = "${value}" but personas/${value}.md does not exist`
          );
        }
        if (Array.isArray(value)) {
          for (const p of value) {
            assert.ok(
              personaFiles.has(p),
              `${path.basename(path.dirname(yp))}/loop.yaml personas.${phase} contains "${p}" but personas/${p}.md does not exist`
            );
          }
        }
      }
    }
  });

  it('every persona named in loop.yaml is also reflected in loop.md', () => {
    // For each loop with personas, every non-flag persona name in yaml must
    // appear in loop.md (either backticked or in a personas/ path).
    const loopsWithYamls = listLoopDirs();
    for (const [name, dir] of loopsWithYamls) {
      const yamlText = fs.readFileSync(path.join(dir, 'loop.yaml'), 'utf8');
      const block = readPersonasBlock(yamlText);
      if (!block) continue;
      const md = fs.readFileSync(path.join(dir, 'loop.md'), 'utf8');
      const mdRefs = findPersonaReferencesInMd(md);
      for (const [phase, value] of Object.entries(block)) {
        const names = Array.isArray(value)
          ? value
          : typeof value === 'string' && value !== 'true' && value !== 'false'
          ? [value]
          : [];
        for (const p of names) {
          assert.ok(
            mdRefs.has(p),
            `${name}: persona "${p}" declared in loop.yaml personas.${phase} but not mentioned in loop.md (add it to the Personas table or a per-phase Read line)`
          );
        }
      }
    }
  });

  it('every persona in a loop.md Personas table is declared in loop.yaml', () => {
    // If loop.md has a ## Personas section with a markdown table, the
    // personas in the table rows should also appear in loop.yaml. Surrounding
    // prose (optional lists, "you may also...") is not a binding contract.
    for (const [name, dir] of listLoopDirs()) {
      const md = fs.readFileSync(path.join(dir, 'loop.md'), 'utf8');
      // Find the Personas section, then extract just the first table block
      // within it (markdown tables: lines starting with | ).
      const personasSection = md.match(/## Personas[\s\S]*?(?=\n## |\n# |$)/);
      if (!personasSection) continue;
      const tableLines = personasSection[0]
        .split('\n')
        .filter((l) => /^\s*\|/.test(l));
      if (tableLines.length < 2) continue;
      // Pull all backticked names from table rows (skip the header + separator)
      const tableMatches = [
        ...tableLines.join('\n').matchAll(/`([a-z][a-z0-9-]*)`/g),
      ].map((m) => m[1]);
      if (tableMatches.length === 0) continue;
      const yamlText = fs.readFileSync(path.join(dir, 'loop.yaml'), 'utf8');
      const block = readPersonasBlock(yamlText);
      const declared = new Set();
      if (block) {
        for (const v of Object.values(block)) {
          if (Array.isArray(v)) v.forEach((p) => declared.add(p));
          else if (typeof v === 'string' && v !== 'true' && v !== 'false')
            declared.add(v);
        }
      }
      for (const p of new Set(tableMatches)) {
        assert.ok(
          declared.has(p),
          `${name}: loop.md Personas table mentions \`${p}\` but loop.yaml personas: block does not declare it`
        );
      }
    }
  });

  it('personas that appear in loop.md Read LOOPS_ROOT/personas/... lines exist as files', () => {
    for (const [name, dir] of listLoopDirs()) {
      const md = fs.readFileSync(path.join(dir, 'loop.md'), 'utf8');
      const refs = [
        ...md.matchAll(/personas\/([a-z][a-z0-9-]*)\.md/g),
      ].map((m) => m[1]);
      for (const p of new Set(refs)) {
        assert.ok(
          personaFiles.has(p),
          `${name}: loop.md reads personas/${p}.md but no such file exists`
        );
      }
    }
  });
});
