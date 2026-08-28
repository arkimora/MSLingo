# MSLingo Content Review

This document tracks areas of the content package that need human review. The sync pipeline is conservative by design — it will not invent or "fix" linguistic information. When the parser cannot confidently extract something, the field is left empty and a note is added here.

## Schema version

Current: `1`

When fields are added or changed, the schema version is bumped. Local user progress is versioned independently (`PROGRESS_SCHEMA_VERSION`).

## Reviewer checklist

When the sync script is run (`npm run sync:mnsl`), check:

### Always
- [ ] Run `npm run validate:msl` — must pass with 0 errors
- [ ] Check `meta.json` `statistics.signs` matches mnsl.mn's current count
- [ ] Spot-check 5 random sign pages: open the app, compare with mnsl.mn

### Per category
- [ ] **Topics**: Are all the 1.x-20.x categories present in `topics.json`?
- [ ] **Handshape icons**: Do the G*/Х*/B*/1H* PNG URLs all resolve on mnsl.mn?
- [ ] **Variants**: For signs that have a "Дохио өөр ч утга адил" / "Дохио ижил ч утга өөр" section, is it captured?
- [ ] **Examples**: Are example sentence videos present for at least common signs?

### To be added
- [ ] **Fingerspelling alphabet** (35 Cyrillic letters) — extract from `/хур үсэг/`
- [ ] **Numbers** — extract from `/тоо/`
- [ ] **Mouth movements (амны хөдөлгөөн)** — should this be a per-sign tag or a separate taxonomy?
- [ ] **Mongolian traditional script** — the `.ms1` div is on the sign page; need to verify it's populated for all signs

## Areas of ambiguity

These should NOT be filled in by AI guessing. Each requires a human linguist to review:

1. **Handshape classification**: The PNG icons (G1.1, Х1_ШНХ, etc.) follow a naming convention but the glosses are not exposed in the URL. We store icon URLs but do not assign English/Mongolian handshape names.

2. **Variant coverage**: Some signs reference "Дохио өөр ч утга адил" but the link is to another sign page that itself has no media. This indicates a source-side gap.

3. **Example sentences**: When the example video is missing, the text is still captured. The Mongolian text is the authoritative translation.

4. **Negative examples / corpus validation**: We do not have a separate corpus of "non-sign" answers for distractors. All exercise distractors are real signs from the dictionary.

## What the app does NOT do

- It does not generate gloss notation.
- It does not infer parts of speech.
- It does not classify signs into a handshape taxonomy by name.
- It does not translate or paraphrase Mongolian.
- It does not invent relationships between signs.
