---
name: lore-entry
description: Create or substantially expand a published Aerathon lore record using repository evidence, the appropriate archive layer, existing templates, and maintained navigation. Use for new wiki articles or major lore-page expansions, not for session notes or ordinary typo fixes.
---

# Lore Entry

Create a useful public record grounded in existing canon, with compatible invention when new lore or expansion is requested. Follow the repository Creative Direction; do not force every subject into the same shape.

## Establish the Record

1. Identify the subject, intended audience, archive division, and page family.
2. Search names, aliases, dates, locations, institutions, and linked concepts across the vault. Inspect the intended parent index and representative sibling records.
3. Treat the dedicated subject page as primary evidence, followed by clearly newer revisions and repeated agreement across related records. Preserve unresolved or perspectival disagreement.
4. Select the closest template from `content/templates/`. Use it proportionally and remove sections the evidence cannot support.

## Write and File

- Follow `CONTENT_GUIDE.md`, the relevant sections of `WIKI_STYLE_GUIDE.md`, and the nested published-lore `AGENTS.md`.
- For a formal Ministry record, consult the relevant sections of the MDO Style and Filing Manual rather than loading or reproducing the whole manual.
- Keep the archive mode evidence-aware and institutionally limited. Clearly distinguish observation, report, interpretation, rumor, propaganda, and restricted truth.
- Develop new lore through coherent magical limits, costs, civic consequences, character choices, and earned discoveries. Keep Aerathon’s own voice. Distinguish adopted inventions from recovered evidence in the change summary; omit optional metadata that serves no purpose.
- Preserve established terminology, voice, cultural nuance, mechanics, and intentional Obsidian/Quartz syntax.
- Choose a stable path and filename that match the local taxonomy. Update the nearest useful index or browse list in the same change.

If a proposed addition conflicts with established canon, preserve the established facts unless the user authorized that revision. Apply authorized retcons through all dependent records. Record consequential conflicts that remain unresolved in `WIKI_REVIEW.md`; ordinary compatible invention does not require another approval.

## Verify

Review the full diff, then run:

```text
npm run wiki:format:check
npm run wiki:check
```

For broad additions, also run `npm run content:check` or `npm run build`.
