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
import { EXPENSE_CATEGORIES } from "@/utils/expenseCategories";
import { useAppSelector } from "@/lib/hooks";
import { RootState } from "@/lib/store";
import { getToken } from "@/firebase/firebaseClient";
import { Breadcrumbs, Link as MuiLink } from "@mui/material";
import Link from "next/link";

export default function EditPettyCash() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [formData, setFormData] = useState<Partial<PettyCash>>({});
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const { currentUser } = useAppSelector((state: RootState) => state.authSlice);

  useEffect(() => {
    if (id && currentUser) {
      fetchEntry();
    }
  }, [id, currentUser]);

  const fetchEntry = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`/api/v2/petty-cash/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
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
      const token = await getToken();
      const res = await fetch(`/api/v2/petty-cash/${id}`, {
        method: "PUT",
        body: formPayload,
        headers: {
          Authorization: `Bearer ${token}`,
        },
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
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
        <MuiLink component={Link} href="/dashboard" color="inherit">
          Dashboard
        </MuiLink>
        <MuiLink component={Link} href="/dashboard/petty-cash" color="inherit">
          Petty Cash
        </MuiLink>
        <Typography color="text.primary">Edit</Typography>
      </Breadcrumbs>
      <Typography variant="h3" mb={3}>
        Edit Petty Cash Entry
      </Typography>
      <Card>
        <CardContent>
          <form onSubmit={handleSubmit}>
            {formData.status === "APPROVED" && (
              <Alert severity="info" sx={{ mb: 3 }}>
                This entry has been approved and cannot be edited.
              </Alert>
            )}
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
                  disabled={formData.status === "APPROVED"}
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
                  disabled={formData.status === "APPROVED"}
                >
                  <MenuItem value="expense">Expense</MenuItem>
                  <MenuItem value="income">Income</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  select
                  label="Category"
                  name="category"
                  value={formData.category || ""}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      category: e.target.value,
                      subCategory: "", // Reset subcategory
                    });
                  }}
                  required
                  disabled={formData.status === "APPROVED"}
                >
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <MenuItem key={cat.name} value={cat.name}>
                      {cat.name}
                    </MenuItem>
                  ))}
                  {/* Handle legacy/custom categories not in the list */}
                  {formData.category &&
                    !EXPENSE_CATEGORIES.some(
                      (c) => c.name === formData.category
                    ) && (
                      <MenuItem value={formData.category}>
                        {formData.category} (Legacy)
                      </MenuItem>
                    )}
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  select
                  label="Sub Category"
                  name="subCategory"
                  value={formData.subCategory || ""}
                  onChange={handleChange}
                  disabled={
                    !formData.category || formData.status === "APPROVED"
                  } // Disable if no category selected OR already approved
                >
                  {formData.category &&
                    EXPENSE_CATEGORIES.find(
                      (c) => c.name === formData.category
                    )?.subCategories.map((sub) => (
                      <MenuItem key={sub} value={sub}>
                        {sub}
                      </MenuItem>
                    ))}
                </TextField>
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
                  required
                  disabled={formData.status === "APPROVED"}
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
                  disabled={formData.status === "APPROVED"}
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
                  disabled={formData.status === "APPROVED"}
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
                <input
                  type="file"
                  onChange={handleFileChange}
                  disabled={formData.status === "APPROVED"}
                />
              </Grid>

              {/* Read-only Metadata */}
              {formData.createdAt && (
                <Grid item xs={12} md={6}>
                  <Typography
                    variant="caption"
                    display="block"
                    color="textSecondary"
                  >
                    Created At:{" "}
                    {new Date(formData.createdAt as string).toLocaleString()}
                  </Typography>
                </Grid>
              )}
              {formData.updatedAt && (
                <Grid item xs={12} md={6}>
                  <Typography
                    variant="caption"
                    display="block"
                    color="textSecondary"
                  >
                    Updated At:{" "}
                    {new Date(formData.updatedAt as string).toLocaleString()}
                  </Typography>
                </Grid>
              )}
              {formData.reviewedBy && (
                <Grid item xs={12} md={6}>
                  <Typography
                    variant="caption"
                    display="block"
                    color="textSecondary"
                  >
                    Reviewed By: {formData.reviewedBy}
                  </Typography>
                </Grid>
              )}
              {formData.reviewedAt && (
                <Grid item xs={12} md={6}>
                  <Typography
                    variant="caption"
                    display="block"
                    color="textSecondary"
                  >
                    Reviewed At:{" "}
                    {new Date(formData.reviewedAt as string).toLocaleString()}
                  </Typography>
                </Grid>
              )}

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
                    disabled={saving || formData.status === "APPROVED"}
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
