"use client";
import React from "react";
import { IconEdit, IconTrash, IconEye, IconBoxSeam } from "@tabler/icons-react";
import { Product } from "@/model/Product";
import Link from "next/link";

interface ProductListTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (itemId: string) => void;
  brandMap: Map<string, string>;
  categoryMap: Map<string, string>;
}

// --- NIKE AESTHETIC STYLES ---
const styles = {
  iconBtn:
    "w-8 h-8 flex items-center justify-center border border-gray-200 hover:bg-black hover:border-black hover:text-white transition-colors",
};

const ProductListTable: React.FC<ProductListTableProps> = ({
  products,
  onEdit,
  onDelete,
  brandMap,
  categoryMap,
}) => {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-gray-200 bg-gray-50/50">
        <IconBoxSeam className="text-gray-300 mb-2" size={48} />
        <p className="text-lg font-black uppercase tracking-tighter text-gray-300">
          No Products Found
        </p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto bg-white border border-gray-200">
      <table className="w-full text-left border-collapse">
        <thead className="bg-white text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em] border-b-2 border-black">
          <tr>
            <th className="p-6">Product Details</th>
            <th className="p-6">Category / Brand</th>
            <th className="p-6">Gender</th>
            <th className="p-6">Sizes</th>
            <th className="p-6 text-center">Inventory</th>
            <th className="p-6 text-center">Status</th>
            <th className="p-6 text-center">Listing</th>
            <th className="p-6 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="text-sm">
          {products.map((product) => (
            <tr
              key={product.productId}
              className="border-b border-gray-100 group hover:bg-gray-50 transition-colors"
            >
              <td className="p-6 align-top">
                <div className="flex flex-col gap-1">
                  <span className="font-black text-black uppercase tracking-wide text-base leading-none">
                    {product.name}
                  </span>
                  <span className="font-mono text-[10px] font-bold text-gray-400 tracking-wider">
                    ID: {product.productId?.slice(0, 8)}...
                  </span>
                </div>
              </td>
              <td className="p-6 align-top">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-black uppercase">
                    {categoryMap.get(product.category) || product.category}
                  </span>
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">
                    {brandMap.get(product.brand) || product.brand}
                  </span>
                </div>
              </td>
              <td className="p-6 align-top">
                <div className="flex flex-wrap gap-1">
                  {(() => {
                    const genderArr = Array.isArray(product.gender)
                      ? product.gender
                      : [];
                    return genderArr.length > 0 ? (
                      genderArr.map((g: string) => (
                        <span
                          key={g}
                          className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide bg-gray-100 text-gray-600"
                        >
                          {g}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] text-gray-400">—</span>
                    );
                  })()}
                </div>
              </td>
              <td className="p-6 align-top">
                <div className="flex flex-wrap gap-1 max-w-[120px]">
                  {(() => {
                    const sizesArr = Array.isArray(product.availableSizes)
                      ? product.availableSizes
                      : [];
                    return sizesArr.length > 0 ? (
                      <>
                        {sizesArr.slice(0, 6).map((s: string) => (
                          <span
                            key={s}
                            className="px-1.5 py-0.5 text-[9px] font-bold bg-black text-white"
                          >
                            {s}
                          </span>
                        ))}
                        {sizesArr.length > 6 && (
                          <span className="text-[9px] text-gray-500 font-bold">
                            +{sizesArr.length - 6}
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-[10px] text-gray-400">—</span>
                    );
                  })()}
                </div>
              </td>
              <td className="p-6 align-top text-center">
                {product.inStock ? (
                  <div className="inline-flex flex-col items-center">
                    <span className="font-black text-lg text-black leading-none">
                      {product.totalStock}
                    </span>
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                      In Stock
                    </span>
                  </div>
                ) : (
                  <span className="text-[10px] font-bold text-red-600 uppercase tracking-widest border border-red-200 bg-red-50 px-2 py-1">
                    Out of Stock
                  </span>
                )}
              </td>
              <td className="p-6 align-top text-center">
                <span
                  className={`inline-block px-2 py-1 text-[9px] font-black uppercase tracking-widest border ${
                    product.status
                      ? "bg-black text-white border-black"
                      : "bg-white text-gray-400 border-gray-200"
                  }`}
                >
                  {product.status ? "Active" : "Inactive"}
                </span>
              </td>
              <td className="p-6 align-top text-center">
                <span
                  className={`inline-block px-2 py-1 text-[9px] font-black uppercase tracking-widest border ${
                    product.listing
                      ? "bg-white text-black border-black"
                      : "bg-gray-100 text-gray-400 border-transparent"
                  }`}
                >
                  {product.listing ? "Listed" : "Unlisted"}
                </span>
              </td>
              <td className="p-6 align-top text-right">
                <div className="flex justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-200">
                  <Link
                    href={`/master/products/${product.productId}/view`}
                    className={styles.iconBtn}
                    title="View"
                  >
                    <IconEye size={16} stroke={2} />
                  </Link>
                  <button
                    onClick={() => onEdit(product)}
                    className={styles.iconBtn}
                    title="Edit"
                  >
                    <IconEdit size={16} stroke={2} />
                  </button>
                  <button
                    onClick={() => onDelete(product.productId)}
                    className={`${styles.iconBtn} hover:border-red-600 hover:bg-red-600`}
                    title="Delete"
                  >
                    <IconTrash size={16} stroke={2} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ProductListTable;
