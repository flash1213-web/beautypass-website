// ===== Beauty Pass - Specialist Selection & Filtering System =====
'use strict';

const SpecialistSystem = {
  // Specialists data (would come from backend in production)
  specialists: [
    {
      id: 1,
      name: 'ნინო მელაშვილი',
      nameEn: 'Nino Melashvili',
      salon: 'Katrini',
      services: ['Manicure Classic', 'Shellac Removal', 'Pedicure Classic'],
      rating: 4.9,
      reviews: 156,
      experience: 8,
      photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200',
      bio: { ka: 'პროფესიონალი მანიკურისტი 8 წლიანი გამოცდილებით', en: 'Professional manicurist with 8 years experience' },
      languages: ['Georgian', 'Russian', 'English'],
      badges: ['Top Rated', 'VIP Specialist'],
      friendRecommendations: 23
    },
    {
      id: 2,
      name: 'მარიამ კაპანაძე',
      nameEn: 'Mariam Kapanadze',
      salon: 'Beauty Lab',
      services: ['Haircut Women', 'Brow Lamination', 'Makeup (Day)'],
      rating: 4.8,
      reviews: 203,
      experience: 12,
      photo: 'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=200',
      bio: { ka: 'სტილისტი და ვიზაჟისტი, ევროპული გამოცდილებით', en: 'Stylist and makeup artist with European experience' },
      languages: ['Georgian', 'English'],
      badges: ['Expert', 'Celebrity Stylist'],
      friendRecommendations: 45
    },
    {
      id: 3,
      name: 'ანა ჯავახიშვილი',
      nameEn: 'Ana Javakhishvili',
      salon: 'Daphne Beauty Studio',
      services: ['Massage 60 min', 'Spa 60 min'],
      rating: 5.0,
      reviews: 89,
      experience: 6,
      photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200',
      bio: { ka: 'სერტიფიცირებული მასაჟისტი და სპა თერაპევტი', en: 'Certified massage therapist and spa specialist' },
      languages: ['Georgian', 'Russian'],
      badges: ['Certified', 'Wellness Expert'],
      friendRecommendations: 31
    },
    {
      id: 4,
      name: 'ლიკა წერეთელი',
      nameEn: 'Lika Tsereteli',
      salon: 'Berberis Beauty Salon',
      services: ['Haircut Women', 'Brow Lamination'],
      rating: 4.7,
      reviews: 178,
      experience: 10,
      photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200',
      bio: { ka: 'თმის სტილისტი და წარბების ექსპერტი', en: 'Hair stylist and brow expert' },
      languages: ['Georgian', 'English', 'Turkish'],
      badges: ['Popular', 'Trend Setter'],
      friendRecommendations: 67
    },
    {
      id: 5,
      name: 'თამარ ბერიძე',
      nameEn: 'Tamar Beridze',
      salon: 'Pivot Beauty Studio',
      services: ['Manicure Classic', 'Pedicure Classic', 'Shellac Removal'],
      rating: 4.6,
      reviews: 134,
      experience: 5,
      photo: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=200',
      bio: { ka: 'ფრჩხილების დიზაინერი და ნეილ არტისტი', en: 'Nail designer and nail artist' },
      languages: ['Georgian'],
      badges: ['Nail Art Expert'],
      friendRecommendations: 19
    },
    {
      id: 6,
      name: 'ნატო გოგოლაძე',
      nameEn: 'Nato Gogoladze',
      salon: 'Nailomania',
      services: ['Manicure Classic', 'Pedicure Classic'],
      rating: 4.8,
      reviews: 92,
      experience: 7,
      photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200',
      bio: { ka: 'ექსპერტი კლასიკურ და აპარატურულ მანიკურში', en: 'Expert in classic and hardware manicure' },
      languages: ['Georgian', 'Russian'],
      badges: ['Speed Master'],
      friendRecommendations: 28
    },
    {
      id: 7,
      name: 'ეკა სულაკაური',
      nameEn: 'Eka Sulakauri',
      salon: 'Aelita Spa',
      services: ['Spa 60 min', 'Massage 60 min'],
      rating: 4.9,
      reviews: 167,
      experience: 9,
      photo: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200',
      bio: { ka: 'სპა თერაპევტი აზიური ტექნიკების ექსპერტი', en: 'Spa therapist expert in Asian techniques' },
      languages: ['Georgian', 'English'],
      badges: ['Asian Massage Expert', 'Top Rated'],
      friendRecommendations: 52
    },
    {
      id: 8,
      name: 'სოფო ხარაიშვილი',
      nameEn: 'Sopho Kharaishvili',
      salon: 'Beauty Room',
      services: ['Manicure Classic', 'Pedicure Classic'],
      rating: 4.5,
      reviews: 76,
      experience: 4,
      photo: 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=200',
      bio: { ka: 'ახალგაზრდა და კრეატიული ნეილ მასტერი', en: 'Young and creative nail master' },
      languages: ['Georgian', 'English'],
      badges: ['Rising Star'],
      friendRecommendations: 12
    }
  ],
  
  // Current filter state
  filters: {
    service: 'all',
    salon: 'all',
    minRating: 0,
    sortBy: 'rating',
    friendsOnly: false
  },
  
  // Initialize the specialist system
  init: function() {
    console.log('✅ SpecialistSystem initialized with', this.specialists.length, 'specialists');
  },
  
  // Get specialists by salon
  getBySalon: function(salonName) {
    return this.specialists.filter(s => s.salon === salonName);
  },
  
  // Get specialists by service
  getByService: function(serviceName) {
    return this.specialists.filter(s => s.services.includes(serviceName));
  },
  
  // Filter specialists
  filter: function(filters = {}) {
    let result = [...this.specialists];
    
    // Service filter
    if (filters.service && filters.service !== 'all') {
      result = result.filter(s => s.services.includes(filters.service));
    }
    
    // Salon filter
    if (filters.salon && filters.salon !== 'all') {
      result = result.filter(s => s.salon === filters.salon);
    }
    
    // Rating filter
    if (filters.minRating) {
      result = result.filter(s => s.rating >= filters.minRating);
    }
    
    // Friends recommendations filter
    if (filters.friendsOnly) {
      result = result.filter(s => s.friendRecommendations > 0);
    }
    
    // Sorting
    if (filters.sortBy) {
      switch (filters.sortBy) {
        case 'rating':
          result.sort((a, b) => b.rating - a.rating);
          break;
        case 'reviews':
          result.sort((a, b) => b.reviews - a.reviews);
          break;
        case 'experience':
          result.sort((a, b) => b.experience - a.experience);
          break;
        case 'friends':
          result.sort((a, b) => b.friendRecommendations - a.friendRecommendations);
          break;
      }
    }
    
    return result;
  },
  
  // Render specialist card
  renderCard: function(specialist, compact = false) {
    const lang = typeof currentLang !== 'undefined' ? currentLang : 'ka';
    const name = lang === 'en' ? specialist.nameEn : specialist.name;
    const bio = specialist.bio[lang];
    
    const badgesHtml = specialist.badges.map(b => 
      `<span class="specialist-badge">${b}</span>`
    ).join('');
    
    const servicesHtml = specialist.services.slice(0, 3).map(s => 
      `<span class="specialist-service-tag">${s}</span>`
    ).join('');
    
    if (compact) {
      return `
        <div class="specialist-card-compact" data-id="${specialist.id}">
          <img src="${specialist.photo}" alt="${name}" class="specialist-photo-sm">
          <div class="specialist-info-compact">
            <div class="specialist-name">${escapeHtml(name)}</div>
            <div class="specialist-rating-sm">⭐ ${specialist.rating} (${specialist.reviews})</div>
          </div>
          <button class="btn btn-primary btn-sm" onclick="SpecialistSystem.select(${specialist.id})">
            აირჩიე
          </button>
        </div>
      `;
    }
    
    return `
      <div class="specialist-card" data-id="${specialist.id}">
        <div class="specialist-header">
          <img src="${specialist.photo}" alt="${name}" class="specialist-photo">
          <div class="specialist-badges">${badgesHtml}</div>
        </div>
        <div class="specialist-body">
          <h4 class="specialist-name">${escapeHtml(name)}</h4>
          <p class="specialist-salon">📍 ${escapeHtml(specialist.salon)}</p>
          <div class="specialist-meta">
            <span class="specialist-rating">⭐ ${specialist.rating}</span>
            <span class="specialist-reviews">(${specialist.reviews} reviews)</span>
            <span class="specialist-exp">${specialist.experience} წელი</span>
          </div>
          <p class="specialist-bio">${escapeHtml(bio)}</p>
          <div class="specialist-services">${servicesHtml}</div>
          ${specialist.friendRecommendations > 0 ? `
            <div class="specialist-friends">
              👥 ${specialist.friendRecommendations} მეგობარი რეკომენდაციას უწევს
            </div>
          ` : ''}
        </div>
        <div class="specialist-footer">
          <button class="btn btn-outline" onclick="SpecialistSystem.showProfile(${specialist.id})">
            პროფილი
          </button>
          <button class="btn btn-primary" onclick="SpecialistSystem.bookWith(${specialist.id})">
            დაჯავშნა
          </button>
        </div>
      </div>
    `;
  },
  
  // Render filter controls
  renderFilters: function(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const services = [...new Set(this.specialists.flatMap(s => s.services))];
    const salons = [...new Set(this.specialists.map(s => s.salon))];
    
    container.innerHTML = `
      <div class="specialist-filters">
        <div class="filter-group">
          <label>სერვისი</label>
          <select id="filterService" onchange="SpecialistSystem.applyFilters()">
            <option value="all">ყველა სერვისი</option>
            ${services.map(s => `<option value="${s}">${s}</option>`).join('')}
          </select>
        </div>
        
        <div class="filter-group">
          <label>სალონი</label>
          <select id="filterSalon" onchange="SpecialistSystem.applyFilters()">
            <option value="all">ყველა სალონი</option>
            ${salons.map(s => `<option value="${s}">${s}</option>`).join('')}
          </select>
        </div>
        
        <div class="filter-group">
          <label>მინ. რეიტინგი</label>
          <select id="filterRating" onchange="SpecialistSystem.applyFilters()">
            <option value="0">ყველა</option>
            <option value="4.5">4.5+</option>
            <option value="4.7">4.7+</option>
            <option value="4.9">4.9+</option>
          </select>
        </div>
        
        <div class="filter-group">
          <label>დალაგება</label>
          <select id="filterSort" onchange="SpecialistSystem.applyFilters()">
            <option value="rating">რეიტინგით</option>
            <option value="reviews">შეფასებებით</option>
            <option value="experience">გამოცდილებით</option>
            <option value="friends">მეგობრების რეკ.</option>
          </select>
        </div>
        
        <div class="filter-group filter-checkbox">
          <label>
            <input type="checkbox" id="filterFriends" onchange="SpecialistSystem.applyFilters()">
            მხოლოდ მეგობრების რეკომენდაციით
          </label>
        </div>
      </div>
    `;
  },
  
  // Apply current filters
  applyFilters: function() {
    this.filters = {
      service: document.getElementById('filterService')?.value || 'all',
      salon: document.getElementById('filterSalon')?.value || 'all',
      minRating: parseFloat(document.getElementById('filterRating')?.value) || 0,
      sortBy: document.getElementById('filterSort')?.value || 'rating',
      friendsOnly: document.getElementById('filterFriends')?.checked || false
    };
    
    const filtered = this.filter(this.filters);
    this.renderList('specialistsList', filtered);
  },
  
  // Render list of specialists
  renderList: function(containerId, specialists = null) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const list = specialists || this.specialists;
    
    if (list.length === 0) {
      container.innerHTML = `
        <div class="no-results">
          <span class="no-results-icon">🔍</span>
          <p>სპეციალისტი ვერ მოიძებნა</p>
          <button class="btn btn-outline" onclick="SpecialistSystem.resetFilters()">
            ფილტრების გასუფთავება
          </button>
        </div>
      `;
      return;
    }
    
    container.innerHTML = `
      <div class="specialists-grid">
        ${list.map(s => this.renderCard(s)).join('')}
      </div>
    `;
  },
  
  // Reset filters
  resetFilters: function() {
    this.filters = { service: 'all', salon: 'all', minRating: 0, sortBy: 'rating', friendsOnly: false };
    
    const serviceEl = document.getElementById('filterService');
    const salonEl = document.getElementById('filterSalon');
    const ratingEl = document.getElementById('filterRating');
    const sortEl = document.getElementById('filterSort');
    const friendsEl = document.getElementById('filterFriends');
    
    if (serviceEl) serviceEl.value = 'all';
    if (salonEl) salonEl.value = 'all';
    if (ratingEl) ratingEl.value = '0';
    if (sortEl) sortEl.value = 'rating';
    if (friendsEl) friendsEl.checked = false;
    
    this.renderList('specialistsList');
  },
  
  // Show specialist profile modal
  showProfile: function(specialistId) {
    const specialist = this.specialists.find(s => s.id === specialistId);
    if (!specialist) return;
    
    const lang = typeof currentLang !== 'undefined' ? currentLang : 'ka';
    const name = lang === 'en' ? specialist.nameEn : specialist.name;
    const bio = specialist.bio[lang];
    
    const modal = document.getElementById('bookingModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    
    modalTitle.textContent = name;
    modalBody.innerHTML = `
      <div class="specialist-profile">
        <div class="profile-top">
          <img src="${specialist.photo}" alt="${name}" class="profile-photo-lg">
          <div class="profile-badges">
            ${specialist.badges.map(b => `<span class="badge-lg">${b}</span>`).join('')}
          </div>
        </div>
        
        <div class="profile-stats">
          <div class="stat">
            <span class="stat-value">⭐ ${specialist.rating}</span>
            <span class="stat-label">რეიტინგი</span>
          </div>
          <div class="stat">
            <span class="stat-value">${specialist.reviews}</span>
            <span class="stat-label">შეფასება</span>
          </div>
          <div class="stat">
            <span class="stat-value">${specialist.experience} წ.</span>
            <span class="stat-label">გამოცდილება</span>
          </div>
          <div class="stat">
            <span class="stat-value">👥 ${specialist.friendRecommendations}</span>
            <span class="stat-label">მეგობრის რეკ.</span>
          </div>
        </div>
        
        <div class="profile-section">
          <h4>📍 სალონი</h4>
          <p>${specialist.salon}</p>
        </div>
        
        <div class="profile-section">
          <h4>💬 ენები</h4>
          <p>${specialist.languages.join(', ')}</p>
        </div>
        
        <div class="profile-section">
          <h4>📝 შესახებ</h4>
          <p>${bio}</p>
        </div>
        
        <div class="profile-section">
          <h4>💅 სერვისები</h4>
          <div class="services-list">
            ${specialist.services.map(s => `<span class="service-chip">${s}</span>`).join('')}
          </div>
        </div>
        
        <div class="profile-actions">
          <button class="btn btn-primary btn-block" onclick="SpecialistSystem.bookWith(${specialist.id}); closeModal();">
            📅 დაჯავშნა ${name}-თან
          </button>
        </div>
      </div>
    `;
    
    modal.classList.add('active');
  },
  
  // Book with specific specialist
  bookWith: function(specialistId) {
    const specialist = this.specialists.find(s => s.id === specialistId);
    if (!specialist) return;
    
    // Find salon index
    const salonIndex = SALONS.findIndex(s => s.name === specialist.salon);
    
    if (salonIndex >= 0) {
      // Store selected specialist
      sessionStorage.setItem('selectedSpecialist', JSON.stringify(specialist));
      // Open salon booking
      showSalonDetails(salonIndex);
    } else {
      showToast('სალონი ვერ მოიძებნა', 'error');
    }
  },
  
  // Select specialist (for inline selection)
  select: function(specialistId) {
    const specialist = this.specialists.find(s => s.id === specialistId);
    if (!specialist) return;
    
    sessionStorage.setItem('selectedSpecialist', JSON.stringify(specialist));
    
    // Update UI
    document.querySelectorAll('.specialist-card-compact').forEach(card => {
      card.classList.remove('selected');
    });
    document.querySelector(`.specialist-card-compact[data-id="${specialistId}"]`)?.classList.add('selected');
    
    showToast(`${specialist.name} არჩეულია`, 'success');
  },
  
  // Get selected specialist
  getSelected: function() {
    try {
      return JSON.parse(sessionStorage.getItem('selectedSpecialist'));
    } catch {
      return null;
    }
  },
  
  // Clear selection
  clearSelection: function() {
    sessionStorage.removeItem('selectedSpecialist');
  }
};

