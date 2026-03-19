import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LayoutDashboard, Tags, User, LogOut, DollarSign, CreditCard, History } from "lucide-react";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/installments", label: "Parcelamentos", icon: CreditCard },
  { to: "/history", label: "Histórico", icon: History },
  { to: "/categories", label: "Categorias", icon: Tags },
  { to: "/profile", label: "Perfil", icon: User },
];

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 gradient-dark text-primary-foreground flex flex-col fixed h-full z-10 max-md:hidden">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
          <span className="text-xl font-bold">FinControl</span>
        </div>

        <nav className="flex-1 px-3 mt-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "gradient-primary text-primary-foreground"
                    : "text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-deep/50"
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-primary-deep/50">
          <div className="flex items-center gap-3 px-2 mb-3">
            <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-sm font-bold">
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-primary-foreground/60 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 w-full rounded-lg text-sm text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-deep/50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-10 gradient-dark">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-primary-foreground">FinControl</span>
          </div>
        </div>
        <nav className="flex gap-1 px-3 pb-3">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isActive ? "gradient-primary text-primary-foreground" : "text-primary-foreground/60"
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
          <button
            onClick={logout}
            className="flex-1 flex flex-col items-center gap-1 py-2 rounded-lg text-xs font-medium text-primary-foreground/60"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </nav>
      </div>

      {/* Main content */}
      <main className="flex-1 md:ml-64 p-6 max-md:pt-28">
        {children}
      </main>
    </div>
  );
};

export default AppLayout;
