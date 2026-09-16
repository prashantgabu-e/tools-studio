import type {
  BasicTemplate,
  PromptBuilderCategory,
  PromptBuilderCategoryMeta,
  PromptBuilderLibrary,
  PromptBuilderUseFor,
  PromptIngredient,
  PromptLibraryImage,
  PromptLibraryItem,
  PromptTemplate,
} from "./types";

export const placeholderText = "Your transformed text will appear here.";
export const promptLibraryMaxImages = 3;
export const promptLibraryMaxImageBytes = 120 * 1024;
export const promptLibraryMaxImageEdge = 720;

export const transforms = [
  {
    key: "uppercase",
    label: "Style",
    title: "Uppercase",
    transform: (text: string) => text.toUpperCase(),
  },
  {
    key: "lowercase",
    label: "Style",
    title: "Lowercase",
    transform: (text: string) => text.toLowerCase(),
  },
  {
    key: "titlecase",
    label: "Format",
    title: "Title Case",
    transform: (text: string) =>
      text.toLowerCase().replace(/\b([a-z])/g, (match) => match.toUpperCase()),
  },
  {
    key: "sentencecase",
    label: "Format",
    title: "Sentence case",
    transform: (text: string) => toSentenceCase(text),
  },
  {
    key: "capitalized",
    label: "Format",
    title: "Capitalize Words",
    transform: (text: string) =>
      text.replace(/\b(\p{L})(\p{L}*)/gu, (_, first, rest) => {
        return first.toUpperCase() + rest.toLowerCase();
      }),
  },
  {
    key: "trimmed",
    label: "Cleanup",
    title: "Trim Extra Spaces",
    transform: (text: string) => text.replace(/\s+/g, " ").trim(),
  },
  {
    key: "reversed",
    label: "Creative",
    title: "Reversed Text",
    transform: (text: string) => [...text].reverse().join(""),
  },
  {
    key: "slug",
    label: "Web",
    title: "Slug",
    transform: (text: string) =>
      text
        .toLowerCase()
        .trim()
        .replace(/[^\p{L}\p{N}]+/gu, "-")
        .replace(/^-+|-+$/g, ""),
  },
] as const;

export function countCharacters(text: string) {
  return [...text].length;
}

export function countWords(text: string) {
  const words = text.trim().match(/\S+/g);
  return words ? words.length : 0;
}

export function toSentenceCase(text: string) {
  return text
    .toLowerCase()
    .replace(/(^\s*\p{L}|[.!?]\s+\p{L})/gu, (match) => match.toUpperCase());
}

export function applyVariables(text: string, values: Record<string, string>) {
  return text.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_, key) => {
    const trimmed = String(key).trim();
    return values[trimmed] ?? `{{${trimmed}}}`;
  });
}

export function extractVariableNames(parts: string[]) {
  const matches = parts.join("\n").match(/\{\{\s*([^}]+?)\s*\}\}/g) || [];
  return [...new Set(matches.map((token) => token.replace(/[{}]/g, "").trim()))];
}

export function normalizeBasicTemplates(
  items: unknown[],
  blankName: string,
  hasSubject: boolean,
) {
  return items.map((item, index) => {
    const value = (item ?? {}) as Partial<BasicTemplate>;
    return {
      favorite: Boolean(value.favorite),
      id: value.id || `template-${index + 1}-${Date.now()}`,
      iconName: value.iconName || "message",
      iconTone: value.iconTone || "teal",
      name: value.name || blankName,
      subject: hasSubject ? value.subject || "" : "",
      body: value.body || "",
    };
  });
}

export function normalizePromptTemplates(items: unknown[], blankTitle: string) {
  return items.map((item, index) => {
    const value = (item ?? {}) as Partial<PromptTemplate>;
    return {
      favorite: Boolean(value.favorite),
      id: value.id || `prompt-${index + 1}-${Date.now()}`,
      title: value.title || blankTitle,
      categories: value.categories || "",
      prompt: value.prompt || "",
      sampleInputTemplate: value.sampleInputTemplate || "",
      sampleOutput: value.sampleOutput || "",
    };
  });
}

