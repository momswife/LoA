# Aerathon lore implementation — 1 October 2026

This record applies the user’s decisions on D01–D20 in [the historical audit](LORE_AUDIT_DECISIONS.md). Existing uncommitted work was preserved. Nothing was committed or published.

## Shared standards

| Personal / mission rank | D&D levels | Meaning                          |
| ----------------------- | ---------- | -------------------------------- |
| D-Rank                  | 1–4        | Beginning adventurers            |
| C-Rank                  | 5–10       | Established working adventurers  |
| B-Rank                  | 11–15      | Above average                    |
| A-Rank                  | 16–19      | Extremely above average          |
| S-Rank                  | 20         | Near god-like mortal adventurers |

Most delvers are D-, C-, or B-Rank. This is Aerathon’s campaign convention, not a rule claimed to come from D&D. Rank measures capability; a license grants permission, guild class describes an institution, and site tiers describe Labyrinths. Audience merit does not purchase power. Mission recommendations use these bands alongside team requirements, never as a promise that an individual can safely complete the work.

The Common Coin Reckoning uses standard D&D ratios: 10 cp = 1 sp, 10 sp = 1 gp, 10 gp = 1 pp; uncommon electrum is 5 sp per ep. Older G budgets are gold-piece equivalents. Prices and credit remain local.

## Decision disposition

| Decision | Applied result                                                                                                                                                                                                                                           |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D01      | Removed the copied original filing date from Verdant Collision, Iron-Bough Syndicate, and Emberlight Union; preserved supported founding history.                                                                                                        |
| D02      | Named Cycles replace valid ordinals; unsupported precision remains unresolved. [Calendar migration](CALENDAR_MIGRATION.md) preserves original strings. Added date consistency checks.                                                                    |
| D03–D04  | Reworked 19 inherited delver profiles, fully rewrote Skarn, standardized ranks and Ledger guidance, and repaired eight guild classification tables. Added table/rank validation.                                                                         |
| D05      | Added profiles for established missing partner Thalia Vess and new S-Rank delvers Ivara Sen and Damas Orr. Registry now has 22 profiles.                                                                                                                 |
| D06–D07  | Tempestrise’s core lies off Vinyot’s eastern coast south of Porta Ventura; outer weather reaches Malduta. Its old forecast remains a forecast with no confirmed outcome. [Map reconciliation](MAP_LOCATION_AUDIT.md) covers all 126 interactive markers. |
| D08      | Oenin life is historical. Northern access remains closed and no survivor contact is confirmed.                                                                                                                                                           |
| D09      | Added N01 Northern Approaches Remain Closed, N02 Granfield Storehouse Repair Work, and N03 Disputed Approach at Lantern Bay, in their appropriate Ledger categories. Each has lifecycle fields and an update log.                                        |
| D10      | Deferred planned-target consolidation as requested. The 90-target inventory and referring-file coverage remain in audit Appendix E and the link allowlist.                                                                                               |
| D11      | Added 89 first-mention links across 27 foundational records. Kept authored Related Records lists and removed the duplicate automatic cards from the layout.                                                                                              |
| D12      | Replaced 25 repeated subregional caveats with local working practices; retained shared cautions at regional level.                                                                                                                                       |
| D13      | Adopted L01–L08: Bristle Inn, Granfield, Pristana, Lantern Bay, Kyry, MadroIleán, historical Oenin life, and Sandglass Vulture. Updated nearby navigation.                                                                                               |
| D14      | Revamped all eight guild profiles and connected the Cinderpaw Pact from Arnerian politics without creating a duplicate government record.                                                                                                                |
| D15      | Documented Common Coin Reckoning and preserved the value of existing guild budgets.                                                                                                                                                                      |
| D16–D17  | Jarik acknowledges Kyry; Glasrún’s duplicated orientation is replaced with useful travel detail. Preserved the 367/571 two-stage history.                                                                                                                |
| D18–D19  | Removed stale source-migration caveats from the expanded records and made Sandglass Vulture a published bestiary entry.                                                                                                                                  |
| D20      | Updated repository, vault, style, and lore-entry guidance to support requested invention: bounded magic, meaningful costs, civic consequences, earned discovery, and Aerathon’s own prose.                                                               |

