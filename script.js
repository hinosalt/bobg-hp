const byId = (id) => document.getElementById(id);

const create = (tag, className) => {
  const el = document.createElement(tag);
  if (className) el.className = className;
  return el;
};

const attachRevealObserver = () => {
  const revealNodes = [...document.querySelectorAll('.reveal')];
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('inview');
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.16, rootMargin: '0px 0px -10% 0px' },
  );

  revealNodes.forEach((node, idx) => {
    node.style.transitionDelay = `${idx * 35}ms`;
    io.observe(node);
  });
};

const attachHeroMotion = () => {
  const heroMetrics = byId('heroMetrics');
  if (!heroMetrics) return;

  const onScroll = () => {
    const y = Math.min(window.scrollY * 0.03, 10);
    heroMetrics.style.transform = `translateY(${y}px)`;
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
};

const setupNavToggle = () => {
  const header = document.querySelector('.fr-header');
  const navToggle = byId('navToggle');
  const globalNav = byId('globalNav');
  if (!header || !navToggle || !globalNav) return;

  const setOpen = (open) => {
    header.classList.toggle('is-nav-open', open);
    navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  };

  setOpen(false);

  navToggle.addEventListener('click', () => {
    const isOpen = header.classList.contains('is-nav-open');
    setOpen(!isOpen);
  });

  globalNav.addEventListener('click', (event) => {
    const targetLink = event.target.closest('a');
    if (targetLink) setOpen(false);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') setOpen(false);
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 860) setOpen(false);
  }, { passive: true });
};

const setText = (id, value) => {
  const node = byId(id);
  if (node) node.textContent = value;
};

const setImage = (id, url) => {
  const node = byId(id);
  if (node) node.src = url;
};

const animateMetricValue = (node, targetValue, durationMs) => {
  if (!Number.isFinite(targetValue) || targetValue < 0) {
    node.textContent = String(targetValue);
    return;
  }

  const start = performance.now();
  const step = (now) => {
    const progress = Math.min((now - start) / durationMs, 1);
    const eased = 1 - ((1 - progress) ** 3);
    node.textContent = String(Math.round(targetValue * eased));
    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      node.textContent = String(targetValue);
    }
  };
  requestAnimationFrame(step);
};

const animateHeroMetrics = (container) => {
  const metricValues = [...container.querySelectorAll('.hero-metric-value')];
  if (!metricValues.length) return;

  const prefersReducedMotion =
    typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  metricValues.forEach((valueNode, idx) => {
    const rawTarget = valueNode.dataset.target || valueNode.textContent || '0';
    const numericTarget = Number.parseInt(rawTarget.replace(/[^\d]/g, ''), 10);
    if (!Number.isFinite(numericTarget)) return;

    if (prefersReducedMotion) {
      valueNode.textContent = String(numericTarget);
      return;
    }

    valueNode.textContent = '0';
    window.setTimeout(() => {
      animateMetricValue(valueNode, numericTarget, 900 + idx * 140);
    }, idx * 120);
  });
};

const HERO_METRICS_BY_LOCALE = {
  ja: [
    { value: '12', label: 'トークン発行数' },
    { value: '22', label: 'トークン上場数' },
  ],
  en: [
    { value: '12', label: 'Token Issued' },
    { value: '22', label: 'Token Listings' },
  ],
};

const MATERIAL_MODAL_TEXT_BY_LOCALE = {
  ja: {
    lead: 'ご登録いただいたメールアドレスに資料をお送りいたします。',
    labelName: 'お名前',
    labelMail: 'メールアドレス',
    labelCompany: '会社名',
    placeholderName: '山田 太郎',
    placeholderMail: '○○○@hello.japan',
    placeholderCompany: '株式会社 Hello japan',
    submit: '資料請求する',
  },
  en: {
    lead: 'The materials will be sent to your email address.',
    labelName: 'Your Name',
    labelMail: 'E-mail Address',
    labelCompany: 'Company',
    placeholderName: 'Taro Yamada',
    placeholderMail: '○○○@hello.japan',
    placeholderCompany: 'Hello japan Inc.',
    submit: 'Request for Materials',
  },
};

const INQUIRY_ENDPOINT = 'https://formsubmit.co/ajax/info@bobg.xyz';

const INQUIRY_COPY_BY_LOCALE = {
  ja: {
    contactSuccess: 'お問い合わせを受け付けました。担当者よりご連絡いたします。',
    materialSuccess: '資料請求を受け付けました。ご登録のメールアドレスをご確認ください。',
    sendError: '送信に失敗しました。時間をおいて再度お試しください。',
  },
  en: {
    contactSuccess: 'Your inquiry has been sent. Our team will contact you shortly.',
    materialSuccess: 'Your material request has been sent. Please check your mailbox.',
    sendError: 'Failed to send. Please try again in a few minutes.',
  },
};

