import type { Root } from "hast"
import { QuartzTransformerPlugin } from "../types"
import {
  isSpoilerFrontmatter,
  spoilerWarningFor,
  SPOILER_READING_TEXT_KEY,
} from "../../util/spoilers"

export { SPOILER_READING_TEXT_KEY } from "../../util/spoilers"

/** Remove spoiler prose from public indexes while retaining it for reading-time metadata. */
export function protectSpoilerMetadata(data: Record<string, unknown>): boolean {
  if (!isSpoilerFrontmatter(data.frontmatter)) return false

  if (typeof data.text === "string" && data.text.length > 0) {
    data[SPOILER_READING_TEXT_KEY] = data.text
  }
  data.text = ""
  data.description = spoilerWarningFor(data.frontmatter)
  return true
}

export const SpoilerProtection: QuartzTransformerPlugin = () => ({
  name: "SpoilerProtection",
  htmlPlugins() {
    return [
      () => (_tree: Root, file) => {
        protectSpoilerMetadata(file.data)
      },
    ]
  },
})
