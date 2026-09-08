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
        <div class="footer-meta">
          <p>
            © {year} {cfg.pageTitle}
          </p>
          <div class="rules-attribution">
            <button type="button" aria-describedby="rules-attribution-copy">
              SRD 5.2.1
            </button>
            <div id="rules-attribution-copy" class="rules-attribution__copy" role="tooltip">
              This site includes material from the{" "}
              <a href="https://www.dndbeyond.com/srd">System Reference Document 5.2.1</a>
              {' ("SRD 5.2.1") by Wizards of the Coast LLC. The SRD 5.2.1 is licensed under '}
              <a href="https://creativecommons.org/licenses/by/4.0/legalcode">
                Creative Commons Attribution 4.0 International
              </a>
              . Original Aerathon rules profiles may also use SRD 5.2.1 terminology.
            </div>
          </div>
        </div>
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

  .footer-meta {
    display: flex;
    align-items: center;
    gap: 0.65rem;
  }

  .rules-attribution {
    position: relative;
    display: inline-flex;
  }

  .rules-attribution > button {
    padding: 0;
    border: 0;
    border-bottom: 1px dotted currentColor;
    border-radius: 0;
    background: transparent;
    color: var(--gray);
    cursor: help;
    font: inherit;
    font-size: 0.66rem;
    line-height: 1.2;
    opacity: 0.72;
  }

  .rules-attribution > button:focus-visible {
    outline: 2px solid var(--tertiary);
    outline-offset: 3px;
  }

  .rules-attribution__copy {
    position: absolute;
    bottom: calc(100% + 0.65rem);
    left: 0;
    z-index: 10;
    width: min(28rem, calc(100vw - 3rem));
    box-sizing: border-box;
    padding: 0.75rem 0.85rem;
    visibility: hidden;
    border: 1px solid var(--lorevault-border);
    border-radius: 0.55rem;
    background: var(--lorevault-surface-raised);
    box-shadow: var(--lorevault-shadow);
    color: var(--darkgray);
    font-size: 0.72rem;
    line-height: 1.45;
    opacity: 0;
    pointer-events: none;
    transform: translateY(0.25rem);
    transition:
      opacity 140ms ease,
      transform 140ms ease,
      visibility 140ms ease;
  }

  .rules-attribution__copy a {
    pointer-events: auto;
  }

  .rules-attribution:hover .rules-attribution__copy,
  .rules-attribution:focus-within .rules-attribution__copy {
    visibility: visible;
    opacity: 1;
    pointer-events: auto;
    transform: translateY(0);
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

    .footer-meta {
      flex-wrap: wrap;
    }

    .rules-attribution__copy {
      position: fixed;
      right: 1rem;
      bottom: 1rem;
      left: 1rem;
      width: auto;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .rules-attribution__copy {
      transition: none;
    }
  }
  `
  return Footer
}) satisfies QuartzComponentConstructor
