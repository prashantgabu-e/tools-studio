import { useEffect, useMemo, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import dmTemplatesJson from "../dm-templates.json";
import emailTemplatesJson from "../email-templates.json";
import genAiPromptTemplatesJson from "../gen-ai-prompt-templates.json";
import promptTemplatesJson from "../prompt-templates.json";
import {
  BasicTemplateView,
  PromptTemplateView,
  Sidebar,
  TextToolsView,
  ToastStack,
  Topbar,
} from "./components";
import { useBasicTemplateManager, usePromptTemplateManager, useToasts } from "./hooks";
import type { RouteView } from "./types";
import { countCharacters, countWords } from "./utils";

type RouteMeta = {
  id: RouteView;
  label: string;
  title: string;
  path: string;
};

const routeMeta: RouteMeta[] = [
  { id: "text-tools", label: "Text Tools", title: "Transform text", path: "/" },
  {
    id: "template-tools",
    label: "Email Templates",
    title: "Manage email templates",
    path: "/email-templates",
  },
  {
    id: "dm-template-tools",
    label: "DM Templates",
    title: "Manage direct message templates",
    path: "/dm-templates",
  },
  {
    id: "prompt-template-tools",
    label: "Prompt Templates",
    title: "Manage prompt templates",
    path: "/prompt-templates",
  },
  {
    id: "gen-ai-prompt-template-tools",
    label: "Gen AI Prompt Templates",
    title: "Manage Gen AI prompt templates",
    path: "/gen-ai-prompts",
  },
];

export function App() {
  const location = useLocation();
  const [sourceText, setSourceText] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { pushToast, toasts } = useToasts();

  const emailManager = useBasicTemplateManager({
    blankName: "Untitled Email Template",
    hasSubject: true,
    initialItems: emailTemplatesJson,
    storageKey: "text-studio-email-templates-v1",
  });
  const dmManager = useBasicTemplateManager({
    blankName: "Untitled DM Template",
    hasSubject: false,
    initialItems: dmTemplatesJson,
    storageKey: "text-studio-dm-templates-v1",
  });
  const promptManager = usePromptTemplateManager({
    blankTitle: "Untitled Prompt Template",
    initialItems: promptTemplatesJson,
    storageKey: "text-studio-prompt-templates-v1",
  });
  const genAiPromptManager = usePromptTemplateManager({
    blankTitle: "Untitled Gen AI Prompt Template",
    initialItems: genAiPromptTemplatesJson,
    storageKey: "text-studio-gen-ai-prompt-templates-v1",
  });

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 820) {
        setSidebarCollapsed(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const activeRoute = useMemo(() => {
    return (
      routeMeta.find((item) =>
        item.path === "/"
          ? location.pathname === "/"
          : location.pathname.startsWith(item.path),
      ) ?? routeMeta[0]
    );
  }, [location.pathname]);

  const topbarMeta = useMemo(() => {
    if (activeRoute.id === "text-tools") {
      return `${countCharacters(sourceText)} characters • ${countWords(sourceText)} words`;
    }
    if (activeRoute.id === "template-tools") {
      return `${emailManager.templates.length} email templates stored`;
    }
    if (activeRoute.id === "dm-template-tools") {
      return `${dmManager.templates.length} dm templates stored`;
    }
    if (activeRoute.id === "prompt-template-tools") {
      return `${promptManager.templates.length} prompt templates stored`;
    }
    return `${genAiPromptManager.templates.length} gen ai prompt templates stored`;
  }, [
    activeRoute.id,
    dmManager.templates.length,
    emailManager.templates.length,
    genAiPromptManager.templates.length,
    promptManager.templates.length,
    sourceText,
  ]);

  function toggleSidebar() {
    if (window.innerWidth <= 820) {
      return;
    }
    setSidebarCollapsed((current) => !current);
  }

  return (
    <div className="page-shell">
      <Sidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} />

      <main className="workspace">
        <Topbar label={activeRoute.label} title={activeRoute.title} meta={topbarMeta} />

        <Routes>
          <Route
            path="/"
            element={
              <TextToolsView
                sourceText={sourceText}
                onChange={setSourceText}
                onClear={() => setSourceText("")}
              />
            }
          />
          <Route
            path="/email-templates"
            element={
              <BasicTemplateView
                blankName="Welcome Email"
                bodyLabel="Body"
                copyBodyLabel="Copy Body"
                copySubjectLabel="Copy Subject"
                emptySearchMessage="No templates match your search."
                hasSubject
                importFileName="email-templates.json"
                listHeading="Templates"
                manager={emailManager}
                onToast={pushToast}
                searchPlaceholder="Search templates..."
                sectionLabel="Email Templates"
              />
            }
          />
          <Route
            path="/dm-templates"
            element={
              <BasicTemplateView
                blankName="Intro DM"
                bodyLabel="Message"
                emptySearchMessage="No templates match your search."
                hasSubject={false}
                importFileName="dm-templates.json"
                listHeading="Templates"
                manager={dmManager}
                onToast={pushToast}
                searchPlaceholder="Search templates..."
                sectionLabel="DM Templates"
              />
            }
          />
          <Route
            path="/prompt-templates"
            element={
              <PromptTemplateView
                blankTitle="Cold Outreach Prompt"
                importFileName="prompt-templates.json"
                manager={promptManager}
                onToast={pushToast}
                sectionLabel="Prompt Templates"
              />
            }
          />
          <Route
            path="/gen-ai-prompts"
            element={
              <PromptTemplateView
                blankTitle="Cold Outreach Prompt"
                importFileName="gen-ai-prompt-templates.json"
                manager={genAiPromptManager}
                onToast={pushToast}
                sectionLabel="Gen AI Prompt Templates"
              />
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <ToastStack items={toasts} />
    </div>
  );
}
