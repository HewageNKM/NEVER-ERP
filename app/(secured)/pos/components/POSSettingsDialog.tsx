"use client";

import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from "@mui/material";
import {
  IconX,
  IconLogout,
  IconBuilding,
  IconUser,
  IconRefresh,
} from "@tabler/icons-react";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import {
  setShowStockDialog,
  fetchPosCart,
  fetchPosProducts,
} from "@/lib/posSlice/posSlice";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { logoutUserAction } from "@/actions/authActions";

interface POSSettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function POSSettingsDialog({
  open,
  onClose,
}: POSSettingsDialogProps) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { selectedStockId, stocks } = useAppSelector((state) => state.pos);
  const currentUser = useAppSelector((state) => state.authSlice.currentUser);

  const currentStock = stocks.find((s) => s.id === selectedStockId);

  const handleChangeStock = () => {
    dispatch(setShowStockDialog(true));
    onClose();
  };

  const handleRefreshData = () => {
    if (selectedStockId) {
      dispatch(fetchPosCart());
      dispatch(fetchPosProducts(selectedStockId));
      toast.success("Data refreshed");
    }
    onClose();
  };

  const handleLogout = async () => {
    try {
      await logoutUserAction();
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("neverbePOSStockId");
        window.localStorage.removeItem("posInvoiceId");
        window.localStorage.removeItem("nvrUser");
      }
      router.replace("/");
      toast.success("Logged out successfully");
    } catch (error) {
      toast.error("Failed to logout");
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{ sx: { borderRadius: 0, border: "2px solid black" } }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "2px solid",
          borderColor: "grey.200",
        }}
      >
        <Typography
          variant="h6"
          fontWeight={800}
          sx={{ textTransform: "uppercase" }}
        >
          POS Settings
        </Typography>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            color: "black",
            borderRadius: 0,
            "&:hover": { bgcolor: "black", color: "white" },
          }}
        >
          <IconX size={20} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <List sx={{ pt: 0 }}>
          {/* Current User */}
          <ListItem sx={{ py: 2 }}>
            <ListItemIcon>
              <IconUser size={20} color="black" />
            </ListItemIcon>
            <ListItemText
              primaryTypographyProps={{
                fontWeight: 700,
                textTransform: "uppercase",
                fontSize: "0.75rem",
                color: "grey.500",
              }}
              secondaryTypographyProps={{
                fontWeight: 600,
                color: "black",
                fontSize: "0.9rem",
              }}
              primary="Logged in as"
              secondary={currentUser?.email || "Unknown"}
            />
          </ListItem>

          <Divider sx={{ borderColor: "grey.200" }} />

          {/* Current Stock */}
          <ListItem sx={{ py: 2 }}>
            <ListItemIcon>
              <IconBuilding size={20} color="black" />
            </ListItemIcon>
            <ListItemText
              primaryTypographyProps={{
                fontWeight: 700,
                textTransform: "uppercase",
                fontSize: "0.75rem",
                color: "grey.500",
              }}
              secondaryTypographyProps={{
                fontWeight: 600,
                color: "black",
                fontSize: "0.9rem",
                textTransform: "uppercase",
              }}
              primary="Current Stock"
              secondary={
                currentStock?.label || currentStock?.name || "Not selected"
              }
            />
          </ListItem>

          <Divider sx={{ borderBottomWidth: 2, borderColor: "grey.200" }} />

          {/* Actions */}
          <ListItem
            component="div"
            onClick={handleChangeStock}
            sx={{
              cursor: "pointer",
              py: 2,
              transition: "all 0.2s",
              "&:hover": { bgcolor: "grey.50" },
            }}
          >
            <ListItemIcon>
              <IconBuilding size={20} color="black" />
            </ListItemIcon>
            <ListItemText
              primary="CHANGE STOCK LOCATION"
              primaryTypographyProps={{ fontWeight: 700, fontSize: "0.9rem" }}
            />
          </ListItem>

          <Divider sx={{ borderColor: "grey.200" }} />

          <ListItem
            component="div"
            onClick={handleRefreshData}
            sx={{
              cursor: "pointer",
              py: 2,
              transition: "all 0.2s",
              "&:hover": { bgcolor: "grey.50" },
            }}
          >
            <ListItemIcon>
              <IconRefresh size={20} color="black" />
            </ListItemIcon>
            <ListItemText
              primary="REFRESH DATA"
              primaryTypographyProps={{ fontWeight: 700, fontSize: "0.9rem" }}
            />
          </ListItem>

          <Divider sx={{ borderColor: "grey.200" }} />

          <ListItem
            component="div"
            onClick={handleLogout}
            sx={{
              cursor: "pointer",
              py: 2,
              transition: "all 0.2s",
              "&:hover": { bgcolor: "error.light", color: "error.dark" },
              color: "error.main",
            }}
          >
            <ListItemIcon>
              <IconLogout size={20} color="inherit" />
            </ListItemIcon>
            <ListItemText
              primary="LOGOUT"
              primaryTypographyProps={{ fontWeight: 700, fontSize: "0.9rem" }}
            />
          </ListItem>
        </List>
      </DialogContent>

      <DialogActions
        sx={{ p: 3, borderTop: "2px solid", borderColor: "grey.100" }}
      >
        <Button
          onClick={onClose}
          variant="outlined"
          fullWidth
          sx={{
            color: "black",
            borderColor: "grey.300",
            borderRadius: 0,
            fontWeight: 700,
            "&:hover": { borderColor: "black", bgcolor: "white" },
          }}
        >
          CLOSE
        </Button>
      </DialogActions>
    </Dialog>
  );
}
