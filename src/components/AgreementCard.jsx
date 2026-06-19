import { FileText } from 'lucide-react';

const AgreementCard = ({ agreement, isSelected, onSelect }) => {
  return (
    <div
      onClick={() => onSelect(agreement)}
      style={{
        ...styles.listItem,
        ...(isSelected ? styles.listItemActive : {})
      }}
    >
      <div style={styles.listIconContainer}>
        <FileText size={20} color="var(--primary)" />
      </div>
      <div style={styles.listMain}>
        <div style={styles.listTitle}>{agreement.property?.title}</div>
        <div style={styles.listDates}>
          {new Date(agreement.startDate).toLocaleDateString()} - {new Date(agreement.endDate).toLocaleDateString()}
        </div>
      </div>
      <div style={styles.listRight}>
        <span className={`badge badge-${agreement.status === 'active' ? 'success' : 'warning'}`}>
          {agreement.status === 'active' ? 'Active' : 'Pending Signature'}
        </span>
      </div>
    </div>
  );
};

const styles = {
  listItem: {
    padding: '14px 16px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border-glass)',
    background: 'rgba(0, 0, 0, 0.1)',
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
    // color: '#fff',
    lineHeight: '1.3'
  },
  listDates: {
    fontSize: '0.72rem',
    color: 'var(--text-muted)',
    marginTop: '4px'
  },
  listRight: {
    display: 'flex',
    alignItems: 'center'
  }
};

export default AgreementCard;
