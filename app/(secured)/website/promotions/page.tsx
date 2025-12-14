"use client";
import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { useAppSelector } from "@/lib/hooks";
import {
  addPromotionAction,
  deletePromotionAction,
  getPromotionsAction,
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
  IconExternalLink,
} from "@tabler/icons-react";

// ============ TYPES ============
interface Promotion {
  id: string;
  file: string; // Storage path
  url: string; // Public URL
  title: string;
  link: string;
}

// ============ PROMOTION CARD ============
const PromotionCard = ({
  promo,
  onDelete,
}: {
  promo: Promotion;
  onDelete: (id: string) => void;
}) => {
  const { showConfirmation } = useConfirmationDialog();

  const handleDelete = () => {
    showConfirmation({
      title: "DELETE PROMOTION?",
      message: "This will be permanently removed.",
      variant: "danger",
      onSuccess: () => onDelete(promo.id),
    });
  };

  return (
    <div className="group relative w-full bg-white border-2 border-transparent hover:border-black transition-all duration-300 shadow-sm hover:shadow-lg flex flex-col">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-50">
        <Image
          src={promo.url || ""}
          alt={promo.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => console.error("Image failed to load", e)}
        />

        {/* Overlay Actions */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-start justify-end p-3 opacity-0 group-hover:opacity-100">
          <button
            onClick={handleDelete}
            className="bg-white text-black border-2 border-transparent hover:border-black w-8 h-8 flex items-center justify-center hover:bg-black hover:text-white transition-all shadow-sm"
            title="Delete"
          >
            <IconTrash size={16} />
          </button>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-2 bg-white border-t border-gray-100">
        <h4 className="text-sm font-black uppercase tracking-tighter text-black truncate">
          {promo.title}
        </h4>
        <a
          href={promo.link}
          target="_blank"
          rel="noreferrer"
          className="text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-black flex items-center gap-1 truncate transition-colors"
        >
          <IconExternalLink size={12} />
          {promo.link}
        </a>
      </div>
    </div>
  );
};

// ============ PROMOTION FORM ============
const PromotionForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [link, setLink] = useState("");

  // Ref to clear file input manually
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cleanup object URL to avoid memory leaks
  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showNotification("Max size 2MB", "error");
        return;
      }
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    try {
      e.preventDefault();
      if (!selectedFile || !title || !link) {
        showNotification("All fields required", "error");
        return;
      }

      setIsLoading(true);
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("title", title);
      formData.append("link", link);

      await addPromotionAction(formData);

      // Reset form states
      setSelectedFile(null);
      setImagePreview(null);
      setTitle("");
      setLink("");

      // Reset actual file input DOM element
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      showNotification("PROMOTION ADDED", "success");
      onSuccess();
    } catch (e: any) {
      console.error(e);
      showNotification(e.message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const styles = {
    label:
      "block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1",
    input:
      "w-full bg-gray-50 border-2 border-transparent focus:border-black px-4 py-3 text-sm font-bold outline-none transition-colors placeholder:font-medium placeholder:text-gray-300",
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-4xl bg-white border-2 border-gray-200 p-8 grid grid-cols-1 md:grid-cols-2 gap-8 shadow-sm hover:shadow-md transition-shadow"
    >
      {/* Left: Image Upload */}
      <div className="space-y-2">
        <label className={styles.label}>Promotion Image</label>
        <div
          onClick={() => fileInputRef.current?.click()}
          className="relative w-full aspect-[4/3] bg-gray-50 border-2 border-dashed border-gray-200 hover:border-black transition-colors flex flex-col items-center justify-center overflow-hidden group cursor-pointer"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden" // Hidden input, controlled by div click
          />
          {imagePreview ? (
            <Image
              src={imagePreview}
              alt="Preview"
              fill
              className="object-cover"
            />
          ) : (
            <div className="text-center p-4">
              <IconCloudUpload
                className="mx-auto text-gray-300 mb-2 group-hover:text-black transition-colors"
                size={32}
              />
              <span className="text-[10px] font-bold uppercase text-gray-400 group-hover:text-black transition-colors">
                Click to Upload
              </span>
            </div>
          )}
        </div>
        {selectedFile && (
          <span className="text-[10px] font-mono text-gray-500 block text-center">
            {selectedFile.name}
          </span>
        )}
      </div>

      {/* Right: Inputs */}
      <div className="flex flex-col justify-between">
        <div className="space-y-6">
          <div>
            <label className={styles.label}>Campaign Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={styles.input}
              placeholder="E.G. SUMMER SALE 2024"
            />
          </div>
          <div>
            <label className={styles.label}>Target Link</label>
            <input
              value={link}
              onChange={(e) => setLink(e.target.value)}
              className={styles.input}
              placeholder="E.G. /COLLECTIONS/SUMMER"
            />
          </div>
        </div>

        <div className="pt-8 md:pt-0">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-black text-white px-6 py-4 text-xs font-black uppercase tracking-[0.2em] hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <IconLoader className="animate-spin" size={16} />
            ) : (
              <>
                <IconUpload size={16} /> Create Promotion
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
};

// ============ MAIN PAGE ============
const PromotionsPage = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { currentUser } = useAppSelector((state) => state.authSlice);

  const fetchPromotions = async () => {
    try {
      setIsLoading(true);
      const data = await getPromotionsAction();
      setPromotions(data || []);
    } catch (e: any) {
      showNotification(e.message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchPromotions();
    }
  }, [currentUser]);

  const handleDelete = async (id: string) => {
    try {
      await deletePromotionAction(id);
      showNotification("DELETED", "success");
      fetchPromotions();
    } catch (e: any) {
      showNotification(e.message, "error");
    }
  };

  return (
    <div className="flex flex-col gap-12 w-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b-2 border-black pb-4">
          <h3 className="text-xl font-black uppercase tracking-tighter text-black">
            Active Promotions{" "}
            <span className="text-gray-400 text-lg ml-2 font-mono">
              ({promotions.length})
            </span>
          </h3>
        </div>

        {isLoading && (
          <div className="relative h-64 w-full">
            <ComponentsLoader title="LOADING..." />
          </div>
        )}

        {!isLoading && promotions.length === 0 && (
          <EmptyState
            title="NO PROMOTIONS"
            subtitle="Create a promotion below to display on the homepage."
          />
        )}

        {/* Changed from Flex wrap to Grid for better layout stability */}
        {!isLoading && promotions.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {promotions.map((p) => (
              <PromotionCard key={p.id} promo={p} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>

      <div className="space-y-6">
        <h3 className="text-xl font-black uppercase tracking-tighter text-black border-b-2 border-black pb-4">
          Create New Campaign
        </h3>
        <PromotionForm onSuccess={fetchPromotions} />
      </div>
    </div>
  );
};

export default PromotionsPage;
