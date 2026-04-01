import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, generateApiKey } from "@/lib/auth";

// GET - List user's API keys
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.success) return auth.response;

  try {
    const keys = await prisma.apiKey.findMany({
      where: { userId: auth.userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        permissions: true,
        createdAt: true,
        lastUsed: true,
        isActive: true,
      },
    });

    return NextResponse.json(keys);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch API keys" },
      { status: 500 },
    );
  }
}

// POST - Create new API key
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.success) return auth.response;
  if (!auth.userId) {
    return NextResponse.json({ error: "User ID not found" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const { name, permissions } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const result = await generateApiKey(
      name.trim(),
      permissions || ["read:logs"],
      auth.userId,
    );

    return NextResponse.json({
      id: result.id,
      key: result.key, // Plain key - shown only once
      name: name.trim(),
      permissions: permissions || ["read:logs"],
    });
  } catch (error) {
    console.error("Failed to create API key:", error);
    return NextResponse.json(
      { error: "Failed to create API key" },
      { status: 500 },
    );
  }
}

// DELETE - Revoke API key
export async function DELETE(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.success) return auth.response;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    // Verify key belongs to user
    const key = await prisma.apiKey.findFirst({
      where: { id, userId: auth.userId },
    });

    if (!key) {
      return NextResponse.json({ error: "API key not found" }, { status: 404 });
    }

    await prisma.apiKey.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete API key" },
      { status: 500 },
    );
  }
}
