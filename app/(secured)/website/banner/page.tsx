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
  IconPhoto,
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
      title: "DELETE BANNER?",
      message: "This asset will be permanently removed.",
      variant: "danger",
      onSuccess: () => onDelete(banner.id),
    });
  };

  return (
    <div className="group relative w-full sm:w-[320px] bg-gray-50 border-2 border-transparent hover:border-black transition-all duration-300">
      <div className="relative aspect-[1200/628] w-full overflow-hidden">
        <Image
          src={banner.url}
          alt="Banner Asset"
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105 grayscale group-hover:grayscale-0"
          onError={(e) => console.error("Image failed to load", e)}
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-start justify-end p-3 opacity-0 group-hover:opacity-100">
          <button
            onClick={handleDelete}
            className="bg-black text-white w-8 h-8 flex items-center justify-center hover:bg-red-600 transition-colors"
            title="Delete"
          >
            <IconTrash size={16} />
          </button>
        </div>
      </div>

      <div className="p-4 border-t-2 border-transparent group-hover:border-black bg-white transition-colors">
        <p className="text-[10px] font-mono text-gray-400 uppercase truncate tracking-widest group-hover:text-black">
          {banner.fileName || "UNTITLED_ASSET"}
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
        return reject("SIZE EXCEEDED: MAX 4MB");
      }

      const img = new window.Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        setImageResolution(`${img.width}x${img.height}`);
        if (img.width !== 1200 || img.height !== 628) {
          return reject("INVALID DIMENSIONS: REQUIRED 1200x628px");
        }
        resolve();
      };
      img.onerror = () => reject("FILE ERROR");
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
      showNotification("BANNER UPLOADED", "success");
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
      className="w-full max-w-2xl bg-white border-2 border-gray-200 p-8"
    >
      <div className="flex flex-col gap-6">
        <div
          className={`w-full aspect-[2/1] border-2 border-dashed flex items-center justify-center cursor-pointer relative overflow-hidden transition-all group ${
            selectedFile
              ? "border-black bg-gray-50"
              : "border-gray-300 hover:border-black hover:bg-gray-50"
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
            className="w-full h-full flex flex-col items-center justify-center cursor-pointer p-4 z-10"
          >
            {imagePreview ? (
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="text-center space-y-3">
                <IconCloudUpload
                  className="mx-auto text-gray-300 group-hover:text-black transition-colors"
                  size={48}
                  stroke={1}
                />
                <div className="space-y-1">
                  <p className="text-xs font-black uppercase tracking-widest text-black">
                    {isLoading ? "Validating..." : "Drag & Drop Asset"}
                  </p>
                  <p className="text-[10px] font-mono text-gray-400 uppercase">
                    REQ: 1200x628px | MAX: 4MB
                  </p>
                </div>
              </div>
            )}
          </label>
        </div>

        <div className="flex items-center justify-between border-t border-gray-100 pt-6">
          <div className="flex flex-col">
            {selectedFile ? (
              <>
                <span className="text-xs font-bold uppercase text-black">
                  {selectedFile.name}
                </span>
                <span className="text-[10px] font-mono text-green-600 uppercase">
                  Resolution: {imageResolution} OK
                </span>
              </>
            ) : (
              <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">
                No File Selected
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || !selectedFile}
            className="flex items-center justify-center px-8 py-3 bg-black text-white text-[10px] font-black uppercase tracking-[0.2em] hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
          >
            {isLoading ? (
              <IconLoader className="animate-spin" size={16} />
            ) : (
              <>
                <IconUpload size={16} className="mr-2" />
                Upload
              </>
            )}
          </button>
        </div>
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
      showNotification("ASSET DELETED", "success");
      fetchBanners();
    } catch (e: any) {
      showNotification(e.message, "error");
      console.error(e);
    }
  };

  return (
    <div className="flex flex-col gap-12 w-full">
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b-2 border-black pb-4">
          <h3 className="text-xl font-black uppercase tracking-tighter text-black">
            Active Assets{" "}
            <span className="text-gray-400 text-lg ml-2 font-mono">
              ({banners.length})
            </span>
          </h3>
        </div>

        {isLoading && (
          <div className="relative h-64 w-full border-2 border-dashed border-gray-200">
            <ComponentsLoader title="LOADING ASSETS" position="absolute" />
          </div>
        )}

        {!isLoading && banners.length === 0 && (
          <EmptyState
            title="NO ASSETS FOUND"
            subtitle="Upload a banner to initialize the slider."
          />
        )}

        {!isLoading && banners.length > 0 && (
          <div className="flex flex-wrap gap-6">
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

      <div className="space-y-6">
        <h3 className="text-xl font-black uppercase tracking-tighter text-black border-b-2 border-black pb-4">
          Upload New Asset
        </h3>
        <BannerForm onSuccess={fetchBanners} />
      </div>
    </div>
  );
};

export default BannerPage;
