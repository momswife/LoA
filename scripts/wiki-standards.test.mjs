import assert from "node:assert/strict"
import test from "node:test"
import fs from "node:fs"
import {
  checkCalendar,
  checkRankMetadata,
  checkTableHeaders,
  cycles,
  weekdays,
  rankLevels,
} from "./wiki-standards.mjs"

test("calendar accepts named, partial, numeric, and explicitly preserved source dates", () => {
  for (const date of [
    "Dawnsday, 1 Glintwane, 3388 A.D.",
    "Veilsday, 30 Snowturn, 3388 A.D.",
    "Late Redfall, 3388 A.D.",
    "Redfall, 3388 A.D.",
    "3388.12.30",
    "30 Cycles of probation",
    "**Original Record:** “18th Cycle, 3098 A.D.”",
  ])
    assert.deepEqual(checkCalendar(date), [], date)
})
test("calendar rejects invalid spans, weekdays, numeric months and legacy filing dates", () => {
  for (const date of [
    "31 Redfall, 3388 A.D.",
    "0 Redfall",
    "Moonsday, 1 Redfall, 3388 A.D.",
    "3388.13.01",
    "3388.01.31",
    "Snowturn 31",
    "23rd Cycle, 3098 A.D.",
    "14 confirmed fatalities Cycle 1422",
  ])
    assert.ok(checkCalendar(date).length, date)
})
test("rank metadata checks power independently from mission readiness", () => {
  assert.deepEqual(
    checkRankMetadata({
      recordType: "Delver Profile",
      facts: { Rank: "S-Rank", "Level (OOC)": 20 },
    }),
    [],
  )
  assert.ok(
    checkRankMetadata({
      recordType: "Delver Profile",
      facts: { Rank: "S-Rank", "Level (OOC)": 17 },
    }).length,
  )
  assert.deepEqual(
    checkRankMetadata({
      facts: {
        "Mission Rank": "B-Rank",
        "Recommended Levels": "11–15",
        "Team Requirements": "Four delvers with containment and evacuation support",
      },
    }),
    [],
  )
  assert.ok(
    checkRankMetadata({ facts: { "Mission Rank": "A-Rank", "Recommended Levels": "11–15" } })
      .length,
  )
  assert.ok(checkRankMetadata({ facts: { "Mission Rank": "E-Rank" } }).length)
  assert.deepEqual(checkRankMetadata({ facts: { "Mission Rank": "Unranked" } }), [])
})

test("guild classification tables require a real header separator", () => {
  assert.equal(
    checkTableHeaders("| **Guild Type** | Independent |\n| **Leader** | Named leader |").length,
    1,
  )
  assert.deepEqual(
    checkTableHeaders("| Field | Record |\n| :--- | ---: |\n| Guild Type | Independent |"),
    [],
  )
  assert.deepEqual(
    checkTableHeaders("A prose sentence with | an incidental pipe.\n\n| single row | only |"),
    [],
  )
  assert.deepEqual(checkTableHeaders("```md\n| Field | Value |\n| Missing | Separator |\n```"), [])
})

test("validation constants stay aligned with the authoritative calendar and UDMI", () => {
  const calendar = fs.readFileSync(
    new URL(
      "../content/Aerathon - Eternal Labyrinths/I. Annals & Antiquities/02. Eras & Timelines/∅ Aerathonian Calendar.md",
      import.meta.url,
    ),
    "utf8",
  )
  const rows = [...calendar.matchAll(/^\|\*\*([^*]+)\*\*\|/gm)].map((match) => match[1])
  assert.deepEqual(
    rows.filter((name) => cycles.includes(name)),
    cycles,
  )
  assert.deepEqual(
    rows.filter((name) => weekdays.includes(name)),
    weekdays,
  )
  const udmi = fs.readFileSync(
    new URL(
      "../content/Aerathon - Eternal Labyrinths/II. The Living Atlas/07. Delving, Guilds & the Spectacle/I. Orientation, Licensing & Classification/04. Unified Delving Merit Index.md",
      import.meta.url,
    ),
    "utf8",
  )
  for (const [rank, levels] of Object.entries(rankLevels))
    assert.ok(udmi.includes("| " + rank + " | " + levels + " |"), rank)
})
