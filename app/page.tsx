export default function Home() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <section className="border-b border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex rounded-full border border-slate-300 bg-white px-3 py-1 text-sm font-medium text-slate-600">
              Chicago market intelligence for site selection
            </div>

            <h1 className="text-5xl font-bold tracking-tight text-slate-900 sm:text-6xl">
              Find the best Chicago neighborhoods to open your next business.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              A decision platform for brokers, franchise operators, restaurant
              groups, and investors. Identify underserved neighborhoods using
              business licenses, population, demographics, and other local market
              signals.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="/dashboard"
                className="rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                View dashboard
              </a>
              <a
                href="#reports"
                className="rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
              >
                Explore reports
              </a>
            </div>

            <div className="mt-8 flex flex-wrap gap-6 text-sm text-slate-500">
              <span>Built for retail brokers</span>
              <span>Franchise expansion teams</span>
              <span>Restaurant groups</span>
              <span>Investors</span>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Spot underserved markets</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Compare business density against local population to quickly find
              neighborhoods with lower competition and higher potential.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Move faster on site selection</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Replace hours of manual research with a single view of Chicago
              neighborhoods, business presence, and demand indicators.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Turn data into decisions</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Use data-backed neighborhood rankings to support expansion plans,
              leasing conversations, and investment memos.
            </p>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight">
              What this helps you answer
            </h2>
            <p className="mt-4 text-slate-600">
              Instead of guessing, use local data to answer the questions that
              matter before signing a lease or underwriting a location.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <ul className="space-y-4 text-sm leading-7 text-slate-700">
                <li>Where should I open a coffee shop in Chicago?</li>
                <li>Which neighborhoods look underserved for gyms?</li>
                <li>Where is competition high relative to population?</li>
                <li>Which areas deserve a closer look before touring sites?</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <ul className="space-y-4 text-sm leading-7 text-slate-700">
                <li>Which neighborhoods have room for new retail concepts?</li>
                <li>How can I support a tenant recommendation with data?</li>
                <li>Where should a franchise operator start market research?</li>
                <li>Which submarkets look promising for deeper analysis?</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              Designed for people making real location decisions
            </h2>
            <p className="mt-4 max-w-xl text-slate-600">
              This is not generic demographic data. It is focused market
              intelligence for people trying to decide where a business should go
              next.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 p-5">
              <h3 className="font-semibold">Commercial real estate brokers</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Support tenant recommendations with faster, clearer neighborhood
                analysis.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 p-5">
              <h3 className="font-semibold">Franchise operators</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Identify promising submarkets before spending time on full site
                selection.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 p-5">
              <h3 className="font-semibold">Restaurant groups</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Explore neighborhoods with favorable demand and manageable
                competitive density.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 p-5">
              <h3 className="font-semibold">Investors and developers</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Surface market gaps worth underwriting, validating, or packaging
                into reports.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="reports" className="border-y border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight">
              Two ways to buy
            </h2>
            <p className="mt-4 text-slate-600">
              Use the platform on a recurring basis, or purchase one-off reports
              when you just need answers quickly.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                SaaS access
              </div>
              <h3 className="mt-2 text-2xl font-bold">Subscription</h3>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                Best for brokers, operators, and teams that need ongoing market
                intelligence.
              </p>
              <ul className="mt-6 space-y-3 text-sm text-slate-700">
                <li>Unlimited neighborhood analysis</li>
                <li>Multiple business categories</li>
                <li>Density scoring and rankings</li>
                <li>Exportable results</li>
              </ul>
              <div className="mt-8 text-sm font-medium text-slate-900">
                Planned pricing: monthly subscription
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Premium reports
              </div>
              <h3 className="mt-2 text-2xl font-bold">One-time purchase</h3>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                Best for buyers who do not need recurring access and just want a
                polished market view.
              </p>
              <ul className="mt-6 space-y-3 text-sm text-slate-700">
                <li>Category-specific Chicago market report</li>
                <li>Top neighborhoods and supporting data</li>
                <li>Clear takeaway summary</li>
                <li>Useful for internal sharing and decision support</li>
              </ul>
              <div className="mt-8 text-sm font-medium text-slate-900">
                Planned pricing: premium one-time report
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="rounded-3xl bg-slate-900 px-8 py-12 text-white">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-bold tracking-tight">
              Chicago first. Broader expansion later.
            </h2>
            <p className="mt-4 text-slate-300">
              We are starting with Chicago because the city has rich public data
              and clear neighborhood dynamics. The long-term vision is a broader
              market intelligence platform for site selection across multiple
              cities.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="/dashboard"
                className="rounded-lg bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-200"
              >
                See the dashboard
              </a>
              <a
                href="mailto:hello@example.com"
                className="rounded-lg border border-slate-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Request a demo
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}