// Carrega o Playwright. O projeto vive no Google Drive, que zera os arquivos de node_modules,
// então as dependências ficam em %LOCALAPPDATA%\gustavo-correa-site-deps (npm run deps).
import { createRequire } from "node:module";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const bases = [
  import.meta.url,
  pathToFileURL(join(process.env.LOCALAPPDATA || process.env.HOME || "", "gustavo-correa-site-deps", "index.js")).href
];

let modulo;
for (const base of bases) {
  try {
    const caminho = createRequire(base).resolve("playwright");
    const m = await import(pathToFileURL(caminho).href);
    modulo = m.chromium ? m : m.default;
    if (modulo?.chromium) break;
  } catch { /* tenta a próxima base */ }
}
if (!modulo?.chromium) throw new Error("Playwright não encontrado. Rode: npm run deps");

export const { chromium } = modulo;
