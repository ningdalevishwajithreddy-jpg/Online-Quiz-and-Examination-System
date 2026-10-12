/**
 * Formatting helpers.
 *
 * The API stores and returns UTC ISO timestamps; everything user facing is
 * rendered in the viewer's locale/timezone.
 */

/** e.g. 10 Oct 2026, 14:32:05 */
export function formatDateTime(value, locale) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'medium',
  }).format(date);
}

/** e.g. 14:32:05 - used for "Saved at ..." style confirmations. */
export function formatTime(value, locale) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(locale, { timeStyle: 'medium' }).format(date);
}

/** e.g. 10 Oct 2026 */
export function formatDate(value, locale) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(date);
}

export function formatNumber(value, locale) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  return new Intl.NumberFormat(locale).format(Number(value));
}

export function formatPercent(value, locale, maximumFractionDigits = 1) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    maximumFractionDigits,
  }).format(Number(value) / 100);
}

/** "in 12 minutes" / "3 hours ago" for deadlines and activity feeds. */
export function formatRelative(value, locale) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  const diffSeconds = Math.round((date.getTime() - Date.now()) / 1000);
  const thresholds = [
    { limit: 60, unit: 'second' },
    { limit: 3600, unit: 'minute' },
    { limit: 86400, unit: 'hour' },
    { limit: 604800, unit: 'day' },
    { limit: 2629800, unit: 'week' },
    { limit: 31557600, unit: 'month' },
  ];

  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  const absolute = Math.abs(diffSeconds);

  for (let index = 0; index < thresholds.length; index += 1) {
    const { limit, unit } = thresholds[index];
    if (absolute < limit) {
      const divisor = index === 0 ? 1 : thresholds[index - 1].limit;
      return formatter.format(Math.round(diffSeconds / divisor), unit);
    }
  }

  return formatter.format(Math.round(diffSeconds / 31557600), 'year');
}

/** mm:ss (or hh:mm:ss for long durations) for exam countdowns. */
export function formatCountdown(milliseconds) {
  const safe = Math.max(0, Math.floor(milliseconds / 1000));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  const pad = (value) => String(value).padStart(2, '0');
  return hours > 0 ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`;
}

export function initialsFrom(name) {
  if (!name) return '?';
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}
