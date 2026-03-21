import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LayoutDashboard, Tags, User, LogOut, DollarSign, CreditCard, History, Shield, Menu, X } from "lucide-react";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/installments", label: "Parcelamentos", icon: CreditCard },
  { to: "/history", label: "Histórico", icon: History },
  { to: "/categories", label: "Categorias", icon: Tags },
  { to: "/profile", label: "Perfil", icon: User },
];

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const { profile, logout, impersonating, stopImpersonating } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex">
      {/* Impersonation top bar */}
      {impersonating && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-warning/90 text-warning-foreground text-center py-1.5 text-sm font-medium">
          <Shield className="w-3.5 h-3.5 inline mr-1" />
          Visualizando como: <strong>{impersonating.name}</strong>
          <button onClick={stopImpersonating} className="ml-3 underline hover:no-underline">Voltar à minha conta</button>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className={`w-64 gradient-dark text-primary-foreground flex-col fixed h-full z-20 hidden md:flex ${impersonating ? "mt-8" : ""}`}>
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center"><DollarSign className="w-5 h-5" /></div>
          <span className="text-xl font-bold">FinControl</span>
        </div>
        <nav className="flex-1 px-3 mt-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <Link key={item.to} to={item.to}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive ? "gradient-primary text-primary-foreground" : "text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-deep/50"}`}>
                <item.icon className="w-5 h-5" />{item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-primary-deep/50">
          <div className="flex items-center gap-3 px-2 mb-3">
            <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-sm font-bold">{profile?.name?.charAt(0)?.toUpperCase()}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{profile?.name}</p>
            </div>
          </div>
          <button onClick={() => logout()}
            className="flex items-center gap-2 px-4 py-2 w-full rounded-lg text-sm text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-deep/50 transition-colors">
            <LogOut className="w-4 h-4" />Sair
          </button>
        </div>
      </aside>

      {/* Mobile header bar */}
      <div className={`md:hidden fixed top-0 left-0 right-0 z-30 gradient-dark ${impersonating ? "mt-8" : ""}`}>
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center"><DollarSign className="w-4 h-4 text-primary-foreground" /></div>
            <span className="text-lg font-bold text-primary-foreground">FinControl</span>
          </div>
          <button onClick={() => setMobileOpen(!mobileOpen)} className="text-primary-foreground p-1">
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-20 bg-black/50" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile slide-out menu */}
      <div className={`md:hidden fixed top-0 left-0 h-full w-64 z-40 gradient-dark text-primary-foreground transform transition-transform duration-300 ${mobileOpen ? "translate-x-0" : "-translate-x-full"} ${impersonating ? "pt-8" : ""}`}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center"><DollarSign className="w-5 h-5" /></div>
            <span className="text-xl font-bold">FinControl</span>
          </div>
          <button onClick={() => setMobileOpen(false)} className="text-primary-foreground/70"><X className="w-5 h-5" /></button>
        </div>
        <nav className="px-3 mt-2 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <Link key={item.to} to={item.to} onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive ? "gradient-primary text-primary-foreground" : "text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-deep/50"}`}>
                <item.icon className="w-5 h-5" />{item.label}
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-primary-deep/50">
          <div className="flex items-center gap-3 px-2 mb-3">
            <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-sm font-bold">{profile?.name?.charAt(0)?.toUpperCase()}</div>
            <p className="text-sm font-medium truncate flex-1">{profile?.name}</p>
          </div>
          <button onClick={() => { logout(); setMobileOpen(false); }}
            className="flex items-center gap-2 px-4 py-2 w-full rounded-lg text-sm text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-deep/50 transition-colors">
            <LogOut className="w-4 h-4" />Sair
          </button>
        </div>
      </div>

      <main className={`flex-1 md:ml-64 p-4 md:p-6 pt-16 md:pt-6 ${impersonating ? "mt-8" : ""}`}>{children}</main>
    </div>
  );
};

export default AppLayout;
