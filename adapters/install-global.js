#!/usr/bin/env node
/**
 * Install loops globally for Cursor on this machine.
 *
 * Usage:
 *   node adapters/install-global.js           # emit + install
 *   node adapters/install-global.js --no-emit # install only (assume emit done)
 *   node adapters/install-global.js --uninstall
 *   node adapters/install-global.js --copy    # copy instead of symlink
 *
 * What it does:
 *   1. Runs adapters/emit.js (unless --no-emit)
 *   2. Symlinks ~/.loops → this repo
 *   3. Writes ~/.cursor/rules/loops.mdc (alwaysApply awareness, absolute paths)
 *   4. Symlinks emitted rules → ~/.cursor/rules/loops-<name>.mdc
 *   5. Symlinks emitted skills → ~/.cursor/skills/loops-<name>/
 *
 * Collision policy: never overwrite an existing path unless it is already a
 * loops-managed symlink (or a previous install of loops.mdc). Skill/rule
 * names are always prefixed with `loops-`.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');

const REPO = path.resolve(__dirname, '..');
const HOME = os.homedir();
const LOOPS_LINK = path.join(HOME, '.loops');
const CURSOR_RULES = path.join(HOME, '.cursor', 'rules');
const CURSOR_SKILLS = path.join(HOME, '.cursor', 'skills');
const AWARENESS_NAME = 'loops.mdc';
const PREFIX = 'loops-';

const args = new Set(process.argv.slice(2));
const UNINSTALL = args.has('--uninstall');
const NO_EMIT = args.has('--no-emit');
const USE_COPY = args.has('--copy');

function die(msg) {
  console.error(`error: ${msg}`);
  process.exit(1);
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function isSymlink(p) {
  try {
    return fs.lstatSync(p).isSymbolicLink();
  } catch {
    return false;
  }
}

function readLinkSafe(p) {
  try {
    return fs.readlinkSync(p);
  } catch {
    return null;
  }
}

function resolveMaybe(p) {
  try {
    return fs.realpathSync(p);
  } catch {
    return path.resolve(p);
  }
}

/** True if path is ours to replace (missing, or symlink we manage). */
function isManagedTarget(targetPath, expectedDest) {
  if (!fs.existsSync(targetPath) && !isSymlink(targetPath)) return true;
  if (!isSymlink(targetPath)) return false;
  const current = readLinkSafe(targetPath);
  if (!current) return false;
  const resolvedCurrent = resolveMaybe(
    path.isAbsolute(current) ? current : path.resolve(path.dirname(targetPath), current)
  );
  const resolvedExpected = resolveMaybe(expectedDest);
  return resolvedCurrent === resolvedExpected;
}

function linkOrCopy(src, dest, { forceManaged = false } = {}) {
  ensureDir(path.dirname(dest));
  const mode = USE_COPY ? 'copy' : 'symlink';

  if (fs.existsSync(dest) || isSymlink(dest)) {
    if (forceManaged || isManagedTarget(dest, src)) {
      fs.rmSync(dest, { recursive: true, force: true });
    } else {
      return { status: 'skipped-collision', dest, src, mode };
    }
  }

  if (USE_COPY) {
    const st = fs.statSync(src);
    if (st.isDirectory()) {
      fs.cpSync(src, dest, { recursive: true });
    } else {
      fs.copyFileSync(src, dest);
    }
  } else {
    fs.symlinkSync(src, dest);
  }
  return { status: 'ok', dest, src, mode };
}

function runEmit() {
  console.log('emit: running adapters/emit.js …');
  const r = spawnSync(process.execPath, [path.join(REPO, 'adapters', 'emit.js')], {
    cwd: REPO,
    stdio: 'inherit',
  });
  if (r.status !== 0) die(`emit failed with exit ${r.status}`);
}

function installLoopsSymlink() {
  ensureDir(path.dirname(LOOPS_LINK));
  if (isSymlink(LOOPS_LINK) || fs.existsSync(LOOPS_LINK)) {
    if (isManagedTarget(LOOPS_LINK, REPO) || (isSymlink(LOOPS_LINK) && resolveMaybe(LOOPS_LINK) === resolveMaybe(REPO))) {
      fs.rmSync(LOOPS_LINK, { force: true });
    } else if (fs.existsSync(LOOPS_LINK) && !isSymlink(LOOPS_LINK)) {
      die(`${LOOPS_LINK} exists and is not a symlink. Remove it or point it at ${REPO} manually.`);
    } else {
      // Different symlink target — replace with ours (global install owns ~/.loops)
      console.warn(`warn: replacing ${LOOPS_LINK} → ${readLinkSafe(LOOPS_LINK)} with ${REPO}`);
      fs.rmSync(LOOPS_LINK, { force: true });
    }
  }
  fs.symlinkSync(REPO, LOOPS_LINK);
  return { status: 'ok', dest: LOOPS_LINK, src: REPO, mode: 'symlink' };
}

