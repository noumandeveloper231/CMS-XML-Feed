import Image from "next/image";
import Link from "next/link";

type HeaderProps = {
  subtitle?: string;
  jobCount?: number;
  feedSource?: "live" | "sample";
};

export function Header({ subtitle, jobCount, feedSource }: HeaderProps) {
  return (
    <header className="site-header">
      <div className="header-top">
        <div className="container header-top-inner">
          <p className="header-eyebrow">Complete Staffing Solutions</p>
          {feedSource && (
            <span className={`feed-pill ${feedSource === "live" ? "live" : "sample"}`}>
              {feedSource === "live" ? "Live XML feed" : "Sample feed"}
            </span>
          )}
        </div>
      </div>

      <div className="header-main">
        <div className="container header-main-inner">
          <Link href="/" className="brand">
            <Image
              src="/logo.png"
              alt="Complete Staffing Solutions"
              width={180}
              height={48}
              priority
              className="brand-logo"
            />
          </Link>

          <div className="header-copy">
            <h1 className="header-title">Open Positions</h1>
            <p className="header-subtitle">
              {subtitle ||
                "Browse roles pulled directly from the ATS XML job feed — full details, formatted for review."}
            </p>
            {typeof jobCount === "number" && (
              <p className="header-meta">
                <strong>{jobCount}</strong> {jobCount === 1 ? "role" : "roles"} available
              </p>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
