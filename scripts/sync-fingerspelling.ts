/**
 * Sync Mongolian fingerspelling alphabet from mnsl.mn /wp-json/wp/v2/khuruu-useg
 *
 * mnsl.mn has 35 letters (Cyrillic Mongolian alphabet) — each as a separate
 * "khuruu-useg" post with a video.
 *
 * Run with: npm run sync:fingerspelling
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const CONTENT_DIR = resolve(ROOT, 'content', 'msl');

const REST = 'https://mnsl.mn/wp-json/wp/v2';

interface KhuPost {
  id: number;
  slug: string;
  title: { rendered: string };
  content: { rendered: string };
  featured_media: number;
  _embedded?: {
    'wp:featuredmedia'?: Array<{ source_url: string }>;
  };
}

interface FingerspellingEntry {
  letter: string;
  media: {
    id: string;
    url: string;
    kind: 'sign_video';
    posterUrl?: string;
    label?: string;
  };
  notes?: string;
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

async function main() {
  mkdirSync(CONTENT_DIR, { recursive: true });

  console.log('Fetching "khuruu-useg" posts from mnsl.mn...');
  const resp = await fetch(`${REST}/khuruu-useg?per_page=100&_embed`);
  if (!resp.ok) throw new Error(`Failed: ${resp.status}`);
  const posts: KhuPost[] = await resp.json();
  console.log(`Fetched ${posts.length} fingerspelling entries.`);

  const entries: FingerspellingEntry[] = [];
  for (const post of posts) {
    const videoMatch = post.content.rendered.match(/<video[^>]*src="([^"]+)"/);
    const posterMatch = post.content.rendered.match(/<video[^>]*poster="([^"]+)"/);
    if (!videoMatch) {
      console.warn(`  No video for #${post.id} ${post.slug}`);
      continue;
    }
    // Slug is URL-encoded letter, e.g. %d0%b0 = "а"
    const letter = decodeURIComponent(post.slug);

    entries.push({
      letter,
      media: {
        id: String(post.id),
        url: videoMatch[1],
        kind: 'sign_video',
        posterUrl: posterMatch?.[1] ?? post._embedded?.['wp:featuredmedia']?.[0]?.source_url,
        label: stripHtml(post.title.rendered),
      },
    });
  }

  // Sort by Mongolian alphabet order (Cyrillic, simple string sort matches alpha order)
  entries.sort((a, b) => a.letter.localeCompare(b.letter, 'mn'));

  const out = { fingerspelling: entries };
  const outPath = resolve(CONTENT_DIR, 'fingerspelling.json');
  writeFileSync(outPath, JSON.stringify(out, null, 0), 'utf-8');
  console.log(`\nWrote ${entries.length} fingerspelling entries to ${outPath}`);
  console.log(`Letters: ${entries.map((e) => e.letter).join(', ')}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
