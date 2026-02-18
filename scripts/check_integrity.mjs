import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const manifestPath = path.join(projectRoot, "source", "manifest", "source-manifest.json");
const renderedContentPath = path.join(projectRoot, "source", "manifest", "bobg-rendered-content.json");
const siteContentPath = path.join(projectRoot, "content", "site-content.json");
const rawDir = path.join(projectRoot, "source", "raw");

const hashSha256 = (buffer) => createHash("sha256").update(buffer).digest("hex");

const extractTagCount = (content) => {
  const counts = {};
  const tags = [...content.matchAll(/<([a-zA-Z][\w:-]*)(?=[\s>])/g)].map((match) => match[1]);
  for (const tag of tags) counts[tag] = (counts[tag] || 0) + 1;
  return { totalElements: tags.length, counts };
};

const fail = (message) => {
  console.error(`FAIL: ${message}`);
  process.exit(1);
};

const compareMaps = (actual, expected, keyLabel) => {
  const keys = new Set([...Object.keys(actual), ...Object.keys(expected)]);
  for (const key of keys) {
    const left = actual[key] || 0;
    const right = expected[key] || 0;
    if (left !== right) {
      fail(`${keyLabel} mismatch at ${key}: expected=${right} actual=${left}`);
    }
  }
};

const ensurePageReferences = async () => {
  const jaHtml = await fs.readFile(path.join(projectRoot, "index.html"), "utf8");
  const enHtml = await fs.readFile(path.join(projectRoot, "en", "index.html"), "utf8");
  const script = await fs.readFile(path.join(projectRoot, "script.js"), "utf8");

  if (jaHtml.includes("<object") || enHtml.includes("<object")) {
    fail("object/svg embed tags are still present; expected quoted HTML element rendering");
  }

  const requiredJa = [
    "id=\"brandLogo\"",
    "id=\"globalNav\"",
    "id=\"heroTitle\"",
    "id=\"projectGrid\"",
    "id=\"listingHeading\"",
    "id=\"listingGrid\"",
    "id=\"newsRail\"",
    "id=\"newsMore\"",
    "id=\"serviceCards\"",
    "id=\"coreMembers\"",
    "id=\"advisorList\"",
    "id=\"investorGrid\"",
    "id=\"partnerGrid\"",
    "id=\"contactHeading\"",
  ];

  const requiredEn = [
    "id=\"brandLogo\"",
    "id=\"globalNav\"",
    "id=\"heroTitle\"",
    "id=\"projectGrid\"",
    "id=\"listingHeading\"",
    "id=\"listingGrid\"",
    "id=\"newsRail\"",
    "id=\"newsMore\"",
    "id=\"serviceCards\"",
    "id=\"coreMembers\"",
    "id=\"advisorList\"",
    "id=\"investorGrid\"",
    "id=\"partnerGrid\"",
    "id=\"contactHeading\"",
  ];

  for (const token of requiredJa) {
    if (!jaHtml.includes(token)) fail(`index.html missing required node: ${token}`);
  }

  for (const token of requiredEn) {
    if (!enHtml.includes(token)) fail(`en/index.html missing required node: ${token}`);
  }

  if (!script.includes("useText(94)")) fail("script.js missing terminal text index usage");
  if (!script.includes("idx <= 40")) fail("script.js missing terminal image index usage");
  if (!script.includes("missingIndices")) fail("script.js missing coverage guard");
  if (!script.includes("content/site-content.json")) fail("script.js missing site-content loader");
  if (!jaHtml.includes("data-site-content-path")) fail("index.html missing site-content path");
  if (!enHtml.includes("data-site-content-path")) fail("en/index.html missing site-content path");
};

const ensureRenderedContent = async () => {
  const contentRaw = await fs.readFile(renderedContentPath, "utf8");
  const content = JSON.parse(contentRaw);

  if (!Array.isArray(content.textNodes) || !Array.isArray(content.images)) {
    fail("bobg-rendered-content.json schema invalid");
  }

  if (content.textNodes.length !== 94) {
    fail(`bobg-rendered-content.json text count mismatch: ${content.textNodes.length}`);
  }

  if (content.images.length !== 40) {
    fail(`bobg-rendered-content.json image count mismatch: ${content.images.length}`);
  }

  const invalidText = content.textNodes.findIndex((node) => typeof node?.text !== "string" || node.text.length === 0);
  if (invalidText >= 0) {
    fail(`bobg-rendered-content.json has empty text at index=${invalidText + 1}`);
  }

  const invalidImage = content.images.findIndex((node) => typeof node?.url !== "string" || node.url.length === 0);
  if (invalidImage >= 0) {
    fail(`bobg-rendered-content.json has empty image url at index=${invalidImage + 1}`);
  }
};

const ensureSiteContent = async () => {
  const raw = await fs.readFile(siteContentPath, "utf8");
  const siteContent = JSON.parse(raw);

  if (typeof siteContent?.version !== "number") fail("site-content.json missing numeric version");
  if (!siteContent?.locales?.ja || !siteContent?.locales?.en) fail("site-content.json missing locales");
  if (!Array.isArray(siteContent.locales.ja.texts) || siteContent.locales.ja.texts.length !== 94) {
    fail("site-content.json ja text count mismatch");
  }
  if (!Array.isArray(siteContent.locales.en.texts) || siteContent.locales.en.texts.length !== 94) {
    fail("site-content.json en text count mismatch");
  }
  if (!Array.isArray(siteContent.locales.ja.images) || siteContent.locales.ja.images.length !== 40) {
    fail("site-content.json ja image count mismatch");
  }
  if (!Array.isArray(siteContent.locales.en.images) || siteContent.locales.en.images.length !== 40) {
    fail("site-content.json en image count mismatch");
  }
};

const main = async () => {
  const manifestRaw = await fs.readFile(manifestPath, "utf8");
  const manifest = JSON.parse(manifestRaw);

  if (!manifest.files || !Array.isArray(manifest.files)) {
    fail("manifest schema invalid: files[] not found");
  }

  for (const file of manifest.files) {
    const abs = path.join(rawDir, file.name);
    const buffer = await fs.readFile(abs);
    const sha256 = hashSha256(buffer);

    if (sha256 !== file.sha256) {
      fail(`${file.name} sha256 mismatch`);
    }

    if (buffer.byteLength !== file.bytes) {
      fail(`${file.name} byte length mismatch`);
    }

    if (file.type === "svg") {
      const content = buffer.toString("utf8");
      const { totalElements, counts } = extractTagCount(content);

      if (totalElements !== file.totalElements) {
        fail(`${file.name} totalElements mismatch`);
      }

      compareMaps(counts, file.tagCounts || {}, `${file.name} tagCounts`);
    }
  }

  await ensurePageReferences();
  await ensureRenderedContent();
  await ensureSiteContent();
  console.log("PASS: integrity checks completed");
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
