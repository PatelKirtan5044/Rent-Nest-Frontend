import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Wrench, Plus, User, Phone, ClipboardList, Clock, CheckCircle, MessageSquare, X, XCircle, Upload, Building, AlertTriangle, ChevronDown } from 'lucide-react';

const MaintenanceRequests = () => {
  const { user, apiFetch, apiUpload } = useAuth();
  const { addToast } = useSocket();

  const [tickets, setTickets] = useState([]);
  const [leases, setLeases] = useState([]); // for tenant to pick property
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  // Forms
  const [newTicket, setNewTicket] = useState({
    propertyId: '',
    title: '',
    description: '',
    category: 'plumbing',
    priority: 'medium'
  });
  const [selectedImages, setSelectedImages] = useState([]);

  const [updateForm, setUpdateForm] = useState({
    status: '',
    comments: '',
    assigneeName: '',
    assigneeContact: ''
  });

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const ticketRes = await apiFetch('/maintenance');
      if (ticketRes.success) {
        setTickets(ticketRes.data.tickets);
      }

      if (user.role === 'tenant') {
        const leaseRes = await apiFetch('/leases');
        if (leaseRes.success) {
          setLeases(leaseRes.data.leases.filter(l => l.status === 'active'));
        }
      }
    } catch (err) {
      console.error(err);
      addToast('Error fetching maintenance request logs.', 'danger');
    } finally {
      setLoading(false);
    }
  }, [apiFetch, user, addToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle Tenant raise ticket
  const handleRaiseTicket = async (e) => {
    e.preventDefault();
    if (!newTicket.propertyId) return addToast('Please select your active property agreement.', 'warning');

    const formData = new FormData();
    Object.keys(newTicket).forEach(key => {
      formData.append(key, newTicket[key]);
    });
    for (let i = 0; i < selectedImages.length; i++) {
      formData.append('images', selectedImages[i]);
    }

    try {
      setLoading(true);
      const res = await apiUpload('/maintenance', formData);
      if (res.success) {
        addToast('Maintenance ticket submitted successfully. Landlord notified!', 'success');
        setShowAddModal(false);
        setNewTicket({ propertyId: '', title: '', description: '', category: 'plumbing', priority: 'medium' });
        setSelectedImages([]);
        fetchData();
      }
    } catch (err) {
      addToast(err.message || 'Failed to submit request.', 'danger');
      setLoading(false);
    }
  };

  // Handle Landlord status / assignee update
  const handleUpdateTicket = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await apiFetch(`/maintenance/${selectedTicket._id}`, {
        method: 'PATCH',
        body: JSON.stringify(updateForm)
      });
      if (res.success) {
        addToast('Ticket updated and status logged.', 'success');
        setShowUpdateModal(false);
        setSelectedTicket(res.data.ticket);
        fetchData();
      }
    } catch (err) {
      addToast(err.message || 'Failed to update ticket.', 'danger');
      setLoading(false);
    }
  };

  const openUpdateModal = () => {
    setUpdateForm({
      status: selectedTicket.status,
      comments: '',
      assigneeName: selectedTicket.assignedTo?.name || '',
      assigneeContact: selectedTicket.assignedTo?.contact || ''
    });
    setShowUpdateModal(true);
  };

  const getStatusDetails = (status) => {
    const lowerStatus = status?.toLowerCase();
    if (lowerStatus === 'closed') {
      return {
        icon: <XCircle size={14} color="var(--danger)" />,
        color: 'var(--danger)'
      };
    } else if (lowerStatus === 'resolved') {
      return {
        icon: <CheckCircle size={14} color="var(--success)" />,
        color: 'var(--success)'
      };
    } else if (lowerStatus === 'in_progress') {
      return {
        icon: <Clock size={14} color="var(--warning)" />,
        color: 'var(--warning)'
      };
    } else {
      return {
        icon: <Clock size={14} color="var(--primary)" />,
        color: 'var(--primary)'
      };
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Maintenance Tickets</h1>
          <p style={styles.subtitle}>Raise tickets for issues or track assignments and repairs.</p>
        </div>

        {user.role === 'tenant' && (
          <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
            <Plus size={18} />
            <span>Raise Request</span>
          </button>
        )}
      </div>

      {/* Main Layout */}
      {loading ? (
        <div style={styles.loading}>Loading support tickets...</div>
      ) : (
        <div className="split-layout-grid">
          {/* Left panel: tickets list */}
          <div className="glass-panel split-list-panel">
            <h3 style={styles.panelTitle}>Active Tickets</h3>
            <div style={styles.listContainer}>
              {tickets.length > 0 ? (
                tickets.map((ticket) => (
                  <div
                    key={ticket._id}
                    onClick={() => setSelectedTicket(ticket)}
                    style={{
                      ...styles.listItem,
                      ...(selectedTicket?._id === ticket._id ? styles.listItemActive : {})
                    }}
                  >
                    <div style={styles.listIconContainer}>
                      <Wrench size={18} color="var(--primary)" />
                    </div>
                    <div style={styles.listMain}>
                      <div style={styles.listTitle}>{ticket.title}</div>
                      <div style={styles.listSub}>
                        {ticket.property?.title} • <span style={{ textTransform: 'capitalize' }}>{ticket.category}</span>
                      </div>
                    </div>
                    <div style={styles.listRight}>
                      <span className={`badge badge-${['resolved', 'closed'].includes(ticket.status) ? 'success' : ticket.status === 'open' ? 'danger' : 'warning'}`}>
                        {ticket.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div style={styles.noData}>No active tickets found.</div>
              )}
            </div>
          </div>

          {/* Right panel: Details & logs */}
          <div className="glass-panel split-detail-panel">
            {selectedTicket ? (
              <div style={styles.detailsContainer}>
                <div style={styles.detailsHeader}>
                  <div>
                    <h3 style={styles.detailsTitle}>{selectedTicket.title}</h3>
                    <p style={styles.detailsMeta}>
                      Category: {selectedTicket.category.toUpperCase()} • Priority: {selectedTicket.priority.toUpperCase()}
                    </p>
                  </div>
                  {user.role === 'landlord' && (
                    <button onClick={openUpdateModal} className="btn btn-primary" style={styles.updateBtn}>
                      Update Ticket
                    </button>
                  )}
                </div>

                <div style={styles.ticketBody}>
                  <h4 style={styles.bodyLabel}>Issue Description</h4>
                  <p style={styles.bodyText}>{selectedTicket.description}</p>
                </div>

                {/* Assigned staff details */}
                {selectedTicket.assignedTo?.name && (
                  <div style={styles.assignedBox}>
                    <h4 style={styles.assignedLabel}>Assigned Technician</h4>
                    <div style={styles.assignedDetails}>
                      <div style={styles.assignedItem}>
                        <User size={15} color="var(--text-muted)" />
                        <span>Name: <strong>{selectedTicket.assignedTo.name}</strong></span>
                      </div>
                      <div style={styles.assignedItem}>
                        <Phone size={15} color="var(--text-muted)" />
                        <span>Contact: <strong>{selectedTicket.assignedTo.contact}</strong></span>
                      </div>
                    </div>
                  </div>
                )}

                <div style={styles.divider} />

                {/* Status history timeline */}
                <h4 style={styles.sectionTitle}>Status update history</h4>
                <div style={styles.timeline}>
                  <div style={styles.timelineItem}>
                    <div style={styles.timelineIcon}><CheckCircle size={14} color="var(--success)" /></div>
                    <div style={styles.timelineContent}>
                      <strong>Ticket Opened</strong>
                      <span style={styles.timelineDate}>
                        {new Date(selectedTicket.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {selectedTicket.statusHistory?.map((log, idx) => {
                    const details = getStatusDetails(log.status);
                    return (
                      <div key={idx} style={styles.timelineItem}>
                        <div style={styles.timelineIcon}>{details.icon}</div>
                        <div style={styles.timelineContent}>
                          <strong>Status set to: <span style={{ textTransform: 'uppercase', color: details.color }}>{log.status}</span></strong>
                          {log.comments && <p style={styles.timelineComments}>"{log.comments}"</p>}
                          <span style={styles.timelineDate}>{new Date(log.date).toLocaleString()}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div style={styles.emptyDetails}>
                <Wrench size={48} color="var(--text-muted)" style={{ marginBottom: '16px' }} />
                <h3>Select a Ticket</h3>
                <p style={{ color: 'var(--text-secondary)', marginTop: '8px', fontSize: '0.85rem' }}>
                  Click on any maintenance ticket on the left list to review descriptions, staff, and logs.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- MODAL: RAISE TICKET (Tenant only) --- */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Raise Maintenance Request</h2>
              <button onClick={() => setShowAddModal(false)} className="btn-close-hover">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRaiseTicket} style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '8px' }}>
              <div className="form-group">
                <label className="form-label">Select Active Agreement Property</label>
                <div className="modal-input-wrapper">
                  <select
                    required
                    onChange={(e) => setNewTicket({ ...newTicket, propertyId: e.target.value })}
                    className="modal-input-field modal-select-field"
                  >
                    <option value="">-- Choose Property --</option>
                    {leases.map((lease) => (
                      <option key={lease._id} value={lease.property._id}>
                        {lease.property.title}
                      </option>
                    ))}
                  </select>
                  <Building size={16} className="modal-input-icon-left" />
                  <ChevronDown size={16} className="modal-input-icon-right" />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Issue Title</label>
                <div className="modal-input-wrapper">
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kitchen Pipe Burst"
                    value={newTicket.title}
                    onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
                    className="modal-input-field"
                  />
                  <Wrench size={16} className="modal-input-icon-left" />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Detailed Description</label>
                <div className="modal-input-wrapper">
                  <textarea
                    required
                    placeholder="Describe what needs to be repaired..."
                    rows="3"
                    value={newTicket.description}
                    onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                    className="modal-textarea-field"
                  />
                  <MessageSquare size={16} className="modal-input-icon-left" />
                </div>
              </div>

              <div style={styles.grid2Col} className="maintenance-form-grid">
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <div className="modal-input-wrapper">
                    <select
                      value={newTicket.category}
                      onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
                      className="modal-input-field modal-select-field"
                    >
                      <option value="plumbing">Plumbing</option>
                      <option value="electrical">Electrical</option>
                      <option value="appliance">Appliance</option>
                      <option value="hvac">HVAC / Heating</option>
                      <option value="structural">Structural</option>
                      <option value="other">Other</option>
                    </select>
                    <ClipboardList size={16} className="modal-input-icon-left" />
                    <ChevronDown size={16} className="modal-input-icon-right" />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <div className="modal-input-wrapper">
                    <select
                      value={newTicket.priority}
                      onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
                      className="modal-input-field modal-select-field"
                    >
                      <option value="low">Low Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="high">High Priority</option>
                    </select>
                    <AlertTriangle size={16} className="modal-input-icon-left" />
                    <ChevronDown size={16} className="modal-input-icon-right" />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Reference Photos</label>
                <div className="premium-upload-box">
                  <Upload size={22} color="var(--primary)" />
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => setSelectedImages(Array.from(e.target.files))}
                    style={styles.fileInput}
                  />
                  <span style={{ fontSize: '0.88rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                    {selectedImages.length > 0 ? `${selectedImages.length} image(s) selected` : 'Click to Upload Screenshots'}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>PNG, JPG or JPEG up to 10MB</span>
                </div>
              </div>

              <button type="submit" className="premium-submit-btn">
                Submit Maintenance Ticket
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: UPDATE TICKET (Landlord only) --- */}
      {showUpdateModal && selectedTicket && (
        <div className="modal-overlay" onClick={() => setShowUpdateModal(false)}>
          <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Update Ticket Status</h2>
              <button onClick={() => setShowUpdateModal(false)} className="btn-close-hover">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateTicket} style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '8px' }}>
              <div className="form-group">
                <label className="form-label">Ticket Status</label>
                <div className="modal-input-wrapper">
                  <select
                    value={updateForm.status}
                    onChange={(e) => setUpdateForm({ ...updateForm, status: e.target.value })}
                    className="modal-input-field modal-select-field"
                  >
                    <option value="open">Open</option>
                    <option value="assigned">Assigned</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                  <ClipboardList size={16} className="modal-input-icon-left" />
                  <ChevronDown size={16} className="modal-input-icon-right" />
                </div>
              </div>

              <div style={styles.grid2Col} className="maintenance-form-grid">
                <div className="form-group">
                  <label className="form-label">Technician Name</label>
                  <div className="modal-input-wrapper">
                    <input
                      type="text"
                      placeholder="e.g. Bob Smith"
                      value={updateForm.assigneeName}
                      onChange={(e) => setUpdateForm({ ...updateForm, assigneeName: e.target.value })}
                      className="modal-input-field"
                    />
                    <User size={16} className="modal-input-icon-left" />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Technician Phone</label>
                  <div className="modal-input-wrapper">
                    <input
                      type="tel"
                      placeholder="e.g. 555-0199"
                      value={updateForm.assigneeContact}
                      onChange={(e) => setUpdateForm({ ...updateForm, assigneeContact: e.target.value })}
                      className="modal-input-field"
                    />
                    <Phone size={16} className="modal-input-icon-left" />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Update Log Comments</label>
                <div className="modal-input-wrapper">
                  <textarea
                    placeholder="Explain status changes or add instructions..."
                    rows="3"
                    value={updateForm.comments}
                    onChange={(e) => setUpdateForm({ ...updateForm, comments: e.target.value })}
                    className="modal-textarea-field"
                  />
                  <MessageSquare size={16} className="modal-input-icon-left" />
                </div>
              </div>

              <button type="submit" className="premium-submit-btn">
                Save Ticket Update
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
    alignItems: 'flex-start',
    borderBottom: '1px solid var(--border-glass)',
    paddingBottom: '16px'
  },
  detailsTitle: {
    fontSize: '1.25rem',
    fontWeight: '800',
    color: 'var(--text-primary)'
  },
  detailsMeta: {
    fontSize: '0.78rem',
    color: 'var(--text-secondary)',
    marginTop: '6px'
  },
  updateBtn: {
    padding: '8px 16px',
    fontSize: '0.85rem'
  },
  ticketBody: {
    background: 'var(--bg-primary)',
    padding: '16px',
    borderRadius: '8px',
    border: '1px solid var(--border-glass)'
  },
  bodyLabel: {
    fontSize: '0.85rem',
    fontWeight: '700',
    color: 'var(--text-muted)',
    marginBottom: '8px'
  },
  bodyText: {
    fontSize: '0.92rem',
    color: 'var(--text-primary)',
    lineHeight: '1.5'
  },
  assignedBox: {
    background: 'rgba(99, 102, 241, 0.03)',
    padding: '16px',
    borderRadius: '8px',
    border: '1px solid rgba(99, 102, 241, 0.12)'
  },
  assignedLabel: {
    fontSize: '0.85rem',
    fontWeight: '700',
    color: 'var(--primary)',
    marginBottom: '8px'
  },
  assignedDetails: {
    display: 'flex',
    gap: '24px',
    flexWrap: 'wrap'
  },
  assignedItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '0.85rem',
    color: 'var(--text-secondary)'
  },
  divider: {
    height: '1px',
    background: 'var(--border-glass)'
  },
  sectionTitle: {
    fontSize: '0.85rem',
    fontWeight: '700',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  },
  timeline: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    position: 'relative',
    paddingLeft: '24px',
    borderLeft: '2px solid var(--border-glass)',
    marginLeft: '10px',
    marginTop: '10px'
  },
  timelineItem: {
    position: 'relative'
  },
  timelineIcon: {
    position: 'absolute',
    left: '-32px',
    top: '2px',
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    background: 'var(--bg-primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  timelineContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    fontSize: '0.85rem',
    color: 'var(--text-secondary)'
  },
  timelineComments: {
    fontSize: '0.82rem',
    color: 'var(--text-muted)',
    fontStyle: 'italic',
    marginTop: '2px'
  },
  timelineDate: {
    fontSize: '0.72rem',
    color: 'var(--text-muted)',
    marginTop: '2px'
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
    paddingBottom: '16px',
    marginBottom: '16px'
  },
  modalTitle: {
    fontSize: '1.35rem',
    fontWeight: '800',
    background: 'var(--primary-gradient)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    letterSpacing: '-0.02em'
  },
  closeBtn: {
    background: 'var(--bg-primary)',
    border: '1px solid var(--border-glass)',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'var(--transition)'
  },
  modalInputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    width: '100%'
  },
  modalInputIcon: {
    position: 'absolute',
    left: '16px',
    color: 'var(--text-muted)',
    pointerEvents: 'none'
  },
  modalInputField: {
    width: '100%',
    background: 'var(--bg-primary)',
    border: '1px solid var(--border-glass)',
    borderRadius: '12px',
    padding: '12px 16px 12px 48px',
    color: 'var(--text-primary)',
    fontSize: '0.92rem',
    transition: 'var(--transition)',
    outline: 'none'
  },
  modalTextAreaField: {
    width: '100%',
    background: 'var(--bg-primary)',
    border: '1px solid var(--border-glass)',
    borderRadius: '12px',
    padding: '14px 16px 14px 48px',
    color: 'var(--text-primary)',
    fontSize: '0.92rem',
    transition: 'var(--transition)',
    outline: 'none',
    resize: 'none',
    minHeight: '85px'
  },
  submitBtn: {
    width: '100%',
    padding: '13px 24px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontSize: '0.95rem',
    fontWeight: '700',
    cursor: 'pointer',
    marginTop: '8px',
    boxShadow: 'var(--shadow-sm)'
  },
  grid2Col: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px'
  },
  uploadBox: {
    border: '2px dashed var(--border-glass)',
    borderRadius: '12px',
    padding: '22px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    cursor: 'pointer',
    position: 'relative',
    background: 'rgba(255, 255, 255, 0.01)',
    textAlign: 'center',
    transition: 'var(--transition)'
  },
  fileInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    opacity: 0,
    cursor: 'pointer'
  }
};

export default MaintenanceRequests;
