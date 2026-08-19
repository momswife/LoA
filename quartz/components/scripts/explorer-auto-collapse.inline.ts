type ExplorerFolderState = { path: string; collapsed: boolean }

function readSavedFolderState(): ExplorerFolderState[] {
  try {
    const storedState: unknown = JSON.parse(localStorage.getItem("fileTree") ?? "[]")
    if (!Array.isArray(storedState)) return []
    return storedState.filter(
      (item): item is ExplorerFolderState =>
        typeof item?.path === "string" && typeof item?.collapsed === "boolean",
    )
  } catch {
    return []
  }
}

function persistFolderChanges(explorer: HTMLElement, changes: Map<string, boolean>) {
  if (explorer.dataset.savestate === "false" || changes.size === 0) return
  const savedState = readSavedFolderState()
  let stateChanged = false
  for (const [path, collapsed] of changes) {
    const existingState = savedState.find((item) => item.path === path)
    if (existingState?.collapsed === collapsed) continue
    if (existingState) existingState.collapsed = collapsed
    else savedState.push({ path, collapsed })
    stateChanged = true
  }
  if (!stateChanged) return

  try {
    localStorage.setItem("fileTree", JSON.stringify(savedState))
  } catch {
    // The accordion remains usable when browser storage is unavailable.
  }
}

function directChildByClass(element: Element, className: string): HTMLElement | undefined {
  return [...element.children].find(
    (child): child is HTMLElement =>
      child instanceof HTMLElement && child.classList.contains(className),
  )
}

function folderBranch(folderContainer: HTMLElement): HTMLElement | undefined {
  const branch = folderContainer.nextElementSibling
  return branch instanceof HTMLElement && branch.classList.contains("folder-outer")
    ? branch
    : undefined
}

function setFolderExpanded(
  folderContainer: HTMLElement,
  expanded: boolean,
  changes: Map<string, boolean>,
) {
  folderBranch(folderContainer)?.classList.toggle("open", expanded)
  folderContainer
    .querySelector<HTMLElement>(".folder-button")
    ?.setAttribute("aria-expanded", String(expanded))

  const folderPath = folderContainer.dataset.folderpath
  if (folderPath) changes.set(folderPath, !expanded)
}

function directChildFolders(folderContainer: HTMLElement): HTMLElement[] {
  const folderList = folderBranch(folderContainer)?.querySelector<HTMLElement>(":scope > ul")
  if (!folderList) return []

  return [...folderList.children].flatMap((item) => {
    const folder = directChildByClass(item, "folder-container")
    return folder ? [folder] : []
  })
}

function archiveRootAndDivisions(explorer: HTMLElement) {
  for (const candidate of explorer.querySelectorAll<HTMLElement>(".folder-container")) {
    const divisions = new Map<string, HTMLElement>()
    for (const folder of directChildFolders(candidate)) {
      const title = folder.querySelector<HTMLElement>(".folder-title")?.textContent?.trim() ?? ""
      const numeral = title.match(/^(I|II|III)\.\s/)?.[1]
      if (numeral) divisions.set(numeral, folder)
    }

    if (divisions.size === 3) {
      return {
        root: candidate,
        divisions: [divisions.get("I")!, divisions.get("II")!, divisions.get("III")!],
      }
    }
  }

  return undefined
}

function folderContainsCurrentPage(folderContainer: HTMLElement, currentSlug: string) {
  const folderPath = folderContainer.dataset.folderpath?.replace(/\/index$/, "")
  return Boolean(
    folderPath && (currentSlug === folderPath || currentSlug.startsWith(`${folderPath}/`)),
  )
}

function normalizeExplorerForNavigation(explorer: HTMLElement) {
  const archive = archiveRootAndDivisions(explorer)
  if (!archive) return

  const currentSlug = (document.body.dataset.slug ?? "").replace(/^\/+/, "")
  const changes = new Map<string, boolean>()

  // The archive root remains open even on the home page, where there is no
  // active lore path to open it automatically.
  setFolderExpanded(archive.root, true, changes)

  for (const division of archive.divisions) {
    const divisionIsActive = folderContainsCurrentPage(division, currentSlug)
    const divisionFolders = [
      division,
      ...(folderBranch(division)?.querySelectorAll<HTMLElement>(".folder-container") ?? []),
    ]

    for (const folder of divisionFolders) {
      setFolderExpanded(
        folder,
        divisionIsActive && folderContainsCurrentPage(folder, currentSlug),
        changes,
      )
    }
  }

  persistFolderChanges(explorer, changes)
}

function collapseOpenSiblings(explorer: HTMLElement, openedFolder: HTMLElement) {
  const openedItem = openedFolder.parentElement
  const siblingList = openedItem?.parentElement
  if (!openedItem || !siblingList) return

  const changes = new Map<string, boolean>()
  for (const siblingItem of siblingList.children) {
    if (!(siblingItem instanceof HTMLElement) || siblingItem === openedItem) continue

    const siblingFolder = directChildByClass(siblingItem, "folder-container")
    const siblingBranch = directChildByClass(siblingItem, "folder-outer")
    if (!siblingFolder || !siblingBranch?.classList.contains("open")) continue

    setFolderExpanded(siblingFolder, false, changes)
  }
  persistFolderChanges(explorer, changes)
}

const explorerNormalizers = new WeakMap<HTMLElement, () => void>()

function setupExplorerAutoCollapse() {
  for (const explorer of document.querySelectorAll<HTMLElement>(".explorer")) {
    if (explorer.dataset.autoCollapseReady === "true") {
      explorerNormalizers.get(explorer)?.()
      continue
    }
    explorer.dataset.autoCollapseReady = "true"

    let normalizationFrame: number | undefined
    const scheduleNormalization = () => {
      if (normalizationFrame !== undefined) return
      normalizationFrame = requestAnimationFrame(() => {
        normalizationFrame = undefined
        normalizeExplorerForNavigation(explorer)
      })
    }
    explorerNormalizers.set(explorer, scheduleNormalization)

    const handleFolderClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return
      const folderControl = event.target.closest(".folder-icon, .folder-button")
      const folderContainer = folderControl?.closest<HTMLElement>(".folder-container")
      if (!folderContainer || !explorer.contains(folderContainer)) return

      // The Explorer's own click handler toggles the requested branch first.
      // Waiting a microtask lets us react only when that branch was opened.
      queueMicrotask(() => {
        const branch = folderContainer.nextElementSibling
        const isOpen = branch?.classList.contains("open") ?? false
        folderContainer
          .querySelector<HTMLElement>(".folder-button")
          ?.setAttribute("aria-expanded", String(isOpen))
        if (isOpen) {
          collapseOpenSiblings(explorer, folderContainer)
        }
      })
    }

    explorer.addEventListener("click", handleFolderClick)
    const explorerTree = explorer.querySelector<HTMLElement>(".explorer-ul")
    const treeObserver = new MutationObserver(scheduleNormalization)
    if (explorerTree) treeObserver.observe(explorerTree, { childList: true })
    scheduleNormalization()

    window.addCleanup(() => {
      explorer.removeEventListener("click", handleFolderClick)
      treeObserver.disconnect()
      if (normalizationFrame !== undefined) cancelAnimationFrame(normalizationFrame)
      explorerNormalizers.delete(explorer)
      delete explorer.dataset.autoCollapseReady
    })
  }
}

document.addEventListener("nav", setupExplorerAutoCollapse)
document.addEventListener("render", setupExplorerAutoCollapse)
