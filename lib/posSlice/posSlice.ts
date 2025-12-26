// ================================
// 🔹 POS REDUX SLICE
// ================================

import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { POSCartItem, POSProduct, POSStock, POSOrder } from "@/model/POSTypes";

// ================================
// State Interface
// ================================
interface POSState {
  // Cart/Invoice
  items: POSCartItem[];
  invoiceId: string | null;
  showPaymentDialog: boolean;
  isInvoiceLoading: boolean;

  // Products
  products: POSProduct[];
  isProductsLoading: boolean;

  // Stock
  selectedStockId: string | null;
  stocks: POSStock[];
  isStocksLoading: boolean;
  showStockDialog: boolean;

  // Invoice Preview
  previewInvoice: boolean;
  previewOrder: POSOrder | null;
}

// ================================
// Initial State
// ================================
const initialState: POSState = {
  // Cart/Invoice
  items: [],
  invoiceId: null,
  showPaymentDialog: false,
  isInvoiceLoading: false,

  // Products
  products: [],
  isProductsLoading: false,

  // Stock
  selectedStockId: null,
  stocks: [],
  isStocksLoading: false,
  showStockDialog: false,

  // Invoice Preview
  previewInvoice: false,
  previewOrder: null,
};

// ================================
// Helper: Generate Invoice ID
// ================================
const generateInvoiceId = () => {
  const now = new Date();
  const datePart = now.toISOString().slice(2, 10).replace(/-/g, "");
  const randPart = Math.floor(100000 + Math.random() * 900000);
  return `${datePart}${randPart}`;
};

