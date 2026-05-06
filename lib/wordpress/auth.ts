import "server-only";

// Reads WordPress credentials from environment variables and produces the
// Basic auth header used by the WordPress REST API.

export interface WordPressCredentials {
  username: string;
  appPassword: string;
  baseUrl: string;
}

export function getWordPressCredentials(): WordPressCredentials {
  const username = process.env.WORDPRESS_USERNAME;
  const appPassword = process.env.WORDPRESS_APP_PASSWORD;
  const baseUrl = process.env.WORDPRESS_BASE_URL;

  if (!username || !appPassword || !baseUrl) {
    throw new Error(
      "Missing WordPress credentials. Set WORDPRESS_USERNAME, WORDPRESS_APP_PASSWORD and WORDPRESS_BASE_URL."
    );
  }

  return {
    username,
    appPassword,
    baseUrl: baseUrl.replace(/\/+$/, ""),
  };
}

export function getWordPressAuthHeader(
  credentials: WordPressCredentials = getWordPressCredentials()
): string {
  const token = Buffer.from(
    `${credentials.username}:${credentials.appPassword}`
  ).toString("base64");
  return `Basic ${token}`;
}
