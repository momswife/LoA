import type { FullSlug } from "./path"

export const forbiddenArchivesRoot = "aerathon---eternal-labyrinths/iv.-forbidden-archives"

export function isForbiddenArchive(slug: string | undefined): boolean {
  return slug === forbiddenArchivesRoot || slug?.startsWith(`${forbiddenArchivesRoot}/`) === true
}

export const forbiddenArchivesIndex = `${forbiddenArchivesRoot}/index` as FullSlug
