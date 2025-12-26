import { NextResponse } from "next/server";
import { authorizeRequest } from "@/services/AuthService";
import { deletePromotion } from "@/services/WebsiteService";

interface Props {
  params: {
    id: string;
  };
}

export const DELETE = async (req: Request, { params }: Props) => {
  try {
    const response = await authorizeRequest(req);
    if (!response) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    await deletePromotion(params.id);
    return NextResponse.json({ message: "Promotion deleted" });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { message: "Error deleting promotion", error: error.message },
      { status: 500 }
    );
  }
};
