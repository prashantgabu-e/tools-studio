const transforms = [
  {
    key: "uppercase",
    label: "Style",
    title: "Uppercase",
    transform: (text) => text.toUpperCase(),
  },
  {
    key: "lowercase",
    label: "Style",
    title: "Lowercase",
    transform: (text) => text.toLowerCase(),
  },
  {
    key: "titlecase",
    label: "Format",
    title: "Title Case",
    transform: (text) =>
      text.toLowerCase().replace(/\b([a-z])/g, (match) => match.toUpperCase()),
  },
  {
    key: "sentencecase",
    label: "Format",
    title: "Sentence case",
    transform: (text) => toSentenceCase(text),
  },
  {
    key: "capitalized",
    label: "Format",
    title: "Capitalize Words",
    transform: (text) =>
      text.replace(/\b(\p{L})(\p{L}*)/gu, (_, first, rest) => {
        return first.toUpperCase() + rest.toLowerCase();
      }),
  },
  {
    key: "trimmed",
    label: "Cleanup",
    title: "Trim Extra Spaces",
    transform: (text) => text.replace(/\s+/g, " ").trim(),
  },
  {
    key: "reversed",
    label: "Creative",
    title: "Reversed Text",
    transform: (text) => [...text].reverse().join(""),
  },
  {
    key: "slug",
    label: "Web",
    title: "Slug",
    transform: (text) =>
      text
        .toLowerCase()
        .trim()
        .replace(/[^\p{L}\p{N}]+/gu, "-")
        .replace(/^-+|-+$/g, ""),
  },
];

const sourceText = document.getElementById("sourceText");
const topbarMeta = document.getElementById("topbarMeta");
const activeViewLabel = document.getElementById("activeViewLabel");
const activeViewTitle = document.getElementById("activeViewTitle");
const transformGrid = document.getElementById("transformGrid");
const clearButton = document.getElementById("clearButton");
const sidebar = document.getElementById("sidebar");
const sidebarToggle = document.getElementById("sidebarToggle");
const viewButtons = document.querySelectorAll("[data-view-target]");
const viewPanels = document.querySelectorAll("[data-view-panel]");
const template = document.getElementById("transformCardTemplate");
const placeholderText = "Your transformed text will appear here.";
const templateList = document.getElementById("templateList");
const templateSearch = document.getElementById("templateSearch");
const newTemplateButton = document.getElementById("newTemplateButton");
const saveTemplateButton = document.getElementById("saveTemplateButton");
const deleteTemplateButton = document.getElementById("deleteTemplateButton");
const exportTemplatesButton = document.getElementById("exportTemplatesButton");
const importTemplatesButton = document.getElementById("importTemplatesButton");
const templateImportInput = document.getElementById("templateImportInput");
const templateName = document.getElementById("templateName");
const templateSubject = document.getElementById("templateSubject");
const templateBody = document.getElementById("templateBody");
const variableGrid = document.getElementById("variableGrid");
const templatePreview = document.getElementById("templatePreview");
const templateSubjectPreview = document.getElementById("templateSubjectPreview");
const templateVariableSummary = document.getElementById("templateVariableSummary");
const copyRawTemplateButton = document.getElementById("copyRawTemplateButton");
const copyRenderedTemplateButton = document.getElementById("copyRenderedTemplateButton");
const copyEmailSubjectButton = document.getElementById("copyEmailSubjectButton");
const copyEmailBodyButton = document.getElementById("copyEmailBodyButton");
const dmTemplateList = document.getElementById("dmTemplateList");
const dmTemplateSearch = document.getElementById("dmTemplateSearch");
const newDmTemplateButton = document.getElementById("newDmTemplateButton");
const saveDmTemplateButton = document.getElementById("saveDmTemplateButton");
const deleteDmTemplateButton = document.getElementById("deleteDmTemplateButton");
const exportDmTemplatesButton = document.getElementById("exportDmTemplatesButton");
const importDmTemplatesButton = document.getElementById("importDmTemplatesButton");
const dmTemplateImportInput = document.getElementById("dmTemplateImportInput");
const dmTemplateName = document.getElementById("dmTemplateName");
const dmTemplateBody = document.getElementById("dmTemplateBody");
const dmVariableGrid = document.getElementById("dmVariableGrid");
const dmTemplatePreview = document.getElementById("dmTemplatePreview");
const dmTemplateVariableSummary = document.getElementById("dmTemplateVariableSummary");
const copyRawDmTemplateButton = document.getElementById("copyRawDmTemplateButton");
const copyRenderedDmTemplateButton = document.getElementById("copyRenderedDmTemplateButton");
const mobileTabs = document.querySelectorAll("[data-mobile-tab]");
const mobilePanels = document.querySelectorAll("[data-mobile-panel]");
const toastStack = document.getElementById("toastStack");

