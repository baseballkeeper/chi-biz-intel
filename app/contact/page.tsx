
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact MetroSift about public data, property research, business intelligence, and general inquiries.",
};

const contactTopics = [
  {
    title: "General Inquiries",
    description:
      "Questions about MetroSift, its capabilities, or the information available through the platform.",
  },
  {
    title: "Data Questions & Corrections",
    description:
      "Questions about source records, potential inaccuracies, or how information is presented.",
  },
  {
    title: "Business & Partnerships",
    description:
      "Commercial intelligence needs, potential collaborations, and professional use cases.",
  },
  {
    title: "Privacy & Legal",
    description:
      "Questions concerning our Terms of Use, Privacy Policy, or the handling of information.",
  },
];

export default function ContactPage() {
  return (
    <div className="bg-white text-slate-900">
      <section className="border-b border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-5xl px-6 py-14">
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-700">
            MetroSift / Contact
          </p>

          <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
            Get in touch.
          </h1>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">
            Have a question about MetroSift, our data, or how
            the platform could support your research?
            We'd like to hear from you.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-5xl space-y-14 px-6 py-14">
        <section>
          <h2 className="text-2xl font-bold tracking-tight">
            How can we help?
          </h2>

          <p className="mt-4 max-w-3xl leading-8 text-slate-600">
            MetroSift is an independent business and property
            intelligence platform operated by MPM Ventures LLC.
            We welcome questions, feedback, and inquiries
            concerning our research tools.
          </p>

          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {contactTopics.map((topic) => (
              <article
                key={topic.title}
                className="rounded-xl border border-slate-200 bg-white p-6"
              >
                <h3 className="text-lg font-semibold">
                  {topic.title}
                </h3>

                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {topic.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-slate-50 p-8">
          <h2 className="text-2xl font-bold tracking-tight">
            Contact information
          </h2>

          <p className="mt-4 leading-8 text-slate-600">
            We're preparing a dedicated MetroSift contact
            email address. Contact details will be published
            here once that address is configured.
          </p>

          <p className="mt-4 text-sm text-slate-500">
            Operated by MPM Ventures LLC.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold tracking-tight">
            Questions about public records?
          </h2>

          <p className="mt-4 leading-8 text-slate-600">
            MetroSift displays information from public sources,
            including the City of Chicago Open Data Portal.
            We do not maintain the underlying government
            records or have authority to change them.
          </p>

          <p className="mt-4 leading-8 text-slate-600">
            If a government record is inaccurate, you may
            need to contact the agency responsible for
            publishing it. For questions about how
            MetroSift presents a record, see our{" "}
            <Link
              href="/methodology"
              className="font-semibold text-blue-700 hover:text-blue-900"
            >
              Data &amp; Methodology
            </Link>{" "}
            page.
          </p>
        </section>

        <div className="border-t border-slate-200 pt-8">
          <Link
            href="/"
            className="text-sm font-semibold text-blue-700 hover:text-blue-900"
          >
            ← Back to MetroSift
          </Link>
        </div>
      </div>
    </div>
  );
}
