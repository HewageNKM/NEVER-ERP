import admin, { credential } from "firebase-admin";
import {
  CashFlowReport,
  Email,
  Expense,
  ExpensesReport,
  Item,
  Order,
  PaymentMethod,
  PopularItem,
  SalesReport,
  SMS,
  StocksReport,
  User,
} from "@/model";
import { uuidv4 } from "@firebase/util";
import { Timestamp } from "firebase-admin/firestore";
import { generateRandomPassword, hashPassword } from "@/utils/Generate";
import axios from "axios";
import {
  updateOrAddOrderHash,
  validateDocumentIntegrity,
} from "@/services/IntegrityService";
import { toSafeLocaleString } from "@/services/UtilService";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: credential.cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
  });
}

export const adminFirestore = admin.firestore();
export const adminAuth = admin.auth();
export const adminStorageBucket = admin
  .storage()
  .bucket(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);

// const adminFirestore = admin.firestore();

// --- Helper Functions (from previous conversation) ---

export const getOrders = async (pageNumber: number = 1, size: number = 20) => {
  try {
    const offset = (pageNumber - 1) * size;

    // Fetch orders with pagination and sorting by createdAt
    const ordersSnapshot = await adminFirestore
      .collection("orders")
      .orderBy("createdAt", "desc") // OrderBy must come before limit/offset
      .limit(size)
      .offset(offset)
      .get();

    const orders: Order[] = [];

    // 1. Replaced forEach with a for...of loop to handle async/await
    for (const doc of ordersSnapshot.docs) {
      const orderData = doc.data() as Order;

      // 2. Passed 'adminFirestore' as the first argument
      const integrityResult = await validateDocumentIntegrity("orders", doc.id);

      const order: Order = {
        ...orderData,
        orderId: doc.id,
        integrity: integrityResult,
        customer: orderData.customer
          ? {
              ...orderData.customer,
              updatedAt: orderData.updatedAt
                ? toSafeLocaleString(orderData.customer.updatedAt)
                : null,
            }
          : null,
        createdAt: toSafeLocaleString(orderData.createdAt), // 5. Safe conversion
        updatedAt: toSafeLocaleString(orderData.updatedAt), // 5. Safe conversion
        restockedAt: orderData.restockedAt
          ? toSafeLocaleString(orderData.restockedAt)
          : null,
      };

      orders.push(order);
    }

    console.log(`Fetched ${orders.length} orders on page ${pageNumber}`);
    return orders;
  } catch (error: any) {
    console.error(error);
    throw error;
  }
};

export const getInventoryItems = async (
  pageNumber: number = 1,
  size: number = 20
) => {
  try {
    const offset = (pageNumber - 1) * size;

    // Fetch inventory items with pagination
    const inventorySnapshot = await adminFirestore
      .collection("products")
      .orderBy("createdAt", "desc" as any)
      .limit(size)
      .offset(offset)
      .get();

    let items: Item[] = [];
    inventorySnapshot.forEach((doc) => {
      items.push({
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate().toLocaleString(),
        updatedAt: doc.data().updatedAt.toDate().toLocaleString(),
      } as Item);
    });

    console.log(
      `Fetched ${items.length} inventory items on page ${pageNumber}`
    );
    return items;
  } catch (error: any) {
    console.error(error);
    throw error;
  }
};

export const getOrder = async (orderId: string): Promise<Order | null> => {
  try {
    const snapshot = await adminFirestore
      .collection("orders")
      .where("orderId", "==", orderId)
      .limit(1)
      .get();

    // Check if no document found
    if (snapshot.empty) {
      console.warn(`Order with ID ${orderId} not found`);
      return null;
    }

    // Extract the first document
    const doc = snapshot.docs[0];
    const data = doc.data();
    const integrity = await validateDocumentIntegrity("orders", doc.id);

    // Convert timestamps to readable strings
    return {
      orderId: doc.id,
      ...data,
      customer: data.customer
        ? {
            ...data.customer,
            updatedAt: data.customer.updatedAt?.toDate().toLocaleString() ?? "",
          }
        : null,
      createdAt: data.createdAt?.toDate().toLocaleString() ?? "",
      updatedAt: data.updatedAt?.toDate().toLocaleString() ?? "",
      integrity: integrity,
      restockedAt: data.restockedAt
        ? toSafeLocaleString(data.restockedAt)
        : null,
    } as Order;
  } catch (error) {
    console.error("Error fetching order:", error);
    throw error;
  }
};

export const getItemById = async (itemId: string) => {
  try {
    const itemDoc = await adminFirestore
      .collection("products")
      .doc(itemId)
      .get();
    if (!itemDoc.exists) {
      console.warn(`Item with ID ${itemId} not found`);
      return null;
    }

    const itemData = itemDoc.data();
    return {
      ...itemData,
      createdAt: itemData?.createdAt.toDate().toLocaleString(),
      updatedAt: itemData?.updatedAt.toDate().toLocaleString(),
    } as Item;
  } catch (error: any) {
    console.error(error);
    throw error;
  }
};

export const updateOrder = async (order: Order) => {
  const updatedOrder: Order = {
    ...order,
    customer: order?.customer
      ? {
          ...order.customer,
          createdAt: admin.firestore.Timestamp.fromDate(
            new Date(order.customer.createdAt)
          ),
          updatedAt: admin.firestore.Timestamp.fromDate(
            new Date(order.customer.updatedAt)
          ),
        }
      : null,
    createdAt: admin.firestore.Timestamp.fromDate(new Date(order.createdAt)),
    updatedAt: admin.firestore.Timestamp.fromDate(new Date(order.updatedAt)),
  };
  try {
    await adminFirestore
      .collection("orders")
      .doc(order.orderId)
      .set(
        {
          ...updatedOrder,
        },
        { merge: true }
      );

    console.log(`Order with ID ${order.orderId} updated successfully`);
    const orderDoc = await adminFirestore
      .collection("orders")
      .doc(order.orderId)
      .get();
    if (!orderDoc.exists)
      throw new Error(`Order with ID ${order.orderId} not found`);
    await updateOrAddOrderHash(orderDoc.data());
    return orderDoc.data() as Order;
  } catch (error: any) {
    console.error(error);
    throw error;
  }
};

