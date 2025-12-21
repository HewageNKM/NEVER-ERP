"use client";

import React, { useState, useEffect } from "react";
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconLoader2,
  IconBuildingBank,
  IconCash,
  IconWallet,
} from "@tabler/icons-react";
import PageContainer from "@/app/(secured)/components/container/PageContainer";
import ComponentsLoader from "@/app/components/ComponentsLoader";
import axios from "axios";
import { getToken } from "@/firebase/firebaseClient";
import { showNotification } from "@/utils/toast";
import { useAppSelector } from "@/lib/hooks";
import { RootState } from "@/lib/store";

interface BankAccount {
  id: string;
  accountName: string;
  bankName: string;
  accountNumber: string;
  accountType: "checking" | "savings" | "cash";
  currentBalance: number;
  currency: string;
  status: boolean;
  notes?: string;
}

const ACCOUNT_TYPES = [
  { value: "checking", label: "Checking", icon: IconBuildingBank },
  { value: "savings", label: "Savings", icon: IconWallet },
  { value: "cash", label: "Cash", icon: IconCash },
];

const BankAccountsPage = () => {
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [totalBalance, setTotalBalance] = useState(0);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form
  const [formData, setFormData] = useState({
    accountName: "",
    bankName: "",
    accountNumber: "",
    accountType: "checking" as "checking" | "savings" | "cash",
    currentBalance: 0,
    currency: "LKR",
    status: true,
    notes: "",
  });

  const { currentUser } = useAppSelector((state: RootState) => state.authSlice);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const [accountsRes, summaryRes] = await Promise.all([
        axios.get<BankAccount[]>("/api/v2/finance/bank-accounts", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get<{ totalBalance: number }>(
          "/api/v2/finance/bank-accounts?summary=true",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        ),
      ]);
      setAccounts(accountsRes.data);
      setTotalBalance(summaryRes.data.totalBalance);
    } catch (error) {
      console.error(error);
      showNotification("Failed to load accounts", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) fetchAccounts();
  }, [currentUser]);

  const openAddModal = () => {
    setEditingId(null);
    setFormData({
      accountName: "",
      bankName: "",
      accountNumber: "",
      accountType: "checking",
      currentBalance: 0,
      currency: "LKR",
      status: true,
      notes: "",
    });
    setShowModal(true);
  };

  const openEditModal = (account: BankAccount) => {
    setEditingId(account.id);
    setFormData({
      accountName: account.accountName,
      bankName: account.bankName,
      accountNumber: account.accountNumber,
      accountType: account.accountType,
      currentBalance: account.currentBalance,
      currency: account.currency,
      status: account.status,
      notes: account.notes || "",
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.accountName.trim()) {
      showNotification("Please enter account name", "warning");
      return;
    }

    setSaving(true);
    try {
      const token = await getToken();

      if (editingId) {
        await axios.put(
          `/api/v2/finance/bank-accounts/${editingId}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        showNotification("Account updated", "success");
      } else {
        await axios.post("/api/v2/finance/bank-accounts", formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        showNotification("Account created", "success");
      }

      setShowModal(false);
      fetchAccounts();
    } catch (error) {
      console.error(error);
      showNotification("Failed to save account", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this account?")) return;

    try {
      const token = await getToken();
      await axios.delete(`/api/v2/finance/bank-accounts/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showNotification("Account deleted", "success");
      fetchAccounts();
    } catch (error) {
      console.error(error);
      showNotification("Failed to delete account", "error");
    }
  };

  const formatCurrency = (amount: number) => {
    return `Rs ${amount.toLocaleString()}`;
  };

  return (
    <PageContainer title="Bank Accounts">
      <div className="w-full space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-lg md:text-2xl font-bold uppercase tracking-tight text-gray-900">
              Bank Accounts
            </h2>
            <p className="text-xs md:text-sm text-gray-500 mt-0.5">
              Manage company bank accounts and balances
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="w-full md:w-auto px-4 py-2.5 bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-gray-900 flex items-center justify-center gap-2"
          >
            <IconPlus size={14} />
            Add Account
          </button>
        </div>

        {/* Summary Card */}
        <div className="bg-black text-white p-6">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
            Total Balance
          </p>
          <p className="text-3xl md:text-4xl font-black mt-2">
            {formatCurrency(totalBalance)}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Across {accounts.filter((a) => a.status).length} active accounts
          </p>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-20">
            <ComponentsLoader />
          </div>
        ) : accounts.length === 0 ? (
          <div className="bg-white border border-gray-200 p-12 text-center">
            <IconBuildingBank
              size={48}
              className="mx-auto text-gray-300 mb-4"
            />
            <p className="text-gray-500">No bank accounts found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map((account) => {
              const TypeIcon =
                ACCOUNT_TYPES.find((t) => t.value === account.accountType)
                  ?.icon || IconBuildingBank;
              return (
                <div
                  key={account.id}
                  className={`bg-white border p-5 ${
                    account.status
                      ? "border-gray-200"
                      : "border-gray-100 opacity-60"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 flex items-center justify-center">
                        <TypeIcon size={20} className="text-gray-600" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">
                          {account.accountName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {account.bankName}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => openEditModal(account)}
                        className="p-1.5 text-gray-600 hover:bg-gray-100"
                      >
                        <IconEdit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(account.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50"
                      >
                        <IconTrash size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-2xl font-black text-gray-900">
                      {formatCurrency(account.currentBalance)}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-gray-500">
                        •••• {account.accountNumber.slice(-4)}
                      </span>
                      <span
                        className={`px-2 py-0.5 text-xs font-bold uppercase ${
                          account.status
                            ? "bg-green-50 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {account.status ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-sm font-bold uppercase tracking-wider">
                  {editingId ? "Edit Account" : "Add Account"}
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                    Account Name *
                  </label>
                  <input
                    type="text"
                    value={formData.accountName}
                    onChange={(e) =>
                      setFormData({ ...formData, accountName: e.target.value })
                    }
                    placeholder="e.g., Main Operating Account"
                    className="w-full px-4 py-3 border border-gray-300 text-sm focus:outline-none focus:border-black"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    value={formData.bankName}
                    onChange={(e) =>
                      setFormData({ ...formData, bankName: e.target.value })
                    }
                    placeholder="e.g., Commercial Bank"
                    className="w-full px-4 py-3 border border-gray-300 text-sm focus:outline-none focus:border-black"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                    Account Number
                  </label>
                  <input
                    type="text"
                    value={formData.accountNumber}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        accountNumber: e.target.value,
                      })
                    }
                    placeholder="e.g., 1234567890"
                    className="w-full px-4 py-3 border border-gray-300 text-sm focus:outline-none focus:border-black"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                      Account Type
                    </label>
                    <select
                      value={formData.accountType}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          accountType: e.target.value as any,
                        })
                      }
                      className="w-full px-4 py-3 border border-gray-300 text-sm focus:outline-none focus:border-black"
                    >
                      {ACCOUNT_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                      Currency
                    </label>
                    <select
                      value={formData.currency}
                      onChange={(e) =>
                        setFormData({ ...formData, currency: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-gray-300 text-sm focus:outline-none focus:border-black"
                    >
                      <option value="LKR">LKR</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                    Current Balance
                  </label>
                  <input
                    type="number"
                    value={formData.currentBalance}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        currentBalance: Number(e.target.value),
                      })
                    }
                    className="w-full px-4 py-3 border border-gray-300 text-sm focus:outline-none focus:border-black"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                    Notes
                  </label>
                  <input
                    type="text"
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    placeholder="Optional notes"
                    className="w-full px-4 py-3 border border-gray-300 text-sm focus:outline-none focus:border-black"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="status"
                    checked={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.checked })
                    }
                    className="w-4 h-4"
                  />
                  <label htmlFor="status" className="text-sm text-gray-700">
                    Active
                  </label>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 text-xs font-bold uppercase hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-black text-white text-xs font-bold uppercase hover:bg-gray-900 disabled:opacity-50 flex items-center gap-2"
                >
                  {saving && <IconLoader2 size={14} className="animate-spin" />}
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default BankAccountsPage;
