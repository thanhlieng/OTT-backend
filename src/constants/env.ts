export const env = {
  IS_IN_PRODUCTION: process.env.NODE_ENV === 'production',
  NEXTAUTH_URL: process.env.NEXTAUTH_URL as string,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET as string,
  JWT_SECRET: process.env.NEXTAUTH_SECRET as string,
  GITHUB_ID: process.env.GITHUB_ID as string,
  GITHUB_SECRET: process.env.GITHUB_SECRET as string,
  GOOGLE_ID: process.env.GOOGLE_ID as string,
  GOOGLE_SECRET: process.env.GOOGLE_SECRET as string,
  GITLAB_ID: process.env.GITLAB_ID as string,
  GITLAB_SECRET: process.env.GITLAB_SECRET as string,
  APPLE_ID: process.env.APPLE_ID as string,
  APPLE_SECRET: process.env.APPLE_SECRET as string,
  SLACK_ID: process.env.SLACK_ID as string,
  SLACK_SECRET: process.env.SLACK_SECRET as string,
  SECRET: process.env.SECRET as string,
  MYSQL_URI: process.env.MYSQL_URI as string,
  SUPPER_ADMIN_EMAIL: process.env.SUPPER_ADMIN_EMAIL as string,
  // Bluesea
  BLUESEA_RECORD: process.env.BLUESEA_RECORD == 'true',
  BLUESEA_TOKEN: (process.env.BLUESEA_TOKEN as string) || '',
  BLUESEA_API: (process.env.BLUESEA_API as string) || '',
  BLUESEA_GATEWAYS: ((process.env.BLUESEA_GATEWAYS as string) || '').split(';'),
  // Push
  PUSH_CALLBACK_ENDPOINT: (process.env.PUSH_CALLBACK_ENDPOINT as string) || '',
  PUSH_TIMEOUT: parseInt((process.env.PUSH_TIMEOUT as string) || '9000'),
  APPLE_PUSH_P12: Buffer.from((process.env.APPLE_PUSH_P12_BASE64 as string) || '', 'base64'),
  APPLE_PUSH_TOPIC: (process.env.APPLE_PUSH_TOPIC as string) || 'bluesea.samples.calling.voip',
  SIP_PUSH_API: (process.env.SIP_PUSH_API as string) || 'http://localhost:10001',
  SIP_PUSH_TOKEN: (process.env.SIP_PUSH_TOKEN as string) || 'test',
  SIP_SERVICE_TOKEN: (process.env.SIP_SERVICE_TOKEN as string) || 'test',
  // Hook Token
  HOOK_TOKEN: (process.env.HOOK_TOKEN as string) || 'hook-token',
} as const