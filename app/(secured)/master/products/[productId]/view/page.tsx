"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  IconCheck,
  IconX,
  IconChevronLeft,
  IconBoxSeam,
  IconTag,
  IconRuler,
} from "@tabler/icons-react";
import { getToken } from "@/firebase/firebaseClient";
import axios from "axios";
import { Product } from "@/model/Product";
import PageContainer from "@/app/(secured)/components/container/PageContainer";
import { Img } from "@/model/Img";
import { useAppSelector } from "@/lib/hooks";
import Image from "next/image";
import Link from "next/link";

// --- NIKE AESTHETIC STYLES ---
const styles = {
  label:
    "block text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em] mb-1",
  value: "text-sm font-black text-black uppercase tracking-wide",
  monoValue: "text-sm font-medium font-mono text-black",
  sectionHeader:
    "text-xl font-black text-black uppercase tracking-tighter mb-6 pb-2 border-b-2 border-black flex items-center gap-2",
  tag: "inline-block px-3 py-1 bg-gray-100 border border-gray-200 text-[10px] font-bold text-black uppercase tracking-widest mr-2 mb-2",
  statusBadge: (isActive: boolean) =>
    `inline-block px-2 py-1 text-[9px] font-black uppercase tracking-widest border ${
      isActive
        ? "bg-black text-white border-black"
        : "bg-white text-gray-400 border-gray-200"
    }`,
};

