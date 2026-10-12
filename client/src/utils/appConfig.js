/**
 * Single source for the client's build-time configuration.
 *
 * Only VITE_* values reach the browser, and none of them may hold a secret.
 * Defaults keep the app runnable with no .env file at all.
 */

export const APP_NAME = import.meta.env.VITE_APP_NAME || 'QuizSphere';

/** Public contact address shown on the marketing pages (a placeholder by default). */
export const CONTACT_EMAIL = import.meta.env.VITE_CONTACT_EMAIL || 'support@quizsphere.example';

/** True for `vite dev` - used to reveal development-only helpers such as seed accounts. */
export const IS_DEV_BUILD = Boolean(import.meta.env.DEV);
