# Aerathon Wiki Style Guide

This is the repository-level standard for maintaining the Lore Vault. It complements
`CONTENT_GUIDE.md` and the in-world
`content/Aerathon - Eternal Labyrinths/II. The Living Atlas/Government Entities/Ministry of Delving Operations (MDO)/MDO Style and Filing Manual.md`.
The MDO manual governs the voice and filing shape of formal records; this guide governs files,
metadata, links, and cross-repository consistency.

## 1. Editorial Authority and Canon

Editorial decisions belong to the editor. Canon decisions belong to repository evidence.

- Freely correct structure, heading hierarchy, Markdown, obvious grammar, links, navigation, and
  equivalent metadata.
- Search related records before changing a fact about the world.
- Do not invent dates, populations, rulers, relationships, settlements, beliefs, political structures,
  magical rules, or other lore to complete a template.
- Prefer the subject's dedicated page, then clearly newer revisions, then repeated agreement across
  related pages. Preserve meaningful uncertainty when the evidence remains divided.
- Record unresolved consequential conflicts in `WIKI_REVIEW.md`; do not use that file for editorial
  cleanup that can be completed safely.

## 2. Archive Layers

The three published divisions have different evidence standards:

- **Annals & Antiquities:** reconstructed history and foundational scholarship. Conflicting accounts
  can be intentional and should remain visible.
- **The Living Atlas:** current reference material. Revise it when present-day consensus changes.
- **Monthly Ledger:** provisional and time-sensitive material. Add visible updates or supersession notes
  rather than silently rewriting an earlier report with later knowledge.

Public records represent what their compiler or institution knows. Keep setting truth, testimony,
inference, rumor, and restricted campaign knowledge distinct.

## 3. Files and Navigation

- Published lore lives in `content/Aerathon - Eternal Labyrinths/`.
- Use a stable, recognizable subject name for the filename. The H1 may be more descriptive, but true
  spelling changes belong in the filename and the older form should be retained as an alias. Add a
  parenthetical qualifier only to disambiguate otherwise identical names, as in `Dole (Capital).md`.
- Match the existing numbered folder taxonomy. Do not renumber or redesign a major branch casually.
- `Overview.md`, `index.md`, and `∅` overview pages have distinct established navigation roles. Preserve
  existing uses. A new folder landing page should normally be `index.md`; a named conceptual overview
  may use the established `∅ Name.md` pattern where its sibling category already does so.
- Keep UTF-8 punctuation, diacritics, apostrophes, and symbols intact. Repository text uses LF endings.
- Move a file only as a complete migration: find inbound references, move it, update links and embeds,
  then build.

## 4. Page Titles and Headings

- Authored subject pages should have one H1 (`# Page Title`). Navigation/index pages may instead rely
  on a frontmatter `title` rendered by Quartz.
- Do not bold an entire heading. Write `## I. Overview`, not `## **I. Overview**`.
- Use H2 for major sections, H3 for subsections, and H4 only for necessary detail beneath an H3.
- Formal long records normally use Roman numerals for H2 sections. Brief notices, profiles, indexes,
  and operational records may omit them.
- Preserve heading anchors when renaming a heading. Search for `[[Page#Old Heading]]` first.
- Use `---` for ordinary thematic breaks. Reserve the decorative MDO seal divider for authentic filing
  footers rather than routine section separation.
- Published pages should not contain empty headings. Remove unused template sections before filing.

## 5. Page Families and Templates

Templates live in `content/templates/` and are unpublished defaults, not mandatory forms.

| Page family                | Template               | Structural emphasis                                               |
| -------------------------- | ---------------------- | ----------------------------------------------------------------- |
| General or unusual record  | `file-record.md`       | Purpose, record, current assessment                               |
| Bestiary                   | `bestiary-entry.md`    | Identification, ecology, threat, delver guidance                  |
| Settlement                 | `city.md`              | Overview, geography, government, culture, economy, current status |
| Region or plane            | `region.md`            | Boundaries, people, government, travel, notable sites             |
| Delver or major character  | `delver.md`            | Profile, history, abilities, affiliations, status                 |
| Guild                      | `guild.md`             | Purpose, structure, leadership, operations, relationships         |
| Other organization         | `organization.md`      | Mandate, authority, structure, public role                        |
| Playable people or lineage | `lineage.md`           | Society, modern life, traits, sublineages, homelands              |
| Cultural system            | `culture.md`           | Scope, history, practice, variation, modern debate                |
| Historical reconstruction  | `historical-record.md` | Evidence, sequence, competing accounts, consequences              |
| Timeline                   | `timeline.md`          | Dated events, disputed dates, related records                     |
| Monthly Ledger item        | `ledger-item.md`       | Confirmed facts, uncertainty, action, visible updates             |

