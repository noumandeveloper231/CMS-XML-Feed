import { formatDescriptionHtml } from "../lib/format";

export function JobDescription({ html }: { html: string }) {
  const safe = formatDescriptionHtml(html);

  if (!safe) {
    return (
      <div className="job-description empty">
        <p>No description was provided in the XML feed for this role.</p>
      </div>
    );
  }

  return (
    <div
      className="job-description prose"
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  );
}