function buildAwarenessRule() {
  const templatePath = path.join(REPO, 'INSTALL-GLOBAL.mdc');
  if (!fs.existsSync(templatePath)) die(`missing ${templatePath}`);
  let body = fs.readFileSync(templatePath, 'utf8');
  // Bake absolute paths so agents don't depend on tilde expansion.
  const footer = [
    '',
    '## Installed paths (machine-specific)',
    '',
    `- Absolute loops root: \`${REPO}\``,
    `- Stable symlink: \`${LOOPS_LINK}\` → \`${REPO}\``,
    `- Awareness rule: \`${path.join(CURSOR_RULES, AWARENESS_NAME)}\``,
    `- Prefixed rules: \`${CURSOR_RULES}/${PREFIX}*.mdc\``,
    `- Prefixed skills: \`${CURSOR_SKILLS}/${PREFIX}*/\``,
    '',
    'When reading canonical loop files, prefer the absolute root above if `~/.loops` does not resolve.',
    '',
  ].join('\n');

  // Soft-replace LOOPS_ROOT prose with concrete path hint near the top.
  if (!body.includes('## Installed paths')) {
    body = body.trimEnd() + '\n' + footer;
  }
  return body;
}

function installAwareness() {
  ensureDir(CURSOR_RULES);
  const dest = path.join(CURSOR_RULES, AWARENESS_NAME);
  const content = buildAwarenessRule();
  // Always rewrite awareness rule (it is loops-owned by name).
  if (fs.existsSync(dest) || isSymlink(dest)) {
    const existing = isSymlink(dest) ? null : fs.readFileSync(dest, 'utf8');
    if (existing && !existing.includes('loops is available globally') && !existing.includes('loops is installed')) {
      die(`${dest} exists and does not look like a loops awareness rule. Refusing to overwrite.`);
    }
    fs.rmSync(dest, { force: true });
  }
  fs.writeFileSync(dest, content);
  return { status: 'ok', dest, src: 'INSTALL-GLOBAL.mdc (rendered)', mode: 'write' };
}

function listLoopNames() {
  const names = ['dispatcher'];
  const loopsDir = path.join(REPO, 'loops');
  for (const n of fs.readdirSync(loopsDir)) {
    const d = path.join(loopsDir, n);
    if (fs.statSync(d).isDirectory() && fs.existsSync(path.join(d, 'loop.md'))) {
      names.push(n);
    }
  }
  return names.sort((a, b) => a.localeCompare(b));
}

function installRulesAndSkills() {
  const results = [];
  const names = listLoopNames();

  for (const name of names) {
    const ruleSrc = path.join(REPO, '.cursor', 'rules', `${name}.mdc`);
    const skillSrc = path.join(REPO, '.claude', 'skills', name);
    const ruleDest = path.join(CURSOR_RULES, `${PREFIX}${name}.mdc`);
    const skillDest = path.join(CURSOR_SKILLS, `${PREFIX}${name}`);

    if (!fs.existsSync(ruleSrc)) {
      results.push({ status: 'missing', dest: ruleDest, src: ruleSrc, kind: 'rule' });
    } else {
      results.push({ ...linkOrCopy(ruleSrc, ruleDest), kind: 'rule' });
    }

    if (!fs.existsSync(skillSrc)) {
      results.push({ status: 'missing', dest: skillDest, src: skillSrc, kind: 'skill' });
    } else {
      results.push({ ...linkOrCopy(skillSrc, skillDest), kind: 'skill' });
    }
  }
  return results;
}

