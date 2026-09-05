import { useEffect, useMemo, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import dmTemplatesJson from "../dm-templates.json";
import emailTemplatesJson from "../email-templates.json";
import genAiPromptTemplatesJson from "../gen-ai-prompt-templates.json";
import promptBuilderLibraryJson from "../prompt-builder-library.json";
import promptTemplatesJson from "../prompt-templates.json";
import {
  AuthPanel,
  BasicTemplateView,
  BottomNavigation,
  PromptBuilderView,
  PromptTemplateView,
  Sidebar,
  TextToolsView,
  ToastStack,
  Topbar,
} from "./components";
import { useFirebaseAuth } from "./firebase";
import {
  useBasicTemplateManager,
  usePromptBuilderManager,
  usePromptTemplateManager,
  useToasts,
} from "./hooks";
import type { RouteView } from "./types";
import { countCharacters, countWords } from "./utils";

type RouteMeta = {
  id: RouteView;
  label: string;
  title: string;
  path: string;
};

const routeMeta: RouteMeta[] = [
  { id: "text-tools", label: "Text", title: "Transform", path: "/" },
  {
    id: "template-tools",
    label: "Emails",
    title: "Email templates",
    path: "/email-templates",
  },
  {
    id: "dm-template-tools",
    label: "DMs",
    title: "DM templates",
    path: "/dm-templates",
  },
  {
    id: "prompt-template-tools",
    label: "Prompts",
    title: "Prompt templates",
    path: "/prompt-templates",
  },
  {
    id: "gen-ai-prompt-template-tools",
    label: "Gen AI",
    title: "AI prompts",
    path: "/gen-ai-prompts",
  },
  {
    id: "prompt-builder-tools",
    label: "Builder",
    title: "Prompt kit",
    path: "/prompt-builder",
  },
];

export function App() {
  const location = useLocation();
  const [sourceText, setSourceText] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { pushToast, toasts } = useToasts();
  const authState = useFirebaseAuth();
  const userId = authState.user?.uid ?? null;

  const emailManager = useBasicTemplateManager({
    blankName: "Untitled Email Template",
    collectionName: "emailTemplates",
    hasSubject: true,
    initialItems: emailTemplatesJson,
    userId,
  });
  const dmManager = useBasicTemplateManager({
    blankName: "Untitled DM Template",
    collectionName: "dmTemplates",
    hasSubject: false,
    initialItems: dmTemplatesJson,
    userId,
  });
  const promptManager = usePromptTemplateManager({
    blankTitle: "Untitled Prompt Template",
    collectionName: "promptTemplates",
    initialItems: promptTemplatesJson,
    userId,
  });
  const genAiPromptManager = usePromptTemplateManager({
    blankTitle: "Untitled Gen AI Prompt Template",
    collectionName: "genAiPromptTemplates",
    initialItems: genAiPromptTemplatesJson,
    userId,
  });
  const promptBuilderManager = usePromptBuilderManager({
    initialLibrary: promptBuilderLibraryJson,
    userId,
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
    if (activeRoute.id === "gen-ai-prompt-template-tools") {
      return `${genAiPromptManager.templates.length} gen ai prompt templates stored`;
    }
    return `${promptBuilderManager.totalItems} builder items`;
  }, [
    activeRoute.id,
    dmManager.templates.length,
    emailManager.templates.length,
    genAiPromptManager.templates.length,
    promptBuilderManager.totalItems,
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
        <Topbar label={activeRoute.label} title={activeRoute.title} meta={topbarMeta}>
          <AuthPanel
            authError={authState.authError}
            email={authState.user?.email}
            isConfigured={authState.isFirebaseConfigured}
            isLoading={authState.isAuthLoading}
            onSignIn={authState.signIn}
            onSignOut={authState.signOut}
          />
        </Topbar>

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
          <Route
            path="/prompt-builder"
            element={
              <PromptBuilderView manager={promptBuilderManager} onToast={pushToast} />
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <ToastStack items={toasts} />
      <BottomNavigation />
    </div>
  );
}
