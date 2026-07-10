'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');

const REPO = path.resolve(__dirname, '..');
const EMIT = path.join(REPO, 'adapters', 'emit.js');
const INSTALL = path.join(REPO, 'adapters', 'install-global.js');
const PREFIX = 'loops-';
const VALID_MC = new Set(['high-reasoning', 'workhorse', 'cheap-fast']);

function listLoops() {
  const dirs = [['dispatcher', path.join(REPO, 'dispatcher')]];
  for (const n of fs.readdirSync(path.join(REPO, 'loops')).sort()) {
    const d = path.join(REPO, 'loops', n);
    if (fs.statSync(d).isDirectory()) dirs.push([n, d]);
  }
  return dirs;
}

function yamlField(text, field) {
  const m = text.match(new RegExp(`^${field}:\\s*(.+)$`, 'm'));
  return m ? m[1].trim().replace(/^['"]|['"]$/g, '') : null;
}

describe('catalog integrity', () => {
  it('every loop has loop.md + loop.yaml with matching name', () => {
    for (const [name, dir] of listLoops()) {
      assert.ok(fs.existsSync(path.join(dir, 'loop.md')), `${name} missing loop.md`);
      const yaml = fs.readFileSync(path.join(dir, 'loop.yaml'), 'utf8');
      assert.equal(yamlField(yaml, 'name'), name);
      assert.ok(yamlField(yaml, 'version'), `${name} missing version`);
    }
  });

  it('model_class values are valid', () => {
    for (const [name, dir] of listLoops()) {
      const yaml = fs.readFileSync(path.join(dir, 'loop.yaml'), 'utf8');
      const matches = yaml.match(/^\s*model_class:\s*(.+)$/gm) || [];
      assert.ok(matches.length > 0, `${name} has no model_class`);
      for (const line of matches) {
        const mc = line.replace(/^\s*model_class:\s*/, '').trim();
        assert.ok(VALID_MC.has(mc), `${name}: bad model_class ${mc}`);
      }
    }
  });

  it('persona files exist for sar and adversarial-gate catalogs', () => {
    const needed = [
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
    for (const p of needed) {
      assert.ok(
        fs.existsSync(path.join(REPO, 'personas', `${p}.md`)),
        `missing personas/${p}.md`
      );
    }
  });

  it('sar and adversarial-gate instruct Reading persona files', () => {
    const sar = fs.readFileSync(path.join(REPO, 'loops', 'sar', 'loop.md'), 'utf8');
    const gate = fs.readFileSync(
      path.join(REPO, 'loops', 'adversarial-gate', 'loop.md'),
      'utf8'
    );
    assert.match(sar, /Read.*personas\/skeptic\.md/i);
    assert.match(sar, /LOOPS_ROOT\/personas/);
    assert.match(gate, /Read.*personas\/<persona>\.md/i);
    assert.match(gate, /LOOPS_ROOT\/personas/);
  });

  it('dispatcher uses LOOPS_ROOT paths', () => {
    const md = fs.readFileSync(path.join(REPO, 'dispatcher', 'loop.md'), 'utf8');
    assert.match(md, /LOOPS_ROOT\/loops\/<name>\/loop\.md/);
  });
});

describe('emit.js', () => {
  it('--help exits 0', () => {
    const r = spawnSync(process.execPath, [EMIT, '--help'], { encoding: 'utf8' });
    assert.equal(r.status, 0);
    assert.match(r.stdout, /Usage:/);
  });

  it('emits prefixed rules and skills with full descriptions', () => {
    const r = spawnSync(process.execPath, [EMIT], {
      cwd: REPO,
      encoding: 'utf8',
    });
    assert.equal(r.status, 0, r.stderr);

    const sarSkill = fs.readFileSync(
      path.join(REPO, '.claude', 'skills', `${PREFIX}sar`, 'SKILL.md'),
      'utf8'
    );
    assert.match(sarSkill, /^name:\s*loops-sar/m);
    // Full joined description (not truncated mid-sentence at first line only)
    assert.match(
      sarSkill,
      /description: Spec → Attack → Repair\. Produce candidate solutions, attack them against a written spec/
    );
    assert.doesNotMatch(sarSkill, /globs:\n/);

    const rule = fs.readFileSync(
      path.join(REPO, '.cursor', 'rules', `${PREFIX}sar.mdc`),
      'utf8'
    );
    assert.match(rule, /alwaysApply: false/);
    assert.doesNotMatch(rule, /^globs:\s*$/m);

    // Legacy unprefixed should be gone
    assert.equal(fs.existsSync(path.join(REPO, '.cursor', 'rules', 'sar.mdc')), false);
    assert.equal(fs.existsSync(path.join(REPO, '.claude', 'skills', 'sar')), false);
  });

  it('--check passes after emit', () => {
    const r = spawnSync(process.execPath, [EMIT, '--check'], {
      cwd: REPO,
      encoding: 'utf8',
    });
    assert.equal(r.status, 0, r.stderr + r.stdout);
    assert.match(r.stdout, /OK/);
  });

  it('emits into parent when repo is named .loops', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'loops-nested-'));
    const nested = path.join(tmp, '.loops');
    try {
      // Minimal nested clone: copy adapters + one loop + dispatcher
      fs.cpSync(path.join(REPO, 'adapters'), path.join(nested, 'adapters'), {
        recursive: true,
      });
      fs.cpSync(path.join(REPO, 'dispatcher'), path.join(nested, 'dispatcher'), {
        recursive: true,
      });
      fs.mkdirSync(path.join(nested, 'loops'), { recursive: true });
      fs.cpSync(path.join(REPO, 'loops', 'tdd'), path.join(nested, 'loops', 'tdd'), {
        recursive: true,
      });

      const r = spawnSync(process.execPath, [path.join(nested, 'adapters', 'emit.js'), 'tdd'], {
        encoding: 'utf8',
      });
      assert.equal(r.status, 0, r.stderr + r.stdout);
      assert.ok(
        fs.existsSync(path.join(tmp, '.cursor', 'rules', `${PREFIX}tdd.mdc`)),
        'should emit rule to project root'
      );
      assert.ok(
        fs.existsSync(path.join(tmp, '.claude', 'skills', `${PREFIX}tdd`, 'SKILL.md')),
        'should emit skill to project root'
      );
      assert.equal(
        fs.existsSync(path.join(nested, '.cursor', 'rules', `${PREFIX}tdd.mdc`)),
        false,
        'should not emit only inside .loops'
      );
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });
});

describe('install-global.js', () => {
  it('--help exits 0', () => {
    const r = spawnSync(process.execPath, [INSTALL, '--help'], { encoding: 'utf8' });
    assert.equal(r.status, 0);
    assert.match(r.stdout, /Usage:/);
  });

  it('--dry-run --no-emit does not throw', () => {
    const r = spawnSync(process.execPath, [INSTALL, '--dry-run', '--no-emit'], {
      cwd: REPO,
      encoding: 'utf8',
    });
    assert.equal(r.status, 0, r.stderr + r.stdout);
    assert.match(r.stdout, /dry-run/);
  });
});

describe('docs', () => {
  it('INSTALL files point at MODEL_CLASSES.md without duplicating the full table', () => {
    const global = fs.readFileSync(path.join(REPO, 'INSTALL-GLOBAL.mdc'), 'utf8');
    const local = fs.readFileSync(path.join(REPO, 'INSTALL.mdc'), 'utf8');
    assert.match(global, /MODEL_CLASSES\.md/);
    assert.match(local, /MODEL_CLASSES\.md/);
    // No full preference table (those live only in MODEL_CLASSES.md)
    assert.doesNotMatch(global, /claude-opus-4-8-thinking-high.*composer-2\.5/);
    assert.doesNotMatch(local, /claude-opus-4-8-thinking-high.*composer-2\.5/);
  });

  it('INSTALL-CLAUDE.md exists for per-project Claude awareness', () => {
    assert.ok(fs.existsSync(path.join(REPO, 'INSTALL-CLAUDE.md')));
  });
});
