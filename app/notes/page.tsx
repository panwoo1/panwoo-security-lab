import Link from "next/link";
import { getAllNotes } from "@/lib/notes";

export const metadata = {
  title: "Notes - Panwoo Security Lab",
};

export default function NotesPage() {
  const notes = getAllNotes();

  return (
    <section className="page-stack">
      <div className="page-heading">
        <p className="eyebrow">Notes</p>
        <h1>Writeups and Research Notes</h1>
        <p>CTF 풀이, 보안 학습, 알고리즘과 리버싱 기록을 모아둔 공간이다.</p>
      </div>
      <div className="note-list">
        {notes.map((note) => (
          <Link className="note-row" href={`/notes/${note.slug}`} key={note.slug}>
            <div>
              <span>{note.date}</span>
              <h2>{note.title}</h2>
              <p>{note.excerpt}</p>
            </div>
            <strong>{note.categories.join(", ")}</strong>
          </Link>
        ))}
      </div>
    </section>
  );
}