let runtimeHeroMetricsByLocale = HERO_METRICS_BY_LOCALE;
let runtimeMaterialModalTextByLocale = MATERIAL_MODAL_TEXT_BY_LOCALE;
let runtimeInquiryCopyByLocale = INQUIRY_COPY_BY_LOCALE;
let runtimeInquiryEndpoint = INQUIRY_ENDPOINT;

const normalizeValue = (value) => value.trim();

const setFormSubmitting = (form, isSubmitting) => {
  const controls = form.querySelectorAll('input, textarea, button');
  controls.forEach((control) => {
    control.disabled = isSubmitting;
  });
};

const sendInquiryMail = async (payload) => {
  const response = await fetch(runtimeInquiryEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });

  let data = {};
  try {
    data = await response.json();
  } catch {
    data = {};
  }

  const success = response.ok && !(data.success === false || data.success === 'false');
  if (!success) {
    throw new Error(data.message || `Failed inquiry submission (${response.status})`);
  }
};

const buildContactPayload = ({ locale, company, name, email, message }) => ({
  _subject: locale === 'ja' ? '[BOBG] お問い合わせ' : '[BOBG] Contact Inquiry',
  _template: 'table',
  _captcha: 'false',
  inquiryType: 'contact',
  locale,
  company,
  name,
  email,
  message,
  pageUrl: window.location.href,
  submittedAt: new Date().toISOString(),
});

const buildMaterialPayload = ({ locale, company, name, email }) => ({
  _subject: locale === 'ja' ? '[BOBG] 資料請求' : '[BOBG] Materials Request',
  _template: 'table',
  _captcha: 'false',
  inquiryType: 'material-request',
  locale,
  company,
  name,
  email,
  pageUrl: window.location.href,
  submittedAt: new Date().toISOString(),
});

const setupContactForm = (locale) => {
  const form = document.querySelector('.contact-form');
  if (!form) return;

  const localeCopy =
    runtimeInquiryCopyByLocale[locale]
    || runtimeInquiryCopyByLocale.ja
    || INQUIRY_COPY_BY_LOCALE[locale]
    || INQUIRY_COPY_BY_LOCALE.ja;
  const inputCompany = byId('contactInputCompany');
  const inputName = byId('contactInputName');
  const inputMail = byId('contactInputMail');
  const inputBody = byId('contactInputBody');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const company = normalizeValue(inputCompany?.value || '');
    const name = normalizeValue(inputName?.value || '');
    const email = normalizeValue(inputMail?.value || '');
    const message = normalizeValue(inputBody?.value || '');
    if (!company || !name || !email || !message) return;

    setFormSubmitting(form, true);
    try {
      await sendInquiryMail(buildContactPayload({
        locale,
        company,
        name,
        email,
        message,
      }));
      form.reset();
      window.alert(localeCopy.contactSuccess);
    } catch (error) {
      console.error(error);
      window.alert(localeCopy.sendError);
    } finally {
      setFormSubmitting(form, false);
    }
  });
};

