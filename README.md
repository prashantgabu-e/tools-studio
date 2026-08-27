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
- Mobile-friendly single-page interface

## Tech Stack

- HTML
- CSS
- Vanilla JavaScript
- JSON data files for bundled templates

## Project Structure

```text
.
|-- index.html
|-- styles.css
|-- script.js
|-- email-templates.json
|-- dm-templates.json
|-- prompt-templates.json
|-- gen-ai-prompt-templates.json
`-- deploy.ps1
```

## Local Development

Because this is a static site, you can open `index.html` directly in a browser or serve the folder with any simple local web server.

## Data Behavior

Template edits are stored in the browser with `localStorage`. The JSON files in this repo act as bundled starter content that can also be synced or imported from within the UI.
