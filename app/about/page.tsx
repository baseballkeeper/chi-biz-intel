
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn about MetroSift, an independent platform making local business, property, and neighborhood intelligence easier to discover.",
};

const audiences = [
  {
    title: "Commercial Real Estate",
    description:
      "Explore construction activity, business licensing, property records, and neighborhood changes to support location research.",
  },
  {
    title: "Business Owners",
    description:
      "Understand the commercial landscape around existing or prospective business locations.",
  },
  {
    title: "Investors & Researchers",
    description:
      "Investigate public records, identify patterns, and explore changes across Chicago communities.",
  },
];

export default function AboutPage() {
  return (
    <div className="bg-white text-slate-900">
      <section className="border-b border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-5xl px-6 py-14">
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-700">
            About MetroSift
          </p>

          <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
            Find the signal in your city.
          </h1>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">
            MetroSift makes local business, property, and
            neighborhood information easier to find, explore,
            and understand.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-5xl space-y-16 px-6 py-14">
        <section>
          <h2 className="text-2xl font-bold tracking-tight">
            What is MetroSift?
          </h2>

          <p className="mt-4 leading-8 text-slate-600">
            MetroSift is an independent local intelligence
            platform that brings public records together into
            accessible research tools.
          </p>

          <p className="mt-4 leading-8 text-slate-600">
            Instead of navigating multiple government datasets,
            users can investigate business activity, construction
            permits, property records, inspections, and reported
            neighborhood conditions in one place.
          </p>

          <p className="mt-4 leading-8 text-slate-600">
            We're starting in Chicago, with the goal of
            eventually bringing the same approach to other cities.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold tracking-tight">
            Who is MetroSift for?
          </h2>

          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {audiences.map((audience) => (
              <article
                key={audience.title}
                className="rounded-xl border border-slate-200 bg-white p-6"
              >
                <h3 className="text-lg font-semibold">
                  {audience.title}
                </h3>

                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {audience.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold tracking-tight">
            Why we're building it
          </h2>

          <p className="mt-4 leading-8 text-slate-600">
            Cities publish enormous amounts of useful information,
            but that information is often spread across separate
            datasets, difficult to compare, and challenging to
            interpret without technical experience.
          </p>

          <p className="mt-4 leading-8 text-slate-600">
            MetroSift aims to make that information more
            approachable while preserving the context and
            limitations that matter.
          </p>

          <p className="mt-4 leading-8 text-slate-600">
            Our guiding principle is simple: less noise,
            more useful information.
          </p>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-slate-50 p-8">
          <h2 className="text-2xl font-bold tracking-tight">
            What comes next?
          </h2>

          <p className="mt-4 leading-8 text-slate-600">
            We're developing MetroSift toward a more complete
            commercial and neighborhood intelligence platform.
            Planned capabilities include neighborhood monitoring,
            commercial activity reports, saved research areas,
            and email intelligence briefings.
          </p>

          <p className="mt-4 leading-8 text-slate-600">
            Our longer-term vision is to expand beyond Chicago,
            making local intelligence accessible across
            multiple cities.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold tracking-tight">
            Independent by design
          </h2>

          <p className="mt-4 leading-8 text-slate-600">
            MetroSift is independently developed and is not
            affiliated with or endorsed by the City of Chicago.
            Our information is intended to support research,
            not replace official records or professional advice.
          </p>

          <p className="mt-4 leading-8 text-slate-600">
            Learn more about our sources, interpretations, and
            limitations on our{" "}
            <Link
              href="/methodology"
              className="font-semibold text-blue-700 hover:text-blue-900"
            >
              Data &amp; Methodology
            </Link>{" "}
            page.
          </p>
        </section>

        <div className="flex flex-wrap gap-3 border-t border-slate-200 pt-8">
          <Link
            href="/map"
            className="rounded-lg bg-blue-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-800"
          >
            Explore Chicago
          </Link>

          <Link
            href="/"
            className="rounded-lg border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Back to homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
