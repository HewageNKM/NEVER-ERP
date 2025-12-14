"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Order } from "@/model";
import Image from "next/image";
import axios from "axios";
import { getToken } from "@/firebase/firebaseClient";
import { useAppSelector } from "@/lib/hooks";
import { Logo } from "@/assets/images";
import { IconPrinter, IconChevronLeft } from "@tabler/icons-react";
import Link from "next/link";

const OrderInvoice = () => {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const params = useParams();
  const orderId = params?.orderId as string;
  const { currentUser } = useAppSelector((state) => state.authSlice);

  useEffect(() => {
    if (orderId && currentUser) fetchOrderById();
  }, [orderId, currentUser]);

  const fetchOrderById = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const response = await axios.get(`/api/v1/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrder(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => window.print();

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-gray-100 border-t-black rounded-full animate-spin"></div>
          <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">
            Generating Invoice...
          </p>
        </div>
      </div>
    );

  if (!order) return null;

  return (
    <>
      <style key="print-style">
        {`
          @media print {
            body * { visibility: hidden; }
            #printable-area, #printable-area * { visibility: visible; }
            #printable-area { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; }
            .no-print { display: none !important; }
            @page { margin: 10mm; size: auto; }
          }
        `}
      </style>

      {/* Nav - Hidden on print */}
      <div className="max-w-4xl mx-auto mb-6 no-print pt-8 px-4 flex justify-between items-center">
        <Link
          href="/orders"
          className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-black transition-colors"
        >
          <IconChevronLeft size={16} /> Back to Orders
        </Link>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-6 py-3 bg-black text-white text-xs font-black uppercase tracking-widest hover:bg-gray-900 transition-all shadow-lg"
        >
          <IconPrinter size={16} /> Print Document
        </button>
      </div>

      <div className="min-h-screen bg-gray-100 pb-20 print:bg-white print:pb-0">
        <div className="max-w-[800px] mx-auto">
          {/* Invoice Paper */}
          <div
            id="printable-area"
            className="bg-white p-12 md:p-16 shadow-2xl min-h-[1100px] relative text-black print:shadow-none print:p-0"
          >
            {/* Header */}
            <div className="flex justify-between items-start border-b-4 border-black pb-8 mb-8">
              <div className="flex flex-col">
                <h1 className="text-5xl font-black uppercase tracking-tighter text-black leading-none mb-1">
                  Invoice
                </h1>
                <span className="text-xs font-bold uppercase tracking-widest text-gray-400">
                  Official Receipt
                </span>
              </div>

              <div className="text-right">
                <h2 className="text-xl font-bold uppercase tracking-tight mb-1">
                  NeverBe.
                </h2>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  330/4/10 New Kandy Road
                  <br />
                  Delgoda, Sri Lanka
                </p>
                <p className="text-xs font-medium text-gray-500 mt-1">
                  +94 70 520 8999
                </p>
              </div>
            </div>

            {/* Meta Data Grid */}
            <div className="grid grid-cols-2 gap-8 mb-12 border-b border-gray-100 pb-8">
              <div className="space-y-6">
                <div>
                  <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                    Invoice To
                  </span>
                  <p className="text-sm font-bold uppercase">
                    {order.customer?.name || "Guest"}
                  </p>
                  <p className="text-xs text-gray-600 mt-1 uppercase max-w-[200px] leading-relaxed">
                    {order.customer?.address}
                    <br />
                    {order.customer?.city} {order.customer?.zip}
                  </p>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                    Ship To
                  </span>
                  <p className="text-sm font-bold uppercase">
                    {order.customer?.shippingName || order.customer?.name}
                  </p>
                  <p className="text-xs text-gray-600 mt-1 uppercase max-w-[200px] leading-relaxed">
                    {order.customer?.shippingAddress}
                    <br />
                    {order.customer?.shippingCity} {order.customer?.shippingZip}
                  </p>
                </div>
              </div>
              <div className="text-right space-y-6">
                <div>
                  <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                    Order No.
                  </span>
                  <p className="text-lg font-black uppercase tracking-tight">
                    #{order.orderId}
                  </p>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                    Date Issued
                  </span>
                  <p className="text-sm font-bold uppercase">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                    Payment Status
                  </span>
                  <p className="text-sm font-black uppercase tracking-wide">
                    {order.paymentStatus}
                  </p>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="mb-12">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-black">
                    <th className="text-left font-black uppercase tracking-widest text-[10px] py-3 pr-4">
                      Item Description
                    </th>
                    <th className="text-center font-black uppercase tracking-widest text-[10px] py-3 px-4">
                      Size
                    </th>
                    <th className="text-center font-black uppercase tracking-widest text-[10px] py-3 px-4">
                      Qty
                    </th>
                    <th className="text-right font-black uppercase tracking-widest text-[10px] py-3 pl-4">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {order.items.map((item, index) => (
                    <tr key={index}>
                      <td className="py-4 pr-4">
                        <p className="font-bold text-black uppercase">
                          {item.name}
                        </p>
                        <p className="text-xs text-gray-500 uppercase mt-0.5">
                          {item.variantName}
                        </p>
                      </td>
                      <td className="py-4 px-4 text-center font-mono text-xs font-bold text-gray-600">
                        {item.size}
                      </td>
                      <td className="py-4 px-4 text-center font-mono text-xs font-bold text-gray-600">
                        {Number(item.quantity)}
                      </td>
                      <td className="py-4 pl-4 text-right font-mono font-bold text-black">
                        {(
                          (Number(item.price) || 0) *
                          (Number(item.quantity) || 0)
                        ).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financial Summary */}
            <div className="flex justify-end">
              <div className="w-64 space-y-3">
                <div className="flex justify-between text-xs font-bold text-gray-500 uppercase">
                  <span>Subtotal</span>
                  <span className="font-mono text-black">
                    {order.items
                      .reduce(
                        (acc, item) =>
                          acc +
                          (Number(item.price) || 0) *
                            (Number(item.quantity) || 0),
                        0
                      )
                      .toFixed(2)}
                  </span>
                </div>
                {Number(order.discount) > 0 && (
                  <div className="flex justify-between text-xs font-bold text-gray-500 uppercase">
                    <span>Discount</span>
                    <span className="font-mono text-red-600">
                      - {Number(order.discount).toFixed(2)}
                    </span>
                  </div>
                )}
                {Number(order.shippingFee) > 0 && (
                  <div className="flex justify-between text-xs font-bold text-gray-500 uppercase">
                    <span>Shipping</span>
                    <span className="font-mono text-black">
                      {Number(order.shippingFee).toFixed(2)}
                    </span>
                  </div>
                )}

                <div className="border-t-2 border-black pt-4 mt-4 flex justify-between items-end">
                  <span className="text-sm font-black uppercase tracking-tight">
                    Total Due
                  </span>
                  <span className="text-xl font-black font-mono tracking-tighter">
                    {Number(order.total).toFixed(2)}{" "}
                    <span className="text-[10px] text-gray-400 font-bold align-top">
                      LKR
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="absolute bottom-12 left-12 right-12 border-t border-gray-100 pt-6 flex justify-between items-end">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Thank you for your purchase.
              </div>
              <div className="text-[10px] font-bold text-black uppercase tracking-widest">
                NEVERBE.LK
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default OrderInvoice;
