import { useEffect, useMemo, useRef, useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  writeBatch,
} from "firebase/firestore";
import { getFirebaseServices } from "./firebase";
import type { BasicTemplate, PromptTemplate, ToastItem, ToastTone } from "./types";
import type {
  PromptBuilderCategory,
  PromptBuilderLibrary,
  PromptIngredient,
} from "./types";
import {
  applyVariables,
  createBasicTemplate,
  createEmptyPromptBuilderLibrary,
  createPromptIngredient,
  createPromptTemplate,
  extractVariableNames,
  mergePromptBuilderLibraries,
  normalizeBasicTemplates,
  normalizePromptBuilderLibrary,
  normalizePromptTemplates,
  promptBuilderCategories,
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

type PromptBuilderOptions = {
  userId: string | null;
};

export function usePromptBuilderManager(options: PromptBuilderOptions) {
  const { userId } = options;
  const emptyLibrary = useMemo(() => createEmptyPromptBuilderLibrary(), []);
  const [library, setLibrary] = useState<PromptBuilderLibrary>(emptyLibrary);
  const [selectedCategory, setSelectedCategory] =
    useState<PromptBuilderCategory>("lighting");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<PromptIngredient>(() => createPromptIngredient());
  const [searchQuery, setSearchQuery] = useState("");
  const [composerText, setComposerText] = useState("");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const selectedCategoryRef = useRef(selectedCategory);

  useEffect(() => {
    selectedCategoryRef.current = selectedCategory;
  }, [selectedCategory]);

  useEffect(() => {
    const { db } = getFirebaseServices();
    if (!db) {
      setLibrary(emptyLibrary);
      const blank = createPromptIngredient();
      setSelectedCategory("lighting");
      setSelectedId(blank.id);
      setDraft(blank);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const libraryRef = doc(db, "promptBuilder", "library");
    return onSnapshot(
      libraryRef,
      (snapshot) => {
        const nextLibrary = snapshot.exists()
          ? normalizePromptBuilderLibrary(snapshot.data())
          : createEmptyPromptBuilderLibrary();
        setLibrary(nextLibrary);
        setSelectedId((currentSelectedId) => {
          const categoryItems = nextLibrary[selectedCategoryRef.current];
          const nextSelected =
            categoryItems.find((item) => item.id === currentSelectedId) ?? categoryItems[0];
          if (nextSelected) {
            setDraft((currentDraft) =>
              currentDraft.id === nextSelected.id
                ? nextSelected
                : categoryItems.find((item) => item.id === currentDraft.id) ?? nextSelected,
            );
            return nextSelected.id;
          }

          const blank = createPromptIngredient();
          setDraft(blank);
          return blank.id;
        });
        setError(null);
        setIsLoading(false);
      },
      (snapshotError) => {
        setError(snapshotError.message);
        setIsLoading(false);
      },
    );
  }, [emptyLibrary]);

  const totalItems = useMemo(
    () =>
      promptBuilderCategories.reduce(
        (total, category) => total + library[category.id].length,
        0,
      ),
    [library],
  );

  const filteredItems = useMemo(() => {
    const queryText = searchQuery.trim().toLowerCase();
    const items = showFavoritesOnly
      ? (library[selectedCategory] ?? []).filter((item) => item.favorite)
      : library[selectedCategory] ?? [];
    if (!queryText) {
      return items;
    }

    return items.filter((item) =>
      `${item.title} ${item.text} ${item.tags.join(" ")} ${item.useFor}`
        .toLowerCase()
        .includes(queryText),
    );
  }, [library, searchQuery, selectedCategory, showFavoritesOnly]);

  function selectCategory(category: PromptBuilderCategory) {
    const nextItem = library[category][0] ?? createPromptIngredient();
    setSelectedCategory(category);
    setSelectedId(nextItem.id);
    setDraft(nextItem);
  }

  function selectIngredient(id: string | null) {
    const found =
      library[selectedCategory].find((item) => item.id === id) ?? createPromptIngredient();
    setSelectedId(found.id);
    setDraft(found);
  }

  function createNewIngredient() {
    const blank = createPromptIngredient();
    setSelectedId(blank.id);
    setDraft(blank);
  }

  function appendToComposer(text = draft.text) {
    const trimmed = text.trim();
    if (!trimmed) {
      return;
    }
    setComposerText((current) => (current.trim() ? `${current.trim()}, ${trimmed}` : trimmed));
  }

  async function persistLibrary(nextLibrary: PromptBuilderLibrary) {
    const { db } = getFirebaseServices();
    if (!db || !userId) {
      throw new Error("Sign in to save the builder library to Firestore.");
    }

    await setDoc(doc(db, "promptBuilder", "library"), {
      ...nextLibrary,
      updatedAt: serverTimestamp(),
    });
    setLibrary(nextLibrary);
  }

  async function saveIngredient() {
    const nextLibrary = {
      ...library,
      [selectedCategory]: upsertIngredient(library[selectedCategory], draft),
    };
    await persistLibrary(nextLibrary);
    setSelectedId(draft.id);
  }

  async function deleteIngredient() {
    if (!selectedId) {
      return null;
    }
    const existing = library[selectedCategory].find((item) => item.id === selectedId);
    if (!existing) {
      createNewIngredient();
      return null;
    }

    const nextItems = library[selectedCategory].filter((item) => item.id !== selectedId);
    const nextLibrary = { ...library, [selectedCategory]: nextItems };
    await persistLibrary(nextLibrary);
    const nextSelected = nextItems[0] ?? createPromptIngredient();
    setSelectedId(nextSelected.id);
    setDraft(nextSelected);
    return existing;
  }

  async function toggleFavorite(item: PromptIngredient) {
    const nextItem = { ...item, favorite: !item.favorite };
    const nextLibrary = {
      ...library,
      [selectedCategory]: upsertIngredient(library[selectedCategory], nextItem),
    };
    await persistLibrary(nextLibrary);
    if (draft.id === item.id) {
      setDraft(nextItem);
    }
  }

  async function importLibrary(items: unknown, mode: "merge" | "replace") {
    const incoming = normalizePromptBuilderLibrary(items);
    const nextLibrary =
      mode === "merge" ? mergePromptBuilderLibraries(library, incoming) : incoming;
    await persistLibrary(nextLibrary);
    const nextSelected = nextLibrary[selectedCategory][0] ?? createPromptIngredient();
    setSelectedId(nextSelected.id);
    setDraft(nextSelected);
  }

  return {
    appendToComposer,
    categories: promptBuilderCategories,
    composerText,
    createNewIngredient,
    deleteIngredient,
    draft,
    error,
    filteredItems,
    importLibrary,
    isLoading,
    library,
    saveIngredient,
    searchQuery,
    selectedCategory,
    selectedId,
    selectCategory,
    selectIngredient,
    setComposerText,
    setDraft,
    setSearchQuery,
    setShowFavoritesOnly,
    showFavoritesOnly,
    toggleFavorite,
    totalItems,
  };
}

function upsertIngredient(items: PromptIngredient[], ingredient: PromptIngredient) {
  const existingIndex = items.findIndex((item) => item.id === ingredient.id);
  if (existingIndex >= 0) {
    return items.map((item) => (item.id === ingredient.id ? ingredient : item));
  }
  return [ingredient, ...items];
}

type BasicManagerOptions = {
  blankName: string;
  collectionName: string;
  hasSubject: boolean;
  userId: string | null;
};

export function useBasicTemplateManager(options: BasicManagerOptions) {
  const { blankName, collectionName, hasSubject, userId } = options;

  const [templates, setTemplates] = useState<BasicTemplate[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [draft, setDraft] = useState<BasicTemplate>(() =>
    createBasicTemplate(blankName),
  );
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const { db } = getFirebaseServices();
    if (!db) {
      setTemplates([]);
      const blank = createBasicTemplate(blankName);
      setSelectedId(blank.id);
      setDraft(blank);
      setVariableValues({});
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const templatesRef = collection(db, collectionName);
    return onSnapshot(
      query(templatesRef),
      (snapshot) => {
        const nextTemplates = normalizeBasicTemplates(
          snapshot.docs.map((item) => ({ id: item.id, ...item.data() })),
          blankName,
          hasSubject,
        );
        setTemplates(nextTemplates);
        setSelectedId((currentSelectedId) => {
          const nextSelected =
            nextTemplates.find((item) => item.id === currentSelectedId) ?? nextTemplates[0];
          if (nextSelected) {
            setDraft((currentDraft) =>
              currentDraft.id === nextSelected.id
                ? nextSelected
                : nextTemplates.find((item) => item.id === currentDraft.id) ?? nextSelected,
            );
            return nextSelected.id;
          }

          const blank = createBasicTemplate(blankName);
          setDraft(blank);
          return blank.id;
        });
        setError(null);
        setIsLoading(false);
      },
      (snapshotError) => {
        setError(snapshotError.message);
        setIsLoading(false);
      },
    );
  }, [blankName, collectionName, hasSubject]);

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

  async function saveTemplate() {
    const { db } = getFirebaseServices();
    if (!db || !userId) {
      throw new Error("Sign in to save templates to Firestore.");
    }

    await setDoc(doc(db, collectionName, draft.id), {
      ...draft,
      updatedAt: serverTimestamp(),
    });
    setTemplates((current) => {
      const existingIndex = current.findIndex((item) => item.id === draft.id);
      if (existingIndex >= 0) {
        return current.map((item) => (item.id === draft.id ? draft : item));
      }
      return [draft, ...current];
    });
    setSelectedId(draft.id);
  }

  async function deleteTemplate() {
    if (!selectedId) {
      return null;
    }
    const { db } = getFirebaseServices();
    if (!db || !userId) {
      throw new Error("Sign in to delete templates from Firestore.");
    }
    const existing = templates.find((item) => item.id === selectedId);
    if (!existing) {
      createNewTemplate();
      return null;
    }
    await deleteDoc(doc(db, collectionName, selectedId));
    const nextTemplates = templates.filter((item) => item.id !== selectedId);
    setTemplates(nextTemplates);
    const nextSelected = nextTemplates[0] ?? createBasicTemplate(blankName);
    setSelectedId(nextTemplates[0]?.id ?? nextSelected.id);
    setDraft(nextSelected);
    setVariableValues({});
    return existing;
  }

  async function importTemplates(items: unknown[]) {
    const { db } = getFirebaseServices();
    if (!db || !userId) {
      throw new Error("Sign in to import templates to Firestore.");
    }

    const nextTemplates = normalizeBasicTemplates(items, blankName, hasSubject);
    const templatesRef = collection(db, collectionName);
    const batch = writeBatch(db);
    nextTemplates.forEach((item) => {
      batch.set(doc(templatesRef, item.id), { ...item, updatedAt: serverTimestamp() });
    });
    await batch.commit();
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
    error,
    importTemplates,
    isLoading,
    renderedBody,
    renderedSubject,
    saveTemplate,
    searchQuery,
    selectedId,
    setDraft,
    setSearchQuery,
    setVariableValues,
    templates,
    variableValues,
    variables,
    selectTemplate,
  };
}

type PromptManagerOptions = {
  blankTitle: string;
  collectionName: string;
  userId: string | null;
};

export function usePromptTemplateManager(options: PromptManagerOptions) {
  const { blankTitle, collectionName, userId } = options;

  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [draft, setDraft] = useState<PromptTemplate>(() =>
    createPromptTemplate(blankTitle),
  );
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const { db } = getFirebaseServices();
    if (!db) {
      setTemplates([]);
      const blank = createPromptTemplate(blankTitle);
      setSelectedId(blank.id);
      setDraft(blank);
      setVariableValues({});
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const templatesRef = collection(db, collectionName);
    return onSnapshot(
      query(templatesRef),
      (snapshot) => {
        const nextTemplates = normalizePromptTemplates(
          snapshot.docs.map((item) => ({ id: item.id, ...item.data() })),
          blankTitle,
        );
        setTemplates(nextTemplates);
        setSelectedId((currentSelectedId) => {
          const nextSelected =
            nextTemplates.find((item) => item.id === currentSelectedId) ?? nextTemplates[0];
          if (nextSelected) {
            setDraft((currentDraft) =>
              currentDraft.id === nextSelected.id
                ? nextSelected
                : nextTemplates.find((item) => item.id === currentDraft.id) ?? nextSelected,
            );
            return nextSelected.id;
          }

          const blank = createPromptTemplate(blankTitle);
          setDraft(blank);
          return blank.id;
        });
        setError(null);
        setIsLoading(false);
      },
      (snapshotError) => {
        setError(snapshotError.message);
        setIsLoading(false);
      },
    );
  }, [blankTitle, collectionName]);

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

  async function saveTemplate() {
    const { db } = getFirebaseServices();
    if (!db || !userId) {
      throw new Error("Sign in to save templates to Firestore.");
    }

    await setDoc(doc(db, collectionName, draft.id), {
      ...draft,
      updatedAt: serverTimestamp(),
    });
    setTemplates((current) => {
      const existingIndex = current.findIndex((item) => item.id === draft.id);
      if (existingIndex >= 0) {
        return current.map((item) => (item.id === draft.id ? draft : item));
      }
      return [draft, ...current];
    });
    setSelectedId(draft.id);
  }

  async function deleteTemplate() {
    if (!selectedId) {
      return null;
    }
    const { db } = getFirebaseServices();
    if (!db || !userId) {
      throw new Error("Sign in to delete templates from Firestore.");
    }
    const existing = templates.find((item) => item.id === selectedId);
    if (!existing) {
      createNewTemplate();
      return null;
    }
    await deleteDoc(doc(db, collectionName, selectedId));
    const nextTemplates = templates.filter((item) => item.id !== selectedId);
    setTemplates(nextTemplates);
    const nextSelected = nextTemplates[0] ?? createPromptTemplate(blankTitle);
    setSelectedId(nextTemplates[0]?.id ?? nextSelected.id);
    setDraft(nextSelected);
    setVariableValues({});
    return existing;
  }

  async function importTemplates(items: unknown[]) {
    const { db } = getFirebaseServices();
    if (!db || !userId) {
      throw new Error("Sign in to import templates to Firestore.");
    }

    const nextTemplates = normalizePromptTemplates(items, blankTitle);
    const templatesRef = collection(db, collectionName);
    const batch = writeBatch(db);
    nextTemplates.forEach((item) => {
      batch.set(doc(templatesRef, item.id), { ...item, updatedAt: serverTimestamp() });
    });
    await batch.commit();
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
    error,
    importTemplates,
    isLoading,
    renderedPrompt: applyVariables(draft.prompt, variableValues),
    renderedSampleInput: applyVariables(draft.sampleInputTemplate, variableValues),
    saveTemplate,
    searchQuery,
    selectedId,
    setDraft,
    setSearchQuery,
    setVariableValues,
    templates,
    variableValues,
    variables,
    selectTemplate,
  };
}
