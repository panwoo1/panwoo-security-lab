"use client";

import { useEffect, useState } from "react";

type NewsItem = {
  source: string;
  title: string;
  url: string;
  published: string;
  summary: string;
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ko", { month: "short", day: "numeric" }).format(date);
}

export function NewsFeed() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    fetch("/api/news")
      .then((response) => response.json())
      .then((payload) => setItems(payload.items || []))
      .catch(() => setFailed(true));
  }, []);

  return (
    <section className="panel news-panel">
      <div className="panel-heading">
        <div>
          <span className="panel-label">Intel</span>
          <h2>Security News</h2>
        </div>
      </div>
      <div className="news-list">
        {failed ? <p className="empty-state">Security news is unavailable.</p> : null}
        {!failed && items.length === 0 ? <p className="empty-state">Loading security news...</p> : null}
        {items.slice(0, 12).map((item) => (
          <article className="news-item" key={`${item.source}-${item.url}`}>
            <div>
              <span>{item.source}</span>
              <time>{formatDate(item.published)}</time>
            </div>
            <a href={item.url} target="_blank" rel="noreferrer">
              {item.title}
            </a>
            {item.summary ? <p>{item.summary}</p> : null}
          </article>
        ))}
      </div>
    </section>
  );
}
