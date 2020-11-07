/* eslint-disable @typescript-eslint/no-non-null-assertion, spaced-comment */

/**********************
 * utilities
 *********************/
export const IS_BROWSER = typeof window !== "undefined";
export const IS_PROD = process.env.NODE_ENV === "production";
export const IS_TEST = process.env.NODE_ENV === "test";

/**********************
 * auth
 *********************/

// TS does not like this variable coming out of env
export const SESSION_COOKIE_NAME = "session" as const;

/**
 * session lifetime in milliseconds
 *
 * @default 28800 seconds
 * @default 8 hours
 */
export const SESSION_LIFETIME =
  Number.parseInt(process.env.NEXT_PUBLIC_SESSION_LIFETIME!) * 1000;

export const BATTLENET_CLIENT_ID = process.env.BATTLENET_CLIENT_ID!;
export const BATTLENET_CLIENT_SECRET = process.env.BATTLENET_CLIENT_SECRET!;

export const BATTLE_NET_STATE_COOKIE_NAME = "bnetstateref" as const;

/**********************
 * i18n
 *********************/

/**
 * default cookie name next uses
 */
export const I18N_COOKIE_NAME = "NEXT_LOCALE" as const;

/**
 * string joined by `,` - containing all currently enabled languages
 *
 * @default en_US,de_DE
 */
export const ENABLED_LOCALES = process.env.NEXT_PUBLIC_ENABLED_LOCALES!.split(
  ","
);

/**
 * the fallback language used if:
 * - the users language cannot be inferred
 * - the users language is not supported
 *
 * MUST BE INCLUDED IN ENABLED_LANGUAGES
 *
 * @default en_US
 */
export const FALLBACK_LOCALE = process.env.NEXT_PUBLIC_FALLBACK_LOCALE!;

export const namespaces = [] as const;
export type Namespace = typeof namespaces[number];

/**********************
 * sentry
 *********************/
/**
 * Sentry API endpoint for this project
 */
export const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN!;

/**********************
 * meta
 *********************/
export const BUILD_TIME = new Date().toString();
export const BUILD_TIMESTAMP = Date.now();
