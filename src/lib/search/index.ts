/**
 * Local full-text search using FlexSearch. The dictionary is small (~1,400 docs)
 * so we build the index in memory at app start.
 */
import FlexSearch from 'flexsearch';
import type {
  EnrichedDocumentSearchResultSetUnit,
} from 'flexsearch';
import { loadSigns } from '../../content/loader';

interface IndexedSign {
  id: number;
  headword: string;
  meanings: string;
  topics: string;
  sourceUrl: string;
}

const index = new FlexSearch.Document<IndexedSign, true>({
  document: {
    id: 'id',
    index: ['headword', 'meanings', 'topics'],
    store: true,
  },
  tokenize: 'forward',
});

let built = false;

export async function buildSearchIndex() {
  if (built) return;
  const signs = await loadSigns();
  for (const s of signs) {
    index.add({
      id: s.id,
      headword: s.headword,
      meanings: s.meanings.join(' '),
      topics: s.topics.join(' '),
      sourceUrl: s.sourceUrl,
    });
  }
  built = true;
}

export interface SearchHit {
  id: number;
  headword: string;
  matchedField: 'headword' | 'meanings' | 'topics';
}

export function search(query: string, limit = 50): SearchHit[] {
  if (!built) return [];
  if (!query.trim()) return [];
  const results = index.search(query, { limit, enrich: true }) as unknown as EnrichedDocumentSearchResultSetUnit<IndexedSign>[];
  const seen = new Set<number>();
  const hits: SearchHit[] = [];
  for (const field of results) {
    for (const item of field.result) {
      for (const idStr of item.id) {
        const id = typeof idStr === 'number' ? idStr : Number(idStr);
        if (seen.has(id)) continue;
        seen.add(id);
        hits.push({
          id,
          headword: item.doc?.headword ?? '',
          matchedField: (field.field as SearchHit['matchedField']) ?? 'headword',
        });
      }
    }
  }
  return hits;
}
