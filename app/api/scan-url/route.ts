// app/api/scan-url/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { scanUrl } from "@/lib/scanner";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL required" }, { status: 400 });
    }

    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 400 },
      );
    }

    const result = await scanUrl(url);

    await prisma.detectionLog.create({
      data: {
        url,
        verdict: result.verdict,
        score: result.score,
        reasons: JSON.stringify(result.reasons),
        matchedThreatIds: result.matchedThreatIds?.join(",") || null,
        threatType: result.threatType,
        confidence: result.confidence,
        clientIp: req.headers.get("x-forwarded-for") || "unknown",
        userAgent: req.headers.get("user-agent") || "unknown",
        source: "dashboard",
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Scan error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
