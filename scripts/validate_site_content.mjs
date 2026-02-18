import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const siteContentPath = path.join(projectRoot, 'content', 'site-content.json');

const fail = (message) => {
  console.error(`FAIL: ${message}`);
  process.exit(1);
};

const assertNonEmptyString = (value, label) => {
  if (typeof value !== 'string' || value.trim().length === 0) {
    fail(`${label} must be a non-empty string`);
  }
};

const assertValidAssetPath = (value, label) => {
  assertNonEmptyString(value, label);
  if (value.trim().startsWith('soruce/')) {
    fail(`${label} has invalid prefix "soruce/" (did you mean "source/"?)`);
  }
};

const assertArrayLength = (value, expected, label) => {
  if (!Array.isArray(value) || value.length !== expected) {
    fail(`${label} must be an array with length=${expected}`);
  }
};

const assertStringArray = (value, expected, label) => {
  assertArrayLength(value, expected, label);
  value.forEach((item, idx) => assertNonEmptyString(item, `${label}[${idx}]`));
};

const assertAssetArray = (value, expected, label) => {
  assertArrayLength(value, expected, label);
  value.forEach((item, idx) => assertValidAssetPath(item, `${label}[${idx}]`));
};

const validateLocale = (localeContent, locale) => {
  if (!localeContent || typeof localeContent !== 'object') {
    fail(`locales.${locale} is missing`);
  }

  assertStringArray(localeContent.texts, 94, `locales.${locale}.texts`);
  assertAssetArray(localeContent.images, 40, `locales.${locale}.images`);
  assertValidAssetPath(localeContent.brandLogo, `locales.${locale}.brandLogo`);
  assertNonEmptyString(localeContent.newsAllHref, `locales.${locale}.newsAllHref`);
  assertAssetArray(localeContent.coreMemberImages, 5, `locales.${locale}.coreMemberImages`);
  assertAssetArray(localeContent.advisorImages, 6, `locales.${locale}.advisorImages`);

  assertArrayLength(localeContent.newsItems, 3, `locales.${locale}.newsItems`);
  localeContent.newsItems.forEach((item, idx) => {
    assertNonEmptyString(item?.href, `locales.${locale}.newsItems[${idx}].href`);
    assertValidAssetPath(item?.image, `locales.${locale}.newsItems[${idx}].image`);
  });
};

const validateMetrics = (metrics, locale) => {
  if (!Array.isArray(metrics) || metrics.length < 2) {
    fail(`heroMetricsByLocale.${locale} must have at least 2 items`);
  }
  metrics.forEach((item, idx) => {
    assertNonEmptyString(item?.value, `heroMetricsByLocale.${locale}[${idx}].value`);
    assertNonEmptyString(item?.label, `heroMetricsByLocale.${locale}[${idx}].label`);
  });
};

const validateModalCopy = (copy, locale) => {
  const required = [
    'lead',
    'labelName',
    'labelMail',
    'labelCompany',
    'placeholderName',
    'placeholderMail',
    'placeholderCompany',
    'submit',
  ];

  required.forEach((key) => assertNonEmptyString(copy?.[key], `materialModalTextByLocale.${locale}.${key}`));
};

const validateInquiryCopy = (copy, locale) => {
  const required = ['contactSuccess', 'materialSuccess', 'sendError'];
  required.forEach((key) => assertNonEmptyString(copy?.[key], `inquiryCopyByLocale.${locale}.${key}`));
};

const main = async () => {
  const raw = await fs.readFile(siteContentPath, 'utf8');
  const data = JSON.parse(raw);

  if (!data || typeof data !== 'object') fail('site-content.json must be an object');
  if (typeof data.version !== 'number') fail('version must be numeric');
  assertNonEmptyString(data.updatedAt, 'updatedAt');
  assertNonEmptyString(data.updatedBy, 'updatedBy');

  assertNonEmptyString(data.inquiry?.endpoint, 'inquiry.endpoint');
  assertNonEmptyString(data.inquiry?.recipient, 'inquiry.recipient');

  ['ja', 'en'].forEach((locale) => {
    validateLocale(data.locales?.[locale], locale);
    validateMetrics(data.heroMetricsByLocale?.[locale], locale);
    validateModalCopy(data.materialModalTextByLocale?.[locale], locale);
    validateInquiryCopy(data.inquiryCopyByLocale?.[locale], locale);
  });

  console.log('PASS: site-content validation completed');
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
