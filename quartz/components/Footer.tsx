import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"

interface Options {
  links: Record<string, string>
}

export default ((opts?: Options) => {
  const Footer: QuartzComponent = ({ displayClass, cfg }: QuartzComponentProps) => {
    const year = new Date().getFullYear()
    const links = opts?.links ?? []
    return (
      <footer class={`${displayClass ?? ""}`}>
        <p>
          © {year} {cfg.pageTitle}
        </p>
        <ul>
          {Object.entries(links).map(([text, link]) => (
            <li>
              <a href={link}>{text}</a>
            </li>
          ))}
        </ul>
      </footer>
    )
  }

  Footer.css = `
  footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    margin: 0;
    padding: 1.5rem 0 2rem;
  }

  footer p,
  footer ul {
    margin: 0;
  }

  footer ul {
    display: flex;
    gap: 1rem;
    padding: 0;
    list-style: none;
  }

  @media (max-width: 800px) {
    footer {
      align-items: flex-start;
      flex-direction: column;
    }
  }
  `
  return Footer
}) satisfies QuartzComponentConstructor
