# Quartz and Site-Code Instructions

These instructions apply to the vendored Quartz engine and the Lore Vault extensions within it.

## Architecture

- The active project entry point is root `quartz.ts`, which loads `quartz.config.yaml` and root `quartz.layout.ts`.
- Prefer project components, transformers, styles, and configuration over changes to generic Quartz behavior.
- Existing Lore Vault extensions include document mastheads, record details, related records, category navigation, spoiler handling, lineage mechanics disclosure, Worldwire content, and the Aerathon map. Inspect their component, transformer, style, script, and test files together before changing behavior.
- Community plugins are declared in `quartz.config.yaml` and locked by `quartz.lock.json`. Do not edit installed plugin output under `.quartz/`.

## Implementation

- Keep lore and display content in Markdown or frontmatter rather than hardcoding it into components.
- Handle missing and legacy frontmatter defensively; frontmatter is optional in the vault.
- Preserve Obsidian syntax and Quartz's parsing, routing, transclusion, and SPA lifecycle conventions.
- Favor small typed components and utilities, accessible markup, responsive behavior, and minimal dependencies.
- Avoid brittle DOM manipulation and global browser state. Register and clean up client-side listeners through the existing Quartz lifecycle patterns.
- Keep project-specific behavior isolated enough that a future Quartz upgrade can identify and reconcile it.
- Add focused tests for parsing, transforms, state selection, routing, or regressions when behavior is non-trivial.

## Validation

- Run `npm run check` and `npm test` for TypeScript or Quartz changes.
- Run `npm run build` when configuration, layout, plugins, emitted resources, or rendering behavior changes.
- When code changes affect Markdown interpretation, also run `npm run wiki:format:check` and `npm run wiki:check`.
- Review the complete diff and run `git diff --check` before finishing.
