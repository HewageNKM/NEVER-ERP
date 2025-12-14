"use client";
import { PopularItem } from "@/model";
import { useEffect, useState, useRef } from "react";
import { useAppSelector } from "@/lib/hooks";
import { getPopularItemsAction } from "@/actions/inventoryActions";
import DashboardCard from "@/app/(secured)/components/shared/DashboardCard";
import PopularItemCard from "@/app/(secured)/components/dashboard/PopularItemCard";
import {
  IconRefresh,
  IconChevronLeft,
  IconChevronRight,
} from "@tabler/icons-react";
import { showNotification } from "@/utils/toast";

const PopularItems = () => {
  const [items, setItems] = useState<PopularItem[] | null>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { currentUser } = useAppSelector((state) => state.authSlice);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const sliderRef = useRef<HTMLDivElement>(null);

  const months = [
    { value: 0, label: "JANUARY" },
    { value: 1, label: "FEBRUARY" },
    { value: 2, label: "MARCH" },
    { value: 3, label: "APRIL" },
    { value: 4, label: "MAY" },
    { value: 5, label: "JUNE" },
    { value: 6, label: "JULY" },
    { value: 7, label: "AUGUST" },
    { value: 8, label: "SEPTEMBER" },
    { value: 9, label: "OCTOBER" },
    { value: 10, label: "NOVEMBER" },
    { value: 11, label: "DECEMBER" },
  ];

  useEffect(() => {
    if (currentUser) {
      fetchPopularItems();
    }
  }, [currentUser, selectedMonth]);

  const fetchPopularItems = async () => {
    try {
      setIsLoading(true);
      // Fetch more items (e.g., 10) since it's now a scrollable slider
      const items: PopularItem[] = await getPopularItemsAction(
        10,
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

  const scrollSlider = (direction: "left" | "right") => {
    if (sliderRef.current) {
      const scrollAmount = 240; // Card width (220) + Gap (20)
      sliderRef.current.scrollBy({
        left: direction === "right" ? scrollAmount : -scrollAmount,
        behavior: "smooth",
      });
    }
  };

  // Nike aesthetic styling for controls
  const controlStyles = {
    select:
      "bg-[#f5f5f5] border-2 border-transparent text-black text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-sm focus:outline-none focus:border-black transition-colors cursor-pointer appearance-none",
    iconBtn:
      "w-8 h-8 flex items-center justify-center border border-gray-200 bg-white text-black hover:bg-black hover:text-white transition-colors rounded-sm active:scale-95",
  };

  return (
    <DashboardCard>
      <div className="mb-2">
        {/* Header Controls */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 gap-4 pb-4 border-b border-black">
          <div className="flex items-center gap-4">
            <h4 className="text-xl font-black uppercase tracking-tighter text-black leading-none">
              Trending Products
            </h4>

            {/* Action Group */}
            <div className="flex gap-1">
              <button
                onClick={fetchPopularItems}
                className={controlStyles.iconBtn}
                aria-label="refresh"
                title="Refresh"
              >
                <IconRefresh size={16} stroke={2} />
              </button>
              <div className="w-px bg-gray-300 mx-1 h-8"></div>
              <button
                onClick={() => scrollSlider("left")}
                className={controlStyles.iconBtn}
                aria-label="previous"
              >
                <IconChevronLeft size={16} stroke={2} />
              </button>
              <button
                onClick={() => scrollSlider("right")}
                className={controlStyles.iconBtn}
                aria-label="next"
              >
                <IconChevronRight size={16} stroke={2} />
              </button>
            </div>
          </div>

          <div className="relative w-full xl:w-auto">
            <select
              value={selectedMonth}
              onChange={(e) =>
                setSelectedMonth(Number.parseInt(e.target.value))
              }
              className={`${controlStyles.select} w-full xl:w-auto`}
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
          <div className="flex justify-center items-center h-[200px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
          </div>
        ) : (
          /* SLIDER CONTAINER */
          <div
            ref={sliderRef}
            className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide scroll-smooth snap-x snap-mandatory"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }} // Hide scrollbar for Firefox/IE
          >
            {items?.map((item: PopularItem) => (
              <div key={item.item.itemId} className="snap-start">
                <PopularItemCard item={item} />
              </div>
            ))}

            {!isLoading && items?.length === 0 && (
              <div className="w-full py-12 flex flex-col items-center justify-center opacity-50 border-2 border-dashed border-gray-100">
                <p className="text-sm font-black uppercase tracking-widest">
                  No Data For Selected Month
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardCard>
  );
};

export default PopularItems;
