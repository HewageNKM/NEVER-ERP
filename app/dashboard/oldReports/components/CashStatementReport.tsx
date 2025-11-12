import React from 'react';
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import TableBody from "@mui/material/TableBody";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import { CashFlowReport } from "@/model";
import { Stack, Typography } from "@mui/material";

const CashStatementReport = ({ setShow, cash, show, date }: { setShow: () => void, cash: {
        materialCost: number;
        report: CashFlowReport[], totalExpense: number }, show: boolean, date: () => string }) => {
    const totalCash = cash?.report?.reduce((sum, report) => sum + report.total, 0);

    return (
        <Dialog open={show} fullWidth>
            <DialogContent>
                <Stack>
                    <Typography variant="h4" sx={{ textAlign: "center", mb: 2, fontWeight: "bold" }}>
                        Cash Statement Report
                    </Typography>
                    <Typography variant="h6" sx={{ textAlign: "center", mb: 2 }}>
                        Date: {date()}
                    </Typography>
                </Stack>
                <Table>
                    <TableHead>
                        <TableRow sx={{ backgroundColor: "primary.light" }}>
                            <TableCell sx={{ fontSize: "1.1rem", fontWeight: "bold" }}>Method</TableCell>
                            <TableCell align="right" sx={{ fontSize: "1.1rem", fontWeight: "bold" }}>Fee</TableCell>
                            <TableCell align="right" sx={{ fontSize: "1.1rem", fontWeight: "bold" }}>Total</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {cash?.report?.length > 0 ? (
                            cash.report.map((report, index) => (
                                <TableRow key={index}>
                                    <TableCell sx={{ textTransform: "uppercase", fontSize: "1rem" }}>{report.method}</TableCell>
                                    <TableCell align="right" sx={{ fontSize: "1rem" }}>{report?.fee?.toFixed(2)}%</TableCell>
                                    <TableCell align="right" sx={{ fontSize: "1rem" }}>{report?.total?.toFixed(2)}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={3} align="center" sx={{ fontStyle: "italic", fontSize: "1rem" }}>
                                    No data available
                                </TableCell>
                            </TableRow>
                        )}
                        {cash?.report?.length > 0 && (
                            <>
                                <TableRow sx={{ backgroundColor: "grey.200" }}>
                                    <TableCell colSpan={2} align="right" sx={{ fontWeight: "bold", fontSize: "1.1rem" }}>
                                        Generated Cash
                                    </TableCell>
                                    <TableCell align="right" sx={{ fontWeight: "bold", fontSize: "1.1rem" }}>
                                        {totalCash?.toFixed(2)}
                                    </TableCell>
                                </TableRow>
                                <TableRow sx={{ backgroundColor: "grey.200" }}>
                                    <TableCell colSpan={2} align="right" sx={{ fontWeight: "bold", fontSize: "1.1rem", color: "error.main" }}>
                                        Total Expenses
                                    </TableCell>
                                    <TableCell align="right" sx={{ fontWeight: "bold", fontSize: "1.1rem",color: "error.main" }}>
                                        -{cash?.totalExpense?.toFixed(2)}
                                    </TableCell>
                                </TableRow>
                                <TableRow sx={{ backgroundColor: "grey.300" }}>
                                    <TableCell colSpan={2} align="right" sx={{ fontWeight: "bold", fontSize: "1.1rem" }}>
                                        Running Cash
                                    </TableCell>
                                    <TableCell align="right" sx={{ fontWeight: "bold", fontSize: "1.1rem" }}>
                                        {(totalCash - cash?.totalExpense)?.toFixed(2)}
                                    </TableCell>
                                </TableRow>
                                <TableRow sx={{ backgroundColor: "grey.300" }}>
                                    <TableCell colSpan={2} align="right" sx={{ fontWeight: "bold", fontSize: "1.1rem",color: "error.main"  }}>
                                        Material Cost
                                    </TableCell>
                                    <TableCell align="right" sx={{ fontWeight: "bold", fontSize: "1.1rem",color: "error.main"  }}>
                                        -{(cash?.materialCost || 0)?.toFixed(2)}
                                    </TableCell>
                                </TableRow>
                                <TableRow sx={{ backgroundColor: "grey.300" }}>
                                    <TableCell colSpan={2} align="right" sx={{ fontWeight: "bold", fontSize: "1.1rem", color:"success.main" }}>
                                        Running Profit
                                    </TableCell>
                                    <TableCell align="right" sx={{ fontWeight: "bold", fontSize: "1.1rem",color:"success.main" }}>
                                        {(totalCash - cash?.totalExpense - (cash?.materialCost || 0))?.toFixed(2)}
                                    </TableCell>
                                </TableRow>
                            </>
                        )}
                    </TableBody>
                </Table>
            </DialogContent>
            <DialogActions>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={setShow}
                    sx={{ fontWeight: "bold", fontSize: "1.2em" }}
                >
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default CashStatementReport;
