import { PopularItem } from "@/model";
import { useEffect, useState } from "react";
import { useAppSelector } from "@/lib/hooks";
import { getPopularItemsAction } from "@/actions/inventoryActions";
import DashboardCard from "@/app/(secured)/components/shared/DashboardCard";
import PopularItemCard from "@/app/(secured)/components/dashboard/PopularItemCard";
import { IoRefresh } from "react-icons/io5";
import { useSnackbar } from "@/contexts/SnackBarContext";
import EmptyState from "@/app/components/EmptyState";

const PopularItems = () => {
  const [items, setItems] = useState<PopularItem[] | null>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { currentUser } = useAppSelector((state) => state.authSlice);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const { showNotification } = useSnackbar();
  const months = [
    { value: 0, label: "January" },
    { value: 1, label: "February" },
    { value: 2, label: "March" },
    { value: 3, label: "April" },
    { value: 4, label: "May" },
    { value: 5, label: "June" },
    { value: 6, label: "July" },
    { value: 7, label: "August" },
    { value: 8, label: "September" },
    { value: 9, label: "October" },
    { value: 10, label: "November" },
    { value: 11, label: "December" },
  ];

  useEffect(() => {
    if (currentUser) {
      fetchPopularItems();
    }
  }, [currentUser, selectedMonth]);

  const fetchPopularItems = async () => {
    try {
      setIsLoading(true);
      const items: PopularItem[] = await getPopularItemsAction(
        20,
        selectedMonth
      );
      setItems(items);
    } catch (e: any) {
      console.error(e);
      showNotification(e.message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardCard>
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div className="flex items-center gap-2">
            <h4 className="text-xl font-black uppercase tracking-tighter text-black">
              Popular Products
            </h4>
            <button
              onClick={fetchPopularItems}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="refresh"
            >
              <IoRefresh size={18} />
            </button>
          </div>
          <div>
            <select
              value={selectedMonth}
              onChange={(e) =>
                setSelectedMonth(Number.parseInt(e.target.value))
              }
              className="bg-white border border-gray-300 text-black text-xs font-bold uppercase tracking-wide px-3 py-2 focus:outline-none focus:border-black transition-colors"
            >
              {months.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-[100px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {items?.map((item: PopularItem) => (
              <div key={item.item.itemId} className="flex justify-center">
                <PopularItemCard item={item} />
              </div>
            ))}
          </div>
        )}
        {!isLoading && items?.length === 0 && (
          <EmptyState
            title={"No Popular Items"}
            subtitle={"No popular items found for the selected month"}
          />
        )}
      </div>
    </DashboardCard>
  );
};

export default PopularItems;
