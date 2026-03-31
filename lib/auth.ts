// lib/auth.ts - COMPLETE REPLACEMENT
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "./db";
import bcrypt from "bcryptjs";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export interface AuthResult {
  success: boolean;
  response?: NextResponse;
  apiKeyId?: string;
  source?: "jwt" | "apikey" | "public";
}

// Require JWT authentication (for web dashboard)
export async function requireAuth(req: NextRequest): Promise<AuthResult> {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");

  if (!token) {
    return {
      success: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  try {
    jwt.verify(token, JWT_SECRET);
    return { success: true, source: "jwt" };
  } catch {
    return {
      success: false,
      response: NextResponse.json({ error: "Invalid token" }, { status: 401 }),
    };
  }
}

// Require either JWT or API Key (for extension endpoints)
export async function requireAuthOrApiKey(
  req: NextRequest,
): Promise<AuthResult> {
  const authHeader = req.headers.get("authorization") || "";

  // Try JWT first (web dashboard)
  if (authHeader.startsWith("Bearer ")) {
    const token = authHeader.replace("Bearer ", "");
    try {
      jwt.verify(token, JWT_SECRET);
      return { success: true, source: "jwt" };
    } catch {
      // Invalid JWT, continue to check API key
    }
  }

  const apiKeyHeader = req.headers.get("x-api-key");
  if (apiKeyHeader && apiKeyHeader.startsWith("sent_")) {
    const result = await validateApiKey(apiKeyHeader);
    if (result.valid && result.apiKeyId) {
      return {
        success: true,
        source: "apikey",
        apiKeyId: result.apiKeyId,
      };
    }
  }

  return {
    success: false,
    response: NextResponse.json(
      {
        error:
          "Unauthorized. Provide valid JWT Bearer token or X-API-Key header.",
      },
      { status: 401 },
    ),
  };
}

export async function optionalAuth(req: NextRequest): Promise<AuthResult> {
  const authResult = await requireAuthOrApiKey(req);
  if (authResult.success) {
    return authResult;
  }
  // Allow anonymous access
  return { success: true, source: "public" };
}

async function validateApiKey(
  key: string,
): Promise<{ valid: boolean; apiKeyId?: string }> {
  try {
    // Find active API keys and check if any match
    const apiKeys = await prisma.apiKey.findMany({
      where: { isActive: true },
      select: { id: true, key: true },
    });

    for (const apiKey of apiKeys) {
      // Use timing-safe comparison
      const isValid = await bcrypt.compare(key, apiKey.key);
      if (isValid) {
        // Update last used
        await prisma.apiKey.update({
          where: { id: apiKey.id },
          data: { lastUsed: new Date() },
        });
        return { valid: true, apiKeyId: apiKey.id };
      }
    }

    return { valid: false };
  } catch (error) {
    console.error("API key validation error:", error);
    return { valid: false };
  }
}

// Check if API key has specific permission
export async function checkPermission(
  apiKeyId: string,
  permission: string,
): Promise<boolean> {
  const apiKey = await prisma.apiKey.findUnique({
    where: { id: apiKeyId },
    select: { permissions: true },
  });

  if (!apiKey) return false;
  return (
    apiKey.permissions.includes(permission) || apiKey.permissions.includes("*")
  );
}

// Generate a new API key (for admin use)
export async function generateApiKey(
  name: string,
  permissions: string[],
  createdBy?: string,
): Promise<{ key: string; id: string }> {
  // Generate random key: sent_<32 random chars>
  const randomPart = Array.from(crypto.getRandomValues(new Uint8Array(24)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 32);

  const plainKey = `sent_${randomPart}`;
  const hashedKey = await bcrypt.hash(plainKey, 10);

  const apiKey = await prisma.apiKey.create({
    data: {
      name,
      key: hashedKey,
      permissions,
      createdBy,
    },
  });

  return { key: plainKey, id: apiKey.id };
}
