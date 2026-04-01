// app/api/scan-url/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { scanUrl } from "@/lib/scanner";
import { optionalAuth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const auth = await optionalAuth(req);
  console.log("Auth result:", {
    success: auth.success,
    source: auth.source,
    userId: auth.userId,
    apiKeyId: auth.apiKeyId,
  });

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

    const domain = new URL(url).hostname;
    const result = await scanUrl(url);

    // Log the scan with userId if authenticated
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
        userId: auth.userId || null, // Add this - captures user from JWT or API key
        apiKeyId: auth.apiKeyId || null,
      },
    });

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
