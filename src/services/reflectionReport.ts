import { moodRepository } from '../database/repositories/moodRepository';
import { journalRepository } from '../database/repositories/journalRepository';

export type ReportPeriod = 'week' | 'month';
export type ReportEntry = { id: string; createdAt: number; mood: string; intensity: number; stress: number; energy: string; context: string; needs: string };
export type NoteEntry = { id: string; createdAt: number; type: string; title: string; body: string; mood: string };
export type DailyPoint = { date: string; label: string; moods: number; notes: number; averageStress: number | null; averageIntensity: number | null; dominantMood: string | null };
export type MindNode = { id: string; label: string; size: number; kind: 'mood' | 'theme'; occurrences: number };
export type MindLink = { from: string; to: string; weight: number };
export type ReflectionReport = {
  period: ReportPeriod;
  start: number;
  end: number;
  moodCount: number;
  noteCount: number;
  daysTracked: number;
  daysInPeriod: number;
  averageStress: number | null;
  previousAverageStress: number | null;
  averageIntensity: number | null;
  dominantMood: string | null;
  moodDistribution: { name: string; count: number }[];
  daily: DailyPoint[];
  recentNotes: NoteEntry[];
  nodes: MindNode[];
  links: MindLink[];
  observations: string[];
};

const STOP_WORDS = new Set('about after again also always because been before being could during every feeling feels from have into just like little more most much myself only other over really some something that their them then there these they this those through today tomorrow very want what when where while with would yesterday your work things right'.split(' '));
const POSITIVE = new Set(['happy', 'peaceful', 'grateful', 'content', 'hopeful', 'excited', 'proud', 'motivated', 'relieved', 'connected']);
const clean = (value: unknown) => String(value || '').trim();
const number = (value: unknown) => typeof value === 'number' && Number.isFinite(value) ? value : Number.isFinite(Number(value)) ? Number(value) : 0;
const dayKey = (value: number) => {
  const d = new Date(value);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const avg = (values: number[]) => values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length * 10) / 10 : null;
const top = (values: string[]) => {
  const map = new Map<string, number>();
  values.filter(Boolean).forEach(v => map.set(v, (map.get(v) || 0) + 1));
  return [...map.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
};
const getStart = (days: number) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - days + 1);
  return d.getTime();
};
export function normaliseMood(value: any): ReportEntry {
  return { id: clean(value.id), createdAt: number(value.createdAt), mood: clean(value.mood).toLowerCase(), intensity: number(value.intensity), stress: number(value.stress), energy: clean(value.energy), context: clean(value.context), needs: clean(value.needs) };
}
export function normaliseJournal(value: any): NoteEntry {
  return { id: clean(value.id), createdAt: number(value.createdAt), type: clean(value.type), title: clean(value.title), body: clean(value.body), mood: clean(value.mood).toLowerCase() };
}

