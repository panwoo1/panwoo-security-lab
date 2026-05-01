import { NextResponse } from "next/server";

export const revalidate = 1800;

const feeds = [
  ["KISA 보안공지", "https://www.boho.or.kr/kr/rss.do?bbsId=B0000133"],
  ["KISA 취약점정보", "https://www.boho.or.kr/kr/rss.do?bbsId=B0000302"],
  ["ASEC KR", "https://asec.ahnlab.com/ko/feed/"],
  ["CISA", "https://www.cisa.gov/cybersecurity-advisories/all.xml"],
  ["BleepingComputer", "https://www.bleepingcomputer.com/feed/"],
  ["The Hacker News", "https://feeds.feedburner.com/TheHackersNews"],
] as const;

type NewsItem = {
  source: string;
  title: string;
  url: string;
  published: string;
  summary: string;
  timestamp: number;
};

function text(value: string, tag: string) {
  const match = value.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  return decode(match?.[1] || "");
}

function decode(value: string) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function timestamp(value: string) {
  const parsed = Date.parse(value);
  if (!Number.isNaN(parsed)) return parsed;
  const shortDate = Date.parse(`${value.slice(0, 10)}T00:00:00Z`);
  return Number.isNaN(shortDate) ? 0 : shortDate;
}

async function readFeed(source: string, url: string): Promise<NewsItem[]> {
  const response = await fetch(url, { next: { revalidate: 1800 } });
  const xml = await response.text();
  const itemBlocks = xml.match(/<item[\s\S]*?<\/item>/gi) || [];

  return itemBlocks.slice(0, 10).map((item) => {
    const title = text(item, "title");
    const link = text(item, "link");
    const published = text(item, "pubDate") || text(item, "dc:date") || text(item, "date");
    const summary = text(item, "description").slice(0, 220);
    return {
      source,
      title,
      url: link,
      published,
      summary,
      timestamp: timestamp(published),
    };
  });
}

export async function GET() {
  const settled = await Promise.allSettled(feeds.map(([source, url]) => readFeed(source, url)));
  const items = settled
    .flatMap((result) => (result.status === "fulfilled" ? result.value : []))
    .filter((item) => item.title && item.url)
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 30)
    .map(({ timestamp: _timestamp, ...item }) => item);

  return NextResponse.json({ generated_at: new Date().toISOString(), items });
}