## New canon and deliberate interpretations

- **Ivara Sen, the Weightkeeper:** an independent S-Rank structural specialist who transfers loads into prepared receiving stones. Load conservation, failed calculations, and obligations to people whose homes she protects create limits and future stories. She consults with Verdant Collision.
- **Damas Orr, the Quiet Between:** an independent S-Rank resonance specialist who interrupts measured recurring effects. Sensory costs and unreliable relay evidence constrain his work. He consults with Emberlight Union.
- **Thalia Vess:** the already-established S-Rank partner of Zippo now has a proper lost-person profile. Her fate remains unknown; the new record does not declare her dead or bring her back.
- **Skarn:** retained the ursine liberator, Chainscour history, Ashmaul, Emberbrand, and major reported deeds. His new mechanism makes breaking bindings require identifiable anchors and imposes recoil. Forced-confession stories are no longer reliable evidence. His present conflict concerns rescue, debt records, consent, and accountability.
- The other profiles retain their defining identities, equipment, deeds, and uncertain claims, with revised introductions and individual field-practice assessments. Lost and retired ranks describe their highest documented capability.
- S/A/B expedition counts in inherited dossiers are treated as legacy expedition ratings, not numerical site tiers. This is the adopted reconciliation from D03.
- New settlement practices and Ledger notices establish ordinary livelihoods and manageable tensions. The Nattefrost cordon is not relaxed.
- Standard coin ratios and rank/level bands replace older incompatible conventions. Existing three hunt postings retain their D/C/C mission ranks; Tier III’s veteran advisory remains within C-Rank. Their absent issue/closure dates are explicitly unverified.

## Candidate and map coverage

The vault-wide S-Class/S-Rank search identified Thalia’s explicit qualification in Zippo’s existing record. Guild leaders are not automatically assigned the class of their institution. No mass list of lower-ranked adventurers was created; notable civic and guild figures retain their existing filing homes.

All 120 distinct interactive map names resolve to maintained wiki subjects or compact geography entries, with no new duplicate location pages. The report documents repeated pins and spelling aliases. Names painted into the map image beyond its interactive legend were not exhaustively transcribed; this is the remaining map-coverage boundary.

## Maintenance and remaining work

- The planned-link inventory remains deferred. Promote a missing target only when the article is written and all callers can be checked.
- Absolute legacy cycle numbers and invalid ordinal months remain visibly uncertain; no unsupported event dates were invented.
- Forecasts and notices need future outcomes when play establishes them. The new notices are current to their in-world filing, not real-world time.
- Compact map entries can receive fuller articles later without duplicating canonical subjects.
- Purely private campaign truth must remain outside published folders.

## Validation

| Check                                              | Result                                                                                                                                                                                    |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Wiki formatting                                    | Passed                                                                                                                                                                                    |
| Wiki structure, links, calendar, ranks, and tables | Passed: 685 Markdown files, 43 assets                                                                                                                                                     |
| TypeScript and repository formatting               | Passed                                                                                                                                                                                    |
| Test suite                                         | Passed: 113 tests, including canonical-reference alignment                                                                                                                                |
| Final site build                                   | Passed: 686 inputs, 1,302 emitted files                                                                                                                                                   |
| Rendered output                                    | Skarn inspected in browser; profile fields readable. Skarn, Argent Banner, and UDMI each have one authored Related Records section and no automatic cards; guild tables render as tables. |
| Complete diff and file integrity                   | No deleted files, empty lore files, conflict markers, or replacement-character damage; git diff --check passed                                                                            |
| lore-entry skill                                   | Frontmatter/schema and placeholder validation passed using the repository Node YAML parser; the Python helper could not run because PyYAML is absent.                                     |

The build reports expected Git-date warnings for untracked pages. No staging or commits were performed to suppress them. The first sandboxed build encountered Windows parent-directory traversal restrictions; the authorized elevated build succeeded.

Automated checks validate explicit syntax and metadata; they do not prove every narrative claim consistent or balance each encounter.
