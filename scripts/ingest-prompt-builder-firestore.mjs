#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { applicationDefault, cert, getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

const VALID_USE_FOR = new Set(["image", "video", "both"]);

function usage() {
  console.log(`
Usage:
  node scripts/ingest-prompt-builder-firestore.mjs <catalog.json> [options]

Options:
  --mode merge|replace   Merge catalog items by ID (default: merge), or replace the library.
  --dry-run              Validate and report changes without writing to Firestore.
  --project <id>         Firebase project ID (overrides FIREBASE_PROJECT_ID).
  --service-account <path>
                         Service-account JSON file (overrides GOOGLE_APPLICATION_CREDENTIALS).
  --confirm-replace      Required together with --mode replace.
  --help                 Show this help.

Authentication:
  Set GOOGLE_APPLICATION_CREDENTIALS to a Firebase service-account JSON path, or
  use --service-account <path>. Set FIREBASE_PROJECT_ID (or --project <id>) when
  the credential does not determine it.

Examples:
  node scripts/ingest-prompt-builder-firestore.mjs data/prompt-builder-creative-concepts.json --dry-run
  node scripts/ingest-prompt-builder-firestore.mjs data/prompt-builder-quality-tools-detailed.json --mode merge
`);
}

function fail(message) {
  throw new Error(message);
}

function parseArgs(args) {
  const result = { mode: "merge", dryRun: false, confirmReplace: false, file: null, projectId: undefined, serviceAccountPath: undefined };

  for (let index = 0; index < args.length; index += 1) {
    const value = args[index];
    if (value === "--help" || value === "-h") return { help: true };
    if (value === "--dry-run") {
      result.dryRun = true;
      continue;
    }
    if (value === "--confirm-replace") {
      result.confirmReplace = true;
      continue;
    }
    if (value === "--mode" || value === "--project" || value === "--service-account") {
      const next = args[index + 1];
      if (!next || next.startsWith("--")) fail(`Missing value for ${value}.`);
      index += 1;
      if (value === "--mode") result.mode = next;
      if (value === "--project") result.projectId = next;
      if (value === "--service-account") result.serviceAccountPath = next;
      continue;
    }
    if (value.startsWith("--")) fail(`Unknown option: ${value}`);
    if (result.file) fail("Provide exactly one catalog JSON file path.");
    result.file = value;
  }

  if (!result.file) fail("A catalog JSON file path is required.");
  if (!new Set(["merge", "replace"]).has(result.mode)) fail("--mode must be merge or replace.");
  if (result.mode === "replace" && !result.confirmReplace) {
    fail("Replace mode requires --confirm-replace because it overwrites the current Prompt Builder library.");
  }
  return result;
}

function makeShortLabel(label) {
  const words = label.trim().split(/\s+/).filter(Boolean);
  return words.length === 1 ? words[0].slice(0, 8) : words.map((word) => word[0]).join("").slice(0, 8).toUpperCase();
}

function normalizeCatalog(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail("The catalog root must be a JSON object.");
  const source = value;
  const library = source.library && typeof source.library === "object" && !Array.isArray(source.library)
    ? source.library
    : source;
  const rawCategories = Array.isArray(source.categories)
    ? source.categories
    : Object.keys(library)
      .filter((key) => Array.isArray(library[key]))
      .map((id) => ({ id, label: id, shortLabel: makeShortLabel(id) }));

  if (!rawCategories.length) fail("No Prompt Builder categories were found.");

  const categoryIds = new Set();
  const categories = rawCategories.map((rawCategory, index) => {
    if (!rawCategory || typeof rawCategory !== "object") fail(`Category ${index + 1} must be an object.`);
    const id = String(rawCategory.id ?? "").trim();
    const label = String(rawCategory.label ?? "").trim();
    if (!id || !label) fail(`Category ${index + 1} must include id and label.`);
    if (categoryIds.has(id)) fail(`Duplicate category ID: ${id}`);
    categoryIds.add(id);
    return { id, label, shortLabel: String(rawCategory.shortLabel ?? makeShortLabel(label)).trim() || makeShortLabel(label) };
  });

  const ids = new Set();
  const normalizedLibrary = {};
  let itemCount = 0;
  for (const category of categories) {
    const items = library[category.id];
    if (!Array.isArray(items)) fail(`Category "${category.id}" must contain an array in library.`);
    normalizedLibrary[category.id] = items.map((item, index) => {
      if (!item || typeof item !== "object") fail(`${category.id}[${index}] must be an object.`);
      const id = String(item.id ?? "").trim();
      const title = String(item.title ?? "").trim();
      const text = String(item.text ?? "").trim();
      const tags = item.tags;
      const useFor = item.useFor;
      if (!id || !title || !text) fail(`${category.id}[${index}] needs non-empty id, title, and text.`);
      if (ids.has(id)) fail(`Duplicate ingredient ID: ${id}`);
      if (!Array.isArray(tags) || tags.some((tag) => typeof tag !== "string" || !tag.trim())) fail(`${id} must have a tags string array.`);
      if (!VALID_USE_FOR.has(useFor)) fail(`${id} has invalid useFor. Use image, video, or both.`);
      ids.add(id);
      itemCount += 1;
      return { id, title, text, tags: tags.map((tag) => tag.trim()), useFor, favorite: Boolean(item.favorite) };
    });
  }

  return { categories, library: normalizedLibrary, itemCount };
}

