import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuthOrApiKey } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuthOrApiKey(req);
    if (!auth.success) return auth.response;

    const totalScans = await prisma.detectionLog.count();
    const threatsBlocked = await prisma.detectionLog.count({
      where: { verdict: "unsafe" },
    });

    const response = NextResponse.json({
      totalScans,
      threatsBlocked,
      systemHealth: 99.9,
    });

    response.headers.set("Access-Control-Allow-Origin", "*");
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 },
    );
  }
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-API-Key",
    },
  });
}
