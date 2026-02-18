import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const rawDir = path.join(projectRoot, "source", "raw");
const manifestPath = path.join(projectRoot, "source", "manifest", "source-manifest.json");

const FILES = [
  "bobg-ja-page.svg",
  "bobg-ja-components.svg",
  "bobg-en-page.svg",
  "bobg-en-components.svg",
  "bobg.fig",
];

const hashSha256 = (buffer) => createHash("sha256").update(buffer).digest("hex");

const sortedUnique = (items) => [...new Set(items)].sort((a, b) => a.localeCompare(b));

const analyzeSvg = (name, content, sha256, bytes) => {
  const tags = [...content.matchAll(/<([a-zA-Z][\w:-]*)(?=[\s>])/g)].map((match) => match[1]);
  const tagCounts = {};
  for (const tag of tags) {
    tagCounts[tag] = (tagCounts[tag] || 0) + 1;
  }

  const hrefs = [...content.matchAll(/(?:xlink:href|href)="([^"]+)"/g)].map((match) => match[1]);
  const internalRefs = sortedUnique(hrefs.filter((href) => href.startsWith("#")));
  const externalLinks = sortedUnique(hrefs.filter((href) => href.startsWith("http://") || href.startsWith("https://")));
  const dataUris = sortedUnique(hrefs.filter((href) => href.startsWith("data:")));

  return {
    name,
    type: "svg",
    bytes,
    sha256,
    totalElements: tags.length,
    pathCount: tagCounts.path || 0,
    imageCount: tagCounts.image || 0,
    useCount: tagCounts.use || 0,
    textCount: tagCounts.text || 0,
    tagCounts,
    externalLinks,
    internalRefs,
    dataUriCount: dataUris.length,
  };
};

const analyzeBinary = (name, sha256, bytes) => ({
  name,
  type: "fig",
  bytes,
  sha256,
});

const main = async () => {
  await fs.mkdir(path.dirname(manifestPath), { recursive: true });

  const files = [];

  for (const name of FILES) {
    const abs = path.join(rawDir, name);
    const buffer = await fs.readFile(abs);
    const bytes = buffer.byteLength;
    const sha256 = hashSha256(buffer);

    if (name.endsWith(".svg")) {
      const content = buffer.toString("utf8");
      files.push(analyzeSvg(name, content, sha256, bytes));
    } else {
      files.push(analyzeBinary(name, sha256, bytes));
    }
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    sourceRoot: "source/raw",
    files,
  };

  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  console.log(`wrote ${manifestPath}`);
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
