const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const ensureString = (value, label) => {
  assert(typeof value === 'string' && value.trim().length > 0, `${label} must be a non-empty string`);
};

const ensureArray = (value, expectedLength, label) => {
  assert(Array.isArray(value), `${label} must be an array`);
  assert(value.length === expectedLength, `${label} must have length ${expectedLength}`);
};

export const validateSiteContentPayload = (content) => {
  assert(content && typeof content === 'object', 'content payload must be an object');
  assert(typeof content.version === 'number', 'content.version must be numeric');

  ['ja', 'en'].forEach((locale) => {
    const localeContent = content.locales?.[locale];
    assert(localeContent && typeof localeContent === 'object', `locales.${locale} must exist`);

    ensureArray(localeContent.texts, 94, `locales.${locale}.texts`);
    ensureArray(localeContent.images, 40, `locales.${locale}.images`);
    localeContent.texts.forEach((value, idx) => ensureString(value, `locales.${locale}.texts[${idx}]`));
    localeContent.images.forEach((value, idx) => ensureString(value, `locales.${locale}.images[${idx}]`));

    ensureString(localeContent.brandLogo, `locales.${locale}.brandLogo`);
    ensureString(localeContent.newsAllHref, `locales.${locale}.newsAllHref`);

    ensureArray(localeContent.newsItems, 3, `locales.${locale}.newsItems`);
    localeContent.newsItems.forEach((item, idx) => {
      ensureString(item?.href, `locales.${locale}.newsItems[${idx}].href`);
      ensureString(item?.image, `locales.${locale}.newsItems[${idx}].image`);
    });

    ensureArray(localeContent.coreMemberImages, 5, `locales.${locale}.coreMemberImages`);
    localeContent.coreMemberImages.forEach((value, idx) => ensureString(value, `locales.${locale}.coreMemberImages[${idx}]`));

    ensureArray(localeContent.advisorImages, 6, `locales.${locale}.advisorImages`);
    localeContent.advisorImages.forEach((value, idx) => ensureString(value, `locales.${locale}.advisorImages[${idx}]`));
  });

  assert(content.inquiry && typeof content.inquiry === 'object', 'inquiry section must exist');
  ensureString(content.inquiry.endpoint, 'inquiry.endpoint');
  ensureString(content.inquiry.recipient, 'inquiry.recipient');
};