const cardMap = new Map();
let activeView = "text-tools";
const templateManagers = {
  "template-tools": createTemplateManagerConfig({
    viewId: "template-tools",
    storageKey: "text-studio-email-templates-v1",
    sourceFile: "email-templates.json",
    label: "Email Templates",
    title: "Manage email templates",
    metaLabel: "email templates",
    hasSubject: true,
    listElement: templateList,
    searchElement: templateSearch,
    newButton: newTemplateButton,
    saveButton: saveTemplateButton,
    deleteButton: deleteTemplateButton,
    exportButton: exportTemplatesButton,
    importButton: importTemplatesButton,
    importInput: templateImportInput,
    nameInput: templateName,
    subjectInput: templateSubject,
    bodyInput: templateBody,
    variableGrid,
    previewElement: templatePreview,
    subjectPreviewElement: templateSubjectPreview,
    summaryElement: templateVariableSummary,
    copyRawButton: copyRawTemplateButton,
    copyRenderedButton: copyRenderedTemplateButton,
    copySubjectButton: copyEmailSubjectButton,
    copyBodyButton: copyEmailBodyButton,
    blankName: "Untitled Email Template",
  }),
  "dm-template-tools": createTemplateManagerConfig({
    viewId: "dm-template-tools",
    storageKey: "text-studio-dm-templates-v1",
    sourceFile: "dm-templates.json",
    label: "DM Templates",
    title: "Manage direct message templates",
    metaLabel: "dm templates",
    hasSubject: false,
    listElement: dmTemplateList,
    searchElement: dmTemplateSearch,
    newButton: newDmTemplateButton,
    saveButton: saveDmTemplateButton,
    deleteButton: deleteDmTemplateButton,
    exportButton: exportDmTemplatesButton,
    importButton: importDmTemplatesButton,
    importInput: dmTemplateImportInput,
    nameInput: dmTemplateName,
    subjectInput: null,
    bodyInput: dmTemplateBody,
    variableGrid: dmVariableGrid,
    previewElement: dmTemplatePreview,
    subjectPreviewElement: null,
    summaryElement: dmTemplateVariableSummary,
    copyRawButton: copyRawDmTemplateButton,
    copyRenderedButton: copyRenderedDmTemplateButton,
    copySubjectButton: null,
    copyBodyButton: null,
    blankName: "Untitled DM Template",
  }),
};

buildCards();
updateAllTransforms();
syncSidebarState();
initializeTemplateManager();

sourceText.addEventListener("input", updateAllTransforms);
sidebarToggle.addEventListener("click", toggleSidebar);
viewButtons.forEach((button) => {
  button.addEventListener("click", () => setActiveView(button.dataset.viewTarget));
});
mobileTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    const container = tab.closest(".template-work-panel");
    setMobileTab(container, tab.dataset.mobileTab);
  });
});
clearButton.addEventListener("click", () => {
  sourceText.value = "";
  updateAllTransforms();
  sourceText.focus();
});

