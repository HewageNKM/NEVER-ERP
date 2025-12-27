import { Metadata } from "next";
import { POSProvider } from "./context/POSContext";
import POSContent from "./components/POSContent";

export const metadata: Metadata = {
  title: "POS | NEVER Panel",
  description: "Point of Sale System",
};

export default function POSPage() {
  return (
    <POSProvider>
      <POSContent />
    </POSProvider>
  );
}
