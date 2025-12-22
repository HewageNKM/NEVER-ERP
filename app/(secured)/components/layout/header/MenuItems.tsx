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
    href: "/dashboard",
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
        href: "/master/categories",
      },
      { id: uniqueId(), title: "Brands", href: "/master/brands" },
      { id: uniqueId(), title: "Sizes", href: "/master/sizes" },
      { id: uniqueId(), title: "Products", href: "/master/products" },
      {
        id: uniqueId(),
        title: "Stock Locations",
        href: "/master/stocks",
      },
    ],
  },
  {
    id: uniqueId(),
    title: "Inventory",
    icon: IconPackage,
    children: [
      { id: uniqueId(), title: "Stock Overview", href: "/inventory" },
      { id: uniqueId(), title: "Adjustments", href: "/inventory/adjustments" },
      { id: uniqueId(), title: "Suppliers", href: "/inventory/suppliers" },
      {
        id: uniqueId(),
        title: "Purchase Orders",
        href: "/inventory/purchase-orders",
      },
      { id: uniqueId(), title: "Goods Received", href: "/inventory/grn" },
    ],
  },
  {
    id: uniqueId(),
    title: "Orders",
    icon: IconShoppingCart,
    href: "/orders",
  },
  {
    id: uniqueId(),
    title: "Users",
    icon: IconUsers,
    href: "/users",
  },
  {
    id: uniqueId(),
    title: "Finance",
    icon: IconCash,
    children: [
      { id: uniqueId(), title: "Dashboard", href: "/finance" },
      { id: uniqueId(), title: "Petty Cash", href: "/finance/petty-cash" },
      {
        id: uniqueId(),
        title: "Expense Categories",
        href: "/finance/expense-categories",
      },
      {
        id: uniqueId(),
        title: "Bank Accounts",
        href: "/finance/bank-accounts",
      },
      {
        id: uniqueId(),
        title: "Supplier Invoices",
        href: "/finance/supplier-invoices",
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
        href: "/campaign/promotions",
      },
      {
        id: uniqueId(),
        title: "Coupons",
        href: "/campaign/coupons",
      },
      {
        id: uniqueId(),
        title: "Combos",
        href: "/campaign/combos",
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
    href: "/website",
  },
  {
    subHeader: "Reports",
    navLabel: true,
  },
  {
    id: uniqueId(),
    title: "Analytics",
    icon: IconChartPie,
    href: "/reports",
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
      { id: uniqueId(), title: "ERP Settings", href: "/settings" },
      { id: uniqueId(), title: "Shipping Rates", href: "/settings/shipping" },
      { id: uniqueId(), title: "Tax Settings", href: "/settings/tax" },
    ],
  },
];

export default Menuitems;
