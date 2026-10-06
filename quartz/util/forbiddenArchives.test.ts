import { test } from "node:test"
import assert from "node:assert/strict"
import {
  forbiddenArchivesRoot,
  isForbiddenArchive,
  isForbiddenArchivesLanding,
  shouldHideForbiddenArchiveBranch,
} from "./forbiddenArchives"

test("fresh visitors cannot see either Explorer folder-path format, even with saved expansion", () => {
  for (const path of [forbiddenArchivesRoot, `${forbiddenArchivesRoot}/index`]) {
    assert.equal(shouldHideForbiddenArchiveBranch(path, false), true)
    assert.equal(shouldHideForbiddenArchiveBranch(path, true), false)
  }
  assert.equal(shouldHideForbiddenArchiveBranch("index", false), false)
  assert.equal(shouldHideForbiddenArchiveBranch(undefined, false), false)
  assert.equal(shouldHideForbiddenArchiveBranch(`${forbiddenArchivesRoot}-notes`, false), false)
})

test("only the archive landing page reveals its explorer branch", () => {
  for (const slug of [
    forbiddenArchivesRoot,
    `${forbiddenArchivesRoot}/index`,
    `/${forbiddenArchivesRoot}/`,
  ]) {
    assert.equal(isForbiddenArchivesLanding(slug), true)
  }
  for (const slug of [
    undefined,
    "index",
    `${forbiddenArchivesRoot}/code-ooc`,
    `${forbiddenArchivesRoot}/01.-the-black-writ`,
    `${forbiddenArchivesRoot}-notes`,
  ]) {
    assert.equal(isForbiddenArchivesLanding(slug), false)
  }
})

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
