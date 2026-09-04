import { headers } from "next/headers";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { JobBoard } from "@/components/JobBoard";
import { listJobsPage } from "@/lib/jobs-query";

export const dynamic = "force-dynamic";

async function resolveOrigin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host");
  const proto = h.get("x-forwarded-proto") || "http";
  if (!host) return undefined;
  return `${proto}://${host}`;
}

export default async function HomePage() {
  const origin = await resolveOrigin();

  let initialData = null;
  let errorMessage = "";

  try {
    initialData = await listJobsPage({ page: 1, pageSize: 50, origin });
  } catch (err) {
    errorMessage =
      err instanceof Error ? err.message : "Failed to load the XML job feed.";
  }

  return (
    <div className="page-shell">
      <Header
        jobCount={initialData?.totalCount}
        feedSource={initialData?.source}
        subtitle={
          initialData
            ? `Live listing from ${initialData.meta.publisher}. Click any role for the full formatted description and feed fields.`
            : "Unable to reach the XML feed right now."
        }
      />

      <main className="page-main">
        <div className="container">
          {initialData ? (
            <JobBoard initialData={initialData} />
          ) : (
            <div className="error-panel">
              <h2>Feed unavailable</h2>
              <p>{errorMessage}</p>
              <p style={{ marginTop: "0.75rem" }}>
                Set <code>XML_FEED_URL</code> in Vercel to your ATS feed
                (e.g. <code>https://your-ats.vercel.app/jobs/feed</code>).
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer
        publisher={initialData?.meta.publisher}
        lastBuildDate={initialData?.meta.lastBuildDate}
      />
    </div>
  );
}
