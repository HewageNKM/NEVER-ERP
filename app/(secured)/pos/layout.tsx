"use client";

import { POSProvider } from "./context/POSContext";

export default function POSLayout({ children }: { children: React.ReactNode }) {
  return <POSProvider>{children}</POSProvider>;
}
