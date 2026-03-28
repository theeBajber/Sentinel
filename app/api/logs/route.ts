// app/api/logs/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    // const auth = await requireAuth(req);
    // if (!auth.success) return auth.response;
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

    return NextResponse.json(logs);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch logs" },
      { status: 500 },
    );
  }
}
