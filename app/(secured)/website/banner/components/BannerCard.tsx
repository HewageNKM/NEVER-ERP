"use client";
import React from "react";
import Image from "next/image";
import {Card, CardMedia, IconButton} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import {useSnackbar} from "@/contexts/SnackBarContext";
import {useConfirmationDialog} from "@/contexts/ConfirmationDialogContext";
import {useAppDispatch} from "@/lib/hooks";
import {deleteBannerAction} from "@/actions/settingActions";
import {getBanners} from "@/lib/bannersSlice/bannersSlice";

const BannerCard = ({banner}: { banner: { fileName: string; url: string, id: string } }) => {
    const {showNotification} = useSnackbar();
    const {showConfirmation} = useConfirmationDialog();
    const dispatch = useAppDispatch();

    const onDelete = () => {
        showConfirmation({
            title: "Delete Banner",
            message: "Are you sure you want to delete this banner?",
            onSuccess: async () => {
                try {
                    await deleteBannerAction(banner.id);
                    showNotification("Banner deleted successfully", "success");
                    dispatch(getBanners());
                } catch (e: any) {
                    showNotification(e.message, "error");
                    console.error(e);
                }
            },
        });
    };

    return (
        <Card sx={{width: 300, position: "relative", borderRadius: 2, overflow: "hidden"}}>
            {/* Image */}
            <CardMedia sx={{height: 157, width: "100%"}}>
                <Image
                    src={banner.url}
                    alt="Banner"
                    width={1200}
                    height={628}
                    layout="responsive"
                    objectFit="cover"
                    onError={(e) => console.error("Image failed to load", e)}
                />
            </CardMedia>

            {/* Delete Button */}
            <IconButton
                onClick={onDelete}
                sx={{
                    position: "absolute",
                    top: 5,
                    right: 5,
                    backgroundColor: "rgba(0, 0, 0, 0.6)",
                    color: "white",
                    "&:hover": {backgroundColor: "rgba(255, 0, 0, 0.8)"},
                }}
            >
                <DeleteIcon/>
            </IconButton>
        </Card>
    );
};

export default BannerCard;
