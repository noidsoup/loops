'use strict';

/** Contract tests for public model-stack docs (defaults, local.example, INSTALL/README). */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const { REPO, listLoopDirs } = require('../adapters/emit.js');

const DEFAULTS = path.join(REPO, 'adapters', 'MODEL_CLASSES.md');
const EXAMPLE = path.join(REPO, 'adapters', 'MODEL_CLASSES.local.example.md');
const README = path.join(REPO, 'README.md');
const GITIGNORE = path.join(REPO, '.gitignore');

const CATALOG_LOOPS = listLoopDirs()
  .map(([n]) => n)
  .filter((n) => n !== 'dispatcher');

// CHANGELOG may name scrubbed stacks when recording history — keep it out of this list.
const SHARED_SCRUB = [
  'adapters/MODEL_CLASSES.md',
  'README.md',
  'INSTALL-GLOBAL.mdc',
  'INSTALL.mdc',
  'INSTALL-CLAUDE.md',
  'INSTALL-RESOLUTION.mdc',
];

const INSTALL_WITH_OVERRIDE = [
  'INSTALL-GLOBAL.mdc',
  'INSTALL.mdc',
  'INSTALL-CLAUDE.md',
];

function read(relOrAbs) {
  const p = path.isAbsolute(relOrAbs) ? relOrAbs : path.join(REPO, relOrAbs);
  return fs.readFileSync(p, 'utf8');
}

describe('MODEL_CLASSES resolution contract', () => {
  it('portable defaults and recommended example exist; local.md is optional', () => {
    assert.ok(fs.existsSync(DEFAULTS), 'adapters/MODEL_CLASSES.md missing');
    assert.ok(fs.existsSync(EXAMPLE), 'adapters/MODEL_CLASSES.local.example.md missing');
  });

  it('.gitignore ignores MODEL_CLASSES.local.md but not the example or defaults', () => {
    const gi = read(GITIGNORE);
    assert.match(gi, /^\s*adapters\/MODEL_CLASSES\.local\.md\s*$/m);

    const ignored = spawnSync('git', ['check-ignore', '-v', 'adapters/MODEL_CLASSES.local.md'], {
      cwd: REPO,
      encoding: 'utf8',
    });
    assert.equal(ignored.status, 0, 'local.md should match a gitignore rule');
    assert.match(ignored.stdout, /MODEL_CLASSES\.local\.md/);

    const exampleIgnored = spawnSync(
      'git',
      ['check-ignore', '-v', 'adapters/MODEL_CLASSES.local.example.md'],
      { cwd: REPO, encoding: 'utf8' }
    );
    assert.notEqual(exampleIgnored.status, 0, 'example must stay tracked');

    const defaultsIgnored = spawnSync(
      'git',
      ['check-ignore', '-v', 'adapters/MODEL_CLASSES.md'],
      { cwd: REPO, encoding: 'utf8' }
    );
    assert.notEqual(defaultsIgnored.status, 0, 'portable defaults must stay tracked');

    const tracked = spawnSync(
      'git',
      ['ls-files', 'adapters/MODEL_CLASSES.md', 'adapters/MODEL_CLASSES.local.example.md'],
      { cwd: REPO, encoding: 'utf8' }
    );
    assert.match(tracked.stdout, /MODEL_CLASSES\.md/);
    assert.match(tracked.stdout, /MODEL_CLASSES\.local\.example\.md/);
  });

  it('defaults document local override winning over this file', () => {
    const text = read(DEFAULTS);
    assert.match(text, /MODEL_CLASSES\.local\.md/);
    assert.match(text, /overrides|wins|prefer/i);
    assert.match(text, /MODEL_CLASSES\.local\.example\.md/);
    assert.match(text, /portable default/i);
    assert.match(text, /Class → model table \(Cursor\)/);
    assert.match(text, /`high-reasoning`\s*\|\s*`Auto`/);
    assert.match(text, /`workhorse`\s*\|\s*`Auto`/);
    assert.match(text, /`cheap-fast`\s*\|\s*`Auto`/);
    assert.match(text, /Claude Code \(advisory\)/);
  });
});

