import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { runInNewContext } from "node:vm"
import ts from "typescript"

test("reused spoiler controls reseal on navigation and rebind after SPA cleanup", () => {
  const events = new Map<string, (event: { type: string }) => void>()
  const changes = new Set<() => void>()
  const cleanups: (() => void)[] = []
  const control = {
    checked: true,
    addEventListener: (_name: string, fn: () => void) => changes.add(fn),
    removeEventListener: (_name: string, fn: () => void) => changes.delete(fn),
  }
  const gate = {
    dataset: {} as Record<string, string>,
    querySelector: () => control,
    closest: () => null,
  }
  const source = readFileSync(new URL("./spoiler-gate.inline.ts", import.meta.url), "utf8")
  runInNewContext(ts.transpileModule(source, {}).outputText, {
    document: {
      querySelectorAll: () => [gate],
      addEventListener: (name: string, fn: (event: { type: string }) => void) =>
        events.set(name, fn),
    },
    window: {
      addCleanup: (fn: () => void) => cleanups.push(fn),
      requestAnimationFrame: (fn: () => void) => fn(),
    },
  })
  events.get("nav")!({ type: "nav" })
  assert.equal(control.checked, false)
  assert.equal(changes.size, 1)

  control.checked = true
  events.get("render")!({ type: "render" })
  assert.equal(control.checked, true, "rendering the current page preserves deliberate clearance")
  assert.equal(changes.size, 1)

  for (const cleanup of cleanups.splice(0)) cleanup()
  assert.equal(changes.size, 0)
  assert.equal(gate.dataset.spoilerReady, undefined)
  events.get("nav")!({ type: "nav" })
  assert.equal(control.checked, false, "a reused checked input cannot reveal the next dossier")
  assert.equal(changes.size, 1, "focus enhancement is rebound after cleanup")
})
