"use client";

import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  Paper,
  IconButton,
  Chip,
  Box,
  CircularProgress,
  Typography,
} from "@mui/material";
import { IconEdit, IconTrash } from "@tabler/icons-react";
import { Stock } from "@/model/Stock";

interface LocationListTableProps {
  locations: Stock[];
  loading: boolean;
  onEdit: (location: Stock) => void;
  onDelete: (id: string) => void;
}

const StockListTable: React.FC<LocationListTableProps> = ({
  locations,
  loading,
  onEdit,
  onDelete,
}) => {
  if (loading) {
    return (
      <Box textAlign="center" py={4}>
        {" "}
        <CircularProgress />{" "}
      </Box>
    );
  }

  if (!locations || locations.length === 0) {
    return (
      <Typography textAlign="center" color="text.secondary" py={4}>
        No stock locations found. Add one to get started.
      </Typography>
    );
  }

  return (
    <TableContainer component={Paper} sx={{ mt: 2 }} variant="outlined">
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Stock ID</TableCell>
            <TableCell>Name</TableCell>
            <TableCell>Address</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {locations.map((loc) => (
            <TableRow key={loc.id}>
              <TableCell>{loc.id.toUpperCase()}</TableCell>
              <TableCell>{loc.name}</TableCell>
              <TableCell>{loc.address || "-"}</TableCell>{" "}
              {/* Display address or dash */}
              <TableCell>
                <Chip
                  label={loc.status ? "Active" : "Inactive"}
                  color={loc.status ? "success" : "error"}
                  size="small"
                />
              </TableCell>
              <TableCell align="right">
                <IconButton
                  onClick={() => onEdit(loc)}
                  color="primary"
                  size="small"
                >
                  <IconEdit />
                </IconButton>
                <IconButton
                  onClick={() => onDelete(loc.id!)}
                  color="error"
                  size="small"
                >
                  <IconTrash />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default StockListTable;
