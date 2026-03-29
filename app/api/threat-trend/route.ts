import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const now = new Date();
    const last7Days = new Date();
    last7Days.setDate(now.getDate() - 6);
    last7Days.setHours(0, 0, 0, 0);

    // Check if prisma is properly initialized
    if (!prisma) {
      console.error("Prisma client not initialized");
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 500 },
      );
    }

    let logs: any[] = [];
    try {
      logs =
        (await (prisma as any).DetectionLog?.findMany({
          where: {
            createdAt: { gte: last7Days },
            verdict: "unsafe",
          },
        })) || [];
    } catch (e) {
      console.error(e);
    }

    // Initialize last 7 days (starting from 6 days ago to today)
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const result: { day: string; blocked: number }[] = [];

    // Generate last 7 days starting from today
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

    return NextResponse.json(result);
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
