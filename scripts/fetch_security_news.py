#!/usr/bin/env python3
import email.utils
import html
import json
import re
import sys
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path

FEEDS = [
    ("KISA 보안공지", "https://www.boho.or.kr/kr/rss.do?bbsId=B0000133"),
    ("KISA 취약점정보", "https://www.boho.or.kr/kr/rss.do?bbsId=B0000302"),
    ("ASEC KR", "https://asec.ahnlab.com/ko/feed/"),
    ("CISA", "https://www.cisa.gov/cybersecurity-advisories/all.xml"),
    ("BleepingComputer", "https://www.bleepingcomputer.com/feed/"),
    ("The Hacker News", "https://feeds.feedburner.com/TheHackersNews"),
]

OUT = Path("assets/data/security-news.json")
MAX_ITEMS = 30


def clean(value):
    value = html.unescape(value or "")
    value = re.sub(r"<[^>]+>", " ", value)
    return re.sub(r"\s+", " ", value).strip()


def first_text(node, names):
    for name in names:
        found = node.find(name)
        if found is not None and found.text:
            return found.text
    return ""


def parsed_date(value):
    if not value:
        return datetime.min.replace(tzinfo=timezone.utc)
    try:
        parsed = email.utils.parsedate_to_datetime(value)
        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=timezone.utc)
        return parsed
    except Exception:
        pass
    for fmt in ("%Y-%m-%d", "%Y.%m.%d", "%Y/%m/%d"):
        try:
            return datetime.strptime(value[:10], fmt).replace(tzinfo=timezone.utc)
        except Exception:
            pass
    return datetime.min.replace(tzinfo=timezone.utc)


def fetch_feed(source, url):
    request = urllib.request.Request(url, headers={"User-Agent": "PanwooSecurityLab/1.0"})
    with urllib.request.urlopen(request, timeout=20) as response:
        data = response.read()

    root = ET.fromstring(data)
    items = []

    for item in root.findall(".//item"):
        title = clean(first_text(item, ["title"]))
        link = clean(first_text(item, ["link"]))
        published = clean(first_text(item, ["pubDate", "date", "{http://purl.org/dc/elements/1.1/}date"]))
        summary = clean(first_text(item, ["description", "summary"]))
        if title and link:
            items.append(
                {
                    "source": source,
                    "title": title,
                    "url": link,
                    "published": published,
                    "summary": summary[:220],
                    "_date": parsed_date(published).isoformat(),
                }
            )

    return items


def main():
    all_items = []
    errors = []
    for source, url in FEEDS:
        try:
            all_items.extend(fetch_feed(source, url))
        except Exception as exc:
            errors.append(f"{source}: {exc}")

    all_items.sort(key=lambda item: item["_date"], reverse=True)
    for item in all_items:
        item.pop("_date", None)

    payload = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "items": all_items[:MAX_ITEMS],
        "errors": errors,
    }

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"wrote {OUT} with {len(payload['items'])} items")
    if errors:
        print("feed errors:", "; ".join(errors), file=sys.stderr)


if __name__ == "__main__":
    main()
