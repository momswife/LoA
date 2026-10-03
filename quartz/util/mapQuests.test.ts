import { test } from "node:test"
import assert from "node:assert/strict"
import YAML from "yaml"
import { normalizeMapQuests, mapQuestYaml } from "./mapQuests"

test("map projection drops secrets, invalid entries, and duplicate IDs", () => {
  const quest = {
    id: "MAL-Q01",
    title: " Ledger ",
    hook: " Ask the clerk. ",
    gm: "SECRET",
    unlock: "act-5",
  }
  assert.deepEqual(normalizeMapQuests([quest, quest, null, { id: "bad" }]), [
    { id: "MAL-Q01", title: "Ledger", hook: "Ask the clerk." },
  ])
  assert.deepEqual(normalizeMapQuests(undefined), [])
})

test("map export preserves public quest IDs and multiline text through YAML", () => {
  const quests = [
    { id: "MAL-Q20", title: 'A "lost" key', hook: "First line\nSecond line: <script>" },
  ]
  const result = YAML.parse(["locations:", "  - id: test", ...mapQuestYaml(quests)].join("\n"))
  assert.deepEqual(result.locations[0].quests, quests)
})
