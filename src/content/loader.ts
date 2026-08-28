import type { ContentBundle, Sign, Topic, GrammarTopic, FingerspellingEntry, NumberEntry, ContentMeta } from './schema';
import { ContentBundleSchema } from './schema';

import signsJson from '@content/msl/signs.json';
import topicsJson from '@content/msl/topics.json';
import grammarJson from '@content/msl/grammar.json';
import fingerspellingJson from '@content/msl/fingerspelling.json';
import numbersJson from '@content/msl/numbers.json';
import metaJson from '@content/msl/meta.json';

let cached: ContentBundle | null = null;

export function loadContent(): ContentBundle {
  if (cached) return cached;
  // The content is bundled at build time. We validate at runtime so a
  // corrupted or partially-synced package fails loudly instead of silently
  // showing wrong MSL information.
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
  return bundle;
}

export function findSign(id: number): Sign | undefined {
  return loadContent().signs.find((s) => s.id === id);
}

export function findTopic(slug: string): Topic | undefined {
  return loadContent().topics.find((t) => t.id === slug);
}

/**
 * Find the previous and next signs in dictionary order. The source
 * (mnsl.mn) is alphabetical, so we order by headword using Mongolian
 * Cyrillic collation (JS String#localeCompare with 'ru' is close enough
 * for the Cyrillic letters we use).
 */
export function signNeighbors(id: number): { prev?: Sign; next?: Sign } {
  const signs = [...loadContent().signs].sort((a, b) =>
    a.headword.localeCompare(b.headword, 'ru'),
  );
  const i = signs.findIndex((s) => s.id === id);
  if (i < 0) return {};
  return {
    ...(i > 0 ? { prev: signs[i - 1] } : {}),
    ...(i < signs.length - 1 ? { next: signs[i + 1] } : {}),
  };
}

export function signsByTopic(topicSlug: string): Sign[] {
  return loadContent().signs.filter((s) => s.topics.includes(topicSlug));
}
