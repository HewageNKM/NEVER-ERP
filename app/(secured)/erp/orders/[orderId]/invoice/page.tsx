"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Order } from "@/model/Order";
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
      const response = await axios.get(`/api/v2/orders/${orderId}`, {
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
          href="/erp/orders"
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
                  {(() => {
                    // Group items: combo items by comboId, regular items separate
                    const comboGroups = new Map<string, typeof order.items>();
                    const regularItems: typeof order.items = [];

                    order.items.forEach((item) => {
                      if (item.isComboItem && item.comboId) {
                        if (!comboGroups.has(item.comboId)) {
                          comboGroups.set(item.comboId, []);
                        }
                        comboGroups.get(item.comboId)!.push(item);
                      } else {
                        regularItems.push(item);
                      }
                    });

                    return (
                      <>
                        {/* Regular Items */}
                        {regularItems.map((item, index) => (
                          <tr key={`regular-${index}`}>
                            <td className="py-4 pr-4">
                              <p className="font-bold text-black uppercase">
                                {item.name}
                              </p>
                              <p className="text-xs text-gray-500 uppercase mt-0.5">
                                {item.variantName}
                              </p>
                              {item.discount > 0 && (
                                <p className="text-xs text-red-600 mt-0.5">
                                  - Rs. {Number(item.discount).toFixed(2)}{" "}
                                  discount
                                </p>
                              )}
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

                        {/* Combo Groups */}
                        {Array.from(comboGroups.entries()).map(
                          ([comboId, comboItems]) => {
                            const comboName =
                              comboItems[0]?.comboName || "Combo Bundle";
                            const comboDiscount = comboItems.reduce(
                              (sum, i) => sum + (Number(i.discount) || 0),
                              0
                            );

                            return (
                              <React.Fragment key={comboId}>
                                {/* Combo Header Row */}
                                <tr className="bg-gray-50">
                                  <td
                                    colSpan={4}
                                    className="py-3 px-4 border-y border-gray-200"
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <span className="bg-black text-white text-[10px] font-black px-2 py-0.5 uppercase">
                                          Combo
                                        </span>
                                        <span className="font-bold text-black uppercase text-sm">
                                          {comboName}
                                        </span>
                                      </div>
                                      {comboDiscount > 0 && (
                                        <span className="text-xs font-bold text-red-600">
                                          - Rs. {comboDiscount.toFixed(2)} saved
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                                {/* Combo Items */}
                                {comboItems.map((item, index) => (
                                  <tr
                                    key={`combo-${comboId}-${index}`}
                                    className="bg-gray-50/50"
                                  >
                                    <td className="py-3 pr-4 pl-6">
                                      <p className="font-medium text-gray-700 uppercase text-xs">
                                        └ {item.name}
                                      </p>
                                      <p className="text-[10px] text-gray-400 uppercase mt-0.5 pl-3">
                                        {item.variantName}
                                      </p>
                                    </td>
                                    <td className="py-3 px-4 text-center font-mono text-xs text-gray-500">
                                      {item.size}
                                    </td>
                                    <td className="py-3 px-4 text-center font-mono text-xs text-gray-500">
                                      {Number(item.quantity)}
                                    </td>
                                    <td className="py-3 pl-4 text-right font-mono text-gray-600 text-xs">
                                      {(
                                        (Number(item.price) || 0) *
                                        (Number(item.quantity) || 0)
                                      ).toFixed(2)}
                                    </td>
                                  </tr>
                                ))}
                              </React.Fragment>
                            );
                          }
                        )}
                      </>
                    );
                  })()}
                </tbody>
              </table>
            </div>

            {/* Financial Summary */}
            <div className="flex justify-end">
              <div className="w-72 space-y-3">
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

                {/* Coupon Discount */}
                {order.couponCode && Number(order.couponDiscount) > 0 && (
                  <div className="flex justify-between text-xs font-bold text-gray-500 uppercase">
                    <div className="flex items-center gap-2">
                      <span>Coupon</span>
                      <span className="bg-green-100 text-green-700 px-1 py-0.5 text-[8px] font-black">
                        {order.couponCode}
                      </span>
                    </div>
                    <span className="font-mono text-green-600">
                      - {Number(order.couponDiscount).toFixed(2)}
                    </span>
                  </div>
                )}

                {/* Promotion Discount */}
                {Number(order.promotionDiscount) > 0 && (
                  <div className="flex justify-between text-xs font-bold text-gray-500 uppercase">
                    <div className="flex items-center gap-2">
                      <span>Promotion</span>
                      <span className="bg-blue-100 text-blue-700 px-1 py-0.5 text-[8px] font-black">
                        AUTO
                      </span>
                    </div>
                    <span className="font-mono text-blue-600">
                      - {Number(order.promotionDiscount).toFixed(2)}
                    </span>
                  </div>
                )}

                {/* Item Discounts (combo discounts, sale prices) */}
                {(() => {
                  const totalDiscount = Number(order.discount) || 0;
                  const couponDiscount = Number(order.couponDiscount) || 0;
                  const promoDiscount = Number(order.promotionDiscount) || 0;
                  const itemDiscounts =
                    totalDiscount - couponDiscount - promoDiscount;

                  if (itemDiscounts > 0) {
                    return (
                      <div className="flex justify-between text-xs font-bold text-gray-500 uppercase">
                        <span>Item Discounts</span>
                        <span className="font-mono text-red-600">
                          - {itemDiscounts.toFixed(2)}
                        </span>
                      </div>
                    );
                  }
                  return null;
                })()}

                {Number(order.shippingFee) > 0 && (
                  <div className="flex justify-between text-xs font-bold text-gray-500 uppercase">
                    <span>Shipping</span>
                    <span className="font-mono text-black">
                      {Number(order.shippingFee).toFixed(2)}
                    </span>
                  </div>
                )}

                {Number(order.fee) > 0 && (
                  <div className="flex justify-between text-xs font-bold text-gray-500 uppercase">
                    <span>Payment Fee</span>
                    <span className="font-mono text-black">
                      {Number(order.fee).toFixed(2)}
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
