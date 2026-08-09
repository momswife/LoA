# Aerathon / LoA Repository Instructions

These instructions apply to the entire repository. A more specific nested `AGENTS.md`, if one is
added later, may refine them for its subtree.

## Prime Directive

**Editorial decisions belong to the agent. Canon decisions belong to repository evidence.**

- Make routine editorial decisions yourself: headings, Markdown cleanup, section order, template
  alignment, metadata formatting, link repair, navigation, obvious grammar, and removal of accidental
  duplication.
- Treat dates, events, rulers, relationships, borders, motives, magic, cosmology, populations,
  institutions, and other world facts as canon. Search the repository before changing them.
- If the evidence establishes an answer, reconcile outdated references. If equally credible sources
  remain incompatible, preserve the ambiguity and report it instead of choosing or inventing canon.
- Incomplete canonical information is better than fabricated completeness. Never invent unsupported
  dates, events, settlements, people, relationships, organizations, hierarchies, cultures, religions,
  geography, artifacts, or game mechanics merely to fill a page.

## Start Here

Before substantial work:

1. Run `git status --short --branch` and preserve unrelated work.
2. Read `README.md`, `CONTENT_GUIDE.md`, and `WIKI_STYLE_GUIDE.md`.
3. Inspect the affected files and several comparable sibling records. Do not infer a repository-wide
   convention from one sample.
4. For broad lore, filing-style, or wiki-structure work, follow the detailed MDO manual referenced by
   `WIKI_STYLE_GUIDE.md`.
5. Use the relevant file in `content/templates/` as a starting point when creating a supported record
   type, but confirm the pattern against current published examples.

## Repository Map and Source Boundaries

- `content/index.md` is the public site homepage metadata.
- `content/Aerathon - Eternal Labyrinths/` is the published Obsidian vault and the source of truth for
  public Aerathon content and assets.
  - `I. Annals & Antiquities/` contains historical and foundational reconstructions. Its contradictions
    may be intentional evidence disputes.
  - `II. The Living Atlas/` contains continuously maintained present-day reference material.
  - `III. Monthly Ledger/` contains provisional, time-sensitive reports, rumors, notices, and missions.
    Update these visibly; do not silently make an old report look as though it always knew later facts.
- `content/templates/` contains unpublished authoring templates. Templates are defaults, not mandatory
  empty forms.
- `quartz.config.yaml` is the primary Quartz plugin, theme, and publishing configuration.
  `quartz.layout.ts` defines the project layout and local component arrangement; `quartz.ts` composes
  that layout with the YAML configuration.
- `quartz.config.ts` remains tracked and format-checked, but the current `quartz.ts` entry point loads
  the YAML configuration. Do not assume the TypeScript config is the runtime source of truth.
- `quartz/` is the tracked, vendored Quartz engine plus project-specific components and styles. Change
  it only for site/engine work, preserve upstream attribution, and validate it as code.
- `docs/` is tracked Quartz engine documentation, not Aerathon canon.
- `package.json`, `package-lock.json`, and `quartz.lock.json` define reproducible Node and Quartz-plugin
  dependencies. Change lockfiles only when the corresponding dependency or plugin set changes.
- Do not hand-edit generated or local-state paths: `public/`, `node_modules/`, `.quartz-cache/`,
  `.quartz/`, `tsconfig.tsbuildinfo`, `prof/`, or local `.obsidian/` state. These are ignored by Git.

## Canon as a Knowledge Graph

Before a material factual edit, search with `rg` for:

- the entity's canonical name, aliases, older names, and spelling variants;
- associated people, places, governments, guilds, cultures, faiths, and artifacts;
- relevant dates, eras, events, treaties, and relationships;
- inbound wikilinks and heading links.

Do not knowingly correct one page while leaving contradictory dependent pages behind. For renames or
moves: inventory inbound references, move the file, update links and embeds, check heading anchors,
then build. Do not leave partial migrations.

Use this contextual hierarchy when sources conflict:

1. Explicit canon declarations, including direct current user direction.
2. The dedicated source page for the subject.
3. Clearly newer, intentional revisions.
4. Repeated agreement across related records.
5. Older peripheral mentions.

This is guidance, not a vote-counting algorithm. Account for document perspective and evidence quality.
The Lorevault is not an omniscient narrator: distinguish setting truth, witness testimony, Ministry
belief, scholarly reconstruction, public record, and rumor. Do not expose restricted campaign truth in
a public filing merely because it is known elsewhere.

## Lore and Prose

- Preserve the in-world archive voice, atmosphere, intentional imagery, fantasy terminology, character
  personality, and cultural flavor. Improve clarity and flow without sterilizing the prose.
- Do not perform broad prose rewrites unless requested. Prefer preserving, reorganizing, clarifying,
  reconciling, and linking existing user-authored material over deleting or replacing it.
- Formal long records commonly use an epigraph, filing header, Roman-numeral major sections, practical
  callouts, and an authentication footer. This is not universal: short notices, character profiles,
  navigation pages, and Monthly Ledger entries legitimately differ.
- Similar record types should have compatible structures. Preserve useful subject-specific sections,
  and do not add empty headings solely because a template contains them.
- Monthly Ledger, mission, bounty, field-advisory, and other table-facing material should be immediate,
  readable aloud, and useful during play. Dialogue must sound like something the character would say,
  not encyclopedia exposition.
- For living peoples, distinguish Folk, lineage, sublineage, homeland, citizenship, household, culture,
  faith, and profession. Do not turn physiology or culture into assigned morality, intelligence,
  temperament, loyalty, or destiny.
