import { ThreadlinePost } from "./threadlinePosts"

export type ThreadlineSelectionState = {
  visibleIds: ReadonlySet<string>
  visibleHandles: ReadonlySet<string>
  recentlySeenHandles: ReadonlyMap<string, number>
  availablePostIds: ReadonlySet<string>
  now: number
  accountCooldown: number
}

function randomItem<T>(items: T[], random: () => number): T | undefined {
  return items[Math.floor(random() * items.length)]
}

/**
 * Selects the next post while keeping every visible account unique. Account
 * spacing takes priority over exhausting the post bag, so a prolific account
 * cannot crowd out smaller local voices.
 */
export function selectThreadlinePost(
  posts: ThreadlinePost[],
  state: ThreadlineSelectionState,
  random: () => number = Math.random,
): ThreadlinePost | undefined {
  const safePosts = posts.filter(
    (post) => !state.visibleIds.has(post.id) && !state.visibleHandles.has(post.handle),
  )
  const cooledPosts = safePosts.filter((post) => {
    const lastSeen = state.recentlySeenHandles.get(post.handle)
    return lastSeen === undefined || state.now - lastSeen >= state.accountCooldown
  })
  const unusedCooledPosts = cooledPosts.filter((post) => state.availablePostIds.has(post.id))

  if (unusedCooledPosts.length > 0) return randomItem(unusedCooledPosts, random)
  if (cooledPosts.length > 0) return randomItem(cooledPosts, random)

  const unusedSafePosts = safePosts.filter((post) => state.availablePostIds.has(post.id))
  return randomItem(unusedSafePosts.length > 0 ? unusedSafePosts : safePosts, random)
}
