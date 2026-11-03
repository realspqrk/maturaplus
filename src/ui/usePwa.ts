import { useRef, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { reloadPage } from './reload'

export function usePwa() {
  // Only the window where the user accepted the update may reload: a new service worker takes
  // control of every open window, and an unrequested reload would wipe their unsaved inputs.
  const requested = useRef(false)
  const [updatedElsewhere, setUpdatedElsewhere] = useState(false)
  const {
    offlineReady: [offlineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onNeedReload: () => {
      if (requested.current) reloadPage()
      else {
        setNeedRefresh(false)
        setUpdatedElsewhere(true)
      }
    },
  })
  const controlled = typeof navigator !== 'undefined' && !!navigator.serviceWorker?.controller
  // the one-file app opened from disk needs no service worker to work offline
  const local = typeof location !== 'undefined' && location.protocol === 'file:'
  return {
    offlineReady: offlineReady || controlled || local,
    needRefresh,
    updatedElsewhere,
    dismiss: () => {
      setNeedRefresh(false)
      setUpdatedElsewhere(false)
    },
    update: () => {
      requested.current = true
      return updateServiceWorker(true)
    },
    reloadNow: reloadPage,
  }
}
