import { firestore } from "firebase-admin";
import Timestamp = firestore.Timestamp;
import { Img } from "./Img";
import { Variant } from "./Variant";

export interface Item {
  itemId: string;
  type: string;
  category: string;
  brand: string;
  description: string;
  thumbnail: Img;
  variants: Variant[];
  name: string;
  buyingPrice: number;
  sellingPrice: number;
  marketPrice: number;
  discount: number;
  tags: string[];

  listing: "Active" | "Inactive";
  status: "Active" | "Inactive";

  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}
