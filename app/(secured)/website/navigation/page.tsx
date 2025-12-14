"use client";
import React, { useEffect, useState } from "react";
import {
  IconSitemap,
  IconLink,
  IconDeviceFloppy,
  IconLoader,
  IconAlertTriangle,
  IconCheck,
  IconX,
  IconWand,
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

  // State for JSON strings
  const [mainNavJson, setMainNavJson] = useState("[]");
  const [footerNavJson, setFooterNavJson] = useState("[]");

  // State for Validation
  const [mainNavValid, setMainNavValid] = useState(true);
  const [footerNavValid, setFooterNavValid] = useState(true);

  const { currentUser } = useAppSelector((state) => state.authSlice);

  useEffect(() => {
    if (currentUser) {
      fetchConfig();
    }
  }, [currentUser]);

  // Real-time validation
  useEffect(() => {
    try {
      JSON.parse(mainNavJson);
      setMainNavValid(true);
    } catch {
      setMainNavValid(false);
    }
  }, [mainNavJson]);

  useEffect(() => {
    try {
      JSON.parse(footerNavJson);
      setFooterNavValid(true);
    } catch {
      setFooterNavValid(false);
    }
  }, [footerNavJson]);

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

  const prettify = (type: "main" | "footer") => {
    try {
      if (type === "main") {
        const obj = JSON.parse(mainNavJson);
        setMainNavJson(JSON.stringify(obj, null, 2));
      } else {
        const obj = JSON.parse(footerNavJson);
        setFooterNavJson(JSON.stringify(obj, null, 2));
      }
    } catch (e) {
      showNotification("Cannot format invalid JSON", "error");
    }
  };

  const handleSave = async () => {
    if (!mainNavValid || !footerNavValid) {
      showNotification("Fix invalid JSON before saving", "error");
      return;
    }

    try {
      setSaving(true);
      const mainNav = JSON.parse(mainNavJson);
      const footerNav = JSON.parse(footerNavJson);

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
    editorContainer: "relative w-full group",
    textArea: `w-full h-96 bg-[#1a1a1a] text-gray-300 border-2 focus:border-black p-4 font-mono text-xs outline-none transition-colors resize-y leading-relaxed rounded-sm selection:bg-gray-700`,
    label:
      "text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex justify-between items-center",
    statusBadge: (isValid: boolean) =>
      `px-2 py-1 text-[9px] font-black uppercase tracking-widest rounded-sm flex items-center gap-1 ${
        isValid ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
      }`,
    formatBtn:
      "text-[9px] hover:text-black underline cursor-pointer flex items-center gap-1",
  };

  if (loading) {
    return (
      <div className="h-96 relative">
        <ComponentsLoader title="LOADING CONFIG..." />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 w-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
      {/* Introduction Alert */}
      <div className="bg-gray-100 border-l-4 border-black p-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="bg-white p-2 rounded-full shadow-sm w-fit">
            <IconAlertTriangle className="h-6 w-6 text-black" />
          </div>
          <div>
            <p className="text-sm font-black uppercase tracking-wide text-black">
              Developer Mode: JSON Configuration
            </p>
            <p className="text-xs text-gray-600 mt-1 max-w-3xl leading-relaxed">
              You are editing the raw data structure for the navigation menu.
              Changes here directly affect the live site layout. The editor
              below provides syntax validation to prevent crashes.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Main Nav Editor */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b-2 border-black pb-2">
            <h3 className={styles.sectionTitle}>
              <IconSitemap size={20} /> Main Navigation
            </h3>
            <div className={styles.statusBadge(mainNavValid)}>
              {mainNavValid ? <IconCheck size={12} /> : <IconX size={12} />}
              {mainNavValid ? "Valid JSON" : "Syntax Error"}
            </div>
          </div>

          <div className={styles.editorContainer}>
            <div className={styles.label}>
              <span>config.main_nav.json</span>
              <button
                onClick={() => prettify("main")}
                className={styles.formatBtn}
              >
                <IconWand size={12} /> Format Code
              </button>
            </div>
            <textarea
              value={mainNavJson}
              onChange={(e) => setMainNavJson(e.target.value)}
              className={`${styles.textArea} ${
                !mainNavValid ? "border-red-500" : "border-gray-800"
              }`}
              spellCheck="false"
              placeholder='[ { "title": "Home", "link": "/" } ]'
            />
          </div>
        </div>

        {/* Footer Nav Editor */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b-2 border-black pb-2">
            <h3 className={styles.sectionTitle}>
              <IconLink size={20} /> Footer Links
            </h3>
            <div className={styles.statusBadge(footerNavValid)}>
              {footerNavValid ? <IconCheck size={12} /> : <IconX size={12} />}
              {footerNavValid ? "Valid JSON" : "Syntax Error"}
            </div>
          </div>

          <div className={styles.editorContainer}>
            <div className={styles.label}>
              <span>config.footer.json</span>
              <button
                onClick={() => prettify("footer")}
                className={styles.formatBtn}
              >
                <IconWand size={12} /> Format Code
              </button>
            </div>
            <textarea
              value={footerNavJson}
              onChange={(e) => setFooterNavJson(e.target.value)}
              className={`${styles.textArea} ${
                !footerNavValid ? "border-red-500" : "border-gray-800"
              }`}
              spellCheck="false"
              placeholder='[ { "title": "About", "link": "/about" } ]'
            />
          </div>
        </div>
      </div>

      {/* Floating Save Action */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={handleSave}
          disabled={saving || !mainNavValid || !footerNavValid}
          className={`
            px-8 py-4 shadow-2xl transition-all text-xs font-black uppercase tracking-[0.2em] flex items-center gap-3
            ${
              !mainNavValid || !footerNavValid
                ? "bg-red-600 text-white cursor-not-allowed opacity-100" // Error State
                : "bg-black text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed" // Normal State
            }
          `}
        >
          {saving ? (
            <IconLoader className="animate-spin" size={20} />
          ) : (
            <>
              {!mainNavValid || !footerNavValid ? (
                <IconAlertTriangle size={20} />
              ) : (
                <IconDeviceFloppy size={20} />
              )}
            </>
          )}
          {!mainNavValid || !footerNavValid
            ? "Fix Errors To Save"
            : "Save Configuration"}
        </button>
      </div>
    </div>
  );
};

export default NavigationPage;
