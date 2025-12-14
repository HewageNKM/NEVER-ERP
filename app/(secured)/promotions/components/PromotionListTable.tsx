import React from "react";
import { Promotion } from "@/model/Promotion";
import { IconEdit, IconTrash } from "@tabler/icons-react";
import { Timestamp } from "firebase/firestore"; // Assuming client-side might receive this or standard date string
import moment from "moment";

interface Props {
  items: Promotion[];
  loading: boolean;
  onEdit: (promotion: Promotion) => void;
  onDelete?: (promotion: Promotion) => void;
}

const PromotionListTable: React.FC<Props> = ({
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
        No promotions found.
      </div>
    );
  }

  // Helper to format date
  const formatDate = (date: any) => {
    if (!date) return "-";
    // Check if it's a Firestore Timestamp (has seconds/nanoseconds)
    if (date.seconds) {
      return moment(date.toDate()).format("MMM DD, YYYY");
    }
    return moment(date).format("MMM DD, YYYY");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-700";
      case "INACTIVE":
        return "bg-gray-100 text-gray-700";
      case "SCHEDULED":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
          <tr>
            <th className="px-4 py-3 border-b border-gray-100">Name</th>
            <th className="px-4 py-3 border-b border-gray-100">Type</th>
            <th className="px-4 py-3 border-b border-gray-100">Status</th>
            <th className="px-4 py-3 border-b border-gray-100">Start Date</th>
            <th className="px-4 py-3 border-b border-gray-100">End Date</th>
            <th className="px-4 py-3 border-b border-gray-100">Priority</th>
            <th className="px-4 py-3 border-b border-gray-100 text-right">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="text-sm text-gray-700">
          {items.map((promo) => (
            <tr
              key={promo.id}
              className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
            >
              <td className="px-4 py-3 font-medium text-gray-900">
                {promo.name}
                <div className="text-xs text-gray-400 font-normal truncate max-w-[200px]">
                  {promo.description}
                </div>
              </td>
              <td className="px-4 py-3">
                <span className="px-2 py-1 bg-gray-100 rounded text-xs font-semibold">
                  {promo.type}
                </span>
              </td>
              <td className="px-4 py-3">
                <span
                  className={`px-2 py-1 rounded text-xs font-bold ${getStatusColor(
                    promo.status
                  )}`}
                >
                  {promo.status}
                </span>
              </td>
              <td className="px-4 py-3">{formatDate(promo.startDate)}</td>
              <td className="px-4 py-3">{formatDate(promo.endDate)}</td>
              <td className="px-4 py-3">{promo.priority}</td>
              <td className="px-4 py-3 flex justify-end gap-2">
                <button
                  onClick={() => onEdit(promo)}
                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                  title="Edit"
                >
                  <IconEdit size={18} />
                </button>
                {onDelete && (
                  <button
                    onClick={() => onDelete(promo)}
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

export default PromotionListTable;
