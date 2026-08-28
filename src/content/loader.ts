import type { ContentBundle, Sign, Topic, GrammarTopic, FingerspellingEntry, NumberEntry, ContentMeta } from './schema';
import { ContentBundleSchema } from './schema';

export type { ContentBundle, Sign, Topic, GrammarTopic, FingerspellingEntry, NumberEntry, ContentMeta };

let cached: ContentBundle | null = null;
let inflight: Promise<ContentBundle> | null = null;

const BASE = '/content/msl';

/**
 * Load the content bundle by fetching the static JSON files.
 * This is dramatically faster than bundling them in JS because:
 *   1. The browser streams and parses them separately from the main JS
 *   2. They're cacheable as plain HTTP resources (no parse cost on repeat visits)
 *   3. The service worker caches them on first load
 */
export function loadContent(): Promise<ContentBundle> {
  if (cached) return Promise.resolve(cached);
  if (inflight) return inflight;

  inflight = fetchBundle().then((bundle) => {
    cached = bundle;
    inflight = null;
    return bundle;
  });

  return inflight;
}

async function fetchBundle(): Promise<ContentBundle> {
  // Fetch all in parallel
  const [meta, signs, topics, grammar, fingerspelling, numbers] = await Promise.all([
    fetchJSON<ContentMeta>(`${BASE}/meta.json`),
    fetchJSON<{ signs: Sign[] }>(`${BASE}/signs.json`),
    fetchJSON<{ topics: Topic[] }>(`${BASE}/topics.json`),
    fetchJSON<{ grammar: GrammarTopic[] }>(`${BASE}/grammar.json`),
    fetchJSON<{ fingerspelling: FingerspellingEntry[] }>(`${BASE}/fingerspelling.json`),
    fetchJSON<{ numbers: NumberEntry[] }>(`${BASE}/numbers.json`),
  ]);
  return ContentBundleSchema.parse({ meta, signs, topics, grammar, fingerspelling, numbers });
}

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load ${url}: ${res.status}`);
  return res.json() as Promise<T>;
}

/** Synchronous read — only valid after `loadContent()` has resolved once. */
export function getContent(): ContentBundle {
  if (!cached) {
    return ContentBundleSchema.parse({
      meta: { source: 'mnsl.mn', importedAt: new Date().toISOString(), schemaVersion: 1, statistics: { signs: 0, variants: 0, categories: 0, examples: 0, grammarTopics: 0, fingerspellingEntries: 0, numberEntries: 0 } },
      signs: [],
      topics: [],
      grammar: [],
      fingerspelling: [],
      numbers: [],
    });
  }
  return cached;
}

export async function findSign(id: number): Promise<Sign | undefined> {
  const { signs } = await loadContent();
  return signs.find((s) => s.id === id);
}

export async function findTopic(slug: string): Promise<Topic | undefined> {
  const { topics } = await loadContent();
  return topics.find((t) => t.id === slug);
}

export async function signNeighbors(
  id: number,
): Promise<{ prev?: Sign; next?: Sign }> {
  const { signs } = await loadContent();
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
  const { signs } = await loadContent();
  return signs.filter((s) => s.topics.includes(topicSlug));
}