Use proportional structure. A small town, minor figure, short notice, or narrow custom should not acquire
empty sections merely to resemble a major record. Preserve unique sections containing subject-specific
information.

## 6. Frontmatter

Frontmatter is optional; do not add it mechanically to every legacy record.

Use it when it improves publishing, navigation, aliases, indexing, or status. Keep YAML at the beginning
of the file and use only supported, evidenced values.

Recommended order when fields are present:

```yaml
---
title: Display Title
description: One-sentence public description.
aliases:
  - Alternate Name
tags:
  - broad-topic
breadcrumbTitle: Short Label
recordType: Record Type
status: Status
classification: Classification
revision: Revision
facts: {}
related: []
quartz-properties: false
draft: false
---
```

- `title`: use when the filename is not the desired public display title.
- `description` or `summary`: concise public context; preserve the local page-family convention.
- `aliases`: alternate names, former names, abbreviations, or punctuation variants. Use a YAML list.
- `tags`: broad discovery categories, lowercase and hyphenated where needed. Reuse established tags;
  do not create a tag for every proper noun.
- `breadcrumbTitle`: use only when a shorter breadcrumb materially improves navigation.
- `recordType`, `status`, `classification`, `revision`, `facts`, and `related`: use for structured formal
  records and navigation pages when values are supported.
- `quartz-properties: false`: retain on navigation pages that intentionally hide the property panel.
- `draft: true`: required for incomplete authored pages that should not publish.

Never guess metadata. Unknown optional data should be omitted, described as unknown in prose when useful,
or preserved from the source.

## 7. Prose, Dates, and Terminology

- Preserve atmosphere, intentional voice, fantasy vocabulary, character personality, and cultural
  specificity. Improve clarity without flattening the setting into sterile documentation.
- Formal records should be measured, evidence-aware, and conscious of institutional limits. Dialogue
  and quotations should sound natural when spoken aloud.
- Use established canonical terms and capitalization: named institutions, eras, Labyrinths, Winds, and
  formal systems are proper nouns; generic descriptors are not.
- Spell out an institution on first use before its abbreviation unless the audience and format make the
  abbreviation self-evident.
- Use `A.D.` for Aerathonian years when a year is established, `c.` for approximate dates, and an en dash
  for ranges. Do not increase precision beyond the evidence.
- For living peoples, distinguish Folk, lineage, sublineage, homeland, citizenship, household, culture,
  faith, and profession. Do not turn physiology or shared practice into destiny or personality.

## 8. Links, Embeds, and Assets

- Use Obsidian wikilinks for important internal relationships: `[[Canonical Page]]` or
  `[[Canonical Page|natural text]]`.
- Qualify the path when duplicate filenames make the target ambiguous. Link the first meaningful mention
  rather than every repetition.
- Use `![[asset-name.png]]` for local image embeds and preserve custom blocks such as `aerathon-map`.
- A link to an unwritten page is allowed only for a genuine planned record and should be listed in
  `wiki-link-allowlist.json`. Broken old paths and accidental misspellings should be repaired.
- Place page-specific assets near the page or a nearby asset folder when practical. Shared world maps and
  reusable imagery may remain near the vault root.
- Prefer descriptive names for new assets. Do not rename legacy UUID assets without updating all embeds.

## 9. Indexes, Stubs, and Duplication

- An index should orient an unfamiliar reader, define its scope, and expose useful routes into the topic.
  Do not create an index that merely repeats Quartz's folder listing.
- When adding, moving, renaming, or removing a subject page, update its nearest maintained category index
  and any division-level browse list in the same change.
- Empty category indexes may state that no current records are filed. Empty subject files should be
  marked `draft: true` rather than published as blank pages.
- Merge pages only when they are demonstrably the same canonical subject and perspective. Preserve unique
  lore, aliases, and inbound links during a merge.
- Historical versions, public versus restricted records, and canon versus table/session material may be
  intentionally distinct even when their subjects overlap.
- Prefer a canonical full-treatment page with concise linked summaries elsewhere over copied sections.

## 10. Review and Validation

Before finishing a broad change:

1. Search names, aliases, dates, and linked entities across the vault.
2. Review the full diff for deleted lore, accidental canon changes, encoding damage, malformed YAML,
   heading corruption, and formatting churn.
3. Run `npm run wiki:format:check` and `npm run wiki:check` for repository-specific Markdown and link
   checks. Use `npm run wiki:format` to apply the safe heading/separator normalization.
4. Run `npm run content:check` or `npm run build` for broad content changes.
5. For Quartz code or configuration changes, also run `npm run check` and `npm test`.
6. Record only unresolved consequential canon questions in `WIKI_REVIEW.md`.
