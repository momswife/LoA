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

function updateSavedFolderState(folderContainer: HTMLElement, collapsed: boolean) {
  const folderPath = folderContainer.dataset.folderpath
  if (!folderPath) return

  const savedState = readSavedFolderState()
  const existingState = savedState.find((item) => item.path === folderPath)
  if (existingState) existingState.collapsed = collapsed
  else savedState.push({ path: folderPath, collapsed })
  try {
    localStorage.setItem("fileTree", JSON.stringify(savedState))
  } catch {
    // The accordion remains usable when browser storage is unavailable.
  }
}

function collapseOpenSiblings(explorer: HTMLElement, openedFolder: HTMLElement) {
  const openedItem = openedFolder.parentElement
  const siblingList = openedItem?.parentElement
  if (!openedItem || !siblingList) return

  for (const siblingItem of siblingList.children) {
    if (!(siblingItem instanceof HTMLElement) || siblingItem === openedItem) continue

    const siblingFolder = [...siblingItem.children].find(
      (child): child is HTMLElement =>
        child instanceof HTMLElement && child.classList.contains("folder-container"),
    )
    const siblingBranch = [...siblingItem.children].find(
      (child): child is HTMLElement =>
        child instanceof HTMLElement && child.classList.contains("folder-outer"),
    )
    if (!siblingFolder || !siblingBranch?.classList.contains("open")) continue

    siblingBranch.classList.remove("open")
    siblingFolder
      .querySelector<HTMLElement>(".folder-button")
      ?.setAttribute("aria-expanded", "false")
    if (explorer.dataset.savestate === "true") updateSavedFolderState(siblingFolder, true)
  }
}

function setupExplorerAutoCollapse() {
  for (const explorer of document.querySelectorAll<HTMLElement>(".explorer")) {
    if (explorer.dataset.autoCollapseReady === "true") continue
    explorer.dataset.autoCollapseReady = "true"

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
    window.addCleanup(() => {
      explorer.removeEventListener("click", handleFolderClick)
      delete explorer.dataset.autoCollapseReady
    })
  }
}

document.addEventListener("nav", setupExplorerAutoCollapse)
document.addEventListener("render", setupExplorerAutoCollapse)
