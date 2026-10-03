import { trieFromAllFiles } from "./ctx"
import type { QuartzPluginData } from "../plugins/vfile"

export function publicDirectoryTrie(files: QuartzPluginData[]) {
  // Virtual pages lack source paths; only source records belong in this directory.
  return trieFromAllFiles(
    files.filter((file) => file.slug && file.filePath && file.unlisted !== true),
  )
}
