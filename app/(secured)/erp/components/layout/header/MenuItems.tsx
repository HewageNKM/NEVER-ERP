import {
  IconLayoutDashboard,
  IconApps,
  IconPackage,
  IconShoppingCart,
  IconUsers,
  IconCash,
  IconSpeakerphone,
  IconWorld,
  IconChartPie,
  IconSettings,
  IconTruckDelivery,
  IconClipboardList,
  IconReceipt,
  IconAdjustments,
} from "@tabler/icons-react";
import { uniqueId } from "lodash";

const Menuitems = [
  {
    subHeader: "Overview",
    navLabel: true,
  },
  {
    id: uniqueId(),
    title: "Dashboard",
    icon: IconLayoutDashboard,
    href: "/erp/dashboard",
  },
  {
    subHeader: "Management",
    navLabel: true,
  },
  {
    id: uniqueId(),
    title: "Master Data",
    icon: IconApps,
    children: [
      {
        id: uniqueId(),
        title: "Categories",
        href: "/erp/master/categories",
      },
      { id: uniqueId(), title: "Brands", href: "/erp/master/brands" },
      { id: uniqueId(), title: "Sizes", href: "/erp/master/sizes" },
      { id: uniqueId(), title: "Products", href: "/erp/master/products" },
      {
        id: uniqueId(),
        title: "Stock Locations",
        href: "/erp/master/stocks",
      },
    ],
  },
  {
    id: uniqueId(),
    title: "Inventory",
    icon: IconPackage,
    children: [
      { id: uniqueId(), title: "Stock Overview", href: "/erp/inventory" },
      {
        id: uniqueId(),
        title: "Adjustments",
        href: "/erp/inventory/adjustments",
      },
      { id: uniqueId(), title: "Suppliers", href: "/erp/inventory/suppliers" },
      {
        id: uniqueId(),
        title: "Purchase Orders",
        href: "/erp/inventory/purchase-orders",
      },
      { id: uniqueId(), title: "Goods Received", href: "/erp/inventory/grn" },
    ],
  },
  {
    id: uniqueId(),
    title: "Orders",
    icon: IconShoppingCart,
    href: "/erp/orders",
  },
  {
    id: uniqueId(),
    title: "Users",
    icon: IconUsers,
    href: "/erp/users",
  },
  {
    id: uniqueId(),
    title: "Finance",
    icon: IconCash,
    children: [
      { id: uniqueId(), title: "Dashboard", href: "/erp/finance" },
      { id: uniqueId(), title: "Petty Cash", href: "/erp/finance/petty-cash" },
      {
        id: uniqueId(),
        title: "Expense Categories",
        href: "/erp/finance/expense-categories",
      },
      {
        id: uniqueId(),
        title: "Bank Accounts",
        href: "/erp/finance/bank-accounts",
      },
      {
        id: uniqueId(),
        title: "Supplier Invoices",
        href: "/erp/finance/supplier-invoices",
      },
    ],
  },
  {
    subHeader: "Marketing",
    navLabel: true,
  },
  {
    id: uniqueId(),
    title: "Campaign",
    icon: IconSpeakerphone,
    children: [
      {
        id: uniqueId(),
        title: "Promotions",
        href: "/erp/campaign/promotions",
      },
      {
        id: uniqueId(),
        title: "Coupons",
        href: "/erp/campaign/coupons",
      },
      {
        id: uniqueId(),
        title: "Combos",
        href: "/erp/campaign/combos",
      },
    ],
  },
  {
    subHeader: "Website",
    navLabel: true,
  },
  {
    id: uniqueId(),
    title: "Website Manager",
    icon: IconWorld,
    href: "/erp/website",
  },
  {
    subHeader: "Reports",
    navLabel: true,
  },
  {
    id: uniqueId(),
    title: "Analytics",
    icon: IconChartPie,
    href: "/erp/reports",
  },
  {
    subHeader: "System",
    navLabel: true,
  },
  {
    id: uniqueId(),
    title: "Settings",
    icon: IconSettings,
    children: [
      { id: uniqueId(), title: "ERP Settings", href: "/erp/settings" },
      {
        id: uniqueId(),
        title: "Shipping Rates",
        href: "/erp/settings/shipping",
      },
      {
        id: uniqueId(),
        title: "Payment Methods",
        href: "/erp/settings/payment-methods",
      },
      { id: uniqueId(), title: "Tax Settings", href: "/erp/settings/tax" },
    ],
  },
];

export default Menuitems;
