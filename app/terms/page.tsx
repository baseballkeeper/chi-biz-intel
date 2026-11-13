
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Use",
  description:
    "Terms governing access to and use of the MetroSift platform.",
};

const effectiveDate = "November 12, 2026";

export default function TermsPage() {
  return (
    <div className="bg-white text-slate-900">
      <section className="border-b border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-4xl px-6 py-14">
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-700">
            MetroSift / Legal
          </p>

          <h1 className="mt-4 text-4xl font-bold tracking-tight">
            Terms of Use
          </h1>

          <p className="mt-4 text-sm text-slate-500">
            Draft effective date: {effectiveDate}
          </p>

          <p className="mt-6 text-lg leading-8 text-slate-600">
            These Terms govern access to and use of MetroSift,
            an independent information platform operated by
            MPM Ventures LLC.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl space-y-12 px-6 py-14 leading-8 text-slate-700">
        <section>
          <h2 className="text-2xl font-bold text-slate-900">
            1. Acceptance of Terms
          </h2>

          <p className="mt-4">
            By accessing or using MetroSift, you agree to
            these Terms of Use. If you do not agree, you
            should not use the platform.
          </p>

          <p className="mt-4">
            In these Terms, "MetroSift," "we," "us," and
            "our" refer to MPM Ventures LLC, the operator
            of the MetroSift platform.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900">
            2. Description of Service
          </h2>

          <p className="mt-4">
            MetroSift provides tools for exploring publicly
            available business, property, construction,
            inspection, municipal service, and geographic
            information.
          </p>

          <p className="mt-4">
            The platform may organize, filter, summarize,
            visualize, or otherwise present information
            obtained from public sources.
          </p>

          <p className="mt-4">
            Features, geographic coverage, and data sources
            may change over time. We may modify, suspend,
            or discontinue features or services.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900">
            3. Public Data and Accuracy
          </h2>

          <p className="mt-4">
            MetroSift relies in part on information published
            by government agencies and other third parties.
            We do not independently verify every record.
          </p>

          <p className="mt-4">
            Records may be incomplete, inaccurate, outdated,
            duplicated, delayed, corrected, or removed by
            their original publishers.
          </p>

          <p className="mt-4">
            A building permit does not establish that work
            has begun or been completed. A business license
            does not establish that a business is operating.
            A 311 service request does not independently
            verify the reported condition. A historical
            vacant-building report does not establish
            current vacancy.
          </p>

          <p className="mt-4">
            Users are responsible for checking original
            sources when accuracy or current status is
            important.
          </p>

          <p className="mt-4">
            Additional information about our sources and
            interpretations is available on our{" "}
            <Link
              href="/methodology"
              className="font-semibold text-blue-700 hover:text-blue-900"
            >
              Data &amp; Methodology
            </Link>{" "}
            page.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900">
            4. No Professional Advice
          </h2>

          <p className="mt-4">
            MetroSift provides information for general
            research and informational purposes only.
          </p>

          <p className="mt-4">
            Nothing on the platform constitutes legal,
            financial, investment, real estate, engineering,
            environmental, or other professional advice.
          </p>

          <p className="mt-4">
            MetroSift does not guarantee that any property
            is available for purchase or lease, that a
            business is operating at a particular location,
            or that a particular investment or business
            opportunity exists.
          </p>

          <p className="mt-4">
            Users should independently verify information
            and consult qualified professionals before
            making consequential decisions.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900">
            5. Permitted Use
          </h2>

          <p className="mt-4">
            You may use MetroSift for lawful research,
            business evaluation, property investigation,
            and other legitimate informational purposes.
          </p>

          <p className="mt-4">
            You agree not to interfere with the platform,
            attempt unauthorized access, circumvent access
            restrictions, or use automated requests in a
            manner that disrupts its operation.
          </p>

          <p className="mt-4">
            You may not misrepresent MetroSift information
            as official government findings or imply
            government endorsement.
          </p>

          <p className="mt-4">
            Your use of original public datasets may also
            be subject to applicable source-specific
            terms and legal requirements.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900">
            6. Intellectual Property
          </h2>

          <p className="mt-4">
            The MetroSift name, branding, original website
            content, software, design, and platform-specific
            presentation may be protected by applicable
            intellectual property laws.
          </p>

          <p className="mt-4">
            MetroSift does not claim ownership of public
            records solely because they are displayed
            through the platform. Rights in third-party
            materials remain with their respective owners
            or are governed by applicable law.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900">
            7. Third-Party Services and Links
          </h2>

          <p className="mt-4">
            MetroSift may link to government websites,
            public datasets, and other third-party services.
          </p>

          <p className="mt-4">
            We do not control their content, availability,
            security, or accuracy and are not responsible
            for their independent practices.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900">
            8. Service Availability
          </h2>

          <p className="mt-4">
            MetroSift is provided on an "as available"
            basis. We do not guarantee uninterrupted
            access, continuous data availability, or
            error-free operation.
          </p>

          <p className="mt-4">
            We may perform maintenance or make changes
            that temporarily affect access to the platform.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900">
            9. Disclaimer of Warranties
          </h2>

          <p className="mt-4">
            To the extent permitted by applicable law,
            MetroSift and its content are provided
            "as is" and "as available," without warranties
            of any kind, whether express or implied,
            including warranties of accuracy, completeness,
            merchantability, fitness for a particular
            purpose, and non-infringement.
          </p>

          <p className="mt-4">
            Nothing in these Terms excludes warranties
            or rights that cannot lawfully be excluded.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900">
            10. Limitation of Liability
          </h2>

          <p className="mt-4">
            To the maximum extent permitted by applicable
            law, MPM Ventures LLC will not be liable for
            indirect, incidental, special, consequential,
            or punitive damages arising from use of or
            inability to use MetroSift, including lost
            profits, lost opportunities, or business
            interruption.
          </p>

          <p className="mt-4">
            These limitations apply only to the extent
            permitted by law and do not limit liability
            that cannot legally be limited or excluded.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900">
            11. Independence from Government
          </h2>

          <p className="mt-4">
            MetroSift is an independent platform operated
            by MPM Ventures LLC. It is not affiliated with,
            sponsored by, or endorsed by the City of Chicago
            or any other government agency.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900">
            12. Changes to These Terms
          </h2>

          <p className="mt-4">
            We may update these Terms from time to time.
            Updated Terms will be posted on this page
            with a revised effective date.
          </p>

          <p className="mt-4">
            Where required by applicable law, we will
            provide additional notice or obtain consent
            before changes take effect.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900">
            13. Contact
          </h2>

          <p className="mt-4">
            Questions about these Terms may be directed
            to MPM Ventures LLC through the MetroSift{" "}
            <Link
              href="/contact"
              className="font-semibold text-blue-700 hover:text-blue-900"
            >
              Contact
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
