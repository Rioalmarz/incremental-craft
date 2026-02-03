import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { authService, AuthUser } from "@/services/authService";
import { api } from "@/lib/api";

type UserRole = "admin" | "physician" | "viewer" | null;

// Profile interface for backward compatibility
interface Profile {
  id: string;
  user_id: string;
  username: string;
  name_ar: string | null;
  center_id: string | null;
  created_at: string;
  job_title: string | null;
  team: string | null;
  avatar_url: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (username: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isPhysician: boolean;
  isViewer: boolean;
  isSuperAdmin: boolean; // Backward compatibility
  isCenter: boolean; // Backward compatibility
  canEdit: boolean;
  role: UserRole;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error("Error restoring session:", error);
        api.clearToken();
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  const signIn = useCallback(async (username: string, password: string) => {
    try {
      const response = await authService.login({ username, password });
      setUser(response.user);
      return { error: null };
    } catch (error) {
      console.error("Login error:", error);
      return { error: error as Error };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
    }
  }, []);

  // Convert AuthUser to Profile for backward compatibility
  const profile: Profile | null = user ? {
    id: user.id,
    user_id: user.id,
    username: user.username,
    name_ar: user.name_ar,
    center_id: user.center_id || null,
    created_at: new Date().toISOString(),
    job_title: user.job_title || null,
    team: user.team_id ? `team${user.team_id}` : null,
    avatar_url: user.avatar_url || null,
  } : null;

  const value: AuthContextType = {
    user,
    profile,
    loading,
    signIn,
    signOut,
    isAdmin: user?.role === "admin",
    isPhysician: user?.role === "physician",
    isViewer: user?.role === "viewer",
    isSuperAdmin: user?.role === "admin", // Backward compatibility
    isCenter: user?.role === "physician" || user?.role === "viewer", // Backward compatibility
    canEdit: user?.role === "admin" || user?.role === "physician",
    role: user?.role || null,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
