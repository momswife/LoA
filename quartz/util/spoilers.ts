export const MDO_ARCHIVAL_WARNING_PREFIX =
  "MDO ARCHIVAL CODE — OOC — REVIEW AT YOUR OWN DISCRETION."
export const DEFAULT_SPOILER_WARNING = `${MDO_ARCHIVAL_WARNING_PREFIX} This record contains unrevealed campaign information and may disclose future plot developments.`
export const SPOILER_READING_TEXT_KEY = "spoilerReadingText"

type SpoilerFrontmatter = {
  spoiler?: unknown
  spoilerWarning?: unknown
}

function asFrontmatter(value: unknown): SpoilerFrontmatter | undefined {
  return value !== null && typeof value === "object" ? (value as SpoilerFrontmatter) : undefined
}

export function isSpoilerFrontmatter(value: unknown): boolean {
  return asFrontmatter(value)?.spoiler === true
}

export function spoilerWarningFor(value: unknown): string {
  const warning = asFrontmatter(value)?.spoilerWarning
  return typeof warning === "string" && warning.trim().length > 0
    ? `${MDO_ARCHIVAL_WARNING_PREFIX} ${warning.trim()}`
    : DEFAULT_SPOILER_WARNING
}
