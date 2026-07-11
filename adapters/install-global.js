#!/usr/bin/env node
/**
 * Install loops globally for Cursor and/or Claude Code on this machine.
 *
 * Usage:
 *   node adapters/install-global.js                # emit + install both
 *   node adapters/install-global.js --cursor-only  # Cursor only
 *   node adapters/install-global.js --claude-only  # Claude Code only
 *   node adapters/install-global.js --no-emit      # install only (assume emit done)
 *   node adapters/install-global.js --dry-run      # print plan, make no changes
 *   node adapters/install-global.js --uninstall
 *   node adapters/install-global.js --uninstall --claude-only
 *   node adapters/install-global.js --copy         # copy instead of symlink
 *   node adapters/install-global.js --help
 *
 * What it does:
 *   1. Runs adapters/emit.js (unless --no-emit)
 *   2. Symlinks ~/.loops → this repo
 *   Cursor:
 *     3. Writes ~/.cursor/rules/loops.mdc (alwaysApply awareness)
 *     4. Symlinks emitted rules → ~/.cursor/rules/loops-<name>.mdc
 *     5. Symlinks emitted skills → ~/.cursor/skills/loops-<name>/
 *   Claude Code:
 *     6. Writes ~/.claude/rules/loops.md (user-level always-on awareness)
 *     7. Installs skills → ~/.claude/skills/loops-<name>/
 *        (SKILL.md already namespaced by emit; marker + supporting files linked)
 *
 * Collision policy: never overwrite an existing path unless it is already a
 * loops-managed install. Skill/rule names are always prefixed with `loops-`.
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
const CLAUDE_RULES = path.join(HOME, '.claude', 'rules');
const CLAUDE_SKILLS = path.join(HOME, '.claude', 'skills');
const CURSOR_AWARENESS = 'loops.mdc';
const CLAUDE_AWARENESS = 'loops.md';
const PREFIX = 'loops-';
const LOOPS_MARKER = '<!-- loops-global-install -->';

const args = new Set(process.argv.slice(2));
const UNINSTALL = args.has('--uninstall');
const NO_EMIT = args.has('--no-emit');
const USE_COPY = args.has('--copy');
const CURSOR_ONLY = args.has('--cursor-only');
const CLAUDE_ONLY = args.has('--claude-only');
const DRY_RUN = args.has('--dry-run');
const HELP = args.has('--help') || args.has('-h');

if (require.main === module && CURSOR_ONLY && CLAUDE_ONLY) {
  die('use only one of --cursor-only / --claude-only');
}

const DO_CURSOR = !CLAUDE_ONLY;
const DO_CLAUDE = !CURSOR_ONLY;

function die(msg) {
  console.error(`error: ${msg}`);
  process.exit(1);
}

function printHelp() {
  console.log(`Usage: node adapters/install-global.js [options]

Install loops globally for Cursor and/or Claude Code.

  (default)         Emit + install both Cursor and Claude
  --cursor-only     Cursor only
  --claude-only     Claude Code only
  --no-emit         Skip adapters/emit.js
  --copy            Copy instead of symlink
  --dry-run         Print planned actions; make no changes
  --uninstall       Remove managed global install
  --help            Show this help
`);
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
      console.warn(`warn: replacing ${LOOPS_LINK} → ${readLinkSafe(LOOPS_LINK)} with ${REPO}`);
      fs.rmSync(LOOPS_LINK, { force: true });
    }
  }
  fs.symlinkSync(REPO, LOOPS_LINK);
  return { status: 'ok', dest: LOOPS_LINK, src: REPO, mode: 'symlink' };
}

function buildAwarenessBody({ forClaude }) {
  const templatePath = path.join(REPO, 'INSTALL-GLOBAL.mdc');
  if (!fs.existsSync(templatePath)) die(`missing ${templatePath}`);
  let body = fs.readFileSync(templatePath, 'utf8');

  // Strip Cursor .mdc frontmatter for Claude rules (.md).
  if (forClaude) {
    body = body.replace(/^---\n[\s\S]*?\n---\n*/, '');
  }

  const paths = [
    '',
    '## Installed paths (machine-specific)',
    '',
    `- Absolute loops root: \`${REPO}\``,
    `- Stable symlink: \`${LOOPS_LINK}\` → \`${REPO}\``,
  ];

  if (DO_CURSOR || !forClaude) {
    paths.push(
      `- Cursor awareness: \`${path.join(CURSOR_RULES, CURSOR_AWARENESS)}\``,
      `- Cursor rules: \`${CURSOR_RULES}/${PREFIX}*.mdc\``,
      `- Cursor skills: \`${CURSOR_SKILLS}/${PREFIX}*/\``
    );
  }
  if (DO_CLAUDE || forClaude) {
    paths.push(
      `- Claude awareness: \`${path.join(CLAUDE_RULES, CLAUDE_AWARENESS)}\``,
      `- Claude skills: \`${CLAUDE_SKILLS}/${PREFIX}*/\` (invoke as \`/${PREFIX}<name>\`, e.g. \`/${PREFIX}dispatcher\`)`
    );
  }

  paths.push(
    '',
    'When reading canonical loop files, prefer the absolute root above if `~/.loops` does not resolve.',
    ''
  );

  if (forClaude) {
    paths.push(
      '## Claude Code notes',
      '',
      '- There is no Cursor-style `alwaysApply` flag; this file under `~/.claude/rules/` is the user-level always-on hook.',
      '- Skills are discovered from `~/.claude/skills/loops-*/`. Prefer `/loops-dispatcher` or say "use the loops".',
      '- Claude follows symlinks for skill directories; supporting files may be symlinked from `~/.loops`.',
      '- **Model classes are advisory** on Claude Code (often cannot switch mid-session). Prefer a high-reasoning session or a second session for `high-reasoning` phases when possible; otherwise continue best-effort. Never use Fable. See `adapters/MODEL_CLASSES.md`.',
      ''
    );
  }

  const footer = paths.join('\n');
  if (!body.includes('## Installed paths')) {
    body = body.trimEnd() + '\n' + footer;
  }
  if (forClaude && !body.includes(LOOPS_MARKER)) {
    body = `${LOOPS_MARKER}\n${body}`;
  }
  return body;
}

