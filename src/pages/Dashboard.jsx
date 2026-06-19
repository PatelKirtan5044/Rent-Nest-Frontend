import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Building, IndianRupee, Wrench, ArrowUpRight, TrendingUp, Clock, AlertTriangle, FileText, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const getNextRentDate = (startDateString) => {
  const startDate = new Date(startDateString);
  const startDay = startDate.getDate();
  const today = new Date();
  
  let nextMonth = today.getMonth();
  let nextYear = today.getFullYear();
  
  // If today's day of month has passed the billing day, the next invoice is next month
  if (today.getDate() >= startDay) {
    nextMonth += 1;
    if (nextMonth > 11) {
      nextMonth = 0;
      nextYear += 1;
    }
  }
  
  const maxDays = new Date(nextYear, nextMonth + 1, 0).getDate();
  const targetDay = Math.min(startDay, maxDays);
  
  return new Date(nextYear, nextMonth, targetDay);
};

const Dashboard = () => {
  const { user, apiFetch } = useAuth();
  const { addToast } = useSocket();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchDashboardData = useCallback(async () => {
    if (!user) return;
    try {
      const endpoint = user.role === 'landlord' ? '/dashboards/landlord' : '/dashboards/tenant';
      const res = await apiFetch(endpoint);
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error(err);
      addToast('Error loading dashboard analytics.', 'danger');
    } finally {
      setLoading(false);
    }
  }, [apiFetch, user, addToast]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) {
    return <div style={styles.loadingContainer}>Loading Portal Dashboard...</div>;
  }

  // --- RENDER LANDLORD DASHBOARD ---
  if (user.role === 'landlord') {
    const { properties, revenue, maintenance, monthlyAnalytics = [], recentPayments = [], nextPayment } = data || {};

    return (
      <div className="page-container">
        {/* Dashboard Header with greeting and date */}
        <div style={styles.dashboardHeader}>
          <div>
            <h1 style={styles.greetingTitle}>Welcome back, {user.name}!</h1>
            <p style={styles.greetingSubtitle}>Here's what is happening with your rental properties today.</p>
          </div>
          <div style={styles.dateBadge} className="glass-panel">
            <Calendar size={16} color="var(--primary)" />
            <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
        </div>

        {/* Metric Cards grid */}
        <div style={styles.metricsGrid} className="dashboard-metrics-grid">
          <div className="glass-panel" style={styles.metricCard}>
            <div style={{ ...styles.iconContainer, background: 'rgba(99, 102, 241, 0.15)' }}>
              <Building size={22} color="var(--primary)" />
            </div>
            <div style={styles.metricContent}>
              <div style={styles.metricLabel}>Properties Occupied</div>
              <div style={styles.metricVal}>{properties?.rented} / {properties?.total}</div>
              <div style={styles.metricSubtext}>Occupancy Rate: {properties?.occupancyRate}</div>
            </div>
          </div>

          <div className="glass-panel" style={styles.metricCard}>
            <div style={{ ...styles.iconContainer, background: 'rgba(16, 185, 129, 0.15)' }}>
              <IndianRupee size={22} color="var(--success)" />
            </div>
            <div style={styles.metricContent}>
              <div style={styles.metricLabel}>Rent Revenue Collected</div>
              <div style={{ ...styles.metricVal, color: 'var(--success)' }}>₹{revenue?.collected?.toLocaleString()}</div>
              <div style={styles.metricSubtext}>Total payments processed</div>
            </div>
          </div>

          <div className="glass-panel" style={styles.metricCard}>
            <div style={{ ...styles.iconContainer, background: 'rgba(245, 158, 11, 0.15)' }}>
              <IndianRupee size={22} color="var(--warning)" />
            </div>
            <div style={styles.metricContent}>
              <div style={styles.metricLabel}>Outstanding Balance</div>
              <div style={{ ...styles.metricVal, color: 'var(--warning)' }}>₹{revenue?.pending?.toLocaleString()}</div>
              <div style={styles.metricSubtext}>Awaiting tenant checkout</div>
            </div>
          </div>

          <div className="glass-panel" style={styles.metricCard}>
            <div style={{ ...styles.iconContainer, background: nextPayment?.paymentStatus === 'overdue' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)' }}>
              <Clock size={22} color={nextPayment?.paymentStatus === 'overdue' ? 'var(--danger)' : 'var(--warning)'} />
            </div>
            <div style={styles.metricContent}>
              <div style={styles.metricLabel}>Next Collection Due</div>
              <div style={styles.metricVal}>
                {nextPayment ? `₹${nextPayment.amount.toLocaleString()}` : '₹0.00'}
              </div>
              <div style={styles.metricSubtext}>
                {nextPayment ? `Due Date: ${new Date(nextPayment.dueDate).toLocaleDateString()} (${nextPayment.tenant?.name || 'Tenant'})` : 'No pending collections'}
              </div>
            </div>
          </div>

          <div className="glass-panel" style={styles.metricCard}>
            <div style={{ ...styles.iconContainer, background: 'rgba(239, 68, 68, 0.15)' }}>
              <Wrench size={22} color="var(--danger)" />
            </div>
            <div style={styles.metricContent}>
              <div style={styles.metricLabel}>Maintenance Tickets</div>
              <div style={styles.metricVal}>{maintenance?.open} Open</div>
              <div style={styles.metricSubtext}>Resolved requests: {maintenance?.resolved}</div>
            </div>
          </div>
        </div>

        {/* Dashboard Panels */}
        <div style={styles.panelGrid} className="dashboard-panel-grid">
          {/* Left panel: Revenue analytics chart (CSS bar representation) */}
          <div className="glass-panel" style={styles.panel}>
            <div style={styles.panelHeader}>
              <h3 style={styles.panelTitle}>Revenue History</h3>
              <TrendingUp size={18} color="var(--primary)" />
            </div>
            <div style={styles.chartContainer} className="dashboard-chart-container">
              {monthlyAnalytics.length > 0 ? (
                monthlyAnalytics.map((item, index) => {
                  // Find max value to determine height percentage
                  const maxIncome = Math.max(...monthlyAnalytics.map(a => a.income), 1000);
                  const heightPercentage = Math.round((item.income / maxIncome) * 100);
                  return (
                    <div key={index} style={styles.chartColumnWrapper}>
                      <div style={styles.chartBarWrapper}>
                        <div style={{ ...styles.chartBar, height: `${Math.max(heightPercentage, 8)}%` }} />
                      </div>
                      <div style={styles.chartLabel}>{item.month}</div>
                      <div style={styles.chartVal}>₹{item.income}</div>
                    </div>
                  );
                })
              ) : (
                <div style={styles.noData}>No payment collections recorded yet.</div>
              )}
            </div>
          </div>

          {/* Right panel: Recent Activity */}
          <div className="glass-panel" style={styles.panel}>
            <div style={styles.panelHeader}>
              <h3 style={styles.panelTitle}>Recent Rent Payments</h3>
              <Clock size={18} color="var(--text-muted)" />
            </div>
            <div style={styles.listContainer}>
              {recentPayments.length > 0 ? (
                recentPayments.map((payment) => (
                  <div key={payment._id} style={styles.listItem} className="dashboard-list-item">
                    <div style={styles.listMain}>
                      <div style={styles.listTitle}>{payment.tenant?.name || 'Tenant'}</div>
                      <div style={styles.listDate}>
                        Due: {new Date(payment.dueDate).toLocaleDateString()}
                      </div>
                    </div>
                    <div style={styles.listRight}>
                      <div style={styles.listAmt}>₹{payment.amount}</div>
                      <span className={`badge badge-${payment.paymentStatus === 'paid' ? 'success' : payment.paymentStatus === 'pending' ? 'warning' : 'danger'}`}>
                        {payment.paymentStatus}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div style={styles.noData}>No rent transactions recorded.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- RENDER TENANT PORTAL ---
  const { lease, nextPayment, maintenance, recentPayments = [] } = data || {};

  return (
    <div className="page-container">
      {/* Dashboard Header with greeting and date */}
      <div style={styles.dashboardHeader}>
        <div>
          <h1 style={styles.greetingTitle}>Welcome back, {user.name}!</h1>
          <p style={styles.greetingSubtitle}>Here's what is happening with your active rental tenancy today.</p>
        </div>
        <div style={styles.dateBadge} className="glass-panel">
          <Calendar size={16} color="var(--primary)" />
          <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>

      {/* Overview stats */}
      <div style={styles.metricsGrid} className="dashboard-metrics-grid">
        <div className="glass-panel" style={styles.metricCard}>
          <div style={{ ...styles.iconContainer, background: 'rgba(99, 102, 241, 0.15)' }}>
            <Building size={22} color="var(--primary)" />
          </div>
          <div style={styles.metricContent}>
            <div style={styles.metricLabel}>My Address</div>
            <div style={styles.metricValSmall}>
              {lease && lease.property?.address ? `${lease.property.address.street}, ${lease.property.address.city}` : 'No Active Agreement'}
            </div>
            <div style={styles.metricSubtext}>
              {lease ? `Landlord: ${lease.landlord?.name || 'Unknown'}` : 'Submit property applications to begin'}
            </div>
          </div>
        </div>

        <div className="glass-panel" style={styles.metricCard}>
          <div style={{ ...styles.iconContainer, background: nextPayment?.paymentStatus === 'overdue' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)' }}>
            <IndianRupee size={22} color={nextPayment?.paymentStatus === 'overdue' ? 'var(--danger)' : 'var(--warning)'} />
          </div>
          <div style={styles.metricContent}>
            <div style={styles.metricLabel}>Next Rent Due</div>
            <div style={styles.metricVal}>
              {nextPayment 
                ? `₹${nextPayment.amount.toLocaleString()}` 
                : (lease ? `₹${lease.rentAmount.toLocaleString()}` : '₹0.00')
              }
            </div>
            <div style={styles.metricSubtext}>
              {nextPayment 
                ? `Due Date: ${new Date(nextPayment.dueDate).toLocaleDateString()}` 
                : (lease 
                    ? `Next Rent Date: ${getNextRentDate(lease.startDate).toLocaleDateString()}` 
                    : 'Rent is fully paid'
                  )
              }
            </div>
          </div>
        </div>

        <div className="glass-panel" style={styles.metricCard}>
          <div style={{ ...styles.iconContainer, background: 'rgba(239, 68, 68, 0.15)' }}>
            <Wrench size={22} color="var(--danger)" />
          </div>
          <div style={styles.metricContent}>
            <div style={styles.metricLabel}>Pending Tickets</div>
            <div style={styles.metricVal}>{maintenance?.pending || 0} Open</div>
            <div style={styles.metricSubtext}>Total requests raised: {maintenance?.total || 0}</div>
          </div>
        </div>
      </div>

      {/* Tenant Payment History */}
      <div style={{ marginTop: '24px' }}>
        <div className="glass-panel" style={styles.panel}>
          <div style={styles.panelHeader}>
            <h3 style={styles.panelTitle}>Payment History</h3>
            <FileText size={18} color="var(--text-muted)" />
          </div>
          <div style={styles.listContainer}>
            {recentPayments.length > 0 ? (
              recentPayments.map((payment) => (
                <div key={payment._id} style={styles.listItem} className="dashboard-list-item">
                  <div style={styles.listMain}>
                    <div style={styles.listTitle}>Rent Payment</div>
                    <div style={styles.listDate}>
                      Due: {new Date(payment.dueDate).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={styles.listRight}>
                    <div style={styles.listAmt}>₹{payment.amount.toLocaleString()}</div>
                    <span className={`badge badge-${payment.paymentStatus === 'paid' ? 'success' : payment.paymentStatus === 'pending' ? 'warning' : 'danger'}`}>
                      {payment.paymentStatus}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div style={styles.noData}>No recent transactions listed.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  dashboardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '28px',
    flexWrap: 'wrap',
    gap: '16px'
  },
  greetingTitle: {
    fontSize: '1.75rem',
    fontWeight: '800',
    color: 'var(--text-primary)',
    letterSpacing: '-0.02em'
  },
  greetingSubtitle: {
    fontSize: '0.88rem',
    color: 'var(--text-secondary)',
    marginTop: '6px'
  },
  dateBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 16px',
    borderRadius: '100px',
    fontSize: '0.85rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-glass)',
    backgroundColor: 'var(--card-bg)'
  },
  loadingContainer: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.2rem',
    color: 'var(--text-secondary)'
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '24px'
  },
  metricCard: {
    padding: '24px',
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    backgroundColor: 'var(--card-bg)'
  },
  iconContainer: {
    width: '50px',
    height: '50px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  metricContent: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1
  },
  metricLabel: {
    fontSize: '0.8rem',
    fontWeight: '700',
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  },
  metricVal: {
    fontSize: '1.6rem',
    fontWeight: '800',
    color: 'var(--text-primary)',
    marginTop: '4px'
  },
  metricValSmall: {
    fontSize: '0.98rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
    marginTop: '4px',
    lineHeight: '1.3'
  },
  metricSubtext: {
    fontSize: '0.72rem',
    color: 'var(--text-muted)',
    marginTop: '4px'
  },
  panelGrid: {
    display: 'grid',
    gridTemplateColumns: '1.5fr 1fr',
    gap: '24px'
  },
  panel: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'var(--card-bg)'
  },
  panelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    borderBottom: '1px solid var(--border-glass)',
    paddingBottom: '12px'
  },
  panelTitle: {
    fontSize: '1.05rem',
    fontWeight: '700',
    color: 'var(--text-primary)'
  },
  chartContainer: {
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: '240px',
    padding: '10px 0'
  },
  chartColumnWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '60px'
  },
  chartBarWrapper: {
    height: '170px',
    width: '28px',
    background: 'rgba(255, 255, 255, 0.02)',
    borderRadius: '100px',
    display: 'flex',
    alignItems: 'flex-end',
    overflow: 'hidden'
  },
  chartBar: {
    width: '100%',
    background: 'var(--primary-gradient)',
    borderRadius: '100px',
    transition: 'height 0.6s ease'
  },
  chartLabel: {
    fontSize: '0.7rem',
    color: 'var(--text-secondary)',
    marginTop: '10px',
    fontWeight: '600'
  },
  chartVal: {
    fontSize: '0.75rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
    marginTop: '2px'
  },
  noData: {
    textAlign: 'center',
    color: 'var(--text-muted)',
    fontSize: '0.85rem',
    width: '100%',
    padding: '40px 0'
  },
  listContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  listItem: {
    padding: '14px 16px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border-glass)',
    background: 'var(--bg-primary)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    transition: 'var(--transition)'
  },
  listMain: {
    display: 'flex',
    flexDirection: 'column'
  },
  listTitle: {
    fontSize: '0.9rem',
    fontWeight: '700',
    color: 'var(--text-primary)'
  },
  listDate: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    marginTop: '4px'
  },
  listRight: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '6px'
  },
  listAmt: {
    fontSize: '0.95rem',
    fontWeight: '800',
    color: 'var(--text-primary)'
  },
  paymentBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  paymentWarn: {
    display: 'flex',
    gap: '12px',
    padding: '16px',
    background: 'var(--warning-bg)',
    border: '1px solid rgba(245, 158, 11, 0.2)',
    borderRadius: '8px',
    color: 'var(--text-primary)'
  },
  paymentWarnTitle: {
    fontWeight: '700',
    fontSize: '0.88rem',
    color: 'var(--warning)'
  },
  paymentWarnText: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
    marginTop: '4px',
    lineHeight: '1.4'
  },
  paymentInfoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 0',
    borderBottom: '1px dashed var(--border-glass)',
    fontSize: '0.9rem',
    color: 'var(--text-secondary)'
  },
  noDataContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 0',
    textAlign: 'center'
  }
};

export default Dashboard;
