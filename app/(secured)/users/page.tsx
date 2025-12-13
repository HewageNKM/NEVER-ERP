'use client';
import {Paper, Stack} from '@mui/material';
import PageContainer from '../components/container/PageContainer';
import DashboardCard from '../components/shared/DashboardCard';
import {styled} from '@mui/material/styles';
import Header from "@/app/(secured)/users/components/Header";
import UserTable from "@/app/(secured)/users/components/UserTable";

const Shadow = () => {
    return (
        <PageContainer title="Users" description="Users Management">

            <DashboardCard title="Users">
                <Stack
                    sx={{
                        position: "relative",
                        padding: 1,
                        display: "flex",
                        flexDirection: "column",
                        gap: 3
                    }}
                >
                    <Header/>
                    <UserTable/>
                </Stack>
            </DashboardCard>
        </PageContainer>
    );
};

export default Shadow;
