# Lore Vault of Aerathon

The Lore Vault is a D&D campaign wiki for Aerathon. The writing source of truth is the Obsidian-style Markdown vault in `content/`, and the site is published to GitHub Pages as a static website.

This repository is an owned fork of Quartz v5. The Quartz engine remains vendored in `quartz/`, but the project metadata, workflows, and documentation belong to the Lore Vault site.

## Repository Layout

- `content/` - public wiki records, images, and Obsidian vault files.
- `private/campaign/` - local sessions, party characters, plots, and wiki candidates; outside the website and ignored by Git. See [the campaign guide](CAMPAIGN_GUIDE.md).
- `content/index.md` - public homepage.
- `content/templates/` - authoring templates ignored by Quartz publishing.
- `quartz/` - vendored Quartz static-site engine.
- `quartz.config.yaml` - site configuration, theme, plugins, layout, and publishing behavior.
- `quartz.ts` - active Quartz v5 entry point; loads the YAML configuration and project overrides.
- `quartz.layout.ts` - project-owned component arrangement and interactive layout behavior passed to the v5 loader.
- `quartz.lock.json` - locked community-plugin revisions used for reproducible builds.
- `public/` - generated site output. Do not edit by hand.
- `.quartz-cache/` and `node_modules/` - local generated/dependency folders.

## Setup

Use Node 22 and npm.

```sh
npm ci
npx quartz plugin install
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
npm run wiki:format:check
npm run wiki:check
```

## Publishing

GitHub Pages is deployed from branch `master` by `.github/workflows/deploy.yml`.

The workflow installs dependencies and locked Quartz plugins, runs the TypeScript, formatting, test,
and wiki-consistency checks, builds the site, and deploys `public/` through GitHub Pages. Pull requests
into `master` run the same validation in `.github/workflows/ci.yaml`.

## Authoring Notes

Write campaign pages in `content/Aerathon - Eternal Labyrinths/`. Quartz ignores `private`, `templates`, and `.obsidian`.

Use `draft: true` in frontmatter for notes that should not publish. Prefer meaningful titles, aliases for alternate names, and tags for major index concepts.

See `CONTENT_GUIDE.md` and `content/templates/` for current wiki conventions.

For AI-assisted lore work, start with [LORE_MAP.md](LORE_MAP.md). It maps the archive sections and cross-section continuity checks without duplicating canon. This authoring guide lives outside the published content directory; local `AGENTS.md` guidance is also excluded by the site configuration.

## Short Share Links

Articles can declare a stable short address in their YAML frontmatter:

```yaml
permalink: hearthward-compact
```

This publishes `/LoA/hearthward-compact` as a redirect to the article's full address.
The link icon at the article's upper right copies the short address and briefly turns into
a checkmark, with a selectable text fallback when
clipboard access is unavailable. The browser displays the full address after redirecting.

Run `npm run links:assign` to assign readable, unique addresses to new articles. Existing
addresses are preserved; drafts, encrypted/unlisted articles, and navigation pages are skipped.
Keep `permalink` unchanged when renaming or moving an article. Choose a unique lowercase
name containing letters, digits, and hyphens; builds reject collisions with other pages,
aliases, short addresses, and folders. Existing long URLs remain unchanged by this feature.

## Quartz Attribution

The static-site engine is derived from Quartz v4 by Jacky Zhao and remains under the MIT license. Keep `LICENSE.txt` and upstream attribution intact when modifying the vendored engine.
