import { NavLink } from "react-router-dom";
import { Wallet, Tags, PiggyBank, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const links = [
  { to: "/dashboard", label: "Transactions", icon: Wallet },
  { to: "/categories", label: "Categories", icon:  Tags },
  { to: "/savings-goals", label: "Savings Goals", icon: PiggyBank },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <Wallet size={20} />
          Trackly
        </div>
        <div className="sidebar-accent-bar" />
        <nav className="sidebar-nav">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) => "sidebar-link" + (isActive ? " active" : "")}
              >
                <Icon size={16} />
                {link.label}
              </NavLink>
            );
          })}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user">{user?.email}</div>
          <button className="btn btn-secondary btn-sm" onClick={logout} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <LogOut size={14} />
            Log out
          </button>
        </div>
      </aside>
      <main className="main">
        <div className="page-container">{children}</div>
      </main>
    </div>
  );
}