export const saveToInventory = async (item: Item) => {
  const itemRef = adminFirestore.collection("inventory").doc(item.itemId);

  try {
    await adminFirestore.runTransaction(async (transaction) => {
      const doc = await transaction.get(itemRef);

      if (doc.exists) {
        throw new Error(
          `Item with ID ${item.itemId} already exists in inventory`
        );
      }

      transaction.set(itemRef, {
        ...item,
        createdAt: admin.firestore.Timestamp.fromDate(new Date(item.createdAt)),
        updatedAt: admin.firestore.Timestamp.fromDate(new Date(item.updatedAt)),
      });
    });

    console.log(`Item with ID ${item.itemId} created in inventory`);
  } catch (error: any) {
    console.error(error);
    throw error;
  }
};

export const updateItem = async (item: Item) => {
  const itemRef = admin.firestore().collection("inventory").doc(item.itemId);

  try {
    // Start a transaction
    await admin.firestore().runTransaction(async (transaction) => {
      // Fetch the current document in the transaction
      const doc = await transaction.get(itemRef);

      if (!doc.exists) {
        throw new Error(`Item with ID ${item.itemId} not found`);
      }

      // Create an object with the fields to update
      const itemData = {
        marketPrice: item.marketPrice,
        manufacturer: item.manufacturer,
        name: item.name,
        genders: item.genders,
        description: item.description,
        sellingPrice: item.sellingPrice,
        buyingPrice: item.buyingPrice,
        itemId: item.itemId,
        brand: item.brand,
        status: item.status,
        thumbnail: item.thumbnail,
        type: item.type,
        discount: item.discount,
        variants: item.variants,
        listing: item.listing,
        updatedAt: admin.firestore.Timestamp.fromDate(new Date(item.updatedAt)),
      };

      // Update the item data in Firestore
      transaction.set(itemRef, itemData, { merge: true });
    });

    console.log(
      `Item with ID ${item.itemId} updated in inventory successfully.`
    );
  } catch (error: any) {
    console.error(`Failed to update item with ID ${item.itemId}:`, error);
    throw error; // Rethrow the error to propagate it
  }
};

export const uploadFile = async (file: File, path: string) => {
  try {
    // Generate a custom file name and construct file path
    const customFileName = `${file.name}`;
    const filePath = `${path}/${customFileName}`;
    const fileRef = adminStorageBucket.file(filePath);

    // Convert the file to a buffer
    const buffer = await file.arrayBuffer();

    // Upload the file to Firebase Storage
    await fileRef.save(Buffer.from(buffer), {
      metadata: {
        contentType: file.type,
        firebaseStorageDownloadTokens: uuidv4(),
      },
    });

    // Make the file publicly accessible
    await fileRef.makePublic();

    // Log the upload details
    console.log(`File uploaded successfully: ${customFileName}`);
    console.log(`File path: ${filePath}`);
    console.log(`File size: ${file.size} bytes`);

    // Return file details
    return {
      file: customFileName,
      url: `https://storage.googleapis.com/${adminStorageBucket.name}/${fileRef.name}`,
    };
  } catch (error: any) {
    console.error(`Error uploading file: ${file.name}`, error);
    throw error;
  }
};

// Delete a file from Firebase Storage
export const deleteFiles = async (path: string) => {
  try {
    // Check if the file exists before attempting deletion
    const file = adminStorageBucket.file(path);
    const [exists] = await file.exists();

    if (!exists) {
      console.log(`File at ${path} does not exist. Skipping deletion.`);
      return;
    }

    // Proceed to delete the file
    await file.delete();
    console.log(`File at ${path} deleted successfully`);
  } catch (error: any) {
    // Specific error for file not found
    if (error.code === 404) {
      console.log(`File at ${path} not found in storage. Skipping deletion.`);
      return;
    }

    // Log other types of errors
    console.error(`Error deleting file at ${path}:`, error);
    throw error;
  }
};

export const deleteItemById = async (itemId: string) => {
  console.log(`[START] Deleting item with ID: ${itemId}`);

  try {
    return await adminFirestore.runTransaction(async (transaction) => {
      // Step 1: Log the start of file deletion
      console.log(
        `[INFO] Retrieving files from storage for item ID: ${itemId}`
      );
      const [files] = await adminStorageBucket.getFiles({
        prefix: `inventory/${itemId}/`,
      });

      if (files.length === 0) {
        console.log(`[INFO] No files found for item ID: ${itemId}`);
      } else {
        console.log(
          `[INFO] Found ${files.length} files for item ID: ${itemId}. Starting deletion.`
        );
      }

      // Step 2: Log each file being deleted and delete them
      const deletePromises = files.map(async (file) => {
        console.log(`[INFO] Deleting file: ${file.name}`);
        await file.delete();
      });

      // Delete files in parallel
      await Promise.all(deletePromises);
      console.log(
        `[SUCCESS] All files for item ID: ${itemId} deleted successfully`
      );

      // Step 3: Log Firestore document deletion and delete it
      console.log(`[INFO] Deleting Firestore document for item ID: ${itemId}`);
      const itemRef = adminFirestore.collection("inventory").doc(itemId);

      // Check if the document exists before attempting to delete it
      const itemDoc = await transaction.get(itemRef);
      if (!itemDoc.exists) {
        throw new Error(`Item with ID ${itemId} not found in Firestore.`);
      }

      // Proceed with the deletion in the transaction
      transaction.delete(itemRef);
      console.log(
        `[SUCCESS] Firestore document for item ID: ${itemId} deleted successfully`
      );

      console.log(
        `[END] Successfully deleted item with ID: ${itemId} and associated files`
      );
      return { itemId, deletedAt: new Date() };
    });
  } catch (error: any) {
    console.error(`[ERROR] Error deleting item with ID: ${itemId}:`, error);
    throw error;
  }
};

