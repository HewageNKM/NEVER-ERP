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
  IconShield,
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
    permission: "view_dashboard",
  },
  {
    subHeader: "Management",
    navLabel: true,
  },
  {
    id: uniqueId(),
    title: "Master Data",
    icon: IconApps,
    permission: "view_master_data",
    children: [
      { id: uniqueId(), title: "Categories", href: "/erp/master/categories" },
      { id: uniqueId(), title: "Brands", href: "/erp/master/brands" },
      { id: uniqueId(), title: "Sizes", href: "/erp/master/sizes" },
      { id: uniqueId(), title: "Products", href: "/erp/master/products" },
      { id: uniqueId(), title: "Stock Locations", href: "/erp/master/stocks" },
    ],
  },
  {
    id: uniqueId(),
    title: "Inventory",
    icon: IconPackage,
    permission: "view_inventory",
    children: [
      {
        id: uniqueId(),
        title: "Stock Overview",
        href: "/erp/inventory",
        permission: "view_inventory",
      },
      {
        id: uniqueId(),
        title: "Adjustments",
        href: "/erp/inventory/adjustments",
        permission: "view_adjustments",
      },
      {
        id: uniqueId(),
        title: "Suppliers",
        href: "/erp/inventory/suppliers",
        permission: "view_suppliers",
      },
      {
        id: uniqueId(),
        title: "Purchase Orders",
        href: "/erp/inventory/purchase-orders",
        permission: "view_purchase_orders",
      },
      {
        id: uniqueId(),
        title: "Goods Received",
        href: "/erp/inventory/grn",
        permission: "view_grn",
      },
    ],
  },
  {
    id: uniqueId(),
    title: "Orders",
    icon: IconShoppingCart,
    href: "/erp/orders",
    permission: "view_orders",
  },
  {
    id: uniqueId(),
    title: "Finance",
    icon: IconCash,
    permission: "view_finance",
    children: [
      {
        id: uniqueId(),
        title: "Dashboard",
        href: "/erp/finance",
        permission: "view_finance",
      },
      {
        id: uniqueId(),
        title: "Petty Cash",
        href: "/erp/finance/petty-cash",
        permission: "view_petty_cash",
      },
      {
        id: uniqueId(),
        title: "Expense Categories",
        href: "/erp/finance/expense-categories",
        permission: "view_expense_categories",
      },
      {
        id: uniqueId(),
        title: "Bank Accounts",
        href: "/erp/finance/bank-accounts",
        permission: "view_bank_accounts",
      },
      {
        id: uniqueId(),
        title: "Supplier Invoices",
        href: "/erp/finance/supplier-invoices",
        permission: "view_supplier_invoices",
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
    permission: "view_promotions",
    children: [
      {
        id: uniqueId(),
        title: "Promotions",
        href: "/erp/campaign/promotions",
        permission: "view_promotions",
      },
      {
        id: uniqueId(),
        title: "Coupons",
        href: "/erp/campaign/coupons",
        permission: "view_coupons",
      },
      {
        id: uniqueId(),
        title: "Combos",
        href: "/erp/campaign/combos",
        permission: "view_combos",
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
    permission: "view_website",
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
    permission: "view_reports",
  },
  {
    subHeader: "System",
    navLabel: true,
  },
  {
    id: uniqueId(),
    title: "Users",
    icon: IconUsers,
    href: "/erp/users",
    permission: "view_users",
  },
  {
    id: uniqueId(),
    title: "Roles",
    icon: IconShield,
    href: "/erp/roles",
    permission: "manage_roles",
  },
  {
    id: uniqueId(),
    title: "Settings",
    icon: IconSettings,
    permission: "view_settings",
    children: [
      {
        id: uniqueId(),
        title: "ERP Settings",
        href: "/erp/settings",
        permission: "view_settings",
      },
      {
        id: uniqueId(),
        title: "Shipping Rates",
        href: "/erp/settings/shipping",
        permission: "view_shipping",
      },
      {
        id: uniqueId(),
        title: "Payment Methods",
        href: "/erp/settings/payment-methods",
        permission: "view_payment_methods",
      },
      {
        id: uniqueId(),
        title: "Tax Settings",
        href: "/erp/settings/tax",
        permission: "view_tax_settings",
      },
    ],
  },
];

export default Menuitems;
