import { THEME_STORAGE_KEY } from "./theme-provider";

const SCRIPT = `
(function(){try{var k=${JSON.stringify(THEME_STORAGE_KEY)};var s=localStorage.getItem(k);var t=(s==="light"||s==="dark"||s==="system")?s:"system";var r=t==="system"?(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"):t;var d=document.documentElement;d.classList.remove("light","dark");d.classList.add(r);d.style.colorScheme=r;}catch(e){}})();
`.trim();

/**
 * Inline script that resolves the user's theme preference and sets the right
 * class on <html> before paint to prevent a flash. Rendered by the Server
 * Component layout so it lands directly in the SSR HTML stream — it is not
 * part of the client React tree, so React 19's "script inside component"
 * warning does not fire.
 */
export function ThemeScript() {
  return (
    <script
      dangerouslySetInnerHTML={{ __html: SCRIPT }}
      suppressHydrationWarning
    />
  );
}
