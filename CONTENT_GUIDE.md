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
content until the reader selects **Reveal this record**. An optional `spoilerWarning` replaces the default
warning with spoiler-safe context.

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
- `spoilerWarning` - optional spoiler-safe context shown on that reveal screen.

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
