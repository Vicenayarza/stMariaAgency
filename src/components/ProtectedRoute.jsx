import {
  Navigate,
  Outlet,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";

function ProtectedRoute({
  allowedRoles,
  permission,
}) {
  const {
    user,
    loading,
    can,
  } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f5f2]">
        <div className="text-[10px] uppercase tracking-[0.18em] text-black/40">
          Cargando ST.MARY AGENCY ...
        </div>
      </div>
    );
  }

  /*
   * No autenticado.
   */
  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  /*
   * Rol incorrecto.
   */
  if (
    allowedRoles &&
    !allowedRoles.includes(user.role)
  ) {
    if (user.role === "BRAND") {
      return (
        <Navigate
          to="/platform"
          replace
        />
      );
    }

    if (user.role === "CREATOR") {
      return (
        <Navigate
          to="/creator"
          replace
        />
      );
    }

    if (user.role === "STAFF") {
      return (
        <Navigate
          to="/admin"
          replace
        />
      );
    }

    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  /*
   * Permiso insuficiente.
   *
   * Por ahora redirigimos al dashboard.
   * Más adelante podemos crear una página 403.
   */
  if (
    permission &&
    !can(permission)
  ) {
    if (user.role === "BRAND") {
      return (
        <Navigate
          to="/platform"
          replace
        />
      );
    }

    if (user.role === "CREATOR") {
      return (
        <Navigate
          to="/creator"
          replace
        />
      );
    }

    if (user.role === "STAFF") {
      return (
        <Navigate
          to="/admin"
          replace
        />
      );
    }

    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  return <Outlet />;
}

export default ProtectedRoute;