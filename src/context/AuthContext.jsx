import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { apiFetch } from "../lib/api";

const AuthContext = createContext(null);

/*
 * Permisos disponibles para una marca.
 *
 * Esto nos permite usar:
 *
 * can("canEditCampaigns")
 * can("canSelectCreators")
 * can("canViewResults")
 *
 * desde cualquier página.
 */
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

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = async () => {
    try {
      const data = await apiFetch("/api/auth/me");

      setUser(data.user);
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
      body: JSON.stringify({
        email,
        password,
      }),
    });

    /*
     * /login devuelve información básica.
     *
     * Después pedimos /me para recuperar también
     * memberships y permisos.
     */
    setUser(data.user);

    try {
      const me = await apiFetch("/api/auth/me");

      setUser(me.user);

      return me.user;
    } catch {
      return data.user;
    }
  };

  const logout = async () => {
    try {
      await apiFetch("/api/auth/logout", {
        method: "POST",
      });
    } finally {
      setUser(null);
    }
  };

  /*
   * Por ahora una cuenta BRAND trabaja con
   * una marca principal.
   *
   * La arquitectura permite tener varias
   * memberships en el futuro.
   */
  const membership = useMemo(() => {
    if (
      user?.role !== "BRAND" ||
      !Array.isArray(user?.brandMemberships)
    ) {
      return null;
    }

    return user.brandMemberships[0] ?? null;
  }, [user]);

  /*
   * Objeto de permisos normalizado.
   */
  const permissions = useMemo(() => {
    /*
     * STAFF tiene acceso completo.
     *
     * Aunque actualmente STAFF utiliza /admin,
     * dejamos el helper preparado.
     */
    if (user?.role === "STAFF") {
      return Object.fromEntries(
        Object.keys(EMPTY_PERMISSIONS).map(
          (permission) => [permission, true]
        )
      );
    }

    if (
      user?.role !== "BRAND" ||
      !membership
    ) {
      return EMPTY_PERMISSIONS;
    }

    return Object.fromEntries(
      Object.keys(EMPTY_PERMISSIONS).map(
        (permission) => [
          permission,
          Boolean(membership[permission]),
        ]
      )
    );
  }, [user, membership]);

  /*
   * Helper principal.
   *
   * Ejemplo:
   *
   * if (can("canEditCampaigns")) { ... }
   */
  const can = (permission) => {
    if (user?.role === "STAFF") {
      return true;
    }

    return Boolean(
      permissions?.[permission]
    );
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
    throw new Error(
      "useAuth debe utilizarse dentro de AuthProvider."
    );
  }

  return context;
}