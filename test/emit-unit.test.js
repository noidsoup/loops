'use strict';

/**
 * Unit tests for adapters/emit.js pure functions.
 * Integration tests for the CLI live in test/emit.test.js.
 */

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const os = require('os');

const {
  REPO,
  PREFIX,
  VALID_MODEL_CLASSES,
  resolveOutRoot,
  listLoopDirs,
  readLoopYaml,
  extractDescription,
  yamlField,
  validateLoop,
  buildCursorContent,
  buildClaudeSkillMd,
  pathExists,
  removeLegacyUnprefixed,
  emitOne,
  emitAll,
  checkMode,
} = require('../adapters/emit.js');

describe('emit.js: yaml helpers', () => {
  describe('yamlField', () => {
    it('extracts a top-level scalar field', () => {
      const text = 'name: foo\nversion: 0.1.0\ndescription: hello\n';
      assert.equal(yamlField(text, 'name'), 'foo');
      assert.equal(yamlField(text, 'version'), '0.1.0');
      assert.equal(yamlField(text, 'description'), 'hello');
    });

    it('strips surrounding quotes', () => {
      const text = `name: "foo-bar"\nversion: '1.2.3'\n`;
      assert.equal(yamlField(text, 'name'), 'foo-bar');
      assert.equal(yamlField(text, 'version'), '1.2.3');
    });

    it('returns null for missing fields', () => {
      assert.equal(yamlField('name: foo\n', 'version'), null);
    });

    it('does not match indented (sub-field) lines', () => {
      const text = 'name: foo\n  version: nested\nversion: 0.1.0\n';
      assert.equal(yamlField(text, 'version'), '0.1.0');
    });
  });

  describe('extractDescription', () => {
    it('returns null for empty input', () => {
      assert.equal(extractDescription(null), null);
      assert.equal(extractDescription(''), null);
    });

    it('joins block-scalar description lines into a single line', () => {
      const text =
        'name: sar\ndescription: |\n' +
        '  Spec → Attack → Repair. Produce candidate solutions,\n' +
        '  attack them against a written spec, and judge the\n' +
        '  simplest correct winner.\n' +
        'version: 0.1.0\n';
      const desc = extractDescription(text);
      assert.match(desc, /^Spec → Attack → Repair\./);
      assert.doesNotMatch(desc, /\n/);
      assert.match(desc, /winner\./);
    });

    it('truncates descriptions longer than 280 chars with ellipsis', () => {
      const longLine = 'x'.repeat(400);
      const text = `name: x\ndescription: |\n  ${longLine}\nversion: 0.1.0\n`;
      const desc = extractDescription(text);
      assert.ok(desc.length <= 280, `desc length ${desc.length}`);
      assert.match(desc, /\.\.\.$/);
    });

    it('handles single-line descriptions', () => {
      const text = 'name: x\ndescription: short\nversion: 0.1.0\n';
      assert.equal(extractDescription(text), 'short');
    });

    it('collapses internal whitespace in block-scalar', () => {
      const text =
        'name: x\ndescription: |\n' +
        '  Line one with    extra spaces.\n' +
        '  Line two.\n' +
        'version: 0.1.0\n';
      const desc = extractDescription(text);
      assert.doesNotMatch(desc, /  +/);
      assert.match(desc, /Line one with extra spaces\.\s+Line two\./);
    });
  });
});