export const getPopularItems = async (limit: number = 10, month: number) => {
  try {
    const date = new Date();
    const startDay = new Date(date.getFullYear(), month, 1);
    const endDay = new Date(date.getFullYear(), month + 1, 0);

    startDay.setHours(0, 0, 0);
    endDay.setHours(23, 59, 59);

    console.log(`Fetching popular items from ${startDay} to ${endDay}`);

    const startTimestamp = admin.firestore.Timestamp.fromDate(startDay);
    const endTimestamp = admin.firestore.Timestamp.fromDate(endDay);

    const orders = await adminFirestore
      .collection("orders")
      .where("paymentStatus", "==", "Paid")
      .where("createdAt", ">=", startTimestamp)
      .where("createdAt", "<=", endTimestamp)
      .get();

    console.log(`Fetched ${orders.size} orders`);
    const itemsMap = new Map<string, number>();
    orders.forEach((doc) => {
      const order = doc.data() as Order;
      order.items.forEach((item) => {
        const count = itemsMap.get(item.itemId) || 0;
        itemsMap.set(item.itemId, count + item.quantity);
      });
    });
    console.log(`Fetched ${itemsMap.size} items sold`);
    const itemIds = Array.from(itemsMap.keys());
    const itemDocs = await Promise.all(
      itemIds.map((itemId) =>
        adminFirestore.collection("inventory").doc(itemId).get()
      )
    );
    const popularItem: PopularItem[] = itemDocs.map((doc) => {
      const item = doc.data() as Item;
      return {
        item: {
          ...item,
          createdAt: null,
          updatedAt: null
        },
        soldCount: itemsMap.get(item.itemId) || 0,
      };
    });
    console.log(`Fetched ${popularItem.length} popular items`);
    popularItem.sort((a, b) => b.soldCount - a.soldCount);
    return popularItem.slice(0, limit);
  } catch (e) {
    throw e;
  }
};
export const getSaleReport = async (fromDate: string, toDate: string) => {
  try {
    console.log(`Fetching sales data from ${fromDate} to ${toDate}`);

    const startTimestamp = admin.firestore.Timestamp.fromDate(
      new Date(fromDate)
    );
    const endTimestamp = admin.firestore.Timestamp.fromDate(new Date(toDate));

    const ordersQuery = admin
      .firestore()
      .collection("orders")
      .where("createdAt", ">=", startTimestamp)
      .where("createdAt", "<=", endTimestamp)
      .where("paymentStatus", "==", "Paid");

    const querySnapshot = await ordersQuery.get();
    if (querySnapshot.empty) {
      console.log("No orders found");
      return [];
    }
    console.log(`Fetched ${querySnapshot.size} orders`);

    const salesData: SalesReport["data"] = [];
    const itemRefs: FirebaseFirestore.DocumentReference[] = [];

    // Collect item references from orders
    for (const orderDoc of querySnapshot.docs) {
      const order = orderDoc.data() as Order;
      for (const orderItem of order.items) {
        const itemRef = admin
          .firestore()
          .collection("inventory")
          .doc(orderItem.itemId.toLowerCase());
        if (!itemRefs.some((ref) => ref.id === itemRef.id)) {
          itemRefs.push(itemRef); // Add only unique item references
        }
      }
    }

    // Fetch item documents in parallel
    const itemDocs = await Promise.all(itemRefs.map((ref) => ref.get()));
    const itemsMap = new Map<string, Item>(); // Map to store items by itemId

    // Store item data for faster lookup
    itemDocs.forEach((doc) => {
      if (doc.exists) {
        itemsMap.set(doc.id.toLowerCase(), doc.data() as Item);
      }
    });
    let totalDiscount = 0;
    let totalOrders = 0;
    // Process orders with cached item data
    for (const orderDoc of querySnapshot.docs) {
      const order = orderDoc.data() as Order;
      totalDiscount += order?.discount || 0;
      totalOrders += 1;
      for (const orderItem of order.items) {
        const item = itemsMap.get(orderItem.itemId.toLowerCase()) || null;

        const itemType = item?.type || "Unknown";
        const itemName = item?.name || "[deleted]";
        const manufacturer = item?.manufacturer || "[deleted]";
        const brand = item?.brand || "[deleted]";
        const buyingPrice = item?.buyingPrice || 0;

        // Find or create the type entry
        let typeEntry = salesData.find(
          (entry) => entry.type.toLowerCase() === itemType.toLowerCase()
        );
        if (!typeEntry) {
          typeEntry = { type: itemType, data: [] };
          salesData.push(typeEntry);
        }

        // Find or create the item entry
        let itemEntry = typeEntry.data.find(
          (entry) =>
            entry.itemId.toLowerCase() ===
            (item?.itemId || orderItem.itemId).toLowerCase()
        );
        if (!itemEntry) {
          itemEntry = {
            itemId: item?.itemId || orderItem.itemId,
            manufacturer,
            brand,
            itemName,
            data: [],
          };
          typeEntry.data.push(itemEntry);
        }

        // Find or create the variant entry
        let variantEntry = itemEntry.data.find(
          (entry) =>
            entry.variantId.toLowerCase() === orderItem.variantId.toLowerCase()
        );
        if (!variantEntry) {
          const variant = item?.variants?.find(
            (v) =>
              v.variantId.toLowerCase() === orderItem.variantId.toLowerCase()
          );
          variantEntry = {
            variantId: orderItem.variantId,
            variantName: variant?.variantName || "[deleted]",
            data: [],
          };
          itemEntry.data.push(variantEntry);
        }

        // Add size details with unique sold price
        const sizeEntry = variantEntry.data.find(
          (entry) =>
            entry.size === orderItem.size && entry.soldPrice === orderItem.price
        );
        if (sizeEntry) {
          sizeEntry.quantity += orderItem.quantity;
        } else {
          variantEntry.data.push({
            size: orderItem.size,
            quantity: orderItem.quantity,
            soldPrice: orderItem.price,
            boughtPrice: buyingPrice,
          });
        }
      }
    }
    console.log(`Fetched sales data for ${salesData.length} types`);
    return {
      data: salesData,
      totalDiscount: totalDiscount,
      totalOrders: totalOrders,
    };
  } catch (error: any) {
    console.error(error);
    throw error;
  }
};

