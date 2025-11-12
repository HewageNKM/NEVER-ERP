import React from "react";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import { Stack, Typography } from "@mui/material";
import { ExpensesReport } from "@/model";

const ExpenseReport = ({
                           setShow,
                           expenseReport,
                           show,
                           date,
                       }: {
    setShow: () => void;
    expenseReport: ExpensesReport[];
    show: boolean;
    date: () => string;
}) => {
    return (
        <Dialog open={show} fullWidth>
            <DialogContent>
                <Stack spacing={2}>
                    <Typography
                        variant="h4"
                        align="center"
                        gutterBottom
                    >
                        Expense Report
                    </Typography>
                    <Typography
                        variant="h6"
                        align="center"
                        gutterBottom
                    >
                        Date: {date()}
                    </Typography>
                </Stack>
                {expenseReport?.length === 0 ? (
                    <Typography
                        variant="body1"
                        align="center"
                        sx={{ mt: 4 }}
                    >
                        No expenses available for the selected date range.
                    </Typography>
                ) : (
                    expenseReport?.map((report) => (
                        <Stack key={report.type} spacing={2} sx={{ mb: 4 }}>
                            <Typography
                                variant="h6"
                                sx={{ textTransform: "capitalize", color: "#3f51b5" }}
                            >
                                {report.type}
                            </Typography>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: "bold" }}>Category</TableCell>
                                        <TableCell sx={{ fontWeight: "bold" }}>Total Amount</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {report.data.length > 0 ? (
                                        <>
                                            {report.data.map((item) => (
                                                <TableRow key={item.for}>
                                                    <TableCell sx={{ textTransform: "capitalize" }}>
                                                        {item.for}
                                                    </TableCell>
                                                    <TableCell>{item.amount.toFixed(2)}</TableCell>
                                                </TableRow>
                                            ))}
                                            <TableRow>
                                                <TableCell
                                                    align="right"
                                                    sx={{
                                                        fontWeight: "bold",
                                                        fontSize: "1.1rem",
                                                    }}
                                                >
                                                    Total:
                                                </TableCell>
                                                <TableCell
                                                    sx={{
                                                        fontWeight: "bold",
                                                        fontSize: "1.1rem",
                                                    }}
                                                >
                                                    {report.data
                                                        .reduce((total, item) => total + item.amount, 0)
                                                        .toFixed(2)}
                                                </TableCell>
                                            </TableRow>
                                        </>
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={2} align="center">
                                                No data available.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </Stack>
                    ))
                )}
            </DialogContent>
            <DialogActions>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={setShow}
                    sx={{ fontWeight: "bold", fontSize: "1.1rem" }}
                >
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ExpenseReport;