- When editing playable lineages, preserve the established trait vocabulary and the current lineage
  pattern: base traits, sublineage-specific additions, homeland imprints, play guidance, and registry
  advisory where applicable. Do not invent mechanics without task authority and setting evidence.

## Files, Navigation, and Encoding

- Follow the existing numbered taxonomy and nearby naming conventions. `Overview.md`, `index.md`, and
  `∅` overview filenames are deliberate navigation patterns; do not normalize or rename them casually.
- Match the established page type and local folder pattern before creating a new file. Avoid redesigning
  the whole taxonomy during a narrow task.
- Preserve UTF-8 Unicode punctuation, diacritics, symbols such as `∅`, and LF line endings. Avoid
  whole-file recoding or formatting churn. In Windows PowerShell, specify `-Encoding utf8` when a read
  would otherwise display mojibake.
- Place page-specific assets near their page or a nearby asset folder when practical. Shared world assets
  may live near the vault root. Prefer descriptive names for new assets; do not rename existing UUID-style
  assets without updating every embed.

## Obsidian and Quartz Markdown

- Preserve intentional Obsidian syntax: `[[wikilinks]]`, aliases, `#heading` links, `![[embeds]]`,
  callouts, comments, block references, tags, Canvas/Base files, and other supported constructs.
- Prefer `[[Canonical Page]]` and `[[Canonical Page|natural display text]]`. Qualify the path when names
  collide or the target would be ambiguous. Quartz resolves Markdown links with the `shortest` strategy.
- Link the first meaningful mention rather than saturating every repetition. A link to an unwritten page
  is acceptable only when it represents an intentional planned record.
- When changing headings, search for `[[Page#Heading]]` references and repair affected anchors.
- Preserve custom fenced blocks such as `aerathon-map` and their referenced YAML/image assets.
- Do not convert working Obsidian syntax to ordinary Markdown merely for stylistic preference.

## Frontmatter and Metadata

Frontmatter is optional in the current vault; do not add it to every legacy page. When it improves
publishing or navigation, follow `CONTENT_GUIDE.md` and the relevant template.

- Common fields include `title`, `description` or `summary`, `aliases`, `tags`, `breadcrumbTitle`,
  `recordType`, `status`, `classification`, `revision`, `facts`, `related`, and `draft`.
- Preserve `quartz-properties: false` on overview/navigation pages that intentionally suppress the
  property display.
- Use `draft: true` for authored notes that must not publish. Quartz removes drafts and ignores
  `private/**`, `templates/**`, and `.obsidian/**`.
- Do not guess metadata. Omit an unknown optional field or preserve its existing value according to the
  local pattern. Never invent dates, population, status, classification, or responsible offices to make
  frontmatter appear complete.
- Keep YAML valid and frontmatter at the beginning of the file. Preserve useful aliases, especially old
  names and common abbreviations.

## Site and Configuration Work

- Use Node 22 (see `.node-version`) and npm.
- Prefer changing project configuration, layout, local components, or `quartz/styles/custom.scss` before
  altering generic vendored engine behavior, unless the task specifically concerns the engine.
- Configuration, explorer, breadcrumb, slug, or heading changes can affect navigation repository-wide.
  Test representative desktop/mobile behavior when the task changes UI interaction.
- Do not edit installed files under `.quartz/plugins/`; update the declared plugin configuration or lock
  through the repository's Quartz workflow instead.
- Pushes to `master` deploy `public/` through `.github/workflows/deploy.yml`; local agents should build
  and verify but must not deploy unless asked.

## Validation and Diff Review

Use the narrowest relevant checks, then expand for broad changes:

- Content or broad wiki changes: `npm run content:check` or `npm run build`.
- Repository-specific Markdown and internal-link checks: `npm run wiki:format:check` and
  `npm run wiki:check`.
- Site configuration, TypeScript, styles, templates, or workflows: `npm run check`, `npm test`, and
  `npm run build`.
- Interactive site behavior: `npm run serve`, then inspect the affected pages and viewport states.
- Always run `git diff --check` and review `git diff` before finishing.

There is no separate Markdown-lint or dead-link command currently configured; do not claim one ran.
If a required check cannot run, state why.

For broad or automated edits, explicitly inspect for accidental lore deletion, unintended canon changes,
broken frontmatter, corrupted links or embeds, empty files, encoding damage, and massive formatting churn.

## Git, Scope, and Autonomy

- Preserve unrelated user changes. Never discard uncommitted work, use destructive resets, force-push,
  or rewrite history without explicit permission.
- Do not commit, stage, push, or open a pull request unless requested. When asked to commit, keep the
  commit logically scoped and exclude unrelated changes.
- Complete the requested task fully, including consistency repairs directly caused or exposed by it, but
  do not turn a narrow request into an unrelated lore or taxonomy rewrite.
- Relocate clearly misplaced files only when the task supports it; search, move, relink, and validate as
  one complete operation.
- Ask the user only for consequential ambiguity that repository evidence cannot resolve, such as equally
  supported incompatible dates, uncertain entity identity, a major taxonomy redefinition, or deletion of
  possibly unique canon. Do not interrupt for capitalization, formatting, obvious typos, normal section
  placement, broken links, or straightforward metadata normalization.

## Completion Workflow

1. Read applicable instructions and documentation.
2. Inspect the affected files and representative siblings.
3. Search connected references for lore changes.
4. Classify decisions as editorial or canonical.
5. Make the scoped change and update affected references.
6. Review the complete diff for content preservation and encoding.
7. Run the relevant checks.
8. Summarize meaningful changes, validation, and any unresolved canon conflicts.
