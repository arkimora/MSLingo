/**
 * Zod schemas for the MSLingo content package.
 *
 * These define the SHAPE of `content/msl/*.json`. Anything you add here
 * must be derivable from mnsl.mn. Do not invent fields.
 */
import { z } from 'zod';

// ─────────────────────────────────────────────────────────────────────────
// Media — video or image reference, hosted on mnsl.mn
// ─────────────────────────────────────────────────────────────────────────
export const MediaSchema = z.object({
  /** Stable ID — derived from WP postid */
  id: z.string(),
  /** Original URL on mnsl.mn */
  url: z.string().url(),
  /** What kind of media this is */
  kind: z.enum(['sign_video', 'example_video', 'poster_image', 'icon']),
  /** Optional poster image */
  posterUrl: z.string().url().optional(),
  /** Description or label (e.g. "ХОЛ", "Амны хөдөлгөөн") */
  label: z.string().optional(),
});
export type Media = z.infer<typeof MediaSchema>;

// ─────────────────────────────────────────────────────────────────────────
// Sign component reference (one of handshape / location / movement / palm / NMM)
// ─────────────────────────────────────────────────────────────────────────
export const SignComponentRefSchema = z.object({
  /** Slug from mnsl.mn taxonomy (e.g. "g3-1") */
  slug: z.string(),
  /** Human-readable name as published on mnsl.mn (URL-decoded) */
  name: z.string(),
});
export type SignComponentRef = z.infer<typeof SignComponentRefSchema>;

// ─────────────────────────────────────────────────────────────────────────
// Sign components — five categories, each a list of taxonomy references
// ─────────────────────────────────────────────────────────────────────────
export const SignComponentsSchema = z.object({
  handshape: z.array(SignComponentRefSchema).default([]),
  location: z.array(SignComponentRefSchema).default([]),
  movement: z.array(SignComponentRefSchema).default([]),
  palmOrientation: z.array(SignComponentRefSchema).default([]),
  nonManualMarkers: z.array(SignComponentRefSchema).default([]),
});
export type SignComponents = z.infer<typeof SignComponentsSchema>;

// ─────────────────────────────────────────────────────────────────────────
// Variants (different sign for the same meaning, or same sign with different meaning)
// ─────────────────────────────────────────────────────────────────────────
export const VariantRelationSchema = z.object({
  /** Type of cross-reference */
  type: z.enum(['different_sign_same_meaning', 'same_sign_different_meaning']),
  /** WordPress post IDs of related signs */
  relatedSignIds: z.array(z.number().int().positive()),
});
export type VariantRelation = z.infer<typeof VariantRelationSchema>;

// ─────────────────────────────────────────────────────────────────────────
// Example sentence
// ─────────────────────────────────────────────────────────────────────────
export const ExampleSchema = z.object({
  id: z.string(),
  signId: z.number().int().positive(),
  /** Mongolian text of the example sentence */
  mongolian: z.string().min(1),
  /** Optional MSL gloss */
  mslGloss: z.string().optional(),
  /** Example video (mnsl.mn hosted) */
  video: MediaSchema.optional(),
});
export type Example = z.infer<typeof ExampleSchema>;

// ─────────────────────────────────────────────────────────────────────────
// Sign — the primary content type
// ─────────────────────────────────────────────────────────────────────────
export const SignSchema = z.object({
  /** Stable ID matching mnsl.mn postid (e.g. 2) */
  id: z.number().int().positive(),
  /** Source URL on mnsl.mn */
  sourceUrl: z.string().url(),
  /** Primary headword — usually the first meaning, in Mongolian Cyrillic */
  headword: z.string().min(1),
  /** Traditional Mongolian script (where present) */
  traditionalScript: z.string().optional(),
  /** All meanings, in order of appearance in the source (slug-as-synonyms) */
  meanings: z.array(z.string().min(1)).min(1),
  /** Primary sign video (the one shown on the page) */
  primaryMedia: MediaSchema,
  /** Topic/taxonomy slugs from sedev */
  topics: z.array(z.string()),
  /** Sign component icons */
  components: SignComponentsSchema,
  /** Variant relationships (extracted from cross-reference fields) */
  variants: z.array(VariantRelationSchema).default([]),
  /** Examples */
  examples: z.array(ExampleSchema).default([]),
  /** Last modified date of the source */
  sourceLastModified: z.string().optional(),
});
export type Sign = z.infer<typeof SignSchema>;

