import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const notesDir = path.join(process.cwd(), "content", "notes");

export type Note = {
  slug: string;
  title: string;
  date: string;
  categories: string[];
  tags: string[];
  excerpt: string;
  content: string;
};

function asList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === "string" && value.trim()) return [value];
  return [];
}

function slugFromFile(file: string) {
  return file.replace(/\.(md|mdx)$/, "");
}

function dateFromSlug(slug: string) {
  const match = slug.match(/^(\d{4}-\d{2}-\d{2})/);
  return match?.[1] || "";
}

function excerpt(content: string) {
  return content
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/[#>*_`[\](){}]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 150);
}

export function getAllNotes(): Note[] {
  return fs
    .readdirSync(notesDir)
    .filter((file) => /\.(md|mdx)$/.test(file))
    .map((file) => {
      const slug = slugFromFile(file);
      const raw = fs.readFileSync(path.join(notesDir, file), "utf8");
      const parsed = matter(raw);
      const date = parsed.data.date
        ? new Date(parsed.data.date).toISOString().slice(0, 10)
        : dateFromSlug(slug);

      return {
        slug,
        title: String(parsed.data.title || slug),
        date,
        categories: asList(parsed.data.categories),
        tags: asList(parsed.data.tags),
        excerpt: excerpt(parsed.content),
        content: parsed.content,
      };
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function getNoteBySlug(slug: string) {
  return getAllNotes().find((note) => note.slug === slug);
}

export function sanitizeMdx(content: string) {
  const lines = content
    .replaceAll("{% raw %}", "")
    .replaceAll("{% endraw %}", "")
    .split("\n");

  let fenced = false;
  return lines
    .map((line) => {
      if (line.trim().startsWith("```")) {
        fenced = !fenced;
        return line;
      }
      if (fenced) return line;
      return line
        .replace(/\{:\s*[^}]+\}/g, "")
        .replaceAll("{", "&#123;")
        .replaceAll("}", "&#125;");
    })
    .join("\n");
}
