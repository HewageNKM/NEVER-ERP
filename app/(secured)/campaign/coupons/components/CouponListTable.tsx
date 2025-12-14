import React from "react";
import { Coupon } from "@/model/Coupon";
import {
  IconEdit,
  IconTrash,
  IconLoader,
  IconTicket,
} from "@tabler/icons-react";
import { format, parse } from "date-fns";

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
  // Loading State - Minimalist Spinner
  if (loading) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-20 gap-3">
        <IconLoader className="animate-spin text-black" size={24} />
        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
          Loading Data
        </span>
      </div>
    );
  }

  // Empty State - Bold Typography
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-gray-200 bg-gray-50/50">
        <IconTicket className="text-gray-300 mb-2" size={48} />
        <p className="text-lg font-black uppercase tracking-tighter text-gray-300">
          No Coupons Found
        </p>
      </div>
    );
  }

  // Date Formatter - Stacked Industrial Look
  const formatDate = (date: any) => {
    if (!date) return <span className="text-gray-300 font-bold">-</span>;

    let d: Date | null = null;

    // Handle Firestore Timestamp
    if (date.seconds) {
      d = date.toDate();
    }
    // Handle String (ISO or Custom Backend Format)
    else if (typeof date === "string") {
      const parsed = new Date(date);
      if (!isNaN(parsed.getTime())) {
        d = parsed;
      } else {
        try {
          // Fallback for backend "dd/MM/yyyy, hh:mm:ss a" format
          d = parse(date, "dd/MM/yyyy, hh:mm:ss a", new Date());
        } catch {
          d = null;
        }
      }
    }
    // Handle Date Object
    else if (date instanceof Date) {
      d = date;
    }

    if (!d || isNaN(d.getTime())) {
      return <span className="text-gray-300 font-bold">-</span>;
    }

    return (
      <div className="flex flex-col">
        <span className="font-bold text-gray-900 leading-none">
          {format(d, "dd MMM")}
        </span>
        <span className="text-[9px] text-gray-400 uppercase tracking-widest">
          {format(d, "yyyy")}
        </span>
      </div>
    );
  };

  // Discount Display Logic
  const getDiscountDisplay = (coupon: Coupon) => {
    if (coupon.discountType === "PERCENTAGE") {
      return (
        <span className="font-black text-lg tracking-tight">
          {coupon.discountValue}%{" "}
          <span className="text-[10px] text-gray-400 font-bold align-top tracking-widest uppercase ml-1">
            OFF
          </span>
        </span>
      );
    }
    if (coupon.discountType === "FIXED") {
      return (
        <span className="font-black text-lg tracking-tight">
          Rs.{coupon.discountValue}{" "}
          <span className="text-[10px] text-gray-400 font-bold align-top tracking-widest uppercase ml-1">
            OFF
          </span>
        </span>
      );
    }
    if (coupon.discountType === "FREE_SHIPPING") {
      return (
        <span className="font-black text-sm uppercase tracking-wide border-b-2 border-black pb-0.5">
          Free Ship
        </span>
      );
    }
    return "-";
  };

  // Status Badge Logic - Sharp, Industrial Look
  const renderStatus = (status: string) => {
    const styles = {
      ACTIVE: "bg-black text-white border-black",
      INACTIVE: "bg-gray-100 text-gray-400 border-gray-100",
      EXPIRED:
        "bg-white text-gray-300 border-gray-200 line-through decoration-2 decoration-gray-300",
    };

    const styleClass = styles[status as keyof typeof styles] || styles.INACTIVE;

    return (
      <span
        className={`px-2 py-1 text-[9px] font-black uppercase tracking-widest border ${styleClass}`}
      >
        {status}
      </span>
    );
  };

  return (
    <div className="w-full overflow-x-auto border border-gray-200 bg-white">
      <table className="w-full text-left border-collapse">
        <thead className="bg-white text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em] border-b-2 border-black">
          <tr>
            <th className="px-6 py-4">Voucher Code</th>
            <th className="px-6 py-4">Value</th>
            <th className="px-6 py-4">Valid Until</th>
            <th className="px-6 py-4 text-center">Usage</th>
            <th className="px-6 py-4 text-center">Status</th>
            <th className="px-6 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="text-sm">
          {items.map((coupon) => (
            <tr
              key={coupon.id}
              className="border-b border-gray-100 group hover:bg-gray-50 transition-colors"
            >
              {/* Code & Name */}
              <td className="px-6 py-5 align-top">
                <div className="flex flex-col gap-1">
                  <div className="font-black text-black uppercase tracking-wider text-lg leading-none font-mono">
                    {coupon.code}
                  </div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide truncate max-w-[200px]">
                    {coupon.name || "NO NAME"}
                  </span>
                </div>
              </td>

              {/* Discount Value */}
              <td className="px-6 py-5 align-top">
                {getDiscountDisplay(coupon)}
              </td>

              {/* Date */}
              <td className="px-6 py-5 align-top">
                {formatDate(coupon.endDate)}
              </td>

              {/* Usage Stats - Monospace for tabular feel */}
              <td className="px-6 py-5 align-top text-center">
                <div className="inline-flex items-center gap-1 font-mono text-xs font-bold bg-gray-100 px-2 py-1 rounded-sm text-gray-600">
                  <span>{coupon.usageCount}</span>
                  <span className="text-gray-400">/</span>
                  <span>
                    {coupon.usageLimit && coupon.usageLimit > 0
                      ? coupon.usageLimit
                      : "∞"}
                  </span>
                </div>
              </td>

              {/* Status */}
              <td className="px-6 py-5 align-top text-center">
                {renderStatus(coupon.status)}
              </td>

              {/* Actions */}
              <td className="px-6 py-5 align-top text-right">
                <div className="flex justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-200">
                  <button
                    onClick={() => onEdit(coupon)}
                    className="w-8 h-8 flex items-center justify-center border border-gray-200 hover:bg-black hover:border-black hover:text-white transition-colors"
                    title="Edit Voucher"
                  >
                    <IconEdit size={16} stroke={2} />
                  </button>
                  {onDelete && (
                    <button
                      onClick={() => onDelete(coupon)}
                      className="w-8 h-8 flex items-center justify-center border border-gray-200 hover:bg-red-600 hover:border-red-600 hover:text-white transition-colors"
                      title="Delete Voucher"
                    >
                      <IconTrash size={16} stroke={2} />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CouponListTable;
