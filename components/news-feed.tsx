"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type NewsItem = {
  source: string;
  region: "domestic" | "global";
  slug: string;
  title: string;
  url: string;
  translateUrl: string;
  published: string;
  summary: string;
};

type Props = {
  limit?: number;
  title?: string;
  label?: string;
  className?: string;
  searchable?: boolean;
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ko", { month: "short", day: "numeric" }).format(date);
}

function normalize(value: string) {
  return value.trim().toLowerCase();
}

export function NewsFeed({
  limit = 12,
  title = "Security News",
  label = "Intel",
  className = "",
  searchable = false,
}: Props) {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [failed, setFailed] = useState(false);
  const [query, setQuery] = useState("");
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

  useEffect(() => {
    const newsUrl = basePath ? `${basePath}/assets/data/security-news.json` : "/api/news/";

    fetch(newsUrl)
      .then((response) => response.json())
      .then((payload) => setItems(payload.items || []))
      .catch(() => setFailed(true));
  }, [basePath]);

  const filteredItems = useMemo(() => {
    const normalizedQuery = normalize(query);
    if (!normalizedQuery) return items;

    return items.filter((item) =>
      [item.title, item.summary, item.source, item.region, item.published].join(" ").toLowerCase().includes(normalizedQuery),
    );
  }, [items, query]);

  const visibleItems = filteredItems.slice(0, limit);

  return (
    <section className={`panel news-panel ${className}`} id="security-news">
      <div className="panel-heading">
        <div>
          <span className="panel-label">{label}</span>
          <h2>{title}</h2>
        </div>
      </div>
      {searchable ? (
        <div className="news-search-panel">
          <label className="news-search">
            <span>Search news</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search title, summary, source..."
              type="search"
            />
          </label>
          <p aria-live="polite">
            {filteredItems.length} news
            {query.trim() ? " matched" : ""}
          </p>
        </div>
      ) : null}
      <div className="news-list">
        {failed ? <p className="empty-state">Security news is unavailable.</p> : null}
        {!failed && items.length === 0 ? <p className="empty-state">Loading security news...</p> : null}
        {!failed && items.length > 0 && visibleItems.length === 0 ? (
          <p className="empty-state">No news match this search.</p>
        ) : null}
        {visibleItems.map((item) => (
          <article className="news-item" key={`${item.source}-${item.url}`}>
            <div>
              <span>
                {item.source}
                <em>{item.region === "domestic" ? "국내" : "해외"}</em>
              </span>
              <time>{formatDate(item.published)}</time>
            </div>
            <Link href={`/news/${item.slug}`}>
              {item.title}
            </Link>
            {item.summary ? <p>{item.summary}</p> : null}
            {item.translateUrl ? (
              <a className="translate-link" href={item.translateUrl} target="_blank" rel="noreferrer">
                한국어 번역본 보기
              </a>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
