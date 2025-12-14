import React from "react";
import { IconAlertTriangle, IconPackageOff } from "@tabler/icons-react";

const EmptyState = ({
  title = "NO DATA FOUND",
  subtitle = "The requested information is unavailable.",
}: {
  title?: string;
  subtitle?: string;
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-12 min-h-[300px] w-full border-2 border-dashed border-gray-300 bg-gray-50/50 rounded-sm">
      {/* Icon */}
      <div className="mb-6 text-gray-300">
        <IconPackageOff size={64} stroke={1} />
      </div>

      {/* Typography */}
      <div className="max-w-md space-y-2">
        <h3 className="text-3xl font-black text-black uppercase tracking-tighter leading-none">
          {title}
        </h3>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">
          {subtitle}
        </p>
      </div>
    </div>
  );
};

export default EmptyState;
