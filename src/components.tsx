import { useRef, useState, type ChangeEvent, type ReactNode } from "react";
import { NavLink } from "react-router-dom";
import {
  Braces,
  Copy,
  Download,
  Eraser,
  FileInput,
  FileText,
  Inbox,
  Mail,
  Menu,
  MessageCircleMore,
  PanelLeft,
  Plus,
  RefreshCcw,
  Save,
  Sparkles,
  Star,
  Trash2,
  Type,
  WandSparkles,
} from "lucide-react";
import type {
  BasicTemplate,
  PromptBuilderCategory,
  PromptBuilderLibrary,
  PromptBuilderUseFor,
  PromptIngredient,
  PromptTemplate,
  ToastItem,
  ToastTone,
} from "./types";
import { downloadJson, extractVariableNames, placeholderText, transforms } from "./utils";

type NavItem = {
  label: string;
  to: string;
  icon: ReactNode;
};

const navigationItems: NavItem[] = [
  { label: "Builder", to: "/prompt-builder", icon: <Braces aria-hidden="true" /> },
  { label: "AI", to: "/gen-ai-prompts", icon: <Sparkles aria-hidden="true" /> },
  { label: "Prompts", to: "/prompt-templates", icon: <WandSparkles aria-hidden="true" /> },
  { label: "Messages", to: "/dm-templates", icon: <MessageCircleMore aria-hidden="true" /> },
  { label: "Emails", to: "/email-templates", icon: <Mail aria-hidden="true" /> },
  { label: "Text", to: "/", icon: <Type aria-hidden="true" /> },
];

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
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  setVariableValues: React.Dispatch<
    React.SetStateAction<Record<string, string>>
  >;
  syncFromSource: () => Promise<void>;
  templates: BasicTemplate[];
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
  saveTemplate: () => Promise<void>;
  searchQuery: string;
  selectedId: string | null;
  setDraft: React.Dispatch<React.SetStateAction<PromptTemplate>>;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  setVariableValues: React.Dispatch<
    React.SetStateAction<Record<string, string>>
  >;
  syncFromSource: () => Promise<void>;
  templates: PromptTemplate[];
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
  deleteIngredient: () => Promise<PromptIngredient | null>;
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
  syncFromSource: () => Promise<void>;
  toggleFavorite: (item: PromptIngredient) => Promise<void>;
  totalItems: number;
};

