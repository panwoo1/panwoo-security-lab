import Link from "next/link";
import { NewsFeed } from "@/components/news-feed";
import { getAllNotes } from "@/lib/notes";

export default function DashboardPage() {
  const notes = getAllNotes();
  const recent = notes.slice(0, 6);
  const categoryCount = new Set(notes.flatMap((note) => note.categories)).size;

  return (
    <>
      <section className="hero-grid">
        <div className="hero-card">
          <p className="eyebrow">Private Security Dashboard</p>
          <h1>Panwoo Security Lab</h1>
          <p>Research notes, writeups, and security intelligence in one place.</p>
          <div className="hero-actions">
            <Link className="button primary" href="/notes">
              Notes
            </Link>
          </div>
        </div>
        <div className="status-card">
          <span>Focus</span>
          <strong>Notes</strong>
          <p>Read recent notes first, then check security news when needed.</p>
          <div className="status-actions">
            <Link href="/notes">Recent notes</Link>
            <a href="#security-news">RSS feed</a>
          </div>
        </div>
      </section>

      <section className="metric-grid" aria-label="Dashboard summary">
        <article>
          <span>Notes</span>
          <strong>{notes.length}</strong>
        </article>
        <article>
          <span>Categories</span>
          <strong>{categoryCount}</strong>
        </article>
        <article>
          <span>News</span>
          <strong>RSS</strong>
        </article>
      </section>

      <div className="dashboard-grid">
        <section className="panel notes-panel">
          <div className="panel-heading">
            <div>
              <span className="panel-label">Knowledge Base</span>
              <h2>Recent Notes</h2>
            </div>
            <Link href="/notes">All notes</Link>
          </div>
          <div className="note-grid">
            {recent.map((note) => (
              <Link className="note-card" href={`/notes/${note.slug}`} key={note.slug}>
                <span>{note.date}</span>
                <h3>{note.title}</h3>
                <p>{note.excerpt}</p>
              </Link>
            ))}
          </div>
        </section>
        <NewsFeed />
      </div>
    </>
  );
}
