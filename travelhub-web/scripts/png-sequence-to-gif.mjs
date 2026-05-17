#!/usr/bin/env node
/**
 * Une PNG en `docs/assets/gif-frames/<locale>/` → `docs/reservation-flow-demo-<locale>.gif` (junto al .md).
 * Uso: `node scripts/png-sequence-to-gif.mjs` | `... es` | `... en` | `... all`
 * Requiere ffmpeg (`brew install ffmpeg`).
 */

import { copyFileSync, existsSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { execSync } from "node:child_process";

const root = process.cwd();

const sequence = [
  "01-results.png",
  "02-detail.png",
  "03-checkout.png",
  "04-voucher.png",
  "05-confirmation.png",
];

const tmp = ["01.png", "02.png", "03.png", "04.png", "05.png"];

/**
 * @param {string} locale
 */
function buildOneGif(locale) {
  const dir = join(root, "docs", "assets", "gif-frames", locale);
  const out = join(root, "docs", `reservation-flow-demo-${locale}.gif`);

  for (const f of sequence) {
    if (!existsSync(join(dir, f))) {
      console.error(
        `Falta ${join("docs/assets/gif-frames", locale, f)}. Ejecuta primero:\n  RECORD_GIF=1 npx playwright test e2e/reservation-flow-gif.spec.js --workers=1\n`,
      );
      process.exit(1);
    }
  }

  for (let i = 0; i < sequence.length; i++) {
    copyFileSync(join(dir, sequence[i]), join(dir, tmp[i]));
  }

  const input = join(dir, "%02d.png");

  try {
    execSync(
      `ffmpeg -y -framerate 0.33 -i "${input}" -vf "fps=10,scale=960:-1:flags=lanczos,split[s0][s1];[s0]palettegen=stats_mode=single[p];[s1][p]paletteuse=dither=bayer" -loop 0 "${out}"`,
      { stdio: "inherit", shell: true },
    );
  } catch {
    console.error(
      "\nffmpeg falló. Instálalo (p. ej. macOS: brew install ffmpeg) y vuelve a ejecutar:\n  node scripts/png-sequence-to-gif.mjs all\n",
    );
    process.exit(1);
  } finally {
    for (const f of tmp) {
      try {
        unlinkSync(join(dir, f));
      } catch {
        /* ignore */
      }
    }
  }

  console.log(`GIF escrito: ${out}`);
}

const arg = process.argv[2] || "all";
const locales = arg === "all" ? ["es", "en"] : [arg];

for (const lng of locales) {
  if (lng !== "es" && lng !== "en") {
    console.error('Uso: node scripts/png-sequence-to-gif.mjs [es|en|all]');
    process.exit(1);
  }
  buildOneGif(lng);
}
