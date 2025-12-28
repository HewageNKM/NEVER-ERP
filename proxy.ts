import { NextResponse } from "next/server";
import { errorResponse } from "@/utils/apiResponse";

export default async function proxy(req: Request) {
  const { pathname } = new URL(req.url);
  const origin = req.headers.get("origin");
  const allowedOrigins = ["https://erp.neverbe.lk", "http://neverbe.lk"];

  const isAllowedOrigin = origin && allowedOrigins.includes(origin);
  const corsHeaders = {
    "Access-Control-Allow-Origin": isAllowedOrigin ? origin! : "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  // ✅ Handle preflight request
  if (req.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  // ✅ Public Routes (No Auth Required)
  const publicPaths = ["/api/auth/login", "/api/auth/logout"];

  // Simple strict matching for now, or use startsWith if paths are nested
  const isPublic = publicPaths.some((path) => pathname.startsWith(path));

  if (!isPublic) {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return errorResponse(
        "Unauthorized: Missing or invalid token format",
        401,
        corsHeaders
      );
    }
    // Note: Signature verification is deferred to the specific API route handler
    // or downstream service to avoid Edge Runtime compatibility issues with firebase-admin.
  }

  // ✅ For all other requests, continue and attach CORS headers
  const response = NextResponse.next();
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

// ✅ Apply to all API routes
export const config = {
  matcher: "/api/:path*",
};
