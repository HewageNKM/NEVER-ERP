import { IoIosApps } from "react-icons/io";
import {
  IconShoppingCart,
  IconReportMoney,
  IconUsersGroup,
  IconUser,
  IconLayoutDashboard,
  IconList,
  IconFileInvoice,
  IconSettings,
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
    icon: IoIosApps,
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
    icon: IconList,
    href: "/inventory",
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
    icon: IconUsersGroup,
    href: "/users",
  },
  {
    id: uniqueId(),
    title: "Petty Cash",
    icon: IconFileInvoice,
    href: "/petty-cash",
  },
  {
    subHeader: "Reports",
    navLabel: true,
  },
  {
    id: uniqueId(),
    title: "Reports & Analytics",
    icon: IconReportMoney,
    href: "/reports",
  },
  {
    subHeader: "Seetings",
    navLabel: true,
  },
  {
    id: uniqueId(),
    title: "Setting",
    icon: IconSettings,
    href: "/settings",
  },
];

export default Menuitems;
