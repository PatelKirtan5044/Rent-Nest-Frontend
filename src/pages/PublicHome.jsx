import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Search, MapPin, Building, IndianRupee, LogIn, UserPlus, Sun, Moon } from 'lucide-react';
import PropertyCard from '../components/PropertyCard';
import LogoIcon from '../components/LogoIcon';

const PublicHome = () => {
  const { apiFetch } = useAuth();
  const navigate = useNavigate();

  // Property Data states
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search/Filter states
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');
  const [maxRent, setMaxRent] = useState('');
  const [bedrooms, setBedrooms] = useState('');

  // Theme states
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

  const fetchProperties = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (city) params.append('city', city);
      if (maxRent) params.append('maxRent', maxRent);
      if (bedrooms) params.append('bedrooms', bedrooms);
      const queryStr = params.toString() ? '?' + params.toString() : '';

      const res = await apiFetch(`/properties${queryStr}`);
      if (res.success) {
        setProperties(res.data.properties);
      }
    } catch (err) {
      console.error('Error fetching public listings:', err);
    } finally {
      setLoading(false);
    }
  }, [apiFetch, search, city, maxRent, bedrooms]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchProperties();
  };

  const handleViewDetails = (property) => {
    navigate(`/properties/${property._id}`);
  };

  return (
    <div style={styles.container}>
      {/* Public Navbar */}
      <header style={styles.navbar} className="public-navbar">
        <div style={styles.navBrand} className="public-nav-brand" onClick={() => navigate('/')}>
          <LogoIcon size={44} />
          <div style={styles.brandName}>
            <span style={styles.brandWhite}>Rent</span>
            <span style={styles.brandAccent}>Nest</span>
          </div>
        </div>
        <div style={styles.navActions} className="public-nav-actions">
          <button onClick={toggleTheme} style={styles.themeBtn} className="theme-btn" title="Toggle Light/Dark Theme">
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          <button onClick={() => navigate('/login')} style={styles.loginBtn} className="btn btn-secondary public-nav-login-btn">
            <LogIn size={16} />
            <span>Login</span>
          </button>
          <button onClick={() => navigate('/signup')} style={styles.signupBtn} className="btn btn-primary public-nav-signup-btn">
            <UserPlus size={16} />
            <span>Sign Up</span>
          </button>
        </div>
      </header>

      {/* Hero Banner Section */}
      <section style={styles.heroSection} className="hero-section">
        <div style={styles.heroContent}>
          <h1 style={styles.heroTitle} className="hero-title">Find Your Perfect Rental Home</h1>
          <p style={styles.heroSubtitle} className="hero-subtitle">Browse verified luxury listings, apply securely, and sign tenancy agreements digitally.</p>

          {/* Glassmorphic Search Bar */}
          <form onSubmit={handleSearchSubmit} style={styles.searchBar} className="glass-panel hero-search-bar">
            <div style={styles.searchGroup} className="search-group">
              <Search size={18} color="var(--text-muted)" style={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search projects, keywords..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={styles.searchInput}
                className="search-input"
              />
            </div>
            <div style={styles.dividerVertical} className="search-divider" />
            <div style={styles.searchGroup} className="search-group">
              <MapPin size={18} color="var(--text-muted)" style={styles.searchIcon} />
              <input
                type="text"
                placeholder="City (e.g. Surat)"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                style={styles.searchInput}
                className="search-input"
              />
            </div>
            <div style={styles.dividerVertical} className="search-divider" />
            <div style={styles.searchGroup} className="search-group">
              <IndianRupee size={16} color="var(--text-muted)" style={styles.searchIcon} />
              <input
                type="number"
                placeholder="Max Rent"
                value={maxRent}
                onChange={(e) => setMaxRent(e.target.value)}
                style={styles.searchInput}
                className="search-input"
              />
            </div>
            <div style={styles.dividerVertical} className="search-divider" />
            <div style={styles.searchGroup} className="search-group">
              <select
                value={bedrooms}
                onChange={(e) => setBedrooms(e.target.value)}
                style={styles.searchSelect}
                className="search-select"
              >
                <option value="">Bedrooms</option>
                <option value="1">1 BHK</option>
                <option value="2">2 BHK</option>
                <option value="3">3 BHK</option>
                <option value="4">4+ BHK</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary search-btn" style={styles.searchBtn}>
              Search
            </button>
          </form>
        </div>
      </section>

      {/* Main Listings Grid */}
      <main style={styles.mainContent}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Featured Rental Listings</h2>
          <p style={styles.sectionSubtitle}>Explore hand-picked properties available for immediate tenancy.</p>
        </div>

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
            <h3>No Properties Found</h3>
            <p style={{ color: 'var(--text-secondary)', marginTop: '8px', fontSize: '0.85rem' }}>
              We couldn't find any listings matching your search criteria.
            </p>
          </div>
        )}
      </main>

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
    color: 'var(--text-primary)'
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
  heroSection: {
    padding: '80px 20px',
    textAlign: 'center',
    background: 'radial-gradient(circle at top, rgba(99, 102, 241, 0.15) 0%, rgba(10, 11, 16, 0) 60%)',
    borderBottom: '1px solid var(--border-glass)'
  },
  heroContent: {
    maxWidth: '800px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px'
  },
  heroTitle: {
    fontSize: '3rem',
    fontWeight: '850',
    letterSpacing: '-0.03em',
    lineHeight: '1.1',
    color: 'var(--text-primary)',
    background: 'var(--hero-title-gradient)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  heroSubtitle: {
    fontSize: '1.1rem',
    color: 'var(--text-secondary)',
    maxWidth: '600px',
    lineHeight: '1.5'
  },
  searchBar: {
    display: 'flex',
    width: '100%',
    maxWidth: '840px',
    padding: '10px 14px',
    borderRadius: '16px',
    marginTop: '32px',
    alignItems: 'center',
    background: 'var(--search-bar-bg)',
    border: '1px solid var(--border-glass)',
    boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
  },
  searchGroup: {
    display: 'flex',
    alignItems: 'center',
    flex: 1,
    padding: '0 12px'
  },
  searchIcon: {
    marginRight: '10px',
    flexShrink: 0
  },
  searchInput: {
    background: 'none',
    border: 'none',
    color: 'var(--text-primary)',
    fontSize: '0.9rem',
    width: '100%',
    outline: 'none'
  },
  searchSelect: {
    background: 'none',
    border: 'none',
    color: 'var(--text-primary)',
    fontSize: '0.9rem',
    width: '100%',
    outline: 'none',
    cursor: 'pointer',
    opacity: 0.85
  },
  dividerVertical: {
    width: '1px',
    height: '24px',
    background: 'var(--border-glass)'
  },
  searchBtn: {
    padding: '10px 24px',
    borderRadius: '10px',
    fontSize: '0.9rem',
    fontWeight: '700'
  },
  mainContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '60px 40px'
  },
  sectionHeader: {
    marginBottom: '32px'
  },
  sectionTitle: {
    fontSize: '1.6rem',
    fontWeight: '800',
    color: 'var(--text-primary)'
  },
  sectionSubtitle: {
    fontSize: '0.88rem',
    color: 'var(--text-secondary)',
    marginTop: '4px'
  },
  cardsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '28px'
  },
  loading: {
    textAlign: 'center',
    padding: '80px 0',
    color: 'var(--text-secondary)',
    fontSize: '1.1rem'
  },
  emptyContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 0',
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
  modalBody: {
    marginTop: '20px'
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
  galleryFallback: {
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--text-muted)'
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
    background: 'rgba(16, 185, 129, 0.15)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
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
    backgroundColor: 'var(--bg-primary)',
    textAlign: 'center'
  },
  ownerHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '20px',
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
  authModal: {
    maxWidth: '440px',
    width: '100%',
    padding: '24px'
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
  }
};

export default PublicHome;
