// app/api/threats/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuthOrApiKey, checkPermission } from "@/lib/auth";

// GET /api/threats - Public read for extension, protected for web
export async function GET(req: NextRequest) {
  try {
    // Allow public reads for extension threat checking
    // But require auth for management features
    const auth = await requireAuthOrApiKey(req);

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";

    // If not authenticated, only return active high-confidence threats
    // and limit results
    const where: any = {};
    if (q) {
      where.pattern = { contains: q, mode: "insensitive" };
    }

    if (!auth.success) {
      // Public access - only return severe threats, limit fields
      where.severity = { in: ["high", "critical"] };
    }

    const threats = await prisma.threatEntry.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: auth.success ? 1000 : 100, // Limit for public
      select: auth.success
        ? undefined
        : {
            id: true,
            pattern: true,
            isRegex: true,
            severity: true,
            category: true,
          },
    });

    const response = NextResponse.json(threats);
    response.headers.set("Access-Control-Allow-Origin", "*");
    return response;
  } catch (error) {
    console.error("Failed to fetch threats:", error);
    return NextResponse.json(
      { error: "Failed to fetch threats" },
      { status: 500 },
    );
  }
}

// POST /api/threats - Protected
export async function POST(req: NextRequest) {
  const auth = await requireAuthOrApiKey(req);
  if (!auth.success) return auth.response;

  if (auth.source === "apikey" && auth.apiKeyId) {
    const hasPermission = await checkPermission(auth.apiKeyId, "write:threats");
    if (!hasPermission) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 },
      );
    }
  }

  try {
    const body = await req.json();
    const {
      pattern,
      isRegex = false,
      severity = "high",
      source = "manual",
      notes,
      category,
    } = body;

    if (!pattern || pattern.trim() === "") {
      return NextResponse.json(
        { error: "Pattern is required" },
        { status: 400 },
      );
    }

    const threat = await prisma.threatEntry.create({
      data: {
        pattern: pattern.trim(),
        isRegex,
        severity,
        source,
        notes,
        category,
      },
    });

    const response = NextResponse.json(threat, { status: 201 });
    response.headers.set("Access-Control-Allow-Origin", "*");
    return response;
  } catch (error) {
    console.error("Failed to create threat:", error);
    return NextResponse.json(
      { error: "Failed to create threat" },
      { status: 500 },
    );
  }
}

// DELETE /api/threats?id=xxx - Protected
export async function DELETE(req: NextRequest) {
  const auth = await requireAuthOrApiKey(req);
  if (!auth.success) return auth.response;

  if (auth.source === "apikey" && auth.apiKeyId) {
    const hasPermission = await checkPermission(
      auth.apiKeyId,
      "delete:threats",
    );
    if (!hasPermission) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 },
      );
    }
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    await prisma.threatEntry.delete({
      where: { id },
    });

    const response = NextResponse.json({ success: true });
    response.headers.set("Access-Control-Allow-Origin", "*");
    return response;
  } catch (error) {
    console.error("Failed to delete threat:", error);
    return NextResponse.json(
      { error: "Failed to delete threat" },
      { status: 500 },
    );
  }
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-API-Key",
    },
  });
}
