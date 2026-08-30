import { useEffect, useMemo, useState } from "react";
import type { BasicTemplate, PromptTemplate, ToastItem, ToastTone } from "./types";
import {
  applyVariables,
  createBasicTemplate,
  createPromptTemplate,
  extractVariableNames,
  normalizeBasicTemplates,
  normalizePromptTemplates,
} from "./utils";

export function useToasts() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  function pushToast(message: string, tone: ToastTone = "success") {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setToasts((current) => [...current, { id, message, tone }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, 2200);
  }

  return { pushToast, toasts };
}

type BasicManagerOptions = {
  blankName: string;
  hasSubject: boolean;
  initialItems: unknown[];
  storageKey: string;
};

export function useBasicTemplateManager(options: BasicManagerOptions) {
  const { blankName, hasSubject, initialItems, storageKey } = options;
  const normalizedDefaults = useMemo(
    () => normalizeBasicTemplates(initialItems, blankName, hasSubject),
    [blankName, hasSubject, initialItems],
  );

  const [templates, setTemplates] = useState<BasicTemplate[]>(normalizedDefaults);
  const [selectedId, setSelectedId] = useState<string | null>(
    normalizedDefaults[0]?.id ?? null,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [draft, setDraft] = useState<BasicTemplate>(() =>
    normalizedDefaults[0] ?? createBasicTemplate(blankName),
  );
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) {
        return;
      }
      const parsed = JSON.parse(raw) as unknown[];
      const nextTemplates = normalizeBasicTemplates(parsed, blankName, hasSubject);
      setTemplates(nextTemplates);
      const first = nextTemplates[0] ?? createBasicTemplate(blankName);
      setSelectedId(first.id);
      setDraft(first);
    } catch {
      localStorage.removeItem(storageKey);
    }
  }, [blankName, hasSubject, storageKey]);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(templates));
  }, [storageKey, templates]);

  const variables = useMemo(
    () => extractVariableNames([draft.subject, draft.body]),
    [draft.body, draft.subject],
  );

  useEffect(() => {
    setVariableValues((current) => {
      const nextValues: Record<string, string> = {};
      variables.forEach((name) => {
        nextValues[name] = current[name] || "";
      });
      return nextValues;
    });
  }, [variables]);

  const filteredTemplates = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return templates;
    }
    return templates.filter((item) =>
      `${item.name} ${item.subject} ${item.body}`.toLowerCase().includes(query),
    );
  }, [searchQuery, templates]);

  function selectTemplate(templateId: string | null) {
    const found =
      templates.find((item) => item.id === templateId) ?? createBasicTemplate(blankName);
    setSelectedId(found.id);
    setDraft(found);
    setVariableValues({});
  }

  function createNewTemplate() {
    const blank = createBasicTemplate(blankName);
    setSelectedId(blank.id);
    setDraft(blank);
    setVariableValues({});
  }

  function saveTemplate() {
    setTemplates((current) => {
      const existingIndex = current.findIndex((item) => item.id === draft.id);
      if (existingIndex >= 0) {
        return current.map((item) => (item.id === draft.id ? draft : item));
      }
      return [draft, ...current];
    });
    setSelectedId(draft.id);
  }

  function deleteTemplate() {
    if (!selectedId) {
      return null;
    }
    const existing = templates.find((item) => item.id === selectedId);
    if (!existing) {
      createNewTemplate();
      return null;
    }
    const nextTemplates = templates.filter((item) => item.id !== selectedId);
    setTemplates(nextTemplates);
    const nextSelected = nextTemplates[0] ?? createBasicTemplate(blankName);
    setSelectedId(nextTemplates[0]?.id ?? nextSelected.id);
    setDraft(nextSelected);
    setVariableValues({});
    return existing;
  }

  function syncFromSource() {
    setTemplates(normalizedDefaults);
    const next = normalizedDefaults[0] ?? createBasicTemplate(blankName);
    setSelectedId(next.id);
    setDraft(next);
    setVariableValues({});
  }

  function importTemplates(items: unknown[]) {
    const nextTemplates = normalizeBasicTemplates(items, blankName, hasSubject);
    setTemplates(nextTemplates);
    const next = nextTemplates[0] ?? createBasicTemplate(blankName);
    setSelectedId(next.id);
    setDraft(next);
    setVariableValues({});
  }

  const renderedSubject = useMemo(
    () => applyVariables(draft.subject, variableValues),
    [draft.subject, variableValues],
  );
  const renderedBody = useMemo(
    () => applyVariables(draft.body, variableValues),
    [draft.body, variableValues],
  );

  return {
    createNewTemplate,
    deleteTemplate,
    draft,
    filteredTemplates,
    importTemplates,
    renderedBody,
    renderedSubject,
    saveTemplate,
    searchQuery,
    selectedId,
    setDraft,
    setSearchQuery,
    setVariableValues,
    syncFromSource,
    templates,
    variableValues,
    variables,
    selectTemplate,
  };
}

