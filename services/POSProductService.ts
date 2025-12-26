// ================================
// 🔹 POS PRODUCT OPERATIONS
// ================================

import { adminFirestore } from "@/firebase/firebaseAdmin";
import { Product } from "@/model/Product";

export interface StockInventoryItem {
  productId: string;
  variantId: string;
  size: string;
  stockId: string;
  quantity: number;
}

// ================================
// ✅ Get products available at a specific stock location
// ================================
export const getProductsByStock = async (
  stockId: string,
  page: number = 1,
  size: number = 20
): Promise<Product[]> => {
  console.log(`Fetching products for stockId: ${stockId}`);

  try {
    if (!stockId) return [];

    // 1️⃣ Fetch stock inventory items for the given stockId
    const stockSnapshot = await adminFirestore
      .collection("stock_inventory")
      .where("stockId", "==", stockId)
      .get();

    if (stockSnapshot.empty) {
      console.log("No inventory found for stockId:", stockId);
      return [];
    }

    // 2️⃣ Extract unique productIds with quantity > 0
    const productIdsSet = new Set<string>();
    stockSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      if (data.productId && data.quantity > 0) {
        productIdsSet.add(data.productId);
      }
    });

    const productIds = Array.from(productIdsSet);
    if (productIds.length === 0) return [];

    // 3️⃣ Pagination
    const offset = (page - 1) * size;
    const paginatedProductIds = productIds.slice(offset, offset + size);

    if (paginatedProductIds.length === 0) return [];

    // 4️⃣ Fetch products from `products` collection
    const productsCollection = adminFirestore.collection("products");
    const productsSnapshot = await productsCollection
      .where("isDeleted", "==", false)
      .where("status", "==", true)
      .where("id", "in", paginatedProductIds)
      .get();

    const products: Product[] = productsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Product),
    }));

    console.log("Products retrieved:", products.length);
    return products;
  } catch (error) {
    console.error("Error retrieving inventory products:", error);
    throw error;
  }
};

// ================================
// ✅ Search products by name with stock filtering
// ================================
export const searchProductsByStock = async (
  stockId: string,
  query: string
): Promise<Product[]> => {
  try {
    if (!stockId || !query) return [];

    // 1️⃣ Fetch stock inventory items for the given stockId
    const stockSnapshot = await adminFirestore
      .collection("stock_inventory")
      .where("stockId", "==", stockId)
      .get();

    if (stockSnapshot.empty) return [];

    // 2️⃣ Extract unique productIds with quantity > 0
    const productIdsSet = new Set<string>();
    stockSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      if (data.productId && data.quantity > 0) {
        productIdsSet.add(data.productId);
      }
    });

    const productIds = Array.from(productIdsSet);
    if (productIds.length === 0) return [];

    // 3️⃣ Fetch all matching products
    // Note: Firestore doesn't support full-text search, so we fetch all and filter
    const productsSnapshot = await adminFirestore
      .collection("products")
      .where("isDeleted", "==", false)
      .where("status", "==", true)
      .get();

    const lowerQuery = query.toLowerCase();
    const products: Product[] = productsSnapshot.docs
      .filter((doc) => {
        const data = doc.data();
        return (
          productIds.includes(doc.id) &&
          (data.name?.toLowerCase().includes(lowerQuery) ||
            data.sku?.toLowerCase().includes(lowerQuery) ||
            data.brand?.toLowerCase().includes(lowerQuery))
        );
      })
      .map((doc) => ({
        id: doc.id,
        ...(doc.data() as Product),
      }));

    return products;
  } catch (error) {
    console.error("Error searching products:", error);
    throw error;
  }
};

// ================================
// ✅ Get stock inventory for specific product/variant/size
// ================================
export const getStockInventory = async (
  stockId: string,
  productId: string,
  variantId: string,
  size: string
): Promise<StockInventoryItem | null> => {
  try {
    const stockSnapshot = await adminFirestore
      .collection("stock_inventory")
      .where("stockId", "==", stockId)
      .where("productId", "==", productId)
      .where("variantId", "==", variantId)
      .where("size", "==", size)
      .limit(1)
      .get();

    if (stockSnapshot.empty) {
      console.log("No inventory found for:", {
        stockId,
        productId,
        variantId,
        size,
      });
      return null;
    }

    return stockSnapshot.docs[0].data() as StockInventoryItem;
  } catch (error) {
    console.error("Error fetching stock inventory:", error);
    throw error;
  }
};

// ================================
// ✅ Get all inventory for a product at a stock location
// ================================
export const getProductInventoryByStock = async (
  stockId: string,
  productId: string
): Promise<StockInventoryItem[]> => {
  try {
    const stockSnapshot = await adminFirestore
      .collection("stock_inventory")
      .where("stockId", "==", stockId)
      .where("productId", "==", productId)
      .get();

    if (stockSnapshot.empty) return [];

    return stockSnapshot.docs.map((doc) => doc.data() as StockInventoryItem);
  } catch (error) {
    console.error("Error fetching product inventory:", error);
    throw error;
  }
};

// ================================
// ✅ Get available stocks list
// ================================
export const getAvailableStocks = async (): Promise<
  { id: string; name: string; label: string }[]
> => {
  try {
    const stocksSnapshot = await adminFirestore
      .collection("stocks")
      .where("status", "==", true)
      .get();

    return stocksSnapshot.docs.map((doc) => ({
      id: doc.id,
      name: doc.data().name || doc.id,
      label: doc.data().label || doc.data().name || doc.id,
    }));
  } catch (error) {
    console.error("Error fetching stocks:", error);
    throw error;
  }
};
