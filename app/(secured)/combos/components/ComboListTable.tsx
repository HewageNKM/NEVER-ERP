import React from "react";
import { ComboProduct } from "@/model/ComboProduct";
import { IconEdit, IconTrash } from "@tabler/icons-react";
import moment from "moment";
import Image from "next/image";

interface Props {
  items: ComboProduct[];
  loading: boolean;
  onEdit: (combo: ComboProduct) => void;
  onDelete?: (combo: ComboProduct) => void;
}

const ComboListTable: React.FC<Props> = ({
  items,
  loading,
  onEdit,
  onDelete,
}) => {
  if (loading) {
    return (
      <div className="w-full flex justify-center py-10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500 text-sm">
        No combo products found.
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
          <tr>
            <th className="px-4 py-3 border-b border-gray-100 w-16">Image</th>
            <th className="px-4 py-3 border-b border-gray-100">Name</th>
            <th className="px-4 py-3 border-b border-gray-100">Type</th>
            <th className="px-4 py-3 border-b border-gray-100">Items</th>
            <th className="px-4 py-3 border-b border-gray-100">Price</th>
            <th className="px-4 py-3 border-b border-gray-100">Status</th>
            <th className="px-4 py-3 border-b border-gray-100 text-right">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="text-sm text-gray-700">
          {items.map((combo) => (
            <tr
              key={combo.id}
              className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
            >
              <td className="px-4 py-3">
                <div className="w-10 h-10 bg-gray-100 rounded-sm overflow-hidden relative border border-gray-200">
                  {combo.thumbnail?.url ? (
                    <Image
                      src={combo.thumbnail.url}
                      alt={combo.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                      N/A
                    </div>
                  )}
                </div>
              </td>
              <td className="px-4 py-3 font-medium text-gray-900">
                {combo.name}
                <div className="text-xs text-gray-400 font-normal truncate max-w-[200px]">
                  {combo.description}
                </div>
              </td>
              <td className="px-4 py-3">
                <span className="px-2 py-1 bg-gray-100 rounded text-xs font-semibold">
                  {combo.type}
                </span>
              </td>
              <td className="px-4 py-3">{combo.items?.length || 0}</td>
              <td className="px-4 py-3">
                <div className="flex flex-col">
                  <span className="font-bold">Rs. {combo.comboPrice}</span>
                  {combo.originalPrice > combo.comboPrice && (
                    <span className="text-xs text-gray-400 line-through">
                      Rs. {combo.originalPrice}
                    </span>
                  )}
                </div>
              </td>
              <td className="px-4 py-3">
                <span
                  className={`px-2 py-1 rounded text-xs font-bold ${
                    combo.status === "ACTIVE"
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {combo.status}
                </span>
              </td>
              <td className="px-4 py-3 flex justify-end gap-2">
                <button
                  onClick={() => onEdit(combo)}
                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                  title="Edit"
                >
                  <IconEdit size={18} />
                </button>
                {onDelete && (
                  <button
                    onClick={() => onDelete(combo)}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                    title="Delete"
                  >
                    <IconTrash size={18} />
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ComboListTable;