const ProductViewPage = () => {
  const params = useParams();
  const router = useRouter();
  const id = params.productId as string;
  const { currentUser } = useAppSelector((state) => state.authSlice);

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [allImages, setAllImages] = useState<Img[]>([]);

  // Fetch Product Data
  useEffect(() => {
    if (!id || !currentUser) return;
    const fetchProduct = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = await getToken();
        const response = await axios.get(`/api/v2/master/products/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data) {
          const prod: Product = response.data;
          setProduct(prod);
          setSelectedImageUrl(prod.thumbnail.url);
          const variantImages = prod.variants.flatMap((v) => v.images);
          setAllImages([prod.thumbnail, ...variantImages]);
        } else {
          setError("Product not found.");
        }
      } catch (e) {
        console.error("Failed to fetch product", e);
        setError("Failed to load product details.");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id, currentUser]);

  if (loading) {
    return (
      <PageContainer title="Loading..." description="Loading product details">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="w-10 h-10 border-4 border-gray-200 border-t-black rounded-full animate-spin mb-4"></div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
            Loading Product Data
          </p>
        </div>
      </PageContainer>
    );
  }

  if (error || !product) {
    return (
      <PageContainer title="Error" description="Product not found">
        <div className="flex flex-col items-center justify-center min-h-[60vh] border-2 border-dashed border-gray-200">
          <IconBoxSeam size={48} className="text-gray-300 mb-4" />
          <p className="text-lg font-black uppercase tracking-tighter text-gray-400">
            {error || "Product Not Found"}
          </p>
          <Link
            href="/master/products"
            className="mt-4 text-xs font-bold uppercase text-black underline"
          >
            Return to Inventory
          </Link>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={product.name}
      description={`Details for ${product.name}`}
    >
      <div className="w-full max-w-7xl mx-auto space-y-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4">
          <Link
            href="/dashboard/master/products"
            className="hover:text-black transition-colors flex items-center gap-1"
          >
            <IconChevronLeft size={12} /> Inventory
          </Link>
          <span>/</span>
          <span className="text-black">{product.productId}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* --- LEFT COLUMN: IMAGES (5/12) --- */}
          <div className="lg:col-span-5 space-y-4">
            {/* Main Image */}
            <div className="relative w-full aspect-square bg-gray-50 border border-gray-200">
              <Image
                src={selectedImageUrl || "/placeholder-image.jpg"}
                alt={product.name}
                fill
                priority
                className="object-contain p-4"
              />
            </div>

            {/* Gallery Grid */}
            <div className="grid grid-cols-5 gap-2">
              {allImages.map((img, index) => (
                <div
                  key={index}
                  onClick={() => setSelectedImageUrl(img.url)}
                  className={`relative aspect-square cursor-pointer border-2 transition-all ${
                    selectedImageUrl === img.url
                      ? "border-black opacity-100"
                      : "border-transparent opacity-50 hover:opacity-100 hover:border-gray-300"
                  }`}
                >
                  <Image
                    src={img.url}
                    alt={`thumbnail-${index}`}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* --- RIGHT COLUMN: DETAILS (7/12) --- */}
          <div className="lg:col-span-7">
            {/* Header Section */}
            <div className="mb-8 border-b-2 border-black pb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                  {product.brand} / {product.category}
                </span>
                <div className="flex gap-2">
                  <span className={styles.statusBadge(product.status)}>
                    {product.status ? "Active" : "Inactive"}
                  </span>
                  <span className={styles.statusBadge(product.listing)}>
                    {product.listing ? "Listed" : "Unlisted"}
                  </span>
                </div>
              </div>
              <h1 className="text-5xl font-black text-black uppercase tracking-tighter leading-none mb-2">
                {product.name}
              </h1>
              <p className="font-mono text-xs text-gray-400 uppercase tracking-wide">
                SKU: {product.productId}
              </p>
            </div>

            {/* Pricing Grid */}
            <div className="bg-gray-50 p-6 border border-gray-200 mb-8">
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4 border-b border-gray-200 pb-2">
                Pricing Structure
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <span className={styles.label}>Selling Price</span>
                  <p className="text-2xl font-black text-black tracking-tighter">
                    <span className="text-xs align-top mr-1 font-medium text-gray-500">
                      LKR
                    </span>
                    {product.sellingPrice.toLocaleString()}
                  </p>
                </div>
                <div>
                  <span className={styles.label}>Market Price</span>
                  <p className={styles.monoValue}>
                    LKR {product.marketPrice.toLocaleString()}
                  </p>
                </div>
                <div>
                  <span className={styles.label}>Cost Price</span>
                  <p className={styles.monoValue}>
                    LKR {product.buyingPrice.toLocaleString()}
                  </p>
                </div>
                <div>
                  <span className={styles.label}>Discount</span>
                  <p className="text-lg font-black text-red-500">
                    {product.discount}% OFF
                  </p>
                </div>
              </div>
            </div>

            {/* Product Specifications */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-lg font-black text-black uppercase tracking-tight mb-4 flex items-center gap-2">
                  <IconBoxSeam size={20} /> Specifications
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 border-b border-gray-100 pb-2">
                    <span className={styles.label}>Stock Level</span>
                    <span
                      className={`${styles.value} ${
                        product.inStock ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {product.inStock
                        ? `${product.totalStock} UNITS`
                        : "OUT OF STOCK"}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 border-b border-gray-100 pb-2">
                    <span className={styles.label}>Weight</span>
                    <span className={styles.value}>{product.weight} G</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-black text-black uppercase tracking-tight mb-4 flex items-center gap-2">
                  <IconTag size={20} /> Keywords
                </h3>
                <div className="flex flex-wrap">
                  {product.tags && product.tags.length > 0 ? (
                    product.tags.map((tag) => (
                      <span key={tag} className={styles.tag}>
                        {tag}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-gray-400 italic">
                      No tags associated
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="mb-12">
              <h3 className="text-lg font-black text-black uppercase tracking-tight mb-2">
                Description
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed font-medium">
                {product.description ||
                  "No detailed description available for this item."}
              </p>
            </div>

            {/* Variants Table */}
            <div>
              <h3 className={styles.sectionHeader}>
                <IconRuler size={24} /> Product Variants
              </h3>

              {product.variants.length > 0 ? (
                <div className="w-full overflow-x-auto border border-gray-200">
                  <table className="w-full text-left">
                    <thead className="bg-black text-white text-[10px] font-bold uppercase tracking-widest">
                      <tr>
                        <th className="p-4">Variant Name</th>
                        <th className="p-4">Variant ID</th>
                        <th className="p-4">Size Configuration</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                      {product.variants.map((variant) => (
                        <tr
                          key={variant.variantId}
                          className="hover:bg-gray-50"
                        >
                          <td className="p-4 font-bold text-black uppercase">
                            {variant.variantName}
                          </td>
                          <td className="p-4 font-mono text-gray-500 text-xs">
                            {variant.variantId}
                          </td>
                          <td className="p-4">
                            <div className="flex flex-wrap gap-1">
                              {variant.sizes.map((size) => (
                                <span
                                  key={size}
                                  className="inline-block border border-gray-300 px-2 py-1 text-[10px] font-bold text-black uppercase bg-white"
                                >
                                  {size}
                                </span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 border-2 border-dashed border-gray-200 text-center bg-gray-50">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    No variants configured
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default ProductViewPage;
