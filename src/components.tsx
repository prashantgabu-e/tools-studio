import { useEffect, useRef, useState, type ChangeEvent, type ReactNode, type RefObject } from "react";
import { NavLink } from "react-router-dom";
import {
  BadgeCheck,
  Bell,
  Braces,
  CalendarDays,
  CheckCircle2,
  Copy,
  ClipboardPaste,
  CreditCard,
  Download,
  Eraser,
  FileInput,
  FileText,
  Gift,
  ImagePlus,
  Mail,
  Megaphone,
  Menu,
  MessageCircleMore,
  Package,
  PanelLeft,
  Pencil,
  Plus,
  Save,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  Trash2,
  Truck,
  Type,
  UserRound,
  WandSparkles,
} from "lucide-react";
import type {
  BasicTemplate,
  PromptBuilderCategory,
  PromptBuilderLibrary,
  PromptBuilderUseFor,
  PromptIngredient,
  PromptLibraryImage,
  PromptLibraryItem,
  PromptTemplate,
  ToastItem,
  ToastTone,
} from "./types";
import {
  compressPromptLibraryImage,
  downloadDataUrl,
  downloadJson,
  extractVariableNames,
  formatBytes,
  parseTags,
  placeholderText,
  promptLibraryMaxImages,
  transforms,
} from "./utils";

type NavItem = {
  label: string;
  to: string;
  icon: ReactNode;
};

const navigationItems: NavItem[] = [
  { label: "Prompt Builder", to: "/prompt-builder", icon: <Braces aria-hidden="true" /> },
  { label: "Prompt Library", to: "/prompt-library", icon: <ImagePlus aria-hidden="true" /> },
  { label: "Gen AI Templates", to: "/gen-ai-prompts", icon: <Sparkles aria-hidden="true" /> },
  { label: "Prompt Templates", to: "/prompt-templates", icon: <WandSparkles aria-hidden="true" /> },
  { label: "Messages", to: "/dm-templates", icon: <MessageCircleMore aria-hidden="true" /> },
  { label: "Emails", to: "/email-templates", icon: <Mail aria-hidden="true" /> },
  { label: "Text Transformation", to: "/text-tools", icon: <Type aria-hidden="true" /> },
];

const templateIconOptions = [
  { id: "message", label: "Message", icon: <MessageCircleMore aria-hidden="true" /> },
  { id: "mail", label: "Mail", icon: <Mail aria-hidden="true" /> },
  { id: "send", label: "Send", icon: <Send aria-hidden="true" /> },
  { id: "package", label: "Package", icon: <Package aria-hidden="true" /> },
  { id: "truck", label: "Delivery", icon: <Truck aria-hidden="true" /> },
  { id: "check", label: "Confirmed", icon: <CheckCircle2 aria-hidden="true" /> },
  { id: "bell", label: "Alert", icon: <Bell aria-hidden="true" /> },
  { id: "gift", label: "Offer", icon: <Gift aria-hidden="true" /> },
  { id: "calendar", label: "Schedule", icon: <CalendarDays aria-hidden="true" /> },
  { id: "payment", label: "Payment", icon: <CreditCard aria-hidden="true" /> },
  { id: "user", label: "Customer", icon: <UserRound aria-hidden="true" /> },
  { id: "promo", label: "Promo", icon: <Megaphone aria-hidden="true" /> },
  { id: "secure", label: "Verified", icon: <ShieldCheck aria-hidden="true" /> },
  { id: "file", label: "Document", icon: <FileText aria-hidden="true" /> },
  { id: "badge", label: "Status", icon: <BadgeCheck aria-hidden="true" /> },
];

const templateToneOptions = ["teal", "sky", "violet", "amber", "rose", "emerald", "slate"];

function getTemplateIcon(iconName: string) {
  return templateIconOptions.find((item) => item.id === iconName)?.icon ?? templateIconOptions[0].icon;
}

type BasicManagerShape = {
  createNewTemplate: () => void;
  deleteTemplate: () => Promise<BasicTemplate | null>;
  draft: BasicTemplate;
  error: string | null;
  filteredTemplates: BasicTemplate[];
  importTemplates: (items: unknown[]) => Promise<void>;
  isLoading: boolean;
  renderedBody: string;
  renderedSubject: string;
  saveTemplate: () => Promise<void>;
  searchQuery: string;
  selectedId: string | null;
  setDraft: React.Dispatch<React.SetStateAction<BasicTemplate>>;
  setShowFavoritesOnly: React.Dispatch<React.SetStateAction<boolean>>;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  setVariableValues: React.Dispatch<
    React.SetStateAction<Record<string, string>>
  >;
  showFavoritesOnly: boolean;
  templates: BasicTemplate[];
  toggleFavorite: (template: BasicTemplate) => Promise<void>;
  variableValues: Record<string, string>;
  variables: string[];
  selectTemplate: (id: string | null) => void;
};

type PromptManagerShape = {
  createNewTemplate: () => void;
  deleteTemplate: () => Promise<PromptTemplate | null>;
  draft: PromptTemplate;
  error: string | null;
  filteredTemplates: PromptTemplate[];
  importTemplates: (items: unknown[]) => Promise<void>;
  isLoading: boolean;
  renderedPrompt: string;
  renderedSampleInput: string;
  renderedSampleOutput: string;
  saveTemplate: () => Promise<void>;
  searchQuery: string;
  selectedId: string | null;
  setDraft: React.Dispatch<React.SetStateAction<PromptTemplate>>;
  setShowFavoritesOnly: React.Dispatch<React.SetStateAction<boolean>>;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  setVariableValues: React.Dispatch<
    React.SetStateAction<Record<string, string>>
  >;
  showFavoritesOnly: boolean;
  templates: PromptTemplate[];
  toggleFavorite: (template: PromptTemplate) => Promise<void>;
  variableValues: Record<string, string>;
  variables: string[];
  selectTemplate: (id: string | null) => void;
};

type PromptBuilderManagerShape = {
  appendToComposer: (text?: string) => void;
  categories: Array<{
    id: PromptBuilderCategory;
    label: string;
    shortLabel: string;
  }>;
  composerText: string;
  createNewIngredient: () => void;
  deleteIngredient: (ingredientId?: string | null) => Promise<PromptIngredient | null>;
  draft: PromptIngredient;
  error: string | null;
  filteredItems: PromptIngredient[];
  importLibrary: (items: unknown, mode: "merge" | "replace") => Promise<void>;
  isLoading: boolean;
  library: PromptBuilderLibrary;
  saveIngredient: () => Promise<void>;
  searchQuery: string;
  selectedCategory: PromptBuilderCategory;
  selectedId: string | null;
  selectCategory: (category: PromptBuilderCategory) => void;
  selectIngredient: (id: string | null) => void;
  setComposerText: React.Dispatch<React.SetStateAction<string>>;
  setDraft: React.Dispatch<React.SetStateAction<PromptIngredient>>;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  setShowFavoritesOnly: React.Dispatch<React.SetStateAction<boolean>>;
  showFavoritesOnly: boolean;
  toggleFavorite: (item: PromptIngredient) => Promise<void>;
  totalItems: number;
};

type PromptLibraryManagerShape = {
  createNewItem: () => void;
  deleteItem: (itemId?: string | null) => Promise<PromptLibraryItem | null>;
  draft: PromptLibraryItem;
  error: string | null;
  isLoading: boolean;
  items: PromptLibraryItem[];
  saveItem: (item?: PromptLibraryItem) => Promise<PromptLibraryItem>;
  selectedId: string | null;
  selectItem: (id: string | null) => void;
  setDraft: React.Dispatch<React.SetStateAction<PromptLibraryItem>>;
};

export function Sidebar(props: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <aside className={`sidebar${props.collapsed ? " is-collapsed" : ""}`}>
      <div className="sidebar-top">
        <div className="brand-block">
          <p className="app-kicker">AI Workspace</p>
          <h1 className="app-title">Prompt Studio</h1>
        </div>
        <button
          className="sidebar-toggle"
          type="button"
          onClick={props.onToggle}
          aria-expanded={!props.collapsed}
        >
          {props.collapsed ? <Menu aria-hidden="true" /> : <PanelLeft aria-hidden="true" />}
          <span className="button-text">{props.collapsed ? "Expand" : "Collapse"}</span>
        </button>
      </div>

      <nav className="menu-panel" aria-label="Main menu">
        <p className="menu-label">Menus</p>
        {navigationItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) => `menu-item${isActive ? " is-active" : ""}`}
          >
            {item.icon}
            <span className="button-text">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

