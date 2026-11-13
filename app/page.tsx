import Link from "next/link";

type IconName =
  | "map"
  | "building"
  | "activity"
  | "permit"
  | "business"
  | "violation"
  | "inspection";

function ToolIcon({
  name,
  className = "h-6 w-6",
}: {
  name: IconName;
  className?: string;
}) {
  const paths: Record<IconName, React.ReactNode> = {
    map: (
      <>
        <path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3z" />
        <path d="M9 3v15M15 6v15" />
      </>
    ),
    building: (
      <>
        <rect x="4" y="3" width="16" height="18" rx="2" />
        <path d="M9 21v-4h6v4M8 7h2M14 7h2M8 11h2M14 11h2" />
      </>
    ),
    activity: (
      <>
        <path d="M5 5h2M10 5h9M5 12h2M10 12h9M5 19h2M10 19h9" />
      </>
    ),
    permit: (
      <>
        <path d="M7 3h7l5 5v13H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
        <path d="M14 3v6h5M9 13h6M9 17h6" />
      </>
    ),
    business: (
      <>
        <path d="M4 10h16v11H4zM3 10l2-6h14l2 6M9 21v-7h6v7" />
        <path d="M3 10h18" />
      </>
    ),
    violation: (
      <>
        <path d="M12 3 2 21h20L12 3z" />
        <path d="M12 9v5M12 18h.01" />
      </>
    ),
    inspection: (
      <>
        <rect x="5" y="5" width="14" height="16" rx="2" />
        <path d="M9 5V3h6v2M9 11l2 2 4-4M9 17h6" />
      </>
    ),
  };

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

const primaryTools: {
  title: string;
  description: string;
  href: string;
  category: string;
  action: string;
  icon: IconName;
}[] = [
  {
    title: "Geographic Explorer",
    description:
      "Explore Chicago's community areas and neighborhoods on an interactive map. Investigate permits, business licenses, inspections, violations, 311 requests, and vacant-building reports.",
    href: "/map",
    category: "Geographic Intelligence",
    action: "Explore the map",
    icon: "map",
  },
  {
    title: "Property Intelligence",
    description:
      "Research Chicago street addresses using permits, violations, business licenses, food inspections, 311 requests, and historical vacancy reports in one timeline.",
    href: "/property",
    category: "Property Research",
    action: "Research a property",
    icon: "building",
  },
];

const recordTools: {
  title: string;
  description: string;
  href: string;
  icon: IconName;
}[] = [
  {
    title: "Commercial Activity Feed",
    description:
      "See recent building permit applications and business license issuances together in one chronological feed.",
    href: "/activity",
    icon: "activity",
  },
  {
    title: "Building Permits",
    description:
      "Discover recent construction, renovations, and development activity across Chicago.",
    href: "/permits",
    icon: "permit",
  },
  {
    title: "New Business Activity",
    description:
      "Find recently issued initial business licenses, business locations, and commercial activity.",
    href: "/businesses",
    icon: "business",
  },
  {
    title: "Building Violations",
    description:
      "Explore reported building code violations, inspection findings, and property maintenance issues.",
    href: "/violations",
    icon: "violation",
  },
  {
    title: "Food Inspection Activity",
    description:
      "Explore food safety inspection results, facility risk classifications, and documented violations.",
    href: "/inspections",
    icon: "inspection",
  },
];

const discoveryQuestions = [
  {
    question: "Where are new businesses receiving licenses?",
    tool: "Business activity",
    href: "/businesses",
  },
  {
    question: "What construction projects are being permitted?",
    tool: "Building permits",
    href: "/permits",
  },
  {
    question: "What's happening recently across Chicago?",
    tool: "Activity feed",
    href: "/activity",
  },
  {
    question: "What public records exist for a property?",
    tool: "Property intelligence",
    href: "/property",
  },
  {
    question: "Where are building code violations being reported?",
    tool: "Building violations",
    href: "/violations",
  },
  {
    question: "Which restaurants have recent inspection results?",
    tool: "Food inspections",
    href: "/inspections",
  },
  {
    question: "How does business activity vary by neighborhood?",
    tool: "Geographic explorer",
    href: "/map",
  },
  {
    question: "Where are vacant buildings being reported?",
    tool: "Geographic explorer",
    href: "/map",
  },
  {
    question: "Which areas are seeing 311 service requests?",
    tool: "Geographic explorer",
    href: "/map",
  },

{
  question: "What has been reported at a specific address?",
  tool: "Property intelligence",
  href: "/property",
},
];

export default function Home() {
  return (
    <div className="bg-white text-slate-900">
      {/* Hero */}
      <section className="border-b border-slate-200 bg-slate-50">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-16 lg:grid-cols-2 lg:gap-14 lg:py-20">
          <div>
            <p className="mb-5 text-sm font-semibold uppercase tracking-widest text-blue-700">
              MetroSift / Chicago
            </p>

            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Find the signal in Chicago&apos;s commercial activity.
            </h1>

            <p className="mt-6 text-lg leading-8 text-slate-600">
              Explore business licenses, construction permits, property
              records, and neighborhood changes in one place.
            </p>

            <p className="mt-4 text-slate-600">
              Research the locations that matter to your business, from
              individual properties to entire Chicago neighborhoods.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/map"
                className="rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                Explore Chicago map
              </Link>

              <Link
                href="/property"
                className="rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
              >
                Research a property
              </Link>
            </div>
          </div>

          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/1.jpg"
              alt="Chicago skyline"
              className="h-full w-full object-cover"
              style={{
                transform: "scale(1.5) translateX(-10%)",
                objectPosition: "55% 65%",
              }}
            />
          </div>
        </div>
      </section>

      {/* Main exploration tools */}
      <section id="tools" className="mx-auto max-w-6xl px-6 py-16">
        <div className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight">
            Explore Chicago
          </h2>

          <p className="mt-3 max-w-2xl text-slate-600">
            Start with a neighborhood or property, or explore individual
            public datasets across Chicago.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {primaryTools.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-blue-300 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:p-7"
            >
              <div className="mb-6 flex items-start justify-between gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                  <ToolIcon name={tool.icon} className="h-7 w-7" />
                </div>

                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                  {tool.category}
                </span>
              </div>

              <h3 className="text-xl font-semibold tracking-tight">
                {tool.title}
              </h3>

              <p className="mt-3 flex-1 text-sm leading-7 text-slate-600">
                {tool.description}
              </p>

              <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-blue-700 group-hover:text-blue-900">
                {tool.action}
                <span aria-hidden="true">&rarr;</span>
              </div>
            </Link>
          ))}
        </div>

        {/* Public record tools */}
        <div className="mt-14">
          <div className="mb-6">
            <h3 className="text-2xl font-bold tracking-tight">
              Explore public records
            </h3>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Focused tools for researching recent activity, business
              records, construction, and inspections.
            </p>
          </div>

          <div className="space-y-3">
            {recordTools.map((tool) => (
              <Link
                key={tool.href}
                href={tool.href}
                className="group flex items-center gap-4 rounded-xl border border-slate-200 bg-white px-5 py-3 shadow-sm transition hover:border-blue-300 hover:bg-slate-50 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:gap-5 sm:px-6"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition group-hover:bg-blue-50 group-hover:text-blue-700">
                  <ToolIcon name={tool.icon} className="h-5 w-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <h4 className="text-base font-semibold text-slate-900">
                    {tool.title}
                  </h4>

                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {tool.description}
                  </p>
                </div>

                <span
                  className="shrink-0 text-xl font-medium text-blue-700 transition group-hover:translate-x-1"
                  aria-hidden="true"
                >
                  &rarr;
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Clickable discovery questions */}

      {/* Clickable discovery questions */}
      <section className="border-y border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="mb-6">
            <h2 className="text-3xl font-bold tracking-tight">
              What would you like to discover?
            </h2>

            <p className="mt-3 max-w-2xl text-slate-600">
              Not sure where to start? Choose a question and we&apos;ll
              take you to the relevant research tool.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {discoveryQuestions.map((item) => {
              const shortLabels: Record<string, string> = {
                "/businesses": "Businesses",
                "/permits": "Permits",
                "/activity": "Activity feed",
                "/property": "Property",
                "/violations": "Violations",
                "/inspections": "Inspections",
                "/map": "Map",
              };

              return (
                <Link
                  key={item.question}
                  href={item.href}
                  className="group flex min-h-16 items-center justify-between gap-5 rounded-xl border border-slate-200 bg-white px-5 py-3 transition hover:border-blue-300 hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                >
                  <span className="min-w-0 flex-1 text-sm font-medium leading-5 text-slate-900">
                    {item.question}
                  </span>

                  <span className="flex shrink-0 items-center gap-2 whitespace-nowrap text-xs font-semibold text-blue-700">
                    {shortLabels[item.href] ?? item.tool}
                    <span
                      className="text-base transition group-hover:translate-x-1"
                      aria-hidden="true"
                    >
                      &rarr;
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Newsletter signup */}
      <section aria-labelledby="newsletter-heading" className="bg-white">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-6 py-10 sm:px-10">
            <div className="max-w-2xl">
              <h2 id="newsletter-heading" className="text-2xl font-bold tracking-tight sm:text-3xl">
                Stay informed about Chicago.
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">
                Get a periodic digest of new business licenses, building permits,
                and noteworthy commercial activity across the city.
              </p>
            </div>

            <form
              action="https://buttondown.com/api/emails/embed-subscribe/metrosift"
              method="post"
              className="mt-7 max-w-xl"
            >
              <label htmlFor="newsletter-email" className="block text-sm font-semibold text-slate-800">
                Email address
              </label>
              <div className="mt-2 flex flex-col gap-3 sm:flex-row">
                <input
                  id="newsletter-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  required
                  className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                >
                  Subscribe
                </button>
              </div>
              <p className="mt-3 text-xs leading-5 text-slate-500">
                Free to subscribe. Unsubscribe anytime. By subscribing, you agree
                to receive MetroSift emails through Buttondown. See our{" "}
                <Link href="/privacy" className="underline underline-offset-2 hover:text-slate-700">
                  privacy policy
                </Link>
                .
              </p>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
