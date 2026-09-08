import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { Role } from "../types";
import { Loader2 } from "lucide-react";

interface Props {
  allowedRoles?: Role[];
}

export function ProtectedRoute({ allowedRoles }: Props) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-2 bg-slate-50 text-center px-4">
        <p className="text-lg font-semibold text-slate-800">Akses ditolak</p>
        <p className="text-sm text-slate-500">
          Akun Anda ({user.role}) tidak memiliki izin untuk mengakses halaman ini.
        </p>
      </div>
    );
  }

  return <Outlet />;
}