const setupMaterialModal = (locale, trigger) => {
  const modal = byId('materialModal');
  if (!modal || !trigger) return;

  const localeCopy =
    runtimeMaterialModalTextByLocale[locale]
    || runtimeMaterialModalTextByLocale.ja
    || MATERIAL_MODAL_TEXT_BY_LOCALE[locale]
    || MATERIAL_MODAL_TEXT_BY_LOCALE.ja;
  const inquiryCopy =
    runtimeInquiryCopyByLocale[locale]
    || runtimeInquiryCopyByLocale.ja
    || INQUIRY_COPY_BY_LOCALE[locale]
    || INQUIRY_COPY_BY_LOCALE.ja;
  setText('materialModalLead', localeCopy.lead);
  setText('materialModalLabelName', localeCopy.labelName);
  setText('materialModalLabelMail', localeCopy.labelMail);
  setText('materialModalLabelCompany', localeCopy.labelCompany);
  setText('materialModalSubmit', localeCopy.submit);

  const inputName = byId('materialModalInputName');
  const inputMail = byId('materialModalInputMail');
  const inputCompany = byId('materialModalInputCompany');
  if (inputName) inputName.placeholder = localeCopy.placeholderName;
  if (inputMail) inputMail.placeholder = localeCopy.placeholderMail;
  if (inputCompany) inputCompany.placeholder = localeCopy.placeholderCompany;

  let closeTimer = null;
  const closeModal = () => {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('material-modal-open');
    if (closeTimer) window.clearTimeout(closeTimer);
    closeTimer = window.setTimeout(() => {
      modal.hidden = true;
    }, 180);
  };

  const openModal = () => {
    if (closeTimer) window.clearTimeout(closeTimer);
    modal.hidden = false;
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('material-modal-open');
    requestAnimationFrame(() => {
      modal.classList.add('is-open');
    });
  };

  trigger.addEventListener('click', (event) => {
    event.preventDefault();
    openModal();
  });

  modal.addEventListener('click', (event) => {
    if (event.target === modal) closeModal();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
  });

  const modalForm = modal.querySelector('.material-modal-form');
  if (modalForm) {
    modalForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!modalForm.reportValidity()) return;

      const company = normalizeValue(inputCompany?.value || '');
      const name = normalizeValue(inputName?.value || '');
      const email = normalizeValue(inputMail?.value || '');
      if (!company || !name || !email) return;

      setFormSubmitting(modalForm, true);
      try {
        await sendInquiryMail(buildMaterialPayload({
          locale,
          company,
          name,
          email,
        }));
        modalForm.reset();
        closeModal();
        window.alert(inquiryCopy.materialSuccess);
      } catch (error) {
        console.error(error);
        window.alert(inquiryCopy.sendError);
      } finally {
        setFormSubmitting(modalForm, false);
      }
    });
  }
};

