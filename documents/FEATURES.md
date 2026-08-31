# Features

## Text Transformation

### Multi-output text conversion workspace

- What it does: Renders a single input textarea and produces multiple derived outputs at once, including uppercase, lowercase, title case, sentence case, capitalized words, trimmed spacing, reversed text, and slug output.
- Entry point: `TextToolsView` in [`src/components.tsx`](/E:/Learnings/Projects/other-tools/src/components.tsx:154), wired to the `/` route in [`src/App.tsx`](/E:/Learnings/Projects/other-tools/src/App.tsx:145), using `transforms` from [`src/utils.ts`](/E:/Learnings/Projects/other-tools/src/utils.ts:5).
- Notable edge cases handled:
  - Empty outputs show a placeholder message instead of blank content.
  - Character counting uses spread iteration, which counts Unicode code points more safely than `string.length`.
  - Slug generation strips non-letter/non-number runs with a Unicode-aware regex.
  - Sentence and capitalization helpers use Unicode-aware regexes, so they are not limited to ASCII letters.

### Input metrics in the top bar

- What it does: Displays live character and word counts while the text tools route is active.
- Entry point: `topbarMeta` in [`src/App.tsx`](/E:/Learnings/Projects/other-tools/src/App.tsx:104), using `countCharacters` and `countWords` from [`src/utils.ts`](/E:/Learnings/Projects/other-tools/src/utils.ts:65).
- Notable edge cases handled:
  - Word count returns `0` for all-whitespace input.
  - Character count treats multi-byte characters as individual code points.

## Email Template Management

### Seeded email template catalog with local persistence

- What it does: Loads bundled email templates, lets users edit them, and persists changes in browser storage.
- Entry point: Email manager creation in [`src/App.tsx`](/E:/Learnings/Projects/other-tools/src/App.tsx:60), powered by `useBasicTemplateManager` in [`src/hooks.ts`](/E:/Learnings/Projects/other-tools/src/hooks.ts:33).
- Notable edge cases handled:
  - Invalid `localStorage` JSON is caught and removed before falling back to defaults.
  - Missing IDs or fields in imported/default data are normalized into usable template objects.
  - Saving updates an existing template in place when IDs match; otherwise it prepends a new template.

### Email template editor, preview, and copy actions

- What it does: Provides form fields for name, subject, and body; extracts variables; renders preview text; and offers separate copy actions for subject, body, raw content, and rendered content.
- Entry point: `BasicTemplateView` in [`src/components.tsx`](/E:/Learnings/Projects/other-tools/src/components.tsx:265), mounted on `/email-templates` in [`src/App.tsx`](/E:/Learnings/Projects/other-tools/src/App.tsx:155).
- Notable edge cases handled:
  - Placeholder variables are preserved as `{{name}}` when no value has been entered.
  - Copy buttons show temporary `Empty`, `Copied`, or `Select text` states depending on the outcome.
  - Deletion is guarded by a confirmation dialog and no-ops when nothing is selected.

### Search, import, export, and sync for email templates

- What it does: Filters templates by query and supports importing JSON, exporting the current list, and resetting to bundled source JSON.
- Entry point: Toolbar and file input logic inside [`src/components.tsx`](/E:/Learnings/Projects/other-tools/src/components.tsx:265), with normalization/import logic in [`src/hooks.ts`](/E:/Learnings/Projects/other-tools/src/hooks.ts:144) and JSON download support in [`src/utils.ts`](/E:/Learnings/Projects/other-tools/src/utils.ts:142).
- Notable edge cases handled:
  - Non-array or invalid JSON imports are treated defensively; invalid JSON triggers a warning toast.
  - Sync requires confirmation because it replaces the section’s current local templates.
  - Search matches across template name, subject, and body.

## Direct Message Template Management

### DM template catalog with the same editing workflow minus subject lines

- What it does: Offers the same CRUD, preview, variable rendering, import/export, sync, and search flow as email templates, but for body-only direct message templates.
- Entry point: DM manager creation in [`src/App.tsx`](/E:/Learnings/Projects/other-tools/src/App.tsx:66) and `BasicTemplateView` mounted on `/dm-templates` in [`src/App.tsx`](/E:/Learnings/Projects/other-tools/src/App.tsx:174).
- Notable edge cases handled:
  - The view conditionally removes the subject editor and subject preview/copy actions when `hasSubject` is `false`.
  - Normalization forces `subject` to an empty string for DM templates even if source items contain other values.

## Prompt Template Management

### Prompt template catalog with categories and sample artifacts

