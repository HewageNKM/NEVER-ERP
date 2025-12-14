import React from "react";
import { Promotion } from "@/model/Promotion";
import { IconEdit, IconTrash, IconLoader, IconTag } from "@tabler/icons-react";
import { format, parse } from "date-fns";

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
        <IconTag className="text-gray-300 mb-2" size={48} />
        <p className="text-lg font-black uppercase tracking-tighter text-gray-300">
          No Campaigns Found
        </p>
      </div>
    );
  }

  // Date Formatter
  const formatDate = (date: any) => {
    if (!date) return "-";
    let d: Date;

    try {
      if (date && typeof date.toDate === "function") {
        d = date.toDate();
      } else if (date instanceof Date) {
        d = date;
      } else if (typeof date === "string") {
        d = new Date(date);
        // If standard parsing fails, try specific format from UtilService
        if (isNaN(d.getTime())) {
          try {
            d = parse(date, "dd/MM/yyyy, hh:mm:ss a", new Date());
          } catch {
            // ignore
          }
        }
      } else if (date.seconds) {
        d = new Date(date.seconds * 1000); // Fallback for serialized timestamp
      } else {
        d = new Date(date);
      }

      // Check for Invalid Date
      if (isNaN(d.getTime())) return "-";

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
    } catch (e) {
      console.error("Date parse error", e);
      return "-";
    }
  };

  // Status Badge Logic - Sharp, Industrial Look
  const renderStatus = (status: string) => {
    const styles = {
      ACTIVE: "bg-black text-white border-black",
      INACTIVE: "bg-gray-100 text-gray-400 border-gray-100",
      SCHEDULED: "bg-white text-black border-black border-2",
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
            <th className="px-6 py-4">Campaign Info</th>
            <th className="px-6 py-4">Type</th>
            <th className="px-6 py-4">Timeline</th>
            <th className="px-6 py-4 text-center">Priority</th>
            <th className="px-6 py-4 text-center">Status</th>
            <th className="px-6 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="text-sm">
          {items.map((promo) => (
            <tr
              key={promo.id}
              className="border-b border-gray-100 group hover:bg-gray-50 transition-colors"
            >
              {/* Name & Desc */}
              <td className="px-6 py-5 align-top">
                <div className="flex flex-col gap-1">
                  <span className="font-black text-black uppercase tracking-tight text-base leading-none">
                    {promo.name}
                  </span>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide truncate max-w-[200px]">
                    {promo.description || "NO DESCRIPTION"}
                  </span>
                </div>
              </td>

              {/* Type */}
              <td className="px-6 py-5 align-top">
                <span className="font-bold text-xs uppercase tracking-wider text-gray-700 bg-gray-100 px-2 py-1">
                  {promo.type?.replace("_", " ")}
                </span>
              </td>

              {/* Date Range */}
              <td className="px-6 py-5 align-top">
                <div className="flex items-center gap-2">
                  {formatDate(promo.startDate)}
                  <div className="h-px w-3 bg-gray-300"></div>
                  {formatDate(promo.endDate)}
                </div>
              </td>

              {/* Priority */}
              <td className="px-6 py-5 align-top text-center">
                <span className="font-black text-lg text-gray-900">
                  {promo.priority}
                </span>
              </td>

              {/* Status */}
              <td className="px-6 py-5 align-top text-center">
                {renderStatus(promo.status)}
              </td>

              {/* Actions */}
              <td className="px-6 py-5 align-top text-right">
                <div className="flex justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-200">
                  <button
                    onClick={() => onEdit(promo)}
                    className="w-8 h-8 flex items-center justify-center border border-gray-200 hover:bg-black hover:border-black hover:text-white transition-colors"
                    title="Edit Campaign"
                  >
                    <IconEdit size={16} stroke={2} />
                  </button>
                  {onDelete && (
                    <button
                      onClick={() => onDelete(promo)}
                      className="w-8 h-8 flex items-center justify-center border border-gray-200 hover:bg-red-600 hover:border-red-600 hover:text-white transition-colors"
                      title="Delete Campaign"
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

export default PromotionListTable;
