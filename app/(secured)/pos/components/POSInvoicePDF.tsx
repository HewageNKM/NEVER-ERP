"use client";

import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { Order } from "@/model/Order";

interface InvoicePDFProps {
  order: Order;
}

const styles = StyleSheet.create({
  page: {
    fontFamily: "Courier-Bold",
    fontSize: 7,
    paddingHorizontal: 4,
    paddingVertical: 4,
    color: "#000",
  },
  header: { textAlign: "center", marginBottom: 4 },
  hr: { borderBottomWidth: 0.5, borderColor: "#000", marginVertical: 2 },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderColor: "#000",
    paddingBottom: 1,
    marginBottom: 1,
  },
  tableRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 1,
  },
  left: { flex: 3 },
  right: { flex: 1, textAlign: "right" },
  textCenter: { textAlign: "center" },
});

const POSInvoicePDF: React.FC<InvoicePDFProps> = ({ order }) => {
  if (!order?.items?.length) {
    return (
      <Document>
        <Page style={styles.page}>
          <Text>No Order Data</Text>
        </Page>
      </Document>
    );
  }

  // Calculate totals if not present (fallback)
  const total =
    order.total ||
    order.items.reduce((acc, i) => acc + i.price * i.quantity, 0);

  // order.discount might be a total number or we sum item discounts
  const totalDiscount =
    order.discount ||
    order.items.reduce((acc, i) => acc + (i.discount || 0), 0);

  // Grand total is usually total - discount + fee + shipping etc.
  // Assuming order.total is the final amount to pay?
  // Let's stick to standard logic: Subtotal - Discount + Fees
  const subtotal = order.items.reduce(
    (acc, i) => acc + i.price * i.quantity,
    0
  );

  // Check if we have payment info. In NEVER-PANEL Order model, we might need to check how payments are stored.
  // The POSTypes has POSPayment, but Order model is generic.
  // Assuming order.paymentInfo or similar tracks payments for POS.
  // If not available, we might need to rely on order.total as paid amount for now or check 'status'.

  // For POS, we usually have a 'payments' array in the order object if it was a POS order.
  // Let's assume order matches strict Order interface.

  return (
    <Document>
      <Page size={{ width: "48mm", height: "274mm" }} style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={{ fontSize: 9, fontWeight: "bold" }}>NEVERBE</Text>
          <Text style={{ fontSize: 7 }}>330/4/10 New Kandy Road</Text>
          <Text style={{ fontSize: 7 }}>Delgoda</Text>
          <Text style={{ fontSize: 7 }}>+94 70 520 8999</Text>
          <Text style={{ fontSize: 7 }}>+94 72 924 9999</Text>
          <Text style={{ fontSize: 7 }}>info@neverbe.lk</Text>
        </View>

        <View style={styles.hr} />

        {/* Order Info */}
        <Text style={[styles.textCenter, { marginBottom: 4, fontSize: 8 }]}>
          Order ID: {order.orderId.toUpperCase()}
        </Text>
        <Text style={[styles.textCenter, { marginBottom: 4, fontSize: 7 }]}>
          {new Date(order.createdAt as any).toLocaleString()}
        </Text>

        {/* Items Table */}
        <View>
          <View style={styles.tableHeader}>
            <Text style={styles.left}>Item</Text>
            <Text style={styles.right}>Qty</Text>
            <Text style={styles.right}>Price</Text>
          </View>
          {order.items.map((item: any, idx: number) => (
            <View key={idx} style={styles.tableRow}>
              <View style={styles.left}>
                <Text style={{ fontSize: 7 }}>{item.name}</Text>
                {item.variantName && (
                  <Text style={{ fontSize: 6 }}>
                    {item.variantName} ({item.size})
                  </Text>
                )}
              </View>
              <Text style={styles.right}>{item.quantity}</Text>
              <Text style={styles.right}>
                {(item.price * item.quantity).toFixed(2)}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.hr} />

        {/* Totals */}
        <View style={{ textAlign: "right", marginBottom: 4 }}>
          <Text style={{ fontSize: 7 }}>Subtotal: {subtotal.toFixed(2)}</Text>
          <Text style={{ fontSize: 7 }}>
            Discount: -{totalDiscount.toFixed(2)}
          </Text>
          {/* If fee exists */}
          {/* <Text style={{ fontSize: 8, fontWeight: "bold" }}>
            Fee: {order.fee?.toFixed(2)}
          </Text> */}
          <Text style={{ fontSize: 8, fontWeight: "bold" }}>
            Total: {order.total.toFixed(2)}
          </Text>
        </View>

        <View style={styles.hr} />

        {/* Payments - check if 'paymentMethod' matches POS structure */}
        {/* If order has specific POS payment details, render them. Otherwise show generic */}
        <View style={{ marginBottom: 4 }}>
          <Text style={{ fontSize: 7 }}>
            Payment Method: {order.paymentMethod}
          </Text>
        </View>

        <View style={styles.hr} />
        {/* Footer */}
        <View style={styles.textCenter}>
          <Text style={{ fontSize: 7 }}>Thank You for Shopping!</Text>
          <Text style={{ fontSize: 6 }}>
            No further service without receipt!
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default POSInvoicePDF;
