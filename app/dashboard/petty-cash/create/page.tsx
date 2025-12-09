"use client";
import React, { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  Typography,
  MenuItem,
  Stack,
  Alert,
} from "@mui/material";
import { useRouter } from "next/navigation";

export default function CreatePettyCash() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    amount: "",
    category: "",
    subCategory: "",
    for: "",
    note: "",
    paymentMethod: "cash",
    type: "expense",
    status: "PENDING",
  });
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const formPayload = new FormData();
      Object.keys(formData).forEach((key) => {
        formPayload.append(key, (formData as any)[key]);
      });
      if (file) {
        formPayload.append("attachment", file);
      }

      const res = await fetch("/api/v2/petty-cash", {
        method: "POST",
        body: formPayload,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to create entry");
      }

      router.push("/dashboard/petty-cash");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h3" mb={3}>
        Create Petty Cash Entry
      </Typography>
      <Card>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Amount"
                  name="amount"
                  type="number"
                  value={formData.amount}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  select
                  label="Type"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                >
                  <MenuItem value="expense">Expense</MenuItem>
                  <MenuItem value="income">Income</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Sub Category"
                  name="subCategory"
                  value={formData.subCategory}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="For (Description)"
                  name="for"
                  value={formData.for}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Note"
                  name="note"
                  multiline
                  rows={3}
                  value={formData.note}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  select
                  label="Payment Method"
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleChange}
                >
                  <MenuItem value="cash">Cash</MenuItem>
                  <MenuItem value="card">Card</MenuItem>
                  <MenuItem value="transfer">Transfer</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" mb={1}>
                  Attachment
                </Typography>
                <input type="file" onChange={handleFileChange} />
              </Grid>

              <Grid item xs={12}>
                {error && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                  </Alert>
                )}
                <Stack direction="row" spacing={2} justifyContent="flex-end">
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={() => router.back()}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={loading}
                  >
                    {loading ? "Creating..." : "Create"}
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