/** All figures are computed from existing entries, not from fabricated sample data. */
export function buildReflectionReport(moodValues: any[], journalValues: any[], period: ReportPeriod, now = Date.now()): ReflectionReport {
  const days = period === 'week' ? 7 : 30;
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - days + 1);
  const start = startDate.getTime();
  const end = now;
  const priorStart = new Date(startDate);
  priorStart.setDate(startDate.getDate() - days);
  const moodsAll = moodValues.map(normaliseMood).filter(x => x.createdAt > 0);
  const notesAll = journalValues.map(normaliseJournal).filter(x => x.createdAt > 0);
  const moods = moodsAll.filter(x => x.createdAt >= start && x.createdAt <= end);
  const notes = notesAll.filter(x => x.createdAt >= start && x.createdAt <= end);
  const prev = moodsAll.filter(x => x.createdAt >= priorStart.getTime() && x.createdAt < start);
  const moodDistribution = top(moods.map(m => m.mood)).map(([name, count]) => ({ name, count }));
  const daily: DailyPoint[] = Array.from({ length: days }, (_, index) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);
    const key = dayKey(date.getTime());
    const dayMoods = moods.filter(x => dayKey(x.createdAt) === key);
    const dayNotes = notes.filter(x => dayKey(x.createdAt) === key);
    return {
      date: key, label: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      moods: dayMoods.length, notes: dayNotes.length,
      averageStress: avg(dayMoods.map(x => x.stress).filter(x => x > 0)),
      averageIntensity: avg(dayMoods.map(x => x.intensity).filter(x => x > 0)),
      dominantMood: top(dayMoods.map(x => x.mood))[0]?.[0] || null,
    };
  });
  const wordsByDay = new Map<string, Set<string>>();
  [...moods.map(x => ({ at: x.createdAt, text: `${x.context} ${x.needs}` })), ...notes.map(x => ({ at: x.createdAt, text: `${x.title} ${x.body}` }))].forEach(item => {
    const key = dayKey(item.at);
    const terms = item.text.toLowerCase().match(/[a-z]{4,}/g) || [];
    const bag = wordsByDay.get(key) || new Set<string>();
    terms.filter(t => !STOP_WORDS.has(t)).slice(0, 120).forEach(t => bag.add(t));
    wordsByDay.set(key, bag);
  });
  const themeCount = new Map<string, number>();
  wordsByDay.forEach(set => set.forEach(word => themeCount.set(word, (themeCount.get(word) || 0) + 1)));
  const themeWords = [...themeCount.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 7);
  const nodes: MindNode[] = [
    ...moodDistribution.slice(0, 6).map(m => ({ id: `m:${m.name}`, label: m.name, size: 1 + m.count, kind: 'mood' as const, occurrences: m.count })),
    ...themeWords.map(([word, count]) => ({ id: `t:${word}`, label: word, size: 1 + count, kind: 'theme' as const, occurrences: count })),
  ];
  const links: MindLink[] = [];
  moodDistribution.slice(0, 6).forEach(m => themeWords.forEach(([word]) => {
    const datesWithMood = new Set(moods.filter(x => x.mood === m.name).map(x => dayKey(x.createdAt)));
    const weight = [...datesWithMood].filter(d => wordsByDay.get(d)?.has(word)).length;
    if (weight > 0) links.push({ from: `m:${m.name}`, to: `t:${word}`, weight });
  }));
  const dayCount = daily.filter(d => d.moods || d.notes).length;
  const stressAverage = avg(moods.map(x => x.stress).filter(x => x > 0));
  const previousAverageStress = avg(prev.map(x => x.stress).filter(x => x > 0));
  const observations: string[] = [];
  if (!moods.length && !notes.length) observations.push('No check-ins or notes yet in this period. Start with a mood or a journal entry.');
  else {
    observations.push(`You recorded something on ${dayCount} of the past ${days} days.`);
    if (moodDistribution.length) observations.push(`${moodDistribution[0].name.charAt(0).toUpperCase() + moodDistribution[0].name.slice(1)} was your most frequently recorded mood (${moodDistribution[0].count} check-in${moodDistribution[0].count === 1 ? '' : 's'}).`);
    if (stressAverage !== null && previousAverageStress !== null) {
      const difference = Math.round((stressAverage - previousAverageStress) * 10) / 10;
      observations.push(difference === 0 ? 'Average reported stress is unchanged from the previous equal-length period.' : `Average reported stress is ${Math.abs(difference).toFixed(1)} points ${difference < 0 ? 'lower' : 'higher'} than the preceding period.`);
    }
    if (themeWords.length) observations.push(`Words appearing across your saved notes: ${themeWords.slice(0, 3).map(x => x[0]).join(', ')}. These are word counts, not diagnoses.`);
  }
  return { period, start, end, moodCount: moods.length, noteCount: notes.length, daysTracked: dayCount, daysInPeriod: days, averageStress: stressAverage, previousAverageStress, averageIntensity: avg(moods.map(x => x.intensity).filter(x => x > 0)), dominantMood: moodDistribution[0]?.name || null, moodDistribution, daily, recentNotes: notes.sort((a, b) => b.createdAt - a.createdAt).slice(0, 7), nodes, links, observations };
}

export async function loadReflectionReport(period: ReportPeriod): Promise<ReflectionReport> {
  const [moods, journals] = await Promise.all([moodRepository.getAll(), journalRepository.getAll()]);
  return buildReflectionReport(moods || [], journals || [], period);
}
