import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth, BASE_URL } from '../context/AuthContext';
import { ChevronLeft, ChevronRight, Heart, BedDouble, Bath, Sparkles, Clock, User, Star, IndianRupee, LogIn, UserPlus, Sun, Moon, ArrowLeft, Building, MapPin, X } from 'lucide-react';
import LogoIcon from '../components/LogoIcon';

const getTagStyle = (tag, index) => {
  const colors = [
    { bg: 'rgba(37, 99, 235, 0.08)', border: 'rgba(37, 99, 235, 0.15)', text: '#2563eb' },
    { bg: 'rgba(16, 185, 129, 0.08)', border: 'rgba(16, 185, 129, 0.15)', text: '#059669' },
    { bg: 'rgba(217, 119, 6, 0.08)', border: 'rgba(217, 119, 6, 0.15)', text: '#d97706' },
    { bg: 'rgba(239, 68, 68, 0.08)', border: 'rgba(239, 68, 68, 0.15)', text: '#dc2626' },
    { bg: 'rgba(6, 182, 212, 0.08)', border: 'rgba(6, 182, 212, 0.15)', text: '#0891b2' },
    { bg: 'rgba(168, 85, 247, 0.08)', border: 'rgba(168, 85, 247, 0.15)', text: '#9333ea' }
  ];
  const color = colors[index % colors.length];
  return {
    padding: '6px 14px',
    borderRadius: '50px',
    background: color.bg,
    border: `1px solid ${color.border}`,
    color: color.text,
    fontSize: '0.75rem',
    fontWeight: '700'
  };
};

