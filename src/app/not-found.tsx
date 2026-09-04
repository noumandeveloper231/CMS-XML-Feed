import Link from "next/link";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";

export default function NotFound() {
  return (
    <div className="page-shell">
      <Header subtitle="We could not find that job in the current XML feed." />
      <main className="page-main">
        <div className="container">
          <div className="error-panel">
            <h2>Job not found</h2>
            <p>The record number may be outdated or removed from the feed.</p>
            <p style={{ marginTop: "1rem" }}>
              <Link href="/" className="back-link">
                ← Back to all jobs
              </Link>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