function buildCards() {
  const fragment = document.createDocumentFragment();

  transforms.forEach((item) => {
    const card = template.content.firstElementChild.cloneNode(true);
    const label = card.querySelector(".card-label");
    const title = card.querySelector(".card-title");
    const output = card.querySelector(".card-output");
    const copyButton = card.querySelector(".copy-button");

    label.textContent = item.label;
    title.textContent = item.title;
    output.textContent = placeholderText;
    output.classList.add("is-placeholder");

    copyButton.addEventListener("click", async () => {
      const text = cardMap.get(item.key)?.value ?? "";
      const label = copyButton.querySelector("span");

      if (!text) {
        label.textContent = "Empty";
        window.setTimeout(() => {
          label.textContent = "Copy";
        }, 1200);
        return;
      }

      try {
        await navigator.clipboard.writeText(text);
        label.textContent = "Copied";
      } catch (error) {
        label.textContent = "Select text";
      }

      window.setTimeout(() => {
        label.textContent = "Copy";
      }, 1200);
    });

    cardMap.set(item.key, { output, value: "" });
    fragment.appendChild(card);
  });

  transformGrid.appendChild(fragment);
}

function updateAllTransforms() {
  const text = sourceText.value;

  if (activeView === "text-tools") {
    topbarMeta.textContent = `${countCharacters(text)} characters • ${countWords(text)} words`;
  }

  transforms.forEach((item) => {
    const transformed = item.transform(text);
    const card = cardMap.get(item.key);

    card.value = transformed;
    card.output.textContent = transformed || placeholderText;
    card.output.classList.toggle("is-placeholder", !transformed);
  });
}

function countCharacters(text) {
  return [...text].length;
}

function countWords(text) {
  const words = text.trim().match(/\S+/g);
  return words ? words.length : 0;
}

function toSentenceCase(text) {
  return text
    .toLowerCase()
    .replace(/(^\s*\p{L}|[.!?]\s+\p{L})/gu, (match) => match.toUpperCase());
}

function toggleSidebar() {
  if (window.innerWidth <= 820) {
    return;
  }

  sidebar.classList.toggle("is-collapsed");
  syncSidebarState();
}

function syncSidebarState() {
  const expanded = !sidebar.classList.contains("is-collapsed") || window.innerWidth <= 820;
  sidebarToggle.querySelector(".button-text").textContent = expanded ? "Collapse" : "Expand";
  const icon = sidebarToggle.querySelector("i");
  icon.className = expanded ? "ri-layout-left-line" : "ri-layout-left-2-line";
  sidebarToggle.setAttribute("aria-expanded", String(expanded));
}

function setActiveView(viewId) {
  activeView = viewId;

  viewButtons.forEach((button) => {
    const isActive = button.dataset.viewTarget === viewId;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-current", isActive ? "page" : "false");
  });

  viewPanels.forEach((panel) => {
    const isActive = panel.id === viewId;
    panel.classList.toggle("is-active", isActive);
    panel.hidden = !isActive;
  });

  if (viewId === "text-tools") {
    activeViewLabel.textContent = "Text Tools";
    activeViewTitle.textContent = "Transform text";
    topbarMeta.textContent = `${countCharacters(sourceText.value)} characters • ${countWords(sourceText.value)} words`;
  } else {
    const manager = templateManagers[viewId];
    activeViewLabel.textContent = manager.label;
    activeViewTitle.textContent = manager.title;
    topbarMeta.textContent = `${manager.templates.length} ${manager.metaLabel} stored`;
  }
}

async function initializeTemplateManager() {
  for (const manager of Object.values(templateManagers)) {
    manager.templates = await loadTemplates(manager);
    manager.templates = normalizeTemplates(manager, manager.templates);
    persistTemplates(manager);
    bindTemplateEvents(manager);
    selectTemplate(manager, manager.templates[0]?.id ?? null);
    renderTemplateList(manager);
  }
  setActiveView(activeView);
}