export function BottomNavigation() {
  return (
    <nav className="bottom-navigation" aria-label="Mobile navigation">
      {navigationItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === "/"}
          className={({ isActive }) => `bottom-nav-item${isActive ? " is-active" : ""}`}
        >
          {item.icon}
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

export function Topbar(props: {
  children?: ReactNode;
  label: string;
  meta: string;
  title: string;
}) {
  return (
    <header className="topbar">
      <div>
        <p className="section-kicker">{props.label}</p>
        <h2>{props.title}</h2>
      </div>
      <div className="topbar-actions">
        <p className="meta-stat">{props.meta}</p>
        {props.children}
      </div>
    </header>
  );
}

export function AuthPanel(props: {
  authError: string | null;
  email?: string | null;
  isConfigured: boolean;
  isLoading: boolean;
  onSignIn: () => Promise<void>;
  onSignOut: () => Promise<void>;
}) {
  if (!props.isConfigured) {
    return (
      <div className="auth-panel is-warning">
        <span>Firebase env missing</span>
      </div>
    );
  }

  if (props.isLoading) {
    return (
      <div className="auth-panel">
        <span>Checking account...</span>
      </div>
    );
  }

  if (props.email) {
    return (
      <div className="auth-panel">
        <span>{props.email}</span>
        <button className="auth-link" type="button" onClick={props.onSignOut}>
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div className="auth-panel">
      <span>{props.authError ?? "Sign in"}</span>
      <button className="auth-link" type="button" onClick={props.onSignIn}>
        Google
      </button>
    </div>
  );
}

export function TextToolsView(props: {
  sourceText: string;
  onChange: (value: string) => void;
  onClear: () => void;
}) {
  return (
    <section className="view-panel">
      <section className="input-panel">
        <div className="section-heading">
          <h3>Input</h3>
          <button className="ghost-button" type="button" onClick={props.onClear}>
            <Eraser aria-hidden="true" />
            <span>Clear text</span>
          </button>
        </div>

        <label className="sr-only" htmlFor="sourceText">
          Source text
        </label>
        <textarea
          id="sourceText"
          className="text-input"
          placeholder="Type your text here and every transformation updates instantly..."
          spellCheck={false}
          value={props.sourceText}
          onChange={(event) => props.onChange(event.target.value)}
        />
      </section>

      <section className="output-panel">
        <div className="section-heading">
          <h3>Outputs</h3>
        </div>

        <div className="transform-grid">
          {transforms.map((item) => {
            const output = item.transform(props.sourceText);
            return (
              <article key={item.key} className="transform-card">
                <div className="card-header">
                  <div>
                    <p className="card-label">{item.label}</p>
                    <h3 className="card-title">{item.title}</h3>
                  </div>
                  <CopyButton text={output} />
                </div>
                <pre className={`card-output${output ? "" : " is-placeholder"}`}>
                  {output || placeholderText}
                </pre>
              </article>
            );
          })}
        </div>
      </section>
    </section>
  );
}

function CopyButton(props: {
  defaultLabel?: string;
  text: string;
  className?: string;
  icon?: ReactNode;
}) {
  const defaultLabel = props.defaultLabel ?? "Copy";
  const [label, setLabel] = useState(defaultLabel);

  async function handleClick() {
    if (!props.text) {
      setLabel("Empty");
      window.setTimeout(() => setLabel(defaultLabel), 1200);
      return;
    }

    try {
      await navigator.clipboard.writeText(props.text);
      setLabel("Copied");
    } catch {
      setLabel("Select text");
    }

    window.setTimeout(() => setLabel(defaultLabel), 1200);
  }

  return (
    <button className={props.className ?? "copy-button"} type="button" onClick={handleClick}>
      {props.icon ?? <Copy aria-hidden="true" />}
      <span>{label}</span>
    </button>
  );
}

function PasteButton(props: {
  onPaste: (text: string) => void;
  title?: string;
}) {
  async function handleClick() {
    try {
      const text = await navigator.clipboard.readText();
      props.onPaste(text);
    } catch {
      return;
    }
  }

  return (
    <button
      className="icon-action"
      type="button"
      title={props.title ?? "Paste"}
      aria-label={props.title ?? "Paste"}
      onClick={handleClick}
    >
      <ClipboardPaste aria-hidden="true" />
    </button>
  );
}

function WhatsAppIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
      <path
        fill="currentColor"
        d="M12.04 3.5a8.43 8.43 0 0 0-7.28 12.67l-.86 3.15 3.22-.84a8.45 8.45 0 1 0 4.92-14.98Zm0 1.5a6.95 6.95 0 1 1-3.74 12.8l-.27-.16-1.91.5.51-1.86-.18-.29A6.94 6.94 0 0 1 12.04 5Zm-2.68 3.63c-.15 0-.4.06-.61.29-.21.23-.8.78-.8 1.9s.82 2.21.93 2.36c.11.15 1.58 2.53 3.91 3.44 1.94.76 2.33.61 2.75.57.42-.04 1.36-.56 1.55-1.09.19-.54.19-1 .13-1.09-.06-.1-.21-.15-.44-.27-.23-.12-1.36-.67-1.57-.75-.21-.08-.36-.12-.51.12-.15.23-.59.75-.72.9-.13.15-.27.17-.5.06-.23-.12-.98-.36-1.86-1.15-.69-.61-1.15-1.37-1.29-1.6-.13-.23-.01-.36.1-.47.1-.1.23-.27.34-.4.12-.13.15-.23.23-.38.08-.15.04-.29-.02-.4-.06-.12-.51-1.24-.7-1.7-.18-.44-.37-.38-.51-.39h-.43Z"
      />
    </svg>
  );
}

function ShareToWhatsAppButton(props: { text: string }) {
  function handleClick() {
    const url = `https://wa.me/?text=${encodeURIComponent(props.text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <button
      className="icon-action whatsapp-action"
      type="button"
      title="Share to WhatsApp"
      aria-label="Share to WhatsApp"
      onClick={handleClick}
    >
      <WhatsAppIcon />
    </button>
  );
}

function OpenInGmailButton(props: { body: string; subject: string }) {
  function handleClick() {
    const params = new URLSearchParams({
      view: "cm",
      fs: "1",
      su: props.subject,
      body: props.body,
    });
    window.open(`https://mail.google.com/mail/?${params.toString()}`, "_blank", "noopener,noreferrer");
  }

  return (
    <button
      className="icon-action gmail-action"
      type="button"
      title="Open in Gmail"
      aria-label="Open in Gmail"
      onClick={handleClick}
    >
      <Mail aria-hidden="true" />
    </button>
  );
}

function ToolbarActionButton(props: {
  icon: ReactNode;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      className="ghost-button icon-only-button"
      type="button"
      aria-label={props.title}
      title={props.title}
      onClick={props.onClick}
    >
      {props.icon}
      <span className="sr-only">{props.title}</span>
    </button>
  );
}

export function BasicTemplateView(props: {
  blankName: string;
  bodyLabel: string;
  copyBodyLabel?: string;
  copySubjectLabel?: string;
  emptySearchMessage: string;
  hasSubject: boolean;
  importFileName: string;
  listHeading: string;
  manager: BasicManagerShape;
  onToast: (message: string, tone?: ToastTone) => void;
  searchPlaceholder: string;
  sectionLabel: string;
  shareBodyToGmail?: boolean;
  shareBodyToWhatsapp?: boolean;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const editorRef = useRef<HTMLElement | null>(null);
  const variablesRef = useRef<HTMLElement | null>(null);
  const previewRef = useRef<HTMLElement | null>(null);
  const scrollSpyPausedUntilRef = useRef(0);
  const [activeTemplateSection, setActiveTemplateSection] =
    useState<"editor" | "variables" | "preview">("variables");
  const [mobileTabsTop, setMobileTabsTop] = useState(74);
  const [isWhatsappNumberOpen, setIsWhatsappNumberOpen] = useState(false);
  const [whatsappPhoneNumber, setWhatsappPhoneNumber] = useState("+91 ");
  const hasAnyVariables = props.manager.variables.length > 0;

  useEffect(() => {
    function measureTabsTop() {
      const topbar = document.querySelector(".topbar");
      const bottom = topbar?.getBoundingClientRect().bottom ?? 66;
      setMobileTabsTop(Math.max(56, Math.ceil(bottom + 6)));
    }

    measureTabsTop();
    window.addEventListener("resize", measureTabsTop);
    const observer =
      "ResizeObserver" in window
        ? new ResizeObserver(measureTabsTop)
        : null;
    const topbar = document.querySelector(".topbar");
    if (topbar && observer) {
      observer.observe(topbar);
    }

    return () => {
      window.removeEventListener("resize", measureTabsTop);
      observer?.disconnect();
    };
  }, []);

  useEffect(() => {
    function handleScroll() {
      if (Date.now() < scrollSpyPausedUntilRef.current) {
        return;
      }
      const spyAnchor = mobileTabsTop + 44;
      const sections = [
        { id: "variables" as const, element: variablesRef.current },
        { id: "preview" as const, element: previewRef.current },
        { id: "editor" as const, element: editorRef.current },
      ].filter((item): item is { id: "editor" | "variables" | "preview"; element: HTMLElement } =>
        Boolean(item.element),
      );
      const current = sections
        .map((item) => ({
          id: item.id,
          distance: Math.abs(item.element.getBoundingClientRect().top - spyAnchor),
        }))
        .sort((left, right) => left.distance - right.distance)[0];
      if (current) {
        setActiveTemplateSection(current.id);
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [hasAnyVariables, mobileTabsTop, props.manager.selectedId]);

  async function handleDelete() {
    if (!props.manager.selectedId) {
      return;
    }
    const name =
      props.manager.templates.find((item) => item.id === props.manager.selectedId)?.name ??
      props.manager.draft.name;
    const confirmed = window.confirm(`Delete "${name}"? This cannot be undone.`);
    if (!confirmed) {
      return;
    }
    try {
      const deleted = await props.manager.deleteTemplate();
      if (deleted) {
        props.onToast(`${deleted.name} deleted`, "warning");
      }
    } catch (error) {
      props.onToast(error instanceof Error ? error.message : "Delete failed", "warning");
    }
  }

  async function handleSave() {
    try {
      await props.manager.saveTemplate();
      props.onToast(`${props.manager.draft.name || props.blankName} saved`, "success");
    } catch (error) {
      props.onToast(error instanceof Error ? error.message : "Save failed", "warning");
    }
  }

  function handleExport() {
    downloadJson(props.importFileName, props.manager.templates);
  }

  function handleToggleFavorite(item: BasicTemplate) {
    void props.manager
      .toggleFavorite(item)
      .catch((error: unknown) =>
        props.onToast(error instanceof Error ? error.message : "Favorite failed", "warning"),
      );
  }

  function scrollToSection(
    section: "editor" | "variables" | "preview",
    ref: RefObject<HTMLElement | null>,
  ) {
    setActiveTemplateSection(section);
    scrollSpyPausedUntilRef.current = Date.now() + 900;
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function handleOpenWhatsappNumberChat() {
    const phoneNumber = whatsappPhoneNumber.replace(/\D/g, "").replace(/^00/, "");
    if (phoneNumber.length < 8) {
      props.onToast("Paste a WhatsApp number first", "warning");
      return;
    }

    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
      props.manager.renderedBody,
    )}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function handlePasteWhatsappNumber(text: string) {
    const trimmed = text.trim();
    setWhatsappPhoneNumber(/^\+|^00/.test(trimmed) ? trimmed : `+91 ${trimmed}`);
  }

  function handleImportFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as unknown[];
        void props.manager
          .importTemplates(Array.isArray(parsed) ? parsed : [])
          .then(() => props.onToast(`${props.sectionLabel} imported to Firestore`, "success"))
          .catch((error: unknown) =>
            props.onToast(error instanceof Error ? error.message : "Import failed", "warning"),
          );
      } catch {
        props.onToast("Invalid JSON", "warning");
      }
      event.target.value = "";
    };
    reader.readAsText(file);
  }

  return (
    <section className="view-panel basic-template-view">
      <section className="template-layout">
        <section className="panel-card template-list-panel">
          <div className="section-heading">
            <h3>{props.listHeading}</h3>
            <button className="ghost-button" type="button" onClick={props.manager.createNewTemplate}>
              <Plus aria-hidden="true" />
              <span>New</span>
            </button>
          </div>

          <div className="template-toolbar">
            <button
              className={`ghost-button icon-only-button${props.manager.showFavoritesOnly ? " is-active" : ""}`}
              type="button"
              title="Show favorites only"
              aria-label="Show favorites only"
              onClick={() => props.manager.setShowFavoritesOnly((current) => !current)}
            >
              <Star aria-hidden="true" />
            </button>
            <ToolbarActionButton
              onClick={() => fileInputRef.current?.click()}
              icon={<FileInput aria-hidden="true" />}
              title="Import JSON"
            />
            <ToolbarActionButton
              onClick={handleExport}
              icon={<Download aria-hidden="true" />}
              title="Export JSON"
            />
          </div>

          <input
            className="compact-input"
            type="search"
            placeholder={props.searchPlaceholder}
            value={props.manager.searchQuery}
            onChange={(event) => props.manager.setSearchQuery(event.target.value)}
          />

          <div className="template-list">
            {props.manager.isLoading ? (
              <div className="empty-state">Loading templates...</div>
            ) : props.manager.error ? (
              <div className="empty-state is-error">{props.manager.error}</div>
            ) : props.manager.filteredTemplates.length ? (
              props.manager.filteredTemplates.map((item) => (
                <article
                  key={item.id}
                  className={`template-list-item${item.id === props.manager.selectedId ? " is-active" : ""}`}
                >
                  <button
                    className="template-list-main"
                    type="button"
                    onClick={() => props.manager.selectTemplate(item.id)}
                  >
                    <span className={`template-list-icon is-${item.iconTone}`}>
                      {getTemplateIcon(item.iconName)}
                    </span>
                    <span className="template-list-copy">
                      <p className="template-list-name">{item.name}</p>
                    </span>
                  </button>
                  <button
                    className={`icon-action template-favorite-action${item.favorite ? " is-active" : ""}`}
                    type="button"
                    title={item.favorite ? "Remove favorite" : "Add favorite"}
                    aria-label={item.favorite ? "Remove favorite" : "Add favorite"}
                    onClick={() => handleToggleFavorite(item)}
                  >
                    <Star aria-hidden="true" />
                  </button>
                </article>
              ))
            ) : (
              <div className="empty-state">{props.emptySearchMessage}</div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            hidden
            onChange={handleImportFile}
          />
        </section>

        <section className="panel-card template-work-panel">
          <div
            className="mobile-section-tabs"
            aria-label="Template sections"
            style={{ top: mobileTabsTop }}
          >
            <button
              className={activeTemplateSection === "variables" ? "is-active" : ""}
              type="button"
              onClick={() => scrollToSection("variables", variablesRef)}
            >
              Variables
            </button>
            <button
              className={activeTemplateSection === "preview" ? "is-active" : ""}
              type="button"
              onClick={() => scrollToSection("preview", previewRef)}
            >
              Preview
            </button>
            <button
              className={activeTemplateSection === "editor" ? "is-active" : ""}
              type="button"
              onClick={() => scrollToSection("editor", editorRef)}
            >
              Editor
            </button>
          </div>

          <section
            ref={editorRef}
            className="panel-card template-editor-panel"
            style={{ scrollMarginTop: mobileTabsTop + 56 }}
          >
            <div className="section-heading sticky-heading">
              <h3>Editor</h3>
              <div className="button-row">
                <button className="ghost-button" type="button" onClick={handleDelete}>
                  <Trash2 aria-hidden="true" />
                  <span>Delete</span>
                </button>
                <button className="copy-button" type="button" onClick={handleSave}>
                  <Save aria-hidden="true" />
                  <span>Save</span>
                </button>
              </div>
            </div>

            <div className={`editor-grid${props.hasSubject ? "" : " editor-grid-single"}`}>
              <label className="field field-full">
                <span className="field-header">
                  <span>Name</span>
                  <span className="field-actions">
                    <CopyButton
                      className="icon-action"
                      defaultLabel="Copy name"
                      text={props.manager.draft.name}
                      icon={<Copy aria-hidden="true" />}
                    />
                    <PasteButton
                      title="Paste name"
                      onPaste={(text) =>
                        props.manager.setDraft((current) => ({ ...current, name: text }))
                      }
                    />
                  </span>
                </span>
                <input
                  className="compact-input"
                  type="text"
                  placeholder={props.blankName}
                  value={props.manager.draft.name}
                  onChange={(event) =>
                    props.manager.setDraft((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                />
              </label>
              <div className="field field-full">
                <span>Icon</span>
                <div className="template-icon-grid">
                  {templateIconOptions.map((item) => (
                    <button
                      key={item.id}
                      className={`template-icon-choice is-${props.manager.draft.iconTone}${
                        props.manager.draft.iconName === item.id ? " is-active" : ""
                      }`}
                      type="button"
                      title={item.label}
                      aria-label={item.label}
                      onClick={() =>
                        props.manager.setDraft((current) => ({ ...current, iconName: item.id }))
                      }
                    >
                      {item.icon}
                    </button>
                  ))}
                </div>
              </div>
              <div className="field field-full">
                <span>Icon Color</span>
                <div className="template-tone-grid">
                  {templateToneOptions.map((tone) => (
                    <button
                      key={tone}
                      className={`template-tone-choice is-${tone}${
                        props.manager.draft.iconTone === tone ? " is-active" : ""
                      }`}
                      type="button"
                      title={tone}
                      aria-label={tone}
                      onClick={() =>
                        props.manager.setDraft((current) => ({ ...current, iconTone: tone }))
                      }
                    />
                  ))}
                </div>
              </div>
            </div>

            {props.hasSubject ? (
              <label className="field">
                <span className="field-header">
                  <span>Subject</span>
                  <span className="field-actions">
                    <CopyButton
                      className="icon-action"
                      defaultLabel="Copy subject"
                      text={props.manager.draft.subject}
                      icon={<Copy aria-hidden="true" />}
                    />
                    <PasteButton
                      title="Paste subject"
                      onPaste={(text) =>
                        props.manager.setDraft((current) => ({ ...current, subject: text }))
                      }
                    />
                  </span>
                </span>
                <input
                  className="compact-input"
                  type="text"
                  placeholder="Hello {{firstName}}, welcome to {{company}}"
                  value={props.manager.draft.subject}
                  onChange={(event) =>
                    props.manager.setDraft((current) => ({
                      ...current,
                      subject: event.target.value,
                    }))
                  }
                />
              </label>
            ) : null}

            <label className="field">
              <span className="field-header">
                <span>{props.bodyLabel}</span>
                <span className="field-actions">
                  <CopyButton
                    className="icon-action"
                    defaultLabel={`Copy ${props.bodyLabel.toLowerCase()}`}
                    text={props.manager.draft.body}
                    icon={<Copy aria-hidden="true" />}
                  />
                  <PasteButton
                    title={`Paste ${props.bodyLabel.toLowerCase()}`}
                    onPaste={(text) =>
                      props.manager.setDraft((current) => ({ ...current, body: text }))
                    }
                  />
                </span>
              </span>
              <textarea
                className="text-input template-body-input"
                spellCheck={false}
                value={props.manager.draft.body}
                onChange={(event) =>
                  props.manager.setDraft((current) => ({
                    ...current,
                    body: event.target.value,
                  }))
                }
              />
            </label>
          </section>

          <section
            ref={variablesRef}
            className="panel-card template-variable-panel"
            style={{ scrollMarginTop: mobileTabsTop + 56 }}
          >
            <div className="section-heading">
              <h3>Variables</h3>
            </div>
            {hasAnyVariables ? (
              <>
              <div className="variable-summary">
                {props.manager.variables.map((name) => (
                  <div key={name} className="variable-pill">
                    {`{{${name}}}`}
                  </div>
                ))}
              </div>
              <div className="variable-grid">
                {props.manager.variables.map((name) => (
                  <label key={name} className="variable-chip">
                    <span className="field-header">
                      <code>{`{{${name}}}`}</code>
                      <span className="field-actions">
                        <CopyButton
                          className="icon-action"
                          defaultLabel={`Copy ${name}`}
                          text={props.manager.variableValues[name] || ""}
                          icon={<Copy aria-hidden="true" />}
                        />
                        <PasteButton
                          title={`Paste ${name}`}
                          onPaste={(text) =>
                            props.manager.setVariableValues((current) => ({
                              ...current,
                              [name]: text,
                            }))
                          }
                        />
                      </span>
                    </span>
                    <input
                      className="compact-input"
                      type="text"
                      placeholder={`Value for ${name}`}
                      value={props.manager.variableValues[name] || ""}
                      onChange={(event) =>
                        props.manager.setVariableValues((current) => ({
                          ...current,
                          [name]: event.target.value,
                        }))
                      }
                    />
                  </label>
                ))}
              </div>
              </>
            ) : (
              <div className="empty-state">No variables found.</div>
            )}
          </section>

          <section
            ref={previewRef}
            className="panel-card template-preview-panel"
            style={{ scrollMarginTop: mobileTabsTop + 56 }}
          >
            <div className="section-heading sticky-heading">
              <h3>Preview</h3>
            </div>
            <div className="preview-card">
              {props.hasSubject ? (
                <div className="preview-block">
                  <div className="preview-block-header">
                    <p className="preview-label">Subject</p>
                    <CopyButton
                      className="icon-action"
                      defaultLabel={props.copySubjectLabel ?? "Copy Subject"}
                      text={props.manager.renderedSubject}
                      icon={<Copy aria-hidden="true" />}
                    />
                  </div>
                  <pre className="preview-output">{props.manager.renderedSubject}</pre>
                </div>
              ) : null}
              <div className="preview-block">
                <div className="preview-block-header">
                  <p className="preview-label">{props.bodyLabel}</p>
                  <CopyButton
                    className="icon-action"
                    defaultLabel={props.copyBodyLabel ?? "Copy Body"}
                    text={props.manager.renderedBody}
                    icon={<Copy aria-hidden="true" />}
                  />
                  {props.shareBodyToWhatsapp ? (
                    <>
                      <ShareToWhatsAppButton text={props.manager.renderedBody} />
                      <button
                        className={`icon-action whatsapp-action${
                          isWhatsappNumberOpen ? " is-active" : ""
                        }`}
                        type="button"
                        title="Share to WhatsApp number"
                        aria-label="Share to WhatsApp number"
                        aria-expanded={isWhatsappNumberOpen}
                        onClick={() => setIsWhatsappNumberOpen((current) => !current)}
                      >
                        <MessageCircleMore aria-hidden="true" />
                      </button>
                    </>
                  ) : null}
                  {props.shareBodyToGmail ? (
                    <OpenInGmailButton
                      subject={props.manager.renderedSubject}
                      body={props.manager.renderedBody}
                    />
                  ) : null}
                </div>
                {props.shareBodyToWhatsapp && isWhatsappNumberOpen ? (
                  <form
                    className="whatsapp-number-panel"
                    onSubmit={(event) => {
                      event.preventDefault();
                      handleOpenWhatsappNumberChat();
                    }}
                  >
                    <label className="sr-only" htmlFor="whatsapp-phone-number">
                      WhatsApp phone number
                    </label>
                    <input
                      id="whatsapp-phone-number"
                      className="compact-input"
                      type="tel"
                      inputMode="tel"
                      placeholder="+91 mobile number"
                      value={whatsappPhoneNumber}
                      onChange={(event) => setWhatsappPhoneNumber(event.target.value)}
                    />
                    <PasteButton
                      title="Paste number"
                      onPaste={handlePasteWhatsappNumber}
                    />
                    <button className="copy-button" type="submit">
                      <WhatsAppIcon />
                      <span>Open chat</span>
                    </button>
                  </form>
                ) : null}
                <pre className="preview-output">{props.manager.renderedBody}</pre>
              </div>
            </div>
          </section>
        </section>
      </section>
    </section>
  );
}

export function PromptTemplateView(props: {
  blankTitle: string;
  importFileName: string;
  manager: PromptManagerShape;
  onToast: (message: string, tone?: ToastTone) => void;
  sectionLabel: string;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const editorRef = useRef<HTMLElement | null>(null);
  const variablesRef = useRef<HTMLElement | null>(null);
  const previewRef = useRef<HTMLElement | null>(null);
  const scrollSpyPausedUntilRef = useRef(0);
  const [activeTemplateSection, setActiveTemplateSection] =
    useState<"editor" | "variables" | "preview">("variables");
  const [mobileTabsTop, setMobileTabsTop] = useState(74);
  const promptVariables = extractVariableNames([props.manager.draft.prompt]);
  const sampleInputVariables = extractVariableNames([props.manager.draft.sampleInputTemplate]);
  const sampleOutputVariables = extractVariableNames([props.manager.draft.sampleOutput]);
  const hasAnyVariables = props.manager.variables.length > 0;
  const hasAnyPreview =
    promptVariables.length > 0 || sampleInputVariables.length > 0 || sampleOutputVariables.length > 0;

  useEffect(() => {
    function measureTabsTop() {
      const topbar = document.querySelector(".topbar");
      const bottom = topbar?.getBoundingClientRect().bottom ?? 66;
      setMobileTabsTop(Math.max(56, Math.ceil(bottom + 6)));
    }

    measureTabsTop();
    window.addEventListener("resize", measureTabsTop);
    const observer =
      "ResizeObserver" in window
        ? new ResizeObserver(measureTabsTop)
        : null;
    const topbar = document.querySelector(".topbar");
    if (topbar && observer) {
      observer.observe(topbar);
    }

    return () => {
      window.removeEventListener("resize", measureTabsTop);
      observer?.disconnect();
    };
  }, []);

  useEffect(() => {
    function handleScroll() {
      if (Date.now() < scrollSpyPausedUntilRef.current) {
        return;
      }
      const spyAnchor = mobileTabsTop + 44;
      const sections = [
        { id: "variables" as const, element: variablesRef.current },
        { id: "preview" as const, element: previewRef.current },
        { id: "editor" as const, element: editorRef.current },
      ].filter((item): item is { id: "editor" | "variables" | "preview"; element: HTMLElement } =>
        Boolean(item.element),
      );
      const current = sections
        .map((item) => ({
          id: item.id,
          distance: Math.abs(item.element.getBoundingClientRect().top - spyAnchor),
        }))
        .sort((left, right) => left.distance - right.distance)[0];
      if (current) {
        setActiveTemplateSection(current.id);
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [hasAnyPreview, hasAnyVariables, mobileTabsTop, props.manager.selectedId]);

  async function handleDelete() {
    if (!props.manager.selectedId) {
      return;
    }
    const title =
      props.manager.templates.find((item) => item.id === props.manager.selectedId)?.title ??
      props.manager.draft.title;
    const confirmed = window.confirm(`Delete "${title}"? This cannot be undone.`);
    if (!confirmed) {
      return;
    }
    try {
      const deleted = await props.manager.deleteTemplate();
      if (deleted) {
        props.onToast(`${deleted.title} deleted`, "warning");
      }
    } catch (error) {
      props.onToast(error instanceof Error ? error.message : "Delete failed", "warning");
    }
  }

  async function handleSave() {
    try {
      await props.manager.saveTemplate();
      props.onToast(`${props.manager.draft.title || props.blankTitle} saved`, "success");
    } catch (error) {
      props.onToast(error instanceof Error ? error.message : "Save failed", "warning");
    }
  }

  function handleExport() {
    downloadJson(props.importFileName, props.manager.templates);
  }

  function handleToggleFavorite(item: PromptTemplate) {
    void props.manager
      .toggleFavorite(item)
      .catch((error: unknown) =>
        props.onToast(error instanceof Error ? error.message : "Favorite failed", "warning"),
      );
  }

  function scrollToSection(
    section: "editor" | "variables" | "preview",
    ref: RefObject<HTMLElement | null>,
  ) {
    setActiveTemplateSection(section);
    scrollSpyPausedUntilRef.current = Date.now() + 900;
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function handleImportFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as unknown[];
        void props.manager
          .importTemplates(Array.isArray(parsed) ? parsed : [])
          .then(() => props.onToast(`${props.sectionLabel} imported to Firestore`, "success"))
          .catch((error: unknown) =>
            props.onToast(error instanceof Error ? error.message : "Import failed", "warning"),
          );
      } catch {
        props.onToast("Invalid JSON", "warning");
      }
      event.target.value = "";
    };
    reader.readAsText(file);
  }

  return (
    <section className="view-panel prompt-template-view">
      <section className="template-layout">
        <section className="panel-card template-list-panel">
          <div className="section-heading">
            <h3>Prompts</h3>
            <button className="ghost-button" type="button" onClick={props.manager.createNewTemplate}>
              <Plus aria-hidden="true" />
              <span>New</span>
            </button>
          </div>

          <div className="template-toolbar">
            <button
              className={`ghost-button icon-only-button${props.manager.showFavoritesOnly ? " is-active" : ""}`}
              type="button"
              title="Show favorites only"
              aria-label="Show favorites only"
              onClick={() => props.manager.setShowFavoritesOnly((current) => !current)}
            >
              <Star aria-hidden="true" />
            </button>
            <ToolbarActionButton
              onClick={() => fileInputRef.current?.click()}
              icon={<FileInput aria-hidden="true" />}
              title="Import JSON"
            />
            <ToolbarActionButton
              onClick={handleExport}
              icon={<Download aria-hidden="true" />}
              title="Export JSON"
            />
          </div>

          <input
            className="compact-input"
            type="search"
            placeholder="Search prompts..."
            value={props.manager.searchQuery}
            onChange={(event) => props.manager.setSearchQuery(event.target.value)}
          />

          <div className="template-list">
            {props.manager.isLoading ? (
              <div className="empty-state">Loading prompts...</div>
            ) : props.manager.error ? (
              <div className="empty-state is-error">{props.manager.error}</div>
            ) : props.manager.filteredTemplates.length ? (
              props.manager.filteredTemplates.map((item) => (
                <article
                  key={item.id}
                  className={`template-list-item${item.id === props.manager.selectedId ? " is-active" : ""}`}
                >
                  <button
                    className="template-list-main"
                    type="button"
                    onClick={() => props.manager.selectTemplate(item.id)}
                  >
                    <p className="template-list-name">{item.title}</p>
                    <p className="template-list-meta">
                      {item.categories || "No categories"} •{" "}
                      {extractVariableNames([item.prompt, item.sampleInputTemplate]).length} variables
                    </p>
                  </button>
                  <button
                    className={`icon-action template-favorite-action${item.favorite ? " is-active" : ""}`}
                    type="button"
                    title={item.favorite ? "Remove favorite" : "Add favorite"}
                    aria-label={item.favorite ? "Remove favorite" : "Add favorite"}
                    onClick={() => handleToggleFavorite(item)}
                  >
                    <Star aria-hidden="true" />
                  </button>
                </article>
              ))
            ) : (
              <div className="empty-state">No prompts match your search.</div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            hidden
            onChange={handleImportFile}
          />
        </section>

        <section className="panel-card template-work-panel">
          <div
            className="mobile-section-tabs"
            aria-label="Prompt template sections"
            style={{ top: mobileTabsTop }}
          >
            <button
              className={activeTemplateSection === "variables" ? "is-active" : ""}
              type="button"
              onClick={() => scrollToSection("variables", variablesRef)}
            >
              Variables
            </button>
            <button
              className={activeTemplateSection === "preview" ? "is-active" : ""}
              type="button"
              onClick={() => scrollToSection("preview", previewRef)}
            >
              Preview
            </button>
            <button
              className={activeTemplateSection === "editor" ? "is-active" : ""}
              type="button"
              onClick={() => scrollToSection("editor", editorRef)}
            >
              Editor
            </button>
          </div>

          <section
            ref={editorRef}
            className="panel-card template-editor-panel"
            style={{ scrollMarginTop: mobileTabsTop + 56 }}
          >
            <div className="section-heading sticky-heading">
              <h3>Editor</h3>
              <div className="button-row">
                <button className="ghost-button" type="button" onClick={handleDelete}>
                  <Trash2 aria-hidden="true" />
                  <span>Delete</span>
                </button>
                <button className="copy-button" type="button" onClick={handleSave}>
                  <Save aria-hidden="true" />
                  <span>Save</span>
                </button>
              </div>
            </div>

            <div className="editor-grid">
              <label className="field">
                <span className="field-header">
                  <span>Title</span>
                  <span className="field-actions">
                    <CopyButton
                      className="icon-action"
                      defaultLabel="Copy title"
                      text={props.manager.draft.title}
                      icon={<Copy aria-hidden="true" />}
                    />
                    <PasteButton
                      title="Paste title"
                      onPaste={(text) =>
                        props.manager.setDraft((current) => ({ ...current, title: text }))
                      }
                    />
                  </span>
                </span>
                <input
                  className="compact-input"
                  type="text"
                  placeholder={props.blankTitle}
                  value={props.manager.draft.title}
                  onChange={(event) =>
                    props.manager.setDraft((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                />
              </label>
              <label className="field">
                <span className="field-header">
                  <span>Categories</span>
                  <span className="field-actions">
                    <CopyButton
                      className="icon-action"
                      defaultLabel="Copy categories"
                      text={props.manager.draft.categories}
                      icon={<Copy aria-hidden="true" />}
                    />
                    <PasteButton
                      title="Paste categories"
                      onPaste={(text) =>
                        props.manager.setDraft((current) => ({ ...current, categories: text }))
                      }
                    />
                  </span>
                </span>
                <input
                  className="compact-input"
                  type="text"
                  placeholder="SEO, Writing, Marketing"
                  value={props.manager.draft.categories}
                  onChange={(event) =>
                    props.manager.setDraft((current) => ({
                      ...current,
                      categories: event.target.value,
                    }))
                  }
                />
              </label>
            </div>

            <label className="field">
              <span className="field-header">
                <span>Prompt</span>
                <span className="field-actions">
                  <CopyButton
                    className="icon-action"
                    defaultLabel="Copy prompt"
                    text={props.manager.draft.prompt}
                    icon={<Copy aria-hidden="true" />}
                  />
                  <PasteButton
                    title="Paste prompt"
                    onPaste={(text) =>
                      props.manager.setDraft((current) => ({ ...current, prompt: text }))
                    }
                  />
                </span>
              </span>
              <textarea
                className="text-input template-body-input"
                spellCheck={false}
                value={props.manager.draft.prompt}
                onChange={(event) =>
                  props.manager.setDraft((current) => ({
                    ...current,
                    prompt: event.target.value,
                  }))
                }
              />
            </label>

            <label className="field">
              <span className="field-header">
                <span>Sample Input Template</span>
                <span className="field-actions">
                  <CopyButton
                    className="icon-action"
                    defaultLabel="Copy sample input"
                    text={props.manager.draft.sampleInputTemplate}
                    icon={<Copy aria-hidden="true" />}
                  />
                  <PasteButton
                    title="Paste sample input"
                    onPaste={(text) =>
                      props.manager.setDraft((current) => ({
                        ...current,
                        sampleInputTemplate: text,
                      }))
                    }
                  />
                </span>
              </span>
              <textarea
                className="text-input sample-input-textarea"
                spellCheck={false}
                value={props.manager.draft.sampleInputTemplate}
                onChange={(event) =>
                  props.manager.setDraft((current) => ({
                    ...current,
                    sampleInputTemplate: event.target.value,
                  }))
                }
              />
            </label>

            <label className="field">
              <span className="field-header">
                <span>Sample Output</span>
                <span className="field-actions">
                  <CopyButton
                    className="icon-action"
                    defaultLabel="Copy sample output"
                    text={props.manager.draft.sampleOutput}
                    icon={<Copy aria-hidden="true" />}
                  />
                  <PasteButton
                    title="Paste sample output"
                    onPaste={(text) =>
                      props.manager.setDraft((current) => ({ ...current, sampleOutput: text }))
                    }
                  />
                </span>
              </span>
              <textarea
                className="text-input sample-output-textarea"
                spellCheck={false}
                value={props.manager.draft.sampleOutput}
                onChange={(event) =>
                  props.manager.setDraft((current) => ({
                    ...current,
                    sampleOutput: event.target.value,
                  }))
                }
              />
            </label>
          </section>

          <section
            ref={variablesRef}
            className="panel-card template-variable-panel"
            style={{ scrollMarginTop: mobileTabsTop + 56 }}
          >
            <div className="section-heading">
              <h3>Variables</h3>
            </div>
            {hasAnyVariables ? (
              <>
              <div className="variable-summary">
                {props.manager.variables.map((name) => (
                  <div key={name} className="variable-pill">
                    {`{{${name}}}`}
                  </div>
                ))}
              </div>
              <div className="variable-grid">
                {props.manager.variables.map((name) => (
                  <label key={name} className="variable-chip">
                    <span className="field-header">
                      <code>{`{{${name}}}`}</code>
                      <span className="field-actions">
                        <CopyButton
                          className="icon-action"
                          defaultLabel={`Copy ${name}`}
                          text={props.manager.variableValues[name] || ""}
                          icon={<Copy aria-hidden="true" />}
                        />
                        <PasteButton
                          title={`Paste ${name}`}
                          onPaste={(text) =>
                            props.manager.setVariableValues((current) => ({
                              ...current,
                              [name]: text,
                            }))
                          }
                        />
                      </span>
                    </span>
                    <input
                      className="compact-input"
                      type="text"
                      placeholder={`Value for ${name}`}
                      value={props.manager.variableValues[name] || ""}
                      onChange={(event) =>
                        props.manager.setVariableValues((current) => ({
                          ...current,
                          [name]: event.target.value,
                        }))
                      }
                    />
                  </label>
                ))}
              </div>
              </>
            ) : (
              <div className="empty-state">No variables found.</div>
            )}
          </section>

          <section
            ref={previewRef}
            className="panel-card template-preview-panel"
            style={{ scrollMarginTop: mobileTabsTop + 56 }}
          >
            <div className="section-heading sticky-heading">
              <h3>Preview</h3>
            </div>
            {hasAnyPreview ? (
              <div className="preview-card">
                {promptVariables.length ? (
                  <div className="preview-block">
                    <div className="preview-block-header">
                      <p className="preview-label">Rendered Prompt</p>
                      <CopyButton
                        className="icon-action"
                        defaultLabel="Copy rendered prompt"
                        text={props.manager.renderedPrompt}
                        icon={<Copy aria-hidden="true" />}
                      />
                    </div>
                    <pre className="preview-output">{props.manager.renderedPrompt}</pre>
                  </div>
                ) : null}

                {sampleInputVariables.length ? (
                  <div className="preview-block">
                    <div className="preview-block-header">
                      <p className="preview-label">Rendered Sample Input</p>
                      <CopyButton
                        className="icon-action"
                        defaultLabel="Copy rendered input"
                        text={props.manager.renderedSampleInput}
                        icon={<Copy aria-hidden="true" />}
                      />
                    </div>
                    <pre className="preview-output">{props.manager.renderedSampleInput}</pre>
                  </div>
                ) : null}

                {sampleOutputVariables.length ? (
                  <div className="preview-block">
                    <div className="preview-block-header">
                      <p className="preview-label">Rendered Sample Output</p>
                      <CopyButton
                        className="icon-action"
                        defaultLabel="Copy rendered output"
                        text={props.manager.renderedSampleOutput}
                        icon={<Copy aria-hidden="true" />}
                      />
                    </div>
                    <pre className="preview-output">{props.manager.renderedSampleOutput}</pre>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="empty-state">No preview yet.</div>
            )}
          </section>
        </section>
      </section>
    </section>
  );
}

export function PromptLibraryView(props: {
  manager: PromptLibraryManagerShape;
  onToast: (message: string, tone?: ToastTone) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [typeFilter, setTypeFilter] = useState<"all" | "image" | "video">("all");
  const [tagsText, setTagsText] = useState("");
  const filteredItems =
    typeFilter === "all"
      ? props.manager.items
      : props.manager.items.filter((item) => item.outputType === typeFilter);

  useEffect(() => {
    setTagsText(props.manager.draft.tags.join(", "));
  }, [props.manager.draft.id]);

  function openNewItem() {
    props.manager.createNewItem();
    setIsDetailOpen(true);
  }

  function openItem(item: PromptLibraryItem) {
    props.manager.selectItem(item.id);
    setIsDetailOpen(true);
  }

  async function handleSave() {
    try {
      await props.manager.saveItem();
      props.onToast("Prompt library item saved", "success");
    } catch (error) {
      props.onToast(error instanceof Error ? error.message : "Save failed", "warning");
    }
  }

  async function handleDelete() {
    if (!props.manager.selectedId) {
      return;
    }
    const confirmed = window.confirm("Delete this prompt library item? This cannot be undone.");
    if (!confirmed) {
      return;
    }

    try {
      const deleted = await props.manager.deleteItem();
      if (deleted) {
        props.onToast("Prompt library item deleted", "warning");
        setIsDetailOpen(false);
      }
    } catch (error) {
      props.onToast(error instanceof Error ? error.message : "Delete failed", "warning");
    }
  }

  async function handleImageFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!files.length) {
      return;
    }

    const remainingSlots = promptLibraryMaxImages - props.manager.draft.images.length;
    if (remainingSlots <= 0) {
      props.onToast(`Maximum ${promptLibraryMaxImages} images allowed`, "warning");
      return;
    }

    setIsCompressing(true);
    try {
      const compressedImages: PromptLibraryImage[] = [];
      for (const file of files.slice(0, remainingSlots)) {
        compressedImages.push(await compressPromptLibraryImage(file));
      }
      props.manager.setDraft((current) => ({
        ...current,
        images: [...current.images, ...compressedImages].slice(0, promptLibraryMaxImages),
      }));
      props.onToast(
        `${compressedImages.length} image${compressedImages.length === 1 ? "" : "s"} compressed`,
        "success",
      );
    } catch (error) {
      props.onToast(error instanceof Error ? error.message : "Image compression failed", "warning");
    } finally {
      setIsCompressing(false);
    }
  }

  function removeImage(imageId: string) {
    props.manager.setDraft((current) => ({
      ...current,
      images: current.images.filter((image) => image.id !== imageId),
    }));
  }

  function handleExportPrompts() {
    downloadJson(
      "prompt-library-prompts.json",
      props.manager.items.map((item) => ({
        promptText: item.promptText,
        outputType: item.outputType,
      })),
    );
  }

  return (
    <section className="view-panel prompt-library-view">
      <section className="panel-card prompt-library-toolbar">
        <div className="section-heading">
          <h3>Library</h3>
          <div className="prompt-library-actions">
            <div className="prompt-library-filter" aria-label="Filter prompt library by type">
              {(["all", "image", "video"] as const).map((filter) => (
                <button
                  key={filter}
                  className={`category-chip${typeFilter === filter ? " is-active" : ""}`}
                  type="button"
                  onClick={() => setTypeFilter(filter)}
                >
                  <span>{filter}</span>
                </button>
              ))}
            </div>
            <button className="ghost-button icon-only-button" type="button" title="Export prompts" aria-label="Export prompts" onClick={handleExportPrompts}>
              <Download aria-hidden="true" />
            </button>
            <button className="copy-button" type="button" onClick={openNewItem}>
              <Plus aria-hidden="true" />
              <span>New</span>
            </button>
          </div>
        </div>
      </section>

      <section className="prompt-library-grid" aria-label="Prompt library items">
        {props.manager.isLoading ? (
          <div className="empty-state">Loading prompt library...</div>
        ) : props.manager.error ? (
          <div className="empty-state is-error">{props.manager.error}</div>
        ) : filteredItems.length ? (
          filteredItems.map((item) => {
            const coverImage = item.images[0];
            return (
              <article key={item.id} className="prompt-library-card">
                <button
                  className="prompt-library-card-button"
                  type="button"
                  onClick={() => openItem(item)}
                >
                  <div className="prompt-library-cover">
                    {coverImage ? (
                      <img src={coverImage.dataUrl} alt="" />
                    ) : (
                      <div className="prompt-library-empty-cover">
                        <ImagePlus aria-hidden="true" />
                      </div>
                    )}
                  </div>
                  <div className="prompt-library-card-body">
                    <span className="prompt-library-type-pill">{item.outputType}</span>
                    {item.tags.length ? (
                      <div className="prompt-library-card-tags">
                        {item.tags.slice(0, 4).map((tag) => (
                          <span key={tag}>{tag}</span>
                        ))}
                      </div>
                    ) : null}
                    <p>{item.promptText || "Untitled prompt"}</p>
                  </div>
                </button>
                <div className="prompt-library-card-footer">
                  <time dateTime={item.updatedAt}>{formatDateTime(item.updatedAt)}</time>
                  <CopyButton
                    className="icon-action"
                    defaultLabel="Copy prompt"
                    text={item.promptText}
                    icon={<Copy aria-hidden="true" />}
                  />
                </div>
              </article>
            );
          })
        ) : (
          <div className="empty-state">
            {props.manager.items.length ? "No prompt outputs match this filter." : "No prompt outputs saved yet."}
          </div>
        )}
      </section>

      {isDetailOpen ? (
        <div className="dialog-backdrop" role="presentation">
          <section
            className="panel-card prompt-library-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="prompt-library-dialog-title"
          >
            <div className="section-heading">
              <h3 id="prompt-library-dialog-title">Prompt Output</h3>
              <div className="button-row">
                <button className="ghost-button" type="button" onClick={() => setIsDetailOpen(false)}>
                  <span>Close</span>
                </button>
                <button className="ghost-button" type="button" onClick={() => void handleDelete()}>
                  <Trash2 aria-hidden="true" />
                  <span>Delete</span>
                </button>
                <button className="copy-button" type="button" onClick={() => void handleSave()}>
                  <Save aria-hidden="true" />
                  <span>Save</span>
                </button>
              </div>
            </div>

            <div className="prompt-library-detail-grid">
              <section className="prompt-library-images-panel">
                <div className="prompt-library-image-grid">
                  {props.manager.draft.images.length ? (
                    props.manager.draft.images.map((image) => (
                      <article key={image.id} className="prompt-library-image-tile">
                        <img src={image.dataUrl} alt="" />
                        <div className="prompt-library-image-actions">
                          <button
                            className="icon-action"
                            type="button"
                            title="Download image"
                            aria-label="Download image"
                            onClick={() => downloadDataUrl(image.fileName, image.dataUrl)}
                          >
                            <Download aria-hidden="true" />
                          </button>
                          <button
                            className="icon-action is-danger"
                            type="button"
                            title="Remove image"
                            aria-label="Remove image"
                            onClick={() => removeImage(image.id)}
                          >
                            <Trash2 aria-hidden="true" />
                          </button>
                        </div>
                        <p>{formatBytes(image.sizeBytes)}</p>
                      </article>
                    ))
                  ) : (
                    <div className="prompt-library-empty-detail">
                      <ImagePlus aria-hidden="true" />
                      <span>No images yet</span>
                    </div>
                  )}
                </div>

                <button
                  className="ghost-button prompt-library-upload-button"
                  type="button"
                  disabled={
                    isCompressing || props.manager.draft.images.length >= promptLibraryMaxImages
                  }
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImagePlus aria-hidden="true" />
                  <span>{isCompressing ? "Compressing..." : "Add images"}</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  multiple
                  hidden
                  onChange={(event) => void handleImageFiles(event)}
                />
              </section>

              <section className="prompt-library-form-panel">
                <label className="field">
                  <span>Type</span>
                  <select
                    className="compact-input"
                    value={props.manager.draft.outputType}
                    onChange={(event) =>
                      props.manager.setDraft((current) => ({
                        ...current,
                        outputType: event.target.value === "video" ? "video" : "image",
                      }))
                    }
                  >
                    <option value="image">Image</option>
                    <option value="video">Video</option>
                  </select>
                </label>

                <label className="field">
                  <span className="field-header">
                    <span>Tags</span>
                    <span className="field-actions">
                      <CopyButton
                        className="icon-action"
                        defaultLabel="Copy tags"
                        text={props.manager.draft.tags.join(", ")}
                        icon={<Copy aria-hidden="true" />}
                      />
                      <PasteButton
                        title="Paste tags"
                        onPaste={(text) => {
                          setTagsText(text);
                          props.manager.setDraft((current) => ({
                            ...current,
                            tags: parseTags(text),
                          }));
                        }}
                      />
                    </span>
                  </span>
                  <input
                    className="compact-input"
                    type="text"
                    placeholder="portrait, product, cinematic"
                    value={tagsText}
                    onChange={(event) => {
                      setTagsText(event.target.value);
                      props.manager.setDraft((current) => ({
                        ...current,
                        tags: parseTags(event.target.value),
                      }));
                    }}
                  />
                </label>

                <label className="field">
                  <span className="field-header">
                    <span>Prompt Text</span>
                    <span className="field-actions">
                      <CopyButton
                        className="icon-action"
                        defaultLabel="Copy prompt"
                        text={props.manager.draft.promptText}
                        icon={<Copy aria-hidden="true" />}
                      />
                      <PasteButton
                        title="Paste prompt"
                        onPaste={(text) =>
                          props.manager.setDraft((current) => ({
                            ...current,
                            promptText: text,
                          }))
                        }
                      />
                    </span>
                  </span>
                  <textarea
                    className="text-input prompt-library-prompt-input"
                    spellCheck={false}
                    value={props.manager.draft.promptText}
                    onChange={(event) =>
                      props.manager.setDraft((current) => ({
                        ...current,
                        promptText: event.target.value,
                      }))
                    }
                  />
                </label>

                <div className="prompt-library-date-panel">
                  <p className="preview-label">Updated</p>
                  <time dateTime={props.manager.draft.updatedAt}>
                    {formatDateTime(props.manager.draft.updatedAt)}
                  </time>
                </div>
              </section>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}

export function PromptBuilderView(props: {
  manager: PromptBuilderManagerShape;
  onToast: (message: string, tone?: ToastTone) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [importMode, setImportMode] = useState<"merge" | "replace">("merge");
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isComposerOpen, setIsComposerOpen] = useState(false);

  const activeCategory = props.manager.categories.find(
    (item) => item.id === props.manager.selectedCategory,
  );

  async function handleSave() {
    try {
      await props.manager.saveIngredient();
      props.onToast(`${props.manager.draft.title || "Ingredient"} saved`, "success");
      setIsEditorOpen(false);
    } catch (error) {
      props.onToast(error instanceof Error ? error.message : "Save failed", "warning");
    }
  }

  async function handleDelete(item?: PromptIngredient) {
    const targetId = item?.id ?? props.manager.selectedId;
    const targetTitle = item?.title ?? props.manager.draft.title;
    if (!targetId) {
      return;
    }
    const confirmed = window.confirm(
      `Delete "${targetTitle || "this ingredient"}"? This cannot be undone.`,
    );
    if (!confirmed) {
      return;
    }

    try {
      const deleted = await props.manager.deleteIngredient(targetId);
      if (deleted) {
        props.onToast(`${deleted.title} deleted`, "warning");
        if (!item || item.id === props.manager.selectedId) {
          setIsEditorOpen(false);
        }
      }
    } catch (error) {
      props.onToast(error instanceof Error ? error.message : "Delete failed", "warning");
    }
  }

  function handleNew() {
    props.manager.createNewIngredient();
    setIsEditorOpen(true);
  }

  function handleEdit(item: PromptIngredient) {
    props.manager.selectIngredient(item.id);
    setIsEditorOpen(true);
  }

  function handleImportClick(mode: "merge" | "replace") {
    setImportMode(mode);
    fileInputRef.current?.click();
  }

  function handleExport() {
    downloadJson("prompt-builder-library.json", props.manager.library);
  }

  function handleImportFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        void props.manager
          .importLibrary(parsed, importMode)
          .then(() =>
            props.onToast(
              importMode === "merge" ? "Library merged into Firestore" : "Library replaced",
              "success",
            ),
          )
          .catch((error: unknown) =>
            props.onToast(error instanceof Error ? error.message : "Import failed", "warning"),
          );
      } catch {
        props.onToast("Invalid JSON", "warning");
      }
      event.target.value = "";
    };
    reader.readAsText(file);
  }

  function handleTagsChange(value: string) {
    props.manager.setDraft((current) => ({
      ...current,
      tags: value
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    }));
  }

  function handleUseForChange(value: string) {
    props.manager.setDraft((current) => ({
      ...current,
      useFor: value as PromptBuilderUseFor,
    }));
  }

  return (
    <section className="view-panel prompt-builder-view">
      <section className="panel-card builder-categories-panel">
        <div className="section-heading">
          <h3>Kit</h3>
          <button className="ghost-button" type="button" onClick={handleNew}>
            <Plus aria-hidden="true" />
            <span>New</span>
          </button>
        </div>
        <div className="builder-category-grid">
          {props.manager.categories.map((category) => (
            <button
              key={category.id}
              className={`category-chip${
                category.id === props.manager.selectedCategory ? " is-active" : ""
              }`}
              type="button"
              onClick={() => props.manager.selectCategory(category.id)}
            >
              <span>{category.label}</span>
              <strong>{props.manager.library[category.id].length}</strong>
            </button>
          ))}
        </div>
      </section>

      <section className="panel-card builder-list-panel">
        <div className="section-heading">
          <h3>{activeCategory?.label ?? "Items"}</h3>
          <div className="template-toolbar is-tight">
            <button
              className={`ghost-button icon-only-button${props.manager.showFavoritesOnly ? " is-active" : ""}`}
              type="button"
              aria-label="Show starred only"
              title="Show starred only"
              onClick={() => props.manager.setShowFavoritesOnly((current) => !current)}
            >
              <Star aria-hidden="true" />
            </button>
            <ToolbarActionButton
              onClick={() => handleImportClick("merge")}
              icon={<FileInput aria-hidden="true" />}
              title="Merge import"
            />
            <ToolbarActionButton
              onClick={handleExport}
              icon={<Download aria-hidden="true" />}
              title="Export JSON"
            />
          </div>
        </div>
        <input
          className="compact-input"
          type="search"
          placeholder="Search cards..."
          value={props.manager.searchQuery}
          onChange={(event) => props.manager.setSearchQuery(event.target.value)}
        />

        <div className="builder-item-list">
          {props.manager.isLoading ? (
            <div className="empty-state">Loading library...</div>
          ) : props.manager.error ? (
            <div className="empty-state is-error">{props.manager.error}</div>
          ) : props.manager.filteredItems.length ? (
            props.manager.filteredItems.map((item) => (
              <article
                key={item.id}
                className={`builder-item${item.id === props.manager.selectedId ? " is-active" : ""}`}
              >
                <div className="builder-card-top">
                  <p className="builder-use-pill">{item.useFor}</p>
                  <div className="builder-item-actions">
                    <button
                      className={`icon-action${item.favorite ? " is-active" : ""}`}
                      type="button"
                      title="Favorite"
                      aria-label="Favorite"
                      onClick={() =>
                        void props.manager
                          .toggleFavorite(item)
                          .catch((error: unknown) =>
                            props.onToast(
                              error instanceof Error ? error.message : "Favorite failed",
                              "warning",
                            ),
                          )
                      }
                    >
                      <Star aria-hidden="true" />
                    </button>
                    <CopyButton className="icon-action" text={item.text} icon={<Copy aria-hidden="true" />} />
                    <button
                      className="icon-action"
                      type="button"
                      title="Add to compose"
                      aria-label="Add to compose"
                      onClick={() => props.manager.appendToComposer(item.text)}
                    >
                      <Plus aria-hidden="true" />
                    </button>
                    <button
                      className="icon-action"
                      type="button"
                      title="Edit"
                      aria-label="Edit"
                      onClick={() => handleEdit(item)}
                    >
                      <Pencil aria-hidden="true" />
                    </button>
                    <button
                      className="icon-action is-danger"
                      type="button"
                      title="Delete"
                      aria-label="Delete"
                      onClick={() => void handleDelete(item)}
                    >
                      <Trash2 aria-hidden="true" />
                    </button>
                  </div>
                </div>
                <button
                  className="builder-item-main"
                  type="button"
                  onClick={() => handleEdit(item)}
                >
                  <span>{item.title}</span>
                </button>
                <div className="builder-card-tags">
                  {item.tags.length ? (
                    item.tags.slice(0, 4).map((tag) => <span key={tag}>{tag}</span>)
                  ) : (
                    <span>No tags</span>
                  )}
                </div>
                <p className="builder-card-text">{item.text}</p>
              </article>
            ))
          ) : (
            <div className="empty-state">No items found.</div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          hidden
          onChange={handleImportFile}
        />
      </section>

      <button
        className="composer-float-tab"
        type="button"
        aria-expanded={isComposerOpen}
        onClick={() => setIsComposerOpen((current) => !current)}
      >
        <Braces aria-hidden="true" />
        <span>Compose</span>
      </button>

      <section className={`panel-card builder-composer-panel${isComposerOpen ? " is-open" : ""}`}>
        <div className="section-heading">
          <h3>Compose</h3>
          <div className="button-row">
            <button className="ghost-button" type="button" onClick={() => setIsComposerOpen(false)}>
              <span>Close</span>
            </button>
            <button className="ghost-button" type="button" onClick={() => props.manager.setComposerText("")}>
              <Eraser aria-hidden="true" />
              <span>Clear</span>
            </button>
            <CopyButton className="copy-button" text={props.manager.composerText} />
          </div>
        </div>
        <textarea
          className="text-input builder-composer-input"
          spellCheck={false}
          value={props.manager.composerText}
          onChange={(event) => props.manager.setComposerText(event.target.value)}
        />
        <button
          className="ghost-button builder-add-current"
          type="button"
          onClick={() => props.manager.appendToComposer()}
        >
          <Plus aria-hidden="true" />
          <span>Add current</span>
        </button>
      </section>

      {isEditorOpen ? (
        <div className="dialog-backdrop" role="presentation">
          <section
            className="panel-card builder-editor-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="builder-editor-title"
          >
            <div className="section-heading">
              <h3 id="builder-editor-title">Edit</h3>
              <div className="button-row">
                <button className="ghost-button" type="button" onClick={() => setIsEditorOpen(false)}>
                  <span>Cancel</span>
                </button>
                <button className="ghost-button" type="button" onClick={() => void handleDelete()}>
                  <Trash2 aria-hidden="true" />
                  <span>Delete</span>
                </button>
                <button className="copy-button" type="button" onClick={() => void handleSave()}>
                  <Save aria-hidden="true" />
                  <span>Save</span>
                </button>
              </div>
            </div>

            <div className="builder-editor-grid">
              <label className="field">
                <span className="field-header">
                  <span>Title</span>
                  <span className="field-actions">
                    <CopyButton
                      className="icon-action"
                      defaultLabel="Copy title"
                      text={props.manager.draft.title}
                      icon={<Copy aria-hidden="true" />}
                    />
                    <PasteButton
                      title="Paste title"
                      onPaste={(text) =>
                        props.manager.setDraft((current) => ({ ...current, title: text }))
                      }
                    />
                  </span>
                </span>
                <input
                  className="compact-input"
                  type="text"
                  value={props.manager.draft.title}
                  onChange={(event) =>
                    props.manager.setDraft((current) => ({ ...current, title: event.target.value }))
                  }
                />
              </label>
              <label className="field">
                <span className="field-header">
                  <span>Use</span>
                  <CopyButton
                    className="icon-action"
                    defaultLabel="Copy use"
                    text={props.manager.draft.useFor}
                    icon={<Copy aria-hidden="true" />}
                  />
                </span>
                <select
                  className="compact-input"
                  value={props.manager.draft.useFor}
                  onChange={(event) => handleUseForChange(event.target.value)}
                >
                  <option value="both">Both</option>
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                </select>
              </label>
            </div>

            <label className="field">
              <span className="field-header">
                <span>Tags</span>
                <span className="field-actions">
                  <CopyButton
                    className="icon-action"
                    defaultLabel="Copy tags"
                    text={props.manager.draft.tags.join(", ")}
                    icon={<Copy aria-hidden="true" />}
                  />
                  <PasteButton title="Paste tags" onPaste={handleTagsChange} />
                </span>
              </span>
              <input
                className="compact-input"
                type="text"
                value={props.manager.draft.tags.join(", ")}
                onChange={(event) => handleTagsChange(event.target.value)}
              />
            </label>

            <label className="field">
              <span className="field-header">
                <span>Text</span>
                <span className="field-actions">
                  <CopyButton
                    className="icon-action"
                    defaultLabel="Copy text"
                    text={props.manager.draft.text}
                    icon={<Copy aria-hidden="true" />}
                  />
                  <PasteButton
                    title="Paste text"
                    onPaste={(text) =>
                      props.manager.setDraft((current) => ({ ...current, text }))
                    }
                  />
                </span>
              </span>
              <textarea
                className="text-input builder-textarea"
                spellCheck={false}
                value={props.manager.draft.text}
                onChange={(event) =>
                  props.manager.setDraft((current) => ({ ...current, text: event.target.value }))
                }
              />
            </label>
          </section>
        </div>
      ) : null}
    </section>
  );
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Not saved yet";
  }
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function ToastStack(props: { items: ToastItem[] }) {
  return (
    <div className="toast-stack" aria-live="polite" aria-atomic="true">
      {props.items.map((item) => (
        <div key={item.id} className={`toast is-${item.tone}`}>
          {item.message}
        </div>
      ))}
    </div>
  );
}
