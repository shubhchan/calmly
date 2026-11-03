const test = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const filename = path.resolve(__dirname, '../src/services/reflectionReport.ts');
const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021 }, fileName: filename,
}).outputText;
const loaded = new Module(filename, module);
loaded.filename = filename;
loaded.paths = module.paths;
loaded.require = (id) => {
  if (id.includes('/moodRepository') || id.includes('/journalRepository')) return {};
  return require(id);
};
loaded._compile(code, filename);
const { buildReflectionReport } = loaded.exports;
const at = (year, month, day) => new Date(year, month - 1, day, 12).getTime();
const now = at(2026, 11, 3);
const mood = (id, day, label, stress, context = '') => ({ id, createdAt: at(2026, 11, day), mood: label, intensity: 6, stress, context });
const note = (id, day, body) => ({ id, createdAt: at(2026, 11, day), type: 'free', title: '', body });

test('an empty report has zero activity, no fabricated scores, and seven days', () => {
  const result = buildReflectionReport([], [], 'week', now);
  assert.equal(result.daily.length, 7);
  assert.equal(result.moodCount, 0);
  assert.equal(result.daysTracked, 0);
  assert.equal(result.averageStress, null);
  assert.equal(result.dominantMood, null);
  assert.deepEqual(result.nodes, []);
});

test('real mood and journal entries produce correct totals, date buckets and co-occurrence links', () => {
  const moods = [mood('m1', 1, 'happy', 3, 'Spent time outside walking'), mood('m2', 2, 'anxious', 7, 'Meeting at work'), mood('m3', 2, 'happy', 5, 'Work meeting')];
  const notes = [note('j1', 2, 'Work meeting took time'), note('j2', 3, 'Rested after a long walk')];
  const result = buildReflectionReport(moods, notes, 'week', now);
  assert.equal(result.moodCount, 3);
  assert.equal(result.noteCount, 2);
  assert.equal(result.daysTracked, 3);
  assert.equal(result.averageStress, 5);
  assert.equal(result.dominantMood, 'happy');
  assert.equal(result.daily.find(d => d.date === '2026-11-02').moods, 2);
  assert.ok(result.nodes.some(n => n.kind === 'mood' && n.label === 'anxious'));
  assert.ok(result.links.some(l => l.from === 'm:anxious' && l.to === 't:meeting'));
  assert.equal(result.recentNotes.length, 2);
});

test('month range uses 30 actual days and excludes older records', () => {
  const old = { ...mood('old', 1, 'sad', 9), createdAt: at(2026, 9, 15) };
  const recent = mood('recent', 3, 'relieved', 2);
  const result = buildReflectionReport([old, recent], [], 'month', now);
  assert.equal(result.daysInPeriod, 30);
  assert.equal(result.daily.length, 30);
  assert.equal(result.moodCount, 1);
  assert.equal(result.dominantMood, 'relieved');
});

test('past-period comparison is computed only when there are prior check-ins', () => {
  const previous = { ...mood('p', 1, 'sad', 8), createdAt: at(2026, 10, 25) };
  const result = buildReflectionReport([mood('n', 2, 'hopeful', 4), previous], [], 'week', now);
  assert.equal(result.averageStress, 4);
  assert.equal(result.previousAverageStress, 8);
  assert.ok(result.observations.some(x => x.includes('4.0 points lower')));
});
