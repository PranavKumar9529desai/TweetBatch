export interface Bindings {
  DATABASE_URL: string;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  TWITTER_CLIENT_ID: string;
  TWITTER_CLIENT_SECRET: string;
  QSTASH_TOKEN: string;
  QSTASH_CURRENT_SIGNING_KEY: string;
  QSTASH_NEXT_SIGNING_KEY: string;
  BACKEND_URL: string;
  FRONTEND_URL: string;
}

export type Variables = {
  user: {
    id: string;
    email: string;
    emailVerified: boolean;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    image?: string | null;
  } | null;
  session: {
    id: string;
    expiresAt: Date;
    token: string;
    createdAt: Date;
    updatedAt: Date;
    ipAddress?: string | null;
    userAgent?: string | null;
    userId: string;
  } | null;
};
