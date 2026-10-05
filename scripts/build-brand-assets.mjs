import fs from "node:fs/promises"
import { fileURLToPath } from "node:url"
import sharp from "sharp"

// Keep the favicon and share card reproducible from the editable vector master.
const assets = new URL("../quartz/static/", import.meta.url)
const mark = await fs.readFile(new URL("labyrinth-heart.svg", assets), "utf8")
const contents = mark.slice(mark.indexOf(">") + 1, mark.lastIndexOf("</svg>"))
const card = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#1d1b19"/>
  <path d="M0 10H1200" stroke="#c96632" stroke-width="2"/>
  <g fill="none" stroke="#cec4b5" stroke-opacity=".055" stroke-width="22">
    <path d="m1070 55 260 260-310 310-310-310 310-310"/>
    <path d="m1020 150-165 165 165 165 165-165-90-90"/>
  </g>
  <svg x="78" y="154" width="128" height="128" viewBox="-8 -8 116 116">${contents}</svg>
  <text x="244" y="245" fill="#f3eadc" font-family="Georgia, serif" font-size="76" letter-spacing="2">Lore Vault</text>
  <text x="82" y="366" fill="#cec4b5" font-family="Georgia, serif" font-size="27">
    <tspan x="82">Every expedition leaves a record. Some return as maps,</tspan>
    <tspan x="82" dy="43">others as warnings. The Ministry preserves them all—</tspan>
    <tspan x="82" dy="43">even when the accounts disagree.</tspan>
  </text>
</svg>`
await fs.writeFile(new URL("og-image-labyrinth-heart.svg", assets), card)
await sharp(Buffer.from(card))
  .png()
  .toFile(fileURLToPath(new URL("og-image-labyrinth-heart.png", assets)))
await sharp(Buffer.from(mark))
  .resize(512, 512)
  .png()
  .toFile(fileURLToPath(new URL("icon.png", assets)))
