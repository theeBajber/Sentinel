import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    // const auth = await requireAuth(req);
    // if (!auth.success) return auth.response;
    const totalScans = await prisma.detectionLog.count();
    const threatsBlocked = await prisma.detectionLog.count({
      where: { verdict: "unsafe" },
    });

    return NextResponse.json({
      totalScans,
      threatsBlocked,
      systemHealth: 99.9,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 },
    );
  }
}
