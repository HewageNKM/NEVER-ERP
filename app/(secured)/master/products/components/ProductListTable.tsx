"use client";
import React from "react";
import { IconEdit, IconTrash, IconEye } from "@tabler/icons-react";
import { Product } from "@/model/Product";
import Link from "next/link"; // Use Link for navigation if possible, or keep the IconButton href if sticking to anchor behavior

interface ProductListTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (itemId: string) => void;
  brandMap: Map<string, string>;
  categoryMap: Map<string, string>;
}

const ProductListTable: React.FC<ProductListTableProps> = ({
  products,
  onEdit,
  onDelete,
  brandMap,
  categoryMap,
}) => {
  return (
    <div className="w-full overflow-x-auto bg-white border border-gray-200 rounded-sm">
      <table className="w-full text-left text-sm border-collapse">
        <thead className="bg-gray-100 text-gray-900 border-b border-gray-200 uppercase text-xs tracking-wider font-bold">
          <tr>
            <th className="p-4">Product ID</th>
            <th className="p-4">Name</th>
            <th className="p-4">Category</th>
            <th className="p-4">Brand</th>
            <th className="p-4">Stock</th>
            <th className="p-4">Status</th>
            <th className="p-4">Listing</th>
            <th className="p-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {products.map((product) => (
            <tr
              key={product.productId}
              className="hover:bg-gray-50 transition-colors duration-200"
            >
              <td className="p-4 font-mono text-gray-600 uppercase">
                {product.productId}
              </td>
              <td className="p-4 font-medium text-gray-900">{product.name}</td>
              <td className="p-4 text-gray-600">
                {categoryMap.get(product.category) || product.category}
              </td>
              <td className="p-4 text-gray-600">
                {brandMap.get(product.brand) || product.brand}
              </td>
              <td className="p-4">
                {product.inStock ? (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold uppercase bg-green-100 text-green-800">
                    {product.totalStock} In Stock
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold uppercase bg-red-100 text-red-800">
                    Out of Stock
                  </span>
                )}
              </td>
              <td className="p-4">
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold uppercase ${
                    product.status
                      ? "bg-blue-100 text-blue-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {product.status ? "Active" : "Inactive"}
                </span>
              </td>
              <td className="p-4">
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold uppercase ${
                    product.listing
                      ? "bg-blue-100 text-blue-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {product.listing ? "Listed" : "Unlisted"}
                </span>
              </td>
              <td className="p-4 text-right space-x-2">
                <button
                  onClick={() => onEdit(product)}
                  className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                  title="Edit"
                >
                  <IconEdit size={18} />
                </button>
                <button
                  onClick={() => onDelete(product.productId)}
                  className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                  title="Delete"
                >
                  <IconTrash size={18} />
                </button>
                <Link
                  href={`/dashboard/master/products/${product.productId}/view`} // Assuming productId is the correct ID for the URL
                  className="inline-block p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-full transition-colors align-middle"
                  title="View"
                >
                  <IconEye size={18} />
                </Link>
              </td>
            </tr>
          ))}
          {products.length === 0 && (
            <tr>
              <td colSpan={8} className="p-8 text-center text-gray-500">
                No products found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ProductListTable;
