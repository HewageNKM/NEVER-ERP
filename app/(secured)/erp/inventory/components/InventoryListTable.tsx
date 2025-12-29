"use client";
import React from "react";
import { IconEdit, IconLoader, IconBoxSeam } from "@tabler/icons-react";
import { DropdownOption } from "@/app/(secured)/erp/master/products/page";
import { InventoryItem } from "@/model/InventoryItem";

interface StockLocationOption extends DropdownOption {}

interface StockListTableProps {
  items: InventoryItem[];
  loading: boolean;
  onEdit: (item: InventoryItem) => void;
  onDelete?: (id: string) => void;
  products: DropdownOption[];
  sizes: DropdownOption[];
  stockLocations: StockLocationOption[];
}

const InventoryListTable: React.FC<StockListTableProps> = ({
  items,
  loading,
  onEdit,
}) => {
  // Loading State
  if (loading) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-20 gap-3 border border-gray-200 bg-white">
        <IconLoader className="animate-spin text-black" size={24} />
        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
          Loading Inventory Data
        </span>
      </div>
    );
  }

  // Empty State
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-gray-200 bg-gray-50/50">
        <IconBoxSeam className="text-gray-300 mb-2" size={48} />
        <p className="text-lg font-black uppercase tracking-tighter text-gray-300">
          No Stock Items Found
        </p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto border border-gray-200 bg-white">
      <table className="w-full text-left border-collapse">
        <thead className="bg-white text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em] border-b-2 border-black">
          <tr>
            <th className="px-6 py-4">Product Info</th>
            <th className="px-6 py-4">Variant</th>
            <th className="px-6 py-4 text-center">Size</th>
            <th className="px-6 py-4">Location</th>
            <th className="px-6 py-4 text-center">Qty</th>
            <th className="px-6 py-4 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="text-sm">
          {items.map((item) => (
            <tr
              key={item.id}
              className="border-b border-gray-100 group hover:bg-gray-50 transition-colors"
            >
              {/* Product Info */}
              <td className="px-6 py-5 align-top">
                <div className="flex flex-col gap-1">
                  <span className="font-black text-black uppercase tracking-tight text-base leading-none">
                    {item.productName?.toUpperCase() || "N/A"}
                  </span>
                  <span className="text-[9px] font-mono text-gray-400 uppercase tracking-widest">
                    ID: {item.productId?.slice(0, 8) || "N/A"}
                  </span>
                </div>
              </td>

              {/* Variant */}
              <td className="px-6 py-5 align-top">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                    {item.variantName?.toUpperCase() || "N/A"}
                  </span>
                  <span className="text-[9px] font-mono text-gray-400 uppercase tracking-widest">
                    SKU: {item.variantId?.slice(0, 8) || "N/A"}
                  </span>
                </div>
              </td>

              {/* Size */}
              <td className="px-6 py-5 align-top text-center">
                <span className="inline-block border border-gray-300 px-2 py-1 text-[10px] font-bold text-black uppercase min-w-[30px]">
                  {item.size}
                </span>
              </td>

              {/* Location */}
              <td className="px-6 py-5 align-top">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-black rounded-none"></div>
                  <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                    {item.stockName?.toUpperCase() || "N/A"}
                  </span>
                </div>
              </td>

              {/* Quantity */}
              <td className="px-6 py-5 align-top text-center">
                <span
                  className={`font-mono text-lg font-black tracking-tighter ${
                    item.quantity > 0 ? "text-black" : "text-gray-300"
                  }`}
                >
                  {item.quantity.toLocaleString()}
                </span>
              </td>

              {/* Actions */}
              <td className="px-6 py-5 align-top text-right">
                <button
                  onClick={() => onEdit(item)}
                  className="w-8 h-8 inline-flex items-center justify-center border border-gray-200 hover:bg-black hover:border-black hover:text-white transition-colors"
                  title="Edit Stock"
                >
                  <IconEdit size={16} stroke={2} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default InventoryListTable;
