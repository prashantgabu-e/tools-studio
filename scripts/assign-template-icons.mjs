import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const defaultFiles = ["data/email-templates.json", "data/dm-templates.json"];
const files = process.argv.slice(2);
const targetFiles = files.length ? files : defaultFiles;

const rules = [
  {
    match: /\b(welcome|account active|new account)\b/i,
    iconName: "mail",
    iconTone: "teal",
  },
  {
    match: /\b(address|pin code|landmark|incomplete|unclear)\b/i,
    iconName: "message",
    iconTone: "teal",
  },
  {
    match: /\b(cod|cash on delivery)\b/i,
    iconName: "payment",
    iconTone: "amber",
  },
  {
    match: /\b(confirm|confirmed|confirmation|yes)\b/i,
    iconName: "check",
    iconTone: "emerald",
  },
  {
    match: /\b(ship|shipped|courier|tracking|track|delivery|delivered)\b/i,
    iconName: "truck",
    iconTone: "sky",
  },
  {
    match: /\b(payment|paid|amount|order value)\b/i,
    iconName: "payment",
    iconTone: "amber",
  },
  {
    match: /\b(review|feedback|rating)\b/i,
    iconName: "badge",
    iconTone: "violet",
  },
  {
    match: /\b(cart|abandoned|left something|purchase)\b/i,
    iconName: "gift",
    iconTone: "rose",
  },
  {
    match: /\b(support|help|query|issue|resolved|assistance)\b/i,
    iconName: "secure",
    iconTone: "slate",
  },
  {
    match: /\b(follow up|following up|checking in)\b/i,
    iconName: "send",
    iconTone: "sky",
  },
];

function pickIcon(template) {
  const searchable = [
    template.id,
    template.name,
    template.subject,
    template.body,
  ]
    .filter(Boolean)
    .join(" ");

  const selected =
    rules.find((rule) => rule.match.test(searchable)) ?? {
      iconName: template.subject ? "mail" : "message",
      iconTone: template.subject ? "sky" : "teal",
    };

  return {
    iconName: selected.iconName,
    iconTone: selected.iconTone,
  };
}

async function assignIcons(filePath) {
  const absolutePath = path.resolve(filePath);
  const raw = await readFile(absolutePath, "utf8");
  const templates = JSON.parse(raw);

  if (!Array.isArray(templates)) {
    throw new Error(`${filePath} must contain a JSON array.`);
  }

  const nextTemplates = templates.map((template) => {
    const { match, ...publicTemplate } = template;

    return {
      ...publicTemplate,
      ...pickIcon(publicTemplate),
    };
  });

  await writeFile(absolutePath, `${JSON.stringify(nextTemplates, null, 2)}\n`);
  return nextTemplates.length;
}

for (const file of targetFiles) {
  try {
    const count = await assignIcons(file);
    console.log(`Assigned icons to ${count} templates in ${file}`);
  } catch (error) {
    console.error(`Failed to assign icons in ${file}`);
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
