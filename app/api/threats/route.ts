// app/api/threats/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    // const auth = await requireAuth(req);
    // if (!auth.success) return auth.response;

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";

    const threats = await prisma.threatEntry.findMany({
      where: q ? { pattern: { contains: q, mode: "insensitive" } } : {},
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    return NextResponse.json(threats);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch threats" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (!auth.success) return auth.response;

    const body = await req.json();
    const {
      pattern,
      isRegex = false,
      severity = "high",
      source = "manual",
      notes,
      category,
    } = body;

    if (!pattern) {
      return NextResponse.json({ error: "Pattern required" }, { status: 400 });
    }

    const threat = await prisma.threatEntry.create({
      data: { pattern, isRegex, severity, source, notes, category },
    });

    return NextResponse.json(threat, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create threat" },
      { status: 500 },
    );
  }
}
