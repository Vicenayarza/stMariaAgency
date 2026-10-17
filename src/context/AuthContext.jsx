import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { apiFetch } from "../lib/api";

const AuthContext = createContext(null);

const EMPTY_PERMISSIONS = {
  canViewCampaigns: false,
  canCreateCampaigns: false,
  canEditCampaigns: false,
  canViewProposals: false,
  canApproveCreators: false,
  canViewDeliverables: false,
  canApproveContent: false,
  canViewResults: false,
  canExportReports: false,
  canDiscoverCreators: false,
  canContactCreators: false,
  canSelectCreators: false,
};

// Acciones reservadas a marcas que gestionan directamente sus campañas.
// La aprobación de propuestas NO se restringe aquí: también puede
// corresponder a una marca gestionada por la agencia.
const SELF_MANAGED_ONLY = new Set([
  "canCreateCampaigns",
  "canEditCampaigns",
  "canDiscoverCreators",
  "canContactCreators",
  "canSelectCreators",
]);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = async () => {
    try {
      const data = await apiFetch("/api/auth/me");
      setUser(data.user ?? null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  const login = async (email, password) => {
    const data = await apiFetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    setUser(data.user ?? null);

    try {
      const me = await apiFetch("/api/auth/me");
      setUser(me.user ?? null);
      return me.user;
    } catch {
      return data.user;
    }
  };

  const logout = async () => {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } finally {
      setUser(null);
    }
  };

  const membership = useMemo(() => {
    if (user?.role !== "BRAND" || !Array.isArray(user.brandMemberships)) {
      return null;
    }
    return user.brandMemberships[0] ?? null;
  }, [user]);

  const accessMode = membership?.brand?.accessMode;

  const permissions = useMemo(() => {
    if (user?.role === "STAFF") {
      return Object.fromEntries(
        Object.keys(EMPTY_PERMISSIONS).map((permission) => [permission, true])
      );
    }

    if (user?.role !== "BRAND" || !membership) {
      return EMPTY_PERMISSIONS;
    }

    return Object.fromEntries(
      Object.keys(EMPTY_PERMISSIONS).map((permission) => {
        const granted = membership[permission] === true;
        const allowedByMode =
          !SELF_MANAGED_ONLY.has(permission) || accessMode === "SELF_MANAGED";
        return [permission, granted && allowedByMode];
      })
    );
  }, [user, membership, accessMode]);

  const can = (permission) => {
    if (!Object.prototype.hasOwnProperty.call(EMPTY_PERMISSIONS, permission)) {
      return false;
    }
    return permissions[permission] === true;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        refreshUser: loadUser,
        membership,
        permissions,
        can,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe utilizarse dentro de AuthProvider.");
  }
  return context;
}
