import { QuartzConfig } from "./quartz/cfg"
import * as Plugin from "./quartz/plugins"

/**
 * Quartz 4.0 Configuration
 *
 * See https://quartz.jzhao.xyz/configuration for more information.
 */
const config: QuartzConfig = {
  configuration: {
    pageTitle: "📜 Grand Archives",
    pageTitleSuffix: "",
    enableSPA: true,
    enablePopovers: true,
    analytics: {
      provider: "plausible",
    },
    locale: "en-US",
    baseUrl: "https://momswife.github.io/LoA/",
    ignorePatterns: ["private", "templates", ".obsidian"],
    defaultDateType: "created",
    generateSocialImages: false,
    theme: {
      fontOrigin: "googleFonts",
      cdnCaching: true,
      typography: {
        header: "Eczar",
        body: "Lora",
        code: "Merienda",
      },
      colors: {
        lightMode: {
          light: "#EFCFD4",
          lightgray: "#C8C3D9",
          gray: "#A59BB0",
          darkgray: "#5B5468",
          dark: "#2F293D",
          secondary: "#7E5ABD",
          tertiary: "#9577C6",
          highlight: "rgba(143, 159, 169, 0.15)",
          textHighlight: "#BBA8E6",
        },
        darkMode: {
          light: "#1C1628",
          lightgray: "#3F3A51",
          gray: "#655E76",
          darkgray: "#A8A3BA",
          dark: "#D8D1EE",
          secondary: "#A57CD3",
          tertiary: "#B798E6",
          highlight: "rgba(143, 159, 169, 0.15)",
          textHighlight: "#B3B3C3",
        },
      },
    },
  },
  plugins: {
    transformers: [
      Plugin.FrontMatter(),
      Plugin.CreatedModifiedDate({
        priority: ["frontmatter", "filesystem"],
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
      Plugin.TableOfContents(),
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
      Plugin.NotFoundPage(),
    ],
  },
}

export default config
