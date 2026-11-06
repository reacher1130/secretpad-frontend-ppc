/**
 * Demo-only authentication switch.
 *
 * Umi replaces this identifier at build time from
 * SECRET_PAD_DEMO_AUTH_DISABLED.  Keep the default false in source so a
 * production build cannot silently become unauthenticated.
 */
declare const __SECRET_PAD_DEMO_AUTH_DISABLED__: boolean | undefined;

export const DEMO_AUTH_DISABLED =
  typeof __SECRET_PAD_DEMO_AUTH_DISABLED__ !== 'undefined' &&
  __SECRET_PAD_DEMO_AUTH_DISABLED__ === true;
