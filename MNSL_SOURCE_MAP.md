# MNSL Source Map

> Investigation of https://mnsl.mn/ — the authoritative source for Mongolian Sign Language content in MSLingo. Last investigated: 2026-08-27.

## 1. Site structure

WordPress site (bootscore child theme) with several custom post types and custom taxonomies. WordPress REST API available at `https://mnsl.mn/wp-json/`. We do **not** use the REST API at runtime — content is imported once via `npm run sync:mnsl` and packaged with the build.

### Sitemaps

- Sitemap index: `https://mnsl.mn/wp-sitemap.xml`
- Pages: `wp-sitemap-posts-page-1.xml`
- Sign custom post type (`ug`): `wp-sitemap-posts-ug-1.xml` — **1,398 signs, IDs 1-1398**
- Fingerspelling (`khuruu-useg`): `wp-sitemap-posts-khuruu-useg-1.xml`
- Numbers (`too`): `wp-sitemap-posts-too-1.xml`
- Taxonomies: handshape (`garynkhelber`), movement (`khodolgoon`), location (`bairlal`), variant/polysemy (`negesvelhoyorgar`), topic (`sedev`), mouth movements (`dokhisonkhumuusiinner`), number category (`sedev-too`)

### Top-level navigation (as seen in menu)

- **Эхлэл** (Home) — `/`
- **Мэдээлэл** (Information) — `/мэдээлэл/`
  - Харилцаа ба жам ёсны хэл (Communication and etiquette)
  - Дохионы хэл ба ярианы хэл (Sign language and spoken language)
  - Сонсголгүй хүмүүс ба дохионы хэлнүүд (Deaf people and sign languages)
  - Дохионы хэлний хэрэглээ ба хувилбар (Sign language use and variants)
  - Сонсголгүйн соёл (Deaf culture)
  - Монгол дохионы хэлний хөгжлийн түүх (History of MSL development)
  - Талархал (Acknowledgments)