const PublicPropertyDetails = () => {
  const { id } = useParams();
  const { apiFetch } = useAuth();
  const navigate = useNavigate();

  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light-theme');
    } else {
      document.documentElement.classList.remove('light-theme');
    }
  }, [theme]);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
  };

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        setLoading(true);
        const res = await apiFetch(`/properties/${id}`);
        if (res.success) {
          setProperty(res.data.property);
        }
      } catch (err) {
        console.error('Error fetching property:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProperty();
  }, [id, apiFetch]);

  const triggerAuthPrompt = () => {
    setShowAuthPrompt(true);
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingText}>Fetching listing details...</div>
      </div>
    );
  }

  if (!property) {
    return (
      <div style={styles.container}>
        <header style={styles.navbar}>
          <div style={styles.navBrand} onClick={() => navigate('/')}>
            <LogoIcon size={44} />
            <div style={styles.brandName}>
              <span style={styles.brandWhite}>Rent</span>
              <span style={styles.brandAccent}>Nest</span>
            </div>
          </div>
        </header>
        <div style={styles.errorContainer}>
          <Building size={48} color="var(--text-muted)" />
          <h2>Property Not Found</h2>
          <p>We could not find the property you are looking for.</p>
          <button onClick={() => navigate('/')} className="btn btn-primary" style={{ marginTop: '20px' }}>
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Public Navbar */}
      <header style={styles.navbar}>
        <div style={styles.navBrand} onClick={() => navigate('/')}>
          <LogoIcon size={44} />
          <div style={styles.brandName}>
            <span style={styles.brandWhite}>Rent</span>
            <span style={styles.brandAccent}>Nest</span>
          </div>
        </div>
        <div style={styles.navActions}>
          <button onClick={toggleTheme} style={styles.themeBtn} className="theme-btn" title="Toggle Light/Dark Theme">
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          <button onClick={() => navigate('/login')} style={styles.loginBtn} className="btn btn-secondary">
            <LogIn size={16} />
            <span>Login</span>
          </button>
          <button onClick={() => navigate('/signup')} style={styles.signupBtn} className="btn btn-primary">
            <UserPlus size={16} />
            <span>Sign Up</span>
          </button>
        </div>
      </header>

      {/* Main Details Panel */}
      <main style={styles.mainContent}>
        <button onClick={() => navigate('/')} style={styles.backBtn} className="btn btn-secondary">
          <ArrowLeft size={16} />
          <span>Back to Listings</span>
        </button>

        <div className="modal-card details-card-container" style={styles.detailsCard}>
          {/* Top: Large Image Carousel Slider */}
          <div style={styles.sliderContainer} className="details-slider-container">
            {property.images && property.images.length > 0 ? (
              <>
                <img
                  src={property.images[activeImgIndex].startsWith('http') ? property.images[activeImgIndex] : `${BASE_URL}${property.images[activeImgIndex]}`}
                  alt="Property"
                  style={styles.sliderImg}
                />
                {property.images.length > 1 && (
                  <>
                    <button
                      onClick={() => setActiveImgIndex(prev => (prev === 0 ? property.images.length - 1 : prev - 1))}
                      style={styles.sliderArrowLeft}
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      onClick={() => setActiveImgIndex(prev => (prev === property.images.length - 1 ? 0 : prev + 1))}
                      style={styles.sliderArrowRight}
                    >
                      <ChevronRight size={20} />
                    </button>
                  </>
                )}
                <div style={styles.sliderBadge}>
                  Property ({property.images.length})
                </div>
                <div style={styles.contactedBadge}>
                  <Sparkles size={12} color="var(--success)" />
                  <span>Verified Listing &amp; RERA Compliant</span>
                </div>
              </>
            ) : (
              <div style={styles.galleryFallback}>No Image Listed</div>
            )}
          </div>

          {/* Header Summary */}
          <div style={styles.headerArea} className="details-header-area">
            <div style={styles.headerLeft} className="details-header-left">
              <div style={styles.priceContainer}>
                <span style={styles.priceVal}>₹{property.rentAmount.toLocaleString()}</span>
                <span style={styles.priceSubtext}>Per Month</span>
              </div>
              <div style={styles.titleContainer}>
                <div style={styles.titleRow}>
                  <h2 style={styles.titleMain}>{property.bedrooms} Bedroom {property.bathrooms} Bath</h2>
                  <span className={`badge badge-${property.status === 'available' ? 'success' : 'danger'}`} style={{ marginLeft: '12px' }}>
                    {property.status === 'available' ? 'Available' : 'Booked'}
                  </span>
                </div>
                <p style={styles.titleSub}>{property.title}</p>
                <p style={styles.addressSub}>in {property.address.street}, {property.address.city}</p>
              </div>
            </div>
            <div style={styles.headerRight} className="details-header-right">
              {property.status === 'available' ? (
                <button onClick={triggerAuthPrompt} className="btn btn-primary" style={styles.contactBtn}>
                  Contact Owner
                </button>
              ) : (
                <button className="btn btn-secondary" style={{ ...styles.contactBtn, cursor: 'not-allowed', opacity: 0.6 }} disabled>
                  Booked
                </button>
              )}
              <button onClick={triggerAuthPrompt} className="btn btn-secondary" style={styles.shortlistBtn}>
                <Heart size={16} color="var(--text-secondary)" />
                <span>Shortlist</span>
              </button>
            </div>
          </div>

          {/* Tabs Bar */}
          <div style={styles.tabsNew} className="details-tabs">
            {['Overview', 'Owner Details', 'Reviews'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab.toLowerCase())}
                style={{
                  ...styles.tabBtnNew,
                  ...(activeTab === tab.toLowerCase() ? styles.tabBtnActiveNew : {})
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Modal body based on active tab */}
          <div style={styles.modalBody}>
            {activeTab === 'overview' && (
              <>
                {/* Specifications key-value grid */}
                <div style={styles.specsContainer} className="details-specs-grid">
                  <div style={styles.specCard}>
                    <Building size={18} color="var(--primary)" />
                    <div>
                      <div style={styles.specLabel}>Configuration</div>
                      <div style={styles.specVal}>{property.bedrooms} Bedroom, {property.bathrooms} Bathroom</div>
                    </div>
                  </div>
                  <div style={styles.specCard}>
                    <IndianRupee size={18} color="var(--success)" />
                    <div>
                      <div style={styles.specLabel}>Rent</div>
                      <div style={styles.specVal}>₹{property.rentAmount.toLocaleString()}</div>
                    </div>
                  </div>
                  <div style={styles.specCard}>
                    <IndianRupee size={18} color="var(--primary)" />
                    <div>
                      <div style={styles.specLabel}>Security Deposit</div>
                      <div style={styles.specVal}>₹{property.securityDeposit.toLocaleString()}</div>
                    </div>
                  </div>
                  <div style={styles.specCard}>
                    <MapPin size={18} color="var(--warning)" />
                    <div>
                      <div style={styles.specLabel}>Address</div>
                      <div style={styles.specVal}>{property.address.street}, {property.address.city}</div>
                    </div>
                  </div>
                  <div style={styles.specCard}>
                    <Clock size={18} color="var(--primary)" />
                    <div>
                      <div style={styles.specLabel}>Furnishing</div>
                      <div style={styles.specVal}>Semifurnished</div>
                    </div>
                  </div>
                  <div style={styles.specCard}>
                    <User size={18} color="var(--success)" />
                    <div>
                      <div style={styles.specLabel}>Available For</div>
                      <div style={styles.specVal}>Bachelors / Families</div>
                    </div>
                  </div>
                </div>

                {/* Why should you consider section */}
                <div style={styles.considerSection}>
                  <h4 style={styles.considerTitle}>Why should you consider this property?</h4>
                  <div style={styles.tagsContainer}>
                    {[
                      'North-East Facing',
                      'Close to School',
                      'Close to Hospital',
                      'Close to Market',
                      'Gated Society',
                      'Vaastu Compliant',
                      'Modular Kitchen',
                      'Vitrified Flooring',
                      'Semi-Furnished'
                    ].map((tag, idx) => (
                      <span key={idx} style={getTagStyle(tag, idx)}>{tag}</span>
                    ))}
                  </div>
                </div>

                {/* Bottom specifications lists */}
                <div style={styles.bottomSpecGrid} className="details-bottom-specs-grid">
                  <div style={styles.bottomSpecItem}>
                    <span style={styles.bottomSpecLabel}>Flooring</span>
                    <strong style={styles.bottomSpecVal}>Vitrified</strong>
                  </div>
                  <div style={styles.bottomSpecItem}>
                    <span style={styles.bottomSpecLabel}>Electricity &amp; Water</span>
                    <strong style={styles.bottomSpecVal}>Charges not included</strong>
                  </div>
                  <div style={styles.bottomSpecItem}>
                    <span style={styles.bottomSpecLabel}>Power Backup</span>
                    <strong style={styles.bottomSpecVal}>None</strong>
                  </div>
                  <div style={styles.bottomSpecItem}>
                    <span style={styles.bottomSpecLabel}>Property Age</span>
                    <strong style={styles.bottomSpecVal}>5+ Years Old</strong>
                  </div>
                </div>

                {/* Location & Map Section */}
                <div style={styles.mapSection}>
                  <h4 style={styles.considerTitle}>Location &amp; Neighborhood</h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '16px' }}>
                    {property.address.street}, {property.address.city}, {property.address.state}, {property.address.country}
                  </p>
                  <div style={styles.mapContainer}>
                    <iframe
                      title="Property Location Map"
                      width="100%"
                      height="350"
                      frameBorder="0"
                      scrolling="no"
                      marginHeight="0"
                      marginWidth="0"
                      src={`https://maps.google.com/maps?q=${encodeURIComponent(`${property.address.street}, ${property.address.city}, ${property.address.state}, ${property.address.country}`)}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
                      style={{ border: 0, borderRadius: '12px', display: 'block' }}
                    />
                  </div>
                </div>
              </>
            )}

            {activeTab === 'owner details' && (
              <div style={styles.ownerDetailsContainer} className="glass-panel">
                <div style={styles.ownerHeader}>
                  <div style={styles.ownerAvatar}>
                    {property.landlord?.name ? property.landlord.name.charAt(0).toUpperCase() : 'O'}
                  </div>
                  <div>
                    <h4 style={styles.ownerName}>{property.landlord?.name || 'Property Owner'}</h4>
                    <span style={styles.ownerBadge}>Landlord / Primary Contact</span>
                  </div>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: '20px 0' }}>
                  Contact information is locked for guests. Please log in to request landlord email and telephone details.
                </p>
                <button onClick={() => navigate('/login')} className="btn btn-primary" style={{ width: '100%' }}>
                  Login to view Owner Details
                </button>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div style={styles.reviewsContainer} className="glass-panel">
                <div style={styles.reviewsHeader}>
                  <div style={styles.ratingBox}>
                    <div style={styles.ratingNumber}>4.8</div>
                    <div style={styles.ratingStars}>
                      {[1, 2, 3, 4, 5].map(star => <Star key={star} size={16} fill="var(--warning)" color="var(--warning)" style={{ marginRight: '2px' }} />)}
                    </div>
                    <span style={styles.ratingCount}>Locality Rating (15 Reviews)</span>
                  </div>
                </div>
                <div style={styles.reviewList}>
                  <div style={styles.reviewItem}>
                    <div style={styles.reviewMeta}>
                      <strong>Kirtan Patel</strong>
                      <span>June 2026</span>
                    </div>
                    <p style={styles.reviewText}>
                      Great area with all facilities close by. Very quiet neighborhood, gated security, and close to main transport links.
                    </p>
                  </div>
                  <div style={styles.reviewItem}>
                    <div style={styles.reviewMeta}>
                      <strong>Sarah T.</strong>
                      <span>May 2026</span>
                    </div>
                    <p style={styles.reviewText}>
                      Clean environment. Easy access to shopping complex, schools and hospitals. Recommended for families.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* --- MODAL: GUEST AUTHENTICATION PROMPT --- */}
      {showAuthPrompt && (
        <div className="modal-overlay" onClick={() => setShowAuthPrompt(false)}>
          <div className="modal-content modal-card" onClick={(e) => e.stopPropagation()} style={styles.authModal}>
            <div style={styles.authModalHeader}>
              <h3>Authentication Required</h3>
              <button onClick={() => setShowAuthPrompt(false)} style={styles.closeBtnNew}>
                <X size={20} />
              </button>
            </div>
            <div style={styles.authModalBody}>
              <div style={styles.authIconContainer}>
                <Building size={40} color="var(--primary)" />
              </div>
              <p style={styles.authText}>
                Please log in or register a tenant account to apply for lease contracts, contact landlords directly, or shortlist listings.
              </p>
              <div style={styles.authActions}>
                <button onClick={() => navigate('/login')} className="btn btn-primary" style={{ flex: 1, padding: '12px' }}>
                  Login Now
                </button>
                <button onClick={() => navigate('/signup')} className="btn btn-secondary" style={{ flex: 1, padding: '12px' }}>
                  Create Account
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    fontFamily: 'Inter, sans-serif'
  },
  loadingContainer: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-secondary)'
  },
  loadingText: {
    fontSize: '1.1rem',
    fontWeight: '600'
  },
  errorContainer: {
    maxWidth: '500px',
    margin: '100px auto 0 auto',
    textAlign: 'center',
    padding: '40px',
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-glass)',
    borderRadius: '16px',
    boxShadow: 'var(--shadow-md)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px'
  },
  navbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 40px',
    height: '80px',
    borderBottom: '1px solid var(--border-glass)',
    background: 'var(--bg-glass)',
    backdropFilter: 'blur(16px)',
    position: 'sticky',
    top: 0,
    zIndex: 99
  },
  navBrand: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    cursor: 'pointer'
  },
  logoIcon: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    background: 'var(--primary-gradient)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '0.8rem',
    color: '#fff'
  },
  brandName: {
    fontSize: '1.2rem',
    fontWeight: 800,
    letterSpacing: '-0.02em'
  },
  brandWhite: {
    color: 'var(--text-primary)'
  },
  brandAccent: {
    background: 'var(--primary-gradient)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent'
  },
  navActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  },
  themeBtn: {
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid var(--border-glass)',
    color: 'var(--text-secondary)',
    width: '38px',
    height: '38px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'var(--transition)'
  },
  loginBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 18px',
    fontSize: '0.9rem',
    fontWeight: '600'
  },
  signupBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 18px',
    fontSize: '0.9rem',
    fontWeight: '600'
  },
  mainContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '40px 20px 80px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  },
  backBtn: {
    alignSelf: 'flex-start',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    fontSize: '0.88rem',
    fontWeight: '600'
  },
  detailsCard: {
    width: '100%',
    padding: '32px'
  },
  headerArea: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottom: '1px solid var(--border-glass)',
    paddingBottom: '20px',
    flexWrap: 'wrap',
    gap: '20px'
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '30px',
    flexWrap: 'wrap'
  },
  priceContainer: {
    display: 'flex',
    flexDirection: 'column'
  },
  priceVal: {
    fontSize: '2.2rem',
    fontWeight: '800',
    color: 'var(--success)'
  },
  priceSubtext: {
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
    marginTop: '2px'
  },
  titleContainer: {
    display: 'flex',
    flexDirection: 'column'
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center'
  },
  titleMain: {
    fontSize: '1.6rem',
    fontWeight: '800',
    color: 'var(--text-primary)'
  },
  titleSub: {
    fontSize: '0.95rem',
    color: 'var(--text-secondary)',
    marginTop: '4px'
  },
  addressSub: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
    marginTop: '2px'
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  contactBtn: {
    padding: '12px 24px',
    fontWeight: '700'
  },
  shortlistBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 20px',
    fontWeight: '600'
  },
  tabsNew: {
    display: 'flex',
    borderBottom: '1px solid var(--border-glass)',
    marginTop: '24px',
    gap: '32px'
  },
  tabBtnNew: {
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    padding: '12px 4px',
    fontSize: '0.95rem',
    fontWeight: '600',
    cursor: 'pointer',
    position: 'relative',
    transition: 'var(--transition)'
  },
  tabBtnActiveNew: {
    color: 'var(--primary)',
    borderBottom: '2px solid var(--primary)'
  },
  modalBody: {
    marginTop: '24px'
  },
  mainGridNew: {
    display: 'grid',
    gridTemplateColumns: '1.2fr 1fr',
    gap: '32px'
  },
  sliderContainer: {
    height: '580px',
    borderRadius: '16px',
    overflow: 'hidden',
    position: 'relative',
    background: 'rgba(0,0,0,0.03)',
    border: '1px solid var(--border-glass)',
    marginBottom: '32px'
  },
  sliderImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  sliderArrowLeft: {
    position: 'absolute',
    top: '50%',
    left: '16px',
    transform: 'translateY(-50%)',
    background: 'rgba(0,0,0,0.5)',
    border: 'none',
    color: '#ffffff',
    borderRadius: '50%',
    width: '40px',
    height: '40px',
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
    right: '16px',
    transform: 'translateY(-50%)',
    background: 'rgba(0,0,0,0.5)',
    border: 'none',
    color: '#ffffff',
    borderRadius: '50%',
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    zIndex: 10,
    transition: 'var(--transition)'
  },
  sliderBadge: {
    position: 'absolute',
    top: '16px',
    left: '16px',
    background: 'rgba(0, 0, 0, 0.65)',
    color: '#ffffff',
    fontSize: '0.75rem',
    fontWeight: '600',
    padding: '6px 12px',
    borderRadius: '6px'
  },
  contactedBadge: {
    position: 'absolute',
    bottom: '16px',
    left: '16px',
    background: 'rgba(16, 185, 129, 0.9)',
    color: '#ffffff',
    fontSize: '0.72rem',
    fontWeight: '700',
    padding: '6px 12px',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  galleryFallback: {
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--text-muted)'
  },
  specsContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '16px',
    marginTop: '24px'
  },
  specCard: {
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-glass)',
    borderRadius: '12px',
    padding: '16px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    boxShadow: 'var(--shadow-sm)'
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
    marginTop: '32px'
  },
  considerTitle: {
    fontSize: '1rem',
    fontWeight: '800',
    color: 'var(--text-primary)',
    marginBottom: '16px'
  },
  tagsContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px'
  },
  bottomSpecGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '16px',
    marginTop: '32px',
    borderTop: '1px solid var(--border-glass)',
    paddingTop: '24px'
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
    padding: '30px',
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-glass)',
    borderRadius: '16px',
    textAlign: 'center',
    maxWidth: '500px',
    margin: '0 auto',
    boxShadow: 'var(--shadow-sm)'
  },
  ownerHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '24px',
    textAlign: 'left'
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
    color: '#fff'
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
  reviewsContainer: {
    padding: '30px',
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-glass)',
    borderRadius: '16px',
    boxShadow: 'var(--shadow-sm)',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
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
    gap: '20px'
  },
  reviewItem: {
    paddingBottom: '20px',
    borderBottom: '1px solid var(--border-glass)'
  },
  reviewMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    marginBottom: '8px'
  },
  reviewText: {
    fontSize: '0.9rem',
    color: 'var(--text-primary)',
    lineHeight: '1.5'
  },
  authModal: {
    maxWidth: '440px',
    width: '100%',
    padding: '24px',
    border: 'none'
  },
  authModalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid var(--border-glass)',
    paddingBottom: '12px',
    position: 'relative'
  },
  authModalBody: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: '18px',
    marginTop: '20px'
  },
  authIconContainer: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    background: 'rgba(99, 102, 241, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid rgba(99, 102, 241, 0.2)'
  },
  authText: {
    fontSize: '0.92rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.5'
  },
  authActions: {
    display: 'flex',
    width: '100%',
    gap: '16px',
    marginTop: '8px'
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
  mapSection: {
    marginTop: '32px',
    borderTop: '1px solid var(--border-glass)',
    paddingTop: '24px'
  },
  mapContainer: {
    borderRadius: '16px',
    overflow: 'hidden',
    border: '1px solid var(--border-glass)',
    background: 'rgba(0,0,0,0.02)',
    boxShadow: 'var(--shadow-sm)'
  }
};

export default PublicPropertyDetails;
