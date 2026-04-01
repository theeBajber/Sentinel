// app/api/auth/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
console.log("Prisma models:", Object.keys(prisma));

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;
    console.log("Login attempt:", email);

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password required" },
        { status: 400 },
      );
    }
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    console.log("User found:", user ? "yes" : "no");
    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    }

    const valid = await bcrypt.compare(password, user.password);
    console.log("Password valid:", valid);
    if (!valid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    }

    const token = jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: "7d",
    });

    return NextResponse.json({
      token,
      email: user.email,
      userId: user.id,
      name: user.name,
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 },
    );
  }
}
