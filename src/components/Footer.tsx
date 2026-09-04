export function Footer({ publisher, lastBuildDate }: { publisher?: string; lastBuildDate?: string }) {
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <p>
          © {new Date().getFullYear()} {publisher || "Complete Staffing Solutions"}
        </p>
        <p className="footer-note">
          Jobs board for XML feed testing
          {lastBuildDate ? ` · Feed built ${lastBuildDate}` : ""}
        </p>
      </div>
    </footer>
  );
}
