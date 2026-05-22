"use client";

import { useState, useEffect } from "react";

export interface Settings {
  geminiKey: string;
  elevenLabsKey: string;
  lucyLabKey: string;
  imageProvider: string;
  autoSave: boolean;
  safetyFilters: boolean;
}

const defaultSettings: Settings = {
  geminiKey: "",
  elevenLabsKey: "",
  lucyLabKey: "",
  imageProvider: "dall-e",
  autoSave: true,
  safetyFilters: false,
};

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Load from local storage on mount
    const stored = localStorage.getItem("tuanpham_studio_settings");
    if (stored) {
      try {
        setSettings(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse settings", e);
      }
    }
    setIsLoaded(true);
  }, []);

  const saveSettings = (newSettings: Partial<Settings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    localStorage.setItem("tuanpham_studio_settings", JSON.stringify(updated));
  };

  return { settings, saveSettings, isLoaded };
}
