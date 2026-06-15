import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AlertTriangle, BarChart3, Boxes, ClipboardList, FileSpreadsheet, Languages, LogOut, Menu, PackagePlus, Settings, ShoppingCart, Tags, Users, WalletCards } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/authStore';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import type { UserRole } from '../../types/User';

interface NavigationLink {
  to: string;
  key: string;
  icon: typeof ShoppingCart;
  roles: UserRole[];
}

const links: NavigationLink[] = [
  { to: '/vente', key: 'sale', icon: ShoppingCart, roles: ['vendeur', 'gerant'] },
  { to: '/produits', key: 'products', icon: Boxes, roles: ['gerant'] },
  { to: '/categories', key: 'categories', icon: Tags, roles: ['gerant'] },
  { to: '/commandes', key: 'orders', icon: ClipboardList, roles: ['vendeur', 'gerant'] },
  { to: '/stock', key: 'stockMovements', icon: PackagePlus, roles: ['gerant'] },
  { to: '/alertes-stock', key: 'stockAlerts', icon: AlertTriangle, roles: ['gerant'] },
  { to: '/dashboard', key: 'dashboard', icon: BarChart3, roles: ['gerant'] },
  { to: '/ventes', key: 'salesReports', icon: FileSpreadsheet, roles: ['gerant'] },
  { to: '/caisse', key: 'cashRegister', icon: WalletCards, roles: ['gerant'] },
  { to: '/utilisateurs', key: 'users', icon: Users, roles: ['gerant'] },
  { to: '/settings', key: 'settings', icon: Settings, roles: ['gerant'] },
];

export function AppLayout() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const pageTitle = links.find((link) => location.pathname.startsWith(link.to))?.key ?? 'appName';

  const switchLanguage = () => {
    void i18n.changeLanguage(i18n.language === 'fr' ? 'ar' : 'fr');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="page-shell">
      <div className="app-grid">
        <aside className="border-r border-slate-900 bg-[#1e1e2e] p-5 text-white shadow-2xl lg:min-h-screen">
          <div className="mb-10 flex items-center gap-3 rounded-2xl bg-white/10 p-3">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-indigo-500 text-xl font-black text-white shadow-lg">B</div>
            <div>
              <p className="text-[18px] font-black tracking-tight text-white">{t('appName')}</p>
              <p className="text-[13px] font-semibold text-slate-300">{user?.role === 'gerant' ? t('manager') : t('seller')}</p>
            </div>
          </div>
          <nav className="grid gap-3">
            {links
              .filter((link) => user && link.roles.includes(user.role))
              .map((link) => {
                const Icon = link.icon;
                return (
                  <NavLink key={link.to} className="sidebar-link" to={link.to}>
                    <Icon size={19} />
                    <span>{t(link.key)}</span>
                  </NavLink>
                );
              })}
          </nav>
        </aside>
        <div className="min-w-0">
          <header className="sticky top-0 z-10 flex min-h-[72px] flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 bg-white/95 px-6 py-4 shadow-sm backdrop-blur">
            <div className="flex items-center gap-3">
              <Menu size={22} className="text-slate-700 lg:hidden" />
              <div>
                <p className="text-sm font-bold uppercase tracking-wide text-indigo-600">{t('appName')}</p>
                <h1 className="text-3xl font-black tracking-tight text-slate-950">{t(pageTitle)}</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" icon={<Languages size={18} />} onClick={switchLanguage}>
                {i18n.language.toUpperCase()}
              </Button>
              {user ? <Avatar name={user.name} /> : null}
              <Button variant="secondary" icon={<LogOut size={18} />} onClick={handleLogout}>
                {t('logout')}
              </Button>
            </div>
          </header>
          <main className="main-panel">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
