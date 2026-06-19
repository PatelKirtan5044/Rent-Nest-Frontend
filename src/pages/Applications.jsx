import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { ClipboardList, CheckCircle, XCircle, Clock, IndianRupee, User, ShieldCheck, Mail, Calendar, FileText, MessageSquare } from 'lucide-react';

const Applications = () => {
  const { user, apiFetch } = useAuth();
  const { addToast } = useSocket();

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);
  const [filter, setFilter] = useState('all'); // all, pending, approved, rejected
  const [actionLoading, setActionLoading] = useState(false);

  const fetchApplications = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await apiFetch('/properties/applications');
      if (res.success) {
        setApplications(res.data.applications);
        
        // Auto-select first application if none selected or to update reference
        if (res.data.applications.length > 0) {
          setSelectedApp(prev => {
            const updated = res.data.applications.find(a => a._id === prev?._id);
            return updated || res.data.applications[0];
          });
        } else {
          setSelectedApp(null);
        }
      }
    } catch (err) {
      console.error(err);
      addToast('Error fetching applications.', 'danger');
    } finally {
      setLoading(false);
    }
  }, [apiFetch, user, addToast]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleStatusUpdate = async (appId, newStatus) => {
    try {
      setActionLoading(true);
      const res = await apiFetch(`/properties/applications/${appId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });

      if (res.success) {
        addToast(`Application was successfully ${newStatus}!`, 'success');
        // Refresh listings
        await fetchApplications();
      }
    } catch (err) {
      addToast(err.message || 'Failed to update application status.', 'danger');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredApps = applications.filter((app) => {
    if (filter === 'all') return true;
    return app.status === filter;
  });

  return (
    <div className="page-container">
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Rental Applications</h1>
          <p style={styles.subtitle}>
            {user.role === 'landlord'
              ? 'Screen candidates, check credit scores/incomes, and approve tenancy contracts.'
              : 'Monitor the status of your submitted residential rental requests.'}
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={styles.tabsContainer} className="applications-tabs-container">
        {['all', 'pending', 'approved', 'rejected'].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            style={{
              ...styles.tabBtn,
              ...(filter === tab ? styles.tabBtnActive : {})
            }}
          >
            <span style={{ textTransform: 'capitalize' }}>{tab}</span>
            <span style={styles.tabCount}>
              {tab === 'all'
                ? applications.length
                : applications.filter(a => a.status === tab).length}
            </span>
          </button>
        ))}
      </div>

      {/* Grid Layout */}
      {loading ? (
        <div style={styles.loading}>Loading application files...</div>
      ) : (
        <div className="split-layout-grid">
          {/* Applications list */}
          <div className="glass-panel split-list-panel">
            <h3 style={styles.panelTitle}>Submissions</h3>
            <div style={styles.listContainer}>
              {filteredApps.length > 0 ? (
                filteredApps.map((app) => (
                  <div
                    key={app._id}
                    onClick={() => setSelectedApp(app)}
                    style={{
                      ...styles.listItem,
                      ...(selectedApp?._id === app._id ? styles.listItemActive : {})
                    }}
                  >
                    <div style={styles.listIconContainer}>
                      <ClipboardList size={20} color="var(--primary)" />
                    </div>
                    <div style={styles.listMain}>
                      <div style={styles.listTitle}>
                        {user.role === 'landlord' ? app.tenant?.name : app.property?.title}
                      </div>
                      <div style={styles.listSub}>
                        {user.role === 'landlord' ? app.property?.title : `Landlord: ${app.property?.landlord?.name || 'Assigned'}`}
                      </div>
                    </div>
                    <div style={styles.listRight}>
                      <span className={`badge badge-${app.status === 'approved' ? 'success' : app.status === 'pending' ? 'warning' : 'danger'}`}>
                        {app.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div style={styles.noData}>No applications found.</div>
              )}
            </div>
          </div>

          {/* Details / Screen Info */}
          <div className="glass-panel split-detail-panel">
            {selectedApp ? (
              <div style={styles.detailsContainer}>
                {/* Header */}
                <div style={styles.detailsHeader}>
                  <div>
                    <h3 style={styles.detailsTitle}>
                      {user.role === 'landlord' ? `Applicant: ${selectedApp.tenant?.name}` : `Property: ${selectedApp.property?.title}`}
                    </h3>
                    <p style={styles.detailsId}>Application ID: {selectedApp._id}</p>
                  </div>
                  <span className={`badge badge-${selectedApp.status === 'approved' ? 'success' : selectedApp.status === 'pending' ? 'warning' : 'danger'}`} style={{ fontSize: '0.85rem', padding: '6px 12px' }}>
                    {selectedApp.status.toUpperCase()}
                  </span>
                </div>

                <div style={styles.divider} />

                {/* Info Cards Grid */}
                <div style={styles.infoGrid}>
                  <div style={styles.infoCard}>
                    <IndianRupee size={18} color="var(--success)" />
                    <div>
                      <div style={styles.infoLabel}>Monthly Income</div>
                      <div style={styles.infoVal}>₹{selectedApp.incomeDetails}</div>
                    </div>
                  </div>
                  <div style={styles.infoCard}>
                    <ShieldCheck size={18} color="var(--primary)" />
                    <div>
                      <div style={styles.infoLabel}>Credit Score</div>
                      <div style={styles.infoVal}>{selectedApp.creditScore}</div>
                    </div>
                  </div>
                  <div style={styles.infoCard}>
                    <Calendar size={18} color="var(--text-secondary)" />
                    <div>
                      <div style={styles.infoLabel}>Agreement Term</div>
                      <div style={styles.infoVal}>{selectedApp.leaseTermMonths} Months</div>
                    </div>
                  </div>
                  <div style={styles.infoCard}>
                    <Calendar size={18} color="var(--text-secondary)" />
                    <div>
                      <div style={styles.infoLabel}>Proposed Move-in</div>
                      <div style={styles.infoVal}>{new Date(selectedApp.moveInDate).toLocaleDateString()}</div>
                    </div>
                  </div>
                </div>

                {/* Additional contacts */}
                <div style={styles.sectionBox}>
                  <h4 style={styles.sectionLabel}>Contact Details</h4>
                  <div style={styles.contactDetails}>
                    <div style={styles.contactItem}>
                      <Mail size={16} color="var(--text-muted)" />
                      <span>
                        Email: <strong>{user.role === 'landlord' ? selectedApp.tenant?.email : selectedApp.property?.landlord?.email}</strong>
                      </span>
                    </div>
                    {user.role === 'landlord' && selectedApp.tenant?.contactNumber && (
                      <div style={styles.contactItem}>
                        <FileText size={16} color="var(--text-muted)" />
                        <span>
                          Phone: <strong>{selectedApp.tenant.contactNumber}</strong>
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Message */}
                <div style={styles.sectionBox}>
                  <h4 style={styles.sectionLabel}>Applicant Statement</h4>
                  <div style={styles.messageBox}>
                    <MessageSquare size={16} style={{ marginTop: '2px', color: 'var(--primary)' }} />
                    <p style={styles.messageText}>
                      "{selectedApp.message || 'No additional statement provided.'}"
                    </p>
                  </div>
                </div>

                {/* Action Buttons (Landlords only on pending applications) */}
                {user.role === 'landlord' && selectedApp.status === 'pending' && (
                  <div style={styles.actionsBox} className="applications-actions-box">
                    <button
                      disabled={actionLoading}
                      onClick={() => handleStatusUpdate(selectedApp._id, 'approved')}
                      className="btn btn-primary"
                      style={styles.actionBtnApprove}
                    >
                      <CheckCircle size={18} />
                      <span>{actionLoading ? 'Processing...' : 'Approve Application'}</span>
                    </button>
                    <button
                      disabled={actionLoading}
                      onClick={() => handleStatusUpdate(selectedApp._id, 'rejected')}
                      className="btn btn-danger"
                      style={styles.actionBtnReject}
                    >
                      <XCircle size={18} />
                      <span>{actionLoading ? 'Processing...' : 'Reject Application'}</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div style={styles.emptyDetails}>
                <ClipboardList size={48} color="var(--text-muted)" style={{ marginBottom: '16px' }} />
                <h3>Select an Application</h3>
                <p style={{ color: 'var(--text-secondary)', marginTop: '8px', fontSize: '0.85rem' }}>
                  Click on any application request on the left sidebar to review criteria and adjust status.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px'
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: '800',
    color: 'var(--text-primary)',
    letterSpacing: '-0.02em'
  },
  subtitle: {
    fontSize: '0.82rem',
    color: 'var(--text-secondary)',
    marginTop: '4px'
  },
  tabsContainer: {
    display: 'flex',
    gap: '12px',
    marginBottom: '20px',
    borderBottom: '1px solid var(--border-glass)',
    paddingBottom: '8px'
  },
  tabBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    fontSize: '0.88rem',
    fontWeight: '600',
    padding: '8px 16px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    position: 'relative',
    transition: 'var(--transition)'
  },
  tabBtnActive: {
    color: 'var(--text-primary)',
    fontWeight: '700',
    borderBottom: '2px solid var(--primary)'
  },
  tabCount: {
    fontSize: '0.72rem',
    padding: '2px 6px',
    borderRadius: '4px',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid var(--border-glass)',
    color: 'var(--text-secondary)'
  },
  mainGrid: {
    display: 'grid',
    gridTemplateColumns: '1.1fr 1.9fr',
    gap: '24px',
    height: 'calc(100vh - 250px)'
  },
  listPanel: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'var(--card-bg)',
    overflow: 'hidden'
  },
  panelTitle: {
    fontSize: '1.05rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
    marginBottom: '16px'
  },
  listContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    overflowY: 'auto',
    flex: 1
  },
  listItem: {
    padding: '14px 16px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border-glass)',
    background: 'var(--bg-primary)',
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    cursor: 'pointer',
    transition: 'var(--transition)'
  },
  listItemActive: {
    borderColor: 'var(--primary)',
    background: 'rgba(99, 102, 241, 0.08)'
  },
  listIconContainer: {
    width: '38px',
    height: '38px',
    borderRadius: '8px',
    background: 'rgba(255, 255, 255, 0.03)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  listMain: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1
  },
  listTitle: {
    fontSize: '0.88rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
    lineHeight: '1.3'
  },
  listSub: {
    fontSize: '0.72rem',
    color: 'var(--text-muted)',
    marginTop: '4px'
  },
  listRight: {
    display: 'flex',
    alignItems: 'center'
  },
  noData: {
    textAlign: 'center',
    color: 'var(--text-muted)',
    fontSize: '0.85rem',
    padding: '40px 0'
  },
  detailPanel: {
    padding: '28px',
    backgroundColor: 'var(--card-bg)',
    overflowY: 'auto'
  },
  detailsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  detailsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  detailsTitle: {
    fontSize: '1.25rem',
    fontWeight: '800',
    color: 'var(--text-primary)'
  },
  detailsId: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    marginTop: '2px'
  },
  divider: {
    height: '1px',
    background: 'var(--border-glass)'
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: '16px'
  },
  infoCard: {
    padding: '14px',
    background: 'var(--bg-primary)',
    border: '1px solid var(--border-glass)',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  infoLabel: {
    fontSize: '0.72rem',
    color: 'var(--text-muted)'
  },
  infoVal: {
    fontSize: '1rem',
    fontWeight: '800',
    color: 'var(--text-primary)',
    marginTop: '2px'
  },
  sectionBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  sectionLabel: {
    fontSize: '0.85rem',
    fontWeight: '700',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  },
  contactDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    background: 'var(--bg-primary)',
    padding: '14px',
    borderRadius: '8px',
    border: '1px solid var(--border-glass)'
  },
  contactItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '0.85rem',
    color: 'var(--text-secondary)'
  },
  messageBox: {
    display: 'flex',
    gap: '12px',
    background: 'var(--bg-primary)',
    padding: '16px',
    borderRadius: '8px',
    border: '1px solid var(--border-glass)'
  },
  messageText: {
    fontSize: '0.9rem',
    color: 'var(--text-primary)',
    lineHeight: '1.5',
    fontStyle: 'italic'
  },
  actionsBox: {
    display: 'flex',
    gap: '16px',
    marginTop: '10px'
  },
  actionBtnApprove: {
    flex: 1,
    padding: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    border: 'none',
    color: 'var(--text-primary)'
  },
  actionBtnReject: {
    flex: 1,
    padding: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
    border: 'none',
    color: 'var(--text-primary)'
  },
  emptyDetails: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    textAlign: 'center'
  },
  loading: {
    textAlign: 'center',
    padding: '60px 0',
    color: 'var(--text-secondary)'
  }
};

export default Applications;