// ================================
// Async Thunks
// ================================
export const fetchPosCart = createAsyncThunk(
  "pos/fetchCart",
  async (_, thunkAPI) => {
    try {
      const response = await fetch("/api/pos/cart");
      if (!response.ok) throw new Error("Failed to fetch cart");
      return await response.json();
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

export const fetchPosStocks = createAsyncThunk(
  "pos/fetchStocks",
  async (_, thunkAPI) => {
    try {
      const response = await fetch("/api/pos/stocks");
      if (!response.ok) throw new Error("Failed to fetch stocks");
      return await response.json();
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

export const fetchPosProducts = createAsyncThunk(
  "pos/fetchProducts",
  async (stockId: string, thunkAPI) => {
    try {
      const response = await fetch(`/api/pos/products?stockId=${stockId}`);
      if (!response.ok) throw new Error("Failed to fetch products");
      return await response.json();
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

export const searchPosProducts = createAsyncThunk(
  "pos/searchProducts",
  async ({ stockId, query }: { stockId: string; query: string }, thunkAPI) => {
    try {
      const response = await fetch(
        `/api/pos/products?stockId=${stockId}&query=${encodeURIComponent(
          query
        )}`
      );
      if (!response.ok) throw new Error("Failed to search products");
      return await response.json();
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

export const addItemToCart = createAsyncThunk(
  "pos/addItemToCart",
  async (item: POSCartItem, thunkAPI) => {
    try {
      const response = await fetch("/api/pos/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) throw new Error("Failed to add item to cart");
      // Refetch cart after adding
      thunkAPI.dispatch(fetchPosCart());
      return await response.json();
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

export const removeItemFromCart = createAsyncThunk(
  "pos/removeItemFromCart",
  async (item: POSCartItem, thunkAPI) => {
    try {
      const response = await fetch("/api/pos/cart", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) throw new Error("Failed to remove item from cart");
      // Refetch cart after removing
      thunkAPI.dispatch(fetchPosCart());
      return await response.json();
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

// ================================
// Slice
// ================================
const posSlice = createSlice({
  name: "pos",
  initialState,
  reducers: {
    // Cart Items
    setItems: (state, action: PayloadAction<POSCartItem[]>) => {
      state.items = action.payload;
    },
    clearItems: (state) => {
      state.items = [];
    },

    // Invoice Loading
    setIsInvoiceLoading: (state, action: PayloadAction<boolean>) => {
      state.isInvoiceLoading = action.payload;
    },

    // Payment Dialog
    setShowPaymentDialog: (state, action: PayloadAction<boolean>) => {
      state.showPaymentDialog = action.payload;
    },

    // Preview Invoice
    setPreviewInvoice: (state, action: PayloadAction<boolean>) => {
      state.previewInvoice = action.payload;
    },
    setPreviewOrder: (state, action: PayloadAction<POSOrder | null>) => {
      state.previewOrder = action.payload;
    },

    // Invoice ID
    initializeInvoiceId: (state) => {
      if (typeof window !== "undefined") {
        let invoiceId = window.localStorage.getItem("posInvoiceId");
        if (!invoiceId) {
          invoiceId = generateInvoiceId();
          window.localStorage.setItem("posInvoiceId", invoiceId);
        }
        state.invoiceId = invoiceId;
      }
    },
    regenerateInvoiceId: (state) => {
      const invoiceId = generateInvoiceId();
      if (typeof window !== "undefined") {
        window.localStorage.setItem("posInvoiceId", invoiceId);
      }
      state.invoiceId = invoiceId;
    },

    // Stock Selection
    setSelectedStockId: (state, action: PayloadAction<string | null>) => {
      state.selectedStockId = action.payload;
      if (typeof window !== "undefined" && action.payload) {
        window.localStorage.setItem("neverbePOSStockId", action.payload);
      }
    },
    setShowStockDialog: (state, action: PayloadAction<boolean>) => {
      state.showStockDialog = action.payload;
    },
    loadStockFromStorage: (state) => {
      if (typeof window !== "undefined") {
        const stockId = window.localStorage.getItem("neverbePOSStockId");
        state.selectedStockId = stockId;
        state.showStockDialog = !stockId;
      }
    },

    // Products
    setProducts: (state, action: PayloadAction<POSProduct[]>) => {
      state.products = action.payload;
    },
    setIsProductsLoading: (state, action: PayloadAction<boolean>) => {
      state.isProductsLoading = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Fetch Cart
    builder
      .addCase(fetchPosCart.pending, (state) => {
        state.isInvoiceLoading = true;
      })
      .addCase(fetchPosCart.fulfilled, (state, action) => {
        state.items = action.payload;
        state.isInvoiceLoading = false;
      })
      .addCase(fetchPosCart.rejected, (state) => {
        state.isInvoiceLoading = false;
      });

    // Fetch Stocks
    builder
      .addCase(fetchPosStocks.pending, (state) => {
        state.isStocksLoading = true;
      })
      .addCase(fetchPosStocks.fulfilled, (state, action) => {
        state.stocks = action.payload;
        state.isStocksLoading = false;
      })
      .addCase(fetchPosStocks.rejected, (state) => {
        state.isStocksLoading = false;
      });

    // Fetch Products
    builder
      .addCase(fetchPosProducts.pending, (state) => {
        state.isProductsLoading = true;
      })
      .addCase(fetchPosProducts.fulfilled, (state, action) => {
        state.products = action.payload;
        state.isProductsLoading = false;
      })
      .addCase(fetchPosProducts.rejected, (state) => {
        state.isProductsLoading = false;
      });

    // Search Products
    builder
      .addCase(searchPosProducts.pending, (state) => {
        state.isProductsLoading = true;
      })
      .addCase(searchPosProducts.fulfilled, (state, action) => {
        state.products = action.payload;
        state.isProductsLoading = false;
      })
      .addCase(searchPosProducts.rejected, (state) => {
        state.isProductsLoading = false;
      });
  },
});

// ================================
// Exports
// ================================
export const {
  setItems,
  clearItems,
  setIsInvoiceLoading,
  setShowPaymentDialog,
  setPreviewInvoice,
  setPreviewOrder,
  initializeInvoiceId,
  regenerateInvoiceId,
  setSelectedStockId,
  setShowStockDialog,
  loadStockFromStorage,
  setProducts,
  setIsProductsLoading,
} = posSlice.actions;

export default posSlice.reducer;
