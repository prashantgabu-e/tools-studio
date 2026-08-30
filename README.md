# Text Studio

Text Studio is a lightweight browser-based toolkit for transforming text and managing reusable writing templates from a single interface.

## Live Site

GitHub Pages: https://prashantgabu-e.github.io/tools-studio/

## Features

- Instant text transformations such as uppercase, lowercase, title case, sentence case, slug generation, trimmed spacing, and reversed text
- Email template management with subjects, message bodies, variable placeholders, and preview support
- Direct message template management with placeholder-based rendering
- Prompt template workspace with categories, sample input, sample output, and copy-ready previews
- Gen AI prompt template workspace for storing reusable prompt patterns
- Import, export, and sync flows for the bundled JSON template files
- Route-based navigation with `HashRouter` for GitHub Pages compatibility
- Mobile-friendly interface

## Tech Stack

- Vite
- React
- TypeScript
- React Router with `HashRouter`
- Custom CSS
- Lucide React
- JSON data files for bundled templates

## Project Structure

```text
.
|-- docs/
|-- src/
|   |-- App.tsx
|   |-- components.tsx
|   |-- hooks.ts
|   |-- main.tsx
|   |-- styles.css
|   |-- types.ts
|   `-- utils.ts
|-- email-templates.json
|-- dm-templates.json
|-- prompt-templates.json
|-- gen-ai-prompt-templates.json
|-- index.html
|-- package.json
|-- tsconfig.app.json
|-- tsconfig.json
|-- vite.config.ts
`-- deploy.ps1
```

## Local Development

```bash
npm install
npm run dev
```

## Build and Deployment

```bash
npm run build
```

The app builds to `docs/`, which is intended for GitHub Pages deployment from `master` + `/docs`.

## Data Behavior

Template edits are stored in the browser with `localStorage`. The JSON files in this repo remain the bundled starter content and can be restored through the in-app sync flow or replaced through JSON import.
