import sanitizeHtml from "sanitize-html";
import type { FeedJob } from "./types";

export function formatJobType(value: string): string {
  if (!value) return "";
  return value
    .replace(/[_-]+/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatLocation(job: Pick<FeedJob, "city" | "state" | "country" | "postalcode">): string {
  const city = job.city?.trim();
  const state = job.state?.trim();
  const country = job.country?.trim();
  const postal = job.postalcode?.trim();

  const locality = [city, state].filter(Boolean).join(", ");
  const withPostal = [locality, postal].filter(Boolean).join(" ");
  if (country && country.toLowerCase() !== "united states" && country.toLowerCase() !== "usa") {
    return [withPostal, country].filter(Boolean).join(" · ");
  }
  return withPostal;
}

export function formatPostedDate(value: string): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function contactName(job: Pick<FeedJob, "firstname" | "lastname">): string {
  return [job.firstname, job.lastname].map((s) => s?.trim()).filter(Boolean).join(" ");
}

/** Sanitize feed HTML and unwrap noisy nested spans for readable display. */
export function formatDescriptionHtml(html: string): string {
  if (!html) return "";

  const cleaned = sanitizeHtml(html, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat([
      "img",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
    ]),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      a: ["href", "name", "target", "rel"],
      img: ["src", "alt", "title", "width", "height"],
      "*": ["class"],
    },
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", {
        rel: "noopener noreferrer",
        target: "_blank",
      }),
    },
  });

  // Collapse nested empty span wrappers common in Word/Indeed exports
  return cleaned
    .replace(/<span(?:\s[^>]*)?>\s*<\/span>/gi, "")
    .replace(/(?:<span(?:\s[^>]*)?>\s*){2,}/gi, "<span>")
    .replace(/(?:\s*<\/span>){2,}/gi, "</span>")
    .replace(/<p>\s*<\/p>/gi, "")
    .trim();
}

export function jobHref(job: Pick<FeedJob, "referencenumber" | "title">): string {
  const ref = encodeURIComponent(job.referencenumber.trim() || "unknown");
  return `/jobs/${ref}`;
}
