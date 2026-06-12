export type AuthProvider = 'apple' | 'google' | 'guest';

export type AuthUser = {
  auth_provider: AuthProvider;
  created_at: string;
  email?: string;
  user_id: string;
};

export type GuestAuthUser = AuthUser & {
  auth_provider: 'guest';
};

export type SignedInAuthUser = AuthUser & {
  auth_provider: 'apple' | 'google';
};

export type AuthState =
  | {
      status: 'guest';
      user: GuestAuthUser;
    }
  | {
      status: 'signed-in';
      user: SignedInAuthUser;
    };

export function createGuestAuthState(userId: string, createdAt = new Date()): AuthState {
  return {
    status: 'guest',
    user: {
      auth_provider: 'guest',
      created_at: createdAt.toISOString(),
      user_id: userId,
    },
  };
}

export function createSignedInAuthState({
  createdAt = new Date(),
  email,
  provider,
  userId,
}: {
  createdAt?: Date;
  email?: string;
  provider: Exclude<AuthProvider, 'guest'>;
  userId: string;
}): AuthState {
  return {
    status: 'signed-in',
    user: {
      auth_provider: provider,
      created_at: createdAt.toISOString(),
      email,
      user_id: userId,
    },
  };
}

export function isAuthState(value: unknown): value is AuthState {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<AuthState>;
  const user = candidate.user;

  if (!user || typeof user !== 'object') {
    return false;
  }

  const userCandidate = user as Partial<AuthUser>;

  if (
    typeof userCandidate.created_at !== 'string' ||
    typeof userCandidate.user_id !== 'string' ||
    !['apple', 'google', 'guest'].includes(userCandidate.auth_provider ?? '')
  ) {
    return false;
  }

  if (candidate.status === 'guest') {
    return userCandidate.auth_provider === 'guest';
  }

  if (candidate.status === 'signed-in') {
    return userCandidate.auth_provider === 'apple' || userCandidate.auth_provider === 'google';
  }

  return false;
}

export function shouldOfferLogin(authState: AuthState) {
  return authState.status === 'guest';
}
