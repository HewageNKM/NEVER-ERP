"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
} from "@mui/material";
import { IconX, IconPlus, IconCash } from "@tabler/icons-react";
import toast from "react-hot-toast";
import { auth } from "@/firebase/firebaseClient";

interface POSPettyCashDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function POSPettyCashDialog({
  open,
  onClose,
}: POSPettyCashDialogProps) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);

  // Form state
  const [type, setType] = useState<"IN" | "OUT">("OUT");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (open) {
      fetchTransactions();
    }
  }, [open]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;

      const res = await fetch("/api/pos/petty-cash?limit=10", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setTransactions(data.dataList || []);
    } catch (error) {
      console.error("Failed to fetch petty cash:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (!description.trim()) {
      toast.error("Please enter a description");
      return;
    }

    setAdding(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("Unauthorized");

      const res = await fetch("/api/pos/petty-cash", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type,
          amount: amountNum,
          description,
        }),
      });

      if (!res.ok) throw new Error("Failed to add transaction");

      toast.success("Transaction added");
      setAmount("");
      setDescription("");
      setType("OUT");
      fetchTransactions();
    } catch (error) {
      toast.error("Failed to add transaction");
    } finally {
      setAdding(false);
    }
  };

  const handleClose = () => {
    setAmount("");
    setDescription("");
    setType("OUT");
    onClose();
  };

  // Calculate balance
  const balance = transactions.reduce((acc, t) => {
    return t.type === "IN" ? acc + t.amount : acc - t.amount;
  }, 0);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
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
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <IconCash size={24} />
          <Typography
            variant="h6"
            fontWeight={800}
            sx={{ textTransform: "uppercase" }}
          >
            Petty Cash
          </Typography>
        </Box>
        <IconButton
          onClick={handleClose}
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

      <DialogContent sx={{ p: 3 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {/* Balance */}
          <Box
            sx={{
              p: 2,
              bgcolor: "grey.50",
              border: "2px solid",
              borderColor: balance >= 0 ? "success.main" : "error.main",
              borderRadius: 0,
              textAlign: "center",
            }}
          >
            <Typography
              variant="caption"
              color="text.secondary"
              fontWeight={700}
              sx={{ textTransform: "uppercase" }}
            >
              Current Balance
            </Typography>
            <Typography
              variant="h4"
              fontWeight={900}
              color={balance >= 0 ? "success.main" : "error.main"}
            >
              Rs. {balance.toLocaleString()}
            </Typography>
          </Box>

          {/* Add Transaction Form */}
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              gap: 2,
              alignItems: "flex-end",
            }}
          >
            <FormControl size="small" sx={{ minWidth: 100 }}>
              <InputLabel sx={{ "&.Mui-focused": { color: "black" } }}>
                Type
              </InputLabel>
              <Select
                value={type}
                label="Type"
                onChange={(e) => setType(e.target.value as "IN" | "OUT")}
                sx={{
                  borderRadius: 0,
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: "black",
                  },
                }}
              >
                <MenuItem value="IN">Cash In</MenuItem>
                <MenuItem value="OUT">Cash Out</MenuItem>
              </Select>
            </FormControl>

            <TextField
              size="small"
              label="Amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              sx={{
                width: 120,
                "& .MuiOutlinedInput-root": {
                  borderRadius: 0,
                  "&.Mui-focused fieldset": { borderColor: "black" },
                },
                "& .MuiInputLabel-root.Mui-focused": { color: "black" },
              }}
            />

            <TextField
              size="small"
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              sx={{
                flex: 1,
                "& .MuiOutlinedInput-root": {
                  borderRadius: 0,
                  "&.Mui-focused fieldset": { borderColor: "black" },
                },
                "& .MuiInputLabel-root.Mui-focused": { color: "black" },
              }}
            />

            <Button
              variant="contained"
              startIcon={<IconPlus size={18} />}
              onClick={handleAdd}
              disabled={adding}
              sx={{
                height: 40,
                bgcolor: "black",
                color: "white",
                borderRadius: 0,
                fontWeight: 700,
                "&:hover": { bgcolor: "grey.900" },
              }}
            >
              {adding ? (
                <CircularProgress size={20} sx={{ color: "white" }} />
              ) : (
                "ADD"
              )}
            </Button>
          </Box>

          {/* Transactions List */}
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress sx={{ color: "black" }} />
            </Box>
          ) : transactions.length === 0 ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <Typography
                color="text.secondary"
                fontWeight={600}
                sx={{ textTransform: "uppercase" }}
              >
                No transactions yet
              </Typography>
            </Box>
          ) : (
            <TableContainer
              component={Paper}
              elevation={0}
              sx={{
                border: "2px solid",
                borderColor: "grey.200",
                borderRadius: 0,
              }}
            >
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: "grey.50" }}>
                    <TableCell
                      sx={{ fontWeight: 700, textTransform: "uppercase" }}
                    >
                      Type
                    </TableCell>
                    <TableCell
                      sx={{ fontWeight: 700, textTransform: "uppercase" }}
                    >
                      Description
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{ fontWeight: 700, textTransform: "uppercase" }}
                    >
                      Amount
                    </TableCell>
                    <TableCell
                      sx={{ fontWeight: 700, textTransform: "uppercase" }}
                    >
                      Date
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {transactions.map((t, index) => (
                    <TableRow
                      key={t.id || index}
                      sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                    >
                      <TableCell>
                        <Chip
                          label={t.type}
                          size="small"
                          sx={{
                            fontSize: "0.7rem",
                            borderRadius: 0,
                            fontWeight: 700,
                            bgcolor:
                              t.type === "IN" ? "success.light" : "error.light",
                            color:
                              t.type === "IN" ? "success.dark" : "error.dark",
                          }}
                        />
                      </TableCell>
                      <TableCell>{t.description}</TableCell>
                      <TableCell
                        align="right"
                        sx={{
                          color:
                            t.type === "IN" ? "success.main" : "error.main",
                          fontWeight: 700,
                        }}
                      >
                        {t.type === "IN" ? "+" : "-"}Rs.{" "}
                        {t.amount?.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {new Date(t.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </DialogContent>

      <DialogActions
        sx={{ p: 3, borderTop: "2px solid", borderColor: "grey.100" }}
      >
        <Button
          onClick={handleClose}
          variant="outlined"
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
