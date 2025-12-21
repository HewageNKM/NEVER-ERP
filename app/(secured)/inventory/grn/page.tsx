"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { IconEye, IconSearch, IconPlus } from "@tabler/icons-react";
import PageContainer from "@/app/(secured)/components/container/PageContainer";
import ComponentsLoader from "@/app/components/ComponentsLoader";
import axios from "axios";
import { getToken } from "@/firebase/firebaseClient";
import { showNotification } from "@/utils/toast";
import { useAppSelector } from "@/lib/hooks";
import { RootState } from "@/lib/store";

interface GRN {
  id: string;
  grnNumber: string;
  poNumber: string;
  supplierName: string;
  totalAmount: number;
  receivedDate: string;
  receivedBy?: string;
}

const GRNListPage = () => {
  const [loading, setLoading] = useState(true);
  const [grns, setGRNs] = useState<GRN[]>([]);
  const [search, setSearch] = useState("");

  const { currentUser } = useAppSelector((state: RootState) => state.authSlice);

  const fetchGRNs = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const res = await axios.get<GRN[]>("/api/v2/grn", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setGRNs(res.data);
    } catch (error) {
      console.error(error);
      showNotification("Failed to fetch GRNs", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) fetchGRNs();
  }, [currentUser]);

  const filteredGRNs = grns.filter(
    (g) =>
      g.grnNumber.toLowerCase().includes(search.toLowerCase()) ||
      g.poNumber.toLowerCase().includes(search.toLowerCase()) ||
      g.supplierName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <PageContainer title="Goods Received Notes">
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-tight text-gray-900">
              Goods Received Notes
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Track received goods from suppliers
            </p>
          </div>
          <Link
            href="/inventory/grn/new"
            className="w-full sm:w-auto px-6 py-3 bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-gray-900 transition-colors flex items-center justify-center gap-2"
          >
            <IconPlus size={16} />
            New GRN
          </Link>
        </div>

        {/* Search */}
        <div className="relative">
          <IconSearch
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search by GRN#, PO#, or supplier..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 focus:outline-none focus:border-black"
          />
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-20">
            <ComponentsLoader />
          </div>
        )}

        {/* Table */}
        {!loading && (
          <div className="bg-white border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 font-bold tracking-wider">
                      GRN Number
                    </th>
                    <th className="px-6 py-3 font-bold tracking-wider">
                      PO Number
                    </th>
                    <th className="px-6 py-3 font-bold tracking-wider">
                      Supplier
                    </th>
                    <th className="px-6 py-3 font-bold tracking-wider text-right">
                      Amount
                    </th>
                    <th className="px-6 py-3 font-bold tracking-wider">
                      Received Date
                    </th>
                    <th className="px-6 py-3 font-bold tracking-wider text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredGRNs.map((grn) => (
                    <tr
                      key={grn.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <span className="font-mono font-bold text-gray-900">
                          {grn.grnNumber}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-gray-600">
                          {grn.poNumber}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {grn.supplierName}
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-gray-900">
                        Rs {grn.totalAmount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {grn.receivedDate}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/inventory/grn/${grn.id}`}
                          className="p-2 hover:bg-gray-100 inline-flex transition-colors"
                        >
                          <IconEye size={16} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {filteredGRNs.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-12 text-center text-gray-500"
                      >
                        No GRNs found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default GRNListPage;
