import { create } from 'zustand';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';
import type { AppUser, UserRole } from '../types/User';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

interface AuthState {
  user: AppUser | null;
  session: Session | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  createManagerAccount: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
}

interface UserProfileRow {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  is_active?: boolean | null;
}

function requireSupabase() {
  if (!isSupabaseConfigured) {
    throw { code: 'supabase_not_configured', message: 'Supabase is not configured' };
  }
}

function mapProfile(row: UserProfileRow): AppUser {
  if (row.is_active === false) {
    throw { code: 'account_disabled', message: 'Account disabled' };
  }

  return {
    id: row.id,
    name: row.full_name,
    email: row.email,
    role: roleForEmail(row.email),
  };
}

function roleForEmail(email: string): UserRole {
  return email.trim().toLowerCase() === 'gerant@btq.test' ? 'gerant' : 'vendeur';
}

async function fetchUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('id,full_name,email,role,is_active')
    .eq('id', userId)
    .maybeSingle<UserProfileRow>();

  if (error || !data) {
    throw error ?? { code: 'profile_not_found', message: 'User profile not found' };
  }

  return mapProfile(data);
}

async function assertEmailIsAvailable(email: string) {
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (data) {
    throw { code: 'email_already_exists', message: 'Email already exists' };
  }
}

async function saveUserProfile(user: AppUser) {
  const { error } = await supabase.from('users').insert({
    id: user.id,
    full_name: user.name,
    email: user.email,
    role: roleForEmail(user.email),
    is_active: true,
  });

  if (error) {
    throw error;
  }
}

async function getOrCreateUserProfile(authUser: SupabaseUser) {
  try {
    return await fetchUserProfile(authUser.id);
  } catch (error) {
    const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : '';

    if (code !== 'PGRST116' && code !== 'profile_not_found') {
      throw error;
    }

    const metadata = authUser.user_metadata ?? {};
    const user: AppUser = {
      id: authUser.id,
      name: typeof metadata.name === 'string' ? metadata.name : authUser.email ?? 'Utilisateur',
      email: authUser.email ?? '',
      role: roleForEmail(authUser.email ?? ''),
    };

    await saveUserProfile(user);
    return user;
  }
}

async function activateSignupSession(session: Session | null) {
  if (!session) {
    throw { code: 'email_confirmation_required', message: 'Email confirmation is still enabled in Supabase' };
  }

  const { error } = await supabase.auth.setSession({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  });

  if (error) {
    throw error;
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  loading: false,
  login: async (email, password) => {
    set({ loading: true, user: null, session: null });
    requireSupabase();

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error || !data.user) {
      set({ user: null, session: null, loading: false });
      const authError = error ?? { code: 'invalid_credentials', message: 'Invalid login credentials' };
      throw authError;
    }

    let profile: AppUser;

    try {
      profile = await getOrCreateUserProfile(data.user);
    } catch (profileError) {
      set({ user: null, session: null, loading: false });
      throw profileError;
    }

    set({
      user: profile,
      session: data.session,
      loading: false,
    });
  },
  signup: async (email, password, name) => {
    set({ loading: true });
    requireSupabase();
    const role = roleForEmail(email);
    await assertEmailIsAvailable(email);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, role } },
    });

    if (error) {
      set({ loading: false });
      throw error;
    }

    if (!data.user || !data.session) {
      set({ user: null, session: null, loading: false });
      throw { code: 'email_confirmation_required', message: 'Email confirmation is still enabled in Supabase' };
    }

    await activateSignupSession(data.session);

    const user = {
      id: data.user.id,
      name,
      email,
      role,
    };

    try {
      await saveUserProfile(user);
    } catch (profileError) {
      set({ user: null, session: null, loading: false });
      throw profileError;
    }

    set({
      user,
      session: data.session,
      loading: false,
    });
  },
  createManagerAccount: async (email, password, name) => {
    set({ loading: true });
    requireSupabase();
    const role = roleForEmail(email);
    await assertEmailIsAvailable(email);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, role } },
    });

    if (error) {
      set({ loading: false });
      throw error;
    }

    if (!data.user || !data.session) {
      set({ user: null, session: null, loading: false });
      throw { code: 'email_confirmation_required', message: 'Email confirmation is still enabled in Supabase' };
    }

    await activateSignupSession(data.session);

    const user: AppUser = {
      id: data.user.id,
      name,
      email,
      role,
    };

    try {
      await saveUserProfile(user);
    } catch (profileError) {
      set({ user: null, session: null, loading: false });
      throw profileError;
    }
    set({ user, session: data.session, loading: false });
  },
  logout: async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }

    set({ user: null, session: null });
  },
  restoreSession: async () => {
    if (!isSupabaseConfigured) {
      return;
    }

    const { data } = await supabase.auth.getSession();

    if (data.session?.user) {
      set({
        session: data.session,
        user: await getOrCreateUserProfile(data.session.user),
      });
    }
  },
}));
