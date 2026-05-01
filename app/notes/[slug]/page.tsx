import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getAllNotes, getNoteBySlug, sanitizeMdx } from "@/lib/notes";

type Props = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getAllNotes().map((note) => ({ slug: note.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const note = getNoteBySlug(slug);
  if (!note) return {};
  return {
    title: `${note.title} - Panwoo Security Lab`,
    description: note.excerpt,
  };
}

export default async function NotePage({ params }: Props) {
  const { slug } = await params;
  const note = getNoteBySlug(slug);
  if (!note) notFound();

  return (
    <article className="article">
      <header className="article-header">
        <p className="eyebrow">{note.categories.join(" / ") || "Note"}</p>
        <h1>{note.title}</h1>
        <div className="article-meta">
          <time>{note.date}</time>
          <span>{note.tags.slice(0, 5).join(", ")}</span>
        </div>
      </header>
      <div className="mdx-content">
        <MDXRemote source={sanitizeMdx(note.content)} />
      </div>
    </article>
  );
}