- **Толь бичиг** (Dictionary) — `/ug/` (post type archive with sidebar filters)
- **Толь бичиг /А-Я/** (Alphabetical dictionary) — `/ugw/`
- **Дүрэм** (Rules/Grammar) — `/дүрэм/`
  - Дохионы хэлний стандарт ба дохионы хэлний хувилбар (Sign language standard and variants)
  - Дохионы бүтэц (Sign structure)
  - Амны хайрцгийн хөдөлгөөн ба уруулын хэлбэр (Mouth movement and lip shape)
- **Тоо** (Numbers) — `/тоо/`
- **Хурууны үсэг** (Fingerspelling) — `/хур үсэг/`
- **Холбоо барих** (Contact) — `/холбоо барих/`

## 2. Sign page structure (`/ug/{id}-{slug}/`)

The sign page contains the following data, which the importer must extract:

| Field | Source in HTML | Notes |
|---|---|---|
| ID | WordPress `postid-XXXX` in `body` class | Numeric; matches the `ug/{id}-` prefix in URL |
| Slug | URL slug | URL-encoded Cyrillic, hyphen-separated synonyms |
| **Headword (Mongolian)** | `<h1>` after the numeric prefix | e.g. "хол, алс хол, буйд" |
| **Traditional Mongolian script** | `.ms1` div near the headword | e.g. "ᠬᠤᠯᠠ᠂ ᠠᠯᠤᠰ ᠬᠤᠯᠠ᠂ ᠪᠥᠢᠳᠠ" |
| **Sign video (primary)** | `<video src="https://mnsl.mn/wp-content/uploads/.../{NNNN}_{NAME}.mp4">` | WordPress upload dir |
| Poster image | `poster=".../{NNNN}_{NAME}.jpg"` | Static thumbnail |
| Speed slider | `input.vs_slider` | UI only — not data |
| **Handshape icons** | `<div class="ugtaxo"><img class="thumbs" src=".../G*.png|Х*.png|B*.png|1H*.png">` | Image files for handshape, location, movement, palm orientation |
| **"Дохио өөр ч утга адил"** | `.ug-titles:contains("Дохио өөр ч утга адил")` + `.ug-contents` | "Different sign, same meaning" — references to other signs (text or `-` if none) |
| **"Дохио ижил ч утга өөр"** | `.ug-titles:contains("Дохио ижил ч утга өөр")` + `.ug-contents` | "Same sign, different meaning" |
| **Example sentence** | `.ug-titles:contains("Тайлбар өгүүлбэрийн бичлэгийн нэр")` | Modal video + Mongolian translation text. The title phrase means "Name of the example sentence recording". |
| **Topic(s)** | `.ug-titles:contains("Хамрах сэдэв")` + `<a href="/sedev/...">...</a>` | One or more categories with counts |
| **Pagination** | `.pagination a[rel=prev|next]` | Adjacent signs in dictionary order |

### Important URL patterns

- Sign: `https://mnsl.mn/ug/{id}-{cyrillic-slug}/`
- Topic: `https://mnsl.mn/sedev/{id}-{cyrillic-slug}/`
- Handshape (likely): `https://mnsl.mn/garynkhelber/...`
- WordPress REST: `https://mnsl.mn/wp-json/wp/v2/ug/{id}` (returns JSON for a single sign)

### Media hosting

All media is hosted at `https://mnsl.mn/wp-content/uploads/...` directly. Videos are MP4. Thumbnails (poster images) are JPG. Handshape/location/movement/palm-orientation icons are PNG in `wp-content/uploads/2024/09/` with predictable filenames like `G1.1.png` (handshape), `Х1_ШНХ.png` (location), `Х3_БУХ.png`, `B1_ТОЛ.png` (palm), `1H_1.png` (movement).

## 3. Topic taxonomy (sedev)

Complete list of topics with sign counts (from the sidebar filter dropdown):

1. Харилцан ярианд өргөн хэрэглэгддэг дохио (Widely used signs) — 515
   - 1.1. Түгээмэл хэрэглэдэг дохио (134)
   - 1.2. Үйлдлийг илэрхийлсэн дохио (257) — Action signs
   - 1.3. Шинж, чанар байдлыг илэрхийлсэн дохио (70) — Adjective/quality signs
   - 1.4. Асуултыг илэрхийлсэн дохио (18) — Question signs
   - 1.5. Үгүйсгэх үйлдлийг илэрхийлсэн дохио (36) — Negation signs
2. Мэндчилгээ ба хүн (Greetings and people) — 67
   - 2.1. Мэндчилгээ, баяр ёслол (14)
   - 2.2. Гэр бүл (18) — Family
   - 2.3. Хүн (35) — Person
3. Боловсрол (Education) — 100
   - 3.1. Сургууль, цэцэрлэг (40)
   - 3.2. Хичээлийн хэрэгсэл (31)
   - 3.3. Боловсролтой холбоотой дохио (29)
4. Хөдөлмөр эрхлэлт (Employment) — 40
   - 4.1. Ажил, мэргэжил (18)
   - 4.2. Ажилтай холбоотой үгс (9)
   - 4.3. Бизнес, хөдөлмөр эрхлэлттэй холбоотой дохио (13)
5. Эрүүл мэнд (Health) — 44
   - 5.1. Бие эрхтэн (30) — Body parts
   - 5.2. Эмчилгээ, эрүүл мэндтэй холбоотой дохио (14)
6. Сэтгэл хөдлөл (Emotion) — 85
7. Амьдрах орчин (Living environment) — 84
   - 7.1. Гэр орон, гэрийн эд зүйлс (24)
   - 7.2. Гэрийн тавилга (8)
   - 7.3. Гал тогооны хэрэгсэл (14)
   - 7.4. Цахилгаан хэрэгсэл (17)
   - 7.5. Ариун цэврийн хэрэгсэл (21)
8. Хувцас, хэрэглэл (Clothing, accessories) — 26
   - 8.1. Хувцас (17)
   - 8.2. Эдлэл хэрэгсэл (3)
   - 8.3. Гоо сайхны бараа (6)
9. Хоол хүнсний бүтээгдэхүүн (Food) — 87
   - 9.1-9.9 sub-categories
10. Өнгө ба хэлбэр дүрс, хэмжээ (Color, shape, size) — 26
    - 10.1. Өнгө (13)
    - 10.2. Хэлбэр дүрс (2)
    - 10.3. Хэмжээ ба хэмжих нэгж (11)
11. Ан амьтад (Animals) — 73
    - 11.1-11.5 sub-categories
12. Байгаль (Nature) — 28
13. Цаг хугацаа, орон зай (Time, space) — 63
    - 13.1. Цаг хугацаа (44)
    - 13.2. Орон зай (8)
    - 13.3. Улирал (11)
14. Техник технологи (Technology) — 25
15. Спорт (Sports) — 23
16. Тоглоом (Games) — 6
17. Урлаг, урлал (Arts) — 22
18. Тээврийн хэрэгсэл (Transport) — 19
19. Нийгмийн орчин (Social environment) — 30
    - 19.1-19.4
20. Газрын нэр (Place names) — 35
    - 20.1. Улс орон (15)

Counts total to ~1,398 — consistent with the dictionary size.

## 4. Slug-as-synonyms convention

The URL slug itself encodes the sign's meanings separated by hyphens:
- `2-хол-алс-хол-буйд` → meanings: "хол" (far), "алс хол" (distant), "буйд" (somewhere far)
- `4-анхаарах-анхаарал-хандуулах` → "анхаарах" (to pay attention), "анхаарал" (attention), "хандуулах" (to direct attention)
- `1-дуудах-нааш-ир-хүрээд-ир` → four meanings

The title in `<h1>` is usually a comma-separated version of the same synonyms. This is **first-class linguistic data** — must be parsed and preserved.

## 5. Field name dictionary (for the importer)

- "хол" = far (distance)
- "алс хол" = far away
- "буйд" = distant, far-off
- "анхаарах" = to pay attention
- "хайх" = to search
- "элбэг" = abundant
- "дуудах" = to call
- "үдэш" = evening
- "орой" = late

The dictionary is ordered alphabetically (Cyrillic order), which matches the `/ugw/` alphabetical view.

## 6. What must NOT be inferred

- **Variants**: mnsl.mn explicitly discusses variants under "Дохионы хэлний хэрэглээ ба хувилбар" but the per-sign page only shows ONE video. Variant relationships (when present) are exposed by the "Дохио өөр ч утга адил" / "Дохио ижил ч утга өөр" cross-references. We do not invent variant videos.
- **Handshape names**: Image files are referenced (G1.1.png, etc.) but mnsl.mn's naming convention is opaque. We store the icon URLs and let the UI show the icons; we do not assign invented handshape names.
- **Numeric taxonomies** (handshape, location, movement, palm orientation, mouth movements) are present as separate sitemaps but their term glosses need to be imported separately. We treat them as a fifth field on each sign: a list of icon URLs.
- **Mouth movements** have a dedicated taxonomy `dokhisonkhumuusiinner` and a dedicated educational page `/дүрэм/амны хайрцгийн хөдөлгөөн ба уруулын хэлбэр/`. The per-sign page does not directly tag mouth movements on each sign — they must be cross-referenced from the taxonomy pages if the site provides that mapping.
- **Mongolian sign has a grammar section** ("Дүрэм") with three subpages. We import them as `grammar.json` — but only the raw Mongolian text. We do not invent or simplify the explanations.

## 7. Recommended import strategy

1. Read `wp-sitemap-posts-ug-1.xml` to enumerate sign IDs and slugs.
2. For each sign ID, fetch the WP REST API: `https://mnsl.mn/wp-json/wp/v2/ug/{id}?_embed` — this returns a structured JSON with title, content (HTML), taxonomy terms, and embedded media, which is **far more robust** than HTML scraping.
3. For taxonomy lists (topic, handshape, etc.), use `wp-json/wp/v2/sedev`, `wp-json/wp/v2/garynkhelber`, etc.
4. For media, store the **mnsl.mn URL** (not downloaded). Service worker caches on demand.
5. Write normalized `content/msl/*.json` files. Validate with `npm run validate:msl`.

## 8. What the app does NOT do (per spec)

- We do not download sign videos to the device. The user (or service worker) fetches them on first view; cache-first thereafter.
- We do not invent sign variants, examples, or linguistic relationships. Every entry traces to mnsl.mn.
- We do not modify the source — the content package is read-only at runtime.