const SOURCE_ASSETS_BY_LOCALE = {
  ja: {
    brandLogo:
      'https://storage.googleapis.com/studio-design-asset-files/projects/p6aonn3NqR/s-529x217_webp_bb1b46f4-62a9-4cf4-924d-b38a8bad8444.webp',
    newsAllHref: 'https://prtimes.jp/main/html/searchrlp/company_id/103876',
    newsItems: [
      {
        href: 'https://prtimes.jp/main/html/rd/p/000000042.000103876.html',
        image:
          'https://storage.googleapis.com/studio-design-asset-files/projects/p6aonn3NqR/s-1920x1080_c3f0cc9b-d710-408d-b74b-eef9254aa91a.webp',
      },
      {
        href: 'https://prtimes.jp/main/html/rd/p/000000040.000103876.html',
        image:
          'https://storage.googleapis.com/studio-design-asset-files/projects/p6aonn3NqR/s-1920x1080_v-frms_webp_595be900-b4ca-453c-abae-2be6879e0973_small.webp',
      },
      {
        href: 'https://prtimes.jp/main/html/rd/p/000000039.000103876.html',
        image:
          'https://storage.googleapis.com/studio-design-asset-files/projects/p6aonn3NqR/s-1920x1080_9de9a2bb-9d8d-4053-9c69-f43c31824882.webp',
      },
    ],
    coreMemberImages: [
      'https://storage.googleapis.com/studio-design-asset-files/projects/p6aonn3NqR/s-1000x1000_v-fs_webp_e34f9da1-5d19-45ba-b0ad-713672b7699d_small.webp',
      'https://storage.googleapis.com/studio-design-asset-files/projects/p6aonn3NqR/s-1000x1000_v-fs_webp_79ff5efb-b82b-43fe-aced-290ff43896ed_small.webp',
      'https://storage.googleapis.com/studio-design-asset-files/projects/p6aonn3NqR/s-1000x1000_v-fs_webp_24800fcf-78ce-4c12-8781-661cf0588730_small.webp',
      'https://storage.googleapis.com/studio-design-asset-files/projects/p6aonn3NqR/s-1000x999_v-fs_webp_6a1997e6-4e3b-470c-b9f6-168725dd3b26_small.webp',
      'https://storage.googleapis.com/studio-design-asset-files/projects/p6aonn3NqR/s-1040x1042_v-fs_webp_e58485d6-c0a6-4916-a977-4b9f407e885b_small.webp',
    ],
    advisorImages: [
      'https://storage.googleapis.com/studio-design-asset-files/projects/p6aonn3NqR/s-1040x1042_v-fs_webp_0e3d7d28-ef29-49c0-86a8-eaa1480b4218_small.webp',
      'https://storage.googleapis.com/studio-design-asset-files/projects/p6aonn3NqR/s-160x160_webp_d8103571-3340-4c9e-a830-8ae08826145c.webp',
      'https://storage.googleapis.com/studio-design-asset-files/projects/p6aonn3NqR/s-1791x1350_b73dbc3c-c3cb-4a5e-a3be-8b7353b8b7a5.webp',
      'https://storage.googleapis.com/studio-design-asset-files/projects/rROnkMy2qA/s-254x247_webp_893984ef-e5e1-4c50-b2d7-6fef9f38ce1b.webp',
      'https://storage.googleapis.com/studio-design-asset-files/projects/rROnkMy2qA/s-1176x1182_v-fs_webp_2f1c8c35-23b4-45e9-b104-d8616192e35b_small.webp',
      'https://storage.googleapis.com/studio-design-asset-files/projects/rROnkMy2qA/s-976x980_v-fs_webp_f93f86b5-5bd9-4215-a9b1-e2072ed0250f_small.webp',
    ],
    imageOverrides: {},
  },
  en: {
    brandLogo:
      'https://storage.googleapis.com/studio-design-asset-files/projects/p6aonn3NqR/s-529x217_webp_bb1b46f4-62a9-4cf4-924d-b38a8bad8444.webp',
    newsAllHref: 'https://medium.com/@bobg_info',
    newsItems: [
      {
        href: 'https://medium.com/@bobg_info/mushinomics-with-mushiking-349898a03c1a',
        image: 'https://miro.medium.com/v2/resize:fit:4800/format:webp/1*6bxdqTnNFD75YXnAVqpmNQ.png',
      },
      {
        href: 'https://medium.com/@bobg_info/sgc-trading-on-multiple-cexs-and-dexs-62e50333ffb2',
        image: 'https://miro.medium.com/v2/resize:fit:1400/format:webp/1*h78g04MfLux2wh-wF0ev2g.png',
      },
      {
        href: 'https://medium.com/@bobg_info/support-of-soneium-90bd8767e4f0',
        image: 'https://miro.medium.com/v2/resize:fit:1400/format:webp/0*ecf5zlPj6fZb0Ofk',
      },
    ],
    coreMemberImages: [
      'https://storage.googleapis.com/studio-design-asset-files/projects/p6aonn3NqR/s-1000x1000_v-fs_webp_e34f9da1-5d19-45ba-b0ad-713672b7699d_small.webp',
      'https://storage.googleapis.com/studio-design-asset-files/projects/p6aonn3NqR/s-1000x1000_v-fs_webp_79ff5efb-b82b-43fe-aced-290ff43896ed_small.webp',
      'https://storage.googleapis.com/studio-design-asset-files/projects/p6aonn3NqR/s-1000x1000_v-fs_webp_24800fcf-78ce-4c12-8781-661cf0588730_small.webp',
      'https://storage.googleapis.com/studio-design-asset-files/projects/p6aonn3NqR/s-1000x999_v-fs_webp_6a1997e6-4e3b-470c-b9f6-168725dd3b26_small.webp',
      'https://storage.googleapis.com/studio-design-asset-files/projects/p6aonn3NqR/s-1040x1042_v-fs_webp_e58485d6-c0a6-4916-a977-4b9f407e885b_small.webp',
    ],
    advisorImages: [
      'https://storage.googleapis.com/studio-design-asset-files/projects/p6aonn3NqR/s-1040x1042_v-fs_webp_0e3d7d28-ef29-49c0-86a8-eaa1480b4218_small.webp',
      'https://storage.googleapis.com/studio-design-asset-files/projects/p6aonn3NqR/s-160x160_webp_d8103571-3340-4c9e-a830-8ae08826145c.webp',
      'https://storage.googleapis.com/studio-design-asset-files/projects/p6aonn3NqR/s-1791x1350_b73dbc3c-c3cb-4a5e-a3be-8b7353b8b7a5.webp',
      'https://storage.googleapis.com/studio-design-asset-files/projects/rROnkMy2qA/s-254x247_webp_893984ef-e5e1-4c50-b2d7-6fef9f38ce1b.webp',
      'https://storage.googleapis.com/studio-design-asset-files/projects/rROnkMy2qA/s-1176x1182_v-fs_webp_2f1c8c35-23b4-45e9-b104-d8616192e35b_small.webp',
      'https://storage.googleapis.com/studio-design-asset-files/projects/rROnkMy2qA/s-976x980_v-fs_webp_f93f86b5-5bd9-4215-a9b1-e2072ed0250f_small.webp',
    ],
    imageOverrides: {
      1: 'source/quoted/en/s-1920-x-1080-v-frms-webp-c-8564-fc-1-9774-4-e-32-aedd-8860-f-07384-cf-middle-webp0.png',
      2: 'source/quoted/en/s-1200-x-630-9058-fe-76-418-d-4-b-3-e-a-2-d-0-6-ce-7-aa-354187-webp0.png',
      23: 'source/quoted/en/photo-1621629057099-c-7-cf-1-fb-8-ca-1-e0.png',
    },
  },
};