// CSS for specialist system
const specialistStyles = document.createElement('style');
specialistStyles.textContent = `
  /* Specialist Filters */
  .specialist-filters {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    padding: 20px;
    background: white;
    border-radius: 16px;
    box-shadow: var(--shadow-sm);
    margin-bottom: 24px;
  }
  
  .filter-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 150px;
  }
  
  .filter-group label {
    font-size: 0.85rem;
    font-weight: 500;
    color: var(--text-muted);
  }
  
  .filter-group select {
    padding: 10px 14px;
    border: 1px solid var(--border-color);
    border-radius: 10px;
    font-size: 0.9rem;
    background: white;
    cursor: pointer;
  }
  
  .filter-group select:focus {
    outline: none;
    border-color: var(--primary);
  }
  
  .filter-checkbox {
    flex-direction: row;
    align-items: center;
    min-width: auto;
  }
  
  .filter-checkbox label {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    font-size: 0.9rem;
  }
  
  /* Specialists Grid */
  .specialists-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 24px;
  }
  
  @media (max-width: 768px) {
    .specialists-grid {
      grid-template-columns: 1fr;
    }
  }
  
  /* Specialist Card */
  .specialist-card {
    background: white;
    border-radius: 20px;
    overflow: hidden;
    box-shadow: var(--shadow-md);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }
  
  .specialist-card:hover {
    transform: translateY(-5px);
    box-shadow: var(--shadow-lg);
  }
  
  .specialist-header {
    position: relative;
    padding: 20px;
    background: linear-gradient(135deg, var(--primary-pale), white);
    display: flex;
    justify-content: center;
  }
  
  .specialist-photo {
    width: 100px;
    height: 100px;
    border-radius: 50%;
    object-fit: cover;
    border: 4px solid white;
    box-shadow: var(--shadow-md);
  }
  
  .specialist-badges {
    position: absolute;
    top: 12px;
    right: 12px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  
  .specialist-badge {
    background: linear-gradient(135deg, #6c5ce7, #a29bfe);
    color: white;
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 0.7rem;
    font-weight: 600;
  }
  
  .specialist-body {
    padding: 20px;
  }
  
  .specialist-name {
    font-size: 1.2rem;
    margin-bottom: 4px;
  }
  
  .specialist-salon {
    font-size: 0.9rem;
    color: var(--text-muted);
    margin-bottom: 12px;
  }
  
  .specialist-meta {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
  }
  
  .specialist-rating {
    font-weight: 600;
    color: #f39c12;
  }
  
  .specialist-reviews {
    font-size: 0.85rem;
    color: var(--text-muted);
  }
  
  .specialist-exp {
    font-size: 0.85rem;
    color: var(--primary);
    font-weight: 500;
  }
  
  .specialist-bio {
    font-size: 0.9rem;
    color: var(--text-muted);
    line-height: 1.5;
    margin-bottom: 12px;
  }
  
  .specialist-services {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 12px;
  }
  
  .specialist-service-tag {
    background: var(--primary-pale);
    color: var(--primary);
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 500;
  }
  
  .specialist-friends {
    background: #f0f8ff;
    color: #0984e3;
    padding: 8px 12px;
    border-radius: 10px;
    font-size: 0.85rem;
    font-weight: 500;
  }
  
  .specialist-footer {
    display: flex;
    gap: 12px;
    padding: 16px 20px;
    background: #f8f9fa;
    border-top: 1px solid var(--border-light);
  }
  
  .specialist-footer .btn {
    flex: 1;
  }
  
  /* Compact Card */
  .specialist-card-compact {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: white;
    border-radius: 12px;
    border: 2px solid transparent;
    transition: all 0.2s ease;
    cursor: pointer;
  }
  
  .specialist-card-compact:hover {
    border-color: var(--primary-light);
    background: var(--primary-pale);
  }
  
  .specialist-card-compact.selected {
    border-color: var(--primary);
    background: var(--primary-pale);
  }
  
  .specialist-photo-sm {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    object-fit: cover;
  }
  
  .specialist-info-compact {
    flex: 1;
  }
  
  .specialist-rating-sm {
    font-size: 0.8rem;
    color: #f39c12;
  }
  
  /* Profile Modal */
  .specialist-profile {
    padding: 0;
  }
  
  .profile-top {
    position: relative;
    padding: 30px;
    background: linear-gradient(135deg, var(--primary-pale), white);
    text-align: center;
  }
  
  .profile-photo-lg {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    object-fit: cover;
    border: 5px solid white;
    box-shadow: var(--shadow-lg);
    margin-bottom: 16px;
  }
  
  .profile-badges {
    display: flex;
    justify-content: center;
    gap: 8px;
    flex-wrap: wrap;
  }
  
  .badge-lg {
    background: linear-gradient(135deg, #6c5ce7, #a29bfe);
    color: white;
    padding: 6px 14px;
    border-radius: 16px;
    font-size: 0.85rem;
    font-weight: 600;
  }
  
  .profile-stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    padding: 20px;
    background: white;
    border-bottom: 1px solid var(--border-light);
  }
  
  .profile-stats .stat {
    text-align: center;
  }
  
  .profile-stats .stat-value {
    display: block;
    font-size: 1.2rem;
    font-weight: 700;
    color: var(--text);
  }
  
  .profile-stats .stat-label {
    font-size: 0.75rem;
    color: var(--text-muted);
  }
  
  .profile-section {
    padding: 16px 20px;
    border-bottom: 1px solid var(--border-light);
  }
  
  .profile-section h4 {
    font-size: 0.9rem;
    margin-bottom: 8px;
    color: var(--text-muted);
  }
  
  .profile-section p {
    font-size: 1rem;
  }
  
  .services-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  
  .service-chip {
    background: var(--primary-pale);
    color: var(--primary);
    padding: 6px 12px;
    border-radius: 16px;
    font-size: 0.85rem;
    font-weight: 500;
  }
  
  .profile-actions {
    padding: 20px;
  }
  
  /* No Results */
  .no-results {
    text-align: center;
    padding: 60px 20px;
    color: var(--text-muted);
  }
  
  .no-results-icon {
    font-size: 3rem;
    display: block;
    margin-bottom: 16px;
  }
  
  .no-results p {
    margin-bottom: 16px;
  }
  
  @media (max-width: 768px) {
    .specialist-filters {
      flex-direction: column;
    }
    
    .filter-group {
      width: 100%;
    }
    
    .profile-stats {
      grid-template-columns: repeat(2, 1fr);
    }
  }
`;
document.head.appendChild(specialistStyles);

// Initialize
SpecialistSystem.init();

// Export for global access
window.SpecialistSystem = SpecialistSystem;
