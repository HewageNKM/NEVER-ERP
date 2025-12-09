"use client";
import React, { useState, useEffect } from "react";
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
import { useRouter, useParams } from "next/navigation";
import { PettyCash } from "@/model/PettyCash";

export default function EditPettyCash() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [formData, setFormData] = useState<Partial<PettyCash>>({});
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (id) {
      fetchEntry();
    }
  }, [id]);

  const fetchEntry = async () => {
    try {
      const res = await fetch(`/api/v2/petty-cash/${id}`);
      if (!res.ok) throw new Error("Failed to fetch entry");
      const data = await res.json();
      setFormData(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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
    setSaving(true);
    setError("");

    try {
      const formPayload = new FormData();
      Object.keys(formData).forEach((key) => {
        if (
          key !== "attachment" &&
          key !== "createdAt" &&
          key !== "updatedAt" &&
          key !== "reviewedAt"
        )
          formPayload.append(key, (formData as any)[key]);
      });
      if (file) {
        formPayload.append("attachment", file);
      }

      const res = await fetch(`/api/v2/petty-cash/${id}`, {
        method: "PUT",
        body: formPayload,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to update entry");
      }

      router.push("/dashboard/petty-cash");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Typography>Loading...</Typography>;

  return (
    <Box>
      <Typography variant="h3" mb={3}>
        Edit Petty Cash Entry
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
                  value={formData.subCategory || ""}
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
                  value={formData.note || ""}
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
                <TextField
                  fullWidth
                  select
                  label="Status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <MenuItem value="PENDING">Pending</MenuItem>
                  <MenuItem value="APPROVED">Approved</MenuItem>
                  <MenuItem value="REJECTED">Rejected</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" mb={1}>
                  Attachment
                </Typography>
                {formData.attachment && (
                  <Box mb={1}>
                    <a
                      href={formData.attachment}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View Current Attachment
                    </a>
                  </Box>
                )}
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
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save Changes"}
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
