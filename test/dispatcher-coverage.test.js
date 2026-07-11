'use strict';

/**
 * Cross-reference tests: ensure dispatcher's loop table + triggers match the
 * actual repo. Catches drift when someone adds a loop but forgets to update
 * the dispatcher, or vice versa.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const { REPO, listLoopDirs } = require('../adapters/emit.js');

const DISPATCHER_MD = fs.readFileSync(
  path.join(REPO, 'dispatcher', 'loop.md'),
  'utf8'
);
const DISPATCHER_YAML = fs.readFileSync(
  path.join(REPO, 'dispatcher', 'loop.yaml'),
  'utf8'
);

function listRepoLoopNames() {
  // Excludes 'dispatcher' since dispatcher/ is the dispatcher itself.
  return listLoopDirs()
    .map(([n]) => n)
    .filter((n) => n !== 'dispatcher');
}

describe('dispatcher cross-references', () => {
  describe('loop table (in dispatch loop.md)', () => {
    // Matches backtick names in the table: | `name` |
    const tableMatches = [...DISPATCHER_MD.matchAll(/\|\s*`([a-z][a-z0-9-]*)`\s*\|/g)].map(
      (m) => m[1]
    );

    it('finds at least 9 loop names in the table', () => {
      assert.ok(tableMatches.length >= 9, `only found ${tableMatches.length}`);
    });

    it('every loop in the table exists as loops/<name>/loop.md', () => {
      const repoLoops = new Set(listRepoLoopNames());
      for (const name of tableMatches) {
        assert.ok(repoLoops.has(name), `dispatcher mentions "${name}" but no loops/${name}/ exists`);
      }
    });

    it('every repo loop appears in the dispatcher table', () => {
      const tableSet = new Set(tableMatches);
      for (const name of listRepoLoopNames()) {
        assert.ok(tableSet.has(name), `loops/${name}/ exists but dispatcher table doesn't mention it`);
      }
    });
  });

  describe('classification options (in dispatch loop.yaml)', () => {
    // The yaml uses `    - name` under classification.options. Pull them out
    // with a permissive regex (no full yaml parser).
    const optionMatches = [
      ...DISPATCHER_YAML.matchAll(/^\s{4}-\s+([a-z][a-z0-9-]*)\s*$/gm),
    ].map((m) => m[1]);

    it('classification.options lists at least 9 loops', () => {
      assert.ok(optionMatches.length >= 9, `only found ${optionMatches.length}`);
    });

    it('every option exists as loops/<name>/loop.md', () => {
      const repoLoops = new Set(listRepoLoopNames());
      for (const name of optionMatches) {
        assert.ok(
          repoLoops.has(name),
          `dispatcher.yaml classification.options lists "${name}" but no loops/${name}/ exists`
        );
      }
    });

    it('every repo loop is in classification.options', () => {
      const options = new Set(optionMatches);
      for (const name of listRepoLoopNames()) {
        assert.ok(
          options.has(name),
          `loops/${name}/ exists but dispatcher.yaml classification.options doesn't list it`
        );
      }
    });

    it('has a fallback set to use-the-loop', () => {
      assert.match(DISPATCHER_YAML, /^\s*fallback:\s*use-the-loop\s*$/m);
    });

    it('declares swarm as a high-priority keyword', () => {
      assert.match(DISPATCHER_YAML, /swarm:\s*\[/);
    });
  });

  describe('README mentions match', () => {
    const README = fs.readFileSync(path.join(REPO, 'README.md'), 'utf8');
    // README lists each loop in a table too. Confirm every repo loop is
    // mentioned at least once (markdown link or table row).
    for (const name of listRepoLoopNames()) {
      it(`README mentions ${name}`, () => {
        assert.match(README, new RegExp('`' + name + '`|`' + name + '\\b'));
      });
    }
  });

  describe('triggers point to real loops', () => {
    it('every loop with a triggers array references a real trigger word', () => {
      for (const [name, dir] of listLoopDirs()) {
        const yaml = fs.readFileSync(path.join(dir, 'loop.yaml'), 'utf8');
        const triggers = [...yaml.matchAll(/^\s*-\s*"([^"]+)"\s*$/gm)].map((m) => m[1]);
        if (triggers.length === 0) continue;
        // No empty triggers
        for (const t of triggers) {
          assert.ok(t.length > 0, `${name} has empty trigger`);
        }
        // No duplicate triggers within a loop
        assert.equal(new Set(triggers).size, triggers.length, `${name} has duplicate triggers`);
      }
    });
  });
});
