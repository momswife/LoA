import path from "node:path"
import { FullSlug, isRelativeURL, simplifySlug } from "./path"

export type ShareRecord = {
  slug: string
  aliases?: string[]
  frontmatter?: Record<string, unknown>
}

export function shareAddress(baseUrl: string, permalink: string): string {
  return new URL(permalink, `https://${baseUrl.replace(/\/+$/, "")}/`).href
}

export function validateShareLinks(records: ShareRecord[]): void {
  const claims = new Map<string, Set<string>>()
  const key = (value: string) =>
    simplifySlug(value as FullSlug)
      .replace(/\/$/, "")
      .toLowerCase()
  const claim = (address: string, owner: string) => {
    const owners = claims.get(key(address)) ?? new Set<string>()
    owners.add(owner)
    claims.set(key(address), owners)
  }
  for (const record of records) {
    claim(record.slug, record.slug)
    for (const alias of record.aliases ?? []) {
      const target = isRelativeURL(alias)
        ? path.posix.normalize(path.posix.join(record.slug, "..", alias))
        : alias
      claim(target, record.slug)
    }
    if (typeof record.frontmatter?.permalink === "string") {
      claim(record.frontmatter.permalink, record.slug)
    }
  }
  for (const record of records) {
    const permalink = record.frontmatter?.permalink
    if (permalink === undefined) continue
    if (
      typeof permalink !== "string" ||
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(permalink) ||
      /^(index|404|tags|static|assets|robots|sitemap)$/.test(permalink)
    ) {
      throw new Error(`Invalid short address ${JSON.stringify(permalink)} in ${record.slug}`)
    }
    const owners = claims.get(key(permalink))!
    if (owners.size > 1) {
      throw new Error(`Short address "${permalink}" conflicts: ${[...owners].join(", ")}`)
    }
    // A short address must not occupy an existing folder route.
    if (records.some((other) => other.slug.startsWith(`${permalink}/`))) {
      throw new Error(`Short address "${permalink}" conflicts with an existing folder`)
    }
  }
}
