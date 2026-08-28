/**
 * Content validation for the MSLingo content package.
 *
 * Run with: npm run validate:msl
 *
 * Checks:
 * - Every JSON file matches its Zod schema
 * - No duplicate IDs within a file
 * - Variant cross-references resolve
 * - Topic references resolve
 * - Source URLs are mnsl.mn
 * - Reports missing media, orphaned refs
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ContentBundleSchema,
  SignsBundleSchema,
  type Sign,
  type ContentBundle,
} from '../src/content/schema';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = resolve(__dirname, '..', 'content', 'msl');

interface Report {
  errors: string[];
  warnings: string[];
  stats: Record<string, number>;
}

function readJson<T>(file: string): T {
  return JSON.parse(readFileSync(resolve(CONTENT_DIR, file), 'utf-8')) as T;
}

function main() {
  const report: Report = { errors: [], warnings: [], stats: {} };

  console.log('MSL content validation');
  console.log('='.repeat(50));

  // 1. Schema validation
  const meta = readJson<unknown>('meta.json');
  const signsBundle = readJson<unknown>('signs.json');
  const topicsBundle = readJson<unknown>('topics.json');
  const grammarBundle = readJson<unknown>('grammar.json');
  const fsBundle = readJson<unknown>('fingerspelling.json');
  const numbersBundle = readJson<unknown>('numbers.json');

  const signsParsed = SignsBundleSchema.safeParse(signsBundle);
  if (!signsParsed.success) {
    report.errors.push(`signs.json schema: ${signsParsed.error.message}`);
  }

  const bundle = ContentBundleSchema.safeParse({
    meta,
    signs: (signsParsed.success ? signsParsed.data.signs : []),
    topics: (topicsBundle as { topics: unknown[] }).topics,
    grammar: (grammarBundle as { grammar: unknown[] }).grammar,
    fingerspelling: (fsBundle as { fingerspelling: unknown[] }).fingerspelling,
    numbers: (numbersBundle as { numbers: unknown[] }).numbers,
  });

  if (!bundle.success) {
    report.errors.push(`content bundle: ${bundle.error.issues.map((i) => i.message).join(', ')}`);
  }

  if (!bundle.success) {
    printAndExit(report);
    return;
  }

  const b: ContentBundle = bundle.data;
  report.stats = {
    signs: b.signs.length,
    topics: b.topics.length,
    grammar: b.grammar.length,
    fingerspelling: b.fingerspelling.length,
    numbers: b.numbers.length,
  };

  // 2. Duplicate IDs
  const seenIds = new Set<number>();
  for (const s of b.signs) {
    if (seenIds.has(s.id)) {
      report.errors.push(`Duplicate sign ID: ${s.id}`);
    }
    seenIds.add(s.id);
  }

  const seenTopicIds = new Set<string>();
  for (const t of b.topics) {
    if (seenTopicIds.has(t.id)) {
      report.errors.push(`Duplicate topic ID: ${t.id}`);
    }
    seenTopicIds.add(t.id);
  }

  // 3. Cross-references
  for (const s of b.signs) {
    // Topic references
    for (const topicSlug of s.topics) {
      if (!seenTopicIds.has(topicSlug)) {
        report.warnings.push(`Sign ${s.id} references unknown topic "${topicSlug}"`);
      }
    }
    // Variant references
    for (const v of s.variants) {
      for (const rid of v.relatedSignIds) {
        if (!seenIds.has(rid)) {
          report.warnings.push(`Sign ${s.id} variant references unknown sign #${rid}`);
        }
      }
    }
    // Example references
    for (const ex of s.examples) {
      if (!seenIds.has(ex.signId)) {
        report.errors.push(`Example ${ex.id} references unknown sign #${ex.signId}`);
      }
    }
    // Source URL
    if (!s.sourceUrl.includes('mnsl.mn')) {
      report.warnings.push(`Sign ${s.id} sourceUrl is not mnsl.mn: ${s.sourceUrl}`);
    }
  }

  // 4. Variants count
  const totalVariants = b.signs.reduce((sum, s) => sum + s.variants.reduce((c, v) => c + v.relatedSignIds.length, 0), 0);
  report.stats.variants = totalVariants;
  const totalExamples = b.signs.reduce((sum, s) => sum + s.examples.length, 0);
  report.stats.examples = totalExamples;

  // 5. Media coverage
  const signsWithMedia = b.signs.filter((s) => s.primaryMedia.url).length;
  report.stats.signsWithMedia = signsWithMedia;

  printAndExit(report);
}

function printAndExit(report: Report) {
  console.log('\nStatistics:');
  for (const [k, v] of Object.entries(report.stats)) {
    console.log(`  ${k}: ${v}`);
  }

  if (report.warnings.length > 0) {
    console.log(`\nWarnings (${report.warnings.length}):`);
    for (const w of report.warnings.slice(0, 50)) {
      console.log(`  ⚠ ${w}`);
    }
    if (report.warnings.length > 50) {
      console.log(`  ... and ${report.warnings.length - 50} more`);
    }
  }

  if (report.errors.length > 0) {
    console.log(`\nErrors (${report.errors.length}):`);
    for (const e of report.errors) {
      console.log(`  ✗ ${e}`);
    }
    console.log('\nFAILED');
    process.exit(1);
  }

  console.log('\n✓ Content package is valid');
}

main();
