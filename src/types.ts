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
  | "gen-ai-prompt-template-tools";
