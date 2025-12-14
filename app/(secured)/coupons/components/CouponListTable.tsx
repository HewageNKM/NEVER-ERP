import React from "react";
import { Coupon } from "@/model/Coupon";
import { IconEdit, IconTrash } from "@tabler/icons-react";
import moment from "moment";

interface Props {
  items: Coupon[];
  loading: boolean;
  onEdit: (coupon: Coupon) => void;
  onDelete?: (coupon: Coupon) => void;
}

const CouponListTable: React.FC<Props> = ({
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
        No coupons found.
      </div>
    );
  }

  const formatDate = (date: any) => {
    if (!date) return "-";
    if (date.seconds) return moment(date.toDate()).format("MMM DD, YYYY");
    return moment(date).format("MMM DD, YYYY");
  };

  const getDiscountDisplay = (coupon: Coupon) => {
    if (coupon.discountType === "PERCENTAGE")
      return `${coupon.discountValue}% OFF`;
    if (coupon.discountType === "FIXED")
      return `Rs. ${coupon.discountValue} OFF`;
    if (coupon.discountType === "FREE_SHIPPING") return `Free Shipping`;
    return "-";
  };

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
          <tr>
            <th className="px-4 py-3 border-b border-gray-100">Code</th>
            <th className="px-4 py-3 border-b border-gray-100">Discount</th>
            <th className="px-4 py-3 border-b border-gray-100">Status</th>
            <th className="px-4 py-3 border-b border-gray-100">Usage</th>
            <th className="px-4 py-3 border-b border-gray-100">Valid Until</th>
            <th className="px-4 py-3 border-b border-gray-100 text-right">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="text-sm text-gray-700">
          {items.map((coupon) => (
            <tr
              key={coupon.id}
              className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
            >
              <td className="px-4 py-3 font-medium text-gray-900">
                <div className="font-bold tracking-wide">{coupon.code}</div>
                <div className="text-xs text-gray-400 font-normal">
                  {coupon.name}
                </div>
              </td>
              <td className="px-4 py-3">
                <span className="font-semibold text-blue-600">
                  {getDiscountDisplay(coupon)}
                </span>
              </td>
              <td className="px-4 py-3">
                <span
                  className={`px-2 py-1 rounded text-xs font-bold ${
                    coupon.status === "ACTIVE"
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {coupon.status}
                </span>
              </td>
              <td className="px-4 py-3">
                {coupon.usageCount} / {coupon.usageLimit || "∞"}
              </td>
              <td className="px-4 py-3">{formatDate(coupon.endDate)}</td>
              <td className="px-4 py-3 flex justify-end gap-2">
                <button
                  onClick={() => onEdit(coupon)}
                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                  title="Edit"
                >
                  <IconEdit size={18} />
                </button>
                {onDelete && (
                  <button
                    onClick={() => onDelete(coupon)}
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

export default CouponListTable;
