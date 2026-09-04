export type FeedJob = {
  title: string;
  date: string;
  expirationDate: string;
  description: string;
  referencenumber: string;
  url: string;
  company: string;
  streetaddress: string;
  city: string;
  state: string;
  postalcode: string;
  country: string;
  jobtype: string;
  salary: string;
  category: string;
  experience: string;
  firstname: string;
  lastname: string;
  applyEmail: string;
};

/** List rows omit heavy HTML descriptions. */
export type JobSummary = Omit<FeedJob, "description">;

export type FeedMeta = {
  publisher: string;
  publisherurl: string;
  lastBuildDate: string;
};

export type ParsedFeed = {
  meta: FeedMeta;
  jobs: FeedJob[];
  source: "live" | "sample";
  fetchedAt: string;
};

export type JobsListResponse = {
  jobs: JobSummary[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  categories: string[];
  types: string[];
  meta: FeedMeta;
  source: "live" | "sample";
};
