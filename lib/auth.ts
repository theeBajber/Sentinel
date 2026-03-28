// lib/auth.ts
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function requireAuth(
  req: NextRequest,
): Promise<{ success: boolean; response?: NextResponse }> {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");

  if (!token) {
    return {
      success: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  try {
    jwt.verify(token, JWT_SECRET);
    return { success: true };
  } catch {
    return {
      success: false,
      response: NextResponse.json({ error: "Invalid token" }, { status: 401 }),
    };
  }
}
