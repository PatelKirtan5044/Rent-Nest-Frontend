import { NavLink } from 'react-router-dom';
import { useAuth, BASE_URL } from '../context/AuthContext';
import { Home, Building, FileText, CreditCard, Wrench, LogOut, Compass, ClipboardList } from 'lucide-react';
import LogoIcon from './LogoIcon';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();

  if (!user) return null;

  const landlordLinks = [
    { to: '/', label: 'Dashboard', icon: Home },
    { to: '/properties', label: 'Properties', icon: Building },
    { to: '/applications', label: 'Applications', icon: ClipboardList },
    { to: '/agreements', label: 'Agreements', icon: FileText },
    { to: '/payments', label: 'Rent Payments', icon: CreditCard },
    { to: '/maintenance', label: 'Maintenance', icon: Wrench }
  ];

  const tenantLinks = [
    { to: '/', label: 'Dashboard', icon: Home },
    { to: '/properties', label: 'Browse Properties', icon: Compass },
    { to: '/applications', label: 'My Applications', icon: ClipboardList },
    { to: '/agreements', label: 'My Agreement', icon: FileText },
    { to: '/payments', label: 'Rent Payments', icon: CreditCard },
    { to: '/maintenance', label: 'Maintenance', icon: Wrench }
  ];

  const links = user.role === 'landlord' ? landlordLinks : tenantLinks;

  return (
    <div className={`sidebar-container ${isOpen ? 'open' : ''}`} style={styles.sidebar}>
      {/* Brand Logo */}
      <div style={styles.brand}>
        <LogoIcon size={44} />
        <div style={styles.brandName}>
          <span style={styles.brandWhite}>Rent</span>
          <span style={styles.brandAccent}>Nest</span>
        </div>
      </div>

      {/* Nav List */}
      <nav style={styles.nav}>
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => {
                if (onClose) onClose();
              }}
              style={({ isActive }) => ({
                ...styles.navLink,
                ...(isActive ? styles.navLinkActive : {})
              })}
            >
              <Icon size={18} />
              <span>{link.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer / User info */}
      <div style={styles.footer}>
        <div style={styles.userInfo}>
          <div style={styles.userAvatar}>
            {user.profilePicture ? (
              <img src={`${BASE_URL}${user.profilePicture}`} alt="Avatar" style={styles.avatarImg} />
            ) : (
              user.name.charAt(0).toUpperCase()
            )}
          </div>
          <div style={styles.userMeta}>
            <div style={styles.userName}>{user.name}</div>
            <div style={styles.userRole}>{user.role.toUpperCase()}</div>
          </div>
        </div>
        <button onClick={logout} style={styles.logoutBtn} className="logout-btn">
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

const styles = {
  sidebar: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: 'var(--sidebar-width)',
    height: '100vh',
    background: 'var(--bg-secondary)',
    borderRight: '1px solid var(--border-glass)',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 100
  },
  brand: {
    height: 'var(--navbar-height)',
    display: 'flex',
    alignItems: 'center',
    padding: '0 24px',
    gap: '12px',
    borderBottom: '1px solid var(--border-glass)'
  },
  logoIcon: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    background: 'var(--primary-gradient)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '0.8rem',
    color: '#fff'
  },
  brandName: {
    fontSize: '1.2rem',
    fontWeight: 800,
    letterSpacing: '-0.02em'
  },
  brandWhite: {
    color: 'var(--text-primary)'
  },
  brandAccent: {
    background: 'var(--primary-gradient)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent'
  },
  nav: {
    flex: 1,
    padding: '24px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '12px 16px',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-secondary)',
    fontWeight: '600',
    fontSize: '0.92rem',
    transition: 'var(--transition)'
  },
  navLinkActive: {
    background: 'rgba(99, 102, 241, 0.15)',
    color: 'var(--text-primary)',
    borderLeft: '3px solid var(--primary)'
  },
  footer: {
    padding: '24px 16px',
    borderTop: '1px solid var(--border-glass)',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  userAvatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: 'var(--bg-glass)',
    border: '1px solid var(--border-glass)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.1rem',
    fontWeight: 'bold',
    color: 'var(--primary)',
    overflow: 'hidden'
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  userMeta: {
    display: 'flex',
    flexDirection: 'column'
  },
  userName: {
    fontSize: '0.9rem',
    fontWeight: '700',
    color: 'var(--text-primary)'
  },
  userRole: {
    fontSize: '0.7rem',
    fontWeight: '800',
    color: 'var(--text-muted)',
    marginTop: '2px'
  },
  logoutBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: '600',
    padding: '8px 12px',
    borderRadius: 'var(--radius-sm)',
    transition: 'var(--transition)',
    textAlign: 'left',
    width: '100%'
  }
};

export default Sidebar;
