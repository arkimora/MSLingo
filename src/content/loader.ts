import type { ContentBundle, Sign, Topic, GrammarTopic, FingerspellingEntry, NumberEntry, ContentMeta } from './schema';
import { ContentBundleSchema } from './schema';

export type { ContentBundle, Sign, Topic, GrammarTopic, FingerspellingEntry, NumberEntry, ContentMeta };

import signsJson from '@content/msl/signs.json';
import topicsJson from '@content/msl/topics.json';
import grammarJson from '@content/msl/grammar.json';
import fingerspellingJson from '@content/msl/fingerspelling.json';
import numbersJson from '@content/msl/numbers.json';
import metaJson from '@content/msl/meta.json';

let cached: ContentBundle | null = null;
let inflight: Promise<ContentBundle> | null = null;

/**
 * Load the content bundle. The data is bundled at build time, but Zod
 * validation is expensive on the main thread for ~1,400 signs — so we
 * yield to the event loop and resolve asynchronously. Result is memoized
 * so subsequent calls return instantly.
 */
export function loadContent(): Promise<ContentBundle> {
  if (cached) return Promise.resolve(cached);
  if (inflight) return inflight;

  inflight = new Promise((resolve) => {
    // Yield to the event loop so the UI can paint a skeleton first.
    setTimeout(() => {
      const bundle = ContentBundleSchema.parse({
        meta: metaJson as ContentMeta,
        signs: (signsJson as { signs: Sign[] }).signs,
        topics: (topicsJson as { topics: Topic[] }).topics,
        grammar: (grammarJson as { grammar: GrammarTopic[] }).grammar,
        fingerspelling: (fingerspellingJson as { fingerspelling: FingerspellingEntry[] })
          .fingerspelling,
        numbers: (numbersJson as { numbers: NumberEntry[] }).numbers,
      });
      cached = bundle;
      inflight = null;
      resolve(bundle);
    }, 0);
  });

  return inflight;
}

/** Synchronous read — only valid after `loadContent()` has resolved once. */
export function getContent(): ContentBundle {
  if (!cached) {
    // Caller forgot to await loadContent(). Fall back to sync parse so
    // the app doesn't crash; the first await will still trigger loading UI.
    const bundle = ContentBundleSchema.parse({
      meta: metaJson as ContentMeta,
      signs: (signsJson as { signs: Sign[] }).signs,
      topics: (topicsJson as { topics: Topic[] }).topics,
      grammar: (grammarJson as { grammar: GrammarTopic[] }).grammar,
      fingerspelling: (fingerspellingJson as { fingerspelling: FingerspellingEntry[] })
        .fingerspelling,
      numbers: (numbersJson as { numbers: NumberEntry[] }).numbers,
    });
    cached = bundle;
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

/**
 * Find the previous and next signs in dictionary order. The source
 * (mnsl.mn) is alphabetical, so we order by headword using Mongolian
 * Cyrillic collation (JS String#localeCompare with 'ru' is close enough
 * for the Cyrillic letters we use).
 */
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
