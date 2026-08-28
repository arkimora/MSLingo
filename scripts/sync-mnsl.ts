/**
 * Content extraction pipeline.
 *
 * Run with: npm run sync:mnsl
 *
 * Strategy (see MNSL_SOURCE_MAP.md):
 * 1. Enumerate signs via WP REST API list endpoint: /wp-json/wp/v2/ug?per_page=100
 *    (Sitemap IDs are URL ordinals, not WP post IDs, so we use the list endpoint.)
 * 2. For each sign, fetch /wp-json/wp/v2/ug/{wpId}?_embed
 * 3. Extract:
 *    - headword from title.rendered (strip <h1> and numeric prefix)
 *    - meanings from slug (split by `-` after leading number, then URL-decode)
 *    - primary media: <video src> in content.rendered, poster from wp:featuredmedia
 *    - topics: _embedded['wp:term'][i] where taxonomy === 'sedev' (slug decoded)
 *    - handshape: taxonomy 'garynkhelber' (slug + decoded name)
 *    - location:   taxonomy 'bairlal'
 *    - movement:   taxonomy 'khodolgoon'
 *    - palm:       taxonomy 'negesvelhoyorgar' (or 'palm' if present)
 *    - sourceLastModified from post.modified
 * 4. Write content/msl/*.json
 *
 * The redesigned mnsl.mn no longer exposes per-sign variant refs, example
 * sentences, or pagination in the REST API content, so those are empty.
 */
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as cheerio from 'cheerio';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const CONTENT_DIR = resolve(ROOT, 'content', 'msl');

const BASE = 'https://mnsl.mn';

interface WpMedia {
  id: number;
  source_url: string;
  media_details?: { sizes?: Record<string, { source_url: string }> };
}

interface WpTerm {
  id: number;
  taxonomy: string;
  slug: string;
  name: string;
  count?: number;
}

interface WpPost {
  id: number;
  slug: string;
  link: string;
  title: { rendered: string };
  content: { rendered: string };
  modified: string;
  _embedded?: {
    'wp:featuredmedia'?: WpMedia[];
    'wp:term'?: WpTerm[][];
  };
}

interface ExtractedComponentRef {
  slug: string;
  name: string;
}

interface ExtractedSign {
  id: number;
  sourceUrl: string;
  headword: string;
  meanings: string[];
  primaryMedia: {
    id: string;
    url: string;
    kind: 'sign_video';
    posterUrl?: string;
    label?: string;
  };
  topics: string[];
  components: {
    handshape: ExtractedComponentRef[];
    location: ExtractedComponentRef[];
    movement: ExtractedComponentRef[];
    palmOrientation: ExtractedComponentRef[];
    nonManualMarkers: ExtractedComponentRef[];
  };
  variants: never[];
  examples: never[];
  sourceLastModified?: string;
}

function decodeSlug(s: string): string {
  // Handle full URLs by decoding path segments individually
  if (s.includes('%') && (s.includes('/') || s.includes(':'))) {
    return s
      .split('/')
      .map((segment) => {
        try { return decodeURIComponent(segment); } catch { return segment; }
      })
      .join('/');
  }
  // Plain slug
  try { return decodeURIComponent(s); } catch { return s; }
}

async function fetchJson<T>(url: string): Promise<T | null> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'MSLingo-Sync/1.0 (+https://github.com/local/mslingo)' },
      });
      if (!res.ok) {
        if (res.status === 404) return null;
        if (res.status === 429) {
          await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
          continue;
        }
        throw new Error(`HTTP ${res.status} for ${url}`);
      }
      return (await res.json()) as T;
    } catch (err) {
      if (attempt === 2) throw err;
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
    }
  }
  return null;
}

function extractHeadword(titleHtml: string): string {
  const $ = cheerio.load(titleHtml);
  $('h1').each((_, el) => {
    const text = $(el).text().trim();
    const m = text.match(/^\d+\.\s*(.*)$/);
    if (m) {
      $(el).text(m[1]);
      return false;
    }
  });
  return $('h1').first().text().trim() || $('body').text().trim();
}

