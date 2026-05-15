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
    enablePopovers: true,
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
        header: " IM Fell Great Primer SC ",
        body: "Lora",
        code: "Merienda",
      },
      colors: {
        lightMode: {
          light: "#ffffff",
          lightgray: "#f2f1ed",
          gray: "#aaa8a0",
          darkgray: "#3d3c39",
          dark: "#121212",
          secondary: "#ca5c1a",
          tertiary: "#e1873c",
          highlight: "rgba(173, 147, 100, 0.64)",
          textHighlight: "#fff3da",
        },
        darkMode: {
          light: "#161615",
          lightgray: "#2a2a28",
          gray: "#5e5b54",
          darkgray: "#c9c4b6",
          dark: "#f1efe8",
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
