import type { FeedJob } from "../lib/types";
import {
  contactName,
  formatJobType,
  formatLocation,
  formatPostedDate,
} from "../lib/format";

export function JobMetaPanel({ job }: { job: FeedJob }) {
  const location = formatLocation(job);
  const type = formatJobType(job.jobtype);
  const contact = contactName(job);
  const address = [job.streetaddress, location].filter(Boolean).join(", ");

  const rows: { label: string; value: string }[] = [
    { label: "Record Number", value: job.referencenumber ? `#${job.referencenumber}` : "" },
    { label: "Company", value: job.company },
    { label: "Location", value: address },
    { label: "Job type", value: type },
    { label: "Category", value: job.category },
    { label: "Experience", value: job.experience },
    { label: "Salary", value: job.salary },
    { label: "Posted", value: formatPostedDate(job.date) },
    { label: "Expires", value: formatPostedDate(job.expirationDate) },
    { label: "Contact", value: contact },
    { label: "Apply email", value: job.applyEmail },
  ].filter((r) => r.value);

  return (
    <aside className="meta-panel">
      <h2>Role details</h2>
      <dl>
        {rows.map((row) => (
          <div key={row.label} className="meta-row">
            <dt>{row.label}</dt>
            <dd>
              {row.label === "Apply email" ? (
                <a href={`mailto:${row.value}`}>{row.value}</a>
              ) : (
                row.value
              )}
            </dd>
          </div>
        ))}
      </dl>

      {job.url ? (
        <a
          href={job.url}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-secondary"
        >
          View in CRM
        </a>
      ) : null}
    </aside>
  );
}