// ─────────────────────────────────────────────────────────────────────────
// Topic / category
// ─────────────────────────────────────────────────────────────────────────
export const TopicSchema = z.object({
  id: z.string(), // slug
  name: z.string(),
  parentId: z.string().optional(),
  count: z.number().int().nonnegative().optional(),
});
export type Topic = z.infer<typeof TopicSchema>;

// ─────────────────────────────────────────────────────────────────────────
// Grammar topic
// ─────────────────────────────────────────────────────────────────────────
export const GrammarTopicSchema = z.object({
  id: z.string(),
  title: z.string(),
  body: z.string(), // raw Mongolian HTML/text — preserved as-is
  sourceUrl: z.string().url(),
});
export type GrammarTopic = z.infer<typeof GrammarTopicSchema>;

// ─────────────────────────────────────────────────────────────────────────
// Taxonomy entries (handshape / location / movement / palm / NMM)
// ─────────────────────────────────────────────────────────────────────────
export const TaxonomyEntrySchema = z.object({
  id: z.string(), // slug from mnsl.mn
  name: z.string(),
  count: z.number().int().nonnegative().optional(),
  parentId: z.string().optional(),
});
export type TaxonomyEntry = z.infer<typeof TaxonomyEntrySchema>;

// ─────────────────────────────────────────────────────────────────────────
// Fingerspelling entry
// ─────────────────────────────────────────────────────────────────────────
export const FingerspellingEntrySchema = z.object({
  letter: z.string().min(1),
  media: MediaSchema,
  notes: z.string().optional(),
});
export type FingerspellingEntry = z.infer<typeof FingerspellingEntrySchema>;

// ─────────────────────────────────────────────────────────────────────────
// Number entry
// ─────────────────────────────────────────────────────────────────────────
export const NumberEntrySchema = z.object({
  value: z.union([z.number().int(), z.string()]),
  context: z.string().optional(),
  media: MediaSchema,
});
export type NumberEntry = z.infer<typeof NumberEntrySchema>;

// ─────────────────────────────────────────────────────────────────────────
// Content metadata
// ─────────────────────────────────────────────────────────────────────────
export const ContentMetaSchema = z.object({
  source: z.literal('mnsl.mn'),
  importedAt: z.string(), // ISO date
  schemaVersion: z.number().int().positive(),
  statistics: z.object({
    signs: z.number().int().nonnegative(),
    variants: z.number().int().nonnegative(),
    topics: z.number().int().nonnegative(),
    examples: z.number().int().nonnegative(),
    grammarTopics: z.number().int().nonnegative(),
    fingerspellingEntries: z.number().int().nonnegative(),
    numberEntries: z.number().int().nonnegative(),
  }),
});
export type ContentMeta = z.infer<typeof ContentMetaSchema>;

// ─────────────────────────────────────────────────────────────────────────
// Bundles (the files in content/msl/)
// ─────────────────────────────────────────────────────────────────────────
export const SignsBundleSchema = z.object({
  signs: z.array(SignSchema),
});
export type SignsBundle = z.infer<typeof SignsBundleSchema>;

export const ContentBundleSchema = z.object({
  meta: ContentMetaSchema,
  signs: z.array(SignSchema),
  topics: z.array(TopicSchema),
  grammar: z.array(GrammarTopicSchema),
  fingerspelling: z.array(FingerspellingEntrySchema),
  numbers: z.array(NumberEntrySchema),
});
export type ContentBundle = z.infer<typeof ContentBundleSchema>;
