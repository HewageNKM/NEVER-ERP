import React from "react";
import { PopularItem } from "@/model";

const PopularItemCard = ({ item }: { item: PopularItem }) => {
  return (
    <div className="w-[130px] min-w-[130px] bg-white border border-gray-200 relative group hover:border-black transition-colors duration-300">
      <div className="relative h-[140px] w-full overflow-hidden bg-gray-100">
        <img
          src={item.item.thumbnail.url}
          alt={item.item.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute top-0 left-0 bg-black px-2 py-1">
          <span className="text-[10px] font-black text-white uppercase tracking-widest leading-none block">
            {item.item.manufacturer}
          </span>
        </div>
      </div>

      <div className="p-3 text-center">
        <h5 className="font-bold text-sm text-black truncate uppercase tracking-tight">
          {item.item.name}
        </h5>
        <div className="inline-block mt-2 px-2 py-0.5 bg-gray-100 text-[10px] font-bold uppercase tracking-wide text-gray-600">
          Sold: {item.soldCount}
        </div>
      </div>
    </div>
  );
};

export default PopularItemCard;