function mergeCategories(current, incoming) {
  const byId = new Map((Array.isArray(current) ? current : []).filter((item) => item?.id).map((item) => [item.id, item]));
  incoming.forEach((category) => byId.set(category.id, category));
  return [...byId.values()];
}

function mergeItems(current, incoming) {
  const byId = new Map((Array.isArray(current) ? current : []).filter((item) => item?.id).map((item) => [item.id, item]));
  incoming.forEach((item) => byId.set(item.id, item));
  return [...byId.values()];
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    usage();
    return;
  }

  const catalogPath = resolve(options.file);
  if (!existsSync(catalogPath)) fail(`Catalog file not found: ${catalogPath}`);
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(catalogPath, "utf8"));
  } catch (error) {
    fail(`Could not parse JSON: ${error instanceof Error ? error.message : "unknown error"}`);
  }
  const catalog = normalizeCatalog(parsed);
  console.log(`Validated ${catalogPath}: ${catalog.categories.length} categories, ${catalog.itemCount} ingredients.`);

  if (options.dryRun) {
    console.log("Dry run complete. No Firestore data was changed.");
    return;
  }

  const serviceAccountPath = options.serviceAccountPath ?? process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const projectId = options.projectId ?? process.env.FIREBASE_PROJECT_ID ?? process.env.VITE_FIREBASE_PROJECT_ID;
  let credential = applicationDefault();
  if (serviceAccountPath) {
    const resolvedServiceAccountPath = resolve(serviceAccountPath);
    if (!existsSync(resolvedServiceAccountPath)) fail(`Service-account file not found: ${resolvedServiceAccountPath}`);
    try {
      credential = cert(JSON.parse(readFileSync(resolvedServiceAccountPath, "utf8")));
    } catch (error) {
      fail(`Could not read service-account JSON: ${error instanceof Error ? error.message : "unknown error"}`);
    }
  }

  const app = getApps()[0] ?? initializeApp({ credential, ...(projectId ? { projectId } : {}) });
  const db = getFirestore(app);
  const documentRef = db.collection("promptBuilder").doc("library");
  const snapshot = await documentRef.get();
  const existing = snapshot.exists ? snapshot.data() ?? {} : {};

  const nextCategories = options.mode === "replace"
    ? catalog.categories
    : mergeCategories(existing.categories, catalog.categories);
  const nextLibrary = {};
  for (const category of nextCategories) {
    nextLibrary[category.id] = options.mode === "replace"
      ? (catalog.library[category.id] ?? [])
      : mergeItems(existing[category.id], catalog.library[category.id] ?? []);
  }

  await documentRef.set({ categories: nextCategories, ...nextLibrary, updatedAt: FieldValue.serverTimestamp() });
  const action = options.mode === "replace" ? "Replaced" : "Merged";
  console.log(`${action} ${catalog.itemCount} ingredients into Firestore document promptBuilder/library.`);
}

main().catch((error) => {
  console.error(`Ingestion failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
