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
import type {
  BasicTemplate,
  PromptLibraryItem,
  PromptTemplate,
  ToastItem,
  ToastTone,
} from "./types";
import type {
  PromptBuilderCategory,
  PromptBuilderLibrary,
  PromptIngredient,
} from "./types";
import {
  applyVariables,
  createBasicTemplate,
  createEmptyPromptBuilderLibrary,
  createPromptBuilderCategory,
  createPromptLibraryItem,
  createPromptIngredient,
  createPromptTemplate,
  extractVariableNames,
  mergePromptBuilderLibraries,
  normalizeBasicTemplates,
  normalizePromptLibraryItems,
  normalizePromptBuilderCategories,
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
  const [categories, setCategories] = useState(promptBuilderCategories);
  const [selectedCategory, setSelectedCategory] = useState<PromptBuilderCategory>(
    promptBuilderCategories[0].id,
  );
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
      setCategories(promptBuilderCategories);
      setSelectedCategory(promptBuilderCategories[0].id);
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
        const nextCategories = snapshot.exists()
          ? normalizePromptBuilderCategories(snapshot.data())
          : promptBuilderCategories;
        const nextLibrary = snapshot.exists()
          ? normalizePromptBuilderLibrary(snapshot.data(), nextCategories)
          : createEmptyPromptBuilderLibrary(nextCategories);
        setCategories(nextCategories);
        setLibrary(nextLibrary);
        setSelectedId((currentSelectedId) => {
          const currentCategory = nextCategories.some(
            (category) => category.id === selectedCategoryRef.current,
          )
            ? selectedCategoryRef.current
            : nextCategories[0].id;
          if (currentCategory !== selectedCategoryRef.current) {
            selectedCategoryRef.current = currentCategory;
            setSelectedCategory(currentCategory);
          }
          const categoryItems = nextLibrary[currentCategory] ?? [];
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
      categories.reduce(
        (total, category) => total + (library[category.id]?.length ?? 0),
        0,
      ),
    [categories, library],
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
    const nextItem = (library[category] ?? [])[0] ?? createPromptIngredient();
    setSelectedCategory(category);
    setSelectedId(nextItem.id);
    setDraft(nextItem);
  }

  function selectIngredient(id: string | null) {
    const found =
      (library[selectedCategory] ?? []).find((item) => item.id === id) ??
      createPromptIngredient();
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

  async function persistLibrary(
    nextLibrary: PromptBuilderLibrary,
    nextCategories = categories,
  ) {
    const { db } = getFirebaseServices();
    if (!db || !userId) {
      throw new Error("Sign in to save the builder library to Firestore.");
    }

    await setDoc(doc(db, "promptBuilder", "library"), {
      categories: nextCategories,
      ...nextLibrary,
      updatedAt: serverTimestamp(),
    });
    setCategories(nextCategories);
    setLibrary(nextLibrary);
  }

  async function saveIngredient() {
    const nextLibrary = {
      ...library,
      [selectedCategory]: upsertIngredient(library[selectedCategory] ?? [], draft),
    };
    await persistLibrary(nextLibrary);
    setSelectedId(draft.id);
  }

  async function deleteIngredient(ingredientId = selectedId) {
    if (!ingredientId) {
      return null;
    }
    const existing = (library[selectedCategory] ?? []).find((item) => item.id === ingredientId);
    if (!existing) {
      createNewIngredient();
      return null;
    }

    const nextItems = (library[selectedCategory] ?? []).filter((item) => item.id !== ingredientId);
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
      [selectedCategory]: upsertIngredient(library[selectedCategory] ?? [], nextItem),
    };
    await persistLibrary(nextLibrary);
    if (draft.id === item.id) {
      setDraft(nextItem);
    }
  }

  async function importLibrary(items: unknown, mode: "merge" | "replace") {
    const incomingCategories = normalizePromptBuilderCategories(items);
    const nextCategories =
      mode === "merge"
        ? mergePromptBuilderCategories(categories, incomingCategories)
        : incomingCategories;
    const incoming = normalizePromptBuilderLibrary(items, nextCategories);
    const nextLibrary =
      mode === "merge"
        ? mergePromptBuilderLibraries(library, incoming, nextCategories)
        : incoming;
    await persistLibrary(nextLibrary, nextCategories);
    const nextCategory = nextCategories.some((category) => category.id === selectedCategory)
      ? selectedCategory
      : nextCategories[0].id;
    setSelectedCategory(nextCategory);
    const nextSelected = nextLibrary[nextCategory][0] ?? createPromptIngredient();
    setSelectedId(nextSelected.id);
    setDraft(nextSelected);
  }

  async function saveCategory(category: {
    id?: string;
    label: string;
    shortLabel: string;
  }) {
    const existing = category.id
      ? categories.find((item) => item.id === category.id)
      : undefined;
    const nextCategory = existing
      ? {
          ...existing,
          label: category.label.trim() || "Untitled Category",
          shortLabel: category.shortLabel.trim() || category.label.trim().slice(0, 8) || "Cat",
        }
      : createPromptBuilderCategory(category.label, categories);
    const nextCategories = existing
      ? categories.map((item) => (item.id === nextCategory.id ? nextCategory : item))
      : [...categories, nextCategory];
    const nextLibrary = {
      ...library,
      [nextCategory.id]: library[nextCategory.id] ?? [],
    };
    await persistLibrary(nextLibrary, nextCategories);
    setSelectedCategory(nextCategory.id);
    selectedCategoryRef.current = nextCategory.id;
  }

  async function deleteCategory(categoryId: PromptBuilderCategory) {
    if (categories.length <= 1) {
      throw new Error("Keep at least one kit category.");
    }
    const nextCategories = categories.filter((category) => category.id !== categoryId);
    const nextLibrary = { ...library };
    delete nextLibrary[categoryId];
    await persistLibrary(nextLibrary, nextCategories);
    if (selectedCategory === categoryId) {
      const nextCategory = nextCategories[0].id;
      const nextSelected = nextLibrary[nextCategory]?.[0] ?? createPromptIngredient();
      setSelectedCategory(nextCategory);
      selectedCategoryRef.current = nextCategory;
      setSelectedId(nextSelected.id);
      setDraft(nextSelected);
    }
  }

  return {
    appendToComposer,
    categories,
    composerText,
    deleteCategory,
    createNewIngredient,
    deleteIngredient,
    draft,
    error,
    filteredItems,
    importLibrary,
    isLoading,
    library,
    saveCategory,
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

function mergePromptBuilderCategories(
  current: typeof promptBuilderCategories,
  incoming: typeof promptBuilderCategories,
) {
  const byId = new Map(current.map((category) => [category.id, category]));
  incoming.forEach((category) => byId.set(category.id, category));
  return [...byId.values()];
}

function upsertIngredient(items: PromptIngredient[], ingredient: PromptIngredient) {
  const existingIndex = items.findIndex((item) => item.id === ingredient.id);
  if (existingIndex >= 0) {
    return items.map((item) => (item.id === ingredient.id ? ingredient : item));
  }
  return [ingredient, ...items];
}

type PromptLibraryOptions = {
  userId: string | null;
};

export function usePromptLibraryManager(options: PromptLibraryOptions) {
  const { userId } = options;
  const [items, setItems] = useState<PromptLibraryItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<PromptLibraryItem>(() => createPromptLibraryItem());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const { db } = getFirebaseServices();
    if (!db) {
      setItems([]);
      setSelectedId(null);
      setDraft(createPromptLibraryItem());
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const itemsRef = collection(db, "promptLibrary");
    return onSnapshot(
      query(itemsRef),
      (snapshot) => {
        const nextItems = normalizePromptLibraryItems(
          snapshot.docs.map((item) => ({ id: item.id, ...item.data() })),
        );
        setItems(nextItems);
        setSelectedId((currentSelectedId) => {
          const nextSelected =
            nextItems.find((item) => item.id === currentSelectedId) ?? nextItems[0];
          if (nextSelected) {
            setDraft((currentDraft) =>
              currentDraft.id === nextSelected.id
                ? nextSelected
                : nextItems.find((item) => item.id === currentDraft.id) ?? nextSelected,
            );
            return nextSelected.id;
          }

          setDraft(createPromptLibraryItem());
          return null;
        });
        setError(null);
        setIsLoading(false);
      },
      (snapshotError) => {
        setError(snapshotError.message);
        setIsLoading(false);
      },
    );
  }, []);

  function selectItem(itemId: string | null) {
    const found = items.find((item) => item.id === itemId);
    if (!found) {
      const blank = createPromptLibraryItem();
      setSelectedId(blank.id);
      setDraft(blank);
      return;
    }
    setSelectedId(found.id);
    setDraft(found);
  }

  function createNewItem() {
    const blank = createPromptLibraryItem();
    setSelectedId(blank.id);
    setDraft(blank);
    return blank;
  }

  async function saveItem(nextDraft = draft) {
    const { db } = getFirebaseServices();
    if (!db || !userId) {
      throw new Error("Sign in to save the prompt library to Firestore.");
    }

    const now = new Date().toISOString();
    const itemToSave = {
      ...nextDraft,
      updatedAt: now,
      createdAt: nextDraft.createdAt || now,
    };
    await setDoc(doc(db, "promptLibrary", itemToSave.id), itemToSave);
    setItems((current) => {
      const existingIndex = current.findIndex((item) => item.id === itemToSave.id);
      const nextItems =
        existingIndex >= 0
          ? current.map((item) => (item.id === itemToSave.id ? itemToSave : item))
          : [itemToSave, ...current];
      return normalizePromptLibraryItems(nextItems);
    });
    setSelectedId(itemToSave.id);
    setDraft(itemToSave);
    return itemToSave;
  }

  async function deleteItem(itemId = selectedId) {
    if (!itemId) {
      return null;
    }
    const { db } = getFirebaseServices();
    if (!db || !userId) {
      throw new Error("Sign in to delete prompt library items from Firestore.");
    }

    const existing = items.find((item) => item.id === itemId);
    if (!existing) {
      createNewItem();
      return null;
    }

    await deleteDoc(doc(db, "promptLibrary", itemId));
    const nextItems = items.filter((item) => item.id !== itemId);
    setItems(nextItems);
    const nextSelected = nextItems[0] ?? createPromptLibraryItem();
    setSelectedId(nextItems[0]?.id ?? null);
    setDraft(nextSelected);
    return existing;
  }

  return {
    createNewItem,
    deleteItem,
    draft,
    error,
    isLoading,
    items,
    saveItem,
    selectedId,
    selectItem,
    setDraft,
  };
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
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
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
    const source = showFavoritesOnly
      ? templates.filter((item) => item.favorite)
      : templates;
    if (!query) {
      return source;
    }
    return source.filter((item) =>
      `${item.name} ${item.subject} ${item.body}`.toLowerCase().includes(query),
    );
  }, [searchQuery, showFavoritesOnly, templates]);

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

  async function toggleFavorite(template: BasicTemplate) {
    const { db } = getFirebaseServices();
    if (!db || !userId) {
      throw new Error("Sign in to update favorites in Firestore.");
    }

    const nextTemplate = { ...template, favorite: !template.favorite };
    await setDoc(doc(db, collectionName, nextTemplate.id), {
      ...nextTemplate,
      updatedAt: serverTimestamp(),
    });
    setTemplates((current) =>
      current.map((item) => (item.id === nextTemplate.id ? nextTemplate : item)),
    );
    if (draft.id === nextTemplate.id) {
      setDraft(nextTemplate);
    }
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
    setShowFavoritesOnly,
    setSearchQuery,
    setVariableValues,
    showFavoritesOnly,
    templates,
    toggleFavorite,
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
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
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
    () => extractVariableNames([draft.prompt, draft.sampleInputTemplate, draft.sampleOutput]),
    [draft.prompt, draft.sampleInputTemplate, draft.sampleOutput],
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
    const source = showFavoritesOnly
      ? templates.filter((item) => item.favorite)
      : templates;
    if (!query) {
      return source;
    }
    return source.filter((item) =>
      `${item.title} ${item.categories} ${item.prompt} ${item.sampleInputTemplate} ${item.sampleOutput}`
        .toLowerCase()
        .includes(query),
    );
  }, [searchQuery, showFavoritesOnly, templates]);

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

  async function toggleFavorite(template: PromptTemplate) {
    const { db } = getFirebaseServices();
    if (!db || !userId) {
      throw new Error("Sign in to update favorites in Firestore.");
    }

    const nextTemplate = { ...template, favorite: !template.favorite };
    await setDoc(doc(db, collectionName, nextTemplate.id), {
      ...nextTemplate,
      updatedAt: serverTimestamp(),
    });
    setTemplates((current) =>
      current.map((item) => (item.id === nextTemplate.id ? nextTemplate : item)),
    );
    if (draft.id === nextTemplate.id) {
      setDraft(nextTemplate);
    }
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
    renderedSampleOutput: applyVariables(draft.sampleOutput, variableValues),
    saveTemplate,
    searchQuery,
    selectedId,
    setDraft,
    setShowFavoritesOnly,
    setSearchQuery,
    setVariableValues,
    showFavoritesOnly,
    templates,
    toggleFavorite,
    variableValues,
    variables,
    selectTemplate,
  };
}
