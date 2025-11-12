import React from "react";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import { StocksReport } from "@/model";
import { Stack } from "@mui/material";

const StockReport = ({
                         show,
                         setShow,
                         stocks,
                     }: {
    show: boolean;
    setShow: () => void;
    stocks: StocksReport[];
}) => {
    const headerStyles = {
        fontWeight: "bold",
        textTransform: "uppercase",
        fontSize: "1.1em",
    };

    return (
        <Dialog open={show} fullScreen>
            <DialogContent>
                <Stack>
                    <h2 style={{ textAlign: "center", marginBottom: "20px", fontSize: "1.8rem" }}>
                        Stock Report
                    </h2>
                </Stack>
                <Table>
                    <TableHead>
                        <TableRow style={{ backgroundColor: "#f5f5f5" }}>
                            {[
                                "Item ID",
                                "Manufacturer",
                                "Brand",
                                "Item Name",
                                "Variant Name",
                                "Variant ID",
                                "Size",
                                "Stock",
                            ].map((header) => (
                                <TableCell key={header} style={headerStyles}>
                                    {header}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {stocks?.map((category, categoryIndex) => {
                            const categoryTotal = category.data.reduce(
                                (catSum, item) =>
                                    catSum +
                                    item.data.reduce(
                                        (itemSum, variant) =>
                                            itemSum +
                                            variant.stock.reduce((sizeSum, size) => sizeSum + size.stock, 0),
                                        0
                                    ),
                                0
                            );

                            return (
                                <React.Fragment key={categoryIndex}>
                                    {/* Category Header */}
                                    <TableRow style={{ backgroundColor: "#e3f2fd" }}>
                                        <TableCell
                                            colSpan={8}
                                            style={{
                                                fontWeight: "bold",
                                                fontSize: "1.2em",
                                                textTransform: "uppercase",
                                                color: "#0d47a1",
                                            }}
                                        >
                                            {category.type}
                                        </TableCell>
                                    </TableRow>
                                    {category.data.map((item, itemIndex) => {
                                        const itemTotal = item.data.reduce(
                                            (itemSum, variant) =>
                                                itemSum +
                                                variant.stock.reduce((sizeSum, size) => sizeSum + size.stock, 0),
                                            0
                                        );

                                        return (
                                            <React.Fragment key={itemIndex}>
                                                {/* Item Header */}
                                                <TableRow>
                                                    <TableCell
                                                        colSpan={8}
                                                        style={{
                                                            fontWeight: "bold",
                                                            fontSize: "1.1em",
                                                            paddingLeft: "20px",
                                                            backgroundColor: "#f1f8e9",
                                                            color: "#388e3c",
                                                            textTransform: "capitalize",
                                                        }}
                                                    >
                                                        {item.itemName}
                                                    </TableCell>
                                                </TableRow>
                                                {/* Item Data */}
                                                {item.data.map((variant, variantIndex) =>
                                                    variant.stock.map((sizeDetail, sizeIndex) => (
                                                        <TableRow key={`${variantIndex}-${sizeIndex}`}>
                                                            <TableCell sx={{ textTransform: "uppercase" }}>
                                                                {item.itemId}
                                                            </TableCell>
                                                            <TableCell sx={{ textTransform: "capitalize" }}>
                                                                {item.manufacturer}
                                                            </TableCell>
                                                            <TableCell sx={{ textTransform: "capitalize" }}>
                                                                {item.brand}
                                                            </TableCell>
                                                            <TableCell sx={{ textTransform: "capitalize" }}>
                                                                {item.itemName}
                                                            </TableCell>
                                                            <TableCell sx={{ textTransform: "capitalize" }}>
                                                                {variant.variantName}
                                                            </TableCell>
                                                            <TableCell sx={{ textTransform: "uppercase" }}>
                                                                {variant.variantId}
                                                            </TableCell>
                                                            <TableCell sx={{ textTransform: "capitalize" }}>
                                                                {sizeDetail.size}
                                                            </TableCell>
                                                            <TableCell>{sizeDetail.stock}</TableCell>
                                                        </TableRow>
                                                    ))
                                                )}
                                                {/* Item Total Row */}
                                                <TableRow style={{ backgroundColor: "#e8f5e9" }}>
                                                    <TableCell colSpan={7} style={{ fontWeight: "bold" }}>
                                                        Total for {item.itemName}
                                                    </TableCell>
                                                    <TableCell style={{ fontWeight: "bold" }}>{itemTotal}</TableCell>
                                                </TableRow>
                                            </React.Fragment>
                                        );
                                    })}
                                    {/* Category Total Row */}
                                    <TableRow style={{ backgroundColor: "#dcedc8" }}>
                                        <TableCell colSpan={7} style={{ fontWeight: "bold" }}>
                                            Total for {category.type.toUpperCase()}
                                        </TableCell>
                                        <TableCell style={{ fontWeight: "bold" }}>{categoryTotal}</TableCell>
                                    </TableRow>
                                </React.Fragment>
                            );
                        })}
                    </TableBody>
                </Table>
            </DialogContent>
            <DialogActions>
                <Button
                    variant="contained"
                    type="button"
                    color="primary"
                    onClick={() => setShow()}
                    style={{ fontWeight: "bold", fontSize: "1.1em" }}
                >
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default StockReport;
