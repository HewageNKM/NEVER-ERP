import { NextResponse } from "next/server";
import {
  addNewUser,
  authorizeRequest,
  getUsers,
} from "@/firebase/firebaseAdmin";
import { User } from "@/model/User";

export const GET = async (req: Request) => {
  try {
    // Verify the ID token
    const response = await authorizeRequest(req);
    if (!response) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Get the URL and parse the query parameters
    const url = new URL(req.url);
    const pageNumber = parseInt(url.searchParams.get("page") as string) || 1;
    const size = parseInt(url.searchParams.get("size") as string) || 20;

    console.log(`Page number: ${pageNumber}, Size: ${size}`);
    const orders = await getUsers(pageNumber, size);
    console.log(`Orders: ${orders.length}`);
    // Return a response with the orders
    return NextResponse.json(orders);
  } catch (error: any) {
    console.error(error);
    // Return a response with error message
    return NextResponse.json(
      { message: "Error fetching users", error: error.message },
      { status: 500 }
    );
  }
};
export const POST = async (req: Request) => {
  try {
    // Verify the ID token
    const response = await authorizeRequest(req);
    if (!response) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body: User = await req.json();
    if (!body) {
      return NextResponse.json(
        { message: "Invalid request body" },
        { status: 400 }
      );
    }

    const user = await addNewUser(body);
    return NextResponse.json(user);
  } catch (error: any) {
    console.error(error);
    // Return a response with error message
    return NextResponse.json(
      { message: "Error creating user", error: error.message },
      { status: 500 }
    );
  }
};
export const dynamic = "force-dynamic";