function bindTemplateEvents(manager) {
  manager.searchElement.addEventListener("input", () => renderTemplateList(manager));
  manager.newButton.addEventListener("click", () => createNewTemplate(manager));
  manager.saveButton.addEventListener("click", () => saveCurrentTemplate(manager));
  manager.deleteButton.addEventListener("click", () => deleteCurrentTemplate(manager));
  manager.exportButton.addEventListener("click", () => exportTemplates(manager));
  manager.importButton.addEventListener("click", () => manager.importInput.click());
  manager.importInput.addEventListener("change", (event) => importTemplates(manager, event));
  manager.copyRawButton.addEventListener("click", () => {
    const current = getEditorTemplate(manager);
    copyButtonText(manager.copyRawButton, getRawTemplateText(manager, current));
  });
  manager.copyRenderedButton.addEventListener("click", () => {
    copyButtonText(manager.copyRenderedButton, renderTemplatePreview(manager, getEditorTemplate(manager), manager.variableValues));
  });
  if (manager.copySubjectButton) {
    manager.copySubjectButton.addEventListener("click", () => {
      copyButtonText(manager.copySubjectButton, applyVariables(getEditorTemplate(manager).subject, manager.variableValues));
    });
  }
  if (manager.copyBodyButton) {
    manager.copyBodyButton.addEventListener("click", () => {
      copyButtonText(manager.copyBodyButton, applyVariables(getEditorTemplate(manager).body, manager.variableValues));
    });
  }

  const fields = [manager.nameInput, manager.bodyInput];
  if (manager.subjectInput) {
    fields.push(manager.subjectInput);
  }

  fields.forEach((field) => {
    field.addEventListener("input", () => handleTemplateDraftChange(manager));
  });
}

async function loadTemplates(manager) {
  const localData = localStorage.getItem(manager.storageKey);
  if (localData) {
    try {
      return JSON.parse(localData);
    } catch (error) {
      localStorage.removeItem(manager.storageKey);
    }
  }

  try {
    const response = await fetch(manager.sourceFile);
    if (!response.ok) {
      return [];
    }

    return await response.json();
  } catch (error) {
    return [];
  }
}

function normalizeTemplates(manager, items) {
  return items.map((item, index) => ({
    id: item.id || `template-${index + 1}-${Date.now()}`,
    name: item.name || manager.blankName,
    subject: manager.hasSubject ? item.subject || "" : "",
    body: item.body || "",
  }));
}

function renderTemplateList(manager) {
  const query = manager.searchElement.value.trim().toLowerCase();
  const filtered = manager.templates.filter((item) => {
    const haystack = `${item.name} ${item.subject} ${item.body}`.toLowerCase();
    return haystack.includes(query);
  });

  manager.listElement.innerHTML = "";

  if (!filtered.length) {
    manager.listElement.appendChild(createEmptyState("No templates match your search."));
    if (activeView === manager.viewId) {
      topbarMeta.textContent = `${manager.templates.length} ${manager.metaLabel} stored`;
    }
    return;
  }

  filtered.forEach((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "template-list-item";
    if (item.id === manager.selectedTemplateId) {
      button.classList.add("is-active");
    }

    button.innerHTML = `
      <p class="template-list-name">${escapeHtml(item.name)}</p>
      <p class="template-list-meta">${extractVariables(manager, item).length} variables</p>
    `;
    button.addEventListener("click", () => selectTemplate(manager, item.id));
    manager.listElement.appendChild(button);
  });

  if (activeView === manager.viewId) {
    topbarMeta.textContent = `${manager.templates.length} ${manager.metaLabel} stored`;
  }
}

function selectTemplate(manager, templateId) {
  const found = manager.templates.find((item) => item.id === templateId) ?? createBlankTemplate(manager);
  manager.selectedTemplateId = found.id;
  manager.variableValues = {};
  manager.nameInput.value = found.name;
  if (manager.subjectInput) {
    manager.subjectInput.value = found.subject;
  }
  manager.bodyInput.value = found.body;
  renderVariableInputs(manager);
  renderPreview(manager);
  renderTemplateList(manager);
}

function createNewTemplate(manager) {
  const blank = createBlankTemplate(manager);
  manager.selectedTemplateId = blank.id;
  manager.variableValues = {};
  manager.nameInput.value = blank.name;
  if (manager.subjectInput) {
    manager.subjectInput.value = blank.subject;
  }
  manager.bodyInput.value = blank.body;
  renderVariableInputs(manager);
  renderPreview(manager);
  renderTemplateList(manager);
}

