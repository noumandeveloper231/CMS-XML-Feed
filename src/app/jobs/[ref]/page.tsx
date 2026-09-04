import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { JobDescription } from "@/components/JobDescription";
import { JobMetaPanel } from "@/components/JobMetaPanel";
import { ApplyForm } from "@/components/ApplyForm";
import { getCachedJobByRef } from "@/lib/jobs-query";
import {
  formatJobType,
  formatLocation,
  formatPostedDate,
} from "@/lib/format";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ ref: string }>;
};

async function resolveOrigin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host");
  const proto = h.get("x-forwarded-proto") || "http";
  if (!host) return undefined;
  return `${proto}://${host}`;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { ref } = await params;
  const origin = await resolveOrigin();
  const result = await getCachedJobByRef(ref, origin);
  if (!result) return { title: "Job not found" };
  return {
    title: result.job.title || `Job #${result.job.referencenumber}`,
    description: `${result.job.company || "Complete Staffing Solutions"} — ${formatLocation(result.job)}`,
  };
}

export default async function JobDetailPage({ params }: PageProps) {
  const { ref } = await params;
  const origin = await resolveOrigin();
  const result = await getCachedJobByRef(ref, origin);

  if (!result) notFound();

  const { job, feed } = result;
  const location = formatLocation(job);
  const type = formatJobType(job.jobtype);
  const posted = formatPostedDate(job.date);

  return (
    <div className="page-shell">
      <Header
        feedSource={feed.source}
        subtitle="Full role details sourced from the ATS XML feed."
      />

      <main className="page-main">
        <div className="container">
          <div className="detail-nav">
            <Link href="/" className="back-link">
              ← Back to all jobs
            </Link>
          </div>

          <section className="detail-hero">
            <h1>{job.title || "Untitled role"}</h1>
            <p className="company">
              {job.company || feed.meta.publisher}
              {location ? ` · ${location}` : ""}
            </p>
            <div className="detail-tags">
              {job.salary ? <span className="salary-badge">{job.salary}</span> : null}
              {type ? <span className="meta-chip">{type}</span> : null}
              {job.category ? <span className="meta-chip soft">{job.category}</span> : null}
              {job.experience ? <span className="meta-chip soft">{job.experience}</span> : null}
              {posted ? <span className="meta-chip soft">Posted {posted}</span> : null}
              {job.referencenumber ? (
                <span className="meta-chip soft">Record #{job.referencenumber}</span>
              ) : null}
            </div>
          </section>

          <div className="detail-layout">
            <div className="detail-main">
              <section className="description-panel">
                <h2>Job description</h2>
                <JobDescription html={job.description} />
              </section>

              <section className="apply-section">
                {job.referencenumber ? (
                  <ApplyForm
                    recordNumber={job.referencenumber}
                    jobTitle={job.title}
                    salary={job.salary}
                    applyEmail={job.applyEmail}
                  />
                ) : (
                  <div className="description-panel">
                    <p className="text-sm text-gray-500">
                      This job is missing a record number, so online apply is
                      unavailable.
                    </p>
                    {job.applyEmail ? (
                      <a
                        href={`mailto:${job.applyEmail}?subject=${encodeURIComponent(
                          `Application: ${job.title}`
                        )}`}
                        className="btn btn-primary"
                      >
                        Apply by email
                      </a>
                    ) : null}
                  </div>
                )}
              </section>
            </div>
            <JobMetaPanel job={job} />
          </div>
        </div>
      </main>

      <Footer
        publisher={feed.meta.publisher}
        lastBuildDate={feed.meta.lastBuildDate}
      />
    </div>
  );
}
