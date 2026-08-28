import type {
  ContentBundle,
  Sign,
  Topic,
  GrammarTopic,
  FingerspellingEntry,
  NumberEntry,
  ContentMeta,
} from './schema';
import { ContentBundleSchema } from './schema';

export type {
  ContentBundle,
  Sign,
  Topic,
  GrammarTopic,
  FingerspellingEntry,
  NumberEntry,
  ContentMeta,
};

const BASE = '/content/msl';

// ─── Timeout wrapper ───────────────────────────────────────────────────────────
const TIMEOUT_MS = 15_000;

async function fetchWithTimeout(url: string, ms = TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, { signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

// ─── Per-file fetch helpers ───────────────────────────────────────────────────
async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetchWithTimeout(url);
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
  const text = await res.text();
  return JSON.parse(text) as T;
}

// ─── Individual lazy loaders — load only what each route needs ───────────────

export async function loadMeta(): Promise<ContentMeta> {
  return fetchJSON<ContentMeta>(`${BASE}/meta.json`);
}

export async function loadTopics(): Promise<Topic[]> {
  return fetchJSON<{ topics: Topic[] }>(`${BASE}/topics.json`).then((r) => r.topics);
}

export async function loadSigns(): Promise<Sign[]> {
  return fetchJSON<{ signs: Sign[] }>(`${BASE}/signs.json`).then((r) => r.signs);
}

export async function loadGrammar(): Promise<GrammarTopic[]> {
  return fetchJSON<{ grammar: GrammarTopic[] }>(`${BASE}/grammar.json`).then(
    (r) => r.grammar,
  );
}

export async function loadFingerspelling(): Promise<FingerspellingEntry[]> {
  return fetchJSON<{ fingerspelling: FingerspellingEntry[] }>(
    `${BASE}/fingerspelling.json`,
  ).then((r) => r.fingerspelling);
}

export async function loadNumbers(): Promise<NumberEntry[]> {
  return fetchJSON<{ numbers: NumberEntry[] }>(`${BASE}/numbers.json`).then(
    (r) => r.numbers,
  );
}

// ─── Full bundle — only used by routes that genuinely need everything ──────────
let _bundle: ContentBundle | null = null;

export async function loadContent(): Promise<ContentBundle> {
  if (_bundle) return _bundle;
  const [meta, { signs }, { topics }, { grammar }, { fingerspelling }, { numbers }] =
    await Promise.all([
      loadMeta(),
      fetchJSON<{ signs: Sign[] }>(`${BASE}/signs.json`),
      fetchJSON<{ topics: Topic[] }>(`${BASE}/topics.json`),
      fetchJSON<{ grammar: GrammarTopic[] }>(`${BASE}/grammar.json`),
      fetchJSON<{ fingerspelling: FingerspellingEntry[] }>(
        `${BASE}/fingerspelling.json`,
      ),
      fetchJSON<{ numbers: NumberEntry[] }>(`${BASE}/numbers.json`),
    ]);
  _bundle = ContentBundleSchema.parse({
    meta,
    signs,
    topics,
    grammar,
    fingerspelling,
    numbers,
  });
  return _bundle;
}

// ─── Lookup helpers ───────────────────────────────────────────────────────────

export async function findSign(id: number): Promise<Sign | undefined> {
  const signs = await loadSigns();
  return signs.find((s) => s.id === id);
}

export async function findTopic(slug: string): Promise<Topic | undefined> {
  const topics = await loadTopics();
  return topics.find((t) => t.id === slug);
}

export async function signNeighbors(
  id: number,
): Promise<{ prev?: Sign; next?: Sign }> {
  const signs = await loadSigns();
  const sorted = [...signs].sort((a, b) =>
    a.headword.localeCompare(b.headword, 'ru'),
  );
  const i = sorted.findIndex((s) => s.id === id);
  if (i < 0) return {};
  return {
    ...(i > 0 ? { prev: sorted[i - 1] } : {}),
    ...(i < sorted.length - 1 ? { next: sorted[i + 1] } : {}),
  };
}

export async function signsByTopic(topicSlug: string): Promise<Sign[]> {
  const signs = await loadSigns();
  return signs.filter((s) => s.topics.includes(topicSlug));
}
