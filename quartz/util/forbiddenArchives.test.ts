import { test } from "node:test"
import assert from "node:assert/strict"
import { forbiddenArchivesRoot, isForbiddenArchive } from "./forbiddenArchives"

test("archive identity includes its index and descendants, not similar names or other records", () => {
  assert.equal(isForbiddenArchive(forbiddenArchivesRoot), true)
  assert.equal(isForbiddenArchive(`${forbiddenArchivesRoot}/index`), true)
  assert.equal(isForbiddenArchive(`${forbiddenArchivesRoot}/01.-the-black-writ`), true)
  assert.equal(isForbiddenArchive(`${forbiddenArchivesRoot}-notes/index`), false)
  assert.equal(
    isForbiddenArchive("aerathon---eternal-labyrinths/iii.-monthly-ledger/overview"),
    false,
  )
  assert.equal(isForbiddenArchive(undefined), false)
})
