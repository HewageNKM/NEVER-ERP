"use client";
import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  IconButton,
  Pagination,
} from "@mui/material";
import { IconEye, IconPlus, IconTrash } from "@tabler/icons-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PettyCash } from "@/model/PettyCash"; // Import your model

export default function PettyCashList() {
  const [pettyCashList, setPettyCashList] = useState<PettyCash[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const router = useRouter();

  useEffect(() => {
    fetchPettyCash();
  }, [page]);

  const fetchPettyCash = async () => {
    try {
      const res = await fetch(`/api/v2/petty-cash?page=${page}&size=10`);
      const data = await res.json();
      setPettyCashList(data.data);
      setTotalPages(Math.ceil(data.total / 10)); // Assuming 'total' is total count
    } catch (error) {
      console.error("Failed to fetch petty cash list", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this entry?")) {
      try {
        await fetch(`/api/v2/petty-cash/${id}`, { method: "DELETE" });
        fetchPettyCash(); // Refresh list
      } catch (error) {
        console.error("Failed to delete entry", error);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "success";
      case "PENDING":
        return "warning";
      case "REJECTED":
        return "error";
      default:
        return "default";
    }
  };

  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h3">Petty Cash</Typography>
        <Button
          component={Link}
          href="/dashboard/petty-cash/create"
          variant="contained"
          color="primary"
          startIcon={<IconPlus />}
        >
          Create New
        </Button>
      </Box>

      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Amount</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>For</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pettyCashList.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{entry.amount}</TableCell>
                    <TableCell>{entry.category}</TableCell>
                    <TableCell>{entry.for}</TableCell>
                    <TableCell>
                      <Chip
                        label={entry.status}
                        color={getStatusColor(entry.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(entry.createdAt as string).toLocaleDateString()}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        component={Link}
                        href={`/dashboard/petty-cash/${entry.id}`}
                        color="primary"
                      >
                        <IconEye size={20} />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => handleDelete(entry.id)}
                      >
                        <IconTrash size={20} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {pettyCashList.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      No entries found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <Box mt={2} display="flex" justifyContent="center">
            <Pagination
              count={totalPages}
              page={page}
              onChange={(e, v) => setPage(v)}
              color="primary"
            />
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
