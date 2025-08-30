import React, { useState, useEffect } from "react";
import Head from "next/head";
import { Header, HeroSection } from "../components/HomePage/index";

const TOKEN_NAME = process.env.NEXT_PUBLIC_TOKEN_NAME;

export default function Home() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const saveMode = localStorage.getItem("darkMode");

      let systemPrefersDark = false;

      try {
        systemPrefersDark = window.matchMedia(
          "(prefers-color-scheme: dark)"
        ).matches;
      } catch (error) {
        systemPrefersDark = false;
      }

      const shouldUseDarkMode = save === "false" ? false : true;

      setIsDarkMode(shouldUseDarkMode);

      if (shouldUseDarkMode) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    } catch (error) {
      console.error("Error setting dark mode:", error);
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  });
  return <div>index</div>;
}
