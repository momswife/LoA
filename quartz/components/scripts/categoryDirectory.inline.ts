function closeCategoryDialog(dialog: HTMLDialogElement) {
  if (typeof dialog.close === "function") {
    dialog.close()
  } else {
    dialog.removeAttribute("open")
  }

  if (!document.querySelector(".category-dialog[open]")) {
    document.documentElement.classList.remove("category-dialog-open")
  }
}

function setupCategoryDialogs() {
  for (const directory of document.querySelectorAll<HTMLElement>(".category-directory")) {
    if (directory.dataset.dialogsReady === "true") continue
    directory.dataset.dialogsReady = "true"

    const cleanup: Array<() => void> = []

    for (const opener of directory.querySelectorAll<HTMLElement>("[data-category-dialog-open]")) {
      const openDialog = () => {
        const id = opener.dataset.categoryDialogOpen
        const dialog = id ? document.getElementById(id) : null
        if (!(dialog instanceof HTMLDialogElement)) return

        if (typeof dialog.showModal === "function") {
          dialog.showModal()
        } else {
          dialog.setAttribute("open", "")
        }
        document.documentElement.classList.add("category-dialog-open")
      }

      opener.addEventListener("click", openDialog)
      cleanup.push(() => opener.removeEventListener("click", openDialog))
    }

    for (const dialog of directory.querySelectorAll<HTMLDialogElement>(".category-dialog")) {
      const closeButton = dialog.querySelector<HTMLElement>("[data-category-dialog-close]")
      const closeFromButton = () => closeCategoryDialog(dialog)
      const closeFromBackdrop = (event: MouseEvent) => {
        if (event.target === dialog) closeCategoryDialog(dialog)
      }
      const syncClosedState = () => {
        if (!document.querySelector(".category-dialog[open]")) {
          document.documentElement.classList.remove("category-dialog-open")
        }
      }

      closeButton?.addEventListener("click", closeFromButton)
      dialog.addEventListener("click", closeFromBackdrop)
      dialog.addEventListener("close", syncClosedState)
      cleanup.push(() => {
        closeButton?.removeEventListener("click", closeFromButton)
        dialog.removeEventListener("click", closeFromBackdrop)
        dialog.removeEventListener("close", syncClosedState)
      })
    }

    window.addCleanup(() => cleanup.forEach((remove) => remove()))
  }
}

document.addEventListener("nav", setupCategoryDialogs)
document.addEventListener("render", setupCategoryDialogs)
document.addEventListener("prenav", () => {
  document.querySelectorAll<HTMLDialogElement>(".category-dialog[open]").forEach((dialog) => {
    closeCategoryDialog(dialog)
  })
})