describe('recommended MODEL_CLASSES.local.example.md', () => {
  const ex = () => read(EXAMPLE);

  it('is framed as a copy-to-local recommended recipe', () => {
    const text = ex();
    assert.match(text, /recommended local override/i);
    assert.match(text, /cp adapters\/MODEL_CLASSES\.local\.example\.md adapters\/MODEL_CLASSES\.local\.md/);
    assert.match(text, /must prefer|prefer.*over `MODEL_CLASSES\.md`/i);
    assert.match(text, /gitignored/i);
  });

  it('has Cursor and Claude Code tables with expected model names', () => {
    const text = ex();
    assert.match(text, /Class → model \(Cursor\)/);
    assert.match(text, /Class → model \(Claude Code\)/);

    assert.match(text, /Claude Opus 4\.8/);
    assert.match(text, /`high-reasoning`[\s\S]*?Claude Opus 4\.8[\s\S]*?`workhorse`[\s\S]*?\*\*Auto\*\*/);
    assert.match(text, /`cheap-fast`\s*\|\s*\*\*Auto\*\*/);

    assert.match(text, /`high-reasoning`\s*\|\s*\*\*Claude Opus 4\.8\*\*/);
    assert.match(text, /`workhorse`\s*\|\s*\*\*Claude Sonnet 5\*\*/);
    assert.match(text, /`cheap-fast`\s*\|\s*\*\*Claude Haiku 4\.5\*\*/);
  });

  it('bans Fable in the recipe but does not name Hermes or Nous', () => {
    const text = ex();
    assert.match(text, /\bFable\b/);
    assert.match(text, /claude-fable/);
    assert.doesNotMatch(text, /\bHermes\b/);
    assert.doesNotMatch(text, /\bNous\b/);
  });
});

describe('shared docs stay scrubbed of Hermes / Nous / Fable', () => {
  it('portable defaults and public install/README copy stay free of those names', () => {
    for (const rel of SHARED_SCRUB) {
      const text = read(rel);
      assert.doesNotMatch(text, /\bFable\b/, rel);
      assert.doesNotMatch(text, /\bHermes\b/, rel);
      assert.doesNotMatch(text, /\bNous\b/, rel);
    }
  });

  it('catalog loop.md and dispatcher stay free of Hermes / Nous / Fable', () => {
    const paths = [
      path.join(REPO, 'dispatcher', 'loop.md'),
      ...CATALOG_LOOPS.map((n) => path.join(REPO, 'loops', n, 'loop.md')),
    ];
    for (const p of paths) {
      const text = read(p);
      const rel = path.relative(REPO, p);
      assert.doesNotMatch(text, /\bFable\b/, rel);
      assert.doesNotMatch(text, /\bHermes\b/, rel);
      assert.doesNotMatch(text, /\bNous\b/, rel);
    }
  });
});

describe('loop.md model selection blurbs', () => {
  it('every catalog loop says local override wins', () => {
    for (const name of CATALOG_LOOPS) {
      const md = read(path.join(REPO, 'loops', name, 'loop.md'));
      assert.match(md, /## Model selection/, `${name}: missing Model selection`);
      assert.match(md, /MODEL_CLASSES\.md/, `${name}: missing MODEL_CLASSES.md`);
      assert.match(md, /MODEL_CLASSES\.local\.md/, `${name}: missing local.md`);
      assert.match(md, /that file wins/i, `${name}: missing "that file wins"`);
    }
  });

  it('dispatcher points at MODEL_CLASSES with local override winning', () => {
    const md = read(path.join(REPO, 'dispatcher', 'loop.md'));
    assert.match(md, /MODEL_CLASSES\.md/);
    assert.match(md, /local override wins/i);
  });
});

describe('INSTALL files point at local override', () => {
  it('install awareness files mention MODEL_CLASSES.md and local.md', () => {
    for (const rel of INSTALL_WITH_OVERRIDE) {
      const text = read(rel);
      assert.match(text, /MODEL_CLASSES\.md/, rel);
      assert.match(
        text,
        /MODEL_CLASSES\.local\.md|local override wins/i,
        `${rel}: missing local override pointer`
      );
    }
  });
});

describe('README model-stack + catalog discoverability', () => {
  it('covers install, “use the loops”, model copy step, and all catalog loops', () => {
    const text = read(README);

    assert.match(text, /install-global\.js/i);
    assert.match(text, /use the loops/i);
    assert.match(
      text,
      /cp adapters\/MODEL_CLASSES\.local\.example\.md adapters\/MODEL_CLASSES\.local\.md/
    );
    assert.match(text, /MODEL_CLASSES\.local\.example\.md/);
    assert.match(text, /MODEL_CLASSES\.md/);

    for (const name of CATALOG_LOOPS) {
      assert.match(text, new RegExp('`' + name + '`'), `README missing catalog loop ${name}`);
    }
  });

  it('stays plain-English (no Hermes / Nous / Fable)', () => {
    const text = read(README);
    assert.doesNotMatch(text, /\bHermes\b/);
    assert.doesNotMatch(text, /\bNous\b/);
    assert.doesNotMatch(text, /\bFable\b/);
  });
});
