/**
 * Mantiene sincronizadas las variables CSS --app-vh y --app-vp-offset con el
 * viewport visible del navegador (se reduce cuando aparece el teclado virtual).
 */
export function initVisualViewport() {
  if (typeof window === "undefined") return;

  const apply = () => {
    const vv = window.visualViewport;
    const height = vv?.height ?? window.innerHeight;
    const offset = vv?.offsetTop ?? 0;
    const root = document.documentElement;
    root.style.setProperty("--app-vh", `${height}px`);
    root.style.setProperty("--app-vp-offset", `${offset}px`);
  };

  apply();
  window.addEventListener("resize", apply);
  window.addEventListener("orientationchange", apply);
  window.visualViewport?.addEventListener("resize", apply);
  window.visualViewport?.addEventListener("scroll", apply);

  // Al enfocar un campo, solo desplazarlo si el teclado lo oculta
  document.addEventListener("focusin", (e) => {
    const el = e.target as HTMLElement | null;
    if (!el || !el.matches("input, textarea, select, [contenteditable=true]")) return;
    window.setTimeout(() => {
      const vv = window.visualViewport;
      const viewTop = vv?.offsetTop ?? 0;
      const viewBottom = viewTop + (vv?.height ?? window.innerHeight);
      const rect = el.getBoundingClientRect();
      if (rect.top >= viewTop + 8 && rect.bottom <= viewBottom - 8) return;
      el.scrollIntoView({ block: "center", behavior: "smooth" });
    }, 250);
  });
}