function extractMeaningsFromSlug(slug: string): string[] {
  // slug looks like: "1398-америк-улс" (after REST returns it, may be URL-encoded
  // as "1398-%d0%b0%d0%bc%d0%b5%d1%80%d0%b8%d0%ba-%d1%83%d0%bb%d1%81")
  const decoded = decodeSlug(slug);
  const stripped = decoded.replace(/^\d+-/, '');
  return stripped.split('-').filter(Boolean);
}

function extractPrimaryMedia(
  $: cheerio.CheerioAPI,
  featured: WpMedia | undefined,
): ExtractedSign['primaryMedia'] | null {
  // Video URL from <video src=...> in content
  const video = $('video[src]').first();
  const src = video.attr('src');
  if (!src) return null;

  // Poster: prefer wp:featuredmedia, fall back to <video poster>
  let posterUrl: string | undefined;
  if (featured?.source_url) {
    posterUrl = featured.source_url;
  } else if (video.attr('poster')) {
    posterUrl = video.attr('poster');
  }

  return {
    id: `media-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    url: src.startsWith('http') ? src : `${BASE}${src}`,
    kind: 'sign_video',
    ...(posterUrl
      ? { posterUrl: posterUrl.startsWith('http') ? posterUrl : `${BASE}${posterUrl}` }
      : {}),
  };
}

function collectTaxonomy(
  terms: WpTerm[] | undefined,
  taxonomy: string,
): ExtractedComponentRef[] {
  if (!terms) return [];
  const out: ExtractedComponentRef[] = [];
  for (const t of terms) {
    if (t.taxonomy === taxonomy) {
      out.push({ slug: t.slug, name: decodeSlug(t.name) });
    }
  }
  return out;
}

async function extractSign(wpId: number, slug: string): Promise<ExtractedSign | null> {
  const post = await fetchJson<WpPost>(`${BASE}/wp-json/wp/v2/ug/${wpId}?_embed`);
  if (!post) return null;

  const $ = cheerio.load(post.content.rendered);
  const headword = extractHeadword(post.title.rendered);
  const meanings = extractMeaningsFromSlug(slug);
  const featured = post._embedded?.['wp:featuredmedia']?.[0];
  const primaryMedia = extractPrimaryMedia($, featured);
  if (!primaryMedia) {
    console.warn(`Sign ${slug}: no primary video, skipping`);
    return null;
  }

  const allTerms = (post._embedded?.['wp:term'] ?? []).flat();

  return {
    id: wpId,
    sourceUrl: decodeSlug(post.link),
    headword,
    meanings,
    primaryMedia,
    topics: collectTaxonomy(allTerms, 'sedev').map((t) => t.slug),
    components: {
      handshape: collectTaxonomy(allTerms, 'garynkhelber'),
      location: collectTaxonomy(allTerms, 'bairlal'),
      movement: collectTaxonomy(allTerms, 'khodolgoon'),
      // mnsl.mn uses 'negesvelhoyorgar' for palm orientation (per the source map
      // and confirmed against the API). Some sites also use a 'palm' taxonomy;
      // include both if present.
      palmOrientation: [
        ...collectTaxonomy(allTerms, 'negesvelhoyorgar'),
        ...collectTaxonomy(allTerms, 'palm'),
      ],
      nonManualMarkers: collectTaxonomy(allTerms, 'dokhisonkhumuusiinner'),
    },
    variants: [],
    examples: [],
    sourceLastModified: post.modified,
  };
}

async function extractTaxonomy(endpoint: string) {
  const allTerms: { id: string; name: string; count?: number; parentId?: string }[] = [];
  let page = 1;
  while (true) {
    const res = await fetchJson<WpTerm[]>(`${BASE}/wp-json/wp/v2/${endpoint}?per_page=100&page=${page}`);
    if (!res || res.length === 0) break;
    for (const t of res) {
      allTerms.push({ id: t.slug, name: decodeSlug(t.name), count: t.count });
    }
    page++;
    if (res.length < 100) break;
    if (page > 30) break;
  }
  return allTerms;
}

async function enumerateAllSignsViaRest(): Promise<{ wpId: number; slug: string }[]> {
  const results: { wpId: number; slug: string }[] = [];
  let page = 1;
  while (page < 50) {
    const batch = await fetchJson<{ id: number; slug: string }[]>(
      `${BASE}/wp-json/wp/v2/ug?per_page=100&page=${page}&_fields=id,slug`,
    );
    if (!batch || batch.length === 0) break;
    for (const post of batch) {
      results.push({ wpId: post.id, slug: post.slug });
    }
    page++;
    if (batch.length < 100) break;
    await new Promise((r) => setTimeout(r, 200));
  }
  return results;
}

async function main() {
  if (!existsSync(CONTENT_DIR)) mkdirSync(CONTENT_DIR, { recursive: true });

  console.log('Enumerating signs via REST API...');
  const allSigns = await enumerateAllSignsViaRest();
  console.log(`Found ${allSigns.length} signs`);

  const signs: ExtractedSign[] = [];
  for (let i = 0; i < allSigns.length; i++) {
    const { wpId, slug } = allSigns[i];
    try {
      const s = await extractSign(wpId, slug);
      if (s) signs.push(s);
      if (i % 50 === 0) console.log(`  ... processed ${i}/${allSigns.length} (${signs.length} valid)`);
      if (i % 10 === 0) await new Promise((r) => setTimeout(r, 200));
    } catch (err) {
      console.error(`Sign ${slug}: ${(err as Error).message}`);
    }
  }

  console.log('Fetching topic taxonomy (sedev)...');
  const topics = await extractTaxonomy('sedev');
  console.log(`  ${topics.length} topics`);

  console.log('Fetching handshape taxonomy (garynkhelber)...');
  const handshapes = await extractTaxonomy('garynkhelber');
  console.log(`  ${handshapes.length} handshapes`);

  console.log('Fetching location taxonomy (bairlal)...');
  const locations = await extractTaxonomy('bairlal');
  console.log(`  ${locations.length} locations`);

  console.log('Fetching movement taxonomy (khodolgoon)...');
  const movements = await extractTaxonomy('khodolgoon');
  console.log(`  ${movements.length} movements`);

  console.log('Fetching palm/variant taxonomy (negesvelhoyorgar)...');
  const palms = await extractTaxonomy('negesvelhoyorgar');
  console.log(`  ${palms.length} palm/variant entries`);

  const stats = {
    signs: signs.length,
    variants: 0,
    topics: topics.length,
    examples: 0,
    grammarTopics: 0,
    fingerspellingEntries: 0,
    numberEntries: 0,
  };

  writeFileSync(
    resolve(CONTENT_DIR, 'meta.json'),
    JSON.stringify(
      { source: 'mnsl.mn', importedAt: new Date().toISOString(), schemaVersion: 1, statistics: stats },
      null,
      2,
    ),
  );
  writeFileSync(resolve(CONTENT_DIR, 'signs.json'), JSON.stringify({ signs }, null, 2));
  writeFileSync(resolve(CONTENT_DIR, 'topics.json'), JSON.stringify({ topics }, null, 2));
  writeFileSync(resolve(CONTENT_DIR, 'handshapes.json'), JSON.stringify({ handshapes }, null, 2));
  writeFileSync(resolve(CONTENT_DIR, 'locations.json'), JSON.stringify({ locations }, null, 2));
  writeFileSync(resolve(CONTENT_DIR, 'movements.json'), JSON.stringify({ movements }, null, 2));
  writeFileSync(resolve(CONTENT_DIR, 'palms.json'), JSON.stringify({ palms }, null, 2));

  console.log('\nDone.');
  console.log(`  signs: ${stats.signs}`);
  console.log(`  topics: ${stats.topics}`);
  console.log(`  handshapes: ${handshapes.length}`);
  console.log(`  locations: ${locations.length}`);
  console.log(`  movements: ${movements.length}`);
  console.log(`  palms: ${palms.length}`);
  console.log('\nNext: run `npm run validate:msl` to check integrity.');
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
