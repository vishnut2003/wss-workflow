"use client";

import { useEffect } from "react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const html = document.documentElement;

    const enforceLight = () => {
      if (html.classList.contains("dark")) html.classList.remove("dark");
      if (html.style.colorScheme !== "light") html.style.colorScheme = "light";
    };

    enforceLight();

    const observer = new MutationObserver(enforceLight);
    observer.observe(html, {
      attributes: true,
      attributeFilter: ["class", "style"],
    });

    return () => {
      observer.disconnect();
      try {
        const stored = localStorage.getItem("theme") ?? "system";
        const resolved =
          stored === "system"
            ? window.matchMedia("(prefers-color-scheme: dark)").matches
              ? "dark"
              : "light"
            : stored;
        if (resolved === "dark") {
          html.classList.add("dark");
          html.style.colorScheme = "dark";
        } else {
          html.classList.remove("dark");
          html.style.colorScheme = "light";
        }
      } catch {
        /* ignore */
      }
    };
  }, []);

  return (
    <>
      <script
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: `try{var d=document.documentElement;d.classList.remove("dark");d.style.colorScheme="light";}catch(e){}`,
        }}
      />
      {children}
    </>
  );
}
