'use strict';

/**
 * Self-correcting contract coverage.
 *
 * Invariants (canonical sources only — `dispatcher/` + `loops/*` via
 * `listLoopDirs()`; emitted `.claude/skills` / `.cursor/rules` copies are
 * covered by `emit --check`, not this file):
 *   1. contracts/self-correcting.md exists and names the three roles.
 *   2. Every canonical loop.yaml with self_correcting: true references the
 *      contract path in its loop.md and declares self_correcting_max_revisions.
 *   3. The adoption table in the contract matches yaml flags (spot-check
 *      known adopters / non-adopters).
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const { REPO, listLoopDirs } = require('../adapters/emit.js');

const CONTRACT = path.join(REPO, 'contracts', 'self-correcting.md');

const EXPECTED_ADOPTERS = new Set([
  'plan-and-implement',
  'tdd',
  'reproduce-and-fix',
  'sar',
  'adversarial-gate',
  'de-ai-ify',
  'migrate',
]);

const EXPECTED_NON_ADOPTERS = new Set([
  'explain-codebase',
  'swarm',
  'use-the-loop',
  'dispatcher',
]);

function yamlHasSelfCorrecting(yamlText) {
  return /^self_correcting:\s*true\s*$/m.test(yamlText);
}

function yamlMaxRevisions(yamlText) {
  const m = yamlText.match(/^self_correcting_max_revisions:\s*(\d+)\s*$/m);
  return m ? Number(m[1]) : null;
}

describe('self-correcting contract', () => {
  it('contracts/self-correcting.md exists and defines Builder/Judge/Manager', () => {
    assert.ok(fs.existsSync(CONTRACT), 'missing contracts/self-correcting.md');
    const text = fs.readFileSync(CONTRACT, 'utf8');
    for (const role of ['Builder', 'Judge', 'Manager']) {
      assert.ok(text.includes(role), `contract missing role ${role}`);
    }
    assert.ok(text.includes('max_revisions'), 'contract missing max_revisions');
    assert.ok(text.includes('Verdict:'), 'contract missing Judge verdict template');
  });

  it('every self_correcting: true loop references the contract and max_revisions', () => {
    for (const [name, dir] of listLoopDirs()) {
      const yamlText = fs.readFileSync(path.join(dir, 'loop.yaml'), 'utf8');
      if (!yamlHasSelfCorrecting(yamlText)) continue;
      const md = fs.readFileSync(path.join(dir, 'loop.md'), 'utf8');
      assert.ok(
        md.includes('contracts/self-correcting.md'),
        `${name}: self_correcting true but loop.md does not Read contracts/self-correcting.md`
      );
      const max = yamlMaxRevisions(yamlText);
      assert.ok(
        max !== null && max >= 1,
        `${name}: self_correcting true but missing self_correcting_max_revisions`
      );
    }
  });

  it('known adopters and non-adopters match yaml flags', () => {
    for (const [name, dir] of listLoopDirs()) {
      const yamlText = fs.readFileSync(path.join(dir, 'loop.yaml'), 'utf8');
      const flag = yamlHasSelfCorrecting(yamlText);
      if (EXPECTED_ADOPTERS.has(name)) {
        assert.equal(flag, true, `${name} should adopt self_correcting`);
      }
      if (EXPECTED_NON_ADOPTERS.has(name)) {
        assert.equal(flag, false, `${name} should not set self_correcting: true`);
      }
    }
  });
});
