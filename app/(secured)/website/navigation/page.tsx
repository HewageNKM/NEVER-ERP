"use client";
import React, { useEffect, useState } from "react";
import {
  IconSitemap,
  IconLink,
  IconDeviceFloppy,
  IconLoader,
  IconAlertTriangle,
} from "@tabler/icons-react";
import {
  getNavigationAction,
  saveNavigationAction,
} from "@/actions/settingActions";
import { showNotification } from "@/utils/toast";
import { useAppSelector } from "@/lib/hooks";
import ComponentsLoader from "@/app/components/ComponentsLoader";

const NavigationPage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mainNavJson, setMainNavJson] = useState("[]");
  const [footerNavJson, setFooterNavJson] = useState("[]");
  const { currentUser } = useAppSelector((state) => state.authSlice);

  useEffect(() => {
    if (currentUser) {
      fetchConfig();
    }
  }, [currentUser]);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const data = await getNavigationAction();
      setMainNavJson(JSON.stringify(data.mainNav || [], null, 2));
      setFooterNavJson(JSON.stringify(data.footerNav || [], null, 2));
    } catch (e: any) {
      showNotification("Failed to load config", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      // Validate JSON
      let mainNav, footerNav;
      try {
        mainNav = JSON.parse(mainNavJson);
      } catch (e) {
        throw new Error("Invalid Main Navigation JSON");
      }
      try {
        footerNav = JSON.parse(footerNavJson);
      } catch (e) {
        throw new Error("Invalid Footer Navigation JSON");
      }

      await saveNavigationAction({ mainNav, footerNav });
      showNotification("NAVIGATION CONFIG SAVED", "success");
    } catch (e: any) {
      showNotification(e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const styles = {
    sectionTitle:
      "text-xl font-black uppercase tracking-tighter text-black flex items-center gap-2",
    textArea:
      "w-full h-64 bg-gray-50 border-2 border-gray-200 focus:border-black p-4 font-mono text-xs outline-none transition-colors resize-y",
    label:
      "text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block",
  };

  if (loading) {
    return (
      <div className="h-96 relative">
        <ComponentsLoader title="LOADING CONFIG..." />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 w-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* Introduction Alert */}
      <div className="bg-amber-50 border-l-4 border-amber-500 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <IconAlertTriangle className="h-5 w-5 text-amber-500" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-amber-700 font-bold uppercase tracking-wide">
              Advanced Configuration
            </p>
            <p className="text-xs text-amber-800 mt-1">
              You are editing the raw JSON configuration for the site
              navigation. Ensure valid JSON syntax to prevent site errors.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Main Nav */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b-2 border-black pb-2">
            <h3 className={styles.sectionTitle}>
              <IconSitemap size={20} /> Main Navigation
            </h3>
          </div>
          <div>
            <label className={styles.label}>config.main_nav.json</label>
            <textarea
              value={mainNavJson}
              onChange={(e) => setMainNavJson(e.target.value)}
              className={styles.textArea}
              spellCheck="false"
            />
          </div>
        </div>

        {/* Footer Nav */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b-2 border-black pb-2">
            <h3 className={styles.sectionTitle}>
              <IconLink size={20} /> Footer Links
            </h3>
          </div>
          <div>
            <label className={styles.label}>config.footer.json</label>
            <textarea
              value={footerNavJson}
              onChange={(e) => setFooterNavJson(e.target.value)}
              className={styles.textArea}
              spellCheck="false"
            />
          </div>
        </div>
      </div>

      {/* Save Action */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-black text-white px-8 py-4 shadow-2xl hover:bg-gray-800 transition-all text-xs font-black uppercase tracking-[0.2em] flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <IconLoader className="animate-spin" size={20} />
          ) : (
            <IconDeviceFloppy size={20} />
          )}
          Save Configuration
        </button>
      </div>
    </div>
  );
};

export default NavigationPage;
