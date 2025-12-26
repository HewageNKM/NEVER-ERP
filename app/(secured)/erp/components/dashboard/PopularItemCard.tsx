import { PopularItem } from "@/model/PopularItem";

const PopularItemCard = ({ item }: { item: PopularItem }) => {
  return (
    // Changed w-full to fixed width for slider compatibility
    <div className="min-w-[220px] w-[220px] bg-white border border-gray-200 relative group select-none">
      {/* Image Container - Sharp edges */}
      <div className="relative h-[180px] w-full overflow-hidden bg-gray-100 border-b border-gray-200">
        <img
          src={item.item.thumbnail.url}
          alt={item.item.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110 pointer-events-none" // pointer-events-none prevents image drag while sliding
        />
        {/* Manufacturer Badge - Sharp Black Tag */}
        <div className="absolute top-0 left-0 bg-black px-3 py-1.5">
          <span className="text-[9px] font-black text-white uppercase tracking-[0.15em] leading-none block">
            {item.item.brand}
          </span>
        </div>
      </div>

      {/* Details */}
      <div className="p-4 text-left">
        <h5 className="font-black text-xs text-black truncate uppercase tracking-tight mb-3">
          {item.item.name}
        </h5>

        {/* Technical Spec Label for Sales */}
        <div className="flex items-center justify-between bg-gray-50 border border-gray-100 px-2 py-1.5">
          <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">
            Units Sold
          </span>
          <span className="text-sm font-black text-black font-mono">
            {item.soldCount.toString().padStart(2, "0")}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PopularItemCard;