- What it does: Manages prompt records containing title, categories, prompt text, sample input template, and sample output.
- Entry point: Prompt manager creation in [`src/App.tsx`](/E:/Learnings/Projects/other-tools/src/App.tsx:72), powered by `usePromptTemplateManager` in [`src/hooks.ts`](/E:/Learnings/Projects/other-tools/src/hooks.ts:194).
- Notable edge cases handled:
  - Invalid stored JSON is removed from `localStorage` before fallback.
  - Missing fields in imported data are normalized to empty strings and generated IDs.

### Rendered prompt and sample input previews with variable extraction

- What it does: Detects `{{variable}}` tokens from prompt text and sample input templates, lets users provide replacement values, and renders filled previews.
- Entry point: `PromptTemplateView` in [`src/components.tsx`](/E:/Learnings/Projects/other-tools/src/components.tsx:578), plus `applyVariables` and `extractVariableNames` in [`src/utils.ts`](/E:/Learnings/Projects/other-tools/src/utils.ts:80).
- Notable edge cases handled:
  - Variables are deduplicated before display.
  - Missing replacement values leave the original placeholder visible instead of dropping text.
  - Variable state is rebuilt when the active draft’s variable set changes, preserving existing entered values where names still match.

### Search, import, export, sync, and copy flows for prompt templates

- What it does: Supports searching prompt records, importing/exporting JSON, resetting to bundled data, and copying raw or rendered prompt assets.
- Entry point: Prompt toolbar, file input, and preview action buttons in [`src/components.tsx`](/E:/Learnings/Projects/other-tools/src/components.tsx:578).
- Notable edge cases handled:
  - Search spans title, categories, prompt, sample input template, and sample output.
  - Sync and delete operations require confirmation.
  - The “Use Prompt” action is implemented as a copy-to-clipboard button, not a deeper workflow integration.

## Gen AI Prompt Template Management

### Separate Gen AI prompt workspace with isolated storage

- What it does: Reuses the prompt-template UI and behavior for a second prompt catalog intended for Gen AI prompts.
- Entry point: Gen AI manager creation in [`src/App.tsx`](/E:/Learnings/Projects/other-tools/src/App.tsx:77) and route mounting on `/gen-ai-prompts` in [`src/App.tsx`](/E:/Learnings/Projects/other-tools/src/App.tsx:203).
- Notable edge cases handled:
  - Data is isolated from the standard prompt catalog by a separate `localStorage` key.
  - Because it shares `PromptTemplateView`, it inherits the same validation, rendering, import/export, and preview behavior.

## Shared Application Behavior

### Route-based workspace navigation

- What it does: Exposes five route-driven sections through a persistent sidebar: text tools, email templates, DM templates, prompt templates, and Gen AI prompt templates.
- Entry point: `routeMeta` and `<Routes>` in [`src/App.tsx`](/E:/Learnings/Projects/other-tools/src/App.tsx:26), sidebar links in [`src/components.tsx`](/E:/Learnings/Projects/other-tools/src/components.tsx).
- Notable edge cases handled:
  - Unknown routes redirect to `/`.
  - Active route detection matches exact `/` for the home page and prefix matches for the other sections.

### Responsive sidebar behavior

- What it does: Allows manual sidebar collapse on wider screens and disables that collapse behavior on narrow screens.
- Entry point: `toggleSidebar` and resize handling in [`src/App.tsx`](/E:/Learnings/Projects/other-tools/src/App.tsx:84) and responsive CSS in [`src/styles.css`](/E:/Learnings/Projects/other-tools/src/styles.css).
- Notable edge cases handled:
  - Clicking the toggle does nothing when `window.innerWidth <= 820`.
  - On resize into small-screen mode, the effect forces the sidebar back to expanded behavior.

### Toast notifications

- What it does: Shows short-lived success or warning notifications for actions such as save, import, sync, and delete.
- Entry point: `useToasts` in [`src/hooks.ts`](/E:/Learnings/Projects/other-tools/src/hooks.ts:10) and `ToastStack` in [`src/components.tsx`](/E:/Learnings/Projects/other-tools/src/components.tsx:922).
- Notable edge cases handled:
  - Toast IDs combine time and randomness to reduce collisions.
  - Each toast self-removes after 2200 ms.

### Accessibility and motion accommodations

- What it does: Includes screen-reader-only labels and reduces motion when the browser requests it.
- Entry point: `sr-only` label usage in [`src/components.tsx`](/E:/Learnings/Projects/other-tools/src/components.tsx) and `prefers-reduced-motion` CSS in [`src/styles.css`](/E:/Learnings/Projects/other-tools/src/styles.css:717).
- Notable edge cases handled:
  - Hidden labels are used for fields like the main text input and icon-only toolbar buttons.
  - Motion-related transitions and animations are disabled when the reduced-motion media query is active.
