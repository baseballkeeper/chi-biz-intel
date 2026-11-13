
import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "MetroSift | Chicago Business & Property Intelligence",
    template: "%s | MetroSift",
  },
  description:
    "Explore Chicago business activity, building permits, property records, licenses, inspections, and neighborhood intelligence.",
  applicationName: "MetroSift",
};

const navigation = [
  { label: "Property", href: "/property" },
  { label: "Activity", href: "/activity" },
  { label: "Permits", href: "/permits" },
  { label: "Businesses", href: "/businesses" },
  { label: "About", href: "/about" },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-white text-slate-900 antialiased`}
      >
        <div className="flex min-h-screen flex-col">
          <header className="border-b border-slate-200 bg-white">
            <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-5 px-6 py-4">
              <Link
                href="/"
                className="text-2xl font-extrabold tracking-tight text-slate-950"
              >
                Metro<span className="text-blue-700">Sift</span>
              </Link>

              <nav
                aria-label="Main navigation"
                className="flex flex-wrap items-center gap-2"
              >
                {navigation.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                  >
                    {item.label}
                  </Link>
                ))}

                <Link
                  href="/map"
                  className="ml-1 inline-flex items-center gap-2 rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                >
                  Explore Map
                  <span aria-hidden="true">&nearr;</span>
                </Link>
              </nav>
            </div>
          </header>

          <main id="main-content" className="w-full flex-1">
            {children}
          </main>

          <footer className="border-t border-slate-800 bg-slate-900 text-slate-300">
            <div className="mx-auto max-w-7xl px-6 py-10">
              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr]">
                <div>
                  <Link
                    href="/"
                    className="text-xl font-bold tracking-tight text-white"
                  >
                    MetroSift
                  </Link>

                  <p className="mt-2 text-sm text-slate-300">
                    Find the signal in your city.
                  </p>
                </div>

                <nav aria-label="Platform links">
                  <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
                    Platform
                  </h2>

                  <div className="flex flex-col items-start gap-2 text-sm">
                    <Link href="/about" className="hover:text-white">
                      About
                    </Link>
                    <Link href="/contact" className="hover:text-white">
                      Contact
                    </Link>
                  </div>
                </nav>

                <nav aria-label="Resources and legal links">
                  <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
                    Resources &amp; Legal
                  </h2>

                  <div className="flex flex-col items-start gap-2 text-sm">
                    <Link
                      href="/methodology"
                      className="hover:text-white"
                    >
                      Data &amp; Methodology
                    </Link>
                    <Link href="/terms" className="hover:text-white">
                      Terms of Use
                    </Link>
                    <Link href="/privacy" className="hover:text-white">
                      Privacy Policy
                    </Link>
                  </div>
                </nav>
              </div>

              <div className="mt-8 border-t border-slate-700 pt-5">
                <p className="max-w-5xl text-xs leading-6 text-slate-400">
                  MetroSift is an independent information platform and is
                  not affiliated with or endorsed by the City of Chicago.
                  Public records may be incomplete, delayed, or
                  subsequently updated. Reports, applications, and
                  complaints do not necessarily represent verified
                  conditions or completed activity. Refer to original
                  government records for authoritative information.
                </p>
              </div>

              <div className="mt-5 flex flex-col justify-between gap-3 text-xs text-slate-400 sm:flex-row">
                <span>
                  &copy; {new Date().getFullYear()} MetroSift.
                  All rights reserved.
                </span>

                <a
                  href="https://data.cityofchicago.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-300 transition hover:text-white"
                >
                  City of Chicago Open Data Portal &nearr;
                </a>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
