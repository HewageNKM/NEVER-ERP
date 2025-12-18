// app/api/v2/master/products/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { authorizeRequest, adminFirestore } from "@/firebase/firebaseAdmin";
import { getProductById, updateProduct } from "@/services/ProductService"; // Import your service
import { Product } from "@/model/Product";

interface RouteParams {
  params: Promise<{
    productId: string; // This 'id' comes from the folder name [id]
  }>;
}

/**
 * Helper to parse FormData into a Product object
 */
const parseProductFromFormData = async (
  formData: FormData
): Promise<Partial<Product>> => {
  const product: Partial<Product> = {};
  for (const [key, value] of formData.entries()) {
    if (key === "thumbnail") continue;
    if (key === "variants" || key === "tags" || key === "gender") {
      const parsed = JSON.parse(value as string);
      // Ensure gender is an array of lowercase strings
      if (key === "gender") {
        product.gender = Array.isArray(parsed)
          ? parsed.map((g: string) => g.toLowerCase())
          : [];
      } else {
        product[key as "variants" | "tags"] = parsed;
      }
    } else if (key === "status" || key === "listing") {
      product[key as "status" | "listing"] = value === "true";
    } else if (
      [
        "buyingPrice",
        "sellingPrice",
        "marketPrice",
        "discount",
        "weight",
      ].includes(key)
    ) {
      product[key as "buyingPrice"] = parseFloat(value as string) || 0;
    } else {
      (product as any)[key] = value as string;
    }
  }
  return product;
};
export const GET = async (req: NextRequest, { params }: RouteParams) => {
  try {
    const user = await authorizeRequest(req);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { productId } = await params;
    const product = await getProductById(productId);

    if (!product) {
      return NextResponse.json(
        { message: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(product);
  } catch (error: any) {
    console.error(`GET /api/v2/master/products/ Error:`, error);
    return NextResponse.json(
      { message: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
};

/**
 * PUT: Update an existing product
 */
export const PUT = async (req: NextRequest, { params }: RouteParams) => {
  try {
    const user = await authorizeRequest(req);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { productId } = await params;
    const formData = await req.formData();

    // --- MODIFIED LOGIC ---
    const thumbnailValue = formData.get("thumbnail");
    let file: File | null = null;
    let existingThumbnail: Product["thumbnail"] | null = null;

    if (thumbnailValue instanceof File) {
      // It's a new file upload
      file = thumbnailValue;
    } else if (typeof thumbnailValue === "string") {
      // It's the old thumbnail data (JSON string)
      existingThumbnail = JSON.parse(thumbnailValue);
    }
    // --- END MODIFICATION ---

    const productData = await parseProductFromFormData(formData);

    // If we received the old thumbnail data, add it to productData
    if (existingThumbnail) {
      productData.thumbnail = existingThumbnail;
    }

    // Pass the product data and the (potentially null) new file
    const success = await updateProduct(productId, productData, file);

    if (!success) {
      throw new Error("Failed to update product");
    }

    return NextResponse.json({ message: "Product updated successfully" });
  } catch (error: any) {
    console.error(`PUT /api/v2/master/products/ Error:`, error);
    return NextResponse.json(
      { message: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
};

/**
 * DELETE: Soft-delete a product
 */
export const DELETE = async (req: NextRequest, { params }: RouteParams) => {
  try {
    const user = await authorizeRequest(req);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // --- CRITICAL FIX: Use productId, not id ---
    const { productId } = await params;

    // Perform a soft delete by updating the 'isDeleted' flag
    await adminFirestore
      .collection("products")
      .doc(productId) // <-- FIXED
      .update({
        isDeleted: true,
        updatedAt: new Date(),
      });

    return NextResponse.json({ message: "Product deleted successfully" });
  } catch (error: any) {
    console.error(`DELETE /api/v2/master/products/ Error:`, error);
    return NextResponse.json(
      { message: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
};
