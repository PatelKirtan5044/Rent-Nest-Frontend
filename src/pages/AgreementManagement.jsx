import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { FileText, Calendar, Plus, Sparkles, User, Award, FileDown, CheckCircle, Clock, X } from 'lucide-react';
import SignaturePad from '../components/SignaturePad';
import AgreementCard from '../components/AgreementCard';

const AgreementManagement = () => {
  const { user, apiFetch } = useAuth();
  const { addToast } = useSocket();

  const [agreements, setAgreements] = useState([]);
  const [applications, setApplications] = useState([]); // approved applications for landlord to pick
  const [loading, setLoading] = useState(true);
  const [selectedAgreement, setSelectedAgreement] = useState(null);
  
  // Create Agreement State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAgreement, setNewAgreement] = useState({
    propertyId: '',
    tenantId: '',
    startDate: '',
    endDate: '',
    rentAmount: '',
    securityDeposit: ''
  });

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      // Fetch agreements
      const agreementRes = await apiFetch('/leases');
      if (agreementRes.success) {
        setAgreements(agreementRes.data.leases);
      }

      // If landlord, fetch approved applications to populate contract creation
      if (user.role === 'landlord') {
        const appRes = await apiFetch('/properties/applications');
        if (appRes.success) {
          const approvedApps = appRes.data.applications.filter(a => a.status === 'approved');
          setApplications(approvedApps);
        }
      }
    } catch (err) {
      console.error(err);
      addToast('Error loading agreement details.', 'danger');
    } finally {
      setLoading(false);
    }
  }, [apiFetch, user, addToast]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData, user]);

  // Submit Agreement Draft
  const handleCreateAgreement = async (e) => {
    e.preventDefault();
    if (!newAgreement.propertyId || !newAgreement.tenantId) {
      return addToast('Please select a valid property and tenant application.', 'warning');
    }

    try {
      setLoading(true);
      const res = await apiFetch('/leases', {
        method: 'POST',
        body: JSON.stringify(newAgreement)
      });

      if (res.success) {
        addToast('Agreement contract draft generated and sent to tenant!', 'success');
        setShowCreateModal(false);
        setNewAgreement({ propertyId: '', tenantId: '', startDate: '', endDate: '', rentAmount: '', securityDeposit: '' });
        fetchData();
      }
    } catch (err) {
      addToast(err.message || 'Failed to create agreement contract draft.', 'danger');
      setLoading(false);
    }
  };

  // Sign agreement via Canvas base64 drawing
  const handleSignAgreement = async (signatureDataUrl) => {
    try {
      setLoading(true);
      const res = await apiFetch(`/leases/${selectedAgreement._id}/sign`, {
        method: 'POST',
        body: JSON.stringify({ signature: signatureDataUrl })
      });

      if (res.success) {
        addToast('Digital signature registered and saved successfully!', 'success');
        setSelectedAgreement(res.data.lease);
        fetchData();
      }
    } catch (err) {
      addToast(err.message || 'Failed to register signature.', 'danger');
    } finally {
      setLoading(false);
    }
  };

  // Populate rent details from selected application
  const handleApplicationSelect = (appId) => {
    const app = applications.find(a => a._id === appId);
    if (app && app.property && app.tenant) {
      setNewAgreement({
        ...newAgreement,
        propertyId: app.property._id,
        tenantId: app.tenant._id,
        rentAmount: app.property.rentAmount || '',
        securityDeposit: app.property.rentAmount ? (app.property.rentAmount * 1.5) : ''
      });
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Agreements</h1>
          <p style={styles.subtitle}>Digitally sign, review, and generate residential tenancy contracts.</p>
        </div>

        {user.role === 'landlord' && (
          <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
            <Plus size={18} />
            <span>Generate Agreement</span>
          </button>
        )}
      </div>

      {/* Main Grid */}
      {loading ? (
        <div style={styles.loading}>Loading agreements ledger...</div>
      ) : (
        <div className="split-layout-grid">
          {/* Agreements list */}
          <div className="glass-panel split-list-panel">
            <h3 style={styles.panelTitle}>Agreement Records</h3>
            <div style={styles.listContainer}>
              {agreements.length > 0 ? (
                agreements.map((agreement) => (
                  <AgreementCard
                    key={agreement._id}
                    agreement={agreement}
                    isSelected={selectedAgreement?._id === agreement._id}
                    onSelect={setSelectedAgreement}
                  />
                ))
              ) : (
                <div style={styles.noData}>No agreement records stored in the ledger.</div>
              )}
            </div>
          </div>

          {/* Agreement Details View & Canvas Signature */}
          <div className="glass-panel split-detail-panel">
            {selectedAgreement ? (
              <div style={styles.detailsContainer}>
                <div style={styles.detailsHeader}>
                  <div>
                    <h3 style={styles.detailsTitle}>{selectedAgreement.property?.title}</h3>
                    <p style={styles.detailsId}>Agreement ID: {selectedAgreement._id}</p>
                  </div>
                  {selectedAgreement.agreementPdfUrl && (
                    <a
                      href={`http://localhost:8000${selectedAgreement.agreementPdfUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary"
                      style={styles.downloadBtn}
                    >
                      <FileDown size={16} />
                      <span>Download PDF</span>
                    </a>
                  )}
                </div>

                <div style={styles.detailsSectionGrid}>
                  <div style={styles.detailsItem}>
                    <User size={16} color="var(--text-muted)" />
                    <div>
                      <span style={styles.detailsItemLabel}>Landlord:</span>
                      <strong>{selectedAgreement.landlord?.name}</strong>
                    </div>
                  </div>
                  <div style={styles.detailsItem}>
                    <User size={16} color="var(--text-muted)" />
                    <div>
                      <span style={styles.detailsItemLabel}>Tenant:</span>
                      <strong>{selectedAgreement.tenant?.name}</strong>
                    </div>
                  </div>
                  <div style={styles.detailsItem}>
                    <Calendar size={16} color="var(--text-muted)" />
                    <div>
                      <span style={styles.detailsItemLabel}>Start Date:</span>
                      <strong>{new Date(selectedAgreement.startDate).toLocaleDateString()}</strong>
                    </div>
                  </div>
                  <div style={styles.detailsItem}>
                    <Calendar size={16} color="var(--text-muted)" />
                    <div>
                      <span style={styles.detailsItemLabel}>End Date:</span>
                      <strong>{new Date(selectedAgreement.endDate).toLocaleDateString()}</strong>
                    </div>
                  </div>
                  <div style={styles.detailsItem}>
                    <Award size={16} color="var(--text-muted)" />
                    <div>
                      <span style={styles.detailsItemLabel}>Monthly Rent:</span>
                      <strong style={{ color: 'var(--success)' }}>₹{Number(selectedAgreement.rentAmount).toLocaleString('en-IN')}</strong>
                    </div>
                  </div>
                  <div style={styles.detailsItem}>
                    <Award size={16} color="var(--text-muted)" />
                    <div>
                      <span style={styles.detailsItemLabel}>Security Deposit:</span>
                      <strong>₹{Number(selectedAgreement.securityDeposit).toLocaleString('en-IN')}</strong>
                    </div>
                  </div>
                </div>

                <div style={styles.divider} />

                {/* Signature status summary */}
                <h4 style={styles.sectionTitle}>Digital signatures status</h4>
                <div style={styles.signSummaryGrid} className="sign-summary-grid">
                  <div style={styles.signSummaryCard}>
                    <div style={styles.signSummaryHeader}>
                      <span style={styles.signRole}>Landlord Signature</span>
                      {selectedAgreement.landlordSignature ? (
                        <CheckCircle size={16} color="var(--success)" />
                      ) : (
                        <Clock size={16} color="var(--warning)" />
                      )}
                    </div>
                    {selectedAgreement.landlordSignature ? (
                      <div style={styles.signatureBadge}>Signed Digitally</div>
                    ) : (
                      <div style={styles.signatureBadgePending}>Awaiting Signature</div>
                    )}
                  </div>

                  <div style={styles.signSummaryCard}>
                    <div style={styles.signSummaryHeader}>
                      <span style={styles.signRole}>Tenant Signature</span>
                      {selectedAgreement.tenantSignature ? (
                        <CheckCircle size={16} color="var(--success)" />
                      ) : (
                        <Clock size={16} color="var(--warning)" />
                      )}
                    </div>
                    {selectedAgreement.tenantSignature ? (
                      <div style={styles.signatureBadge}>Signed Digitally</div>
                    ) : (
                      <div style={styles.signatureBadgePending}>Awaiting Signature</div>
                    )}
                  </div>
                </div>

                {/* Digital Canvas Drawing input */}
                {selectedAgreement.status === 'pending_signatures' && (
                  <>
                    {((user.role === 'tenant' && !selectedAgreement.tenantSignature) ||
                      (user.role === 'landlord' && !selectedAgreement.landlordSignature)) && (
                      <div style={styles.signArea} className="glass-panel">
                        <div style={styles.signAreaHeader}>
                          <Sparkles size={16} color="var(--primary)" />
                          <span>Draw Your Digital Signature below:</span>
                        </div>
                        <SignaturePad onSave={handleSignAgreement} />
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : (
              <div style={styles.emptyDetails}>
                <FileText size={48} color="var(--text-muted)" style={{ marginBottom: '16px' }} />
                <h3>Select an Agreement Record</h3>
                <p style={{ color: 'var(--text-secondary)', marginTop: '8px', fontSize: '0.85rem' }}>
                  Click on any agreement card on the left sidebar to review terms and digitally sign.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- MODAL: CREATE AGREEMENT (Landlord only) --- */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div style={styles.modalHeader}>
              <h2>Generate Tenancy Contract</h2>
              <button onClick={() => setShowCreateModal(false)} style={styles.closeBtn}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateAgreement} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
              <div className="form-group">
                <label className="form-label">Select Approved Tenant & Property</label>
                <select
                  required
                  onChange={(e) => handleApplicationSelect(e.target.value)}
                  className="form-select"
                >
                  <option value="">-- Choose Tenant Application --</option>
                  {applications.map((app) => (
                    <option key={app._id} value={app._id}>
                      {app.tenant?.name || 'Unknown Tenant'} - {app.property?.title || 'Unknown Property'}
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.grid2Col} className="agreement-form-grid">
                <div className="form-group">
                  <label className="form-label">Agreement Start Date</label>
                  <input
                    type="date"
                    required
                    value={newAgreement.startDate}
                    onChange={(e) => setNewAgreement({ ...newAgreement, startDate: e.target.value })}
                    style={styles.formInput}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Agreement End Date</label>
                  <input
                    type="date"
                    required
                    value={newAgreement.endDate}
                    onChange={(e) => setNewAgreement({ ...newAgreement, endDate: e.target.value })}
                    style={styles.formInput}
                  />
                </div>
              </div>

              <div style={styles.grid2Col} className="agreement-form-grid">
                <div className="form-group">
                  <label className="form-label">Monthly Rent Amount (₹)</label>
                  <input
                    type="number"
                    required
                    value={newAgreement.rentAmount}
                    onChange={(e) => setNewAgreement({ ...newAgreement, rentAmount: e.target.value })}
                    style={styles.formInput}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Security Deposit (₹)</label>
                  <input
                    type="number"
                    required
                    value={newAgreement.securityDeposit}
                    onChange={(e) => setNewAgreement({ ...newAgreement, securityDeposit: e.target.value })}
                    style={styles.formInput}
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ padding: '12px' }}>
                Create Agreement Draft & Notify Tenant
              </button>
            </form>
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
    marginBottom: '8px'
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
  mainGrid: {
    display: 'grid',
    gridTemplateColumns: '1.1fr 1.9fr',
    gap: '24px',
    height: 'calc(100vh - 200px)'
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
    alignItems: 'flex-start',
    borderBottom: '1px solid var(--border-glass)',
    paddingBottom: '16px'
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
  downloadBtn: {
    padding: '8px 16px',
    fontSize: '0.85rem'
  },
  detailsSectionGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px'
  },
  detailsItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '0.85rem',
    color: 'var(--text-secondary)'
  },
  detailsItemLabel: {
    color: 'var(--text-muted)',
    marginRight: '6px'
  },
  divider: {
    height: '1px',
    background: 'var(--border-glass)'
  },
  sectionTitle: {
    fontSize: '0.92rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  },
  signSummaryGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px'
  },
  signSummaryCard: {
    padding: '16px',
    background: 'var(--bg-primary)',
    borderRadius: '10px',
    border: '1px solid var(--border-glass)'
  },
  signSummaryHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px'
  },
  signRole: {
    fontSize: '0.8rem',
    fontWeight: '700',
    color: 'var(--text-secondary)'
  },
  signatureBadge: {
    fontSize: '0.72rem',
    fontWeight: '700',
    color: 'var(--success)',
    padding: '4px 8px',
    background: 'var(--success-bg)',
    borderRadius: '4px',
    width: 'fit-content'
  },
  signatureBadgePending: {
    fontSize: '0.72rem',
    fontWeight: '700',
    color: 'var(--warning)',
    padding: '4px 8px',
    background: 'var(--warning-bg)',
    borderRadius: '4px',
    width: 'fit-content'
  },
  signArea: {
    padding: '20px',
    backgroundColor: 'rgba(99, 102, 241, 0.04)',
    border: '1px solid rgba(99, 102, 241, 0.15)'
  },
  signAreaHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '0.85rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
    marginBottom: '12px'
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
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid var(--border-glass)',
    paddingBottom: '14px'
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    cursor: 'pointer'
  },
  formInput: {
    background: 'var(--bg-primary)',
    border: '1px solid var(--border-glass)',
    borderRadius: 'var(--radius-sm)',
    padding: '12px 16px',
    color: 'var(--text-primary)',
    fontSize: '0.9rem',
    width: '100%'
  },
  grid2Col: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px'
  }
};

export default AgreementManagement;
