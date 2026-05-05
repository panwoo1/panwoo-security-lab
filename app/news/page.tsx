import { NewsFeed } from "@/components/news-feed";

export const metadata = {
  title: "News - Panwoo Security Lab",
};

export default function NewsPage() {
  return (
    <section className="page-stack">
      <div className="page-heading">
        <p className="eyebrow">News</p>
        <h1>Security News Feed</h1>
        <p>국내 보안 뉴스를 우선으로 보고, 해외 기사에는 한국어 번역 링크를 함께 제공한다.</p>
      </div>
      <NewsFeed className="news-page-panel" label="Domestic first" limit={30} searchable title="Latest Security News" />
    </section>
  );
}
