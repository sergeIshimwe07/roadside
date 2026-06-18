import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isAdmin: boolean;
  isSubscribed: boolean;
  loading: boolean;
  accessLoading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
  resolvePostLoginPath: () => Promise<string>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [accessLoading, setAccessLoading] = useState(false);

  const checkAdmin = async (userId: string): Promise<boolean> => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    const admin = !!data;
    setIsAdmin(admin);
    return admin;
  };

  const checkSubscription = async (userId: string): Promise<boolean> => {
    const { data } = await supabase
      .from("profiles")
      .select("subscription_active, subscription_expires_at")
      .eq("user_id", userId)
      .maybeSingle();
    if (data) {
      const active =
        data.subscription_active &&
        (!data.subscription_expires_at || new Date(data.subscription_expires_at) > new Date());
      setIsSubscribed(!!active);
      return !!active;
    }
    setIsSubscribed(false);
    return false;
  };

  const loadUserAccess = useCallback(async (userId: string) => {
    setAccessLoading(true);
    try {
      await Promise.all([checkAdmin(userId), checkSubscription(userId)]);
    } finally {
      setAccessLoading(false);
    }
  }, []);

  const refreshSubscription = async () => {
    if (user) await checkSubscription(user.id);
  };

  const resolvePostLoginPath = useCallback(async (): Promise<string> => {
    if (!user) return "/auth";
    const [admin, subscribed] = await Promise.all([
      checkAdmin(user.id),
      checkSubscription(user.id),
    ]);
    return admin || subscribed ? "/" : "/payment";
  }, [user]);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await loadUserAccess(session.user.id);
      } else {
        setIsAdmin(false);
        setIsSubscribed(false);
        setAccessLoading(false);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await loadUserAccess(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [loadUserAccess]);

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: window.location.origin,
      },
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        isAdmin,
        isSubscribed,
        loading,
        accessLoading,
        signUp,
        signIn,
        signOut,
        refreshSubscription,
        resolvePostLoginPath,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