describe('emit.js: validateLoop', () => {
  const validSar = `name: sar
version: 0.1.1
description: |
  Test description.
phases:
  - name: spec
    model_class: high-reasoning
    goal: Spec it.
    exit_condition: Done.
  - name: attack
    model_class: workhorse
    goal: Attack it.
    exit_condition: Done.
`;
  const validDispatcher = `name: dispatcher
version: 0.1.1
description: |
  Test dispatcher.
model_class: workhorse
`;

  it('passes for a valid loop', () => {
    assert.deepEqual(validateLoop('sar', path.join(REPO, 'loops', 'sar'), validSar), []);
  });

  it('passes for the dispatcher', () => {
    assert.deepEqual(
      validateLoop('dispatcher', path.join(REPO, 'dispatcher'), validDispatcher),
      []
    );
  });

  it('errors when loop.yaml is missing', () => {
    const errors = validateLoop('foo', '/nonexistent', null);
    assert.equal(errors.length, 1);
    assert.match(errors[0], /missing loop\.yaml/);
  });

  it('errors when yaml name does not match directory', () => {
    const bad = validSar.replace('name: sar', 'name: sarr');
    const errors = validateLoop('sar', path.join(REPO, 'loops', 'sar'), bad);
    assert.equal(errors.length, 1);
    assert.match(errors[0], /loop\.yaml name .* !== directory/);
  });

  it('errors when version is missing', () => {
    const bad = 'name: sar\ndescription: |\n  x\nphases:\n  - name: a\n    model_class: workhorse\n    goal: a\n    exit_condition: a\n';
    const errors = validateLoop('sar', path.join(REPO, 'loops', 'sar'), bad);
    assert.ok(errors.some((e) => /missing version/.test(e)), errors.join(', '));
  });

  it('errors when a regular loop has no phases[]', () => {
    const bad = 'name: sar\nversion: 0.1.0\ndescription: |\n  x\n';
    const errors = validateLoop('sar', path.join(REPO, 'loops', 'sar'), bad);
    assert.ok(errors.some((e) => /no phases/.test(e)), errors.join(', '));
  });

  it('errors on an invalid model_class on a phase', () => {
    const bad = validSar.replace('model_class: workhorse', 'model_class: fable');
    const errors = validateLoop('sar', path.join(REPO, 'loops', 'sar'), bad);
    assert.ok(errors.some((e) => /invalid model_class/.test(e)), errors.join(', '));
  });

  it('dispatcher allows model_class to be omitted', () => {
    const text = validDispatcher.replace(/model_class:.*\n/, '');
    assert.deepEqual(
      validateLoop('dispatcher', path.join(REPO, 'dispatcher'), text),
      []
    );
  });

  it('dispatcher errors on invalid model_class if present', () => {
    const bad = validDispatcher.replace('model_class: workhorse', 'model_class: fable');
    const errors = validateLoop('dispatcher', path.join(REPO, 'dispatcher'), bad);
    assert.ok(errors.some((e) => /invalid model_class/.test(e)), errors.join(', '));
  });

  it('VALID_MODEL_CLASSES contains exactly the three classes', () => {
    assert.deepEqual(
      [...VALID_MODEL_CLASSES].sort(),
      ['cheap-fast', 'high-reasoning', 'workhorse']
    );
  });
});

describe('emit.js: catalog discovery', () => {
  it('listLoopDirs always includes the dispatcher first', () => {
    const dirs = listLoopDirs();
    assert.equal(dirs[0][0], 'dispatcher');
    assert.equal(dirs[0][1], path.join(REPO, 'dispatcher'));
  });

  it('listLoopDirs returns sorted loop names', () => {
    const dirs = listLoopDirs();
    const names = dirs.slice(1).map(([n]) => n);
    const sorted = [...names].sort();
    assert.deepEqual(names, sorted);
  });

  it('listLoopDirs includes all 9 catalog loops', () => {
    const dirs = listLoopDirs();
    const names = new Set(dirs.map(([n]) => n));
    for (const expected of [
      'plan-and-implement',
      'tdd',
      'sar',
      'adversarial-gate',
      'reproduce-and-fix',
      'migrate',
      'explain-codebase',
      'swarm',
      'use-the-loop',
    ]) {
      assert.ok(names.has(expected), `missing loop: ${expected}`);
    }
  });

  it('readLoopYaml returns null for missing files', () => {
    assert.equal(readLoopYaml('/nonexistent'), null);
  });
});

describe('emit.js: resolveOutRoot', () => {
  it('returns REPO when not nested as .loops', () => {
    assert.equal(resolveOutRoot(), REPO);
    assert.notEqual(path.basename(REPO), '.loops');
  });
});

