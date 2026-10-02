---
name: wiki-audit
description: Audit the Aerathon wiki for deterministic validation failures and higher-order maintenance problems in structure, metadata, links, navigation, duplication, and publishing safety. Use for wiki health checks or scoped cleanup audits; do not mutate files unless repair is requested.
---

# Wiki Audit

Use deterministic checks for mechanical faults and editorial analysis only where code cannot decide reliably.

## Start with Evidence

1. Run `git status --short --branch` and preserve unrelated work.
2. For content audits, run `npm run wiki:format:check` and `npm run wiki:check`.
3. Add `npm run format:check` for repository documentation or templates, and `npm run check`, `npm test`, or `npm run build` only when the audited scope includes code or site behavior.
4. Inspect the files named by failures and a representative sample of comparable records. Do not scan or rewrite the entire vault when a narrower pattern establishes the issue.

## Separate Findings

Report deterministic failures separately from AI-assisted findings.

Deterministic findings include malformed frontmatter, broken links or anchors, ambiguous paths, empty sections, encoding damage, incomplete moves, schema violations, and stale allowlist entries.

Editorial findings include probable duplication, inconsistent scope, missing navigation context, misleading certainty, archive-layer misuse, restricted-information leakage, and terminology drift. Support these with repository evidence and state uncertainty.

Do not demand frontmatter on every legacy page, force templates onto unusual records, or normalize intentional historical disagreement.

## Repair Boundary

For an audit-only request, make no edits. When repair is requested, fix safe mechanical issues directly, keep canon changes separate, avoid mass rewrites, run the relevant checks again, and review the complete diff with `git diff --check`.
