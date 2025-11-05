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
        href: "/dashboard/master/categories",
      },

      { id: uniqueId(), title: "Brands", href: "/dashboard/master/brands" },
      { id: uniqueId(), title: "Sizes", href: "/dashboard/master/sizes" },
      { id: uniqueId(), title: "Products", href: "/dashboard/master/products" },
      {
        id: uniqueId(),
        title: "Stock Locations",
        href: "/dashboard/master/stocks",
      },
    ],
  },
  {
    id: uniqueId(),
    title: "Inventory",
    icon: IconList,
    href: "/dashboard/inventory",
  },
  {
    id: uniqueId(),
    title: "Orders",
    icon: IconShoppingCart,
    href: "/dashboard/orders",
  },
  {
    id: uniqueId(),
    title: "Users",
    icon: IconUsersGroup,
    href: "/dashboard/users",
  },
  {
    subHeader: "Reports",
    navLabel: true,
  },
  {
    id: uniqueId(),
    title: "Reports & Analytics",
    icon: IconFileInvoice,
    href: "/dashboard/reports",
  },
    {
    subHeader: "Seetings",
    navLabel: true,
  },
  {
    id: uniqueId(),
    title: "Setting",
    icon: IconSettings,
    href: "/dashboard/settings",
  }
];

export default Menuitems;
