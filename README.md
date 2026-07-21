<<<<<<< HEAD
# Lore Vault of Aerathon
=======
# Quartz v5
>>>>>>> v5

The Lore Vault is a D&D campaign wiki for Aerathon. The writing source of truth is the Obsidian-style Markdown vault in `content/`, and the site is published to GitHub Pages as a static website.

This repository is an owned fork of Quartz v4. The Quartz engine remains vendored in `quartz/`, but the project metadata, workflows, and documentation belong to the Lore Vault site.

## Repository Layout

- `content/` - campaign notes, images, and Obsidian vault files.
- `content/index.md` - public homepage.
- `content/templates/` - authoring templates ignored by Quartz publishing.
- `quartz/` - vendored Quartz static-site engine.
- `quartz.config.ts` - site configuration, theme, plugins, publishing behavior.
- `quartz.layout.ts` - page layout, sidebars, footer, and shared components.
- `public/` - generated site output. Do not edit by hand.
- `.quartz-cache/` and `node_modules/` - local generated/dependency folders.

## Setup

Use Node 22 and npm.

```sh
npm ci
```

The repository includes `.node-version` for local version managers.

## Local Development

Build the site:

```sh
npm run build
```

Serve a local preview:

```sh
npm run serve
```

Run checks:

```sh
npm run check
npm test
```

## Publishing

GitHub Pages is deployed from branch `v4` by `.github/workflows/deploy.yml`.

The workflow installs dependencies with `npm ci`, builds the site with `npm run build`, uploads `public/`, and deploys through GitHub Pages.

## Authoring Notes

Write campaign pages in `content/Aerathon - Eternal Labyrinths/`. Quartz ignores `private`, `templates`, and `.obsidian`.

Use `draft: true` in frontmatter for notes that should not publish. Prefer meaningful titles, aliases for alternate names, and tags for major index concepts.

See `CONTENT_GUIDE.md` and `content/templates/` for current wiki conventions.

## Quartz Attribution

The static-site engine is derived from Quartz v4 by Jacky Zhao and remains under the MIT license. Keep `LICENSE.txt` and upstream attribution intact when modifying the vendored engine.
