# Aerathon Wiki Style Guide

This is the repository-level standard for maintaining the Lore Vault. It complements
`CONTENT_GUIDE.md` and the in-world
`content/Aerathon - Eternal Labyrinths/II. The Living Atlas/05. Governments & Geopolitics/I. Continental Institutions/1. Ministry of Delving Operations (MDO)/03a. MDO Style and Filing Manual.md`.
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
- Match the existing numbered folder taxonomy. Archive divisions and main category folders use Roman
  numerals; top-level series and branch folders use Arabic numerals. Authored record files use stable,
  zero-padded identifiers such as `01.`, `02.`, and `03.`.
- Use lettered record suffixes such as `01a.` only for a genuine subrecord of `01.`. Peer records use
  their own numbers. `Overview.md`, `index.md`, and `∅` conceptual overview pages remain unnumbered.
- Assign filing order intentionally: chronology for eras, operational sequence for procedures,
  capitals before other settlements, and a declared alphabetical or classificatory order for
  registries. Do not renumber or redesign a major branch casually.
- Beneath `I. Aerathon`, file the five Greater Regions directly as `1. Al'Ar`, `2. Allemance`,
  `3. Arneria`, `4. Oria`, and `5. Vinyot`. Do not add an intermediate Greater Regions wrapper.
- Within each Greater Region, use `1. Subregions` for internal territories, `2. Settlements` for the
  complete civic master index, `3. Geography & Landmarks` for
  authenticated regional features, and `4. Life, Customs & Identity` for practices and identities
  shaped by place. Keep folder-note titles concise; the parent region already supplies the geographic
  context in the explorer.
- Number subregion folders with unpadded Arabic numerals beneath their parent region. File
  `1. Greater [Region]` first as the archival territory for settlements and places not assigned to a
  narrower named subregion. “Greater” describes filing scope, not political rank, cultural primacy, or
  a separate government. Each maintained subregion uses `∅ Name` first, then `1. Settlements` and
  `2. Life, Customs & Identity`. The overview
  carries the compact geographic orientation, so do not create a separate subregional geography shelf.
  Subregional overviews should normally be shorter than Greater Region overviews. A sparse section uses
  a meaningful `index.md` to state the authenticated record and its open questions; never invent entries
  or leave an empty folder merely to complete the pattern.
- Keep one regional settlement index as the complete civic register, grouped by subregion. Every
  canonical settlement record belongs beneath one authenticated subregion. Use `Greater [Region]` for
  region-wide, threshold, disputed, and presently unassigned settlements until a narrower placement is
  authenticated. The regional `2. Settlements` folder contains the master `index.md`, not duplicate or
  unassigned settlement articles.
- Use a regional-life shelf for localized customs, belonging, household life, language, food, dress,
  etiquette, and public memory. Keep lineage traits and traditions with their peoples, formal doctrine
  under Religion & Worship, government under Governments & Geopolitics, and historical reconstruction
  in Annals & Antiquities.
- File every material feature within one Greater Region's `3. Geography & Landmarks` shelf. For a
  cross-regional feature, keep one canonical record in the region that provides the clearest archival
  home and link to it from every other affected regional index rather than duplicating the article.
  Use the relevant `Greater [Region]` scope while a narrower subregional placement remains uncertain.
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

| Page family                | Template               | Structural emphasis                                           |
| -------------------------- | ---------------------- | ------------------------------------------------------------- |
| General or unusual record  | `file-record.md`       | Purpose, record, current assessment                           |
| Bestiary                   | `bestiary-entry.md`    | Identification, ecology, threat, delver guidance              |
| Settlement                 | `city.md`              | Civic scale, place, daily life, authority, current conditions |
| Region or plane            | `region.md`            | Boundaries, people, government, travel, notable sites         |
| Delver or major character  | `delver.md`            | Profile, history, abilities, affiliations, status             |
| Guild                      | `guild.md`             | Purpose, structure, leadership, operations, relationships     |
| Other organization         | `organization.md`      | Mandate, authority, structure, public role                    |
| Playable people or lineage | `lineage.md`           | Society, modern life, traits, sublineages, homelands          |
| Cultural system            | `culture.md`           | Scope, history, practice, variation, modern debate            |
| Historical reconstruction  | `historical-record.md` | Evidence, sequence, competing accounts, consequences          |
| Timeline                   | `timeline.md`          | Dated events, disputed dates, related records                 |
| Monthly Ledger item        | `ledger-item.md`       | Confirmed facts, uncertainty, action, visible updates         |

