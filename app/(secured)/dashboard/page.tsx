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
      <div className="grid grid-cols-1 row-auto lg:grid-cols-3 xl:grid-cols-5 gap-6">
        <div className="lg:col-span-2 xl:col-span-3 flex flex-col gap-6">
          <div className="row-span-2">
            <SalesOverview />
          </div>
          <div className="row-span-2">
            <PopularItems />
          </div>
        </div>
        <div className="lg:col-span-1 xl:col-span-2 flex flex-col gap-6">
          <div className="row-span-2 ">
            <DailyEarnings />
          </div>
          <RecentTransactions />
        </div>
      </div>
    </PageContainer>
  );
};

export default Dashboard;
