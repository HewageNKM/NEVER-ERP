import React from "react";
import { format, parse } from "date-fns";
import { ComboProduct } from "@/model/ComboProduct";
import {
  IconEdit,
  IconTrash,
  IconLoader,
  IconPackage,
  IconPhoto,
} from "@tabler/icons-react";
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

  // Helper function to format dates
  // Helper function to format dates
  const formatDate = (date: any) => {
    if (!date) return "-";

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
      return "-";
    }

    return format(d, "MMM dd, yyyy");
  };

  // Empty State - Bold Typography
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-gray-200 bg-gray-50/50">
        <IconPackage className="text-gray-300 mb-2" size={48} />
        <p className="text-lg font-black uppercase tracking-tighter text-gray-300">
          No Bundles Found
        </p>
      </div>
    );
  }

  // Status Badge Logic - Sharp, Industrial Look
  const renderStatus = (status: string) => {
    const styles = {
      ACTIVE: "bg-black text-white border-black",
      INACTIVE: "bg-gray-100 text-gray-400 border-gray-100",
      DRAFT: "bg-white text-gray-400 border-gray-300 border-dashed",
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
            <th className="px-6 py-4 w-20">Asset</th>
            <th className="px-6 py-4">Bundle Info</th>
            <th className="px-6 py-4">Config</th>
            <th className="px-6 py-4">Pricing</th>
            <th className="px-6 py-4 text-center">Status</th>
            <th className="px-6 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="text-sm">
          {items.map((combo) => (
            <tr
              key={combo.id}
              className="border-b border-gray-100 group hover:bg-gray-50 transition-colors"
            >
              {/* Image */}
              <td className="px-6 py-5 align-top">
                <div className="w-12 h-12 bg-gray-100 relative border border-gray-200 flex items-center justify-center">
                  {combo.thumbnail?.url ? (
                    <Image
                      src={combo.thumbnail.url}
                      alt={combo.name}
                      fill
                      className="object-cover grayscale group-hover:grayscale-0 transition-all duration-300"
                    />
                  ) : (
                    <IconPhoto size={16} className="text-gray-300" />
                  )}
                </div>
              </td>

              {/* Name & Desc */}
              <td className="px-6 py-5 align-top">
                <div className="flex flex-col gap-1">
                  <span className="font-black text-black uppercase tracking-tight text-base leading-none">
                    {combo.name}
                  </span>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide truncate max-w-[200px]">
                    {combo.description || "NO DESCRIPTION"}
                  </span>
                </div>
              </td>

              {/* Type & Items */}
              <td className="px-6 py-5 align-top">
                <div className="flex flex-col gap-2 items-start">
                  <span className="font-bold text-[10px] uppercase tracking-wider text-gray-700 bg-gray-100 px-2 py-1">
                    {combo.type?.replace("_", " ")}
                  </span>
                  <span className="text-xs font-medium text-gray-500">
                    {combo.items?.length || 0} Products
                  </span>
                </div>
              </td>

              {/* Price */}
              <td className="px-6 py-5 align-top">
                <div className="flex flex-col">
                  <div className="flex items-baseline gap-1">
                    <span className="text-[10px] font-bold text-gray-400">
                      Rs.
                    </span>
                    <span className="font-black text-lg text-black tracking-tight font-mono">
                      {combo.comboPrice.toLocaleString()}
                    </span>
                  </div>
                  {combo.originalPrice > combo.comboPrice && (
                    <span className="text-[10px] text-gray-400 line-through font-mono">
                      Rs. {combo.originalPrice.toLocaleString()}
                    </span>
                  )}
                </div>
              </td>

              {/* Status */}
              <td className="px-6 py-5 align-top text-center">
                {renderStatus(combo.status)}
              </td>

              {/* Actions */}
              <td className="px-6 py-5 align-top text-right">
                <div className="flex justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-200">
                  <button
                    onClick={() => onEdit(combo)}
                    className="w-8 h-8 flex items-center justify-center border border-gray-200 hover:bg-black hover:border-black hover:text-white transition-colors"
                    title="Edit Bundle"
                  >
                    <IconEdit size={16} stroke={2} />
                  </button>
                  {onDelete && (
                    <button
                      onClick={() => onDelete(combo)}
                      className="w-8 h-8 flex items-center justify-center border border-gray-200 hover:bg-red-600 hover:border-red-600 hover:text-white transition-colors"
                      title="Delete Bundle"
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

export default ComboListTable;
