import { FormEvent, useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { ChevronDown, LayoutDashboard, LogOut, Moon, Package, Pencil, ShoppingCart, Store, Sun, Users } from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import { useThemeStore } from '../../store/theme.store';
import { authApi } from '../../api/auth.api';
import Modal from '../ui/Modal';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/products', label: 'Products', icon: Package },
  { to: '/customers', label: 'Customers', icon: Users },
  { to: '/sales', label: 'Sales', icon: ShoppingCart }
];

const initials = (name: string) =>
  name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('');

export default function AppShell({ children }: { children: ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const updateUser = useAuthStore((s) => s.updateUser);
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const [showEditModal, setShowEditModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', shopName: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const onLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const openEditModal = () => {
    setForm({ name: user?.name || '', email: user?.email || '', shopName: user?.shopName || '' });
    setError(null);
    setMenuOpen(false);
    setShowEditModal(true);
  };

  const submitEdit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const updated = await authApi.updateProfile({
        name: form.name.trim(),
        email: form.email.trim(),
        shopName: form.shopName.trim()
      });
      updateUser(updated);
      setShowEditModal(false);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Could not update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <Link to="/dashboard" className="brand">
          <span className="brand-mark"><Store size={18} /></span>
          <span className="brand-text">
            <span className="brand-title">ShopManager Pro</span>
            <span className="brand-subtitle">{user?.shopName || 'Retail operations workspace'}</span>
          </span>
        </Link>
        <nav className="nav">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}>
              <Icon size={17} strokeWidth={2} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="profile-menu" ref={menuRef}>
          {menuOpen && (
            <div className="profile-menu-popover">
              <div className="profile-header">
                <span className="profile-header-avatar">{initials(user?.name || 'A')}</span>
                <div className="profile-header-info">
                  <span className="profile-header-name">{user?.name || 'Account'}</span>
                  <span className="profile-header-email">{user?.email || ''}</span>
                </div>
                <button type="button" className="profile-edit-btn" onClick={openEditModal} aria-label="Edit profile">
                  <Pencil size={14} />
                </button>
              </div>

              <div className="profile-divider" />

              <button className="profile-menu-item" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                {theme === 'dark' ? 'Light mode' : 'Dark mode'}
              </button>

              <div className="profile-divider" />

              <button className="profile-menu-item profile-menu-item-danger" onClick={onLogout}>
                <LogOut size={16} /> Logout
              </button>
            </div>
          )}
          <button className="profile-trigger" onClick={() => setMenuOpen((v) => !v)}>
            <span className="profile-avatar">{initials(user?.name || 'A')}</span>
            <ChevronDown size={15} />
          </button>
        </div>
      </aside>
      <main className="app-main">{children ?? <Outlet />}</main>

      {showEditModal && (
        <Modal title="Edit Profile" onClose={() => setShowEditModal(false)}>
          <form onSubmit={submitEdit} className="stack">
            <label className="field">
              <span className="field-label">Name</span>
              <input autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </label>
            <label className="field">
              <span className="field-label">Email</span>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </label>
            <label className="field">
              <span className="field-label">Shop Name</span>
              <input value={form.shopName} onChange={(e) => setForm({ ...form, shopName: e.target.value })} required />
            </label>
            {error && <p className="field-error">{error}</p>}
            <div className="split-actions">
              <button type="button" className="button-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
              <button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
