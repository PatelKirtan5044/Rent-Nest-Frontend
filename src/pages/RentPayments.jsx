import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { FileText, CreditCard, CheckCircle, ShieldCheck, Download, AlertTriangle, X, Wallet } from 'lucide-react';

const RentPayments = () => {
  const { user, apiFetch } = useAuth();
  const { addToast } = useSocket();

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState(null);
  
  // Checkout Simulation Modal State
  const [showPayModal, setShowPayModal] = useState(false);
  const [payGateway, setPayGateway] = useState('stripe'); // 'stripe' or 'razorpay'
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Landlord Manual Record Modal State
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualForm, setManualForm] = useState({
    paymentId: '',
    paymentMethod: 'cash',
    transactionId: ''
  });

  const fetchPayments = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await apiFetch('/payments');
      if (res.success) {
        setPayments(res.data.payments);
      }
    } catch (err) {
      console.error(err);
      addToast('Error fetching payment history.', 'danger');
    } finally {
      setLoading(false);
    }
  }, [apiFetch, user, addToast]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  // Initiate Online Checkout Order
  const handlePayRentInit = (payment) => {
    setSelectedPayment(payment);
    setShowPayModal(true);
  };

  // Verify Online Payment Simulation
  const handleCheckoutVerify = async (e) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      // 1. Call backend initiate
      const initRes = await apiFetch('/payments/initiate', {
        method: 'POST',
        body: JSON.stringify({ paymentId: selectedPayment._id, gateway: payGateway })
      });

      if (!initRes.success) throw new Error('Gateway initiation failed.');

      const gatewayData = initRes.data.gatewayData;

      // 2. Simulate delay for gateway payment network response
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 3. Complete verification call
      const verifyBody = {
        paymentId: selectedPayment._id,
        gateway: payGateway
      };

      if (payGateway === 'razorpay') {
        verifyBody.razorpay_order_id = gatewayData.id;
        verifyBody.razorpay_payment_id = `pay_${Math.random().toString(36).substring(2, 14)}`;
        verifyBody.razorpay_signature = 'mock_signature_hash_value';
      } else {
        verifyBody.stripe_payment_intent_id = gatewayData.id;
      }

      const verifyRes = await apiFetch('/payments/verify', {
        method: 'POST',
        body: JSON.stringify(verifyBody)
      });

      if (verifyRes.success) {
        addToast(`Rent payment of ₹${selectedPayment.amount} verified and completed! Receipt emailed.`, 'success');
        setShowPayModal(false);
        setCardNumber(''); setCardExpiry(''); setCardCvv('');
        fetchPayments();
      }
    } catch (err) {
      addToast(err.message || 'Payment simulation failed.', 'danger');
    } finally {
      setIsProcessing(false);
    }
  };

  // Record manual cash logs (Landlord only)
  const handleManualRecord = async (e) => {
    e.preventDefault();
    if (!manualForm.paymentId) return addToast('Please select an invoice first.', 'warning');

    try {
      setLoading(true);
      const res = await apiFetch('/payments/manual-record', {
        method: 'POST',
        body: JSON.stringify(manualForm)
      });
      if (res.success) {
        addToast('Manual payment recorded. Receipt generated and emailed to tenant.', 'success');
        setShowManualModal(false);
        setManualForm({ paymentId: '', paymentMethod: 'cash', transactionId: '' });
        fetchPayments();
      }
    } catch (err) {
      addToast(err.message || 'Failed to record payment.', 'danger');
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Rent Payments & Invoices</h1>
          <p style={styles.subtitle}>Track rent collections, view invoice receipts, and complete transactions.</p>
        </div>

        {user.role === 'landlord' && (
          <button onClick={() => setShowManualModal(true)} className="btn btn-primary">
            <Wallet size={16} />
            <span>Record Manual Cash</span>
          </button>
        )}
      </div>

      {/* Ledger Table */}
      {loading ? (
        <div style={styles.loading}>Loading payment histories...</div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="glass-panel payments-desktop-table" style={styles.tablePanel}>
            <div style={styles.tableResponsive}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tr}>
                    <th style={styles.th}>Invoice ID</th>
                    <th style={styles.th}>{user.role === 'landlord' ? 'Tenant' : 'Landlord'}</th>
                    <th style={styles.th}>Due Date</th>
                    <th style={styles.th}>Amount</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Payment Date</th>
                    <th style={styles.th}>Method</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.length > 0 ? (
                    payments.map((payment) => (
                      <tr key={payment._id} style={styles.trBody} className="payment-tr">
                        <td style={styles.td}>
                          <strong>INV-{payment._id.substring(18).toUpperCase()}</strong>
                        </td>
                        <td style={styles.td}>
                          {user.role === 'landlord' ? payment.tenant?.name : payment.landlord?.name}
                        </td>
                        <td style={styles.td}>{new Date(payment.dueDate).toLocaleDateString()}</td>
                        <td style={{ ...styles.td, fontWeight: '700' }}>₹{payment.amount}</td>
                        <td style={styles.td}>
                          <span className={`badge badge-${payment.paymentStatus === 'paid' ? 'success' : payment.paymentStatus === 'pending' ? 'warning' : 'danger'}`}>
                            {payment.paymentStatus}
                          </span>
                        </td>
                        <td style={styles.td}>
                          {payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString() : '-'}
                        </td>
                        <td style={styles.td}>{payment.paymentMethod ? payment.paymentMethod.toUpperCase() : '-'}</td>
                        <td style={styles.td}>
                          <div style={styles.actionRow}>
                            {payment.paymentStatus === 'pending' || payment.paymentStatus === 'overdue' ? (
                              <>
                                {user.role === 'tenant' && (
                                  <button onClick={() => handlePayRentInit(payment)} className="btn btn-primary" style={styles.tableBtn}>
                                    <CreditCard size={14} />
                                    <span>Pay Now</span>
                                  </button>
                                )}
                              </>
                            ) : (
                              <>
                                {payment.receiptPdfUrl && (
                                  <a
                                    href={`http://localhost:8000${payment.receiptPdfUrl}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-secondary"
                                    style={styles.tableBtnSec}
                                  >
                                    <Download size={13} />
                                    <span>Receipt</span>
                                  </a>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" style={styles.noDataTd}>No transactions recorded.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card List View */}
          <div className="payments-mobile-cards">
            {payments.length > 0 ? (
              payments.map((payment) => (
                <div key={payment._id} className="glass-panel payment-mobile-card" style={styles.mobileCard}>
                  <div style={styles.mobileCardHeader}>
                    <span style={styles.mobileCardInv}>INV-{payment._id.substring(18).toUpperCase()}</span>
                    <span className={`badge badge-${payment.paymentStatus === 'paid' ? 'success' : payment.paymentStatus === 'pending' ? 'warning' : 'danger'}`}>
                      {payment.paymentStatus}
                    </span>
                  </div>
                  <div style={styles.mobileCardRow}>
                    <span style={styles.mobileCardLabel}>{user.role === 'landlord' ? 'Tenant' : 'Landlord'}:</span>
                    <span style={styles.mobileCardVal}>{user.role === 'landlord' ? payment.tenant?.name : payment.landlord?.name}</span>
                  </div>
                  <div style={styles.mobileCardRow}>
                    <span style={styles.mobileCardLabel}>Due Date:</span>
                    <span style={styles.mobileCardVal}>{new Date(payment.dueDate).toLocaleDateString()}</span>
                  </div>
                  {payment.paymentDate && (
                    <div style={styles.mobileCardRow}>
                      <span style={styles.mobileCardLabel}>Paid Date:</span>
                      <span style={styles.mobileCardVal}>{new Date(payment.paymentDate).toLocaleDateString()}</span>
                    </div>
                  )}
                  {payment.paymentMethod && (
                    <div style={styles.mobileCardRow}>
                      <span style={styles.mobileCardLabel}>Method:</span>
                      <span style={styles.mobileCardVal}>{payment.paymentMethod.toUpperCase()}</span>
                    </div>
                  )}
                  <div style={styles.mobileCardDivider} />
                  <div style={styles.mobileCardFooter}>
                    <div style={styles.mobileCardAmount}>
                      <span style={styles.mobileCardAmtLabel}>Amount</span>
                      <span style={styles.mobileCardAmtVal}>₹{payment.amount}</span>
                    </div>
                    <div>
                      {payment.paymentStatus === 'pending' || payment.paymentStatus === 'overdue' ? (
                        <>
                          {user.role === 'tenant' && (
                            <button onClick={() => handlePayRentInit(payment)} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                              <CreditCard size={14} />
                              <span>Pay Now</span>
                            </button>
                          )}
                        </>
                      ) : (
                        <>
                          {payment.receiptPdfUrl && (
                            <a
                              href={`http://localhost:8000${payment.receiptPdfUrl}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-secondary"
                              style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                            >
                              <Download size={13} />
                              <span>Receipt</span>
                            </a>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No transactions recorded.
              </div>
            )}
          </div>
        </>
      )}

      {/* --- MODAL: SECURE PAYMENT GATEWAY SIMULATOR (Tenant only) --- */}
      {showPayModal && selectedPayment && (
        <div className="modal-overlay" onClick={() => setShowPayModal(false)}>
          <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '460px' }}>
            <div style={styles.modalHeader}>
              <div style={styles.modalHeaderTitle}>
                <ShieldCheck size={20} color="var(--success)" />
                <h2>Secure Rent Checkout</h2>
              </div>
              <button onClick={() => setShowPayModal(false)} style={styles.closeBtn}>
                <X size={20} />
              </button>
            </div>

            <div style={styles.checkoutSummary}>
              <div style={styles.checkoutLabel}>TOTAL AMOUNT DUE</div>
              <div style={styles.checkoutVal}>₹{selectedPayment.amount.toFixed(2)}</div>
              <div style={styles.checkoutDesc}>INV-{selectedPayment._id.substring(18).toUpperCase()} - Rent Payment</div>
            </div>

            <form onSubmit={handleCheckoutVerify} style={styles.checkoutForm}>
              {/* Gateway selector */}
              <div className="form-group">
                <label className="form-label">Select Payment Gateway</label>
                <div style={styles.gatewayGrid} className="checkout-gateway-grid">
                  <div
                    onClick={() => setPayGateway('stripe')}
                    style={{
                      ...styles.gatewayCard,
                      ...(payGateway === 'stripe' ? styles.gatewayActive : {})
                    }}
                  >
                    <span>Stripe Checkout</span>
                  </div>
                  <div
                    onClick={() => setPayGateway('razorpay')}
                    style={{
                      ...styles.gatewayCard,
                      ...(payGateway === 'razorpay' ? styles.gatewayActive : {})
                    }}
                  >
                    <span>Razorpay Secure</span>
                  </div>
                </div>
              </div>

              {/* Card Inputs */}
              <div className="form-group">
                <label className="form-label">Card Number</label>
                <input
                  type="text"
                  required
                  placeholder="4242 •••• •••• 4242"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').substring(0, 16))}
                  style={styles.formInput}
                />
              </div>

              <div style={styles.grid2Col} className="checkout-card-grid">
                <div className="form-group">
                  <label className="form-label">Expiration Date</label>
                  <input
                    type="text"
                    required
                    placeholder="MM/YY"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value.substring(0, 5))}
                    style={styles.formInput}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">CVV Code</label>
                  <input
                    type="password"
                    required
                    placeholder="•••"
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').substring(0, 3))}
                    style={styles.formInput}
                  />
                </div>
              </div>

              <div style={styles.checkoutWarn}>
                <AlertTriangle size={15} color="var(--warning)" style={{ flexShrink: 0 }} />
                <span>Simulation mode: Card inputs are processed securely using sandbox credentials.</span>
              </div>

              <button type="submit" disabled={isProcessing} className="btn btn-primary" style={{ padding: '14px', marginTop: '10px' }}>
                {isProcessing ? 'Processing Transaction...' : `Pay ₹${selectedPayment.amount} Online`}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: RECORD MANUAL PAYMENT (Landlord only) --- */}
      {showManualModal && (
        <div className="modal-overlay" onClick={() => setShowManualModal(false)}>
          <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div style={styles.modalHeader}>
              <h2>Log Rent Payment Manually</h2>
              <button onClick={() => setShowManualModal(false)} style={styles.closeBtn}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleManualRecord} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
              <div className="form-group">
                <label className="form-label">Select Unpaid Rent Invoice</label>
                <select
                  required
                  onChange={(e) => setManualForm({ ...manualForm, paymentId: e.target.value })}
                  className="form-select"
                >
                  <option value="">-- Choose Invoice --</option>
                  {payments
                    .filter(p => p.paymentStatus !== 'paid')
                    .map(p => (
                      <option key={p._id} value={p._id}>
                        {p.tenant?.name} - ₹{p.amount} (Due: {new Date(p.dueDate).toLocaleDateString()})
                      </option>
                    ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Payment Method</label>
                <select
                  value={manualForm.paymentMethod}
                  onChange={(e) => setManualForm({ ...manualForm, paymentMethod: e.target.value })}
                  className="form-select"
                >
                  <option value="cash">Cash Payment</option>
                  <option value="bank_transfer">Bank Transfer / Check</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Transaction Reference / Note</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TXN-99887766, Cash received by hand"
                  value={manualForm.transactionId}
                  onChange={(e) => setManualForm({ ...manualForm, transactionId: e.target.value })}
                  style={styles.formInput}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ padding: '12px' }}>
                Register Payment & Issue Receipt
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
  tablePanel: {
    padding: '20px',
    backgroundColor: 'var(--card-bg)'
  },
  tableResponsive: {
    width: '100%',
    overflowX: 'auto'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left'
  },
  tr: {
    borderBottom: '1px solid var(--border-glass)'
  },
  th: {
    padding: '14px 16px',
    fontSize: '0.8rem',
    fontWeight: '700',
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  },
  trBody: {
    borderBottom: '1px solid var(--border-glass)'
  },
  td: {
    padding: '16px',
    fontSize: '0.9rem',
    color: 'var(--text-primary)'
  },
  actionRow: {
    display: 'flex',
    gap: '8px'
  },
  tableBtn: {
    padding: '6px 12px',
    fontSize: '0.78rem',
    borderRadius: '4px'
  },
  tableBtnSec: {
    padding: '6px 12px',
    fontSize: '0.78rem',
    borderRadius: '4px',
    backgroundColor: 'rgba(255,255,255,0.05)',
    border: '1px solid var(--border-glass)'
  },
  noDataTd: {
    padding: '40px',
    textAlign: 'center',
    color: 'var(--text-muted)',
    fontSize: '0.9rem'
  },
  loading: {
    textAlign: 'center',
    padding: '60px',
    color: 'var(--text-secondary)'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid var(--border-glass)',
    paddingBottom: '14px'
  },
  modalHeaderTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    cursor: 'pointer'
  },
  checkoutSummary: {
    padding: '24px',
    background: 'var(--bg-primary)',
    borderRadius: '8px',
    margin: '20px 0',
    textAlign: 'center',
    border: '1px solid var(--border-glass)'
  },
  checkoutLabel: {
    fontSize: '0.7rem',
    fontWeight: '700',
    color: 'var(--text-muted)',
    letterSpacing: '0.05em'
  },
  checkoutVal: {
    fontSize: '2rem',
    fontWeight: '800',
    color: 'var(--text-primary)',
    margin: '8px 0'
  },
  checkoutDesc: {
    fontSize: '0.78rem',
    color: 'var(--text-secondary)'
  },
  checkoutForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  gatewayGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    marginTop: '6px'
  },
  gatewayCard: {
    padding: '12px',
    border: '1px solid var(--border-glass)',
    borderRadius: 'var(--radius-sm)',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'var(--transition)',
    fontWeight: '600',
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    background: 'var(--bg-primary)'
  },
  gatewayActive: {
    borderColor: 'var(--primary)',
    color: 'var(--text-primary)',
    background: 'rgba(99, 102, 241, 0.08)'
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
  },
  checkoutWarn: {
    display: 'flex',
    gap: '8px',
    padding: '12px',
    background: 'var(--warning-bg)',
    border: '1px solid rgba(245, 158, 11, 0.15)',
    borderRadius: '6px',
    color: 'var(--warning)',
    fontSize: '0.75rem',
    lineHeight: '1.4'
  },
  mobileCard: {
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    backgroundColor: 'var(--card-bg)',
    marginBottom: '16px'
  },
  mobileCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid var(--border-glass)',
    paddingBottom: '12px'
  },
  mobileCardInv: {
    fontWeight: '700',
    fontSize: '0.9rem',
    color: 'var(--text-primary)'
  },
  mobileCardRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.85rem'
  },
  mobileCardLabel: {
    color: 'var(--text-muted)'
  },
  mobileCardVal: {
    color: 'var(--text-secondary)',
    fontWeight: '600'
  },
  mobileCardDivider: {
    height: '1px',
    background: 'var(--border-glass)',
    margin: '4px 0'
  },
  mobileCardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '4px'
  },
  mobileCardAmount: {
    display: 'flex',
    flexDirection: 'column'
  },
  mobileCardAmtLabel: {
    fontSize: '0.68rem',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  },
  mobileCardAmtVal: {
    fontSize: '1.25rem',
    fontWeight: '800',
    color: 'var(--text-primary)',
    marginTop: '2px'
  }
};

export default RentPayments;
