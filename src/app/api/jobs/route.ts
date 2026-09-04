import { NextRequest, NextResponse } from "next/server";
import { listJobsPage } from "@/lib/jobs-query";

export const dynamic = "force-dynamic";

function originFromRequest(req: NextRequest): string | undefined {
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") || "http";
  if (!host) return undefined;
  return `${proto}://${host}`;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const data = await listJobsPage({
      page: Number(searchParams.get("page") || 1),
      pageSize: Number(searchParams.get("pageSize") || 50),
      q: searchParams.get("q") || "",
      category: searchParams.get("category") || "all",
      jobType: searchParams.get("jobType") || "all",
      origin: originFromRequest(req),
    });

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "private, max-age=30, stale-while-revalidate=60",
      },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to load jobs from XML feed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
