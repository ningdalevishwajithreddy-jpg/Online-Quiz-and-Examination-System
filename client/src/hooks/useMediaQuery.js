import { useCallback, useSyncExternalStore } from 'react';

/**
 * Reactive matchMedia hook used for responsive layout decisions.
 *
 * Built on useSyncExternalStore, which is React's supported way to read from an
 * external source: the server snapshot (false) keeps SSR/first paint stable and
 * the subscription reacts to viewport changes.
 */
function getServerSnapshot() {
  return false;
}

export function useMediaQuery(query) {
  const subscribe = useCallback(
    (onStoreChange) => {
      if (typeof window === 'undefined' || !window.matchMedia) return () => {};

      const media = window.matchMedia(query);
      media.addEventListener('change', onStoreChange);
      return () => media.removeEventListener('change', onStoreChange);
    },
    [query],
  );

  const getSnapshot = useCallback(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia(query).matches;
  }, [query]);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export default useMediaQuery;
