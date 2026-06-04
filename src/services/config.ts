export const Config = {
  SERVICENOW_BASE_URL:
    process.env.EXPO_PUBLIC_SERVICENOW_BASE_URL ??
    'https://altiatekllcdemo1.service-now.com',
  SN_OAUTH_CLIENT_ID: process.env.EXPO_PUBLIC_SN_OAUTH_CLIENT_ID ?? '',
} as const;
