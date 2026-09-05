export type BasicTemplate = {
  id: string;
  name: string;
  subject: string;
  body: string;
};

export type PromptTemplate = {
  id: string;
  title: string;
  categories: string;
  prompt: string;
  sampleInputTemplate: string;
  sampleOutput: string;
};

export type PromptBuilderCategory =
  | "lighting"
  | "poses"
  | "shots"
  | "compositions"
  | "cameras"
  | "lenses"
  | "styles"
  | "moods"
  | "colors"
  | "environments"
  | "subjects"
  | "wardrobeProps"
  | "motion"
  | "videoMoves"
  | "rendering"
  | "negativePrompts"
  | "platformPresets"
  | "formulas";

export type PromptBuilderUseFor = "image" | "video" | "both";

export type PromptIngredient = {
  favorite: boolean;
  id: string;
  tags: string[];
  text: string;
  title: string;
  useFor: PromptBuilderUseFor;
};

export type PromptBuilderLibrary = Record<PromptBuilderCategory, PromptIngredient[]>;

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
  | "prompt-template-tools"
  | "gen-ai-prompt-template-tools"
  | "prompt-builder-tools";
