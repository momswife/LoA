# Aerathon / LoA Repository Instructions

These rules apply repository-wide unless a more specific nested `AGENTS.md` says otherwise.

## Before Editing

1. Run `git status --short --branch` and preserve unrelated work.
2. Read `README.md`, `CONTENT_GUIDE.md`, and `WIKI_STYLE_GUIDE.md`.
3. Inspect the affected pages, comparable sibling records, and connected lore before changing facts.
4. Use the relevant file in `content/templates/` as a flexible starting point; never add empty sections merely to satisfy a template.

## Source Boundaries

- Published Aerathon content lives in `content/Aerathon - Eternal Labyrinths/`:
  - `I. Annals & Antiquities/` contains historical and foundational records.
  - `II. The Living Atlas/` contains maintained world-reference material.
  - `III. Monthly Ledger/` contains provisional notices, reports, rumors, and missions.
- `content/templates/` contains unpublished authoring templates.
- `quartz/` and the root Quartz configuration are site code, not canon.
- Do not hand-edit generated or local-state paths: `public/`, `node_modules/`, `.quartz/`, `.quartz-cache/`, `.obsidian/`, or `tsconfig.tsbuildinfo`.

## Editorial Work and Canon

- Make safe editorial fixes directly: Markdown, headings, section order, links, navigation, obvious typos, metadata formatting, and accidental duplication.
- Treat dates, events, people, relationships, geography, politics, religions, magic, institutions, populations, and game mechanics as canon.
- Search the repository before changing canon. Prefer the dedicated subject page, clearly newer revisions, and repeated agreement across related records.
- Preserve conflicting perspectives when they are intentional. If equally credible sources remain incompatible, document the decision in `WIKI_REVIEW.md`; never invent an answer.
- Preserve the archive voice, atmosphere, terminology, and cultural nuance. Improve clarity without flattening creative prose.
- Do not expose restricted campaign truth in a public filing merely because it appears elsewhere.
- For playable lineages, retain Creature Type, Ability Score Increase, Speed, innate abilities, recognized sublineage or tradition additions, Homeland Imprints, and any applicable advisory. Do not infer culture or personality from physiology.

## Files, Links, and Metadata

- Follow the existing numbered taxonomy and local naming patterns. `Overview.md`, `index.md`, and `∅` overview pages have distinct navigation roles.
- Preserve UTF-8, diacritics, intentional symbols, and Obsidian/Quartz syntax such as `[[wikilinks]]`, aliases, embeds, callouts, block references, and custom fenced blocks.
- For moves or renames, find inbound references, update links and heading anchors, preserve useful old-name aliases, then validate the complete migration.
- Qualify ambiguous wikilinks with their path. Planned links to unwritten records must be intentional and recorded in `wiki-link-allowlist.json`.
- Frontmatter is optional. Keep it valid, preserve meaningful aliases and tags, and never invent metadata merely to fill a field.
- Add or move a published page only with an update to the nearest useful index or parent browse list.

## Validation

Run the checks appropriate to the change:

- Wiki formatting: `npm run wiki:format:check`
- Wiki structure, frontmatter, links, and lineage schema: `npm run wiki:check`
- Repository formatting: `npm run format:check`
- Site or code changes: `npm test` and `npm run build`
- Broad TypeScript/configuration changes: `npm run check`

Always review the complete diff and run `git diff --check`. Check specifically for accidental lore deletion, broken links, empty files, invalid frontmatter, encoding damage, and incomplete file moves.

Do not stage, commit, push, or open a pull request unless the user requests it. Never discard user work, force-push, or rewrite history to simplify a task.
