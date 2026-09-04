"use client";

import Link from "next/link";
import { useRouter } from "nextjs-toploader/app";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ServerListPagination } from "@/components/ServerListPagination";
import { TableSkeletonRows } from "@/components/TableSkeletonRows";
import {
  formatJobType,
  formatLocation,
  formatPostedDate,
  jobHref,
} from "@/lib/format";
import { PAGE_SIZE_OPTIONS, buildPaginationItems } from "@/lib/pagination";
import type { JobSummary, JobsListResponse } from "@/lib/types";

type Props = {
  initialData?: JobsListResponse | null;
};

export function JobBoard({ initialData = null }: Props) {
  const router = useRouter();
  const skipInitialFetch = useRef(Boolean(initialData));
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [jobType, setJobType] = useState("all");
  const [page, setPage] = useState(initialData?.page ?? 1);
  const [pageSize, setPageSize] = useState(initialData?.pageSize ?? 50);
  const [data, setData] = useState<JobsListResponse | null>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  const fetchPage = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        q: debouncedQuery,
        category,
        jobType,
      });
      const res = await fetch(`/api/jobs?${params.toString()}`, {
        cache: "no-store",
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to load jobs");
      }
      setData(json as JobsListResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load jobs");
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, debouncedQuery, category, jobType]);

  useEffect(() => {
    if (skipInitialFetch.current) {
      skipInitialFetch.current = false;
      return;
    }
    void fetchPage();
  }, [fetchPage]);

  const jobs: JobSummary[] = data?.jobs ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const categories = data?.categories ?? [];
  const types = data?.types ?? [];

  const paginationItems = useMemo(
    () => buildPaginationItems(page, totalPages),
    [page, totalPages]
  );

  const canGoPrev = page > 1 && !isLoading;
  const canGoNext = page < totalPages && !isLoading;

  const openJob = (job: JobSummary) => {
    router.push(jobHref(job));
  };

  const onPageSizeChange = (size: number) => {
    setPageSize(size);
    setPage(1);
  };

  const onCategoryChange = (value: string) => {
    setCategory(value);
    setPage(1);
  };

  const onJobTypeChange = (value: string) => {
    setJobType(value);
    setPage(1);
  };

  const hasActiveFilters =
    query.trim() !== "" || category !== "all" || jobType !== "all";

  const clearFilters = () => {
    setQuery("");
    setDebouncedQuery("");
    setCategory("all");
    setJobType("all");
    setPage(1);
  };

  return (
    <section className="board min-w-0 max-w-full">
      <div className="bg-white rounded-lg shadow overflow-hidden max-w-full min-w-0">
        <div className="p-4 border-b border-gray-200 flex flex-col gap-3 lg:flex-row lg:items-end">
          <label className="flex-1 min-w-0">
            <span className="sr-only">Search jobs</span>
            <input
              type="search"
              placeholder="Search title, location, record #…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
            />
          </label>

          <label className="flex flex-col gap-1 min-w-[160px]">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Category
            </span>
            <select
              value={category}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="px-2 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 min-w-[160px]">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Job type
            </span>
            <select
              value={jobType}
              onChange={(e) => onJobTypeChange(e.target.value)}
              className="px-2 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All types</option>
              {types.map((t) => (
                <option key={t} value={t}>
                  {formatJobType(t)}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={clearFilters}
            disabled={!hasActiveFilters || isLoading}
            className="px-3 py-2 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            Clear filters
          </button>
        </div>

        <div className="jobs-table-scroll w-full min-w-0 max-w-full overflow-auto max-h-[80vh]">
          <table className="min-w-full w-max divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {[
                  "Record Number",
                  "Title",
                  "Company",
                  "Location",
                  "Type",
                  "Category",
                  "Salary",
                  "Posted",
                  "Actions",
                ].map((label) => (
                  <th
                    key={label}
                    className="sticky top-0 z-20 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 border-r border-gray-200 last:border-r-0"
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading && jobs.length === 0 ? (
                <TableSkeletonRows rowCount={8} columnCount={9} />
              ) : error ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-6 py-10 text-sm text-gray-500 text-center"
                  >
                    {error}
                  </td>
                </tr>
              ) : jobs.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-6 py-10 text-sm text-gray-500 text-center"
                  >
                    No matching jobs found.
                  </td>
                </tr>
              ) : (
                jobs.map((job) => {
                  const location = formatLocation(job);
                  const type = formatJobType(job.jobtype);
                  const posted = formatPostedDate(job.date);

                  return (
                    <tr
                      key={job.referencenumber || job.title}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={(e) => {
                        const target = e.target as HTMLElement;
                        if (target.closest("a, button")) return;
                        openJob(job);
                      }}
                    >
                      <td className="px-6 py-4 text-black whitespace-nowrap">
                        {job.referencenumber ? `J ${job.referencenumber}` : "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                        <Link
                          href={jobHref(job)}
                          className="hover:text-blue-600"
                        >
                          {job.title || "Untitled role"}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {job.company || "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {location || "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {type || "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {job.category || "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {job.salary || "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {posted || "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <Link
                          href={jobHref(job)}
                          className="px-3 py-1 bg-gray-100 border border-gray-300 rounded flex items-center text-gray-600 w-fit hover:bg-gray-50"
                          onClick={(e) => e.stopPropagation()}
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <ServerListPagination
          entityLabel="jobs"
          currentPage={page}
          pageSize={pageSize}
          itemsOnPage={jobs.length}
          totalCount={totalCount}
          totalPages={totalPages}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
          canGoPrev={canGoPrev}
          canGoNext={canGoNext}
          paginationItems={paginationItems}
          isLoading={isLoading}
          onPageChange={setPage}
          onPageSizeChange={onPageSizeChange}
        />
      </div>
    </section>
  );
}