function createBlankTemplate(manager) {
  return {
    id: `template-${crypto.randomUUID ? crypto.randomUUID() : Date.now()}`,
    name: manager.blankName,
    subject: "",
    body: "",
  };
}

function handleTemplateDraftChange(manager) {
  renderVariableInputs(manager);
  renderPreview(manager);
}

function saveCurrentTemplate(manager) {
  const draft = getEditorTemplate(manager);
  const existingIndex = manager.templates.findIndex((item) => item.id === draft.id);

  if (existingIndex >= 0) {
    manager.templates[existingIndex] = draft;
  } else {
    manager.templates.unshift(draft);
  }

  persistTemplates(manager);
  renderTemplateList(manager);
  selectTemplate(manager, draft.id);
  showToast(`${draft.name} saved`, "success");
}

function deleteCurrentTemplate(manager) {
  if (!manager.selectedTemplateId) {
    return;
  }

  const existingIndex = manager.templates.findIndex((item) => item.id === manager.selectedTemplateId);
  if (existingIndex === -1) {
    createNewTemplate(manager);
    return;
  }

  const templateName = manager.templates[existingIndex].name;
  const confirmed = window.confirm(`Delete "${templateName}"? This cannot be undone.`);
  if (!confirmed) {
    return;
  }

  manager.templates.splice(existingIndex, 1);
  persistTemplates(manager);
  selectTemplate(manager, manager.templates[0]?.id ?? null);
  renderTemplateList(manager);
  showToast(`${templateName} deleted`, "warning");
}

function getEditorTemplate(manager) {
  return {
    id: manager.selectedTemplateId || createBlankTemplate(manager).id,
    name: manager.nameInput.value.trim() || manager.blankName,
    subject: manager.subjectInput ? manager.subjectInput.value : "",
    body: manager.bodyInput.value,
  };
}

function renderVariableInputs(manager) {
  const variables = extractVariables(manager, getEditorTemplate(manager));
  const nextValues = {};

  variables.forEach((key) => {
    nextValues[key] = manager.variableValues[key] || "";
  });

  manager.variableValues = nextValues;
  manager.variableGrid.innerHTML = "";
  manager.summaryElement.innerHTML = "";

  if (!variables.length) {
    const empty = createEmptyState("No variables found. Use {{name}} style placeholders.");
    manager.variableGrid.appendChild(createEmptyState("No variables found. Use {{name}} style placeholders."));
    manager.summaryElement.appendChild(empty.cloneNode(true));
    return;
  }

  variables.forEach((name) => {
    const pill = document.createElement("div");
    pill.className = "variable-pill";
    pill.textContent = `{{${name}}}`;
    manager.summaryElement.appendChild(pill);
  });

  variables.forEach((name) => {
    const wrapper = document.createElement("label");
    wrapper.className = "variable-chip";
    wrapper.innerHTML = `
      <code>{{${escapeHtml(name)}}}</code>
      <input class="compact-input" type="text" placeholder="Value for ${escapeHtml(name)}" />
    `;
    const input = wrapper.querySelector("input");
    input.value = manager.variableValues[name];
    input.addEventListener("input", () => {
      manager.variableValues[name] = input.value;
      renderPreview(manager);
    });
    manager.variableGrid.appendChild(wrapper);
  });
}

function renderPreview(manager) {
  const templateItem = getEditorTemplate(manager);
  const subject = applyVariables(templateItem.subject, manager.variableValues);
  const body = applyVariables(templateItem.body, manager.variableValues);
  if (manager.subjectPreviewElement) {
    manager.subjectPreviewElement.textContent = subject;
  }
  manager.previewElement.textContent = body;
}

function renderTemplatePreview(manager, templateItem, values) {
  const subject = applyVariables(templateItem.subject, values);
  const body = applyVariables(templateItem.body, values);
  return manager.hasSubject ? `Subject: ${subject}\n\n${body}`.trim() : body.trim();
}

function applyVariables(text, values) {
  return text.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_, key) => values[key.trim()] ?? `{{${key.trim()}}}`);
}

