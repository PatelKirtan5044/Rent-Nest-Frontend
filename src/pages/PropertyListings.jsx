import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Search, Plus, Filter, MapPin, X, Upload, Building, IndianRupee } from 'lucide-react';
import PropertyCard from '../components/PropertyCard';

const PropertyListings = () => {
  const { user, apiFetch, apiUpload } = useAuth();
  const { addToast } = useSocket();
  const navigate = useNavigate();

  // Common States
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleViewDetails = (property) => {
    navigate(`/properties/${property._id}`);
  };
  
  // Tenant Filter States
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');
  const [minRent, setMinRent] = useState('');
  const [maxRent, setMaxRent] = useState('');
  const [bedrooms, setBedrooms] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);

  // Forms
  const [newProperty, setNewProperty] = useState({
    title: '', description: '', street: '', city: '', state: '', country: 'USA', zipCode: '',
    rentAmount: '', securityDeposit: '', bedrooms: '2', bathrooms: '2', amenities: ''
  });
  const [selectedFiles, setSelectedFiles] = useState([]);

  const fetchProperties = useCallback(async () => {
    if (!user) return;
    try {
      const endpoint = user.role === 'landlord' ? '/properties/my-listings' : '/properties';
      
      // Build query string for tenants
      let queryStr = '';
      if (user.role === 'tenant') {
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (city) params.append('city', city);
        if (minRent) params.append('minRent', minRent);
        if (maxRent) params.append('maxRent', maxRent);
        if (bedrooms) params.append('bedrooms', bedrooms);
        queryStr = '?' + params.toString();
      }

      const res = await apiFetch(`${endpoint}${queryStr}`);
      if (res.success) {
        setProperties(res.data.properties);
      }
    } catch (err) {
      console.error(err);
      addToast('Failed to fetch property listings.', 'danger');
    } finally {
      setLoading(false);
    }
  }, [apiFetch, user, search, city, minRent, maxRent, bedrooms, addToast]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    fetchProperties();
  };

  // Landlord: Add Property
  const handleAddProperty = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    Object.keys(newProperty).forEach(key => {
      formData.append(key, newProperty[key]);
    });
    for (let i = 0; i < selectedFiles.length; i++) {
      formData.append('images', selectedFiles[i]);
    }

    try {
      setLoading(true);
      const res = await apiUpload('/properties', formData);
      if (res.success) {
        addToast('Property listing created successfully!', 'success');
        setShowAddModal(false);
        setNewProperty({
          title: '', description: '', street: '', city: '', state: '', country: 'USA', zipCode: '',
          rentAmount: '', securityDeposit: '', bedrooms: '2', bathrooms: '2', amenities: ''
        });
        setSelectedFiles([]);
        fetchProperties();
      }
    } catch (err) {
      addToast(err.message || 'Failed to create listing.', 'danger');
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      {/* Title / Action bar */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>
            {user.role === 'landlord' ? 'My Property Listings' : 'Explore Rental Properties'}
          </h1>
          <p style={styles.subtitle}>
            {user.role === 'landlord' ? 'Post properties and manage lease applications.' : 'Search and filter homes matching your criteria.'}
          </p>
        </div>

        {user.role === 'landlord' && (
          <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
            <Plus size={18} />
            <span>Add Property</span>
          </button>
        )}
      </div>

      {/* Filters Form for Tenant */}
      {user.role === 'tenant' && (
        <form onSubmit={handleFilterSubmit} className="glass-panel" style={styles.filterForm}>
          <div style={styles.filterGrid} className="property-filter-grid">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Search Keywords</label>
              <div style={styles.inputWrapper}>
                <Search size={16} style={styles.inputIcon} />
                <input
                  type="text"
                  placeholder="e.g. Modern Apartment, 123 Main"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={styles.inputField}
                />
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">City</label>
              <input
                type="text"
                placeholder="e.g. Ankleshwar"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                style={styles.formInput}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Bedrooms</label>
              <select value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} className="form-select">
                <option value="">Any</option>
                <option value="1">1 BHK</option>
                <option value="2">2 BHK</option>
                <option value="3">3 BHK</option>
                <option value="4">4+ BHK</option>
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Max Budget (₹)</label>
              <input
                type="number"
                placeholder="e.g. 3000"
                value={maxRent}
                onChange={(e) => setMaxRent(e.target.value)}
                style={styles.formInput}
              />
            </div>
          </div>
          <button type="submit" className="btn btn-primary" style={styles.filterBtn}>
            <Filter size={16} />
            <span>Apply Filters</span>
          </button>
        </form>
      )}

      {/* Property Cards Listings Grid */}
      {loading ? (
        <div style={styles.loading}>Searching listings...</div>
      ) : properties.length > 0 ? (
        <div style={styles.cardsGrid}>
          {properties.map((property) => (
            <PropertyCard
              key={property._id}
              property={property}
              onViewDetails={handleViewDetails}
            />
          ))}
        </div>
      ) : (
        <div style={styles.emptyContainer}>
          <Building size={48} color="var(--text-muted)" style={{ marginBottom: '16px' }} />
          <h3>No Properties Listed</h3>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px', fontSize: '0.85rem' }}>
            {user.role === 'landlord' ? 'Create a new listing above.' : 'Try adjusting your filters.'}
          </p>
        </div>
      )}


      {/* --- MODAL: ADD PROPERTY LISTING (Landlord only) --- */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={styles.modalHeader}>
              <h2>List New Property</h2>
              <button onClick={() => setShowAddModal(false)} style={styles.closeBtn}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddProperty} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
              <div className="form-group">
                <label className="form-label">Property Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Spacious Penthouse Suite"
                  value={newProperty.title}
                  onChange={(e) => setNewProperty({ ...newProperty, title: e.target.value })}
                  style={styles.formInput}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  required
                  placeholder="Describe property layouts, features, rules..."
                  rows="3"
                  value={newProperty.description}
                  onChange={(e) => setNewProperty({ ...newProperty, description: e.target.value })}
                  style={{ ...styles.formInput, resize: 'none' }}
                />
              </div>

              <div style={styles.grid2Col} className="listings-form-grid-2">
                <div className="form-group">
                  <label className="form-label">Street Address</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 104 Park Ave"
                    value={newProperty.street}
                    onChange={(e) => setNewProperty({ ...newProperty, street: e.target.value })}
                    style={styles.formInput}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">City</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. New York"
                    value={newProperty.city}
                    onChange={(e) => setNewProperty({ ...newProperty, city: e.target.value })}
                    style={styles.formInput}
                  />
                </div>
              </div>

              <div style={styles.grid3Col} className="listings-form-grid-3">
                <div className="form-group">
                  <label className="form-label">State</label>
                  <input
                    type="text"
                    required
                    placeholder="NY"
                    value={newProperty.state}
                    onChange={(e) => setNewProperty({ ...newProperty, state: e.target.value })}
                    style={styles.formInput}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">ZIP Code</label>
                  <input
                    type="text"
                    required
                    placeholder="10001"
                    value={newProperty.zipCode}
                    onChange={(e) => setNewProperty({ ...newProperty, zipCode: e.target.value })}
                    style={styles.formInput}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Country</label>
                  <input
                    type="text"
                    required
                    value={newProperty.country}
                    onChange={(e) => setNewProperty({ ...newProperty, country: e.target.value })}
                    style={styles.formInput}
                  />
                </div>
              </div>

              <div style={styles.grid4Col} className="listings-form-grid-4">
                <div className="form-group">
                  <label className="form-label">Rent (₹)</label>
                  <input
                    type="number"
                    required
                    value={newProperty.rentAmount}
                    onChange={(e) => setNewProperty({ ...newProperty, rentAmount: e.target.value })}
                    style={styles.formInput}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Deposit (₹)</label>
                  <input
                    type="number"
                    required
                    value={newProperty.securityDeposit}
                    onChange={(e) => setNewProperty({ ...newProperty, securityDeposit: e.target.value })}
                    style={styles.formInput}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Beds</label>
                  <input
                    type="number"
                    required
                    value={newProperty.bedrooms}
                    onChange={(e) => setNewProperty({ ...newProperty, bedrooms: e.target.value })}
                    style={styles.formInput}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Baths</label>
                  <input
                    type="number"
                    required
                    value={newProperty.bathrooms}
                    onChange={(e) => setNewProperty({ ...newProperty, bathrooms: e.target.value })}
                    style={styles.formInput}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Amenities (Comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Wi-Fi, Gym, Parking, Pool"
                  value={newProperty.amenities}
                  onChange={(e) => setNewProperty({ ...newProperty, amenities: e.target.value })}
                  style={styles.formInput}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Property Photos</label>
                <div style={styles.uploadBox}>
                  <Upload size={24} color="var(--text-secondary)" />
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => setSelectedFiles(Array.from(e.target.files))}
                    style={styles.fileInput}
                  />
                  <span>
                    {selectedFiles.length > 0 ? `${selectedFiles.length} file(s) selected` : 'Drag and Drop or Click to Upload'}
                  </span>
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ padding: '12px' }}>
                Publish Property Listing
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
  filterForm: {
    padding: '24px',
    backgroundColor: 'var(--card-bg)',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  filterGrid: {
    display: 'grid',
    gridTemplateColumns: '1.5fr 1fr 0.8fr 1fr',
    gap: '16px'
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center'
  },
  inputIcon: {
    position: 'absolute',
    left: '12px',
    color: 'var(--text-muted)'
  },
  inputField: {
    width: '100%',
    background: 'var(--bg-primary)',
    border: '1px solid var(--border-glass)',
    borderRadius: 'var(--radius-sm)',
    padding: '12px 12px 12px 38px',
    color: 'var(--text-primary)',
    fontSize: '0.9rem',
    transition: 'var(--transition)'
  },
  formInput: {
    background: 'var(--bg-primary)',
    border: '1px solid var(--border-glass)',
    borderRadius: 'var(--radius-sm)',
    padding: '12px 16px',
    color: 'var(--text-primary)',
    fontSize: '0.9rem',
    transition: 'var(--transition)',
    width: '100%'
  },
  filterBtn: {
    alignSelf: 'flex-end',
    padding: '12px 24px',
    width: 'fit-content'
  },
  cardsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '28px'
  },

  cardLoc: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
    marginTop: '6px'
  },

  loading: {
    textAlign: 'center',
    padding: '60px 0',
    color: 'var(--text-secondary)',
    fontSize: '1.1rem'
  },
  emptyContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 0',
    textAlign: 'center'
  },
  detailsModal: {
    maxWidth: '900px',
    width: '100%'
  },
  modalHeaderNew: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottom: '1px solid var(--border-glass)',
    paddingBottom: '16px',
    position: 'relative'
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '24px',
    flexWrap: 'wrap'
  },
  priceContainer: {
    display: 'flex',
    flexDirection: 'column'
  },
  priceVal: {
    fontSize: '2rem',
    fontWeight: '800',
    color: 'var(--success)'
  },
  priceSubtext: {
    fontSize: '0.8rem',
    color: 'var(--text-secondary)'
  },
  titleContainer: {
    display: 'flex',
    flexDirection: 'column'
  },
  titleMain: {
    fontSize: '1.5rem',
    fontWeight: '800',
    color: 'var(--text-primary)'
  },
  titleSub: {
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
    marginTop: '2px'
  },
  addressSub: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
    marginTop: '2px'
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginRight: '30px'
  },
  contactBtn: {
    padding: '10px 20px',
    fontWeight: '700'
  },
  shortlistBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 18px',
    fontWeight: '600'
  },
  closeBtnNew: {
    position: 'absolute',
    top: '-4px',
    right: '-4px',
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    padding: '4px'
  },
  tabsNew: {
    display: 'flex',
    borderBottom: '1px solid var(--border-glass)',
    marginTop: '16px',
    gap: '24px'
  },
  tabBtnNew: {
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    padding: '10px 4px',
    fontSize: '0.92rem',
    fontWeight: '600',
    cursor: 'pointer',
    position: 'relative',
    transition: 'var(--transition)'
  },
  tabBtnActiveNew: {
    color: 'var(--primary)',
    borderBottom: '2px solid var(--primary)'
  },
  mainGridNew: {
    display: 'grid',
    gridTemplateColumns: '1.2fr 1fr',
    gap: '24px',
    marginTop: '20px'
  },
  sliderContainer: {
    height: '320px',
    borderRadius: 'var(--radius-sm)',
    overflow: 'hidden',
    position: 'relative',
    background: 'var(--bg-primary)'
  },
  sliderImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  sliderArrowLeft: {
    position: 'absolute',
    top: '50%',
    left: '12px',
    transform: 'translateY(-50%)',
    background: 'var(--bg-primary)',
    border: 'none',
    color: 'var(--text-primary)',
    borderRadius: '50%',
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    zIndex: 10,
    transition: 'var(--transition)'
  },
  sliderArrowRight: {
    position: 'absolute',
    top: '50%',
    right: '12px',
    transform: 'translateY(-50%)',
    background: 'var(--bg-primary)',
    border: 'none',
    color: 'var(--text-primary)',
    borderRadius: '50%',
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    zIndex: 10,
    transition: 'var(--transition)'
  },
  sliderBadge: {
    position: 'absolute',
    top: '12px',
    left: '12px',
    background: 'rgba(0, 0, 0, 0.65)',
    color: '#ffffff',
    fontSize: '0.75rem',
    fontWeight: '600',
    padding: '4px 10px',
    borderRadius: '4px'
  },
  contactedBadge: {
    position: 'absolute',
    bottom: '12px',
    left: '12px',
    background: 'rgba(16, 185, 129, 0.9)',
    color: '#ffffff',
    fontSize: '0.72rem',
    fontWeight: '700',
    padding: '6px 12px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  specsContainer: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px'
  },
  specCard: {
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-glass)',
    borderRadius: '12px',
    padding: '14px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    boxShadow: 'var(--shadow-sm)'
  },
  specItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '0.85rem'
  },
  specLabel: {
    color: 'var(--text-muted)',
    fontSize: '0.75rem',
    fontWeight: '600'
  },
  specVal: {
    color: 'var(--text-primary)',
    fontWeight: '700',
    marginTop: '2px'
  },
  considerSection: {
    marginTop: '24px'
  },
  considerTitle: {
    fontSize: '0.95rem',
    fontWeight: '800',
    color: 'var(--text-primary)',
    marginBottom: '12px'
  },
  tagsContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px'
  },
  tagPill: {
    padding: '6px 14px',
    borderRadius: '50px',
    background: 'rgba(16, 185, 129, 0.1)',
    border: '1px solid rgba(16, 185, 129, 0.2)',
    color: 'var(--success)',
    fontSize: '0.75rem',
    fontWeight: '700'
  },
  bottomSpecGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginTop: '24px',
    borderTop: '1px solid var(--border-glass)',
    paddingTop: '16px'
  },
  bottomSpecItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-glass)',
    borderRadius: '12px',
    padding: '14px 20px',
    boxShadow: 'var(--shadow-sm)'
  },
  bottomSpecLabel: {
    color: 'var(--text-muted)',
    fontSize: '0.82rem',
    fontWeight: '600'
  },
  bottomSpecVal: {
    color: 'var(--text-primary)',
    fontSize: '0.88rem',
    fontWeight: '700'
  },
  ownerDetailsContainer: {
    padding: '24px',
    marginTop: '20px',
    backgroundColor: 'var(--bg-primary)'
  },
  ownerHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '20px'
  },
  ownerAvatar: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    background: 'var(--primary-gradient)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.25rem',
    fontWeight: 'bold',
    color: 'var(--text-primary)'
  },
  ownerName: {
    fontSize: '1.1rem',
    fontWeight: '700',
    color: 'var(--text-primary)'
  },
  ownerBadge: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    marginTop: '2px',
    display: 'inline-block'
  },
  ownerInfoList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  ownerInfoItem: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.88rem',
    paddingBottom: '8px',
    borderBottom: '1px solid var(--border-glass)'
  },
  reviewsContainer: {
    padding: '24px',
    marginTop: '20px',
    backgroundColor: 'var(--bg-primary)',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  reviewsHeader: {
    borderBottom: '1px solid var(--border-glass)',
    paddingBottom: '16px'
  },
  ratingBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  ratingNumber: {
    fontSize: '1.8rem',
    fontWeight: '800',
    color: 'var(--warning)'
  },
  ratingStars: {
    display: 'flex'
  },
  ratingCount: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)'
  },
  reviewList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  reviewItem: {
    paddingBottom: '16px',
    borderBottom: '1px solid var(--border-glass)'
  },
  reviewMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    marginBottom: '6px'
  },
  reviewText: {
    fontSize: '0.88rem',
    color: 'var(--text-primary)',
    lineHeight: '1.4'
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
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalBody: {
    marginTop: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  modalGallery: {
    height: '240px',
    borderRadius: 'var(--radius-sm)',
    overflow: 'hidden',
    background: 'var(--bg-primary)'
  },
  modalGalleryImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  galleryFallback: {
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--text-muted)'
  },
  modalDetailsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  modalTitle: {
    fontSize: '1.35rem',
    fontWeight: '800',
    color: 'var(--text-primary)'
  },
  modalPrice: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end'
  },
  divider: {
    height: '1px',
    background: 'var(--border-glass)'
  },
  modalSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  sectionLabel: {
    fontSize: '0.85rem',
    fontWeight: '700',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  },
  sectionText: {
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.5'
  },
  chipsContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginTop: '4px'
  },
  chip: {
    padding: '6px 12px',
    borderRadius: '50px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid var(--border-glass)',
    fontSize: '0.75rem',
    fontWeight: '600',
    color: 'var(--text-primary)'
  },
  grid2Col: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px'
  },
  grid3Col: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1.2fr',
    gap: '16px'
  },
  grid4Col: {
    display: 'grid',
    gridTemplateColumns: '1.2fr 1.2fr 0.8fr 0.8fr',
    gap: '16px'
  },
  uploadBox: {
    border: '1px dashed var(--border-glass)',
    borderRadius: 'var(--radius-sm)',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    cursor: 'pointer',
    position: 'relative',
    background: 'rgba(255,255,255,0.01)',
    transition: 'var(--transition)',
    textAlign: 'center',
    fontSize: '0.85rem',
    color: 'var(--text-secondary)'
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

export default PropertyListings;
