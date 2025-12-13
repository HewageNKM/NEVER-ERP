import React, {useEffect} from 'react';
import {Stack} from "@mui/material";
import {useAppDispatch, useAppSelector} from "@/lib/hooks";
import ComponentsLoader from "@/app/components/ComponentsLoader";
import BannerCard from "@/app/(secured)/website/banner/components/BannerCard";
import {getBanners} from "@/lib/bannersSlice/bannersSlice";
import {useSnackbar} from "@/contexts/SnackBarContext";
import EmptyState from "@/app/components/EmptyState";

const Header = () => {
    const {banners, isLoading} = useAppSelector(state => state.bannersSlice);
    const {currentUser} = useAppSelector(state => state.authSlice);
    const dispatch = useAppDispatch();
    const {showNotification} = useSnackbar();

    useEffect(() => {
        if (currentUser) {
            fetchBanners()
        }
    }, [currentUser]);

    const fetchBanners = () => {
        try {
            dispatch(getBanners());
        } catch (e) {
            showNotification(e.message, "error");
            console.error(e);
        }
    }
    return (
        <Stack
            sx={{
                position: "relative",
                width: "100%",
                display: "flex",
                justifyContent: "flex-start",
                alignItems: "flex-start",
                flexDirection: "column",
                gap: 3,
            }}
        >
            <Stack
                sx={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "flex-start",
                    alignItems: "flex-start",
                    flexDirection: "row",
                    gap: 3,
                    flexWrap: "wrap",
                }}
            >
                {
                    banners.map((banner: { file: string, url: string }) => (
                        <BannerCard key={banner.file} banner={banner}/>
                    ))
                }
            </Stack>
            {(!isLoading && banners.length == 0) && (
                <EmptyState
                    title={"No Banners Found"}
                    subtitle={"No Banners found in the database"}
                />
            )}
            {isLoading && (
                <ComponentsLoader
                    title={"Loading Banners"}
                    position={"absolute"}
                />
            )}
        </Stack>
    );
};

export default Header;