function uninstall() {
  const removed = [];
  const skipped = [];

  // ~/.loops only if it points at this repo
  if (isSymlink(LOOPS_LINK) && resolveMaybe(LOOPS_LINK) === resolveMaybe(REPO)) {
    fs.rmSync(LOOPS_LINK, { force: true });
    removed.push(LOOPS_LINK);
  } else if (fs.existsSync(LOOPS_LINK) || isSymlink(LOOPS_LINK)) {
    skipped.push(`${LOOPS_LINK} (not pointing at this repo)`);
  }

  const awareness = path.join(CURSOR_RULES, AWARENESS_NAME);
  if (fs.existsSync(awareness) || isSymlink(awareness)) {
    const text = isSymlink(awareness) ? '' : fs.readFileSync(awareness, 'utf8');
    if (!text || text.includes('loops is available globally') || text.includes('Installed paths (machine-specific)')) {
      fs.rmSync(awareness, { force: true });
      removed.push(awareness);
    } else {
      skipped.push(`${awareness} (not a global loops awareness rule)`);
    }
  }

  // Prefixed rules + skills that we manage
  for (const name of listLoopNames()) {
    const ruleDest = path.join(CURSOR_RULES, `${PREFIX}${name}.mdc`);
    const skillDest = path.join(CURSOR_SKILLS, `${PREFIX}${name}`);
    const ruleSrc = path.join(REPO, '.cursor', 'rules', `${name}.mdc`);
    const skillSrc = path.join(REPO, '.claude', 'skills', name);

    for (const [dest, src] of [
      [ruleDest, ruleSrc],
      [skillDest, skillSrc],
    ]) {
      if (!fs.existsSync(dest) && !isSymlink(dest)) continue;
      if (USE_COPY) {
        // copy mode: remove if path matches our naming
        fs.rmSync(dest, { recursive: true, force: true });
        removed.push(dest);
      } else if (isManagedTarget(dest, src) || isSymlink(dest)) {
        // Remove symlink if it points at our emit output (or any symlink with our prefix name)
        if (isSymlink(dest)) {
          const cur = resolveMaybe(dest);
          const exp = resolveMaybe(src);
          if (cur === exp || path.basename(dest).startsWith(PREFIX)) {
            fs.rmSync(dest, { recursive: true, force: true });
            removed.push(dest);
            continue;
          }
        }
        skipped.push(dest);
      } else {
        skipped.push(dest);
      }
    }
  }

  console.log('uninstall complete.');
  console.log(`  removed (${removed.length}):`);
  for (const p of removed) console.log(`    - ${p}`);
  if (skipped.length) {
    console.log(`  skipped (${skipped.length}):`);
    for (const p of skipped) console.log(`    - ${p}`);
  }
}

function printSummary(extra) {
  console.log('');
  console.log('=== loops global install ===');
  console.log(`repo:     ${REPO}`);
  console.log(`~/.loops: ${LOOPS_LINK} → ${isSymlink(LOOPS_LINK) ? readLinkSafe(LOOPS_LINK) : '(missing)'}`);
  console.log(`mode:     ${USE_COPY ? 'copy' : 'symlink'}`);
  for (const row of extra) {
    const tag = row.status.padEnd(18);
    console.log(`  ${tag} ${row.kind || 'link'}: ${row.dest}`);
  }
  console.log('');
  console.log('Update later:');
  console.log(`  cd ${REPO} && git pull && node adapters/emit.js && node adapters/install-global.js`);
  console.log('Uninstall:');
  console.log(`  node ${path.join(REPO, 'adapters', 'install-global.js')} --uninstall`);
}

function main() {
  if (UNINSTALL) {
    uninstall();
    return;
  }

  if (!NO_EMIT) runEmit();

  const results = [];
  results.push({ ...installLoopsSymlink(), kind: 'root' });
  results.push({ ...installAwareness(), kind: 'awareness' });
  results.push(...installRulesAndSkills());

  const collisions = results.filter((r) => r.status === 'skipped-collision');
  const missing = results.filter((r) => r.status === 'missing');
  if (collisions.length) {
    console.warn(`warn: skipped ${collisions.length} collision(s) (left existing files alone)`);
  }
  if (missing.length) {
    console.warn(`warn: ${missing.length} emit output(s) missing — re-run emit`);
  }

  printSummary(results);

  // Verify listing
  console.log('Verification:');
  console.log(`  awareness: ${fs.existsSync(path.join(CURSOR_RULES, AWARENESS_NAME)) ? 'yes' : 'NO'}`);
  const linkedRules = fs
    .readdirSync(CURSOR_RULES)
    .filter((f) => f.startsWith(PREFIX) && f.endsWith('.mdc'));
  const linkedSkills = fs
    .readdirSync(CURSOR_SKILLS)
    .filter((f) => f.startsWith(PREFIX));
  console.log(`  rules:     ${linkedRules.length} → ${linkedRules.join(', ')}`);
  console.log(`  skills:    ${linkedSkills.length} → ${linkedSkills.join(', ')}`);
  console.log('done.');
}

main();
