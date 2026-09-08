import { type ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface NavItem {
  to: string;
  label: string;
}

interface Props {
  title: string;
  navItems?: NavItem[];
  children: ReactNode;
}

export function AppShell({ title, navItems = [], children }: Props) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white px-4 py-3">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-4">
            <img
              src="/logo-sekolah.png"
              alt="Logo SMKN 2 Padang"
              className="aspect-square h-14 w-14 flex-shrink-0 rounded-full bg-white object-contain p-0.5"
            />
            <div>
              <p className="text-sm font-semibold leading-none text-slate-800">{title}</p>
              <p className="text-xs text-slate-400">
                {user?.fullName} · {user?.role}
              </p>
            </div>
            {navItems.length > 0 && (
              <nav className="ml-4 hidden gap-1 sm:flex">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                        isActive
                          ? "bg-brand-50 text-brand-700"
                          : "text-slate-500 hover:bg-slate-100"
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </nav>
            )}
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200"
          >
            <LogOut className="h-3.5 w-3.5" />
            Keluar
          </button>
        </div>
        {navItems.length > 0 && (
          <nav className="mt-2 flex gap-1 overflow-x-auto sm:hidden">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                    isActive ? "bg-brand-50 text-brand-700" : "text-slate-500 hover:bg-slate-100"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        )}
      </header>
      <main className="mx-auto max-w-6xl p-4">{children}</main>
    </div>
  );
}
