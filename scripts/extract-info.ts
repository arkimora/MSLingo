/**
 * Helper that the sync script can also call: extract the
 * мэдээлэл, дүрэм, fingerspelling, numbers sections.
 *
 * Run with: npx tsx scripts/extract-info.ts
 */
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as cheerio from 'cheerio';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = resolve(__dirname, '..', 'content', 'msl');
const BASE = 'https://mnsl.mn';

async function fetchHtml(url: string): Promise<string | null> {
  for (let i = 0; i < 3; i++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'MSLingo-Sync/1.0' } });
      if (!res.ok) return null;
      return await res.text();
    } catch {
      await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
    }
  }
  return null;
}

const INFO_PAGES = [
  { id: 'hariltsaa', title: 'Харилцаа ба жам ёсны хэл', path: 'харилцаа-ба-жам-ёсны-хэл' },
  { id: 'dokhion-khel-ba-yarian', title: 'Дохионы хэл ба ярианы хэл', path: 'дохионы-хэл-ба-ярианы-хэл' },
  { id: 'sonsgologvi', title: 'Сонсголгүй хүмүүс ба дохионы хэлнүүд', path: 'сонсголгүй-хүмүүс-ба-дохионы-хэлнүүд' },
  { id: 'variant', title: 'Дохионы хэлний хэрэглээ ба хувилбар', path: 'дохионы-хэлний-хэрэглээ-ба-хувилбар' },
  { id: 'culture', title: 'Сонсголгүйн соёл', path: 'сонсголгүйн-соёл' },
  { id: 'history', title: 'Монгол дохионы хэлний хөгжлийн түүх', path: 'монгол-дохионы-хэлний-хөгжлийн-түүх' },
  { id: 'thanks', title: 'Талархал', path: 'талархал' },
  { id: 'grammar-standard', title: 'Дохионы хэлний стандарт ба дохионы хэлний хувилбар', path: 'дохионы-хэлний-стандарт-ба-дохионы-хэлний-хувилбар' },
  { id: 'sign-structure', title: 'Дохионы бүтэц', path: 'дохионы-бүтэц' },
  { id: 'mouth-movement', title: 'Амны хайрцгийн хөдөлгөөн ба уруулын хэлбэр', path: 'амны-хайрцгийн-хөдөлгөөн-ба-уруулын-хэлбэр' },
];

async function main() {
  if (!existsSync(CONTENT_DIR)) mkdirSync(CONTENT_DIR, { recursive: true });

  console.log('Extracting info/grammar pages...');
  const grammar = [];
  for (const p of INFO_PAGES) {
    const html = await fetchHtml(`${BASE}/${encodeURI(p.path)}/`);
    if (!html) {
      console.warn(`Failed: ${p.path}`);
      continue;
    }
    const $ = cheerio.load(html);
    const body = $('.entry-content').html() ?? $('main').html() ?? '';
    grammar.push({
      id: p.id,
      title: p.title,
      body,
      sourceUrl: `${BASE}/${encodeURI(p.path)}/`,
    });
    console.log(`  ✓ ${p.title}`);
    await new Promise((r) => setTimeout(r, 300));
  }
  writeFileSync(resolve(CONTENT_DIR, 'grammar.json'), JSON.stringify({ grammar }, null, 2));
  console.log(`Wrote ${grammar.length} grammar/info topics.`);
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
