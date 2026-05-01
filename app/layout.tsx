import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Panwoo Security Lab",
  description: "Personal security dashboard, CTF workflow, notes, and security intelligence.",
};

const nav = [
  { href: "/", label: "Dashboard" },
  { href: "/notes", label: "Notes" },
  { href: "/notes/2026-04-29-ctf-offline-all-in-one-guide", label: "CTF Guide" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <header className="site-header">
          <div className="header-inner">
            <Link className="brand" href="/">
              <span aria-hidden="true">P</span>
              <strong>
                Panwoo Security Lab
                <small>private dashboard</small>
              </strong>
            </Link>
            <nav className="site-nav" aria-label="Main navigation">
              {nav.map((item) => (
                <Link key={item.href} href={item.href}>
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <main className="site-main">{children}</main>
      </body>
    </html>
  );
}