function extractVariables(manager, templateItem) {
  const matches = `${templateItem.subject}\n${templateItem.body}`.match(/\{\{\s*([^}]+?)\s*\}\}/g) || [];
  return [...new Set(matches.map((token) => token.replace(/[{}]/g, "").trim()))];
}

function persistTemplates(manager) {
  localStorage.setItem(manager.storageKey, JSON.stringify(manager.templates));
  if (activeView === manager.viewId) {
    topbarMeta.textContent = `${manager.templates.length} ${manager.metaLabel} stored`;
  }
}

function exportTemplates(manager) {
  const blob = new Blob([JSON.stringify(manager.templates, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = manager.sourceFile;
  link.click();
  URL.revokeObjectURL(url);
  copyFeedback(manager.exportButton, "Exported");
}

function importTemplates(manager, event) {
  const file = event.target.files?.[0];
  if (!file) {
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result));
      manager.templates = normalizeTemplates(manager, Array.isArray(parsed) ? parsed : []);
      persistTemplates(manager);
      selectTemplate(manager, manager.templates[0]?.id ?? null);
      renderTemplateList(manager);
      copyFeedback(manager.importButton, "Imported");
    } catch (error) {
      copyFeedback(manager.importButton, "Invalid JSON");
    }
    manager.importInput.value = "";
  };
  reader.readAsText(file);
}

function getRawTemplateText(manager, templateItem) {
  return manager.hasSubject ? `${templateItem.subject}\n\n${templateItem.body}` : templateItem.body;
}

function createTemplateManagerConfig(config) {
  return {
    ...config,
    templates: [],
    selectedTemplateId: null,
    variableValues: {},
  };
}

function setMobileTab(container, tabId) {
  const tabs = container.querySelectorAll("[data-mobile-tab]");
  const panels = container.querySelectorAll("[data-mobile-panel]");

  if (window.innerWidth > 820) {
    panels.forEach((panel) => {
      panel.hidden = false;
    });
    return;
  }

  tabs.forEach((tab) => {
    tab.classList.toggle("is-active", tab.dataset.mobileTab === tabId);
  });
  panels.forEach((panel) => {
    const isActive = panel.id === tabId;
    panel.classList.toggle("is-active", isActive);
    panel.hidden = !isActive;
  });
}

window.addEventListener("resize", () => {
  if (window.innerWidth > 820) {
    mobilePanels.forEach((panel) => {
      panel.hidden = false;
    });
  } else {
    document.querySelectorAll(".template-work-panel").forEach((container) => {
      const activeTab = container.querySelector(".mobile-tab.is-active") || container.querySelector(".mobile-tab");
      if (activeTab) {
        setMobileTab(container, activeTab.dataset.mobileTab);
      }
    });
  }
});

document.querySelectorAll(".template-work-panel").forEach((container) => {
  const activeTab = container.querySelector(".mobile-tab.is-active") || container.querySelector(".mobile-tab");
  if (activeTab) {
    setMobileTab(container, activeTab.dataset.mobileTab);
  }
});

function createEmptyState(message) {
  const element = document.createElement("div");
  element.className = "empty-state";
  element.textContent = message;
  return element;
}

function showToast(message, variant = "success") {
  const toast = document.createElement("div");
  toast.className = `toast is-${variant}`;
  toast.textContent = message;
  toastStack.appendChild(toast);

  window.setTimeout(() => {
    toast.remove();
  }, 2200);
}

async function copyButtonText(button, text) {
  const label = button.querySelector("span");
  const defaultLabel = button.dataset.defaultLabel || label.textContent;
  button.dataset.defaultLabel = defaultLabel;

  if (!text) {
    label.textContent = "Empty";
    window.setTimeout(() => {
      label.textContent = defaultLabel;
    }, 1200);
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
    label.textContent = "Copied";
  } catch (error) {
    label.textContent = "Select text";
  }

  window.setTimeout(() => {
    label.textContent = defaultLabel;
  }, 1200);
}

function copyFeedback(button, message) {
  const label = button.querySelector("span");
  const original = label.textContent;
  label.textContent = message;
  window.setTimeout(() => {
    label.textContent = original;
  }, 1200);
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

window.addEventListener("resize", syncSidebarState);
