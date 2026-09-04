import { readFile } from "fs/promises";
import path from "path";
import { XMLParser } from "fast-xml-parser";
import type { FeedJob, FeedMeta, ParsedFeed } from "./types";

const EMPTY_JOB: FeedJob = {
  title: "",
  date: "",
  expirationDate: "",
  description: "",
  referencenumber: "",
  url: "",
  company: "",
  streetaddress: "",
  city: "",
  state: "",
  postalcode: "",
  country: "",
  jobtype: "",
  salary: "",
  category: "",
  experience: "",
  firstname: "",
  lastname: "",
  applyEmail: "",
};

function textOf(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number") {
    return String(value).trim();
  }
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    if ("#text" in obj) return textOf(obj["#text"]);
    if ("__cdata" in obj) return textOf(obj.__cdata);
  }
  return "";
}

function mapJob(raw: Record<string, unknown>): FeedJob {
  const job: FeedJob = { ...EMPTY_JOB };
  (Object.keys(EMPTY_JOB) as (keyof FeedJob)[]).forEach((key) => {
    job[key] = textOf(raw[key]);
  });
  return job;
}

export function parseFeedXml(xml: string): { meta: FeedMeta; jobs: FeedJob[] } {
  const parser = new XMLParser({
    ignoreAttributes: true,
    cdataPropName: "__cdata",
    trimValues: true,
    isArray: (name) => name === "job",
  });

  const parsed = parser.parse(xml);
  const source = parsed?.source ?? {};

  const meta: FeedMeta = {
    publisher: textOf(source.publisher) || "Complete Staffing Solutions",
    publisherurl: textOf(source.publisherurl),
    lastBuildDate: textOf(source.lastBuildDate),
  };

  const rawJobs = Array.isArray(source.job) ? source.job : source.job ? [source.job] : [];
  const jobs = rawJobs
    .map((j: Record<string, unknown>) => mapJob(j || {}))
    .filter((j: FeedJob) => j.referencenumber || j.title);

  return { meta, jobs };
}

async function fetchXml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      Accept: "application/xml, text/xml, */*",
      "User-Agent": "CSS-Jobs-Feed-Site/1.0",
    },
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    throw new Error(`Feed request failed (${res.status}) for ${url}`);
  }

  return res.text();
}

async function loadSampleFromDisk(): Promise<string> {
  const filePath = path.join(process.cwd(), "public", "sample-feed.xml");
  return readFile(filePath, "utf8");
}

/**
 * Loads the live XML feed when XML_FEED_URL is set.
 * Falls back to public/sample-feed.xml for local/demo testing.
 */
export async function getJobsFeed(origin?: string): Promise<ParsedFeed> {
  const configured = process.env.XML_FEED_URL?.trim();
  const sampleUrl = origin
    ? `${origin.replace(/\/$/, "")}/sample-feed.xml`
    : undefined;

  const candidates: { url: string; source: "live" | "sample" }[] = [];

  if (configured) {
    candidates.push({ url: configured, source: "live" });
  }

  // Common production ATS proxies (tried only if no env / env fails)
  if (!configured) {
    candidates.push(
      { url: "https://ats-orcin.vercel.app/jobs/feed", source: "live" },
      { url: "https://cms-organization-phi.vercel.app/jobs/feed", source: "live" }
    );
  }

  if (sampleUrl) {
    candidates.push({ url: sampleUrl, source: "sample" });
  }

  let lastError: unknown;

  for (const candidate of candidates) {
    try {
      const xml = await fetchXml(candidate.url);
      if (!xml.includes("<job") && !xml.includes("<source")) {
        throw new Error("Response is not a job feed");
      }
      const { meta, jobs } = parseFeedXml(xml);
      return {
        meta,
        jobs,
        source: candidate.source,
        fetchedAt: new Date().toISOString(),
      };
    } catch (err) {
      lastError = err;
    }
  }

  try {
    const xml = await loadSampleFromDisk();
    const { meta, jobs } = parseFeedXml(xml);
    return {
      meta,
      jobs,
      source: "sample",
      fetchedAt: new Date().toISOString(),
    };
  } catch (err) {
    lastError = err;
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Unable to load jobs feed");
}

export async function getJobByRef(
  ref: string,
  origin?: string
): Promise<{ feed: ParsedFeed; job: FeedJob } | null> {
  const feed = await getJobsFeed(origin);
  const normalized = decodeURIComponent(ref).trim().toLowerCase();
  const job = feed.jobs.find(
    (j) => j.referencenumber.trim().toLowerCase() === normalized
  );
  if (!job) return null;
  return { feed, job };
}