const TEXT_OVERRIDES = {
  en: {
    2: 'PROJECT',
    3: 'NEWS',
    4: 'SERVICE',
    5: 'MEMBER',
    6: 'CONTACT',
    10: 'Simplifying Enterprise Token Issues',
    11: 'Ensuring safe token management and operations with security measures and effective',
    12: 'governance structures.',
    13: 'PROJECT',
    14: 'Ateam Entertainment Inc.',
    15: 'CryptoGames Inc.',
    16: 'Drecom Co., Ltd. / Turingum K.K.',
    17: 'double jump.tokyo Inc. / SEGA CORPORATION',
    18: 'double jump.tokyo Inc.',
    19: 'extra mile Inc.(subsidiary of TV ASAHI MUSIC) / CryptoGames Inc.',
    20: 'GALLUSYS Ltd. / Turingum K.K.',
    21: 'gumi Inc.',
    22: 'Highphen Pte. Ltd.',
    23: 'Kyuzan Inc. / SEGA CORPORATION',
    24: 'MCH Co.,Ltd.',
    25: 'YOAKE entertainment Co., Ltd.',
    26: 'EXCHANGE',
    27: 'NEWS',
    29: 'BOBG PTE. LTD. announces collaboration with Kyuzan on the Web3 game “MUSHInomics with MUSHIKING”, which utilizes SEGA’s “MUSHIKING: The King of Beetles” IP',
    30: '2025/06/13',
    31: '“SGC” to Start Trading on Multiple CEXs and DEXs',
    32: '2025/03/13',
    33: 'BOBG PTE. LTD. Announces its Support of Soneium',
    35: 'SERVICE',
    36: 'Token Issuance, Management & Operations',
    37: 'Building flexible token issuance systems aligned with project schedules. Achieving secure token management and operations through high security and proper governance structures.',
    38: 'CEX/DEX Listing & Liquidity Provision Support',
    39: 'Supporting listings on CEX (Centralized Exchanges) and DEX (Decentralized Exchanges), enabling global market expansion from launch with liquidity provision support.',
    40: 'Back Office Infrastructure Support',
    41: 'Developing project-specific schemes to minimize back-office and corporate issues in token issuance. Supporting projects to focus on value creation.',
    42: 'CORE MEMBER',
    53: 'ADVISOR',
    55: 'Attorney at Law',
    56: 'TMI Associates',
    59: 'Attorney at Law',
    63: 'CPA / Tax Accountant',
    64: 'Kazuaki Mizuchi CPA Office',
    77: 'BACKER',
    79: 'CryptoGames Inc.',
    80: 'double jump.tokyo Inc.',
    82: 'PARTNER',
    83: 'CONTACT',
    84: 'Company',
    86: 'Your Name',
    88: 'E-mail Address',
    90: 'Inquiry Details',
    92: 'Send',
    94: 'Request for Materials',
  },
};

const normalizeAssetPath = (rawUrl) => {
  const url = String(rawUrl || '').trim();
  if (!url) return '';
  if (url.startsWith('soruce/')) {
    return `source/${url.slice('soruce/'.length)}`;
  }
  if (url.startsWith('./')) return url.slice(2);
  if (url.startsWith('../')) return url.slice(3);
  return url;
};

const resolveAssetUrl = (base, rawUrl) => {
  const url = normalizeAssetPath(rawUrl);
  if (!url) return '';
  if (url.startsWith('/')) return url;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('source/') || url.startsWith('content/') || url.startsWith('api/')) {
    return `/${url}`;
  }
  return `${base}${url}`;
};

const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);

const valueFromIndexMap = (map, index, fallback) => {
  if (!map || typeof map !== 'object') return fallback;
  if (hasOwn(map, index)) return map[index];
  const key = String(index);
  if (hasOwn(map, key)) return map[key];
  return fallback;
};

const applyIndexMap = (list, map) => list.map((item, idx) => valueFromIndexMap(map, idx + 1, item));

