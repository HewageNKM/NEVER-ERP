import { NextResponse } from "next/server";

export async function middleware(req: Request) {
  const origin = req.headers.get("origin");

  // Define allowed origins
  const allowedOrigins = ["https://admin.neverbe.lk", "https://erp.neverbe.lk","http://neverbe.lk","https://pos.neverbe.lk"];

  // Handle CORS for all requests
  if (req.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin":
          origin && allowedOrigins.includes(origin) ? origin : "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  // Same-origin request handling
  if (!origin) {
    // No Origin header indicates a same-origin request
    console.log("Allowed: Same-origin request");
    return NextResponse.next(); // Allow the request
  }

  if (origin === "https://admin.neverbe.lk") {
    // Cross-origin request from allowed origin
    console.log(`Allowed: Cross-origin request from ${origin}`);
    return NextResponse.next(); // Allow the request
  }

  // Block requests from other origins
  console.log(`Blocked: Request from unknown origin: ${origin}`);
  return new NextResponse("Forbidden", { status: 403 });
}

// Apply the middleware to all API routes
export const config = {
  matcher: "/api/:path*",
};
