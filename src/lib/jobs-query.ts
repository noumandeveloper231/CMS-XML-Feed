import { getJobsFeed } from "./feed";
import {
  PAGE_SIZE_OPTIONS,
  clampPage,
  toJobSummary,
} from "./pagination";
import type { FeedJob, JobSummary, JobsListResponse, ParsedFeed } from "./types";
import { formatJobType, formatLocation } from "./format";

const FEED_TTL_MS = 60_000;

type CacheEntry = {
  feed: ParsedFeed;
  expiresAt: number;
};

let memoryCache: CacheEntry | null = null;
let inflight: Promise<ParsedFeed> | null = null;

export async function getCachedJobsFeed(origin?: string): Promise<ParsedFeed> {
  const now = Date.now();
  if (memoryCache && memoryCache.expiresAt > now) {
    return memoryCache.feed;
  }

  if (inflight) return inflight;

  inflight = getJobsFeed(origin)
    .then((feed) => {
      memoryCache = { feed, expiresAt: Date.now() + FEED_TTL_MS };
      return feed;
    })
    .finally(() => {
      inflight = null;
    });

  return inflight;
}

function matchesFilters(
  job: FeedJob,
  q: string,
  category: string,
  jobType: string
): boolean {
  if (category !== "all" && job.category.trim() !== category) return false;
  if (jobType !== "all" && job.jobtype.trim() !== jobType) return false;
  if (!q) return true;

  const haystack = [
    job.title,
    job.company,
    job.category,
    job.city,
    job.state,
    job.referencenumber,
    job.salary,
    job.experience,
    formatLocation(job),
    formatJobType(job.jobtype),
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(q);
}

export type ListJobsQuery = {
  page?: number;
  pageSize?: number;
  q?: string;
  category?: string;
  jobType?: string;
  origin?: string;
};

export async function listJobsPage(
  query: ListJobsQuery = {}
): Promise<JobsListResponse> {
  const feed = await getCachedJobsFeed(query.origin);
  const q = (query.q || "").trim().toLowerCase();
  const category = query.category || "all";
  const jobType = query.jobType || "all";

  const allowedSizes = PAGE_SIZE_OPTIONS as readonly number[];
  let pageSize = Number(query.pageSize) || 50;
  if (!allowedSizes.includes(pageSize)) pageSize = 50;

  const filtered = feed.jobs.filter((job) =>
    matchesFilters(job, q, category, jobType)
  );

  const totalCount = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize) || 1);
  const page = clampPage(Number(query.page) || 1, totalPages);
  const start = (page - 1) * pageSize;
  const pageJobs = filtered.slice(start, start + pageSize);

  const jobs: JobSummary[] = pageJobs.map((job) => toJobSummary(job));

  const categories = Array.from(
    new Set(feed.jobs.map((j) => j.category.trim()).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b));

  const types = Array.from(
    new Set(feed.jobs.map((j) => j.jobtype.trim()).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b));

  return {
    jobs,
    totalCount,
    page,
    pageSize,
    totalPages,
    categories,
    types,
    meta: feed.meta,
    source: feed.source,
  };
}

export async function getCachedJobByRef(
  ref: string,
  origin?: string
): Promise<{ feed: ParsedFeed; job: FeedJob } | null> {
  const feed = await getCachedJobsFeed(origin);
  const normalized = decodeURIComponent(ref).trim().toLowerCase();
  const job = feed.jobs.find(
    (j) => j.referencenumber.trim().toLowerCase() === normalized
  );
  if (!job) return null;
  return { feed, job };
}
