/**
 * Sync numbers from mnsl.mn /wp-json/wp/v2/too endpoint
 *
 * mnsl.mn has a "too" post type (тоо = numbers) with numbers 1-9, 10-90 by tens,
 * 100-900 by hundreds, then millions, etc. Each entry has a video.
 *
 * Run with: npx tsx scripts/sync-numbers.ts
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const CONTENT_DIR = resolve(ROOT, 'content', 'msl');

const BASE = 'https://mnsl.mn';
const REST = `${BASE}/wp-json/wp/v2`;

interface TooPost {
  id: number;
  slug: string;
  title: { rendered: string };
  content: { rendered: string };
  featured_media: number;
  _embedded?: {
    'wp:featuredmedia'?: Array<{ source_url: string }>;
  };
}

interface SedevTooTerm {
  id: number;
  name: string;
  slug: string;
  count: number;
}

interface NumberEntry {
  value: number | string;
  context?: string;
  media: {
    id: string;
    url: string;
    kind: 'sign_video';
    posterUrl?: string;
    label?: string;
  };
}

function decodeHtml(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

function stripHtml(html: string): string {
  return decodeHtml(html.replace(/<[^>]+>/g, '').trim());
}

/** Parse a number value from a slug like "100-naisan-myanga" → 100, or title "1." → 1. */
function parseNumber(slug: string, title: string): number | null {
  // Title usually starts with the number followed by a period or space
  const titleMatch = stripHtml(title).match(/^(\d+(?:[,.\s]\d+)*(?:[.,]\d+)?)/);
  if (titleMatch) {
    const cleaned = titleMatch[1].replace(/[,\s]/g, '');
    const n = Number(cleaned);
    if (!Number.isNaN(n)) return n;
  }
  // Slug fallback: take the leading digits
  const slugMatch = slug.match(/^(\d+)/);
  if (slugMatch) return Number(slugMatch[1]);
  return null;
}

/** Get a context label from the sedev-too taxonomy term names. */
function contextLabel(terms: SedevTooTerm[]): string | undefined {
  if (terms.length === 0) return undefined;
  // Take the deepest term (most specific)
  const sorted = [...terms].sort((a, b) => b.slug.length - a.slug.length);
  return sorted[0].name;
}

async function main() {
  mkdirSync(CONTENT_DIR, { recursive: true });

  console.log('Fetching all "too" posts from mnsl.mn...');
  // 1. Fetch all terms in sedev-too to get context labels
  const termResp = await fetch(`${REST}/sedev-too?per_page=50`);
  const terms: SedevTooTerm[] = termResp.ok ? await termResp.json() : [];
  const termById = new Map(terms.map((t) => [t.id, t]));

  // 2. Fetch all too posts (paginated, max 100/page)
  const allPosts: TooPost[] = [];
  for (let page = 1; page <= 20; page++) {
    const url = `${REST}/too?per_page=100&page=${page}&_embed`;
    const resp = await fetch(url);
    if (!resp.ok) {
      if (resp.status === 400) break; // end of pagination
      throw new Error(`Failed to fetch ${url}: ${resp.status}`);
    }
    const posts: TooPost[] = await resp.json();
    allPosts.push(...posts);
    if (posts.length < 100) break;
  }
  console.log(`Fetched ${allPosts.length} number entries.`);

  // 3. For each post, extract media and parse number value
  const entries: NumberEntry[] = [];
  for (const post of allPosts) {
    const videoMatch = post.content.rendered.match(/<video[^>]*src="([^"]+)"/);
    const posterMatch = post.content.rendered.match(/<video[^>]*poster="([^"]+)"/);
    if (!videoMatch) {
      console.warn(`  No video found for #${post.id} ${post.slug}`);
      continue;
    }
    const videoUrl = videoMatch[1];
    const posterUrl = posterMatch?.[1] ?? post._embedded?.['wp:featuredmedia']?.[0]?.source_url;

    const value = parseNumber(post.slug, post.title.rendered);
    if (value === null) {
      console.warn(`  Could not parse number from slug=${post.slug} title=${post.title.rendered}`);
      continue;
    }

    entries.push({
      value,
      media: {
        id: String(post.id),
        url: videoUrl,
        kind: 'sign_video',
        posterUrl,
        label: stripHtml(post.title.rendered),
      },
    });
  }

  // 4. Sort by numeric value, then dedupe
  entries.sort((a, b) => {
    const av = typeof a.value === 'number' ? a.value : 0;
    const bv = typeof b.value === 'number' ? b.value : 0;
    return av - bv;
  });

  const out = { numbers: entries };
  const outPath = resolve(CONTENT_DIR, 'numbers.json');
  writeFileSync(outPath, JSON.stringify(out, null, 0), 'utf-8');
  console.log(`\nWrote ${entries.length} number entries to ${outPath}`);
  console.log(`First 5: ${entries.slice(0, 5).map((e) => e.value).join(', ')}`);
  console.log(`Last 5: ${entries.slice(-5).map((e) => e.value).join(', ')}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
