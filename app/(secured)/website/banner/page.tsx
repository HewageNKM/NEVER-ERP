"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useAppSelector } from "@/lib/hooks";
import {
  getBannersAction,
  addBannerAction,
  deleteBannerAction,
} from "@/actions/settingActions";
import { showNotification } from "@/utils/toast";
import { useConfirmationDialog } from "@/contexts/ConfirmationDialogContext";
import ComponentsLoader from "@/app/components/ComponentsLoader";
import EmptyState from "@/app/components/EmptyState";
import {
  IconTrash,
  IconUpload,
  IconCloudUpload,
  IconLoader,
} from "@tabler/icons-react";

// ============ BANNER CARD ============
const BannerCard = ({
  banner,
  onDelete,
}: {
  banner: { fileName: string; url: string; id: string };
  onDelete: (id: string) => void;
}) => {
  const { showConfirmation } = useConfirmationDialog();

  const handleDelete = () => {
    showConfirmation({
      title: "Delete Banner",
      message: "Are you sure you want to delete this banner?",
      onSuccess: () => onDelete(banner.id),
    });
  };

  return (
    <div className="group relative w-full sm:w-[300px] bg-white border border-gray-200 rounded-sm overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="relative aspect-[1200/628] w-full">
        <Image
          src={banner.url}
          alt="Banner"
          fill
          className="object-cover"
          onError={(e) => console.error("Image failed to load", e)}
        />

        {/* Overlay with Delete Button */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200 flex justify-end p-2">
          <button
            onClick={handleDelete}
            className="bg-black/60 hover:bg-red-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-y-2 group-hover:translate-y-0"
            title="Delete Banner"
          >
            <IconTrash size={18} />
          </button>
        </div>
      </div>

      <div className="p-3 border-t border-gray-100">
        <p className="text-xs text-gray-400 font-mono truncate">
          {banner.fileName || "banner_image.jpg"}
        </p>
      </div>
    </div>
  );
};

// ============ BANNER FORM ============
const BannerForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageResolution, setImageResolution] = useState("");

  const validateImage = (file: File): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (file.size > 4 * 1024 * 1024) {
        return reject("File size must be 4MB or less.");
      }

      const img = new window.Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        setImageResolution(`${img.width}x${img.height}`);
        if (img.width !== 1200 || img.height !== 628) {
          return reject("Image resolution must be 1200x628 pixels.");
        }
        resolve();
      };
      img.onerror = () => reject("Invalid image file.");
    });
  };

  const handleFileChange = async (file: File) => {
    if (!file) return;
    try {
      setIsLoading(true);
      await validateImage(file);
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
    } catch (error: any) {
      showNotification(error, "error");
      setSelectedFile(null);
      setImagePreview(null);
      setImageResolution("");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    handleFileChange(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    try {
      e.preventDefault();
      setIsLoading(true);
      const formData = new FormData();
      if (selectedFile) {
        formData.append("banner", selectedFile);
      }
      formData.append("path", "sliders");

      await addBannerAction(formData);
      setSelectedFile(null);
      setImagePreview(null);
      // @ts-ignore
      e.target.reset();
      showNotification("Banner uploaded successfully", "success");
      onSuccess();
    } catch (e: any) {
      console.error(e);
      showNotification(e.message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-lg mx-auto mt-8 p-6 bg-gray-50 border border-dashed border-gray-300 rounded-sm"
    >
      <div className="flex flex-col items-center gap-6">
        <div
          className={`w-full h-48 border-2 border-dashed rounded-sm flex items-center justify-center cursor-pointer relative overflow-hidden transition-colors ${
            selectedFile
              ? "border-gray-900 bg-white"
              : "border-gray-300 bg-white hover:border-gray-400"
          }`}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept="image/png, image/jpeg, image/jpg"
            hidden
            onChange={(e) =>
              e.target.files && handleFileChange(e.target.files[0])
            }
            id="upload-button"
          />
          <label
            htmlFor="upload-button"
            className="w-full h-full flex flex-col items-center justify-center cursor-pointer p-4"
          >
            {imagePreview ? (
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full h-full object-contain rounded-sm"
              />
            ) : (
              <div className="text-center">
                <IconCloudUpload
                  className="mx-auto text-gray-300 mb-2"
                  size={48}
                />
                <p className="text-sm font-bold uppercase text-gray-500">
                  {isLoading ? "Validating..." : "Click or Drop Image"}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Resolution: 1200 x 628px
                </p>
                <p className="text-xs text-gray-400">Max: 4MB (*.png, *.jpg)</p>
              </div>
            )}
          </label>
        </div>

        {selectedFile && (
          <div className="text-center">
            <p className="text-sm font-bold text-gray-900">
              {selectedFile.name}
            </p>
            <p className="text-xs text-green-600 font-medium mt-1">
              Resolution: {imageResolution} (Valid)
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || !selectedFile}
          className="flex items-center justify-center px-8 py-3 bg-gray-900 text-white text-sm font-bold uppercase tracking-wide rounded-full hover:bg-gray-800 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
        >
          {isLoading ? (
            <IconLoader className="animate-spin" size={20} />
          ) : (
            <>
              <IconUpload size={20} className="mr-2" />
              Upload Banner
            </>
          )}
        </button>
      </div>
    </form>
  );
};

// ============ MAIN BANNER PAGE ============
const BannerPage = () => {
  const [banners, setBanners] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { currentUser } = useAppSelector((state) => state.authSlice);

  const fetchBanners = async () => {
    try {
      setIsLoading(true);
      const data = await getBannersAction();
      setBanners(data || []);
    } catch (e: any) {
      showNotification(e.message, "error");
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchBanners();
    }
  }, [currentUser]);

  const handleDelete = async (bannerId: string) => {
    try {
      await deleteBannerAction(bannerId);
      showNotification("Banner deleted successfully", "success");
      fetchBanners();
    } catch (e: any) {
      showNotification(e.message, "error");
      console.error(e);
    }
  };

  return (
    <div className="flex flex-col gap-8 w-full p-2">
      <div className="space-y-4">
        <h3 className="text-lg font-bold uppercase text-gray-900 border-b border-gray-100 pb-2">
          Active Banners
        </h3>

        {isLoading && (
          <div className="relative h-48 w-full">
            <ComponentsLoader
              title={"Loading Banners..."}
              position={"absolute"}
            />
          </div>
        )}

        {!isLoading && banners.length === 0 && (
          <EmptyState
            title={"No Banners Found"}
            subtitle={"Upload a new banner to get started."}
          />
        )}

        {!isLoading && banners.length > 0 && (
          <div className="flex flex-wrap gap-4">
            {banners.map(
              (banner: { file: string; url: string; id: string }) => (
                <BannerCard
                  key={banner.id || banner.url}
                  banner={banner}
                  onDelete={handleDelete}
                />
              )
            )}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-bold uppercase text-gray-900 border-b border-gray-100 pb-2">
          Upload New Banner
        </h3>
        <BannerForm onSuccess={fetchBanners} />
      </div>
    </div>
  );
};

export default BannerPage;
