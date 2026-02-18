const byId = (id) => document.getElementById(id);

const state = {
  session: null,
  content: null,
  branch: null,
};

const authPanel = byId('authPanel');
const forbiddenPanel = byId('forbiddenPanel');
const editorApp = byId('editorApp');
const localeEditors = byId('localeEditors');
const sessionInfo = byId('sessionInfo');
const saveStatus = byId('saveStatus');
const saveDraftButton = byId('saveDraftButton');
const reloadButton = byId('reloadButton');

const requestJson = async (url, options = {}) => {
  const response = await fetch(url, {
    credentials: 'include',
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  const raw = await response.text();
  let payload = {};
  if (raw) {
    try {
      payload = JSON.parse(raw);
    } catch {
      payload = { error: raw };
    }
  }

  if (!response.ok) {
    throw new Error(payload.error || `request failed (${response.status})`);
  }

  return payload;
};

const setStatus = (message, type = 'info') => {
  saveStatus.className = `status ${type === 'error' ? 'error' : type === 'success' ? 'success' : ''}`.trim();
  saveStatus.textContent = message;
};

const clearStatus = () => {
  saveStatus.className = 'status';
  saveStatus.textContent = '';
};

const fileToBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onerror = () => reject(new Error('failed to read file'));
  reader.onload = () => {
    const result = String(reader.result || '');
    const comma = result.indexOf(',');
    resolve(comma >= 0 ? result.slice(comma + 1) : result);
  };
  reader.readAsDataURL(file);
});

const makeFieldRow = (labelText, input) => {
  const row = document.createElement('div');
  row.className = 'field-row';
  const label = document.createElement('label');
  label.textContent = labelText;
  row.append(label, input);
  return row;
};

const makeUrlInput = (value, onChange) => {
  const input = document.createElement('input');
  input.type = 'url';
  input.value = value || '';
  input.addEventListener('input', () => {
    onChange(input.value);
  });
  return input;
};

const makeTextarea = (value, onChange) => {
  const input = document.createElement('textarea');
  input.value = value || '';
  input.addEventListener('input', () => {
    onChange(input.value);
  });
  return input;
};

const makeImageRow = ({
  label,
  locale,
  section,
  filenameSeed,
  getValue,
  setValue,
}) => {
  const wrapper = document.createElement('div');
  wrapper.className = 'image-row';

  const labelNode = document.createElement('label');
  labelNode.textContent = label;

  const controls = document.createElement('div');
  controls.className = 'image-controls';

  const valueInput = document.createElement('input');
  valueInput.type = 'text';
  valueInput.readOnly = true;

  const uploadButton = document.createElement('button');
  uploadButton.type = 'button';
  uploadButton.className = 'button';
  uploadButton.textContent = '画像アップロード';

  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/png,image/jpeg,image/webp,image/svg+xml';
  fileInput.hidden = true;

  const imagePreview = document.createElement('img');
  imagePreview.alt = '';

  const caption = document.createElement('p');
  caption.className = 'small';

  const refresh = () => {
    const value = getValue() || '';
    valueInput.value = value;
    if (value.startsWith('http://') || value.startsWith('https://')) {
      imagePreview.src = value;
      caption.textContent = '';
    } else if (value.startsWith('source/')) {
      imagePreview.removeAttribute('src');
      caption.textContent = 'ドラフトブランチ保存時に反映されます。';
    } else {
      imagePreview.removeAttribute('src');
      caption.textContent = '';
    }
  };

  uploadButton.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', async () => {
    const [file] = fileInput.files || [];
    fileInput.value = '';
    if (!file) return;

    uploadButton.disabled = true;
    setStatus(`アップロード中: ${file.name}`);

    try {
      const fileBase64 = await fileToBase64(file);
      const payload = await requestJson('/api/upload-image', {
        method: 'POST',
        body: JSON.stringify({
          branch: state.branch,
          locale,
          section,
          filename: `${filenameSeed}-${file.name}`,
          fileBase64,
        }),
      });

      state.branch = payload.branch;
      setValue(payload.path);
      refresh();
      setStatus(`アップロード完了: ${payload.path}`, 'success');
    } catch (error) {
      setStatus(error.message, 'error');
    } finally {
      uploadButton.disabled = false;
    }
  });

  controls.append(valueInput, uploadButton);
  wrapper.append(labelNode, controls, fileInput, imagePreview, caption);
  refresh();
  return wrapper;
};

