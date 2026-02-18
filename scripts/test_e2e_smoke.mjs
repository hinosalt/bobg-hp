import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const assert = (ok, message) => {
  if (!ok) throw new Error(message);
};

const main = async () => {
  const jaPath = path.join(projectRoot, "index.html");
  const enPath = path.join(projectRoot, "en", "index.html");
  const cssPath = path.join(projectRoot, "styles.css");
  const manifestPath = path.join(projectRoot, "source", "manifest", "source-manifest.json");
  const renderedContentPath = path.join(projectRoot, "source", "manifest", "bobg-rendered-content.json");

  const [jaHtml, enHtml, css, manifestRaw, contentRaw] = await Promise.all([
    fs.readFile(jaPath, "utf8"),
    fs.readFile(enPath, "utf8"),
    fs.readFile(cssPath, "utf8"),
    fs.readFile(manifestPath, "utf8"),
    fs.readFile(renderedContentPath, "utf8"),
  ]);

  assert(!jaHtml.includes("<object"), "JA page must not use object/svg embed");
  assert(!enHtml.includes("<object"), "EN page must not use object/svg embed");
  assert(jaHtml.includes("id=\"brandLogo\""), "JA page missing brand logo target");
  assert(jaHtml.includes("id=\"listingGrid\""), "JA page missing listing target");
  assert(jaHtml.includes("id=\"newsMore\""), "JA page missing news more target");
  assert(jaHtml.includes("id=\"globalNav\""), "JA page missing nav target");
  assert(jaHtml.includes("id=\"heroTitle\""), "JA page missing hero target");
  assert(enHtml.includes("id=\"brandLogo\""), "EN page missing brand logo target");
  assert(enHtml.includes("id=\"listingGrid\""), "EN page missing listing target");
  assert(enHtml.includes("id=\"newsMore\""), "EN page missing news more target");
  assert(enHtml.includes("id=\"globalNav\""), "EN page missing nav target");
  assert(enHtml.includes("id=\"heroTitle\""), "EN page missing hero target");
  assert(css.includes("#17184B"), "styles.css missing brand color token");

  const manifest = JSON.parse(manifestRaw);
  assert(Array.isArray(manifest.files), "manifest files missing");
  assert(manifest.files.length >= 5, "manifest file count is lower than expected");

  const content = JSON.parse(contentRaw);
  assert(Array.isArray(content.textNodes), "rendered content texts missing");
  assert(Array.isArray(content.images), "rendered content images missing");
  assert(content.textNodes.length === 94, "rendered content text count mismatch");
  assert(content.images.length === 40, "rendered content image count mismatch");
  assert(jaHtml.includes("id=\"listing\""), "JA page missing separated listing section");
  assert(jaHtml.includes("id=\"news\""), "JA page missing news section");
  assert((await fs.readFile(path.join(projectRoot, "script.js"), "utf8")).includes("source/quoted/en/before0.png"), "script.js missing EN quoted asset wiring");

  console.log("PASS: e2e smoke checks completed");
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
