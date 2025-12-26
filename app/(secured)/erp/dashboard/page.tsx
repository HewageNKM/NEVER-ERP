"use client";

import PageContainer from "../components/container/PageContainer";
// components
import SalesOverview from "../components/dashboard/SalesOverview";
import RecentTransactions from "../components/dashboard/RecentTransactions";
import DailyEarnings from "../components/dashboard/DailyEarnings";
import PopularItems from "../components/dashboard/PopularItems";
import LowStockAlerts from "../components/dashboard/LowStockAlerts";
import MonthlyComparison from "../components/dashboard/MonthlyComparison";
import OrderStatusDistribution from "../components/dashboard/OrderStatusDistribution";
import PendingOrdersCount from "../components/dashboard/PendingOrdersCount";
import WeeklyTrends from "../components/dashboard/WeeklyTrends";
import ExpenseSummary from "../components/dashboard/ExpenseSummary";
import ProfitMargins from "../components/dashboard/ProfitMargins";
import InventoryValue from "../components/dashboard/InventoryValue";
import RevenueByCategory from "../components/dashboard/RevenueByCategory";

const Dashboard = () => {
  return (
    <PageContainer title="Dashboard" description="This is the Dashboard">
      <div className="flex flex-col gap-6">
        {/* Row 1: Key Metrics - Daily + Pending + Monthly */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <div className="md:col-span-2">
            <DailyEarnings />
          </div>
          <div className="md:col-span-1">
            <PendingOrdersCount />
          </div>
          <div className="md:col-span-1">
            <MonthlyComparison />
          </div>
        </div>

        {/* Row 2: Charts - Sales + Order Status + Weekly */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <div className="md:col-span-2">
            <SalesOverview />
          </div>
          <div className="md:col-span-1">
            <OrderStatusDistribution />
          </div>
          <div className="md:col-span-1">
            <WeeklyTrends />
          </div>
        </div>

        {/* Row 3: Financial & Inventory - 4 equal cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          <div>
            <ProfitMargins />
          </div>
          <div>
            <ExpenseSummary />
          </div>
          <div>
            <InventoryValue />
          </div>
          <div>
            <LowStockAlerts />
          </div>
        </div>

        {/* Row 4: Category Revenue + Popular Items */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <RevenueByCategory />
          </div>
          <div>
            <PopularItems />
          </div>
        </div>

        {/* Row 5: Recent Activity - Full width */}
        <div>
          <RecentTransactions />
        </div>
      </div>
    </PageContainer>
  );
};

export default Dashboard;
