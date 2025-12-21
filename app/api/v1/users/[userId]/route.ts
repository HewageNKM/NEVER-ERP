import { NextResponse } from "next/server";
import {
  authorizeRequest,
  deleteUser,
  getUserById,
  updateUser,
} from "@/firebase/firebaseAdmin";
import { User } from "@/model/User";

export const GET = async (req: Request) => {
  try {
    const response = await authorizeRequest(req);

    if (!response) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const uid = url.pathname.split("/").pop();
    const user = await getUserById(uid || "None");

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user, { status: 200 });
  } catch (error: any) {
    console.error(error);
    // Return a response with error message
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
};

export const DELETE = async (req: Request) => {
  try {
    const response = await authorizeRequest(req);

    if (!response) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const uid = url.pathname.split("/").pop();
    const timestamp = await deleteUser(uid || "None");
    return NextResponse.json(
      { message: `User deleted at ${timestamp}` },
      { status: 200 }
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: e.message }, { status: 500 });
  }
};

export const PUT = async (req: Request) => {
  try {
    const response = await authorizeRequest(req);

    if (!response) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const uid = url.pathname.split("/").pop();
    const user = await getUserById(uid || "None");

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const body: User = await req.json();
    if (!body) {
      return NextResponse.json(
        { message: "Invalid request body" },
        { status: 400 }
      );
    }
    const updatedUser = await updateUser(body);
    return NextResponse.json(updatedUser, { status: 200 });
  } catch (error: any) {
    console.error(error);
    // Return a response with error message
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
};
