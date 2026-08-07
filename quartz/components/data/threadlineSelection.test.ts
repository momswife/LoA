import test, { describe } from "node:test"
import assert from "node:assert/strict"
import { ThreadlinePost } from "./threadlinePosts"
import { selectThreadlinePost, ThreadlineSelectionState } from "./threadlineSelection"

const posts: ThreadlinePost[] = [
  {
    id: "north-one",
    avatar: "N",
    source: "North Desk",
    handle: "@NorthDesk",
    marker: "verified",
    text: "First report.",
    tags: [],
  },
  {
    id: "north-two",
    avatar: "N",
    source: "North Desk",
    handle: "@NorthDesk",
    marker: "verified",
    text: "Second report.",
    tags: [],
  },
  {
    id: "harbor-one",
    avatar: "H",
    source: "Harbor Desk",
    handle: "@HarborDesk",
    marker: "verified",
    text: "Harbor report.",
    tags: [],
  },
  {
    id: "market-one",
    avatar: "M",
    source: "Market Bell",
    handle: "@MarketBell",
    marker: "field",
    text: "Market report.",
    tags: [],
  },
]

function state(overrides: Partial<ThreadlineSelectionState> = {}): ThreadlineSelectionState {
  return {
    visibleIds: new Set(),
    visibleHandles: new Set(),
    recentlySeenHandles: new Map(),
    availablePostIds: new Set(posts.map((post) => post.id)),
    now: 1_000_000,
    accountCooldown: 100_000,
    ...overrides,
  }
}

describe("selectThreadlinePost", () => {
  test("never places the same account on the board twice", () => {
    const selected = selectThreadlinePost(
      posts,
      state({
        visibleIds: new Set(["north-one"]),
        visibleHandles: new Set(["@NorthDesk"]),
      }),
      () => 0,
    )

    assert.equal(selected?.handle, "@HarborDesk")
  })

  test("keeps recently removed accounts out while another account is available", () => {
    const selected = selectThreadlinePost(
      posts,
      state({ recentlySeenHandles: new Map([["@NorthDesk", 950_000]]) }),
      () => 0,
    )

    assert.equal(selected?.id, "harbor-one")
  })

  test("prefers an unused post from the no-repeat bag", () => {
    const selected = selectThreadlinePost(
      posts,
      state({ availablePostIds: new Set(["market-one"]) }),
      () => 0,
    )

    assert.equal(selected?.id, "market-one")
  })

  test("prioritizes account spacing over an almost-empty post bag", () => {
    const selected = selectThreadlinePost(
      posts,
      state({
        recentlySeenHandles: new Map([["@NorthDesk", 950_000]]),
        availablePostIds: new Set(["north-two"]),
      }),
      () => 0,
    )

    assert.equal(selected?.id, "harbor-one")
  })

  test("falls back gracefully when every non-visible account is cooling down", () => {
    const selected = selectThreadlinePost(
      posts,
      state({
        recentlySeenHandles: new Map([
          ["@NorthDesk", 950_000],
          ["@HarborDesk", 950_000],
          ["@MarketBell", 950_000],
        ]),
      }),
      () => 0,
    )

    assert.equal(selected?.id, "north-one")
  })
})
