"use client";

import React, { useEffect, useState } from "react";
import PageContainer from "../components/container/PageContainer";
import DashboardCard from "../components/shared/DashboardCard";
import {
  Box,
  CircularProgress,
  Switch,
  FormControlLabel,
  Button,
  Grid,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
} from "@mui/material";
import { useSnackbar } from "@/contexts/SnackBarContext";
import { useAppSelector } from "@/lib/hooks";
import { getToken } from "@/firebase/firebaseClient";

interface Stock {
  id: string;
  label: string;
}

interface Settings {
  defaultStockId: string;
  onlineStockId: string;
  ecommerce: {
    enable: boolean;
  };
  pos: {
    enable: boolean;
  };
  [key: string]: any;
}

const SettingPage = () => {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const { currentUser } = useAppSelector((state) => state.authSlice);
  const { showNotification } = useSnackbar();

  // Fetch settings
  const fetchSettings = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const [settingsRes, stocksRes] = await Promise.all([
        fetch("/api/v2/settings/erp", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
        fetch("/api/v2/master/stocks/dropdown", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      ]);

      if (!settingsRes.ok) throw new Error("Failed to fetch settings");
      if (!stocksRes.ok) throw new Error("Failed to fetch stocks");

      const settingsData = await settingsRes.json();
      const stocksData = await stocksRes.json();

      setSettings(settingsData);
      setStocks(stocksData);
    } catch (err: any) {
      showNotification(err.message || "Failed to fetch settings", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) fetchSettings();
  }, [currentUser]);

  const handleChange = (key: string, value: any) => {
    setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const handleNestedChange = (section: string, key: string, value: any) => {
    setSettings((prev) =>
      prev ? { ...prev, [section]: { ...prev[section], [key]: value } } : prev
    );
  };

  const handleSave = async () => {
    if (!settings) return;
    try {
      setSaving(true);
      const token = await getToken();
      const res = await fetch("/api/v2/settings/erp", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error("Failed to save settings");
      showNotification("Settings saved successfully!", "success");
    } catch (err: any) {
      showNotification(err.message || "Failed to save", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <PageContainer title="Settings" description="Settings Management">
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress />
        </Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Settings" description="Settings Management">
      <DashboardCard title="ERP Settings">
        <Box mt={2}>
          <Grid container spacing={2}>
            {/* Default Stock */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Default Stock</InputLabel>
                <Select
                  value={settings?.defaultStockId || ""}
                  label="Default Stock"
                  onChange={(e) =>
                    handleChange("defaultStockId", e.target.value)
                  }
                >
                  {stocks.map((stock) => (
                    <MenuItem key={stock.id} value={stock.id}>
                      {stock.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Online Stock */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Online Stock</InputLabel>
                <Select
                  value={settings?.onlineStockId || ""}
                  label="Online Stock"
                  onChange={(e) =>
                    handleChange("onlineStockId", e.target.value)
                  }
                >
                  {stocks.map((stock) => (
                    <MenuItem key={stock.id} value={stock.id}>
                      {stock.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Website Enabled */}
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings?.ecommerce?.enable || false}
                    onChange={(e) =>
                      handleNestedChange(
                        "ecommerce",
                        "enable",
                        e.target.checked
                      )
                    }
                  />
                }
                label="Website Enabled"
              />
            </Grid>

            {/* POS Enabled */}
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings?.pos?.enable || false}
                    onChange={(e) =>
                      handleNestedChange("pos", "enable", e.target.checked)
                    }
                  />
                }
                label="POS Enabled"
              />
            </Grid>
          </Grid>

          {/* Save Button */}
          <Box mt={4}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Settings"}
            </Button>
          </Box>
        </Box>
      </DashboardCard>
    </PageContainer>
  );
};

export default SettingPage;