Use proportional structure. A small town, minor figure, short notice, or narrow custom should not acquire
empty sections merely to resemble a major record. Preserve unique sections containing subject-specific
information.

### Settlement Civic Register

Living Atlas settlement pages use `recordType: Settlement Record` and a single masthead **Civic
profile**. Do not repeat the same population, scale, or filing metadata in a second opening record block.
Preserve older filing attribution in the optional `provenance` field, which the site keeps subordinate to
the civic facts.

Keep these concepts distinct:

- **Settlement Scale** records demographic and infrastructural size.
- **Civic Role** records political or administrative function, such as global capital, regional capital,
  baronial seat, or charter center. Capital is never itself a size.
- **Settlement Character** records the locality's established form or identity, such as port city,
  fortress town, farming village, lodge city, or transient expedition settlement.
- **Census Basis** states the evidence quality or population condition when it matters: current estimate,
  seasonal or variable estimate, distributed population, historical estimate, unverified, or unknown.

Use this scale as the Living Atlas editorial default, not as an inflexible game rule:

| Settlement Scale | Default resident population |
| ---------------- | --------------------------: |
| Metropolis       |                    250,000+ |
| Large City       |              75,000–249,999 |
| City             |               10,000–74,999 |
| Town             |                 1,000–9,999 |
| Village          |                     100–999 |
| Hamlet           |                   under 100 |

Permanence, density, services, and administrative form may justify a documented exception. Use
`Unclassified` when the evidence does not support a scale. Outposts, strongholds, inhabited sites, and
transient camps may retain those terms as Settlement Character while using a supported demographic scale.

A full settlement record normally moves through Civic Overview; Place & Built Form; People, Work & Daily
Life; Authority & Local Institutions; and Current Conditions & Delver Relevance. Add History & Public
Memory, Landmarks and Districts, Economy and Routes, or Related Records only when their content warrants a
separate section.

## 6. Frontmatter

Frontmatter is optional; do not add it mechanically to every legacy record.

Use it when it improves publishing, navigation, aliases, indexing, or status. Keep YAML at the beginning
of the file and use only supported, evidenced values.

Recommended order when fields are present:

```yaml
---
title: Display Title
description: One-sentence public description.
epithet: Established subtitle, maxim, or orientation line.
aliases:
  - Alternate Name
tags:
  - broad-topic
breadcrumbTitle: Short Label
recordType: Record Type
status: Status
classification: Classification
revision: Revision
showMastheadRecord: false
facts: {}
provenance: {}
related: []
quartz-properties: false
draft: false
---
```

- `title`: use when the filename is not the desired public display title.
- `description` or `summary`: concise public context; preserve the local page-family convention.
- `epithet`: an established subtitle, maxim, or orientation line displayed beneath the masthead title.
- `aliases`: alternate names, former names, abbreviations, or punctuation variants. Use a YAML list.
- `tags`: broad discovery categories, lowercase and hyphenated where needed. Reuse established tags;
  do not create a tag for every proper noun.
- `breadcrumbTitle`: use only when a shorter breadcrumb materially improves navigation.
- `recordType`, `status`, `classification`, `revision`, `facts`, and `related`: use for structured formal
  records and navigation pages when values are supported.
- `provenance`: optional filing attribution kept subordinate to a page family's primary record facts.
- `showMastheadRecord: false`: retain structured frontmatter without rendering its compact record card
  when the page already has a richer authored filing header beginning with `Filed Division`.
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
- Inside a Markdown table, escape the alias separator so it is not mistaken for a column boundary:
  `[[Canonical Page\|natural text]]`.
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