type PromptManagerOptions = {
  blankTitle: string;
  initialItems: unknown[];
  storageKey: string;
};

export function usePromptTemplateManager(options: PromptManagerOptions) {
  const { blankTitle, initialItems, storageKey } = options;
  const normalizedDefaults = useMemo(
    () => normalizePromptTemplates(initialItems, blankTitle),
    [blankTitle, initialItems],
  );

  const [templates, setTemplates] = useState<PromptTemplate[]>(normalizedDefaults);
  const [selectedId, setSelectedId] = useState<string | null>(
    normalizedDefaults[0]?.id ?? null,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [draft, setDraft] = useState<PromptTemplate>(() =>
    normalizedDefaults[0] ?? createPromptTemplate(blankTitle),
  );
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) {
        return;
      }
      const parsed = JSON.parse(raw) as unknown[];
      const nextTemplates = normalizePromptTemplates(parsed, blankTitle);
      setTemplates(nextTemplates);
      const first = nextTemplates[0] ?? createPromptTemplate(blankTitle);
      setSelectedId(first.id);
      setDraft(first);
    } catch {
      localStorage.removeItem(storageKey);
    }
  }, [blankTitle, storageKey]);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(templates));
  }, [storageKey, templates]);

  const variables = useMemo(
    () => extractVariableNames([draft.prompt, draft.sampleInputTemplate]),
    [draft.prompt, draft.sampleInputTemplate],
  );

  useEffect(() => {
    setVariableValues((current) => {
      const nextValues: Record<string, string> = {};
      variables.forEach((name) => {
        nextValues[name] = current[name] || "";
      });
      return nextValues;
    });
  }, [variables]);

  const filteredTemplates = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return templates;
    }
    return templates.filter((item) =>
      `${item.title} ${item.categories} ${item.prompt} ${item.sampleInputTemplate} ${item.sampleOutput}`
        .toLowerCase()
        .includes(query),
    );
  }, [searchQuery, templates]);

  function selectTemplate(templateId: string | null) {
    const found =
      templates.find((item) => item.id === templateId) ?? createPromptTemplate(blankTitle);
    setSelectedId(found.id);
    setDraft(found);
    setVariableValues({});
  }

  function createNewTemplate() {
    const blank = createPromptTemplate(blankTitle);
    setSelectedId(blank.id);
    setDraft(blank);
    setVariableValues({});
  }

  function saveTemplate() {
    setTemplates((current) => {
      const existingIndex = current.findIndex((item) => item.id === draft.id);
      if (existingIndex >= 0) {
        return current.map((item) => (item.id === draft.id ? draft : item));
      }
      return [draft, ...current];
    });
    setSelectedId(draft.id);
  }

  function deleteTemplate() {
    if (!selectedId) {
      return null;
    }
    const existing = templates.find((item) => item.id === selectedId);
    if (!existing) {
      createNewTemplate();
      return null;
    }
    const nextTemplates = templates.filter((item) => item.id !== selectedId);
    setTemplates(nextTemplates);
    const nextSelected = nextTemplates[0] ?? createPromptTemplate(blankTitle);
    setSelectedId(nextTemplates[0]?.id ?? nextSelected.id);
    setDraft(nextSelected);
    setVariableValues({});
    return existing;
  }

  function syncFromSource() {
    setTemplates(normalizedDefaults);
    const next = normalizedDefaults[0] ?? createPromptTemplate(blankTitle);
    setSelectedId(next.id);
    setDraft(next);
    setVariableValues({});
  }

  function importTemplates(items: unknown[]) {
    const nextTemplates = normalizePromptTemplates(items, blankTitle);
    setTemplates(nextTemplates);
    const next = nextTemplates[0] ?? createPromptTemplate(blankTitle);
    setSelectedId(next.id);
    setDraft(next);
    setVariableValues({});
  }

  return {
    createNewTemplate,
    deleteTemplate,
    draft,
    filteredTemplates,
    importTemplates,
    renderedPrompt: applyVariables(draft.prompt, variableValues),
    renderedSampleInput: applyVariables(draft.sampleInputTemplate, variableValues),
    saveTemplate,
    searchQuery,
    selectedId,
    setDraft,
    setSearchQuery,
    setVariableValues,
    syncFromSource,
    templates,
    variableValues,
    variables,
    selectTemplate,
  };
}
