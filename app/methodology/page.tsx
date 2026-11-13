
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Data & Methodology",
  description:
    "Learn how MetroSift uses Chicago public records, interprets data, and communicates limitations.",
};

const datasets = [
  {
    name: "Building Permits",
    source: "Chicago Building Permits",
    id: "ydr8-5enu",
    description:
      "Records of permitted construction, renovation, demolition, and other building-related activity.",
    limitations:
      "A permit does not necessarily mean work has started or been completed. Permit descriptions and classifications may vary.",
  },
  {
    name: "Business Licenses",
    source: "Chicago Business Licenses",
    id: "uupf-x98q",
    description:
      "Licensing records that can help identify businesses, locations, license classifications, and changes in commercial activity.",
    limitations:
      "A license application, issuance, or renewal does not independently confirm that a business has opened, remains operating, or occupies a location.",
  },
  {
    name: "Food Inspections",
    source: "Chicago Food Inspections",
    id: "4ijn-s7e5",
    description:
      "Inspection records for food establishments, including inspection dates, results, risk classifications, and reported findings.",
    limitations:
      "Results reflect information recorded at the time of an inspection. They do not necessarily describe a facility's current conditions.",
  },
  {
    name: "Building Violations",
    source: "Chicago Building Violations",
    id: "22u3-xenr",
    description:
      "Recorded building-code violations and related inspection information.",
    limitations:
      "A recorded violation may have been corrected or its status may have changed. Consult the original records for updates.",
  },
  {
    name: "311 Service Requests",
    source: "Chicago 311 Service Requests",
    id: "v6vf-nfxy",
    description:
      "Modern 311 service-request records that help identify reported issues and municipal service activity.",
    limitations:
      "A 311 request is a report, not independent verification that the reported condition exists. Multiple requests may concern the same issue.",
  },
  {
    name: "Vacant Building Reports",
    source: "Chicago Vacant and Abandoned Buildings",
    id: "7nii-7srd",
    description:
      "Historical reports concerning potentially vacant or abandoned buildings. This dataset is an archive, with records ending in December 2018.",
    limitations:
      "Historical reports must not be interpreted as proof that a property is currently vacant, abandoned, or available for lease or purchase.",
  },
];

export default function MethodologyPage() {
  return (
    <div className="bg-white text-slate-900">
      <section className="border-b border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-5xl px-6 py-14">
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-700">
            MetroSift / Transparency
          </p>

          <h1 className="mt-4 text-4xl font-bold tracking-tight">
            Data &amp; Methodology
          </h1>

          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">
            Understanding what public records tell us, what they
            cannot tell us, and how to use MetroSift responsibly.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-5xl space-y-14 px-6 py-14">
        <section>
          <h2 className="text-2xl font-bold tracking-tight">
            Our approach
          </h2>

          <p className="mt-4 leading-8 text-slate-600">
            MetroSift brings publicly available information into
            geographic and property-focused research tools. Our
            goal is to make it easier to discover patterns, explore
            locations, and investigate changes across Chicago.
          </p>

          <p className="mt-4 leading-8 text-slate-600">
            MetroSift does not independently verify every record.
            Information presented on the platform should be treated
            as a starting point for research rather than a definitive
            assessment of a property, business, or neighborhood.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold tracking-tight">
            Primary data source
          </h2>

          <p className="mt-4 leading-8 text-slate-600">
            Our current Chicago tools primarily use datasets
            published through the City of Chicago Open Data Portal.
            These datasets are maintained and updated by the
            responsible public agencies.
          </p>

          <a
            href="https://data.cityofchicago.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-block font-semibold text-blue-700 hover:text-blue-900"
          >
            Visit the City of Chicago Open Data Portal ↗
          </a>
        </section>

        <section>
          <h2 className="text-2xl font-bold tracking-tight">
            Datasets used by MetroSift
          </h2>

          <p className="mt-4 leading-8 text-slate-600">
            The following datasets support our current Chicago
            research tools. Each dataset has its own reporting
            practices, definitions, and limitations.
          </p>

          <div className="mt-8 space-y-5">
            {datasets.map((dataset) => (
              <article
                key={dataset.id}
                className="rounded-xl border border-slate-200 bg-white p-6"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-lg font-bold">
                    {dataset.name}
                  </h3>

                  <span className="rounded-full bg-slate-100 px-3 py-1 font-mono text-xs text-slate-600">
                    {dataset.id}
                  </span>
                </div>

                <p className="mt-3 leading-7 text-slate-600">
                  {dataset.description}
                </p>

                <div className="mt-5 rounded-lg bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Important limitation
                  </p>

                  <p className="mt-2 text-sm leading-7 text-slate-700">
                    {dataset.limitations}
                  </p>
                </div>

                <a
                  href={`https://data.cityofchicago.org/resource/${dataset.id}.json`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-block text-sm font-semibold text-blue-700 hover:text-blue-900"
                >
                  View source dataset ↗
                </a>
              </article>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold tracking-tight">
            Geographic interpretation
          </h2>

          <p className="mt-4 leading-8 text-slate-600">
            MetroSift presents information geographically using
            available addresses, coordinates, community-area
            information, and other location fields. Geographic
            matching depends on the completeness and accuracy of
            the underlying records.
          </p>

          <p className="mt-4 leading-8 text-slate-600">
            Some records may lack usable location information,
            contain inconsistent addresses, or appear near
            geographic boundaries. Counts and mapped results
            should not be assumed to include every relevant
            record in an area.
          </p>

          <p className="mt-4 leading-8 text-slate-600">
            Chicago has 77 official community areas. Neighborhood
            names and boundaries are less standardized, so
            neighborhood-based views may use approximate
            geographic definitions.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold tracking-tight">
            Historical versus current information
          </h2>

          <p className="mt-4 leading-8 text-slate-600">
            Different datasets cover different time periods.
            In particular, MetroSift distinguishes historical
            vacant-building reports from modern 311 service
            requests. These sources should not be treated as
            interchangeable evidence of present-day conditions.
          </p>

          <p className="mt-4 leading-8 text-slate-600">
            Record dates may represent an application, issuance,
            inspection, report, or update rather than the date
            an underlying real-world event occurred.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold tracking-tight">
            Updates and availability
          </h2>

          <p className="mt-4 leading-8 text-slate-600">
            Public datasets can be updated, corrected, or removed
            by their publishers. MetroSift may retrieve information
            from those sources at different times depending on
            the tool being used.
          </p>

          <p className="mt-4 leading-8 text-slate-600">
            We do not currently guarantee a particular update
            schedule, uninterrupted availability, or completeness
            of third-party records.
          </p>
        </section>

        <section className="rounded-2xl border border-blue-100 bg-blue-50 p-6">
          <h2 className="text-xl font-bold tracking-tight">
            Using MetroSift for business decisions
          </h2>

          <p className="mt-3 leading-8 text-slate-700">
            MetroSift is intended to support research and
            discovery. A building permit is not proof of completed
            construction. A business license is not proof of
            occupancy. A service request is not a verified
            property condition. Historical vacancy reports do
            not establish current vacancy.
          </p>

          <p className="mt-3 leading-8 text-slate-700">
            Before making leasing, purchasing, investment,
            financing, or other consequential decisions,
            verify relevant information with original records
            and appropriate qualified professionals.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold tracking-tight">
            Independence
          </h2>

          <p className="mt-4 leading-8 text-slate-600">
            MetroSift is an independent platform and is not
            affiliated with, sponsored by, or endorsed by the
            City of Chicago or its departments.
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
