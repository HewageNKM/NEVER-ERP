"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { getToken } from "@/firebase/firebaseClient";
import { ExchangeRecord } from "@/model/ExchangeRecord";
import {
  IconAlertCircle,
  IconArrowRight,
  IconLoader,
} from "@tabler/icons-react";

interface OrderExchangeHistoryProps {
  orderId: string;
}

const styles = {
  sectionTitle:
    "text-lg font-black text-black uppercase tracking-tighter mb-6 pb-2 border-b-2 border-black flex items-center justify-between",
  tableHeader:
    "bg-black text-white text-[10px] font-bold uppercase tracking-widest py-3 px-4 text-left",
  tableCell: "py-4 px-4 text-xs font-bold border-b border-gray-100",
  badge:
    "inline-flex items-center px-2 py-1 text-[10px] font-black uppercase tracking-wide border-2",
};

export const OrderExchangeHistory: React.FC<OrderExchangeHistoryProps> = ({
  orderId,
}) => {
  const [exchanges, setExchanges] = useState<ExchangeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchExchanges();
  }, [orderId]);

  const fetchExchanges = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const response = await axios.get(`/api/v2/orders/${orderId}/exchanges`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setExchanges(response.data);
    } catch (err: any) {
      console.error(err);
      setError("Failed to load exchange history");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 p-8 shadow-sm flex justify-center py-12">
        <IconLoader className="animate-spin" size={24} />
      </div>
    );
  }

  if (exchanges.length === 0) {
    return null; // Don't show anything if no exchanges
  }

  return (
    <div className="bg-white border border-gray-200 p-8 shadow-sm">
      <div className={styles.sectionTitle}>
        <span>Exchange History ({exchanges.length})</span>
      </div>

      <div className="flex flex-col gap-8">
        {exchanges.map((exchange) => (
          <div
            key={exchange.id}
            className="border-2 border-gray-100 hover:border-black transition-colors duration-200"
          >
            {/* Header */}
            <div className="bg-gray-50 p-4 border-b-2 border-gray-100 flex flex-wrap gap-4 justify-between items-center">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Exchange ID
                </span>
                <span className="text-sm font-black text-black">
                  {exchange.id}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Date
                </span>
                <span className="text-xs font-bold text-black">
                  {new Date(exchange.createdAt as string).toLocaleDateString()}
                </span>
              </div>

              <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Net Adjustment
                </span>
                <span
                  className={`text-sm font-black ${
                    exchange.priceDifference > 0
                      ? "text-red-600"
                      : "text-gray-900"
                  }`}
                >
                  {exchange.priceDifference > 0
                    ? `+ Rs. ${exchange.priceDifference.toLocaleString()}`
                    : exchange.priceDifference < 0
                    ? `- Rs. ${Math.abs(
                        exchange.priceDifference
                      ).toLocaleString()}`
                    : "Rs. 0"}
                </span>
                {exchange.priceDifference > 0 && exchange.paymentMethod && (
                  <span className="text-[10px] uppercase font-bold bg-black text-white px-2 py-0.5 mt-1">
                    Paid via {exchange.paymentMethod}
                  </span>
                )}
              </div>
            </div>

            {/* Content grid */}
            <div className="grid grid-cols-1 md:grid-cols-2">
              {/* Returned Items */}
              <div className="p-4 border-b md:border-b-0 md:border-r border-gray-100">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-red-500 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>{" "}
                  Returned Items
                </h4>
                <div className="space-y-3">
                  {exchange.returnedItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-start text-xs border-b border-gray-50 pb-2 last:border-0 last:pb-0"
                    >
                      <div>
                        <div className="font-bold text-gray-900">
                          {item.name}
                        </div>
                        <div className="text-[10px] text-gray-500 font-bold uppercase">
                          {item.size}{" "}
                          {item.variantName ? `• ${item.variantName}` : ""}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">x{item.quantity}</div>
                        <div className="text-gray-500">
                          Rs. {item.price.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between text-xs font-black">
                  <span>TOTAL RETURN VALUE</span>
                  <span>Rs. {exchange.returnTotal.toLocaleString()}</span>
                </div>
              </div>

              {/* Replacement Items */}
              <div className="p-4 bg-gray-50/50">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-green-600 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-600 rounded-full"></span>{" "}
                  Replacements
                </h4>
                <div className="space-y-3">
                  {exchange.replacementItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-start text-xs border-b border-gray-200 pb-2 last:border-0 last:pb-0"
                    >
                      <div>
                        <div className="font-bold text-gray-900">
                          {item.name}
                        </div>
                        <div className="text-[10px] text-gray-500 font-bold uppercase">
                          {item.size}{" "}
                          {item.variantName ? `• ${item.variantName}` : ""}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">x{item.quantity}</div>
                        <div className="text-gray-500">
                          Rs. {item.price.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between text-xs font-black">
                  <span>TOTAL REPLACEMENT VALUE</span>
                  <span>Rs. {exchange.replacementTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Notes Footer */}
            {exchange.notes && (
              <div className="p-3 bg-yellow-50 border-t border-gray-100 text-xs font-medium text-gray-600">
                <span className="font-bold uppercase text-[10px] text-gray-400 mr-2">
                  Notes:
                </span>
                {exchange.notes}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