export const getMonthlyOverview = async (from: string, to: string) => {
  try {
    console.log("Fetching monthly earnings");

    const startOfMonth = new Date(from);
    const endOfMonth = new Date(to);

    const startTimestamp = Timestamp.fromDate(startOfMonth);
    const endTimestamp = Timestamp.fromDate(endOfMonth);
    return getOverview(startTimestamp, endTimestamp);
  } catch (e) {
    console.error(e);
    throw e;
  }
};
export const getOverview = async (start: Timestamp, end: Timestamp) => {
  try {
    const todayOrdersQuery = adminFirestore
      .collection("orders")
      .where("createdAt", ">=", start)
      .where("createdAt", "<=", end)
      .where("paymentStatus", "not-in", ["Failed", "Refunded"]);

    const querySnapshot = await todayOrdersQuery.get();

    let totalEarnings = 0;
    let buyingCost = 0;
    let totalOrderCount = 0;
    let totalExpense = 0;

    // Collect all unique itemIds from the orders
    const itemIds: string[] = [];

    querySnapshot.docs.forEach((docSnap) => {
      const data = docSnap.data() as Order;
      if (Array.isArray(data.items)) {
        data.items.forEach((item) => {
          if (item.itemId && !itemIds.includes(item.itemId)) {
            itemIds.push(item.itemId); // Collect unique itemIds
          }
        });
      }
      totalOrderCount += 1;
    });

    // Fetch all inventory documents in parallel
    const inventoryDocs = await Promise.all(
      itemIds.map((itemId) =>
        adminFirestore.collection("products").doc(itemId).get()
      )
    );

    const inventoryDataMap = new Map<string, Item>(); // Map to store inventory data by itemId

    // Cache inventory data in the map for quick lookup
    inventoryDocs.forEach((doc) => {
      if (doc.exists) {
        inventoryDataMap.set(doc.id, doc.data() as Item);
      }
    });
    let totalDiscount = 0;
    // Calculate totalEarnings and buying cost using cached inventory data
    querySnapshot.docs.forEach((docSnap) => {
      const data = docSnap.data() as Order;
      if (Array.isArray(data.items)) {
        data.items.forEach((item) => {
          totalEarnings += (item.price || 0) * item.quantity;
          // Lookup inventory data in the cache
          const inventoryData = inventoryDataMap.get(item.itemId);
          if (inventoryData) {
            buyingCost +=
              (inventoryData.buyingPrice || 0) * (item.quantity || 1);
          }
        });
        totalDiscount += data.discount || 0;
      }
    });

    const expenses = await getExpensesReport(
      start.toDate().toLocaleString(),
      end.toDate().toLocaleString()
    );
    expenses.forEach((expense) => {
      expense.data.forEach((data) => {
        totalExpense += data.amount;
      });
    });

    const totalProfit =
      totalEarnings - (buyingCost + totalDiscount + totalExpense);
    totalEarnings = totalEarnings - totalDiscount;
    console.log(
      `Fetched ${totalOrderCount} orders with total earnings: ${totalEarnings}, buying cost: ${buyingCost}, profit: ${totalProfit}, discount: ${totalDiscount}, expense: ${totalExpense}`
    );

    return {
      totalOrders: totalOrderCount,
      totalEarnings: totalEarnings,
      totalBuyingCost: buyingCost,
      totalProfit: totalProfit,
      totalDiscount: totalDiscount,
      totalExpense: totalExpense,
    };
  } catch (e) {
    console.error(e);
    throw e;
  }
};
export const getDailyOverview = async () => {
  try {
    console.log("Fetching daily earnings");

    // Get the current month start and end timestamps
    const now = new Date();
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    startOfDay.setHours(0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    endOfDay.setHours(23, 59, 59);

    const startTimestamp = Timestamp.fromDate(startOfDay);
    const endTimestamp = Timestamp.fromDate(endOfDay);

    return getOverview(startTimestamp, endTimestamp);
  } catch (error: any) {
    console.error(error);
    throw new Error(error.message);
  }
};
export const deleteOrder = async (orderId: string) => {
  try {
    console.log(`Deleting order with ID: ${orderId}`);
    await adminFirestore.collection("orders").doc(orderId).delete();
    console.log(`Order with ID ${orderId} deleted successfully`);
  } catch (error: any) {
    console.error(error);
    throw error;
  }
};
export const getOrdersByDate = async (date: string) => {
  try {
    console.log(`Fetching orders on ${date}`);

    // Use precise start/end of day
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    const startTimestamp = Timestamp.fromDate(startDate);
    const endTimestamp = Timestamp.fromDate(endDate);

    const ordersQuery = adminFirestore
      .collection("orders")
      .where("createdAt", ">=", startTimestamp)
      .where("createdAt", "<=", endTimestamp)
      .orderBy("createdAt", "desc");

    const querySnapshot = await ordersQuery.get();
    if (querySnapshot.empty) {
      console.log("No orders found");
      return [];
    }

    const orders: Order[] = [];

    // 1. Replaced forEach with a for...of loop
    for (const doc of querySnapshot.docs) {
      // 5. Call doc.data() once
      const orderData = doc.data() as Order;

      // 2. Passed 'adminFirestore' as the first argument
      const integrityResult = await validateDocumentIntegrity("orders", doc.id);

      const order: Order = {
        ...orderData,
        orderId: doc.id,
        integrity: integrityResult,

        // 4. Used safe date conversion
        createdAt: toSafeLocaleString(orderData.createdAt),
        updatedAt: toSafeLocaleString(orderData.updatedAt),

        customer: orderData.customer
          ? {
              ...orderData.customer,
              updatedAt: toSafeLocaleString(orderData.customer.updatedAt),
            }
          : null,
        restockedAt: orderData.restockedAt
          ? toSafeLocaleString(orderData.restockedAt)
          : null,
      };

      orders.push(order);
    }

    console.log(`Fetched ${orders.length} orders on ${date}`);
    return orders;
  } catch (e) {
    console.error(e);
    throw e;
  }
};
export const getStockReport = async (): Promise<StocksReport[]> => {
  try {
    console.log("Fetching stock report");
    const inventoryCollection = adminFirestore
      .collection("inventory")
      .where("status", "==", "Active");
    const snapshot = await inventoryCollection.get();

    if (snapshot.empty) {
      console.log("No inventory data found");
      return [];
    }

    const stockReport: StocksReport[] = [];

    snapshot.forEach((doc) => {
      const itemData = doc.data() as Item;

      const itemReport = {
        itemId: itemData.itemId,
        manufacturer: itemData.manufacturer,
        brand: itemData.brand,
        itemName: itemData.name,
        data: itemData.variants.map((variant) => ({
          variantId: variant.variantId,
          variantName: variant.variantName,
          stock: variant.sizes.map((size) => ({
            size: size.size,
            stock: size.stock,
          })),
        })),
      };

      const typeIndex = stockReport.findIndex(
        (report) => report.type === itemData.type.toLowerCase()
      );

      if (typeIndex > -1) {
        stockReport[typeIndex].data.push(itemReport);
      } else {
        stockReport.push({
          type: itemData.type.toLowerCase() as
            | "shoes"
            | "sandals"
            | "accessories",
          data: [itemReport],
        });
      }
    });

    return stockReport;
  } catch (e) {
    console.error(e);
    throw e;
  }
};

export const getCashReport = async (
  from: string,
  to: string
): Promise<CashFlowReport> => {
  try {
    const startOfMonth = new Date(from);
    const endOfMonth = new Date(to);
    console.log(`Fetching cash report from ${startOfMonth} to ${endOfMonth}`);
    const startTimestamp = Timestamp.fromDate(startOfMonth);
    const endTimestamp = Timestamp.fromDate(endOfMonth);

    // Fetch orders
    const orders = adminFirestore
      .collection("orders")
      .where("createdAt", ">=", startTimestamp)
      .where("createdAt", "<=", endTimestamp)
      .where("paymentStatus", "==", "Paid");

    const paymentMethods = await adminFirestore
      .collection("paymentMethods")
      .get();
    const querySnapshot = await orders.get();

    if (querySnapshot.empty) {
      console.log("No orders found");
      return { report: [], totalExpense: 0, materialCost: 0 };
    }
    console.log(`Fetched ${querySnapshot.size} orders`);

    const paymentSummary: { [method: string]: { total: number; fee: number } } =
      {};
    let materialCost = 0;

    // Fetch inventory prices for all items in one query
    const inventorySnapshot = await adminFirestore
      .collection("inventory")
      .get();
    const inventoryMap = new Map<string, number>();

    inventorySnapshot.forEach((doc) => {
      const data = doc.data();
      inventoryMap.set(data.itemId, data.buyingPrice);
    });

    for (const doc of querySnapshot.docs) {
      const order = doc.data() as Order;
      const { paymentMethod, items } = order;

      const itemTotal =
        items.reduce((acc, item) => acc + item.price * item.quantity, 0) +
        (order?.fee || 0) +
        (order?.shippingFee || 0);
      const discountAmount = order?.discount || 0;
      const orderTotal = itemTotal - discountAmount;

      if (paymentMethod.toLowerCase() === "mixed" && order.paymentReceived) {
        for (const payment of order.paymentReceived) {
          let normalizedMethod = "unknown";
          let feePercentage = 0;

          for (const method of paymentMethods.docs) {
            if (
              method.data().name.toLowerCase() ===
              payment.paymentMethod.toLowerCase()
            ) {
              normalizedMethod = method.data().name.toLowerCase();
              feePercentage = Number.parseFloat(method.data().fee);
              break;
            }
          }

          if (!paymentSummary[normalizedMethod]) {
            paymentSummary[normalizedMethod] = { total: 0, fee: 0 };
          }

          const paymentAmount = payment.amount;
          const feeAmount = (feePercentage * paymentAmount) / 100;
          paymentSummary[normalizedMethod].total += paymentAmount - feeAmount;
          paymentSummary[normalizedMethod].fee = feePercentage;
        }
      } else {
        let normalizedMethod: CashFlowReport["method"] = "unknown";
        let feePercentage = 0;

        for (const method of paymentMethods.docs) {
          if (
            method.data().name.toLowerCase() === paymentMethod.toLowerCase()
          ) {
            normalizedMethod = method.data().name.toLowerCase();
            feePercentage = Number.parseFloat(method.data().fee);
            break;
          }
        }

        if (!paymentSummary[normalizedMethod]) {
          paymentSummary[normalizedMethod] = { total: 0, fee: 0 };
        }
        paymentSummary[normalizedMethod].total +=
          orderTotal - (feePercentage * orderTotal) / 100;
        paymentSummary[normalizedMethod].fee = feePercentage;
      }

      // Calculate material cost
      for (const item of items) {
        const buyingPrice = inventoryMap.get(item.itemId) || 0;
        materialCost += buyingPrice * item.quantity;
      }
    }

    // Convert payment summary to array format
    const report = Object.keys(paymentSummary).map((method) => ({
      method: method as CashFlowReport["method"],
      fee: paymentSummary[method].fee,
      total: paymentSummary[method].total,
    }));

    // Fetch total expenses
    let totalExpense = 0;
    const expensesReport = await getExpensesReport(from, to);
    expensesReport.forEach((expense) => {
      expense.data.forEach((data) => {
        totalExpense += data.amount;
      });
    });

    return {
      report,
      totalExpense,
      materialCost,
    };
  } catch (e) {
    console.error(e);
    throw new Error(e.message);
  }
};

export const addNewExpense = async (expense: Expense) => {
  try {
    console.log("Adding new expense:", expense.id);

    return await adminFirestore.runTransaction(async (transaction) => {
      const expenseRef = adminFirestore.collection("expenses").doc(expense.id);

      // Check if the expense ID already exists
      const expenseDoc = await transaction.get(expenseRef);
      if (expenseDoc.exists) {
        throw new Error(`Expense with ID ${expense.id} already exists`);
      }

      // Add new expense
      transaction.set(expenseRef, {
        ...expense,
        createdAt: admin.firestore.Timestamp.fromDate(
          new Date(expense.createdAt)
        ),
      });

      console.log(`Expense added successfully: ${expense.id}`);
      return { id: expense.id, createdAt: new Date() };
    });
  } catch (e) {
    console.error("Error adding new expense:", e);
    throw e;
  }
};

export const getAllExpenses = async (page: number, size: number) => {
  try {
    console.log("Fetching all expenses");
    const offset = (page - 1) * size;
    const expenses = await adminFirestore
      .collection("expenses")
      .limit(size)
      .offset(offset)
      .orderBy("createdAt", "desc")
      .get();
    const expenseList: Expense[] = [];
    if (expenses.empty) {
      console.log("No expenses found");
      return expenseList;
    }

    expenses.forEach((doc) => {
      const data = doc.data() as Expense;
      expenseList.push({
        ...data,
        createdAt: data.createdAt.toDate().toLocaleString(),
      });
    });
    console.log(`Fetched ${expenseList.length} expenses`);
    return expenseList;
  } catch (e) {
    console.error(e);
    throw e;
  }
};

export const getAllExpensesByDate = async (date: string) => {
  try {
    console.log(`Fetching expenses on ${date}`);
    const startDate = new Date(date);
    startDate.setHours(0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59);

    const startTimestamp = Timestamp.fromDate(startDate);
    const endTimestamp = Timestamp.fromDate(endDate);

    const expenses = await adminFirestore
      .collection("expenses")
      .where("createdAt", ">=", startTimestamp)
      .where("createdAt", "<=", endTimestamp)
      .orderBy("createdAt", "desc")
      .get();
    const expenseList: Expense[] = [];
    if (expenses.empty) {
      console.log("No expenses found");
      return expenseList;
    }

    expenses.forEach((doc) => {
      const data = doc.data() as Expense;
      expenseList.push({
        ...data,
        createdAt: data?.createdAt?.toDate()?.toLocaleString(),
      });
    });
    console.log(`Fetched ${expenseList.length} expenses`);
    return expenseList;
  } catch (e) {
    console.error(e);
    throw e;
  }
};

export const deleteExpenseById = async (id: string) => {
  try {
    console.log(`Attempting to delete expense with ID: ${id}`);

    return await adminFirestore.runTransaction(async (transaction) => {
      const expenseRef = adminFirestore.collection("expenses").doc(id);
      const expenseDoc = await transaction.get(expenseRef);

      if (!expenseDoc.exists) {
        console.warn(`Expense with ID ${id} not found`);
        return null;
      }

      console.log(`Deleting expense with ID: ${id}`);
      transaction.delete(expenseRef);

      console.log(`Expense deleted successfully: ${id}`);
      return { id, deletedAt: new Date() };
    });
  } catch (e) {
    console.error("Error deleting expense:", e);
    throw e;
  }
};

export const getExpensesReport = async (from: string, to: string) => {
  try {
    const fromTimestamp = admin.firestore.Timestamp.fromDate(new Date(from));
    const toTimestamp = admin.firestore.Timestamp.fromDate(new Date(to));

    console.log(`Fetching expenses from ${from} to ${to}`);

    const expensesQuery = adminFirestore
      .collection("expenses")
      .where("createdAt", ">=", fromTimestamp)
      .where("createdAt", "<=", toTimestamp)
      .orderBy("createdAt", "desc");

    const expensesSnapshot = await expensesQuery.get();

    if (expensesSnapshot.empty) {
      console.log("No expenses found");
      return [];
    }

    console.log(`Fetched ${expensesSnapshot.size} expenses`);
    const report: Record<string, Record<string, number>> = {};

    expensesSnapshot.forEach((doc) => {
      const expense = doc.data();

      console.log(`Processing expense document:`, expense);

      // Ensure the required fields exist
      const expenseType = expense.type || "unknown"; // Default to "unknown" if not provided
      const expenseFor = expense.for || "other"; // Default to "other" if not provided
      const expenseAmount = expense.amount || 0; // Default to 0 if not provided

      if (!report[expenseType]) {
        report[expenseType] = {};
      }

      report[expenseType][expenseFor] =
        (report[expenseType][expenseFor] || 0) + expenseAmount;
    });

    const formatReport = (
      data: Record<string, number>
    ): ExpensesReport["data"] => {
      return Object.entries(data).map(([forField, totalAmount]) => ({
        for: forField,
        amount: totalAmount,
      }));
    };

    const result = Object.entries(report).map(([type, data]) => ({
      type,
      data: formatReport(data),
    }));

    console.log("Report Generated");
    return result;
  } catch (e) {
    console.error("Error fetching expenses report:", e);
    throw e;
  }
};
export const getUsers = async (pageNumber: number = 1, size: number = 20) => {
  try {
    const offset = (pageNumber - 1) * size;

    // Fetch users with pagination
    const usersSnapshot = await adminFirestore
      .collection("users")
      .limit(size)
      .offset(offset)
      .get();

    const users: User[] = [];
    usersSnapshot.forEach((doc) => {
      users.push({
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate().toLocaleString(),
        updatedAt: doc.data().updatedAt.toDate().toLocaleString(),
      } as User);
    });
    const listUsersResult = await admin.auth().listUsers();
    const nonAnonymousUsers = listUsersResult.users.filter(
      (user) => user.providerData.length > 0
    );
    console.log(`Fetched ${nonAnonymousUsers.length} users`);

    // Remove users that exist same mail in the users collection
    const uniqueUsers = nonAnonymousUsers.filter(
      (user) => !users.some((u) => u.email === user.email)
    );
    console.log(`Fetched ${uniqueUsers.length} unique users`);

    // add to users array
    uniqueUsers.forEach((user) => {
      users.push({
        userId: user.uid,
        role: "Pending",
        status: "Pending",
        email: user.email,
        username: user.displayName,
        createdAt: user.metadata.creationTime?.toLocaleString(),
        updatedAt: user.metadata.lastSignInTime?.toLocaleString(),
      } as User);
    });
    console.log(`Fetched ${users.length} users on page ${pageNumber}`);
    return users;
  } catch (error: any) {
    console.error(error);
    throw error;
  }
};

export const deleteUser = async (userId: string) => {
  try {
    console.log(`Attempting to delete user with ID: ${userId}`);

    return await adminFirestore.runTransaction(async (transaction) => {
      const userRef = adminFirestore.collection("users").doc(userId);
      const userDoc = await transaction.get(userRef);

      if (!userDoc.exists) {
        console.warn(`User with ID ${userId} not found`);
        return null;
      }

      const userData = userDoc.data();
      if (userData?.role === "OWNER") {
        console.warn(`Cannot delete user with role ${userData.role}`);
        throw new Error(`Cannot delete user with role ${userData.role}`);
      }

      console.log(`Deleting Firebase Auth user: ${userId}`);
      await admin.auth().deleteUser(userId);

      console.log(`Deleting Firestore user document: ${userId}`);
      transaction.delete(userRef);

      console.log(`User deleted successfully: ${userId}`);
      return { id: userId, deletedAt: new Date() };
    });
  } catch (e) {
    console.error("Error deleting user:", e);
    throw e;
  }
};

export const addNewUser = async (user: User) => {
  try {
    console.log("Adding new user:", user.userId);
    const password = generateRandomPassword(8);

    // Start transaction
    const result = await adminFirestore.runTransaction(async (transaction) => {
      // Create Firebase Auth User
      const userRecord = await admin.auth().createUser({
        email: user.email,
        displayName: user.username,
        emailVerified: false,
        password: password,
        disabled: user.status === "Inactive",
      });

      console.log(`User created successfully: ${userRecord.uid}`);

      // Prepare Firestore User Document
      const userDoc = {
        ...user,
        password: hashPassword(password),
        userId: userRecord.uid,
        createdAt: admin.firestore.Timestamp.fromDate(new Date(user.createdAt)),
        updatedAt: admin.firestore.Timestamp.fromDate(new Date(user.updatedAt)),
      };

      // Add user to Firestore inside transaction
      transaction.set(
        adminFirestore.collection("users").doc(userRecord.uid),
        userDoc
      );
      return userRecord.uid;
    });

    console.log(`User added successfully: ${result}`);

    // Send Password Email outside of the transaction (since Firestore doesn't support email sending within transactions)
    console.log("Sending Password to email:", user.email);
    console.log("Template:", "passwordSend");

    await adminFirestore.collection("mail").add({
      to: user.email,
      template: {
        name: "passwordSend",
        data: {
          email: user.email,
          password: password,
          name: user.username,
        },
      },
    });

    return result;
  } catch (e) {
    console.error("Error creating user:", e);
    throw e;
  }
};
export const updateUser = async (user: User) => {
  const userRef = adminFirestore.collection("users").doc(user.userId);

  try {
    console.log(`Updating user with ID: ${user.userId}`);

    const result = await adminFirestore.runTransaction(async (transaction) => {
      // Fetch the existing user document
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists) {
        throw new Error(`User with ID ${user.userId} does not exist.`);
      }

      let updateData = {
        displayName: user.username,
        disabled: user.status === "Inactive",
      };
      if (user?.password) {
        const currentPasswordHash = hashPassword(user.currentPassword);
        if (currentPasswordHash !== userDoc.data()?.password) {
          throw new Error("Current password does not match");
        }

        updateData = {
          ...updateData,
          password: user?.password,
        };
        console.log("Updating password for user:", user.userId);
      }
      // Update Firebase Authentication User
      await admin.auth().updateUser(user.userId, updateData);

      let updatedUser = {
        userId: user.userId,
        email: user.email,
        username: user.username,
        role: user.role,
        status: user.status,
        createdAt: admin.firestore.Timestamp.fromDate(new Date(user.createdAt)),
        updatedAt: admin.firestore.Timestamp.fromDate(new Date(user.updatedAt)),
      };

      if (user?.password) {
        updatedUser = {
          ...updatedUser,
          password: hashPassword(user.password),
        };
        console.log(
          "Password updated in Firestore successfully for user:",
          user.userId
        );
      }
      // Update Firestore User Document
      transaction.set(userRef, updatedUser, { merge: true });

      return user.userId;
    });

    console.log(`User updated successfully: ${result}`);
    return result;
  } catch (e) {
    console.error("Error updating user:", e);
    throw e;
  }
};

