// app/api/scan-url/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { scanUrl } from "@/lib/scanner";
import { requireAuthOrApiKey, optionalAuth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  // Allow both authenticated and anonymous scans
  // Anonymous scans have rate limits, authenticated don't
  const auth = await optionalAuth(req);

  // Simple rate limiting for anonymous requests (in production, use Redis)
  if (auth.source === "public") {
    const clientIp = req.headers.get("x-forwarded-for") || "unknown";
    // You could implement rate limiting here
    console.log(`Anonymous scan from ${clientIp}`);
  }

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

    // Extract domain for indexing
    const domain = new URL(url).hostname;

    const result = await scanUrl(url);

    // Log the scan with source info
    await prisma.detectionLog.create({
      data: {
        url,
        domain,
        verdict: result.verdict,
        score: result.score,
        reasons: JSON.stringify(result.reasons),
        matchedThreatIds: result.matchedThreatIds?.join(",") || null,
        threatType: result.threatType,
        confidence: result.confidence,
        clientIp: req.headers.get("x-forwarded-for") || "unknown",
        userAgent: req.headers.get("user-agent") || "unknown",
        source:
          auth.source === "apikey"
            ? "extension"
            : auth.source === "jwt"
              ? "dashboard"
              : "public",
        apiKeyId: auth.apiKeyId || null,
      },
    });

    // Add CORS headers for extension
    const response = NextResponse.json(result);
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, X-API-Key",
    );

    return response;
  } catch (error) {
    console.error("Scan error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// Handle CORS preflight
export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-API-Key",
    },
  });
}
