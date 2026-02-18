import { promises as fs } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const renderedContentPath = path.join(projectRoot, 'source', 'manifest', 'bobg-rendered-content.json');
const scriptPath = path.join(projectRoot, 'script.js');
const outputPath = path.join(projectRoot, 'content', 'site-content.json');

const extractSiteConstants = (source) => {
  const startToken = 'const HERO_METRICS_BY_LOCALE';
  const endToken = 'const resolveAssetUrl';
  const start = source.indexOf(startToken);
  const end = source.indexOf(endToken);

  if (start < 0 || end < 0 || end <= start) {
    throw new Error('failed to locate site constants in script.js');
  }

  const snippet = `${source.slice(start, end)}\n;globalThis.__SITE_CONSTANTS = {\n  HERO_METRICS_BY_LOCALE,\n  MATERIAL_MODAL_TEXT_BY_LOCALE,\n  INQUIRY_ENDPOINT,\n  INQUIRY_COPY_BY_LOCALE,\n  SOURCE_ASSETS_BY_LOCALE,\n  TEXT_OVERRIDES\n};`;

  const context = { globalThis: {} };
  vm.createContext(context);
  vm.runInContext(snippet, context, { timeout: 1000 });

  const constants = context.globalThis.__SITE_CONSTANTS;
  if (!constants) throw new Error('failed to extract constants');
  return constants;
};

const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);

const applyTextOverrides = (texts, overrides) => texts.map((value, idx) => {
  const keyNumber = idx + 1;
  if (hasOwn(overrides, keyNumber)) return overrides[keyNumber];
  const keyText = String(keyNumber);
  if (hasOwn(overrides, keyText)) return overrides[keyText];
  return value;
});

const applyImageOverrides = (images, overrides) => images.map((value, idx) => {
  const keyNumber = idx + 1;
  if (hasOwn(overrides, keyNumber)) return overrides[keyNumber];
  const keyText = String(keyNumber);
  if (hasOwn(overrides, keyText)) return overrides[keyText];
  return value;
});

const createLocaleContent = (locale, baseTexts, baseImages, constants) => {
  const localeAssets = constants.SOURCE_ASSETS_BY_LOCALE?.[locale];
  if (!localeAssets) throw new Error(`missing SOURCE_ASSETS_BY_LOCALE for ${locale}`);

  const textOverrides = constants.TEXT_OVERRIDES?.[locale] || {};
  const imageOverrides = localeAssets.imageOverrides || {};

  return {
    texts: applyTextOverrides(baseTexts, textOverrides),
    images: applyImageOverrides(baseImages, imageOverrides),
    brandLogo: localeAssets.brandLogo,
    newsAllHref: localeAssets.newsAllHref,
    newsItems: localeAssets.newsItems,
    coreMemberImages: localeAssets.coreMemberImages,
    advisorImages: localeAssets.advisorImages,
  };
};

const main = async () => {
  const [renderedContentRaw, scriptRaw] = await Promise.all([
    fs.readFile(renderedContentPath, 'utf8'),
    fs.readFile(scriptPath, 'utf8'),
  ]);

  const renderedContent = JSON.parse(renderedContentRaw);
  if (!Array.isArray(renderedContent.textNodes) || !Array.isArray(renderedContent.images)) {
    throw new Error('bobg-rendered-content.json schema invalid');
  }

  const baseTexts = renderedContent.textNodes.map((node) => node.text);
  const baseImages = renderedContent.images.map((node) => node.url);
  const constants = extractSiteConstants(scriptRaw);

  const now = new Date().toISOString();
  const siteContent = {
    version: 1,
    updatedAt: now,
    updatedBy: 'system',
    inquiry: {
      endpoint: constants.INQUIRY_ENDPOINT,
      recipient: 'info@bobg.xyz',
    },
    heroMetricsByLocale: constants.HERO_METRICS_BY_LOCALE,
    materialModalTextByLocale: constants.MATERIAL_MODAL_TEXT_BY_LOCALE,
    inquiryCopyByLocale: constants.INQUIRY_COPY_BY_LOCALE,
    locales: {
      ja: createLocaleContent('ja', baseTexts, baseImages, constants),
      en: createLocaleContent('en', baseTexts, baseImages, constants),
    },
  };

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(siteContent, null, 2)}\n`, 'utf8');
  console.log(`wrote ${outputPath}`);
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