export const getUserById = async (userId: string) => {
  try {
    const user = await adminFirestore.collection("users").doc(userId).get();
    if (!user.exists) {
      console.warn(`User with ID ${userId} not found`);
      return null;
    }
    return {
      ...user.data(),
      createdAt: user.data()?.createdAt.toDate().toLocaleString(),
      updatedAt: user.data()?.updatedAt.toDate().toLocaleString(),
    } as User;
  } catch (error: any) {
    console.error(error);
    throw error;
  }
};

export const loginUser = async (userId: string) => {
  try {
    console.log(`Logging in user with ID: ${userId}`);
    const user = await admin.auth().getUser(userId);
    const documentSnapshot = await adminFirestore
      .collection("users")
      .where("userId", "==", user.uid)
      .where("status", "==", "Active")
      .limit(1)
      .get();
    if (documentSnapshot.empty) {
      console.warn(`User with ID ${userId} not found`);
      throw new Error(`User with ID ${userId} not found`);
    }
    return {
      ...documentSnapshot.docs[0].data(),
      createdAt: documentSnapshot.docs[0]
        .data()
        .createdAt.toDate()
        .toLocaleString(),
      updatedAt: documentSnapshot.docs[0]
        .data()
        .updatedAt.toDate()
        .toLocaleString(),
    } as User;
  } catch (e) {
    console.error(e);
    throw e;
  }
};

