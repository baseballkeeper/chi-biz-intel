import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Learn how MetroSift handles personal information, website analytics, cookies, and third-party services.",
};

const lastUpdated = "November 13, 2026";

export default function PrivacyPage() {
  return (
    <div className="bg-white text-slate-900">
      <section className="border-b border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-4xl px-6 py-14">
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-700">
            MetroSift / Legal
          </p>

          <h1 className="mt-4 text-4xl font-bold tracking-tight">
            Privacy Policy
          </h1>

          <p className="mt-4 text-sm text-slate-500">
            Last updated: {lastUpdated}
          </p>

          <p className="mt-6 text-lg leading-8 text-slate-600">
            This page explains how MPM Ventures LLC, operating
            MetroSift, handles information associated with
            visitors and users of the platform.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl space-y-12 px-6 py-14 leading-8 text-slate-700">
        <section>
          <h2 className="text-2xl font-bold text-slate-900">
            1. Who Operates MetroSift
          </h2>

          <p className="mt-4">
            MetroSift is operated by MPM Ventures LLC.
            References to "MetroSift," "we," "our," and
            "us" in this policy refer to MPM Ventures LLC
            in connection with the MetroSift platform.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900">
            2. Information We May Process
          </h2>

          <p className="mt-4">
            When visitors access MetroSift, information
            such as IP addresses, browser types, device
            information, requested pages, timestamps,
            and technical diagnostic information may
            be processed by the infrastructure used to
            deliver and secure the website.
          </p>

          <p className="mt-4">
            If you contact us, we may receive the name,
            email address, message, and other information
            you voluntarily provide.
          </p>

          <p className="mt-4">
              If you subscribe to the MetroSift newsletter,
              you voluntarily provide an email address. Our
              signup form submits that address directly to
              Buttondown, our newsletter service provider,
              for subscription management and email delivery.
              Buttondown may also process subscription status,
              confirmation activity, and information needed
              to operate its service.
            </p>

            <p className="mt-4">
              Future features, such as user accounts or saved
              research areas, may involve additional information
              collection. We will update this policy when those
              features are introduced.
            </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900">
            3. How Information Is Used
          </h2>

          <p className="mt-4">
            Information processed in connection with
            MetroSift may be used to operate and deliver
            the website, maintain security, diagnose
            technical problems, respond to inquiries,
            and comply with applicable legal obligations.
          </p>

          <p className="mt-4">
            Where analytics are enabled, usage information
            may also be used to understand website
            performance and improve the platform.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900">
            Newsletter Subscriptions
          </h2>

          <p className="mt-4">
            If you opt in to our newsletter, we use your email
            address to send MetroSift updates about Chicago
            business licenses, permits, and commercial activity.
            We do not require a MetroSift account to subscribe.
          </p>

          <p className="mt-4">
            Buttondown manages newsletter subscriptions and
            delivery, including confirmation emails and
            unsubscribe requests. You can unsubscribe using
            the link included in newsletter emails. You may
            also contact us through our{" "}
            <Link
              href="/contact"
              className="font-semibold text-blue-700 hover:text-blue-900"
            >
              Contact
            </Link>{" "}
            page with a newsletter-related privacy request.
          </p>

          <p className="mt-4">
            For more information about Buttondown's handling
            of personal information, see its{" "}
            <a
              href="https://buttondown.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-blue-700 hover:text-blue-900"
            >
              privacy policy
            </a>.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900">
            4. Cookies and Analytics
          </h2>

          <p className="mt-4">
            Website infrastructure and third-party
            services may use cookies or similar
            technologies for security, functionality,
            or measurement.
          </p>

          <p className="mt-4">
            The specific technologies used may change
            as MetroSift develops. Any analytics,
            advertising, or optional tracking tools
            should be disclosed here before they
            are activated.
          </p>

          <p className="mt-4">
            You can generally manage cookies through
            your browser settings. Disabling certain
            technologies may affect website functionality.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900">
            5. Public Records and Third-Party Data
          </h2>

          <p className="mt-4">
            MetroSift displays information obtained from
            publicly available datasets, including
            government records. Some records may contain
            names, business addresses, or other information
            about individuals or organizations.
          </p>

          <p className="mt-4">
            The inclusion of information in a public
            dataset does not necessarily establish that
            it is accurate, current, or appropriate for
            every use.
          </p>

          <p className="mt-4">
            To learn more about these sources, visit our{" "}
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
            6. Service Providers
          </h2>

          <p className="mt-4">
            MetroSift may rely on third-party providers
            for website hosting, infrastructure, security,
            and related technical services.
          </p>

          <p className="mt-4">
            These providers may process information
            necessary to deliver their services,
            subject to their applicable agreements,
            policies, and legal obligations.
          </p>

          <p className="mt-4">
              Buttondown provides newsletter signup,
              subscription management, and email delivery.
              Other providers may support website hosting,
              security, and infrastructure. We will review
              and identify additional material providers as
              deployment arrangements are finalized.
            </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900">
            7. Information Sharing
          </h2>

          <p className="mt-4">
            Information may be shared with service
            providers supporting MetroSift operations,
            where required by law, or where reasonably
            necessary to protect the security and
            integrity of the platform.
          </p>

          <p className="mt-4">
            Any additional sharing practices introduced
            with future features will be reflected in
            an updated policy as appropriate.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900">
            8. Data Retention
          </h2>

          <p className="mt-4">
            Information may be retained for periods
            reasonably necessary for the purposes
            described in this policy, including
            operational, security, and legal needs.
          </p>

          <p className="mt-4">
            Retention periods may differ depending on
            the information and the systems involved.
            Specific retention practices should be
            documented as MetroSift's infrastructure
            and features are finalized.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900">
            9. Security
          </h2>

          <p className="mt-4">
            We aim to use reasonable technical and
            organizational measures to protect
            information processed in connection
            with MetroSift.
          </p>

          <p className="mt-4">
            However, no internet-based service can
            guarantee absolute security.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900">
            10. Your Privacy Rights
          </h2>

          <p className="mt-4">
            Depending on your location and applicable
            law, you may have rights concerning
            personal information, including the ability
            to request access, correction, deletion,
            or information about certain processing.
          </p>

          <p className="mt-4">
            Requests can be submitted through our{" "}
            <Link
              href="/contact"
              className="font-semibold text-blue-700 hover:text-blue-900"
            >
              Contact
            </Link>{" "}
            page. We will review requests in accordance
            with applicable law.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900">
            11. Children's Privacy
          </h2>

          <p className="mt-4">
            MetroSift is intended for general business
            and informational use and is not directed
            toward children under 13.
          </p>

          <p className="mt-4">
            If we become aware that personal information
            from a child has been collected in a manner
            requiring action under applicable law,
            we will take appropriate steps.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900">
            12. External Websites
          </h2>

          <p className="mt-4">
            MetroSift may link to external websites,
            including government data portals.
            Those websites operate under their
            own privacy practices and policies.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900">
            13. Changes to This Policy
          </h2>

          <p className="mt-4">
            We may revise this Privacy Policy as
            MetroSift develops or applicable
            requirements change.
          </p>

          <p className="mt-4">
            Updates will be posted on this page,
            with additional notice or consent
            where required by law.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900">
            14. Contact
          </h2>

          <p className="mt-4">
            For questions about this Privacy Policy
            or requests concerning personal information,
            contact MPM Ventures LLC through the
            MetroSift{" "}
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
            &larr; Back to MetroSift
          </Link>
        </div>
      </div>
    </div>
  );
}
