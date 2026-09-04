import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const crmBase = process.env.CRM_API_URL?.replace(/\/$/, "");
  const secret = process.env.JOB_APPLY_PUBLIC_SECRET?.trim();

  if (!crmBase || !secret) {
    return NextResponse.json(
      {
        success: false,
        message:
          "Apply is not configured. Set CRM_API_URL and JOB_APPLY_PUBLIC_SECRET.",
      },
      { status: 503 }
    );
  }

  try {
    const incoming = await req.formData();
    const outbound = new FormData();

    const copyKeys = [
      "Field_1",
      "Field_3",
      "Field_8",
      "Field_11",
      "Field_15",
      "Field_17",
      "Field_18",
      "Field_19",
      "notes",
      "website",
      "recordNumber",
    ];

    for (const key of copyKeys) {
      const value = incoming.get(key);
      if (typeof value === "string") {
        outbound.set(key, value);
      }
    }

    const resume = incoming.get("resume");
    if (resume instanceof File && resume.size > 0) {
      outbound.set("resume", resume, resume.name);
    }

    const res = await fetch(`${crmBase}/api/public/jobs/apply`, {
      method: "POST",
      headers: {
        "X-Job-Apply-Secret": secret,
      },
      body: outbound,
    });

    const data = await res.json().catch(() => ({
      success: false,
      message: "Invalid response from CRM",
    }));

    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("[api/apply] proxy failed", err);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to reach the CRM apply endpoint.",
      },
      { status: 502 }
    );
  }
}