export const authorizeRequest = async (req: any) => {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

    if (token != "undefined") {
      const decodedIdToken = await adminAuth.verifyIdToken(token);
      const user = await getUserById(decodedIdToken.uid);
      if (!user) {
        console.warn("User not found!");
        console.warn("Authorization Failed!");
        return false;
      } else {
        if (user.status === "Inactive") {
          console.log("User is inactive!");
          console.warn("Authorization Failed!");
          return false;
        } else if (user.status === "Active") {
          console.log("User is active!");
          if (user.role === "ADMIN" || user.role === "OWNER") {
            console.log("User is Admin!");
            return true;
          } else {
            console.log("User is not Admin!");
            console.warn("Authorization Failed!");
            return false;
          }
        } else {
          console.log("User is pending!");
          console.warn("Authorization Failed!");
          return false;
        }
      }
    } else {
      console.warn("Authorization Failed!");
      return false;
    }
  } catch (e) {
    console.error(e);
    throw e;
  }
};

export const getAllPaymentMethods = async () => {
  try {
    const paymentMethods = await adminFirestore
      .collection("paymentMethods")
      .get();
    const methods: PaymentMethod[] = [];
    paymentMethods.forEach((doc) => {
      methods.push({
        ...doc.data(),
        createdAt: doc.data()?.createdAt?.toDate()?.toLocaleString(),
        updatedAt: doc.data()?.updatedAt?.toDate()?.toLocaleString(),
      } as PaymentMethod);
    });
    return methods;
  } catch (e) {
    throw e;
  }
};