function installCursorAwareness() {
  ensureDir(CURSOR_RULES);
  const dest = path.join(CURSOR_RULES, CURSOR_AWARENESS);
  const content = buildAwarenessBody({ forClaude: false });
  if (fs.existsSync(dest) || isSymlink(dest)) {
    const existing = isSymlink(dest) ? null : fs.readFileSync(dest, 'utf8');
    if (existing && !existing.includes('loops is available globally') && !existing.includes('loops is installed')) {
      die(`${dest} exists and does not look like a loops awareness rule. Refusing to overwrite.`);
    }
    fs.rmSync(dest, { force: true });
  }
  fs.writeFileSync(dest, content);
  return { status: 'ok', dest, src: 'INSTALL-GLOBAL.mdc (rendered)', mode: 'write', kind: 'awareness' };
}

function installResolutionRule() {
  // Ships INSTALL-RESOLUTION.mdc into both Cursor and Claude rules dirs.
  // Tells the agent: when loops-* and Hermes built-in both match, prefer loops-*.
  const src = path.join(REPO, 'INSTALL-RESOLUTION.mdc');
  if (!fs.existsSync(src)) return [{ status: 'missing', src }];

  const results = [];
  const cursorName = 'loops-resolution.mdc';
  const claudeName = 'loops-resolution.md';

  // Cursor: keep frontmatter (alwaysApply)
  if (DO_CURSOR) {
    const dest = path.join(CURSOR_RULES, cursorName);
    results.push({ ...linkOrCopy(src, dest, { forceManaged: true }), kind: 'resolution-cursor' });
  }

  // Claude: strip frontmatter (Claude has no alwaysApply flag)
  if (DO_CLAUDE) {
    const dest = path.join(CLAUDE_RULES, claudeName);
    let body = fs.readFileSync(src, 'utf8');
    body = body.replace(/^---\n[\s\S]*?\n---\n*/, '');
    ensureDir(path.dirname(dest));
    if (fs.existsSync(dest) || isSymlink(dest)) {
      if (isSymlink(dest) && isManagedTarget(dest, src)) {
        // existing loops-managed symlink — safe to refresh
        fs.rmSync(dest, { force: true });
      } else if (fs.existsSync(dest) && !isSymlink(dest)) {
        // existing real file (possibly from a prior manual `cp`)
        const existing = fs.readFileSync(dest, 'utf8');
        if (!existing.includes('Loop pack disambiguation') && !existing.includes('loops-resolution')) {
          results.push({ status: 'skipped-collision', dest, src, mode: 'write' });
          return results;
        }
        // looks like ours from a prior install — overwrite
        fs.rmSync(dest, { force: true });
      } else {
        results.push({ status: 'skipped-collision', dest, src, mode: 'write' });
        return results;
      }
    }
    fs.writeFileSync(dest, body);
    results.push({ status: 'ok', dest, src, mode: 'write', kind: 'resolution-claude' });
  }

  return results;
}

