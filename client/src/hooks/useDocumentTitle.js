import { useEffect } from 'react';

import { APP_NAME } from '../utils/appConfig';

/** Keeps the browser tab title in sync with the current page. */
export function useDocumentTitle(title) {
  useEffect(() => {
    const previous = document.title;
    document.title = title ? `${title} · ${APP_NAME}` : `${APP_NAME} · Smarter Exams. Faster Results. Better Learning.`;
    return () => {
      document.title = previous;
    };
  }, [title]);
}

export default useDocumentTitle;
