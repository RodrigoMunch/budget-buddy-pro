import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User as SupabaseUser, Session } from "@supabase/supabase-js";

interface Profile {
  id: string;
  user_id: string;
  name: string;
  total_limit: number;
}

interface AuthContextType {
  user: SupabaseUser | null;
  session: Session | null;
  profile: Profile | null;
  isAdmin: boolean;
  loading: boolean;
  impersonating: Profile | null;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ error?: string }>;
  
  logout: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<void>;
  impersonateUser: (email: string) => Promise<{ error?: string }>;
  stopImpersonating: () => void;
  activeProfile: Profile | null; // either impersonated or own profile
  activeUserId: string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [impersonating, setImpersonating] = useState<Profile | null>(null);

  const activeProfile = impersonating || profile;
  const activeUserId = impersonating?.user_id || user?.id || null;

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();
    if (data) setProfile(data as Profile);
  };

  const fetchRole = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    setIsAdmin(data?.some((r: any) => r.role === "admin") || false);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          // Use setTimeout to avoid potential deadlocks with Supabase auth
          setTimeout(async () => {
            await fetchProfile(session.user.id);
            await fetchRole(session.user.id);
            setLoading(false);
          }, 0);
        } else {
          setProfile(null);
          setIsAdmin(false);
          setImpersonating(null);
          setLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id).then(() =>
          fetchRole(session.user.id).then(() => setLoading(false))
        );
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return {};
  };

  const register = async (name: string, email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name }, emailRedirectTo: window.location.origin },
    });
    if (error) return { error: error.message };
    return {};
  };


  const logout = async () => {
    setImpersonating(null);
    await supabase.auth.signOut();
  };

  const updateProfile = async (data: Partial<Profile>) => {
    if (!user) return;
    await supabase
      .from("profiles")
      .update({ name: data.name, total_limit: data.total_limit })
      .eq("user_id", user.id);
    await fetchProfile(user.id);
  };

  const impersonateUser = async (email: string) => {
    if (!isAdmin) return { error: "Sem permissão" };
    const { data, error } = await supabase.rpc("get_user_by_email", { _email: email });
    if (error || !data || (data as any[]).length === 0) return { error: "Usuário não encontrado" };
    const target = (data as any[])[0];
    // Fetch full profile
    const { data: prof } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", target.user_id)
      .single();
    if (prof) setImpersonating(prof as Profile);
    return {};
  };

  const stopImpersonating = () => setImpersonating(null);

  return (
    <AuthContext.Provider
      value={{
        user, session, profile, isAdmin, loading,
        impersonating, activeProfile, activeUserId,
        login, register, logout,
        updateProfile, impersonateUser, stopImpersonating,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
