import { NextResponse } from "next/server";

export async function middleware(req: Request) {
  const origin = req.headers.get("origin");
  const allowedOrigins = [
    "https://admin.neverbe.lk",
    "https://erp.neverbe.lk",
    "http://neverbe.lk",
    "https://pos.neverbe.lk",
  ];

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
