import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuthOrApiKey } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuthOrApiKey(req);
    if (!auth.success) return auth.response;

    const now = new Date();
    const last7Days = new Date();
    last7Days.setDate(now.getDate() - 6);
    last7Days.setHours(0, 0, 0, 0);

    const where: any = {
      createdAt: { gte: last7Days },
      verdict: "unsafe",
    };

    if (auth.userId) {
      where.userId = auth.userId;
    }

    const logs = await prisma.detectionLog.findMany({
      where,
      select: {
        createdAt: true,
      },
    });

    // Initialize last 7 days
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const result: { day: string; blocked: number }[] = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayName = days[d.getDay()];
      result.push({ day: dayName, blocked: 0 });
    }

    // Count logs by day
    logs.forEach((log: any) => {
      const logDate = new Date(log.createdAt);
      const dayIndex = result.findIndex((r) => {
        const rDate = new Date(now);
        rDate.setDate(rDate.getDate() - (6 - result.indexOf(r)));
        return rDate.toDateString() === logDate.toDateString();
      });

      if (dayIndex !== -1) {
        result[dayIndex].blocked++;
      }
    });

    const response = NextResponse.json(result);
    response.headers.set("Access-Control-Allow-Origin", "*");
    return response;
  } catch (error) {
    console.error("Threat trend API error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch threat data",
        details: (error as Error).message,
      },
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