const normalizeLocaleContent = (locale, baseTexts, baseImages, siteContent) => {
  const localeAssets = SOURCE_ASSETS_BY_LOCALE[locale] || SOURCE_ASSETS_BY_LOCALE.ja;
  const textOverrides = TEXT_OVERRIDES[locale] || {};
  const defaultTexts = applyIndexMap(baseTexts, textOverrides);
  const defaultImages = applyIndexMap(baseImages, localeAssets.imageOverrides || {});

  const contentLocale = siteContent?.locales?.[locale];
  const texts =
    Array.isArray(contentLocale?.texts) && contentLocale.texts.length === baseTexts.length
      ? contentLocale.texts
      : defaultTexts;

  const images =
    Array.isArray(contentLocale?.images) && contentLocale.images.length === baseImages.length
      ? contentLocale.images
      : defaultImages;

  const newsItems =
    Array.isArray(contentLocale?.newsItems) && contentLocale.newsItems.length === 3
      ? contentLocale.newsItems
      : localeAssets.newsItems;

  const coreMemberImages =
    Array.isArray(contentLocale?.coreMemberImages) && contentLocale.coreMemberImages.length === 5
      ? contentLocale.coreMemberImages
      : localeAssets.coreMemberImages;

  const advisorImages =
    Array.isArray(contentLocale?.advisorImages) && contentLocale.advisorImages.length === 6
      ? contentLocale.advisorImages
      : localeAssets.advisorImages;

  return {
    texts,
    images,
    brandLogo: contentLocale?.brandLogo || localeAssets.brandLogo,
    newsAllHref: contentLocale?.newsAllHref || localeAssets.newsAllHref,
    newsItems,
    coreMemberImages,
    advisorImages,
  };
};

const missingIndices = (usedSet, total) => {
  const missing = [];
  for (let i = 1; i <= total; i += 1) {
    if (!usedSet.has(i)) missing.push(i);
  }
  return missing;
};