describe('emit.js: content builders', () => {
  describe('buildCursorContent', () => {
    it('wraps loop.md in frontmatter with alwaysApply: false', () => {
      const tmp = path.join(os.tmpdir(), `emit-test-${Date.now()}.md`);
      fs.writeFileSync(tmp, '# Title\nBody line.\n');
      try {
        const out = buildCursorContent('sar', tmp);
        assert.match(out, /^---\n/);
        assert.match(out, /alwaysApply: false/);
        assert.match(out, /description: Auto-generated by loops\/emit\.js/);
        // Title line is stripped
        assert.doesNotMatch(out, /^# Title\n/);
        assert.match(out, /Body line\./);
      } finally {
        fs.rmSync(tmp, { force: true });
      }
    });

    it('does not emit a globs: line', () => {
      const tmp = path.join(os.tmpdir(), `emit-test-glob-${Date.now()}.md`);
      fs.writeFileSync(tmp, '# T\nbody\n');
      try {
        const out = buildCursorContent('x', tmp);
        assert.doesNotMatch(out, /^globs:\s*$/m);
      } finally {
        fs.rmSync(tmp, { force: true });
      }
    });
  });

  describe('buildClaudeSkillMd', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'emit-skill-'));
    const loopMd = path.join(tmp, 'loop.md');
    const loopYaml = path.join(tmp, 'loop.yaml');
    before(() => {
      fs.writeFileSync(loopMd, '# sar\nBody.\n');
      fs.writeFileSync(
        loopYaml,
        'name: sar\nversion: 0.1.0\ndescription: |\n  A test skill.\nphases:\n  - name: a\n    model_class: workhorse\n    goal: a\n    exit_condition: a\n'
      );
    });
    after(() => fs.rmSync(tmp, { recursive: true, force: true }));

    it('produces YAML frontmatter with prefixed name', () => {
      const { skillMd } = buildClaudeSkillMd('sar', tmp);
      assert.match(skillMd, /^name: loops-sar$/m);
      assert.match(skillMd, /^description: A test skill\.$/m);
      assert.match(skillMd, /^---\n/);
      assert.match(skillMd, /Body\./);
    });

    it('returns the raw yaml text alongside', () => {
      const { yaml } = buildClaudeSkillMd('sar', tmp);
      assert.match(yaml, /phases:/);
    });

    it('falls back to a default description when yaml has none', () => {
      const tmp2 = fs.mkdtempSync(path.join(os.tmpdir(), 'emit-skill-noDesc-'));
      fs.writeFileSync(path.join(tmp2, 'loop.md'), '# x\nbody\n');
      try {
        const { skillMd } = buildClaudeSkillMd('mystery', tmp2);
        assert.match(skillMd, /description: Loops loop: mystery/);
      } finally {
        fs.rmSync(tmp2, { recursive: true, force: true });
      }
    });
  });
});

describe('emit.js: pathExists', () => {
  it('returns true for existing paths', () => {
    assert.equal(pathExists(REPO), true);
  });
  it('returns false for non-existent paths', () => {
    assert.equal(pathExists(path.join(REPO, 'definitely-not-here-xyz')), false);
  });
  it('returns true for broken symlinks (uses lstat)', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'emit-lnk-'));
    const linkPath = path.join(tmp, 'broken');
    try {
      fs.symlinkSync('/no/such/target', linkPath);
      assert.equal(pathExists(linkPath), true);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });
});

