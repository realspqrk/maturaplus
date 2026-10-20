import { useRegisterSW } from 'virtual:pwa-register/react'

export function usePwa() {
  const {
    offlineReady: [offlineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()
  const controlled = typeof navigator !== 'undefined' && !!navigator.serviceWorker?.controller
  return { offlineReady: offlineReady || controlled, needRefresh, dismiss: () => setNeedRefresh(false), update: () => updateServiceWorker(true) }
}