export function normalizePromptLibraryItems(items: unknown[]) {
  return items
    .map((item, index) => normalizePromptLibraryItem(item, index))
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export function createBasicTemplate(blankName: string): BasicTemplate {
  return {
    favorite: false,
    id: `template-${crypto.randomUUID ? crypto.randomUUID() : Date.now()}`,
    iconName: "message",
    iconTone: "teal",
    name: blankName,
    subject: "",
    body: "",
  };
}

export function createPromptLibraryItem(): PromptLibraryItem {
  const now = new Date().toISOString();
  return {
    id: `library-${crypto.randomUUID ? crypto.randomUUID() : Date.now()}`,
    outputType: "image",
    promptText: "",
    tags: [],
    images: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function createPromptTemplate(blankTitle: string): PromptTemplate {
  return {
    favorite: false,
    id: `prompt-${crypto.randomUUID ? crypto.randomUUID() : Date.now()}`,
    title: blankTitle,
    categories: "",
    prompt: "",
    sampleInputTemplate: "",
    sampleOutput: "",
  };
}

export const promptBuilderCategories: PromptBuilderCategoryMeta[] = [
  { id: "lighting", label: "Lighting", shortLabel: "Light" },
  { id: "poses", label: "Poses", shortLabel: "Pose" },
  { id: "shots", label: "Shots", shortLabel: "Shot" },
  { id: "compositions", label: "Compositions", shortLabel: "Comp" },
  { id: "cameras", label: "Camera", shortLabel: "Cam" },
  { id: "lenses", label: "Lenses", shortLabel: "Lens" },
  { id: "styles", label: "Styles", shortLabel: "Style" },
  { id: "moods", label: "Moods", shortLabel: "Mood" },
  { id: "colors", label: "Colors", shortLabel: "Color" },
  { id: "environments", label: "Environments", shortLabel: "Env" },
  { id: "subjects", label: "Subjects", shortLabel: "Subj" },
  { id: "wardrobeProps", label: "Wardrobe / Props", shortLabel: "Props" },
  { id: "motion", label: "Motion", shortLabel: "Motion" },
  { id: "videoMoves", label: "Video Moves", shortLabel: "Moves" },
  { id: "rendering", label: "Rendering", shortLabel: "Render" },
  { id: "negativePrompts", label: "Negative", shortLabel: "Neg" },
  { id: "platformPresets", label: "Presets", shortLabel: "Preset" },
  { id: "formulas", label: "Formulas", shortLabel: "Formula" },
];

export function createPromptBuilderCategory(
  label = "Untitled Category",
  existingCategories: PromptBuilderCategoryMeta[] = promptBuilderCategories,
): PromptBuilderCategoryMeta {
  const trimmedLabel = label.trim() || "Untitled Category";
  const baseId = slugifyCategoryId(trimmedLabel);
  const existingIds = new Set(existingCategories.map((category) => category.id));
  let id = baseId;
  let suffix = 2;
  while (existingIds.has(id)) {
    id = `${baseId}-${suffix}`;
    suffix += 1;
  }

  return {
    id,
    label: trimmedLabel,
    shortLabel: createShortCategoryLabel(trimmedLabel),
  };
}

export function createEmptyPromptBuilderLibrary(
  categories: PromptBuilderCategoryMeta[] = promptBuilderCategories,
): PromptBuilderLibrary {
  return categories.reduce((library, category) => {
    library[category.id] = [];
    return library;
  }, {} as PromptBuilderLibrary);
}

export function createPromptIngredient(title = "Untitled Ingredient"): PromptIngredient {
  return {
    favorite: false,
    id: `ingredient-${crypto.randomUUID ? crypto.randomUUID() : Date.now()}`,
    tags: [],
    text: "",
    title,
    useFor: "both",
  };
}

export function normalizePromptBuilderCategories(value: unknown): PromptBuilderCategoryMeta[] {
  const source = (value ?? {}) as { categories?: unknown };
  if (!Array.isArray(source.categories)) {
    return promptBuilderCategories;
  }

  const seen = new Set<string>();
  const categories = source.categories
    .map((item, index) => normalizePromptBuilderCategory(item, index))
    .filter((category) => {
      if (!category.id || seen.has(category.id)) {
        return false;
      }
      seen.add(category.id);
      return true;
    });

  return categories.length ? categories : promptBuilderCategories;
}

export function normalizePromptBuilderLibrary(
  value: unknown,
  categories = normalizePromptBuilderCategories(value),
): PromptBuilderLibrary {
  const source = (value ?? {}) as Partial<Record<string, unknown>> & { library?: unknown };
  const itemSource =
    source.library && typeof source.library === "object"
      ? (source.library as Partial<Record<string, unknown>>)
      : source;
  const library = createEmptyPromptBuilderLibrary(categories);

  categories.forEach((category) => {
    const items = itemSource[category.id];
    library[category.id] = Array.isArray(items)
      ? items.map((item, index) => normalizePromptIngredient(item, category.id, index))
      : [];
  });

  return library;
}

export function mergePromptBuilderLibraries(
  current: PromptBuilderLibrary,
  incoming: PromptBuilderLibrary,
  categories: PromptBuilderCategoryMeta[] = promptBuilderCategories,
): PromptBuilderLibrary {
  const next = createEmptyPromptBuilderLibrary(categories);

  categories.forEach((category) => {
    const byId = new Map<string, PromptIngredient>();
    (current[category.id] ?? []).forEach((item) => byId.set(item.id, item));
    (incoming[category.id] ?? []).forEach((item) => byId.set(item.id, item));
    next[category.id] = [...byId.values()];
  });

  return next;
}

function normalizePromptBuilderCategory(item: unknown, index: number): PromptBuilderCategoryMeta {
  const value = (item ?? {}) as Partial<PromptBuilderCategoryMeta>;
  const fallback = promptBuilderCategories[index];
  const label = value.label || fallback?.label || "Untitled Category";
  return {
    id: value.id || slugifyCategoryId(label),
    label,
    shortLabel: value.shortLabel || createShortCategoryLabel(label),
  };
}

function slugifyCategoryId(value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || `category-${Date.now()}`;
}

function createShortCategoryLabel(value: string) {
  const words = value.trim().split(/\s+/).filter(Boolean);
  if (!words.length) {
    return "Cat";
  }
  if (words.length === 1) {
    return words[0].slice(0, 8);
  }
  return words.map((word) => word[0]).join("").slice(0, 8).toUpperCase();
}

function normalizePromptIngredient(
  item: unknown,
  category: PromptBuilderCategory,
  index: number,
): PromptIngredient {
  const value = (item ?? {}) as Partial<PromptIngredient> & { tags?: unknown };
  return {
    favorite: Boolean(value.favorite),
    id: value.id || `${category}-${index + 1}-${Date.now()}`,
    tags: Array.isArray(value.tags)
      ? value.tags.map(String).filter(Boolean)
      : String(value.tags || "")
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
    text: value.text || "",
    title: value.title || "Untitled Ingredient",
    useFor: normalizeUseFor(value.useFor),
  };
}

function normalizeUseFor(value: unknown): PromptBuilderUseFor {
  if (value === "image" || value === "video" || value === "both") {
    return value;
  }
  return "both";
}

export function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function downloadDataUrl(filename: string, dataUrl: string) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename || "prompt-output.webp";
  link.click();
}

export async function compressPromptLibraryImage(file: File): Promise<PromptLibraryImage> {
  if (!file.type.startsWith("image/")) {
    throw new Error(`${file.name} is not an image file.`);
  }

  const bitmap = await loadImageBitmap(file);
  const scale = Math.min(1, promptLibraryMaxImageEdge / Math.max(bitmap.width, bitmap.height));
  let width = Math.max(1, Math.round(bitmap.width * scale));
  let height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Image compression is not available in this browser.");
  }

  let quality = 0.56;
  let dataUrl = "";
  let sizeBytes = Number.POSITIVE_INFINITY;

  for (let attempt = 0; attempt < 12; attempt += 1) {
    canvas.width = width;
    canvas.height = height;
    context.clearRect(0, 0, width, height);
    context.drawImage(bitmap, 0, 0, width, height);
    dataUrl = canvas.toDataURL("image/webp", quality);
    sizeBytes = estimateDataUrlStorageBytes(dataUrl);
    if (sizeBytes <= promptLibraryMaxImageBytes) {
      break;
    }
    if (quality > 0.28) {
      quality -= 0.07;
    } else {
      width = Math.max(96, Math.round(width * 0.78));
      height = Math.max(96, Math.round(height * 0.78));
    }
  }

  if (sizeBytes > promptLibraryMaxImageBytes) {
    throw new Error(
      `${file.name} could not be compressed below ${formatBytes(promptLibraryMaxImageBytes)}.`,
    );
  }

  const now = new Date().toISOString();
  return {
    id: `image-${crypto.randomUUID ? crypto.randomUUID() : Date.now()}`,
    dataUrl,
    fileName: toWebpFileName(file.name),
    mimeType: "image/webp",
    sizeBytes,
    width,
    height,
    createdAt: now,
  };
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function parseTags(value: string) {
  return [
    ...new Set(
      value
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    ),
  ];
}

function normalizePromptLibraryItem(item: unknown, index: number): PromptLibraryItem {
  const value = (item ?? {}) as Partial<PromptLibraryItem> & {
    images?: unknown;
    tags?: unknown;
  };
  const now = new Date().toISOString();
  return {
    id: value.id || `library-${index + 1}-${Date.now()}`,
    outputType: normalizePromptLibraryOutputType(value.outputType),
    promptText: value.promptText || "",
    tags: normalizeTags(value.tags),
    images: Array.isArray(value.images)
      ? value.images.slice(0, promptLibraryMaxImages).map(normalizePromptLibraryImage)
      : [],
    createdAt: value.createdAt || now,
    updatedAt: value.updatedAt || value.createdAt || now,
  };
}

function normalizeTags(value: unknown) {
  if (Array.isArray(value)) {
    return [...new Set(value.map(String).map((tag) => tag.trim()).filter(Boolean))];
  }
  return parseTags(String(value || ""));
}

function normalizePromptLibraryOutputType(value: unknown): PromptLibraryItem["outputType"] {
  return value === "video" ? "video" : "image";
}

function normalizePromptLibraryImage(item: unknown): PromptLibraryImage {
  const value = (item ?? {}) as Partial<PromptLibraryImage>;
  const now = new Date().toISOString();
  return {
    id: value.id || `image-${crypto.randomUUID ? crypto.randomUUID() : Date.now()}`,
    dataUrl: value.dataUrl || "",
    fileName: value.fileName || "prompt-output.webp",
    mimeType: value.mimeType || "image/webp",
    sizeBytes: Number(value.sizeBytes || estimateDataUrlStorageBytes(value.dataUrl || "")),
    width: Number(value.width || 0),
    height: Number(value.height || 0),
    createdAt: value.createdAt || now,
  };
}

function estimateDataUrlStorageBytes(dataUrl: string) {
  return new Blob([dataUrl]).size;
}

function toWebpFileName(fileName: string) {
  const cleanName = fileName.trim() || "prompt-output";
  return cleanName.replace(/\.[^.]+$/, "") + ".webp";
}

async function loadImageBitmap(file: File) {
  if ("createImageBitmap" in window) {
    return createImageBitmap(file);
  }

  const url = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error(`Could not read ${file.name}.`));
      element.src = url;
    });
    return image;
  } finally {
    URL.revokeObjectURL(url);
  }
}
