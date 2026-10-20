/** Wrapped so tests can observe reloads (window.location.reload is not mockable in jsdom). */
export function reloadPage() {
  window.location.reload()
}
