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
      <div className="flex justify-between items-center mb-6">
        <h6 className="text-lg font-black text-black uppercase tracking-tighter">
          Product Variants
        </h6>
        <button
          onClick={onAddVariant}
          className="flex items-center px-4 py-2 bg-black text-white text-[10px] font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors"
        >
          <IconPlus size={14} className="mr-1" />
          Add Variant
        </button>
      </div>

      {variants.length === 0 ? (
        <div className="p-8 border-2 border-dashed border-gray-200 text-center bg-gray-50">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            No variants defined. Add one to get started.
          </span>
        </div>
      ) : (
        <div className="w-full overflow-x-auto border border-gray-200">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 text-gray-500 border-b border-gray-200 uppercase text-[9px] font-bold tracking-widest">
              <tr>
                <th className="p-4">Variant Name</th>
                <th className="p-4">Sizes</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {variants.map((variant, index) => (
                <tr key={variant.variantId} className="hover:bg-gray-50">
                  <td className="p-4 font-bold text-black uppercase">
                    {variant.variantName}
                  </td>
                  <td className="p-4 text-gray-600 font-mono text-xs">
                    {variant.sizes.join(", ") || "-"}
                  </td>
                  <td className="p-4 text-center">
                    <span
                      className={`inline-block w-2 h-2 rounded-full ${
                        variant.status ? "bg-green-500" : "bg-red-500"
                      }`}
                      title={variant.status ? "Active" : "Inactive"}
                    />
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => onEditVariant(index)}
                        className="p-1 border border-gray-200 hover:border-black hover:bg-black hover:text-white transition-colors"
                        title="Edit"
                      >
                        <IconEdit size={14} />
                      </button>
                      <button
                        onClick={() => onDeleteVariant(index)}
                        className="p-1 border border-gray-200 hover:border-red-600 hover:text-red-600 transition-colors"
                        title="Delete"
                      >
                        <IconTrash size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default VariantList;
