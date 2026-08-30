import type { BasicTemplate, PromptTemplate } from "./types";

export const placeholderText = "Your transformed text will appear here.";

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
      id: value.id || `template-${index + 1}-${Date.now()}`,
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
      id: value.id || `prompt-${index + 1}-${Date.now()}`,
      title: value.title || blankTitle,
      categories: value.categories || "",
      prompt: value.prompt || "",
      sampleInputTemplate: value.sampleInputTemplate || "",
      sampleOutput: value.sampleOutput || "",
    };
  });
}

export function createBasicTemplate(blankName: string): BasicTemplate {
  return {
    id: `template-${crypto.randomUUID ? crypto.randomUUID() : Date.now()}`,
    name: blankName,
    subject: "",
    body: "",
  };
}

export function createPromptTemplate(blankTitle: string): PromptTemplate {
  return {
    id: `prompt-${crypto.randomUUID ? crypto.randomUUID() : Date.now()}`,
    title: blankTitle,
    categories: "",
    prompt: "",
    sampleInputTemplate: "",
    sampleOutput: "",
  };
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
