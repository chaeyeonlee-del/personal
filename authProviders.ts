import {
  createSignedInAuthState,
  type AuthProvider,
  type AuthState,
} from './authState.ts';

type SignInProvider = Exclude<AuthProvider, 'guest'>;

type AuthProviderEnv = Record<string, string | undefined>;

type SignedInConnectionInput = {
  accessToken?: string;
  createdAt?: Date;
  email?: string;
  provider: SignInProvider;
  userId: string;
};

export type SignedInConnection = {
  accessToken?: string;
  authState: AuthState;
};

const supabaseAuthUserIdPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isSupabaseAuthUserId(value: unknown): value is string {
  return typeof value === 'string' && supabaseAuthUserIdPattern.test(value);
}

export function createSignedInConnection({
  accessToken,
  createdAt,
  email,
  provider,
  userId,
}: SignedInConnectionInput): SignedInConnection {
  if (!isSupabaseAuthUserId(userId)) {
    throw new Error('Signed-in user id must be a Supabase auth UUID.');
  }

  return {
    accessToken,
    authState: createSignedInAuthState({
      createdAt,
      email,
      provider,
      userId,
    }),
  };
}

function getPreviewUserId(provider: SignInProvider, env: AuthProviderEnv) {
  if (provider === 'apple') {
    return env.EXPO_PUBLIC_APPLE_AUTH_PREVIEW_USER_ID ?? env.EXPO_PUBLIC_AUTH_PREVIEW_USER_ID;
  }

  return env.EXPO_PUBLIC_GOOGLE_AUTH_PREVIEW_USER_ID ?? env.EXPO_PUBLIC_AUTH_PREVIEW_USER_ID;
}

export function getPreviewAuthConnection(
  provider: SignInProvider,
  env: AuthProviderEnv,
  createdAt = new Date(),
): SignedInConnection | null {
  const userId = getPreviewUserId(provider, env);

  if (!isSupabaseAuthUserId(userId)) {
    return null;
  }

  return createSignedInConnection({
    accessToken: env.EXPO_PUBLIC_AUTH_PREVIEW_ACCESS_TOKEN,
    createdAt,
    email: env.EXPO_PUBLIC_AUTH_PREVIEW_EMAIL,
    provider,
    userId,
  });
}
