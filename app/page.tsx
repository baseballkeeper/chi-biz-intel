
const tools = [
  {
    title: "Neighborhood Explorer",
    description:
      "Compare Chicago neighborhoods using business density, population, and local market indicators.",
    href: "/dashboard",
    category: "Market Research",
    action: "Explore neighborhoods",
  },
  {
    title: "Building Permits",
    description:
      "Discover recent construction, renovations, and development activity across Chicago.",
    href: "/permits",
    category: "Construction Activity",
    action: "Explore permits",
  },
  {
    title: "New Business Activity",
    description:
      "Find recently issued initial business licenses, business locations, and commercial activity.",
    href: "/businesses",
    category: "Business Intelligence",
    action: "Explore businesses",
  },
]

const upcoming = [
  {
    title: "Building Violations",
    description:
      "Explore building code violations and property maintenance activity.",
  },
  {
    title: "Restaurant Intelligence",
    description:
      "Research food inspection results and restaurant activity.",
  },
  {
    title: "Neighborhood Trends",
    description:
      "Explore additional indicators and changes across Chicago neighborhoods.",
  },
]

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <section className="border-b border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="max-w-4xl">
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
              Understand what&apos;s happening across Chicago.
            </h1>

            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">
              Explore business activity, construction permits,
              neighborhood trends, and other local intelligence
              in one place.
            </p>

            <p className="mt-4 max-w-3xl text-slate-600">
              Built for entrepreneurs, contractors, investors,
              researchers, and anyone making decisions using
              Chicago public data.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#tools"
                className="rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                Explore tools
              </a>
            </div>
          </div>
        </div>
      </section>

      <section
        id="tools"
        className="mx-auto max-w-6xl px-6 py-16"
      >
        <div className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight">
            Explore Chicago
          </h2>

          <p className="mt-3 max-w-2xl text-slate-600">
            Choose a tool to explore public data.
            Each tool focuses on a different part of
            Chicago&apos;s business and neighborhood activity.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {tools.map((tool) => (
            <a
              key={tool.href}
              href={tool.href}
              className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-400 hover:shadow-md"
            >
              <div className="mb-5">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                  {tool.category}
                </span>
              </div>

              <h3 className="text-xl font-semibold">
                {tool.title}
              </h3>

              <p className="mt-3 flex-1 text-sm leading-7 text-slate-600">
                {tool.description}
              </p>

              <div className="mt-6 text-sm font-semibold text-blue-700 group-hover:text-blue-900">
                {tool.action} →
              </div>
            </a>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="text-3xl font-bold tracking-tight">
            What can you discover?
          </h2>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {[
              "Which neighborhoods have fewer competing businesses?",
              "Where are new businesses receiving licenses?",
              "What construction projects are being permitted?",
              "Which areas are experiencing commercial activity?",
              "Where could new investment opportunities emerge?",
              "How are Chicago neighborhoods changing?",
            ].map((question) => (
              <div
                key={question}
                className="rounded-xl border border-slate-200 bg-white p-5 text-sm font-medium text-slate-700"
              >
                {question}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight">
            More Chicago data to explore
          </h2>

          <p className="mt-3 text-slate-600">
            Additional public datasets and research tools
            are being evaluated for inclusion.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {upcoming.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-6"
            >
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Planned
              </span>

              <h3 className="mt-3 text-lg font-semibold">
                {item.title}
              </h3>

              <p className="mt-3 text-sm leading-7 text-slate-600">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-slate-800 bg-slate-900 text-white">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="grid gap-10 md:grid-cols-2">
            <div>
              <h2 className="text-xl font-bold">
                Chicago Business Intelligence
              </h2>

              <p className="mt-4 max-w-md text-sm leading-7 text-slate-300">
                A resource for exploring Chicago business,
                property, and neighborhood information
                through publicly available data.
              </p>

              <p className="mt-4 text-sm leading-7 text-slate-400">
                Making local information easier to find,
                understand, and use.
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
                Data &amp; Sources
              </h3>

              <p className="mt-4 text-sm leading-7 text-slate-300">
                Data is primarily sourced from the
                City of Chicago&apos;s official Open Data Portal,
                which publishes public datasets maintained
                by city departments and agencies.
              </p>

              <a
                href="https://data.cityofchicago.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-block text-sm font-medium text-white underline decoration-slate-500 underline-offset-4 hover:decoration-white"
              >
                Visit the City of Chicago Open Data Portal ↗
              </a>
            </div>
          </div>

          <div className="mt-10 border-t border-slate-700 pt-6">
            <p className="text-xs leading-6 text-slate-400">
              Chicago Business Intelligence is an independent
              resource and is not affiliated with or endorsed
              by the City of Chicago. Public datasets may
              contain errors, omissions, or reporting delays.
              Refer to the original source for official records.
            </p>
          </div>
        </div>
      </footer>
    </main>
  )
}
