"use client";
import React from "react";
import { IconEdit, IconLoader } from "@tabler/icons-react";
import { DropdownOption } from "@/app/(secured)/master/products/page";
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
  if (loading) {
    return (
      <div className="text-center py-12">
        <IconLoader className="animate-spin mx-auto text-gray-400" size={32} />
        <p className="mt-2 text-gray-500 text-sm font-bold uppercase">
          Loading Inventory...
        </p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-sm font-bold uppercase">No stock items found.</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto bg-white border border-gray-200 rounded-sm">
      <table className="w-full text-left text-sm border-collapse">
        <thead className="bg-gray-100 text-gray-900 border-b border-gray-200 uppercase text-xs tracking-wider font-bold">
          <tr>
            <th className="p-4">Product ID</th>
            <th className="p-4">Product</th>
            <th className="p-4">Variant ID</th>
            <th className="p-4">Variant</th>
            <th className="p-4">Size</th>
            <th className="p-4">Location</th>
            <th className="p-4 text-right">Quantity</th>
            <th className="p-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {items.map((item) => (
            <tr
              key={item.id}
              className="hover:bg-gray-50 transition-colors duration-200"
            >
              <td className="p-4 font-mono text-gray-500 uppercase">
                {item.productId?.toUpperCase() || "N/A"}
              </td>
              <td className="p-4 font-bold text-gray-900 uppercase">
                {item.productName?.toUpperCase() || "N/A"}
              </td>
              <td className="p-4 font-mono text-gray-500 uppercase">
                {item.variantId?.toUpperCase() || "N/A"}
              </td>
              <td className="p-4 text-gray-700 uppercase">
                {item.variantName?.toUpperCase() || "N/A"}
              </td>
              <td className="p-4 text-gray-700 font-bold">{item.size}</td>
              <td className="p-4 text-gray-700 uppercase">
                {item.stockName?.toUpperCase() || "N/A"}
              </td>
              <td className="p-4 text-right">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-sm text-xs font-bold uppercase ${
                    item.quantity > 0
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {item.quantity}
                </span>
              </td>
              <td className="p-4 text-right">
                <button
                  onClick={() => onEdit(item)}
                  className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                  title="Edit"
                >
                  <IconEdit size={18} />
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
