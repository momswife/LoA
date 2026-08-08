type ExplorerFolderState = {
  path: string
  collapsed: boolean
}

const explorerAccordionRoot = document.documentElement

if (explorerAccordionRoot.dataset.explorerAccordionReady !== "true") {
  explorerAccordionRoot.dataset.explorerAccordionReady = "true"

  const getDirectChild = (element: Element, className: string) =>
    [...element.children].find((child) => child.classList.contains(className)) as
      | HTMLElement
      | undefined

  const getFolderOuter = (item: Element) => getDirectChild(item, "folder-outer")
  const getFolderContainer = (item: Element) => getDirectChild(item, "folder-container")
  const getFolderPath = (item: Element) => getFolderContainer(item)?.dataset.folderpath

  const readFolderState = (): ExplorerFolderState[] => {
    try {
      const parsed = JSON.parse(localStorage.getItem("fileTree") || "[]")
      if (!Array.isArray(parsed)) return []
      return parsed.filter(
        (item): item is ExplorerFolderState =>
          typeof item?.path === "string" && typeof item?.collapsed === "boolean",
      )
    } catch {
      return []
    }
  }

  const persistFolderChanges = (explorer: HTMLElement, changes: Map<string, boolean>) => {
    if (explorer.dataset.savestate === "false" || changes.size === 0) return

    const saved = readFolderState()
    let changed = false
    for (const [path, collapsed] of changes) {
      const existing = saved.find((item) => item.path === path)
      if (existing) {
        if (existing.collapsed !== collapsed) {
          existing.collapsed = collapsed
          changed = true
        }
      } else {
        saved.push({ path, collapsed })
        changed = true
      }
    }

    if (!changed) return
    try {
      localStorage.setItem("fileTree", JSON.stringify(saved))
    } catch {
      // The accordion still works when storage is unavailable.
    }
  }

  const syncFolderAria = (item: Element, open: boolean) => {
    const container = getFolderContainer(item)
    const button = container?.querySelector<HTMLElement>(".folder-button")
    button?.setAttribute("aria-expanded", String(open))
  }

  const collapseSiblingFolders = (item: Element, changes: Map<string, boolean>) => {
    const siblings = item.parentElement?.children
    if (!siblings) return

    for (const sibling of siblings) {
      if (sibling === item) continue
      const siblingOuter = getFolderOuter(sibling)
      if (!siblingOuter?.classList.contains("open")) continue

      siblingOuter.classList.remove("open")
      syncFolderAria(sibling, false)
      const siblingPath = getFolderPath(sibling)
      if (siblingPath) changes.set(siblingPath, true)
    }
  }

  const focusActiveBranch = (explorer: HTMLElement) => {
    for (const item of explorer.querySelectorAll("li")) {
      const outer = getFolderOuter(item)
      if (outer) syncFolderAria(item, outer.classList.contains("open"))
    }

    const activeLink = explorer.querySelector<HTMLElement>(".explorer-ul a.active")
    if (!activeLink) return

    const changes = new Map<string, boolean>()
    let item: Element | null = activeLink.closest("li")
    while (item && explorer.contains(item)) {
      const outer = getFolderOuter(item)
      if (outer) {
        outer.classList.add("open")
        syncFolderAria(item, true)
        const folderPath = getFolderPath(item)
        if (folderPath) changes.set(folderPath, false)
        collapseSiblingFolders(item, changes)
      }
      item = item.parentElement?.closest("li") ?? null
    }

    persistFolderChanges(explorer, changes)
  }

  let focusScheduled = false
  const scheduleActiveBranchFocus = () => {
    if (focusScheduled) return
    focusScheduled = true
    requestAnimationFrame(() => {
      focusScheduled = false
      document
        .querySelectorAll<HTMLElement>(".explorer")
        .forEach((explorer) => focusActiveBranch(explorer))
    })
  }

  document.addEventListener(
    "click",
    (event) => {
      const target = event.target
      if (!(target instanceof Element)) return
      const control = target.closest<HTMLElement>(".folder-button, .folder-icon")
      const explorer = control?.closest<HTMLElement>(".explorer")
      const item = control?.closest("li")
      if (!explorer || !item) return

      requestAnimationFrame(() => {
        const outer = getFolderOuter(item)
        if (!outer) return

        const open = outer.classList.contains("open")
        const changes = new Map<string, boolean>()
        const folderPath = getFolderPath(item)
        if (folderPath) changes.set(folderPath, !open)
        syncFolderAria(item, open)
        if (open) collapseSiblingFolders(item, changes)
        persistFolderChanges(explorer, changes)
      })
    },
    true,
  )

  const treeObserver = new MutationObserver((mutations) => {
    if (mutations.some((mutation) => mutation.addedNodes.length > 0)) {
      scheduleActiveBranchFocus()
    }
  })
  treeObserver.observe(document.body, { childList: true, subtree: true })

  document.addEventListener("nav", scheduleActiveBranchFocus)
  document.addEventListener("render", scheduleActiveBranchFocus)
  scheduleActiveBranchFocus()
}
