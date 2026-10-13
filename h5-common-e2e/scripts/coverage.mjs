#!/usr/bin/env node
/*
 * 需求 → e2e 用例覆盖表，给 sprint verify 用。
 *
 * 需求来源：openspec change 的 specs/<能力域>/spec.md 里的「### Requirement: xxx」；
 * explore.md 有 R-xx 编号时一并收进来。
 * 用例来源：e2e 的 report.json（run.results[]）。用例标题里写 [能力域/需求名] 或 [R-xx] 即算覆盖该需求。
 *
 * 用法：node scripts/coverage.mjs <change 目录> [report.json] [输出 md]
 * 只出报告，不判定能不能 ship；准入由 sprint-verify 汇总后决定。退出码恒为 0（读不到文件除外）。
 */
import { existsSync, readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';

const [changeDir, reportPath = '.e2e/report.json', outPath] = process.argv.slice(2);
if (!changeDir) {
  console.error('用法：node scripts/coverage.mjs <openspec change 目录> [report.json] [输出 md]');
  process.exit(2);
}

// 「本期不提供 / 本期无」是范围声明，不该有 e2e
const OUT_OF_SCOPE = /^本期(不提供|无)/;

const requirements = [];
const specsDir = join(changeDir, 'specs');
for (const cap of existsSync(specsDir) ? readdirSync(specsDir) : []) {
  const file = join(specsDir, cap, 'spec.md');
  if (!existsSync(file)) continue;
  for (const m of readFileSync(file, 'utf8').matchAll(/^### Requirement:\s*(.+?)\s*$/gm)) {
    requirements.push({ key: `${cap}/${m[1]}`, outOfScope: OUT_OF_SCOPE.test(m[1]) });
  }
}
const explore = join(changeDir, 'explore.md');
if (existsSync(explore)) {
  const ids = new Set(readFileSync(explore, 'utf8').match(/\bR-\d{2,}\b/g) ?? []);
  for (const id of ids) requirements.push({ key: id, outOfScope: false });
}

const report = JSON.parse(readFileSync(reportPath, 'utf8'));
const results = (report.run?.results ?? []).filter((r) => r.selected !== false);

const ICON = { passed: '✅', flaky: '⚠️ flaky', failed: '❌', 'timed-out': '❌ 超时', interrupted: '⏸ 中断', skipped: '⏭ 跳过' };
const worst = ['failed', 'timed-out', 'interrupted', 'flaky', 'skipped', 'passed'];

const rows = requirements.map((req) => {
  const tag = `[${req.key}]`;
  const hits = results.filter((r) => r.titlePath.join(' ').includes(tag));
  const status = hits.length ? worst.find((s) => hits.some((h) => h.status === s)) : null;
  return { ...req, hits, status };
});

const inScope = rows.filter((r) => !r.outOfScope);
const covered = inScope.filter((r) => r.hits.length);
const passed = inScope.filter((r) => r.status === 'passed' || r.status === 'flaky');
const s = report.run?.summary ?? {};

const lines = [
  `# e2e 需求覆盖`,
  ``,
  `- 运行：${report.run?.status}（退出码 ${report.run?.exitCode}），用例 ${s.passed ?? 0} 通过 / ${s.failed ?? 0} 失败 / ${s.flaky ?? 0} flaky / ${s.skipped ?? 0} 跳过`,
  `- 需求覆盖：${covered.length} / ${inScope.length} 条有 e2e，其中 ${passed.length} 条全部通过（范围外 ${rows.length - inScope.length} 条不计）`,
  ``,
  `| 需求 | e2e | 用例 |`,
  `|---|---|---|`,
  ...rows.map((r) => {
    const status = r.outOfScope ? '— 范围外' : r.status ? ICON[r.status] : '— 无用例';
    const tests = r.hits.map((h) => `${h.file} › ${h.titlePath.at(-1).replace(`[${r.key}] `, '')}`).join('<br>');
    return `| ${r.key} | ${status} | ${tests} |`;
  }),
];

const orphans = results.filter((r) => !rows.some((row) => r.titlePath.join(' ').includes(`[${row.key}]`)));
if (orphans.length) {
  lines.push('', '## 未关联需求的用例', '', ...orphans.map((r) => `- ${ICON[r.status] ?? r.status} ${r.file} › ${r.titlePath.join(' › ')}`));
}

const md = lines.join('\n') + '\n';
if (outPath) {
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, md);
  console.log(`已写入 ${outPath}`);
}
console.log(md);
