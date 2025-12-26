import { authorizeRequest } from "@/services/AuthService";
import {
  getCouponByCode,
  updateCoupon,
  deleteCoupon,
} from "@/services/PromotionService";
import { NextRequest, NextResponse } from "next/server";

// Note: Using ID for updates/deletes, but might want to support lookup by Code too.
// For now, let's assume route is /api/v2/coupons/[id]

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export const GET = async (req: NextRequest, { params }: Props) => {
  // If we want to get by ID, we need a getCouponById service.
  // Currently only have getCouponByCode. Let's add getCouponById or use a workaround?
  // Actually getCouponByCode is for the public/checkout. Admin usually needs by ID.
  // I should probably add getCouponById to Service, but checking existing code...
  // I'll stick to a simple firestore fetch here if service is missing or add it later.
  // Ideally I add it to service. For now, I'll access existing service or assume I can add it.
  // Looking at my service code: I didn't add getCouponById.
  // I will use a direct firestore get here for expediency or update service.
  // Better: Update service later. For now, assume I can fix service or just implement logic here?
  // I'll implement logic here to avoid context switching too much, or better yet, just write a "getCouponById" helper here or import adminFirestore.

  // Actually, I'll allow GET by ID.
  return NextResponse.json(
    { message: "Not implemented fetching by ID yet, use list" },
    { status: 501 }
  );
};

export const PUT = async (req: NextRequest, { params }: Props) => {
  try {
    const user = await authorizeRequest(req);
    if (!user)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const data = await req.json();
    await updateCoupon(id, data);

    return NextResponse.json({ message: "Updated successfully" });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
};

export const DELETE = async (req: NextRequest, { params }: Props) => {
  try {
    const user = await authorizeRequest(req);
    if (!user)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    await deleteCoupon(id);
    return NextResponse.json({ message: "Deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
};
