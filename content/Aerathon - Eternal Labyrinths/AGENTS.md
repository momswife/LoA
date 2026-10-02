# Published Lore Instructions

These instructions apply to the public Aerathon vault. `WIKI_STYLE_GUIDE.md` remains the canonical repository style standard; consult only the sections relevant to the task.

## Archive Layers

- `I. Annals & Antiquities/` contains historical reconstruction and foundational scholarship. Preserve meaningful disagreement between sources.
- `II. The Living Atlas/` contains maintained present-day reference material. Prefer current consensus while retaining necessary provenance.
- `III. Monthly Ledger/` contains provisional reports, notices, rumors, and missions. Update or supersede records visibly rather than silently replacing their earlier state.
- Public records express what their compiler or institution can know. Keep canon, testimony, rumor, propaganda, interpretation, uncertainty, and DM-only truth distinct.

## Canon and Evidence

- Search the subject name, aliases, dates, institutions, locations, and linked entities before changing facts.
- Prefer the dedicated subject page, then a clearly newer revision, then repeated agreement across related records.
- Allow compatible perspectives to coexist. If equally credible sources remain incompatible, preserve the conflict and record a consequential unresolved decision in `WIKI_REVIEW.md`.
- For requested new lore, develop compatible people, livelihoods, institutions, and bounded magic under the root Creative Direction. Omit gratuitous exact census figures and dates. Distinguish new inventions from recovered evidence in the change log; protect established canon and mechanics unless their revision is authorized.
- For playable lineages, preserve required mechanics and distinguish physiology, lineage, homeland, culture, faith, citizenship, and profession.

## Authoring

- Use the relevant file in `content/templates/` as a flexible starting point. Remove unused sections rather than publishing empty headings.
- Formal MDO records should consult the relevant portions of the MDO Style and Filing Manual. Use an evidence-aware archival voice, not an omniscient narrator.
- Preserve atmosphere, cultural specificity, natural dialogue, and readable prose. Avoid generic fantasy filler, unexplained proper-noun density, and decorative bureaucracy that obscures meaning.
- Frontmatter is optional. Add only supported, evidenced values in the order documented by `WIKI_STYLE_GUIDE.md`.
- Follow the numbered taxonomy and the established distinct roles of `Overview.md`, `index.md`, and `∅` overview pages.
- Qualify ambiguous wikilinks. Add planned unwritten records to `wiki-link-allowlist.json` only when they are intentional.
- Keep the nearest maintained index or browse list synchronized with page additions, moves, renames, and removals.

## Review

- Compare the result with sibling records in the same page family and archive layer.
- Run `npm run wiki:format:check` and `npm run wiki:check` after content changes.
- For broad content changes, also run `npm run content:check` or `npm run build`.
- Review the full diff for lost lore, accidental certainty, restricted-information leakage, malformed YAML, broken links, and encoding damage.

## Shared Standards

- Date records using the Aerathonian Calendar: twelve named Cycles, thirty Spans each, six weekdays. Preserve uncertainty rather than inventing a recovered date.
- Delver ranks use D-Rank (levels 1–4), C-Rank (5–10), B-Rank (11–15), A-Rank (16–19), S-Rank (20). Guild class and Labyrinth tier remain separate.
- Use one authored Related Records list where helpful. The site does not append automatic related cards. Link first meaningful mentions in the prose.
