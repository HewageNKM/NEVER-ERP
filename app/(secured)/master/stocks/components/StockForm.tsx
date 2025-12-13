"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Button,
  CircularProgress,
  Switch,
  FormControlLabel,
} from "@mui/material";
import { StockLocation } from "@/model/StockLocation"; // Adjust path

interface LocationFormModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (locationData: Omit<StockLocation, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>; // Make async for loading state
  location: StockLocation | null; // Null for create, object for edit
}

const emptyLocation: Omit<StockLocation, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted'> = {
  name: "",
  address: "",
  status: true, // Default to active
};

const StockFormModal: React.FC<LocationFormModalProps> = ({
  open,
  onClose,
  onSave,
  location,
}) => {
  const [formData, setFormData] = useState(emptyLocation);
  const [saving, setSaving] = useState(false);
  const isEditing = !!location;

  useEffect(() => {
    if (open) {
      if (location) {
        setFormData({
          name: location.name,
          address: location.address || "",
          status: location.status,
        });
      } else {
        setFormData(emptyLocation);
      }
      setSaving(false);
    }
  }, [location, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' || type === 'switch' ? checked : value,
    }));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      // Add more specific validation/feedback if needed
      alert("Location name is required.");
      return;
    }
    setSaving(true);
    try {
      await onSave(formData); // Await the save operation
      // Success is handled by the parent (closing modal, showing notification)
    } catch (error) {
      // Error is handled by the parent (showing notification)
      console.error("Save failed in modal");
    } finally {
      setSaving(false);
      // Don't close modal here, let parent handle it on success
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{isEditing ? "Edit Stock Location" : "Add Stock Location"}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <TextField
              name="name"
              label="Location Name"
              value={formData.name}
              onChange={handleChange}
              fullWidth
              required
              disabled={saving}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              name="address"
              label="Address (Optional)"
              value={formData.address}
              onChange={handleChange}
              fullWidth
              multiline
              rows={3}
              disabled={saving}
            />
          </Grid>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  name="status"
                  checked={formData.status}
                  onChange={handleChange}
                  disabled={saving}
                />
              }
              label="Active Status"
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit" disabled={saving}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={saving}>
          {saving ? <CircularProgress size={24} color="inherit" /> : "Save Location"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default StockFormModal;