const renderLocaleEditor = (locale) => {
  const localeContent = state.content.locales[locale];

  const card = document.createElement('section');
  card.className = 'locale-card';

  const heading = document.createElement('h3');
  heading.textContent = locale === 'ja' ? '日本語 (JA)' : 'English (EN)';
  card.append(heading);

  const urlFieldset = document.createElement('fieldset');
  urlFieldset.append(Object.assign(document.createElement('legend'), { textContent: 'URL' }));

  urlFieldset.append(
    makeFieldRow('newsAllHref', makeUrlInput(localeContent.newsAllHref, (value) => {
      localeContent.newsAllHref = value;
    })),
  );

  localeContent.newsItems.forEach((item, idx) => {
    urlFieldset.append(
      makeFieldRow(`newsItems[${idx + 1}].href`, makeUrlInput(item.href, (value) => {
        item.href = value;
      })),
    );
  });
  card.append(urlFieldset);

  const imageFieldset = document.createElement('fieldset');
  imageFieldset.append(Object.assign(document.createElement('legend'), { textContent: '画像 (アップロードのみ)' }));

  imageFieldset.append(makeImageRow({
    label: 'brandLogo',
    locale,
    section: 'brand',
    filenameSeed: 'brand-logo',
    getValue: () => localeContent.brandLogo,
    setValue: (value) => {
      localeContent.brandLogo = value;
    },
  }));

  localeContent.newsItems.forEach((item, idx) => {
    imageFieldset.append(makeImageRow({
      label: `newsItems[${idx + 1}].image`,
      locale,
      section: 'news',
      filenameSeed: `news-${idx + 1}`,
      getValue: () => item.image,
      setValue: (value) => {
        item.image = value;
      },
    }));
  });

  localeContent.coreMemberImages.forEach((_, idx) => {
    imageFieldset.append(makeImageRow({
      label: `coreMemberImages[${idx + 1}]`,
      locale,
      section: 'core-members',
      filenameSeed: `core-member-${idx + 1}`,
      getValue: () => localeContent.coreMemberImages[idx],
      setValue: (value) => {
        localeContent.coreMemberImages[idx] = value;
      },
    }));
  });

  localeContent.advisorImages.forEach((_, idx) => {
    imageFieldset.append(makeImageRow({
      label: `advisorImages[${idx + 1}]`,
      locale,
      section: 'advisors',
      filenameSeed: `advisor-${idx + 1}`,
      getValue: () => localeContent.advisorImages[idx],
      setValue: (value) => {
        localeContent.advisorImages[idx] = value;
      },
    }));
  });

  card.append(imageFieldset);

  const detailsList = document.createElement('div');
  detailsList.className = 'details-list';

  const textDetails = document.createElement('details');
  const textSummary = document.createElement('summary');
  textSummary.textContent = `Text Nodes (${localeContent.texts.length})`;
  textDetails.append(textSummary);

  localeContent.texts.forEach((value, idx) => {
    textDetails.append(makeFieldRow(`#${idx + 1}`, makeTextarea(value, (nextValue) => {
      localeContent.texts[idx] = nextValue;
    })));
  });

  const imageDetails = document.createElement('details');
  const imageSummary = document.createElement('summary');
  imageSummary.textContent = `Image Nodes (${localeContent.images.length})`;
  imageDetails.append(imageSummary);

  localeContent.images.forEach((_, idx) => {
    imageDetails.append(makeImageRow({
      label: `images[${idx + 1}]`,
      locale,
      section: 'image-nodes',
      filenameSeed: `image-${idx + 1}`,
      getValue: () => localeContent.images[idx],
      setValue: (value) => {
        localeContent.images[idx] = value;
      },
    }));
  });

  detailsList.append(textDetails, imageDetails);
  card.append(detailsList);

  return card;
};

const renderEditor = () => {
  localeEditors.innerHTML = '';
  localeEditors.append(
    renderLocaleEditor('ja'),
    renderLocaleEditor('en'),
  );
};

const loadContent = async () => {
  setStatus('コンテンツ読込中...');
  const payload = await requestJson('/api/content');
  state.content = payload.content;
  clearStatus();
  renderEditor();
};

const saveDraft = async () => {
  if (!state.content) return;
  saveDraftButton.disabled = true;
  setStatus('下書き保存中...');

  try {
    const payload = await requestJson('/api/save-draft', {
      method: 'POST',
      body: JSON.stringify({
        branch: state.branch,
        content: state.content,
      }),
    });

    state.branch = payload.branch;

    saveStatus.className = 'status success';
    saveStatus.innerHTML = '';
    const text = document.createElement('span');
    text.textContent = `保存完了: branch=${payload.branch} `;
    const link = document.createElement('a');
    link.href = payload.prUrl;
    link.target = '_blank';
    link.rel = 'noopener';
    link.textContent = 'PRを開く';
    saveStatus.append(text, link);
  } catch (error) {
    setStatus(error.message, 'error');
  } finally {
    saveDraftButton.disabled = false;
  }
};

const boot = async () => {
  try {
    const session = await requestJson('/api/session');
    state.session = session;
    state.branch = session.branch || null;

    if (!session.authenticated) {
      authPanel.hidden = false;
      forbiddenPanel.hidden = true;
      editorApp.hidden = true;
      return;
    }

    authPanel.hidden = true;

    if (!session.allowed) {
      forbiddenPanel.hidden = false;
      editorApp.hidden = true;
      return;
    }

    forbiddenPanel.hidden = true;
    editorApp.hidden = false;
    sessionInfo.textContent = `Signed in as ${session.login}${state.branch ? ` / draft: ${state.branch}` : ''}`;

    await loadContent();
  } catch (error) {
    setStatus(error.message, 'error');
  }
};

reloadButton.addEventListener('click', async () => {
  try {
    await loadContent();
  } catch (error) {
    setStatus(error.message, 'error');
  }
});

saveDraftButton.addEventListener('click', saveDraft);

boot();
