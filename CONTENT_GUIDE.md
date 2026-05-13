# Lore Vault Content Guide

This guide keeps the Obsidian vault pleasant to write in and predictable to publish.

## Publishing Rules

- Public notes live in `content/Aerathon - Eternal Labyrinths/`.
- Quartz ignores `private`, `templates`, and `.obsidian`.
- Add `draft: true` to frontmatter for notes that should stay out of the published site.
- Keep raw campaign planning, spoilers, and working scraps outside published folders or under ignored paths.

## Frontmatter

Use frontmatter when it improves navigation or publishing metadata.

```yaml
---
title: Page Title
aliases:
  - Alternate Name
tags:
  - living-atlas
draft: false
---
```

Recommended fields:

- `title` - public display title when the filename is not enough.
- `aliases` - alternate names, old names, or common abbreviations.
- `tags` - broad index topics such as `city`, `bestiary`, `guild`, or `timeline`.
- `draft` - set to `true` to exclude from publication.

## Linking

- Prefer Obsidian links for important relationships: `[[Dole (Capital)]]`.
- Use aliases when link text should read naturally: `[[Dole (Capital)|Dole]]`.
- Use embeds for local images: `![[image-name.png]]`.
- Add links intentionally; backlinks and graph view are most useful when major people, places, factions, and events are connected.

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
