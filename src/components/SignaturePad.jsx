import { useRef, useState, useEffect } from 'react';

const SignaturePad = ({ onSave, onClear }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set stroke configuration
    ctx.strokeStyle = '#f8fafc'; // White ink for dark mode contrast
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    // Check if touch or mouse event
    if (e.touches && e.touches[0]) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    }
    
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (onClear) onClear();
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    // Check if signature is drawn
    const dataURL = canvas.toDataURL('image/png');
    if (onSave) onSave(dataURL);
  };

  return (
    <div style={styles.container}>
      <div style={styles.canvasContainer}>
        <canvas
          ref={canvasRef}
          width={450}
          height={180}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          style={styles.canvas}
        />
      </div>
      <div style={styles.actions}>
        <button type="button" onClick={handleClear} style={styles.clearBtn} className="sig-clear-btn">
          Clear Drawing
        </button>
        <button type="button" onClick={handleSave} style={styles.saveBtn} className="sig-save-btn">
          Capture Signature
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    width: '100%'
  },
  canvasContainer: {
    background: 'rgba(0, 0, 0, 0.4)',
    border: '1px dashed rgba(255, 255, 255, 0.15)',
    borderRadius: '8px',
    overflow: 'hidden',
    position: 'relative',
    height: '180px',
    width: '100%'
  },
  canvas: {
    display: 'block',
    cursor: 'crosshair',
    width: '100%',
    height: '100%'
  },
  actions: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '12px'
  },
  clearBtn: {
    padding: '8px 16px',
    background: 'none',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: '6px',
    color: '#94a3b8',
    fontSize: '0.85rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'var(--transition)'
  },
  saveBtn: {
    padding: '8px 16px',
    background: 'rgba(99, 102, 241, 0.15)',
    border: '1px solid rgba(99, 102, 241, 0.4)',
    borderRadius: '6px',
    color: 'var(--primary)',
    fontSize: '0.85rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'var(--transition)'
  }
};

export default SignaturePad;