describe('emit.js: removeLegacyUnprefixed', () => {
  it('removes legacy unprefixed .mdc and skill dir if present', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'emit-legacy-'));
    const rulePath = path.join(tmp, '.cursor', 'rules', 'sar.mdc');
    const skillPath = path.join(tmp, '.claude', 'skills', 'sar');
    fs.mkdirSync(path.dirname(rulePath), { recursive: true });
    fs.mkdirSync(skillPath, { recursive: true });
    fs.writeFileSync(path.join(rulePath), 'legacy');
    fs.writeFileSync(path.join(skillPath, 'SKILL.md'), 'legacy');

    removeLegacyUnprefixed(tmp, 'sar');
    assert.equal(fs.existsSync(rulePath), false);
    assert.equal(fs.existsSync(skillPath), false);
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  it('does not throw when nothing to remove', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'emit-legacy-clean-'));
    try {
      assert.doesNotThrow(() => removeLegacyUnprefixed(tmp, 'nothing-here'));
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });
});

describe('emit.js: emitOne (end-to-end into tmp dir)', () => {
  let tmp;
  before(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'emit-e2e-'));
  });
  after(() => fs.rmSync(tmp, { recursive: true, force: true }));

  it('emits prefixed cursor rule + claude skill + loop.yaml copy', () => {
    const [, sarDir] = listLoopDirs().find(([n]) => n === 'sar');
    const result = emitOne('sar', sarDir, tmp);
    assert.equal(result.skipped, undefined);

    const rulePath = path.join(tmp, '.cursor', 'rules', `${PREFIX}sar.mdc`);
    const skillMdPath = path.join(tmp, '.claude', 'skills', `${PREFIX}sar`, 'SKILL.md');
    const skillYamlPath = path.join(tmp, '.claude', 'skills', `${PREFIX}sar`, 'loop.yaml');

    assert.ok(fs.existsSync(rulePath), 'cursor rule missing');
    assert.ok(fs.existsSync(skillMdPath), 'claude SKILL.md missing');
    assert.ok(fs.existsSync(skillYamlPath), 'claude loop.yaml missing');

    const ruleText = fs.readFileSync(rulePath, 'utf8');
    assert.match(ruleText, /^---/);
    assert.match(ruleText, /alwaysApply: false/);

    const skillText = fs.readFileSync(skillMdPath, 'utf8');
    assert.match(skillText, /^name: loops-sar$/m);
  });

  it('skips loops without loop.md', () => {
    const stubDir = fs.mkdtempSync(path.join(os.tmpdir(), 'emit-stub-'));
    fs.writeFileSync(
      path.join(stubDir, 'loop.yaml'),
      'name: stub\nversion: 0.1.0\ndescription: x\n'
    );
    try {
      const r = emitOne('stub', stubDir, tmp);
      assert.equal(r.skipped, true);
    } finally {
      fs.rmSync(stubDir, { recursive: true, force: true });
    }
  });
});

describe('emit.js: emitAll filters by target', () => {
  let tmp;
  before(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'emit-all-'));
  });
  after(() => fs.rmSync(tmp, { recursive: true, force: true }));

  it('respects the target filter at module level (process.argv)', () => {
    // We can't easily mutate the module-level `target`, so we spawn to a fresh
    // node process with argv override. This is a thin integration test.
    const { spawnSync } = require('node:child_process');
    const r = spawnSync(
      process.execPath,
      [path.join(REPO, 'adapters', 'emit.js'), 'tdd'],
      {
        env: { ...process.env, HOME: tmp },
        cwd: tmp,
        encoding: 'utf8',
      }
    );
    // emit.js uses the original REPO for outRoot if it isn't in a .loops dir,
    // so this writes to the real REPO. We just want to check the filter logic
    // didn't error and only emitted tdd.
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /emit tdd:/);
    assert.doesNotMatch(r.stdout, /emit sar:/);
    assert.doesNotMatch(r.stdout, /emit dispatcher:/);
  });
});

describe('emit.js: checkMode', () => {
  it('passes when repo is in sync (no drift)', () => {
    // Don't change anything; spawn to avoid clobbering global state.
    const { spawnSync } = require('node:child_process');
    const r = spawnSync(
      process.execPath,
      [path.join(REPO, 'adapters', 'emit.js'), '--check'],
      { encoding: 'utf8' }
    );
    assert.equal(r.status, 0, r.stderr + r.stdout);
    assert.match(r.stdout, /OK/);
  });
});