const render = (baseTexts, baseImages, siteContent, locale, base) => {
  runtimeHeroMetricsByLocale = siteContent?.heroMetricsByLocale || HERO_METRICS_BY_LOCALE;
  runtimeMaterialModalTextByLocale =
    siteContent?.materialModalTextByLocale || MATERIAL_MODAL_TEXT_BY_LOCALE;
  runtimeInquiryCopyByLocale = siteContent?.inquiryCopyByLocale || INQUIRY_COPY_BY_LOCALE;
  runtimeInquiryEndpoint = siteContent?.inquiry?.endpoint || INQUIRY_ENDPOINT;

  const localeContent = normalizeLocaleContent(locale, baseTexts, baseImages, siteContent);
  const texts = localeContent.texts;
  const images = localeContent.images;
  const usedText = new Set();
  const usedImage = new Set();
  const localeAssets = localeContent;
  const defaultLocaleAssets = SOURCE_ASSETS_BY_LOCALE[locale] || SOURCE_ASSETS_BY_LOCALE.ja;

  const text = (idx) => texts[idx - 1] ?? '';
  const image = (idx) => images[idx - 1] ?? '';

  const useText = (idx) => {
    usedText.add(idx);
    return text(idx);
  };

  const useImage = (idx) => {
    usedImage.add(idx);
    return image(idx);
  };

  const useImageWithLocale = (idx) => {
    const original = useImage(idx);
    return resolveAssetUrl(base, original);
  };

  setImage('brandLogo', resolveAssetUrl(base, localeAssets.brandLogo));
  setText('statusText', useText(1));
  setText('langEn', useText(7));
  setText('langSlash', useText(8));
  setText('langJa', useText(9));
  const langSwitchLink = byId('langSwitchLink');
  if (langSwitchLink) {
    langSwitchLink.href = locale === 'ja' ? 'en/' : '../';
  }

  const navItems = [
    { text: useText(2), href: '#projects' },
    { text: useText(3), href: '#news' },
    { text: useText(4), href: '#services' },
    { text: useText(5), href: '#members' },
    { text: useText(6), href: '#contact' },
  ];

  const globalNav = byId('globalNav');
  navItems.forEach((item) => {
    const li = create('li');
    const link = create('a');
    link.textContent = item.text;
    link.href = item.href;
    li.append(link);
    globalNav.append(li);
  });

  setText('heroTitle', useText(10));
  setText('heroLeadA', useText(11));
  setText('heroLeadB', useText(12));
  useImage(1);
  const heroMetrics = byId('heroMetrics');
  if (heroMetrics) {
    const metricItems =
      runtimeHeroMetricsByLocale[locale]
      || runtimeHeroMetricsByLocale.ja
      || HERO_METRICS_BY_LOCALE[locale]
      || HERO_METRICS_BY_LOCALE.ja;
    metricItems.forEach((item) => {
      const metric = create('article', 'hero-metric');
      const value = create('p', 'hero-metric-value');
      value.dataset.target = item.value;
      value.textContent = '0';
      const label = create('p', 'hero-metric-label');
      label.textContent = item.label;
      metric.append(value, label);
      heroMetrics.append(metric);
    });
    animateHeroMetrics(heroMetrics);
  }

  setText('projectHeading', useText(13));
  const projectGrid = byId('projectGrid');
  const projectNames = [
    useText(14),
    useText(15),
    useText(16),
    useText(17),
    useText(18),
    useText(19),
    useText(20),
    useText(21),
    useText(22),
    useText(23),
    useText(24),
    useText(25),
  ];

  projectNames.forEach((name, idx) => {
    const card = create('article', 'project-card');
    const img = create('img');
    img.loading = 'lazy';
    img.decoding = 'async';
    img.alt = '';
    img.src = useImageWithLocale(idx + 2);
    const caption = create('p');
    caption.textContent = name;
    card.append(img, caption);
    projectGrid.append(card);
  });

  setText('listingHeading', useText(26));
  const listingGrid = byId('listingGrid');
  for (let idx = 14; idx <= 21; idx += 1) {
    const card = create('article', 'listing-card');
    const img = create('img');
    img.loading = 'lazy';
    img.decoding = 'async';
    img.alt = '';
    img.src = useImageWithLocale(idx);
    card.append(img);
    listingGrid.append(card);
  }

  setText('newsHeading', useText(27));
  const newsRail = byId('newsRail');
  const newsMore = byId('newsMore');

  const newsCards = [
    {
      date: useText(28),
      body: useText(29),
      ...localeAssets.newsItems[0],
      fallbackImage: defaultLocaleAssets.newsItems[0].image,
    },
    {
      date: useText(30),
      body: useText(31),
      ...localeAssets.newsItems[1],
      fallbackImage: defaultLocaleAssets.newsItems[1].image,
    },
    {
      date: useText(32),
      body: useText(33),
      ...localeAssets.newsItems[2],
      fallbackImage: defaultLocaleAssets.newsItems[2].image,
    },
  ];

  newsCards.forEach((item) => {
    const link = create('a', 'news-card-link');
    link.href = item.href;
    link.target = '_blank';
    link.rel = 'noopener';

    const card = create('article', 'news-card');
    const img = create('img');
    img.loading = 'lazy';
    img.decoding = 'async';
    img.alt = '';
    const primaryImage = resolveAssetUrl(base, item.image);
    const fallbackImage = resolveAssetUrl(base, item.fallbackImage || item.image);
    img.src = primaryImage;
    if (fallbackImage !== primaryImage) {
      img.onerror = () => {
        img.onerror = null;
        img.src = fallbackImage;
      };
    }

    const meta = create('div', 'news-meta');
    const date = create('p');
    date.textContent = item.date;
    const body = create('p');
    body.textContent = item.body;
    meta.append(date, body);

    card.append(img, meta);
    link.append(card);
    newsRail.append(link);
  });
  if (newsMore) {
    newsMore.textContent = useText(34);
    newsMore.href = localeAssets.newsAllHref;
  }

  setText('serviceHeading', useText(35));
  const serviceCards = byId('serviceCards');

  const services = [
    { imageIndex: 22, title: useText(36), body: useText(37) },
    { imageIndex: 23, title: useText(38), body: useText(39) },
    { imageIndex: 24, title: useText(40), body: useText(41) },
  ];

  services.forEach((service) => {
    const card = create('article', 'service-card');
    const img = create('img');
    img.loading = 'lazy';
    img.decoding = 'async';
    img.alt = '';
    img.src = useImageWithLocale(service.imageIndex);

    const copy = create('div', 'service-copy');
    const title = create('h3');
    title.textContent = service.title;
    const body = create('p');
    body.textContent = service.body;
    copy.append(title, body);

    card.append(img, copy);
    serviceCards.append(card);
  });

  setText('memberHeading', useText(42));
  const coreMembers = byId('coreMembers');
  const memberCards = [
    { role: useText(43), name: useText(44), image: localeAssets.coreMemberImages[0] },
    { role: useText(45), name: useText(46), image: localeAssets.coreMemberImages[1] },
    { role: useText(47), name: useText(48), image: localeAssets.coreMemberImages[2] },
    { role: useText(49), name: useText(50), image: localeAssets.coreMemberImages[3] },
    { role: useText(51), name: useText(52), image: localeAssets.coreMemberImages[4] },
  ];

  memberCards.forEach((item) => {
    const card = create('article', 'person-card');
    const img = create('img');
    img.loading = 'lazy';
    img.decoding = 'async';
    img.alt = '';
    img.src = resolveAssetUrl(base, item.image);

    const copy = create('div', 'person-copy');
    const roleNode = create('p');
    roleNode.textContent = item.role;
    const nameNode = create('p');
    nameNode.textContent = item.name;
    copy.append(roleNode, nameNode);

    card.append(img, copy);
    coreMembers.append(card);
  });

  setText('advisorHeading', useText(53));
  const advisorList = byId('advisorList');
  const advisors = [
    { image: localeAssets.advisorImages[0], lines: [useText(54), useText(55), useText(56), useText(57)] },
    { image: localeAssets.advisorImages[1], lines: [useText(58), useText(59), useText(60), useText(61)] },
    { image: localeAssets.advisorImages[2], lines: [useText(62), useText(63), useText(64)] },
    { image: localeAssets.advisorImages[3], lines: [useText(65), useText(66), useText(67), useText(68), useText(69), useText(70)] },
    { image: localeAssets.advisorImages[4], lines: [useText(71), useText(72), useText(73), useText(74)] },
    { image: localeAssets.advisorImages[5], lines: [useText(75), useText(76)] },
  ];

  advisors.forEach((advisor) => {
    const item = create('article', 'advisor-item');
    const img = create('img');
    img.loading = 'lazy';
    img.decoding = 'async';
    img.alt = '';
    img.src = resolveAssetUrl(base, advisor.image);

    const copy = create('div', 'advisor-copy');
    advisor.lines.forEach((chunk) => {
      const p = create('p');
      p.textContent = chunk;
      copy.append(p);
    });
    item.append(img, copy);
    advisorList.append(item);
  });

  setText('investorHeading', useText(77));
  const investorGrid = byId('investorGrid');
  const investors = [
    { name: useText(78), imageIndex: 25 },
    { name: useText(79), imageIndex: 26 },
    { name: useText(80), imageIndex: 27 },
    { name: useText(81), imageIndex: 28 },
  ];

  investors.forEach((investor) => {
    const card = create('article', 'investor-card');
    const img = create('img');
    img.loading = 'lazy';
    img.decoding = 'async';
    img.alt = '';
    img.src = useImageWithLocale(investor.imageIndex);
    const name = create('p');
    name.textContent = investor.name;
    card.append(img, name);
    investorGrid.append(card);
  });

  setText('partnerHeading', useText(82));
  const partnerGrid = byId('partnerGrid');
  for (let idx = 29; idx <= 40; idx += 1) {
    const item = create('article', 'partner-item');
    const img = create('img');
    img.loading = 'lazy';
    img.decoding = 'async';
    img.alt = '';
    img.src = useImageWithLocale(idx);
    item.append(img);
    partnerGrid.append(item);
  }

  setText('contactHeading', useText(83));
  setText('labelCompany', useText(84));
  setText('requiredCompany', useText(85));
  setText('labelName', useText(86));
  setText('requiredName', useText(87));
  setText('labelMail', useText(88));
  setText('requiredMail', useText(89));
  setText('labelBody', useText(90));
  setText('requiredBody', useText(91));
  setText('submitLabel', useText(92));

  setText('footerIconText', '');
  setText('materialLink', useText(94));

  const materialLink = byId('materialLink');
  if (materialLink) materialLink.href = '#';
  setupContactForm(locale);
  setupMaterialModal(locale, materialLink);

  const missingTexts = missingIndices(usedText, texts.length);
  const missingImages = missingIndices(usedImage, images.length);
  if (missingTexts.length || missingImages.length) {
    console.warn('Element coverage mismatch', { missingTexts, missingImages });
  }
};

const boot = async () => {
  const body = document.body;
  const base = body.dataset.base || '';
  const locale = body.dataset.locale || 'ja';
  const contentPath = body.dataset.contentPath || `${base}source/manifest/bobg-rendered-content.json`;
  const siteContentPath = body.dataset.siteContentPath || `${base}content/site-content.json`;

  const [response, siteContentResponse] = await Promise.all([
    fetch(contentPath, { cache: 'no-store' }),
    fetch(siteContentPath, { cache: 'no-store' }).catch(() => null),
  ]);

  const data = await response.json();
  const texts = data.textNodes.map((node) => node.text);
  const images = data.images.map((node) => node.url);
  let siteContent = null;

  if (siteContentResponse && siteContentResponse.ok) {
    try {
      siteContent = await siteContentResponse.json();
    } catch (error) {
      console.warn('failed to parse site-content.json', error);
      siteContent = null;
    }
  }

  render(texts, images, siteContent, locale, base);
  setupNavToggle();
  attachRevealObserver();
  attachHeroMotion();
};

boot().catch((error) => {
  console.error(error);
});
