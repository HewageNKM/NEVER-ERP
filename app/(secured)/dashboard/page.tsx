"use client";

import PageContainer from "../components/container/PageContainer";
// components
import SalesOverview from "../components/dashboard/SalesOverview";
import RecentTransactions from "../components/dashboard/RecentTransactions";
import DailyEarnings from "../components/dashboard/DailyEarnings";
import PopularItems from "../components/dashboard/PopularItems";

const Dashboard = () => {
  return (
    <PageContainer title="Dashboard" description="This is the Dashboard">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Sales Overview Section (8/12 width) */}
        <div className="md:col-span-8 flex flex-col gap-6">
          <SalesOverview />
          <PopularItems />
        </div>

        {/* Side Section (4/12 width) */}
        <div className="md:col-span-4 flex flex-col gap-6">
          <DailyEarnings />
          <RecentTransactions />
        </div>
      </div>
    </PageContainer>
  );
};

export const dynamic = "force-dynamic";
export default Dashboard;