function installClaudeAwareness() {
  ensureDir(CLAUDE_RULES);
  const dest = path.join(CLAUDE_RULES, CLAUDE_AWARENESS);
  const content = buildAwarenessBody({ forClaude: true });
  if (fs.existsSync(dest) || isSymlink(dest)) {
    const existing = isSymlink(dest) ? '' : fs.readFileSync(dest, 'utf8');
    if (
      existing &&
      !existing.includes(LOOPS_MARKER) &&
      !existing.includes('loops is available globally')
    ) {
      die(`${dest} exists and does not look like a loops awareness rule. Refusing to overwrite.`);
    }
    fs.rmSync(dest, { force: true });
  }
  fs.writeFileSync(dest, content);
  return { status: 'ok', dest, src: 'INSTALL-GLOBAL.mdc (rendered)', mode: 'write', kind: 'awareness' };
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

function installCursorRulesAndSkills() {
  const results = [];
  const names = listLoopNames();

  for (const name of names) {
    const prefixed = `${PREFIX}${name}`;
    const ruleSrc = path.join(REPO, '.cursor', 'rules', `${prefixed}.mdc`);
    const skillSrc = path.join(REPO, '.claude', 'skills', prefixed);
    const ruleDest = path.join(CURSOR_RULES, `${prefixed}.mdc`);
    const skillDest = path.join(CURSOR_SKILLS, prefixed);

    if (DRY_RUN) {
      results.push({ status: 'dry-run', dest: ruleDest, src: ruleSrc, kind: 'rule' });
      results.push({ status: 'dry-run', dest: skillDest, src: skillSrc, kind: 'skill' });
      continue;
    }

    if (!fs.existsSync(ruleSrc)) {
      results.push({ status: 'missing', dest: ruleDest, src: ruleSrc, kind: 'rule' });
    } else {
      results.push({ ...linkOrCopy(ruleSrc, ruleDest, { forceManaged: true }), kind: 'rule' });
    }

    if (!fs.existsSync(skillSrc)) {
      results.push({ status: 'missing', dest: skillDest, src: skillSrc, kind: 'skill' });
    } else {
      results.push({ ...linkOrCopy(skillSrc, skillDest, { forceManaged: true }), kind: 'skill' });
    }
  }
  return results;
}

/**
 * Claude discovers skills by directory name under ~/.claude/skills/.
 * Slash command = /<dirname>, so we use loops-<name>.
 * Frontmatter `name:` must match the directory name for clean discovery.
 * We write SKILL.md (rewritten name) and symlink supporting files from emit output.
 */
function isManagedClaudeSkillDir(dest, prefixedName) {
  if (!fs.existsSync(dest) && !isSymlink(dest)) return true;
  if (isSymlink(dest)) {
    // Legacy: whole-dir symlink to emit output — treat as managed if it points at our skill.
    return true;
  }
  if (!fs.statSync(dest).isDirectory()) return false;
  const skillMd = path.join(dest, 'SKILL.md');
  if (!fs.existsSync(skillMd)) return false;
  const text = fs.readFileSync(skillMd, 'utf8');
  return (
    text.includes(`name: ${prefixedName}`) ||
    text.includes(LOOPS_MARKER) ||
    text.includes('Auto-generated by loops') ||
    /^name:\s*loops-/m.test(text)
  );
}

function rewriteSkillName(skillMdText, loopName, prefixedName) {
  let text = skillMdText;
  if (!text.includes(LOOPS_MARKER)) {
    // Keep marker out of YAML frontmatter; place after closing ---
    text = text.replace(/^(---\n[\s\S]*?\n---\n)/, `$1${LOOPS_MARKER}\n`);
  }
  if (/^name:\s*.+$/m.test(text)) {
    text = text.replace(/^name:\s*.+$/m, `name: ${prefixedName}`);
  } else {
    text = text.replace(/^---\n/, `---\nname: ${prefixedName}\n`);
  }
  // Touch description so Claude's matcher still mentions loops routing.
  // (Was previously gated on the rewritten text not containing "loops-" in
  // the first 400 chars, but the name rewrite always puts it there — branch
  // was dead. Always prefix the description when it lacks "loops-".)
  text = text.replace(
    /^(description:\s*)(.+)$/m,
    (_, p, rest) => {
      if (/loops-/i.test(rest) || /^\[loops\]/i.test(rest)) {
        return `${p}${rest}`;
      }
      return `${p}[loops] ${rest}`;
    }
  );
  return text;
}

function installClaudeSkills() {
  const results = [];
  if (!DRY_RUN) ensureDir(CLAUDE_SKILLS);

  for (const name of listLoopNames()) {
    const prefixed = `${PREFIX}${name}`;
    const skillSrc = path.join(REPO, '.claude', 'skills', prefixed);
    const skillDest = path.join(CLAUDE_SKILLS, prefixed);
    const srcSkillMd = path.join(skillSrc, 'SKILL.md');

    if (DRY_RUN) {
      results.push({
        status: 'dry-run',
        dest: skillDest,
        src: skillSrc,
        kind: 'claude-skill',
        mode: USE_COPY ? 'copy' : 'write+symlink',
      });
      continue;
    }

    if (!fs.existsSync(srcSkillMd)) {
      results.push({ status: 'missing', dest: skillDest, src: skillSrc, kind: 'claude-skill' });
      continue;
    }

    if (fs.existsSync(skillDest) || isSymlink(skillDest)) {
      if (!isManagedClaudeSkillDir(skillDest, prefixed)) {
        results.push({
          status: 'skipped-collision',
          dest: skillDest,
          src: skillSrc,
          kind: 'claude-skill',
          mode: USE_COPY ? 'copy' : 'symlink',
        });
        continue;
      }
      fs.rmSync(skillDest, { recursive: true, force: true });
    }

    ensureDir(skillDest);
    const raw = fs.readFileSync(srcSkillMd, 'utf8');
    const rewritten = rewriteSkillName(raw, name, prefixed);
    fs.writeFileSync(path.join(skillDest, 'SKILL.md'), rewritten);

    for (const entry of fs.readdirSync(skillSrc)) {
      if (entry === 'SKILL.md') continue;
      const from = path.join(skillSrc, entry);
      const to = path.join(skillDest, entry);
      if (USE_COPY) {
        const st = fs.statSync(from);
        if (st.isDirectory()) fs.cpSync(from, to, { recursive: true });
        else fs.copyFileSync(from, to);
      } else {
        fs.symlinkSync(from, to);
      }
    }

    results.push({
      status: 'ok',
      dest: skillDest,
      src: skillSrc,
      kind: 'claude-skill',
      mode: USE_COPY ? 'copy' : 'write+symlink',
    });
  }
  return results;
}

function removeIfManaged(dest, src, removed, skipped, { allowPrefixedSymlink = false } = {}) {
  if (!fs.existsSync(dest) && !isSymlink(dest)) return;
  if (USE_COPY) {
    fs.rmSync(dest, { recursive: true, force: true });
    removed.push(dest);
    return;
  }
  if (isManagedTarget(dest, src) || (allowPrefixedSymlink && isSymlink(dest) && path.basename(dest).startsWith(PREFIX))) {
    if (isSymlink(dest)) {
      const cur = resolveMaybe(dest);
      const exp = resolveMaybe(src);
      if (cur === exp || path.basename(dest).startsWith(PREFIX)) {
        fs.rmSync(dest, { recursive: true, force: true });
        removed.push(dest);
        return;
      }
    } else if (isManagedTarget(dest, src)) {
      fs.rmSync(dest, { recursive: true, force: true });
      removed.push(dest);
      return;
    }
  }
  skipped.push(dest);
}

function uninstallCursor(removed, skipped) {
  const awareness = path.join(CURSOR_RULES, CURSOR_AWARENESS);
  if (fs.existsSync(awareness) || isSymlink(awareness)) {
    const text = isSymlink(awareness) ? '' : fs.readFileSync(awareness, 'utf8');
    if (!text || text.includes('loops is available globally') || text.includes('Installed paths (machine-specific)')) {
      fs.rmSync(awareness, { force: true });
      removed.push(awareness);
    } else {
      skipped.push(`${awareness} (not a global loops awareness rule)`);
    }
  }

  for (const name of listLoopNames()) {
    const prefixed = `${PREFIX}${name}`;
    const ruleDest = path.join(CURSOR_RULES, `${prefixed}.mdc`);
    const skillDest = path.join(CURSOR_SKILLS, prefixed);
    const ruleSrc = path.join(REPO, '.cursor', 'rules', `${prefixed}.mdc`);
    const skillSrc = path.join(REPO, '.claude', 'skills', prefixed);
    removeIfManaged(ruleDest, ruleSrc, removed, skipped, { allowPrefixedSymlink: true });
    removeIfManaged(skillDest, skillSrc, removed, skipped, { allowPrefixedSymlink: true });
  }
}

function uninstallClaude(removed, skipped) {
  const awareness = path.join(CLAUDE_RULES, CLAUDE_AWARENESS);
  if (fs.existsSync(awareness) || isSymlink(awareness)) {
    const text = isSymlink(awareness) ? '' : fs.readFileSync(awareness, 'utf8');
    if (
      !text ||
      text.includes(LOOPS_MARKER) ||
      text.includes('loops is available globally') ||
      text.includes('Installed paths (machine-specific)')
    ) {
      fs.rmSync(awareness, { force: true });
      removed.push(awareness);
    } else {
      skipped.push(`${awareness} (not a global loops awareness rule)`);
    }
  }

  for (const name of listLoopNames()) {
    const prefixed = `${PREFIX}${name}`;
    const skillDest = path.join(CLAUDE_SKILLS, prefixed);
    if (!fs.existsSync(skillDest) && !isSymlink(skillDest)) continue;
    if (isManagedClaudeSkillDir(skillDest, prefixed) || path.basename(skillDest).startsWith(PREFIX)) {
      fs.rmSync(skillDest, { recursive: true, force: true });
      removed.push(skillDest);
    } else {
      skipped.push(skillDest);
    }
  }
}

function uninstall() {
  const removed = [];
  const skipped = [];

  if (DO_CURSOR) uninstallCursor(removed, skipped);
  if (DO_CLAUDE) uninstallClaude(removed, skipped);

  // ~/.loops only on full uninstall (both targets)
  if (DO_CURSOR && DO_CLAUDE) {
    if (isSymlink(LOOPS_LINK) && resolveMaybe(LOOPS_LINK) === resolveMaybe(REPO)) {
      fs.rmSync(LOOPS_LINK, { force: true });
      removed.push(LOOPS_LINK);
    } else if (fs.existsSync(LOOPS_LINK) || isSymlink(LOOPS_LINK)) {
      skipped.push(`${LOOPS_LINK} (not pointing at this repo)`);
    }
  }

  const scope = DO_CURSOR && DO_CLAUDE ? 'both' : DO_CURSOR ? 'cursor' : 'claude';
  console.log(`uninstall complete (${scope}).`);
  console.log(`  removed (${removed.length}):`);
  for (const p of removed) console.log(`    - ${p}`);
  if (skipped.length) {
    console.log(`  skipped (${skipped.length}):`);
    for (const p of skipped) console.log(`    - ${p}`);
  }
}

function printSummary(extra) {
  const targets = [DO_CURSOR && 'cursor', DO_CLAUDE && 'claude'].filter(Boolean).join('+');
  console.log('');
  console.log('=== loops global install ===');
  console.log(`repo:     ${REPO}`);
  console.log(`targets:  ${targets}`);
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
  console.log(`  node ${path.join(REPO, 'adapters', 'install-global.js')} --uninstall --claude-only`);
  console.log(`  node ${path.join(REPO, 'adapters', 'install-global.js')} --uninstall --cursor-only`);
}

function verify() {
  console.log('Verification:');
  console.log(`  ~/.loops: ${isSymlink(LOOPS_LINK) ? readLinkSafe(LOOPS_LINK) : 'NO'}`);

  if (DO_CURSOR) {
    console.log(`  cursor awareness: ${fs.existsSync(path.join(CURSOR_RULES, CURSOR_AWARENESS)) ? 'yes' : 'NO'}`);
    const linkedRules = fs.existsSync(CURSOR_RULES)
      ? fs.readdirSync(CURSOR_RULES).filter((f) => f.startsWith(PREFIX) && f.endsWith('.mdc'))
      : [];
    const linkedSkills = fs.existsSync(CURSOR_SKILLS)
      ? fs.readdirSync(CURSOR_SKILLS).filter((f) => f.startsWith(PREFIX))
      : [];
    console.log(`  cursor rules:     ${linkedRules.length} → ${linkedRules.join(', ')}`);
    console.log(`  cursor skills:    ${linkedSkills.length} → ${linkedSkills.join(', ')}`);
  }

  if (DO_CLAUDE) {
    console.log(`  claude awareness: ${fs.existsSync(path.join(CLAUDE_RULES, CLAUDE_AWARENESS)) ? 'yes' : 'NO'}`);
    const claudeSkills = fs.existsSync(CLAUDE_SKILLS)
      ? fs.readdirSync(CLAUDE_SKILLS).filter((f) => f.startsWith(PREFIX))
      : [];
    console.log(`  claude skills:    ${claudeSkills.length} → ${claudeSkills.join(', ')}`);
    for (const s of claudeSkills) {
      const md = path.join(CLAUDE_SKILLS, s, 'SKILL.md');
      if (!fs.existsSync(md)) {
        console.log(`    ! missing SKILL.md in ${s}`);
        continue;
      }
      const nameLine = fs.readFileSync(md, 'utf8').match(/^name:\s*(.+)$/m);
      const ok = nameLine && nameLine[1].trim() === s;
      console.log(`    ${s}: name=${nameLine ? nameLine[1].trim() : '?'} ${ok ? '✓' : 'MISMATCH'}`);
    }
  }
}

function main() {
  if (HELP) {
    printHelp();
    return;
  }

  if (UNINSTALL) {
    if (DRY_RUN) {
      console.log('dry-run: would uninstall managed global install');
      return;
    }
    uninstall();
    return;
  }

  if (!NO_EMIT) {
    if (DRY_RUN) {
      console.log('dry-run: would run adapters/emit.js');
    } else {
      runEmit();
    }
  }

  if (DRY_RUN) {
    console.log(`dry-run: would symlink ${LOOPS_LINK} → ${REPO}`);
    if (DO_CURSOR) {
      console.log(`dry-run: would write ${path.join(CURSOR_RULES, CURSOR_AWARENESS)}`);
      installCursorRulesAndSkills();
    }
    if (DO_CLAUDE) {
      console.log(`dry-run: would write ${path.join(CLAUDE_RULES, CLAUDE_AWARENESS)}`);
      installClaudeSkills();
    }
    printSummary([{ status: 'dry-run', dest: LOOPS_LINK, kind: 'root' }]);
    return;
  }

  const results = [];
  results.push({ ...installLoopsSymlink(), kind: 'root' });

  if (DO_CURSOR) {
    results.push(installCursorAwareness());
    results.push(...installCursorRulesAndSkills());
  }
  if (DO_CLAUDE) {
    results.push(installClaudeAwareness());
    results.push(...installClaudeSkills());
  }

  // Disambiguation rule: prefer loops-* when both loops-* and Hermes built-in match.
  results.push(...installResolutionRule());

  const collisions = results.filter((r) => r.status === 'skipped-collision');
  const missing = results.filter((r) => r.status === 'missing');
  if (collisions.length) {
    console.warn(`warn: skipped ${collisions.length} collision(s) (left existing files alone)`);
  }
  if (missing.length) {
    console.warn(`warn: ${missing.length} emit output(s) missing — re-run emit`);
  }

  printSummary(results);
  verify();
  console.log('done.');
}

module.exports = {
  REPO,
  HOME,
  LOOPS_LINK,
  CURSOR_RULES,
  CURSOR_SKILLS,
  CLAUDE_RULES,
  CLAUDE_SKILLS,
  CURSOR_AWARENESS,
  CLAUDE_AWARENESS,
  PREFIX,
  LOOPS_MARKER,
  ensureDir,
  isSymlink,
  readLinkSafe,
  resolveMaybe,
  isManagedTarget,
  linkOrCopy,
  isManagedClaudeSkillDir,
  rewriteSkillName,
  removeIfManaged,
  buildAwarenessBody,
  installLoopsSymlink,
  installCursorAwareness,
  installClaudeAwareness,
  installResolutionRule,
  installCursorRulesAndSkills,
  installClaudeSkills,
  listLoopNames,
  uninstall,
  printSummary,
  verify,
  main,
};

if (require.main === module) {
  main();
}
