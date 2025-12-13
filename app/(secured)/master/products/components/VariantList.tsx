"use client";
import React from "react";
import { IconPlus, IconEdit, IconTrash } from "@tabler/icons-react";
import { ProductVariant } from "@/model/ProductVariant";

interface VariantListProps {
  variants: ProductVariant[];
  onAddVariant: () => void;
  onEditVariant: (index: number) => void;
  onDeleteVariant: (index: number) => void;
}

const VariantList: React.FC<VariantListProps> = ({
  variants,
  onAddVariant,
  onEditVariant,
  onDeleteVariant,
}) => {
  return (
    <div className="mt-4">
      <div className="flex justify-between items-center mb-2">
        <h6 className="text-sm font-bold text-gray-700 uppercase">Variants</h6>
        <button
          onClick={onAddVariant}
          className="flex items-center px-3 py-1.5 bg-gray-900 text-white text-xs font-bold uppercase rounded-sm hover:bg-gray-800 transition-colors"
        >
          <IconPlus size={16} className="mr-1" />
          Add Variant
        </button>
      </div>
      <div className="w-full overflow-x-auto bg-white border border-gray-200 rounded-sm">
        <table className="w-full text-left text-sm border-collapse">
          <thead className="bg-gray-50 text-gray-700 border-b border-gray-200 uppercase text-xs font-bold">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Sizes</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {variants.map((variant, index) => (
              <tr key={variant.variantId} className="hover:bg-gray-50">
                <td className="p-3 font-medium text-gray-900">
                  {variant.variantName}
                </td>
                <td className="p-3 text-gray-600">
                  {variant.sizes.join(", ")}
                </td>
                <td className="p-3">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-bold uppercase ${
                      variant.status
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {variant.status ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="p-3 text-right space-x-1">
                  <button
                    onClick={() => onEditVariant(index)}
                    className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-sm transition-colors"
                    title="Edit"
                  >
                    <IconEdit size={16} />
                  </button>
                  <button
                    onClick={() => onDeleteVariant(index)}
                    className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-sm transition-colors"
                    title="Delete"
                  >
                    <IconTrash size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {variants.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="p-6 text-center text-gray-500 text-sm"
                >
                  No variants added. Click 'Add Variant' to begin.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default VariantList;
