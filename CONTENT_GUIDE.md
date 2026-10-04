# Lore Vault Content Guide

This guide keeps the Obsidian vault pleasant to write in and predictable to publish.

For the complete repository conventions, page-family standards, canon rules, and validation workflow,
read `WIKI_STYLE_GUIDE.md`. Formal in-world records should also follow the MDO Style and Filing Manual
linked there.

## Publishing Rules

- Public notes live in `content/Aerathon - Eternal Labyrinths/`.
- Quartz ignores `private`, `templates`, and `.obsidian`.
- Add `draft: true` to frontmatter for notes that should stay out of the published site.
- Keep raw campaign planning and working scraps outside published folders or under ignored paths.
- Plot information may be published behind the reader-facing spoiler gate described below when its
  presence in the public repository is intentional.

### Spoiler-Protected Pages

Add `spoiler: true` to a page's frontmatter to conceal its masthead, table of contents, body, and related
content until the reader selects **Open restricted record**. The notice and browser/social title are deliberately generic: Code OOC, restricted and forbidden knowledge, specific clearance required. Authored `spoilerWarning` values remain accepted for legacy compatibility but are not displayed.

```yaml
---
title: Restricted Expedition Record
spoiler: true
spoilerWarning: Reveals the outcome of the party's current expedition.
---
```

The title, filename, tags, and the fact that the page exists remain visible in navigation, so keep those
spoiler-safe. The page body is omitted from site-search snippets and accidental transclusions into ordinary
pages become gated links. This is a courtesy warning, not access control: the source remains part of the
public repository and generated HTML. Truly private campaign notes must remain outside published folders.

## Frontmatter

Use frontmatter when it improves navigation or publishing metadata.

```yaml
---
title: Page Title
aliases:
  - Alternate Name
tags:
  - living-atlas
breadcrumbTitle: Short Label
draft: false
---
```

Recommended fields:

- `title` - public display title when the filename is not enough.
- `breadcrumbTitle` - shorter label for breadcrumbs when `title` is too long.
- `aliases` - alternate names, old names, or common abbreviations.
- `tags` - broad index topics such as `city`, `bestiary`, `guild`, or `timeline`.
- `draft` - set to `true` to exclude from publication.
- `spoiler` - set to `true` to require an explicit reader reveal before showing the page.
- `spoilerWarning` - legacy metadata; ignored by the anonymous reveal screen.

## Linking

- Prefer Obsidian links for important relationships: `[[Dole (Capital)]]`.
- Use aliases when link text should read naturally: `[[Dole (Capital)|Dole]]`.
- Use embeds for local images: `![[image-name.png]]`.
- Add links intentionally; backlinks and graph view are most useful when major people, places, factions, and events are connected.
- Published URLs normalize repeated hyphens, so readable Obsidian names such as `Guilds & Delvers` publish as `Guilds-and-Delvers`.

## Images

- Prefer descriptive filenames for new assets.
- Place reusable world assets near the vault root only when they are shared across sections.
- Place page-specific assets near the page or in a nearby assets folder when possible.
- Avoid adding new UUID-style names unless Obsidian creates them automatically and there is no practical rename pass.

## Page Shape

Most public records should keep the in-world archive format:

- Filing metadata near the top.
- Clear section headings.
- Tables for structured lists.
- Horizontal rules for major record breaks.
- Certification or archive notes at the end when appropriate.

Templates are available in `content/templates/`.

Templates are starting points. Remove unused sections before publishing rather than filing empty
headings.

## Forbidden Archives division

`Aerathon - Eternal Labyrinths/IV. Forbidden Archives/` is the fourth top-level division. Its landing page and sole visible child, **Code OOC**, appear in Explorer. Individual dossiers remain `unlisted: true` and `spoiler: true`; the cleared Code OOC catalogue currently links only to the Black Writ. Keep dossier names out of pre-clearance navigation and warnings. The existing Ministry clue entrance remains an alternative route. Archive pages receive a monochrome theme and static grain; leaving restores the reader’s ordinary theme. GM-only sources stay in `private/campaign/`.
