import { MapPin, Bed, Bath } from 'lucide-react';
import { BASE_URL } from '../context/AuthContext';

const PropertyCard = ({ property, onViewDetails }) => {
  return (
    <div className="glass-panel" style={styles.card}>
      <div style={styles.cardImageContainer}>
        {property.images && property.images.length > 0 ? (
          <img
            src={property.images[0].startsWith('http') ? property.images[0] : `${BASE_URL}${property.images[0]}`}
            alt={property.title}
            style={styles.cardImg}
            className="property-card-img"
          />
        ) : (
          <div style={styles.cardImageFallback}>No Image Available</div>
        )}
        <span className={`badge badge-${property.status === 'available' ? 'success' : 'danger'}`} style={styles.cardBadge}>
          {property.status === 'available' ? 'Available' : 'Booked'}
        </span>
      </div>

      <div style={styles.cardContent}>
        <h3 style={styles.cardTitle}>{property.title}</h3>
        <div style={styles.cardLoc}>
          <MapPin size={14} color="var(--text-muted)" />
          <span>{property.address.city}, {property.address.state}</span>
        </div>

        <div style={styles.cardDetails}>
          <div style={styles.cardDetailItem}>
            <Bed size={15} />
            <span>{property.bedrooms} Bed</span>
          </div>
          <div style={styles.cardDetailItem}>
            <Bath size={15} />
            <span>{property.bathrooms} Bath</span>
          </div>
        </div>

        <div style={styles.cardFooter}>
          <div style={styles.cardPrice}>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>₹{Number(property.rentAmount).toLocaleString('en-IN')}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>/mo</span>
          </div>
          <button
            onClick={() => onViewDetails(property)}
            className="btn btn-secondary"
            style={{ padding: '8px 16px', fontSize: '0.85rem' }}
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  card: {
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'var(--card-bg)'
  },
  cardImageContainer: {
    height: '180px',
    position: 'relative',
    background: 'rgba(255,255,255,0.01)',
    overflow: 'hidden'
  },
  cardImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'var(--transition)'
  },
  cardImageFallback: {
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)'
  },
  cardBadge: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    fontSize: '0.68rem'
  },
  cardContent: {
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    flex: 1
  },
  cardTitle: {
    fontSize: '1rem',
    fontWeight: '700',
    color: 'var(--card-title)',
    lineHeight: '1.4'
  },
  cardLoc: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
    marginTop: '6px'
  },
  cardDetails: {
    display: 'flex',
    gap: '16px',
    margin: '16px 0',
    padding: '12px 0',
    borderTop: '1px solid var(--border-glass)',
    borderBottom: '1px solid var(--border-glass)'
  },
  cardDetailItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.8rem',
    color: 'var(--text-secondary)'
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto'
  },
  cardPrice: {
    display: 'flex',
    alignItems: 'baseline'
  }
};

export default PropertyCard;
