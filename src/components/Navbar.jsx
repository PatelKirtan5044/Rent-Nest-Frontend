import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Bell, Sun, Moon, Inbox, Menu } from 'lucide-react';

const Navbar = ({ onMenuToggle }) => {
  const { user } = useAuth();
  const { notifications, markAllAsRead, clearNotifications } = useSocket();
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light-theme');
    } else {
      document.documentElement.classList.remove('light-theme');
    }
  }, [theme]);

  // Close dropdown on click outside
  useEffect(() => {
    if (!showDropdown) return;
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.notification-btn') && !e.target.closest('.notifications-dropdown')) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [showDropdown]);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
  };

  if (!user) return null;

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header style={styles.navbar}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button onClick={onMenuToggle} style={styles.menuToggleBtn} className="menu-toggle-btn" title="Toggle Menu">
          <Menu size={18} />
        </button>
        <div>
          <h2 style={styles.greeting}>Welcome, {user.name}!</h2>
          <p style={styles.subtext} className="hidden-mobile">Manage your properties, agreements, and payments seamlessly.</p>
        </div>
      </div>

      <div style={styles.actions}>
        <div style={styles.badge} className="hidden-mobile">
          <span style={user.role === 'landlord' ? styles.landlordBadge : styles.tenantBadge}>
            {user.role.toUpperCase()} PORTAL
          </span>
        </div>

        <button onClick={toggleTheme} style={styles.themeBtn} className="theme-btn" title="Toggle Light/Dark Theme">
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>
        
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => {
              setShowDropdown(!showDropdown);
              if (!showDropdown) {
                markAllAsRead();
              }
            }}
            style={styles.notificationBtn}
            className="notification-btn"
            title="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span style={styles.unreadDot}>
                {unreadCount}
              </span>
            )}
          </button>

          {showDropdown && (
            <div style={styles.dropdown} className="glass-panel notifications-dropdown">
              <div style={styles.dropdownHeader}>
                <h4 style={styles.dropdownTitle}>Notifications</h4>
                <div style={styles.dropdownActions}>
                  {notifications.length > 0 && (
                    <>
                      <button onClick={markAllAsRead} style={styles.actionLink} className="action-link-btn">
                        Mark all
                      </button>
                      <span style={styles.actionDivider}>|</span>
                      <button onClick={clearNotifications} style={styles.actionLink} className="action-link-btn">
                        Clear all
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div style={styles.dropdownBody}>
                {notifications.length === 0 ? (
                  <div style={styles.emptyState}>
                    <Inbox size={22} color="var(--text-muted)" style={{ marginBottom: '6px' }} />
                    <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>No new alerts</p>
                  </div>
                ) : (
                  <div style={styles.notificationsList}>
                    {notifications.map((n) => {
                      let itemBg = 'transparent';
                      let barColor = 'var(--primary)';
                      if (!n.read) {
                        itemBg = 'var(--bg-secondary)';
                      }
                      if (n.type === 'success') barColor = '#10b981';
                      else if (n.type === 'warning') barColor = '#f59e0b';
                      else if (n.type === 'danger') barColor = '#ef4444';

                      return (
                        <div
                          key={n.id}
                          style={{
                            ...styles.notificationItem,
                            backgroundColor: itemBg,
                            borderLeftColor: barColor
                          }}
                        >
                          <div style={styles.itemContent}>
                            <p style={{
                              ...styles.itemText,
                              fontWeight: n.read ? '400' : '600',
                              color: n.read ? 'var(--text-secondary)' : 'var(--text-primary)'
                            }}>
                              {n.message}
                            </p>
                            <span style={styles.itemTime}>
                              {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

const styles = {
  navbar: {
    height: 'var(--navbar-height)',
    background: 'var(--bg-glass)',
    backdropFilter: 'blur(8px)',
    borderBottom: '1px solid var(--border-glass)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 30px',
    position: 'sticky',
    top: 0,
    zIndex: 90
  },
  menuToggleBtn: {
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid var(--border-glass)',
    color: 'var(--text-secondary)',
    width: '38px',
    height: '38px',
    borderRadius: '8px',
    display: 'none',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'var(--transition)'
  },
  greeting: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: 'var(--text-primary)'
  },
  subtext: {
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
    marginTop: '2px'
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  },
  badge: {
    display: 'flex',
    alignItems: 'center'
  },
  landlordBadge: {
    fontSize: '0.72rem',
    fontWeight: '800',
    padding: '6px 12px',
    borderRadius: '20px',
    background: 'rgba(59, 130, 246, 0.15)',
    color: '#3b82f6',
    border: '1px solid rgba(59, 130, 246, 0.3)',
    letterSpacing: '0.05em'
  },
  tenantBadge: {
    fontSize: '0.72rem',
    fontWeight: '800',
    padding: '6px 12px',
    borderRadius: '20px',
    background: 'rgba(6, 182, 212, 0.15)',
    color: '#06b6d4',
    border: '1px solid rgba(6, 182, 212, 0.3)',
    letterSpacing: '0.05em'
  },
  themeBtn: {
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid var(--border-glass)',
    color: 'var(--text-secondary)',
    width: '38px',
    height: '38px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'var(--transition)'
  },
  notificationBtn: {
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid var(--border-glass)',
    color: 'var(--text-secondary)',
    width: '38px',
    height: '38px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    position: 'relative',
    transition: 'var(--transition)'
  },
  unreadDot: {
    position: 'absolute',
    top: '-3px',
    right: '-3px',
    width: '18px',
    height: '18px',
    borderRadius: '50%',
    background: 'var(--primary)',
    color: '#ffffff',
    fontSize: '0.68rem',
    fontWeight: '800',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 0 8px var(--primary)'
  },
  dropdown: {
    position: 'absolute',
    top: '48px',
    right: '0',
    width: '300px',
    maxHeight: '360px',
    borderRadius: '12px',
    border: '1px solid var(--border-glass)',
    background: 'var(--bg-glass)',
    backdropFilter: 'blur(16px)',
    boxShadow: 'var(--shadow-lg)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 999
  },
  dropdownHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    borderBottom: '1px solid var(--border-glass)',
    background: 'rgba(0, 0, 0, 0.08)'
  },
  dropdownTitle: {
    margin: 0,
    fontSize: '0.84rem',
    fontWeight: '700',
    color: 'var(--text-primary)'
  },
  dropdownActions: {
    display: 'flex',
    gap: '6px',
    alignItems: 'center'
  },
  actionLink: {
    background: 'none',
    border: 'none',
    color: 'var(--primary)',
    fontSize: '0.7rem',
    cursor: 'pointer',
    padding: 0,
    fontWeight: '700',
    transition: 'color 0.2s'
  },
  actionDivider: {
    color: 'var(--text-muted)',
    fontSize: '0.7rem',
    opacity: 0.5
  },
  dropdownBody: {
    overflowY: 'auto',
    flex: 1,
    display: 'flex',
    flexDirection: 'column'
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '30px 20px',
    textAlign: 'center'
  },
  notificationsList: {
    display: 'flex',
    flexDirection: 'column'
  },
  notificationItem: {
    display: 'flex',
    padding: '12px 16px',
    borderBottom: '1px solid var(--border-glass)',
    borderLeft: '4px solid transparent',
    transition: 'background-color 0.2s',
    textAlign: 'left'
  },
  itemContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  itemText: {
    margin: 0,
    fontSize: '0.78rem',
    lineHeight: '1.4'
  },
  itemTime: {
    fontSize: '0.68rem',
    color: 'var(--text-muted)'
  }
};

export default Navbar;
