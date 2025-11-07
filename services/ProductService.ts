import { adminFirestore, adminStorageBucket } from "@/firebase/firebaseAdmin";
import { Product } from "@/model/Product";
import { ProductVariant } from "@/model/ProductVariant";
import { nanoid } from "nanoid";
import { generateTags } from "./AIService";
import { FieldValue } from "firebase-admin/firestore";
import { toSafeLocaleString } from "./UtilService";

const PRODUCTS_COLLECTION = "products";
const BUCKET = adminStorageBucket;

// ... (uploadThumbnail function remains unchanged) ...
const uploadThumbnail = async (
  file: File,
  id: string
): Promise<Product["thumbnail"]> => {
  const filePath = `products/${id}/thumbnail/${file.name}`;
  const fileRef = BUCKET.file(filePath);
  const buffer = Buffer.from(await file.arrayBuffer());

  await fileRef.save(buffer, {
    metadata: {
      contentType: file.type,
    },
  });

  await fileRef.makePublic();
  const url = `https://storage.googleapis.com/${BUCKET.name}/${filePath}`;

  return {
    url: url,
    file: filePath,
    order: 0,
  };
};

/**
 * Adds a new product to Firestore, now including generated keywords.
 * UPDATED to await generateTags
 */
export const addProducts = async (product: Partial<Product>, file: File) => {
  try {
    const id = `p-${nanoid(8)}`;

    // 1. Upload thumbnail
    const thumbnail = await uploadThumbnail(file, id);

    const textContext = `
      Name: ${product.name || ""}
      Description: ${product.description || ""}
      Variants: ${(product.variants || []).map((v) => v.variantName).join(", ")}
    `;
    const tags = await generateTags("Extract product tags", textContext);
    tags.push(product.brand?.toLocaleLowerCase());
    tags.push(product.category?.toLocaleLowerCase());
    const newProductDocument: Product = {
      ...(product as Product), // Cast after filling required fields
      id: id,
      productId: id,
      thumbnail: thumbnail,
      tags: tags,
      isDeleted: false,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    await adminFirestore
      .collection(PRODUCTS_COLLECTION)
      .doc(id)
      .set(newProductDocument);

    console.log(`Product added with ID: ${id}`);

    return true;
  } catch (err) {
    console.error("Error adding product:", err);
    return false;
  }
};

/**
 * UPDATED to await generateTags
 */
export const updateProduct = async (
  id: string,
  product: Partial<Product>,
  file?: File | null
) => {
  try {
    const textContext = `
      Name: ${product.name || ""}
      Description: ${product.description || ""}
      Variants: ${(product.variants || []).map((v) => v.variantName).join(", ")}
    `;
    const tags = await generateTags("Extract product tags", textContext);
    tags.push(product.brand?.toLocaleLowerCase());
    tags.push(product.category?.toLocaleLowerCase());
    let thumbnail = product.thumbnail;

    if (file) {
      const oldProduct = await getProductById(id);
      const oldPath = oldProduct?.thumbnail?.file; 
      if (oldPath) {
        try {
          await BUCKET.file(oldPath).delete();
        } catch (delError) {
          console.warn(`Failed to delete old thumbnail: ${oldPath}`, delError);
        }
      }
      thumbnail = await uploadThumbnail(file, id);
    }

    const updatedProductDocument = {
      name: product.name,
      category: product.category,
      brand: product.brand,
      description: product.description,
      buyingPrice: product.buyingPrice,
      sellingPrice: product.sellingPrice,
      marketPrice: product.marketPrice,
      discount: product.discount,
      listing: product.listing,
      weight: product.weight,
      variants: product.variants,
      status: product.status,
      thumbnail: thumbnail,
      tags: tags,
      updatedAt: new Date(),
    };

    await adminFirestore
      .collection(PRODUCTS_COLLECTION)
      .doc(id)
      .set(updatedProductDocument, { merge: true }); // Use set with merge

    console.log(`Product updated with ID: ${id}`);
    return true;
  } catch (error) {
    console.log("Error updating product:", error); // Added log message
    return false;
  }
};
export const getProducts = async (
  pageNumber = 1,
  size = 20,
  search?: string,
  brand?: string,
  category?: string,
  status?: boolean,
  listing?: boolean
): Promise<{ dataList: Omit<Product, "isDeleted">[]; rowCount: number }> => {
  try {
    let query: FirebaseFirestore.Query = adminFirestore
      .collection(PRODUCTS_COLLECTION)
      .where("isDeleted", "==", false);
    let countQuery: FirebaseFirestore.Query = adminFirestore
      .collection(PRODUCTS_COLLECTION)
      .where("isDeleted", "==", false);

    // Filters
    if (brand) {
      query = query.where("brand", "==", brand);
      countQuery = countQuery.where("brand", "==", brand);
    }
    if (category) {
      query = query.where("category", "==", category);
      countQuery = countQuery.where("category", "==", category);
    }
    if (typeof status === "boolean") {
      query = query.where("status", "==", status);
      countQuery = countQuery.where("status", "==", status);
    }
    if (typeof listing === "boolean") {
      query = query.where("listing", "==", listing);
      countQuery = countQuery.where("listing", "==", listing);
    }

    // Search using AI-generated tags
    if (search) {
      const searchContext = `Name: ${search}\nDescription: ${search}`;
      const searchTags = await generateTags(
        "Extract product tags for search",
        searchContext
      );

      if (searchTags.length > 0) {
        query = query.where("tags", "array-contains-any", searchTags);
        countQuery = countQuery.where("tags", "array-contains-any", searchTags);
      } else {
        query = query.where(
          "tags",
          "array-contains",
          `__no_match__${nanoid()}`
        );
        countQuery = countQuery.where(
          "tags",
          "array-contains",
          `__no_match__${nanoid()}`
        );
      }
    }

    // Count total rows
    const rowCount = (await countQuery.get()).size;

    // Pagination
    const offset = (pageNumber - 1) * size;
    const productsSnapshot = await query.offset(offset).limit(size).get();

    const products = productsSnapshot.docs.map((doc) => {
      const data = doc.data() as any;
      const activeVariants = (data.variants || []).filter(
        (v: ProductVariant & { isDeleted?: boolean }) => !v.isDeleted
      );

      return {
        ...data,
        productId: doc.id,
        variants: activeVariants,
        createdAt:toSafeLocaleString(data.createdAt),
        updatedAt:toSafeLocaleString(data.updatedAt),
      } as Omit<Product, "isDeleted">;
    });

    return { dataList: products, rowCount };
  } catch (error) {
    console.error("Get Products Error:", error);
    throw error;
  }
};

// Get product by ID
export const getProductById = async (id: string): Promise<Product | null> => {
  try {
    const docSnap = await adminFirestore
      .collection(PRODUCTS_COLLECTION)
      .doc(id)
      .get();
    if (!docSnap.exists || docSnap.data()?.isDeleted) return null;

    const data = docSnap.data() as any;
    const activeVariants = (data.variants || []).filter(
      (v: ProductVariant & { isDeleted?: boolean }) => !v.isDeleted
    );

    return {
      ...data,
      productId: docSnap.id,
      variants: activeVariants,
    } as Product;
  } catch (error) {
    console.error("Get Product By ID Error:", error);
    throw error;
  }
};

// Get product dropdown for active products
export const getProductDropdown = async () => {
  try {
    const snapshot = await adminFirestore
      .collection(PRODUCTS_COLLECTION)
      .where("isDeleted", "==", false)
      .where("status", "==", true)
      .get();

    return snapshot.docs.map((doc) => ({ id: doc.id, label: doc.data().name }));
  } catch (error) {
    console.error("Get Product Dropdown Error:", error);
    throw error;
  }
};
