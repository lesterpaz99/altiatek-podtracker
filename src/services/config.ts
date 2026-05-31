export const Config = {
  SERVICENOW_BASE_URL:
    process.env.EXPO_PUBLIC_SERVICENOW_BASE_URL ??
    'https://altiatekllcdemo1.service-now.com',
  SN_USERNAME: process.env.EXPO_PUBLIC_SN_USERNAME ?? '',
  SN_PASSWORD: process.env.EXPO_PUBLIC_SN_PASSWORD ?? '',
} as const;
