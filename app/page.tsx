import Link from "next/link";
import { NewsFeed } from "@/components/news-feed";
import { ProxyLauncher } from "@/components/proxy-launcher";
import { getAllNotes } from "@/lib/notes";

export default function DashboardPage() {
  const notes = getAllNotes();
  const recent = notes.slice(0, 6);
  const ctfCount = notes.filter((note) => note.categories.includes("CTF")).length;

  return (
    <>
      <section className="hero-grid">
        <div className="hero-card">
          <p className="eyebrow">Private Security Dashboard</p>
          <h1>CTF와 보안 작업을 한 화면에서 관리한다.</h1>
          <p>
            DreamHack 프록시, 보안 뉴스, CTF 자료, 개인 writeup을 Next.js 앱으로 묶은 전용
            대시보드다.
          </p>
          <div className="hero-actions">
            <Link className="button primary" href="/notes">
              Notes
            </Link>
            <a className="button" href="/files/ctf_offline_all_in_one_guide.pdf">
              CTF PDF
            </a>
          </div>
        </div>
        <div className="status-card">
          <span>Runtime</span>
          <strong>Next.js</strong>
          <p>Use a hosted Node runtime for the DreamHack reverse proxy.</p>
        </div>
      </section>

      <section className="metric-grid" aria-label="Dashboard summary">
        <article>
          <span>Notes</span>
          <strong>{notes.length}</strong>
        </article>
        <article>
          <span>CTF</span>
          <strong>{ctfCount}</strong>
        </article>
        <article>
          <span>Proxy</span>
          <strong>Node</strong>
        </article>
        <article>
          <span>News</span>
          <strong>RSS</strong>
        </article>
      </section>

      <div className="dashboard-grid">
        <ProxyLauncher />
        <NewsFeed />
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
      </div>
    </>
  );
}
