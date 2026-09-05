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
- Prompt Builder workspace for reusable image/video prompt ingredients such as lighting, poses, shots, compositions, camera, lenses, styles, moods, motion, negative prompts, and formulas
- Firestore-backed template storage with add, edit, delete, list, import, export, and starter sync flows
- Google sign-in with per-user template collections
- Route-based navigation with `HashRouter` for GitHub Pages compatibility
- Mobile-friendly interface

## Tech Stack

- Vite
- React
- TypeScript
- React Router with `HashRouter`
- Firebase Auth
- Cloud Firestore
- Custom CSS
- Lucide React
- JSON data files for starter templates

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
|-- prompt-builder-library.json
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

Create `.env.local` from `.env.example` and fill it with your Firebase web app config before starting the app.

## Build and Deployment

```bash
npm run build
```

The app builds to `docs/`, which is intended for GitHub Pages deployment from `master` + `/docs`.

## Firebase Setup

1. Create a Firebase project and a web app in the Firebase console.
2. Enable Authentication with the Google provider.
3. Add your local and GitHub Pages domains to Firebase Authentication authorized domains:
   - `localhost`
   - `127.0.0.1`
   - `prashantgabu-e.github.io`
4. Create a Cloud Firestore database.
5. Use rules like this to keep each user's templates private:

```txt
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Data Behavior

Template edits are stored in Cloud Firestore under `users/{uid}`. The JSON files in this repo remain starter content and can be pushed into Firestore through the in-app sync flow.

Prompt Builder stores the full ingredient library in one Firestore document at `users/{uid}/promptBuilder/library` to keep reads and writes low. Bulk imports accept a JSON object with category arrays such as `lighting`, `poses`, `shots`, `compositions`, `cameras`, `lenses`, `styles`, `moods`, `colors`, `environments`, `subjects`, `wardrobeProps`, `motion`, `videoMoves`, `rendering`, `negativePrompts`, `platformPresets`, and `formulas`.
