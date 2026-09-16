export type BasicTemplate = {
  favorite: boolean;
  id: string;
  iconName: string;
  iconTone: string;
  name: string;
  subject: string;
  body: string;
};

export type PromptTemplate = {
  favorite: boolean;
  id: string;
  title: string;
  categories: string;
  prompt: string;
  sampleInputTemplate: string;
  sampleOutput: string;
};

export type PromptLibraryImage = {
  id: string;
  dataUrl: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  width: number;
  height: number;
  createdAt: string;
};

export type PromptLibraryItem = {
  id: string;
  outputType: "image" | "video";
  promptText: string;
  tags: string[];
  images: PromptLibraryImage[];
  createdAt: string;
  updatedAt: string;
};

export type PromptBuilderCategory = string;

export type PromptBuilderCategoryMeta = {
  id: PromptBuilderCategory;
  label: string;
  shortLabel: string;
};

export type PromptBuilderUseFor = "image" | "video" | "both";

export type PromptIngredient = {
  favorite: boolean;
  id: string;
  tags: string[];
  text: string;
  title: string;
  useFor: PromptBuilderUseFor;
};

export type PromptBuilderLibrary = Record<string, PromptIngredient[]>;

export type ToastTone = "success" | "warning";

export type ToastItem = {
  id: string;
  message: string;
  tone: ToastTone;
};

export type RouteView =
  | "text-tools"
  | "template-tools"
  | "dm-template-tools"
  | "prompt-library-tools"
  | "prompt-template-tools"
  | "gen-ai-prompt-template-tools"
  | "prompt-builder-tools";