export function Sidebar(props: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <aside className={`sidebar${props.collapsed ? " is-collapsed" : ""}`}>
      <div className="sidebar-top">
        <div className="brand-block">
          <p className="app-kicker">Toolbox</p>
          <h1 className="app-title">Text Studio</h1>
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
      <span>{props.authError ?? "Sign in to sync"}</span>
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
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  async function handleSync() {
    const confirmed = window.confirm(
      `Sync ${props.sectionLabel.toLowerCase()} from ${props.importFileName}? This will replace the current local templates for this section.`,
    );
    if (!confirmed) {
      return;
    }
    try {
      await props.manager.syncFromSource();
      props.onToast(`${props.sectionLabel} synced to Firestore`, "success");
    } catch (error) {
      props.onToast(error instanceof Error ? error.message : "Sync failed", "warning");
    }
  }

  function handleExport() {
    downloadJson(props.importFileName, props.manager.templates);
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
    <section className="view-panel">
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
            <ToolbarActionButton
              onClick={handleSync}
              icon={<RefreshCcw aria-hidden="true" />}
              title="Sync from JSON"
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
                <button
                  key={item.id}
                  type="button"
                  className={`template-list-item${item.id === props.manager.selectedId ? " is-active" : ""}`}
                  onClick={() => props.manager.selectTemplate(item.id)}
                >
                  <p className="template-list-name">{item.name}</p>
                  <p className="template-list-meta">
                    {extractVariableNames([item.subject, item.body]).length} variables
                  </p>
                </button>
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
          <section className="panel-card template-editor-panel">
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
              <label className="field">
                <span>Name</span>
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
            </div>

            {props.hasSubject ? (
              <label className="field">
                <span>Subject</span>
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
              <span>{props.bodyLabel}</span>
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

          <section className="panel-card template-variable-panel">
            <div className="section-heading">
              <h3>Variables</h3>
            </div>
            <div className="variable-summary">
              {props.manager.variables.length ? (
                props.manager.variables.map((name) => (
                  <div key={name} className="variable-pill">
                    {`{{${name}}}`}
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  No variables found. Use {`{{name}}`} style placeholders.
                </div>
              )}
            </div>
            <div className="variable-grid">
              {props.manager.variables.length ? (
                props.manager.variables.map((name) => (
                  <label key={name} className="variable-chip">
                    <code>{`{{${name}}}`}</code>
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
                ))
              ) : (
                <div className="empty-state">
                  No variables found. Use {`{{name}}`} style placeholders.
                </div>
              )}
            </div>
          </section>

          <section className="panel-card template-preview-panel">
            <div className="section-heading sticky-heading">
              <h3>Preview</h3>
            </div>
            <div className="preview-card">
              {props.hasSubject ? (
                <div className="preview-block">
                  <div className="preview-block-header">
                    <p className="preview-label">Subject</p>
                    <CopyButton
                      className="ghost-button"
                      defaultLabel={props.copySubjectLabel ?? "Copy Subject"}
                      text={props.manager.renderedSubject}
                      icon={<Mail aria-hidden="true" />}
                    />
                  </div>
                  <pre className="preview-output">{props.manager.renderedSubject}</pre>
                </div>
              ) : null}
              <div className="preview-block">
                <div className="preview-block-header">
                  <p className="preview-label">{props.bodyLabel}</p>
                  <div className="button-row">
                    {props.hasSubject ? (
                      <CopyButton
                        className="ghost-button"
                        defaultLabel={props.copyBodyLabel ?? "Copy Body"}
                        text={props.manager.renderedBody}
                        icon={<FileText aria-hidden="true" />}
                      />
                    ) : null}
                    <CopyButton
                      className="ghost-button"
                      defaultLabel="Copy Raw"
                      text={
                        props.hasSubject
                          ? `${props.manager.draft.subject}\n\n${props.manager.draft.body}`
                          : props.manager.draft.body
                      }
                      icon={<Braces aria-hidden="true" />}
                    />
                    <CopyButton
                      className="ghost-button"
                      defaultLabel="Copy Rendered"
                      text={
                        props.hasSubject
                          ? `Subject: ${props.manager.renderedSubject}\n\n${props.manager.renderedBody}`.trim()
                          : props.manager.renderedBody.trim()
                      }
                    />
                  </div>
                </div>
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

  async function handleSync() {
    const confirmed = window.confirm(
      `Sync ${props.sectionLabel.toLowerCase()} from ${props.importFileName}? This will replace the current local templates for this section.`,
    );
    if (!confirmed) {
      return;
    }
    try {
      await props.manager.syncFromSource();
      props.onToast(`${props.sectionLabel} synced to Firestore`, "success");
    } catch (error) {
      props.onToast(error instanceof Error ? error.message : "Sync failed", "warning");
    }
  }

  function handleExport() {
    downloadJson(props.importFileName, props.manager.templates);
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
    <section className="view-panel">
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
            <ToolbarActionButton
              onClick={handleSync}
              icon={<RefreshCcw aria-hidden="true" />}
              title="Sync from JSON"
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
                <button
                  key={item.id}
                  type="button"
                  className={`template-list-item${item.id === props.manager.selectedId ? " is-active" : ""}`}
                  onClick={() => props.manager.selectTemplate(item.id)}
                >
                  <p className="template-list-name">{item.title}</p>
                  <p className="template-list-meta">
                    {item.categories || "No categories"} •{" "}
                    {extractVariableNames([item.prompt, item.sampleInputTemplate]).length} variables
                  </p>
                </button>
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
          <section className="panel-card template-editor-panel">
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
                <span>Title</span>
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
                <span>Categories</span>
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
              <span>Prompt</span>
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
              <span>Sample Input Template</span>
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
              <span>Sample Output</span>
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

          <section className="panel-card template-variable-panel">
            <div className="section-heading">
              <h3>Variables</h3>
            </div>
            <div className="variable-summary">
              {props.manager.variables.length ? (
                props.manager.variables.map((name) => (
                  <div key={name} className="variable-pill">
                    {`{{${name}}}`}
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  No variables found. Use {`{{name}}`} style placeholders.
                </div>
              )}
            </div>
            <div className="variable-grid">
              {props.manager.variables.length ? (
                props.manager.variables.map((name) => (
                  <label key={name} className="variable-chip">
                    <code>{`{{${name}}}`}</code>
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
                ))
              ) : (
                <div className="empty-state">
                  No variables found. Use {`{{name}}`} style placeholders.
                </div>
              )}
            </div>
          </section>

          <section className="panel-card template-preview-panel">
            <div className="section-heading sticky-heading">
              <h3>Preview</h3>
            </div>
            <div className="preview-card">
              <div className="preview-block">
                <div className="preview-block-header">
                  <p className="preview-label">Rendered Prompt</p>
                  <div className="button-row">
                    <CopyButton
                      className="ghost-button"
                      defaultLabel="Copy Prompt"
                      text={props.manager.draft.prompt}
                      icon={<WandSparkles aria-hidden="true" />}
                    />
                    <CopyButton
                      className="ghost-button"
                      defaultLabel="Copy Rendered Prompt"
                      text={props.manager.renderedPrompt}
                    />
                    <CopyButton
                      className="copy-button"
                      defaultLabel="Use Prompt"
                      text={props.manager.renderedPrompt}
                      icon={<Sparkles aria-hidden="true" />}
                    />
                  </div>
                </div>
                <pre className="preview-output">{props.manager.renderedPrompt}</pre>
              </div>

              <div className="preview-block">
                <div className="preview-block-header">
                  <p className="preview-label">Rendered Sample Input</p>
                  <div className="button-row">
                    <CopyButton
                      className="ghost-button"
                      defaultLabel="Copy Sample Input"
                      text={props.manager.draft.sampleInputTemplate}
                      icon={<Braces aria-hidden="true" />}
                    />
                    <CopyButton
                      className="ghost-button"
                      defaultLabel="Copy Rendered Input"
                      text={props.manager.renderedSampleInput}
                      icon={<Inbox aria-hidden="true" />}
                    />
                  </div>
                </div>
                <pre className="preview-output">{props.manager.renderedSampleInput}</pre>
              </div>

              <div className="preview-block">
                <div className="preview-block-header">
                  <p className="preview-label">Sample Output</p>
                  <CopyButton
                    className="ghost-button"
                    defaultLabel="Copy Sample Output"
                    text={props.manager.draft.sampleOutput}
                    icon={<FileText aria-hidden="true" />}
                  />
                </div>
                <pre className="preview-output">{props.manager.draft.sampleOutput}</pre>
              </div>
            </div>
          </section>
        </section>
      </section>
    </section>
  );
}

export function PromptBuilderView(props: {
  manager: PromptBuilderManagerShape;
  onToast: (message: string, tone?: ToastTone) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [importMode, setImportMode] = useState<"merge" | "replace">("merge");

  const activeCategory = props.manager.categories.find(
    (item) => item.id === props.manager.selectedCategory,
  );

  async function handleSave() {
    try {
      await props.manager.saveIngredient();
      props.onToast(`${props.manager.draft.title || "Ingredient"} saved`, "success");
    } catch (error) {
      props.onToast(error instanceof Error ? error.message : "Save failed", "warning");
    }
  }

  async function handleDelete() {
    if (!props.manager.selectedId) {
      return;
    }
    const confirmed = window.confirm(
      `Delete "${props.manager.draft.title || "this ingredient"}"? This cannot be undone.`,
    );
    if (!confirmed) {
      return;
    }

    try {
      const deleted = await props.manager.deleteIngredient();
      if (deleted) {
        props.onToast(`${deleted.title} deleted`, "warning");
      }
    } catch (error) {
      props.onToast(error instanceof Error ? error.message : "Delete failed", "warning");
    }
  }

  async function handleSync() {
    const confirmed = window.confirm(
      "Replace your Firestore builder library with the bundled starter library?",
    );
    if (!confirmed) {
      return;
    }

    try {
      await props.manager.syncFromSource();
      props.onToast("Starter library synced", "success");
    } catch (error) {
      props.onToast(error instanceof Error ? error.message : "Sync failed", "warning");
    }
  }

  function handleImportClick(mode: "merge" | "replace") {
    setImportMode(mode);
    fileInputRef.current?.click();
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
          <button className="ghost-button" type="button" onClick={props.manager.createNewIngredient}>
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
              <span>{category.shortLabel}</span>
              <strong>{props.manager.library[category.id].length}</strong>
            </button>
          ))}
        </div>
      </section>

      <section className="panel-card builder-list-panel">
        <div className="section-heading">
          <h3>{activeCategory?.label ?? "Items"}</h3>
          <div className="template-toolbar is-tight">
            <ToolbarActionButton
              onClick={() => handleImportClick("merge")}
              icon={<FileInput aria-hidden="true" />}
              title="Merge import"
            />
            <ToolbarActionButton
              onClick={() => handleImportClick("replace")}
              icon={<Download aria-hidden="true" />}
              title="Replace all"
            />
            <ToolbarActionButton
              onClick={handleSync}
              icon={<RefreshCcw aria-hidden="true" />}
              title="Sync starter library"
            />
          </div>
        </div>
        <input
          className="compact-input"
          type="search"
          placeholder="Search..."
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
                <button
                  className="builder-item-main"
                  type="button"
                  onClick={() => props.manager.selectIngredient(item.id)}
                >
                  <span>{item.title}</span>
                  <small>
                    {item.useFor} · {item.tags.join(", ") || "no tags"}
                  </small>
                </button>
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
                    title="Add to composer"
                    aria-label="Add to composer"
                    onClick={() => props.manager.appendToComposer(item.text)}
                  >
                    <Plus aria-hidden="true" />
                  </button>
                </div>
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

      <section className="panel-card builder-editor-panel">
        <div className="section-heading">
          <h3>Edit</h3>
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

        <div className="builder-editor-grid">
          <label className="field">
            <span>Title</span>
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
            <span>Use</span>
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
          <span>Tags</span>
          <input
            className="compact-input"
            type="text"
            value={props.manager.draft.tags.join(", ")}
            onChange={(event) => handleTagsChange(event.target.value)}
          />
        </label>

        <label className="field">
          <span>Text</span>
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

      <section className="panel-card builder-composer-panel">
        <div className="section-heading">
          <h3>Compose</h3>
          <div className="button-row">
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
    </section>
  );
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