export const fetchAllEmails = async (page: number, size: number) => {
  try {
    const offset = (page - 1) * size;
    console.log("Fetching all emails");
    const emailDoc = await adminFirestore
      .collection("mail")
      .limit(size)
      .offset(offset)
      .orderBy("delivery.endTime", "desc")
      .get();
    const emails: Email[] = emailDoc.docs.map((doc) => ({
      emailId: doc.id,
      ...doc.data(),
      time: doc.data()?.delivery?.endTime?.toDate()?.toLocaleString(),
      status: doc.data()?.delivery?.state,
    }));
    return emails;
  } catch (e) {
    throw e;
  }
};
export const sendEmail = async (email: Email) => {
  try {
    console.log("Sending email:", email.to);
    await adminFirestore.collection("mail").add({
      to: email.to,
      message: {
        subject: email.message?.subject,
        html: email.message?.html,
      },
    });
    console.log(`Email sent successfully`);
  } catch (e) {
    console.error(e);
    throw e;
  }
};

export const deleteEmail = async (emailId: string) => {
  try {
    console.log(`Deleting email with ID: ${emailId}`);
    const result = await adminFirestore
      .collection("mail")
      .doc(emailId)
      .delete();
    return result.writeTime;
  } catch (e) {
    throw e;
  }
};
export const addNewPaymentMethod = async (PaymentMethod: PaymentMethod) => {
  try {
    console.log("Creating new payment method:", PaymentMethod.paymentId);
    const writeResultPromise = await adminFirestore
      .collection("paymentMethods")
      .doc(PaymentMethod.paymentId)
      .set({
        ...PaymentMethod,
        createdAt: admin.firestore.Timestamp.fromDate(
          new Date(PaymentMethod.createdAt)
        ),
        updatedAt: admin.firestore.Timestamp.fromDate(
          new Date(PaymentMethod.updatedAt)
        ),
      });
    console.log(
      `Payment method created successfully: ${PaymentMethod.paymentId}`
    );
    return writeResultPromise;
  } catch (e) {
    throw e;
  }
};
export const sendTextMessage = async (sms: SMS) => {
  try {
    console.log("Sending SMS:", sms.to);
    const apiKey = process.env.TEXTITBIZ_API_KEY;
    console.log("API Key:", apiKey);
    const response = await axios({
      method: "POST",
      url: `https://api.textit.biz/`,
      headers: {
        Authorization: `Basic ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "*/*",
      },
      data: JSON.stringify(sms),
    });
    await adminFirestore
      .collection("sms")
      .doc(sms.id)
      .set({
        ...sms,
        sentAt: admin.firestore.Timestamp.fromDate(new Date(sms.sentAt)),
      });
    return response.data;
  } catch (e) {
    throw e;
  }
};
export const getSMS = async (page: number, size: number) => {
  try {
    const offset = (page - 1) * size;
    console.log("Fetching all SMS");
    const smsQuery = await adminFirestore
      .collection("sms")
      .limit(size)
      .offset(offset)
      .orderBy("sentAt", "desc")
      .get();
    const smsList: SMS[] = [];
    console.log(`Fetched ${smsQuery.size} SMS`);
    smsQuery.forEach((doc) => {
      smsList.push({
        ...doc.data(),
        sentAt: doc.data()?.sentAt?.toDate()?.toLocaleString(),
      } as SMS);
    });
    return smsList;
  } catch (e) {
    throw e;
  }
};
export const addABanner = async ({
  file,
  url,
}: {
  file: string;
  url: string;
}) => {
  try {
    console.log("Adding new banner:", file);

    let newId: string;
    let attempts = 0;
    const maxAttempts = 5; // Prevent infinite loops

    while (attempts < maxAttempts) {
      newId = `s${Math.random().toString(36).substring(2, 6)}`;
      const bannerRef = adminFirestore.collection("sliders").doc(newId);

      try {
        await adminFirestore.runTransaction(async (transaction) => {
          const doc = await transaction.get(bannerRef);
          if (doc.exists) {
            throw new Error("ID conflict, retrying...");
          }

          transaction.set(bannerRef, {
            id: newId,
            fileName: file,
            url: url,
            createdAt: admin.firestore.Timestamp.fromDate(new Date()),
          });
        });

        console.log("Banner added with ID:", newId);
        return newId; // Return the successful ID
      } catch (error) {
        console.warn(`Attempt ${attempts + 1}: ${error.message}`);
        attempts++;
      }
    }

    throw new Error("Failed to generate a unique ID after multiple attempts.");
  } catch (e) {
    console.error("Error adding banner:", e);
    throw e;
  }
};

export const deleteBanner = async (id: string) => {
  try {
    console.log(`Attempting to delete banner with ID: ${id}`);

    return await adminFirestore.runTransaction(async (transaction) => {
      const bannerRef = adminFirestore.collection("sliders").doc(id);
      const doc = await transaction.get(bannerRef);

      if (!doc.exists) {
        console.warn(`Banner with ID ${id} not found`);
        return null;
      }

      const fileName: string = doc.data()?.fileName;
      console.log(`Deleting banner file: ${fileName}`);

      // Delete associated file
      await deleteFiles("sliders/" + fileName);

      // Delete Firestore document inside the transaction
      transaction.delete(bannerRef);

      console.log(`Banner ${fileName} deleted successfully`);
      return { id, deletedAt: new Date() };
    });
  } catch (e) {
    console.error("Error deleting banner:", e);
    throw e;
  }
};

export const getAllBanners = async () => {
  try {
    console.log("Fetching all banners");
    const banners = await adminFirestore.collection("sliders").get();
    const bannerList: object[] = [];
    banners.forEach((doc) => {
      bannerList.push({
        ...doc.data(),
        createdAt: doc.data()?.createdAt?.toDate()?.toLocaleString(),
      });
    });
    return bannerList;
  } catch (e) {
    throw e;
  }
};
export const updatePaymentMethod = async (paymentMethod: PaymentMethod) => {
  try {
    console.log("Updating payment method:", paymentMethod.paymentId);

    return await adminFirestore.runTransaction(async (transaction) => {
      const paymentRef = adminFirestore
        .collection("paymentMethods")
        .doc(paymentMethod.paymentId);
      const doc = await transaction.get(paymentRef);

      if (!doc.exists) {
        throw new Error(
          `Payment method with ID ${paymentMethod.paymentId} not found`
        );
      }

      transaction.set(
        paymentRef,
        {
          ...paymentMethod,
          createdAt: admin.firestore.Timestamp.fromDate(
            new Date(paymentMethod.createdAt)
          ),
          updatedAt: admin.firestore.Timestamp.fromDate(
            new Date(paymentMethod.updatedAt)
          ),
        },
        { merge: true }
      );

      console.log(
        `Payment method updated successfully: ${paymentMethod.paymentId}`
      );
      return { id: paymentMethod.paymentId, updatedAt: new Date() };
    });
  } catch (e) {
    console.error("Error updating payment method:", e);
    throw e;
  }
};
