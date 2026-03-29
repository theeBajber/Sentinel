import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/threats
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";

    const threats = await prisma.threatEntry.findMany({
      where: q ? { pattern: { contains: q, mode: "insensitive" } } : {},
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(threats);
  } catch (error) {
    console.error("Failed to fetch threats:", error);
    return NextResponse.json(
      { error: "Failed to fetch threats" },
      { status: 500 },
    );
  }
}

// POST /api/threats
export async function POST(req: NextRequest) {
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

    return NextResponse.json(threat, { status: 201 });
  } catch (error) {
    console.error("Failed to create threat:", error);
    return NextResponse.json(
      { error: "Failed to create threat" },
      { status: 500 },
    );
  }
}

// DELETE /api/threats?id=xxx
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    await prisma.threatEntry.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete threat:", error);
    return NextResponse.json(
      { error: "Failed to delete threat" },
      { status: 500 },
    );
  }
}
