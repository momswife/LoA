import { QuartzConfig } from "./quartz/cfg"
import * as Plugin from "./quartz/plugins"

/**
 * Quartz 4 Configuration
 *
 * See https://quartz.jzhao.xyz/configuration for more information.
 */
const config: QuartzConfig = {
  configuration: {
    pageTitle: "Lore Vault",
    pageTitleSuffix: "",
    enableSPA: true,
    enablePopovers: false,
    analytics: {
      provider: "plausible",
    },
    locale: "en-US",
    baseUrl: "momswife.github.io/LoA",
    ignorePatterns: ["private/**", "templates/**", ".obsidian/**"],
    defaultDateType: "modified",
    theme: {
      fontOrigin: "googleFonts",
      cdnCaching: true,
      typography: {
        header: "IM Fell Great Primer SC",
        body: "Lora",
        code: "IBM Plex Mono",
      },
      colors: {
        lightMode: {
          light: "#f7f1e5",
          lightgray: "#e9e0d2",
          gray: "#999084",
          darkgray: "#514a42",
          dark: "#29251f",
          secondary: "#ca5c1a",
          tertiary: "#e1873c",
          highlight: "rgba(173, 147, 100, 0.64)",
          textHighlight: "#fff3da",
        },
        darkMode: {
          light: "#1d1b19",
          lightgray: "#2c2925",
          gray: "#776f64",
          darkgray: "#cec4b5",
          dark: "#f3eadc",
          secondary: "#f58b40",
          tertiary: "#ffb066",
          highlight: "rgba(172, 135, 100, 0.36)",
          textHighlight: "#fff9e2",
        },
      },
    },
  },
  plugins: {
    transformers: [
      Plugin.FrontMatter(),
      Plugin.CreatedModifiedDate({
        priority: ["frontmatter", "git", "filesystem"],
      }),
      Plugin.SyntaxHighlighting({
        theme: {
          light: "github-light",
          dark: "github-dark",
        },
        keepBackground: false,
      }),
      Plugin.ObsidianFlavoredMarkdown({ enableInHtmlEmbed: false }),
      Plugin.GitHubFlavoredMarkdown(),
      Plugin.AerathonMap(),
      Plugin.TableOfContents({ filter: "romanNumeralSections" }),
      Plugin.CrawlLinks({ markdownLinkResolution: "shortest" }),
      Plugin.Description(),
      Plugin.Latex({ renderEngine: "katex" }),
      Plugin.RecordDetails(),
    ],
    filters: [Plugin.RemoveDrafts()],
    emitters: [
      Plugin.AliasRedirects(),
      Plugin.ComponentResources(),
      Plugin.ContentPage(),
      Plugin.FolderPage(),
      Plugin.TagPage(),
      Plugin.ContentIndex({
        enableSiteMap: true,
        enableRSS: true,
      }),
      Plugin.Assets(),
      Plugin.Static(),
      Plugin.Favicon(),
      Plugin.NotFoundPage(),
      // Per-page social images are useful but slow. Re-enable when the publishing flow needs them.
      // Plugin.CustomOgImages(),
    ],
  },
}

export default config
