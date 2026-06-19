import { useSocket } from '../context/SocketContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const Toast = () => {
  const { toasts, removeToast } = useSocket();

  if (toasts.length === 0) return null;

  return (
    <div style={styles.toastContainer}>
      {toasts.map((toast) => {
        let Icon = Info;
        let color = '#3b82f6';
        let bg = 'rgba(59, 130, 246, 0.15)';

        if (toast.type === 'success') {
          Icon = CheckCircle2;
          color = '#10b981';
          bg = 'rgba(16, 185, 129, 0.15)';
        } else if (toast.type === 'warning') {
          Icon = AlertCircle;
          color = '#f59e0b';
          bg = 'rgba(245, 158, 11, 0.15)';
        } else if (toast.type === 'danger') {
          Icon = AlertCircle;
          color = '#ef4444';
          bg = 'rgba(239, 68, 68, 0.15)';
        }

        return (
          <div key={toast.id} style={{ ...styles.toastItem, borderLeftColor: color, backgroundColor: bg }}>
            <Icon size={20} color={color} style={{ flexShrink: 0 }} />
            <div style={styles.toastMessage}>{toast.message}</div>
            <button onClick={() => removeToast(toast.id)} style={styles.closeBtn} className="toast-close-btn">
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
};

const styles = {
  toastContainer: {
    position: 'fixed',
    top: '20px',
    right: '20px',
    zIndex: 9999,
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    maxWidth: '380px',
    width: '100%'
  },
  toastItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px',
    borderRadius: '10px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderLeftWidth: '5px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
    backdropFilter: 'blur(12px)',
    animation: 'toastSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
  },
  toastMessage: {
    fontSize: '0.9rem',
    fontWeight: '500',
    color: 'var(--text-primary)',
    lineHeight: '1.4',
    flex: 1
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    padding: '2px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'color 0.2s'
  }
};

// Add CSS keyframe dynamically if not present
const styleTag = document.createElement('style');
styleTag.innerHTML = `
  @keyframes toastSlideIn {
    from {
      opacity: 0;
      transform: translateX(50px) translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateX(0) translateY(0);
    }
  }
`;
document.head.appendChild(styleTag);

export default Toast;
