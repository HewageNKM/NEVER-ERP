"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Order } from "@/model";
import Image from "next/image";
import axios from "axios";
import { getToken } from "@/firebase/firebaseClient";
import { useAppSelector } from "@/lib/hooks";
import { Logo } from "@/assets/images";
import { IconPrinter } from "@tabler/icons-react";
import Link from "next/link";

const OrderInvoice = () => {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const params = useParams();
  const orderId = params?.orderId as string;
  const { currentUser } = useAppSelector((state) => state.authSlice);
  const router = useRouter();

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
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium uppercase tracking-wide">
            Loading Invoice...
          </p>
        </div>
      </div>
    );

  if (!order)
    return (
      <div className="p-8 text-center text-gray-500 uppercase tracking-wide">
        Order not found or still loading.
      </div>
    );

  return (
    <>
      <style key="print-style">
        {`
          @media print {
            body * { visibility: hidden; }
            #printable-area, #printable-area * { visibility: visible; }
            #printable-area { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 20mm; }
            .no-print { display: none !important; }
            @page { margin: 0; }
          }
        `}
      </style>

      {/* Breadcrumbs - Hidden on print */}
      <div className="max-w-4xl mx-auto mb-6 no-print pt-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6 font-medium uppercase tracking-wide">
          <Link href="/orders" className="hover:text-black transition-colors">
            Orders
          </Link>
          <span>/</span>
          <span className="text-black font-bold">
            Invoice #{order?.orderId}
          </span>
        </div>
      </div>

      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="max-w-[800px] mx-auto">
          {/* Action Bar */}
          <div className="flex justify-end mb-6 no-print">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-6 py-2.5 bg-black text-white text-sm font-bold uppercase tracking-wide rounded-sm hover:bg-gray-800 transition-all shadow-md"
            >
              <IconPrinter size={18} />
              Print Invoice
            </button>
          </div>

          {/* Invoice Paper */}
          <div
            id="printable-area"
            className="bg-white p-8 md:p-12 shadow-lg min-h-[1000px] relative text-black"
          >
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-8 border-b-2 border-black pb-8">
              <div className="space-y-4">
                <div className="w-24 h-24 relative mb-2">
                  <Image
                    alt="Store Logo"
                    src={Logo}
                    fill
                    style={{ objectFit: "contain" }}
                  />
                </div>
                <div className="text-sm text-gray-600 leading-relaxed">
                  <p className="font-bold text-black text-lg tracking-tight uppercase">
                    NEVERBE
                  </p>
                  <p>330/4/10 New Kandy Road, Delgoda</p>
                  <p>support@neverbe.lk</p>
                  <p>+94 70 520 8999</p>
                </div>
              </div>

              <div className="text-right space-y-2">
                <h1 className="text-4xl font-black uppercase tracking-tighter text-black mb-4">
                  Invoice
                </h1>
                <div className="text-sm">
                  <p>
                    <span className="font-bold uppercase text-gray-500 mr-2">
                      Order ID:
                    </span>{" "}
                    <span className="font-mono font-bold">
                      #{order.orderId}
                    </span>
                  </p>
                  <p>
                    <span className="font-bold uppercase text-gray-500 mr-2">
                      Date:
                    </span>{" "}
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                  <p>
                    <span className="font-bold uppercase text-gray-500 mr-2">
                      Status:
                    </span>{" "}
                    <span className="uppercase">{order.paymentStatus}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Customer Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-12 mt-12 mb-12">
              <div>
                <h3 className="text-xs font-bold uppercase text-gray-400 mb-2">
                  Bill To
                </h3>
                <div className="text-sm font-medium leading-relaxed">
                  <p className="font-bold text-black text-base uppercase mb-1">
                    {order.customer?.name || "N/A"}
                  </p>
                  <p>{order.customer?.address || "N/A"}</p>
                  <p>
                    {order.customer?.city || "N/A"}, {order.customer?.zip || ""}
                  </p>
                  <p className="mt-2">{order.customer?.phone || "N/A"}</p>
                  <p>{order.customer?.email || "N/A"}</p>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase text-gray-400 mb-2">
                  Ship To
                </h3>
                <div className="text-sm font-medium leading-relaxed">
                  <p className="font-bold text-black text-base uppercase mb-1">
                    {order.customer?.shippingName || "N/A"}
                  </p>
                  <p>{order.customer?.shippingAddress || "N/A"}</p>
                  <p>
                    {order.customer?.shippingCity || "N/A"},{" "}
                    {order.customer?.shippingZip || ""}
                  </p>
                  <p className="mt-2 text-gray-600">
                    Phone: {order.customer?.shippingPhone || "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="mb-12">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-black">
                    <th className="text-left font-bold uppercase py-3 pr-4">
                      Item
                    </th>
                    <th className="text-left font-bold uppercase py-3 px-4">
                      Variant
                    </th>
                    <th className="text-right font-bold uppercase py-3 px-4">
                      Size
                    </th>
                    <th className="text-right font-bold uppercase py-3 px-4">
                      Qty
                    </th>
                    <th className="text-right font-bold uppercase py-3 px-4">
                      Price
                    </th>
                    <th className="text-right font-bold uppercase py-3 pl-4">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {order.items.map((item, index) => (
                    <tr key={index}>
                      <td className="py-4 pr-4">
                        <p className="font-bold text-black">{item.name}</p>
                      </td>
                      <td className="py-4 px-4 text-gray-600">
                        {item.variantName}
                      </td>
                      <td className="py-4 px-4 text-right text-gray-600">
                        {item.size}
                      </td>
                      <td className="py-4 px-4 text-right font-medium">
                        {Number(item.quantity) || 0}
                      </td>
                      <td className="py-4 px-4 text-right text-gray-600">
                        {(Number(item.price) || 0).toFixed(2)}
                      </td>
                      <td className="py-4 pl-4 text-right font-bold">
                        {(
                          (Number(item.price) || 0) *
                            (Number(item.quantity) || 0) -
                          (Number(item.discount) || 0) *
                            (Number(item.quantity) || 0)
                        ).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary & Footer */}
            <div className="flex flex-col sm:flex-row justify-between items-end gap-12 border-t-2 border-black pt-8">
              {/* Footer Message */}
              <div className="text-sm text-gray-500 max-w-xs">
                <p className="font-bold text-black uppercase mb-1">
                  Thank you for your business.
                </p>
                <p>
                  For any questions regarding this invoice, please contact
                  support@neverbe.lk
                </p>
                <p className="mt-4 font-mono text-xs">
                  Generated from NEVERBE Panel
                </p>
              </div>

              {/* Totals */}
              <div className="w-full sm:w-64 space-y-3 text-sm">
                <div className="flex justify-between items-center text-gray-600">
                  <span>Subtotal</span>
                  <span>
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
                <div className="flex justify-between items-center text-gray-600">
                  <span>Discount</span>
                  <span className="text-red-600">
                    - {(Number(order?.discount) || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-gray-600">
                  <span>Shipping</span>
                  <span>{(Number(order?.shippingFee) || 0).toFixed(2)}</span>
                </div>
                <div className="border-t border-gray-200 pt-3 mt-3 flex justify-between items-center text-lg font-black uppercase">
                  <span>Total (LKR)</span>
                  <span>{(Number(order?.total) || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Footer Site */}
            <div className="absolute bottom-12 left-0 w-full text-center text-xs font-bold uppercase tracking-widest text-gray-300">
              www.neverbe.lk
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default OrderInvoice;
