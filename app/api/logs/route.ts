// app/api/logs/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuthOrApiKey, checkPermission } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuthOrApiKey(req);
    if (!auth.success) return auth.response;

    // If using API key, check permissions
    if (auth.source === "apikey" && auth.apiKeyId) {
      const hasPermission = await checkPermission(auth.apiKeyId, "read:logs");
      if (!hasPermission) {
        return NextResponse.json(
          { error: "Insufficient permissions" },
          { status: 403 },
        );
      }
    }

    const { searchParams } = new URL(req.url);
    const severity = searchParams.get("severity") || "";
    const q = searchParams.get("q") || "";
    const from = searchParams.get("from") || "";
    const to = searchParams.get("to") || "";
    const limit = parseInt(searchParams.get("limit") || "500");

    const where: any = {};
    if (q) where.url = { contains: q, mode: "insensitive" };
    if (severity) where.verdict = severity;
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }

    const logs = await prisma.detectionLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    const response = NextResponse.json(logs);
    response.headers.set("Access-Control-Allow-Origin", "*");
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch logs" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  // Extension logging endpoint - requires API key
  const auth = await requireAuthOrApiKey(req);
  if (!auth.success) return auth.response;

  if (auth.source === "apikey" && auth.apiKeyId) {
    const hasPermission = await checkPermission(auth.apiKeyId, "write:logs");
    if (!hasPermission) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 },
      );
    }
  }

  try {
    const body = await req.json();
    const { url, verdict, score, reasons, threatType, confidence, tabId } =
      body;

    const domain = url ? new URL(url).hostname : null;

    const log = await prisma.detectionLog.create({
      data: {
        url: url || "unknown",
        domain,
        verdict: verdict || "unknown",
        score: score || 0,
        reasons: JSON.stringify(reasons || []),
        threatType: threatType || null,
        confidence: confidence || null,
        source: "extension",
        apiKeyId: auth.apiKeyId || null,
        tabId: tabId || null,
        clientIp: req.headers.get("x-forwarded-for") || "unknown",
        userAgent: req.headers.get("user-agent") || "unknown",
      },
    });

    const response = NextResponse.json(log, { status: 201 });
    response.headers.set("Access-Control-Allow-Origin", "*");
    return response;
  } catch (error) {
    console.error("Failed to create log:", error);
    return NextResponse.json(
      { error: "Failed to create log" },
      { status: 500 },
    );
  }
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-API-Key",
    },
  });
}
