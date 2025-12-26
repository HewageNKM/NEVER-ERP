import React from "react";

const HeaderCard = ({
  title,
  value,
  startDate,
  endDate,
  isLoading,
  invoices,
}: {
  title: string;
  value: number;
  startDate: string;
  endDate: string;
  isLoading: boolean;
  invoices: number;
}) => {
  return (
    <div className="flex flex-col gap-1 p-1 border border-gray-300 rounded-sm relative max-w-[350px]">
      <div>
        <div>
          <h6 className="text-lg font-bold uppercase tracking-tight text-gray-900">
            {title} ({invoices})
          </h6>
        </div>
        <div>
          <h3 className="text-3xl font-black uppercase tracking-tighter text-black">
            {isLoading ? "Loading..." : `LKR ${value.toFixed(2)}`}
          </h3>
        </div>
      </div>
      <div className="flex flex-row gap-3 justify-evenly w-full mt-2">
        <div className="flex flex-col gap-1">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase">From</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{startDate}</p>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase">To</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{endDate}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeaderCard;
