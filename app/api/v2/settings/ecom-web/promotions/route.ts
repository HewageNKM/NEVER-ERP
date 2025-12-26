import { NextResponse } from "next/server";
import { authorizeRequest } from "@/services/AuthService";
import { uploadFile } from "@/services/StorageService";
import { addPromotion, getAllPromotions } from "@/services/WebsiteService";

export const GET = async (req: Request) => {
  try {
    const response = await authorizeRequest(req);
    if (!response) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const promotions = await getAllPromotions();
    return NextResponse.json(promotions);
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { message: "Error fetching promotions", error: error.message },
      { status: 500 }
    );
  }
};

export const POST = async (req: Request) => {
  try {
    const response = await authorizeRequest(req);
    if (!response) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const title = formData.get("title") as string;
    const link = formData.get("link") as string;

    if (!file || !title || !link) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    const { url } = await uploadFile(file, "promotions");
    const id = await addPromotion({ file: file.name, url, title, link });
    return NextResponse.json({ id });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { message: "Error creating promotion", error: error.message },
      { status: 500 }
    );
  }
};

export const dynamic = "force-dynamic";
