# Aerathon / LoA Repository Instructions

These rules apply repository-wide. A closer `AGENTS.md` adds instructions for its subtree.

## Before Editing

1. Run `git status --short --branch` and preserve unrelated work.
2. Inspect the affected files, comparable siblings, and their callers or connected records.
3. Load guidance by task instead of reading every guide:
   - Published lore: use `LORE_MAP.md` to locate relevant sections and connected records, follow the nested vault `AGENTS.md`, and consult the relevant sections of `CONTENT_GUIDE.md` and `WIKI_STYLE_GUIDE.md`.
   - Templates: use `WIKI_STYLE_GUIDE.md` and comparable files in `content/templates/`.
   - Quartz or site code: follow `quartz/AGENTS.md`; for root configuration also inspect `README.md`, `quartz.ts`, `quartz.config.yaml`, and `quartz.layout.ts` as relevant.
4. Use repository search to establish names, paths, links, and dependencies before changing them.
5. For campaign-informed lore, consult `CAMPAIGN_GUIDE.md` and relevant local notes in `private/campaign/` when present. Explicitly search this Git-ignored directory. Distinguish played events, beliefs, secrets, and plans; only adapt facts authorized for public use. Keep private source details out of tracked reports and published pages.
6. For campaign-informed lore, consult `CAMPAIGN_GUIDE.md` and relevant local notes in `private/campaign/` when present. Explicitly search this Git-ignored directory. Distinguish played events, beliefs, secrets, and plans; only adapt facts authorized for public use. Keep private source details out of tracked reports and published pages.

## Source Boundaries

- Published Aerathon content lives in `content/Aerathon - Eternal Labyrinths/`.
- `content/templates/` contains unpublished authoring templates.
- `quartz/` is the vendored engine with project-specific extensions; root Quartz configuration and layout files are site code, not canon.
- Quartz v5 uses `quartz.config.yaml` through `quartz.ts`; `quartz.layout.ts` is the intentional project layout override. Do not recreate the retired `quartz.config.ts` entry point.
- Do not hand-edit generated or local-state paths: `public/`, `node_modules/`, `.quartz/`, `.quartz-cache/`, `.obsidian/`, or `tsconfig.tsbuildinfo`.
- Reader-facing spoiler controls are not access control. Truly private campaign material must remain outside published folders.

## Change Safety

- Make safe editorial and implementation fixes directly when the evidence is clear.
- Treat dates, events, people, relationships, geography, politics, religions, magic, institutions, populations, and game mechanics as canon.
- When the user requests new lore or expansion, invent plausible details consistent with established records. Preserve established facts unless a retcon is authorized, flag consequential changes, and summarize new canon. During audits or factual cleanup, do not invent facts to hide conflicts. Never expose restricted campaign truth in a public record.
- Preserve UTF-8, diacritics, intentional symbols, Obsidian/Quartz syntax, and project voice.
- For moves or renames, find inbound references, update links and heading anchors, preserve useful aliases, and validate the complete migration.
- Add or move a published page only with an update to the nearest useful index or parent browse list.
- Do not stage, commit, push, or open a pull request unless requested. Never discard user work, force-push, or rewrite history to simplify a task.

## Validation

Run checks proportional to the change:

- Wiki formatting: `npm run wiki:format:check`
- Wiki structure, frontmatter, links, and lineage schema: `npm run wiki:check`
- Repository formatting: `npm run format:check`
- Site or code changes: `npm test` and `npm run build`
- Broad TypeScript or configuration changes: `npm run check`

Always review the complete diff and run `git diff --check`. Check for accidental lore deletion, broken links, empty files, invalid frontmatter, encoding damage, and incomplete file moves.

## Creative Direction

Aim for original epic fantasy with intelligible magical rules, meaningful costs and limits, consequences that carry into civic life, mysteries supported by earlier evidence, and characters whose competing duties drive choices. Balance wonder and earned hope with danger. Ground new places in work, food, relationships, and institutions before adding extraordinary phenomena. Use clear, distinct Aerathon prose; do not reproduce a living author’s phrasing, characters, cosmology, or signature devices. Treat this as a design brief, not a requirement to imitate Brandon Sanderson’s prose.
