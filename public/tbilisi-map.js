// ===== Beauty Pass - Interactive Tbilisi Map with API Integration =====
'use strict';

const TbilisiMap = {
  map: null,
  markers: [],
  salons: [],
  filteredSalons: [],
  currentFilter: 'all',
  selectedSalon: null,
  
  CENTER: { lat: 41.7151, lng: 44.8271 },
  DEFAULT_ZOOM: 12,
  
  categories: [
    { id: 'all', name: 'ყველა', nameEn: 'All', icon: '🌟' },
    { id: 'nails', name: 'ფრჩხილები', nameEn: 'Nails', icon: '💅' },
    { id: 'hair', name: 'თმა', nameEn: 'Hair', icon: '💇' },
    { id: 'face', name: 'სახე', nameEn: 'Face', icon: '🧖' },
    { id: 'body', name: 'სხეული', nameEn: 'Body', icon: '💆' },
    { id: 'makeup', name: 'მაკიაჟი', nameEn: 'Makeup', icon: '💄' },
    { id: 'spa', name: 'სპა', nameEn: 'Spa', icon: '🧘' }
  ],
  
  init: async function(containerId = 'tbilisiMap') {
    const container = document.getElementById(containerId);
    if (!container) {
      console.warn('Map container not found:', containerId);
      return;
    }
    
    if (typeof L === 'undefined') {
      console.log('Loading Leaflet library...');
      await this.loadLeaflet();
    }
    
    this.createMap(container);
    await this.loadSalonsFromAPI();
    this.renderSalonsList();
  },
  
  loadLeaflet: function() {
    return new Promise((resolve) => {
      const css = document.createElement('link');
      css.rel = 'stylesheet';
      css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(css);
      
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = resolve;
      document.head.appendChild(script);
    });
  },
  
  createMap: function(container) {
    this.map = L.map(container, {
      center: [this.CENTER.lat, this.CENTER.lng],
      zoom: this.DEFAULT_ZOOM,
      zoomControl: true,
      scrollWheelZoom: true
    });
    
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(this.map);
    
    console.log('✅ Tbilisi Map initialized');
  },
  
  loadSalonsFromAPI: async function() {
    try {
      // Use existing /api/salons endpoint for compatibility
      const response = await fetch('/api/salons');
      if (!response.ok) throw new Error('Failed to load salons');
      
      const rawSalons = await response.json();
      
      // Transform to map format with all needed data
      this.salons = rawSalons.map(s => ({
        id: s._id,
        ownerId: s.ownerId?._id || s.ownerId, // ID владельца салона
        name: s.name,
        address: s.address || s.location || '',
        coordinates: s.coordinates || { lat: 41.7151 + (Math.random() - 0.5) * 0.05, lng: 44.8271 + (Math.random() - 0.5) * 0.05 },
        phone: s.phone || '',
        rating: s.averageRating || s.rating || 0,
        reviewCount: s.totalReviews || 0,
        services: s.services || [],
        categories: s.categories || [],
        photo: s.salonPhotoUrl || (s.photos && s.photos[0]) || '',
        photos: s.photos || [],
        workingHours: s.workingHours || null,
        description: s.description || '',
        reviews: s.reviews || [],
        googleMapsRating: s.googleMapsRating || 0,
        googleMapsReviews: s.googleMapsReviews || 0
      }));
      
      this.filteredSalons = [...this.salons];
      
      console.log('✅ Loaded', this.salons.length, 'salons from API');
      
      this.addSalonMarkers();
      this.fitAllMarkers();
      this.updateSidebarList();
      
    } catch (error) {
      console.error('Error loading salons:', error);
      // Fallback to global SALONS if available
      if (typeof SALONS !== 'undefined' && SALONS.length > 0) {
        console.log('Using fallback SALONS data');
        this.salons = SALONS.map((s, i) => ({
          id: s._id || i,
          name: s.name,
          address: s.address || s.location,
          coordinates: s.coordinates || s.coords || { lat: 41.7151 + (Math.random() - 0.5) * 0.05, lng: 44.8271 + (Math.random() - 0.5) * 0.05 },
          phone: s.phone || '',
          rating: s.averageRating || s.rating || 4.5,
          reviewCount: s.totalReviews || s.reviewCount || 0,
          services: s.services || [],
          categories: s.categories || [],
          photo: s.salonPhotoUrl || s.image || ''
        }));
        this.filteredSalons = [...this.salons];
        this.addSalonMarkers();
        this.fitAllMarkers();
        this.updateSidebarList();
      }
    }
  },
  
  createMarkerIcon: function(salon) {
    const isHighRated = (salon.rating || 0) >= 4.5;
    const color = isHighRated ? '#6c5ce7' : '#e84393';
    
    return L.divIcon({
      className: 'beauty-marker',
      html: `
        <div class="marker-container ${isHighRated ? 'high-rated' : ''}" data-salon-id="${salon.id}">
          <div class="marker-pin" style="background: ${color};">
            <span style="font-size: 18px;">🌸</span>
          </div>
          <div class="marker-pulse" style="background: ${color}"></div>
        </div>
      `,
      iconSize: [40, 50],
      iconAnchor: [20, 50],
      popupAnchor: [0, -50]
    });
  },
  
  addSalonMarkers: function() {
    this.markers.forEach(m => m.remove());
    this.markers = [];
    
    this.filteredSalons.forEach((salon, index) => {
      const coords = salon.coordinates;
      if (!coords || !coords.lat || !coords.lng) return;
      
      const marker = L.marker([coords.lat, coords.lng], {
        icon: this.createMarkerIcon(salon),
        riseOnHover: true
      });
      
      // Click on marker opens modal directly
      marker.on('click', () => {
        this.openSalonModal(salon.id);
      });
      
      marker.salonData = salon;
      
      setTimeout(() => {
        marker.addTo(this.map);
        this.markers.push(marker);
      }, index * 100);
    });
  },
  
  createPopupContent: function(salon) {
    const coords = salon.coordinates || { lat: 41.7151, lng: 44.8271 };
    const services = (salon.services || []).slice(0, 3);
    const servicesHtml = services.map(s => `<span class="popup-service">${this.escapeHtml(s)}</span>`).join('');
    
    return `
      <div class="salon-popup">
        ${salon.photo ? `<div class="popup-image"><img src="${salon.photo}" alt="${this.escapeHtml(salon.name)}" onerror="this.style.display='none'"></div>` : ''}
        <div class="popup-body">
          <div class="popup-header">
            <h4>${this.escapeHtml(salon.name)}</h4>
            <div class="popup-rating">⭐ ${(salon.rating || 0).toFixed(1)} <span class="review-count">(${salon.reviewCount || 0})</span></div>
          </div>
          <p class="popup-address">📍 ${this.escapeHtml(salon.address || '')}</p>
          ${salon.phone ? `<p class="popup-phone">📞 ${this.escapeHtml(salon.phone)}</p>` : ''}
          ${servicesHtml ? `<div class="popup-services">${servicesHtml}</div>` : ''}
          <div class="popup-actions">
            <button class="btn btn-primary btn-sm" onclick="TbilisiMap.openSalonModal('${salon.id}')">
              დეტალები / Details
            </button>
            <button class="btn btn-outline btn-sm" onclick="TbilisiMap.getDirections(${coords.lat}, ${coords.lng})">
              📍 მიმართულება
            </button>
          </div>
        </div>
      </div>
    `;
  },
  
  renderSalonsList: function() {
    const listContainer = document.getElementById('mapSalonsList');
    if (!listContainer) return;
    
    if (this.filteredSalons.length === 0) {
      listContainer.innerHTML = `
        <div class="no-salons">
          <span>😔</span>
          <p>სალონები ვერ მოიძებნა / No salons found</p>
        </div>
      `;
      return;
    }
    
    listContainer.innerHTML = this.filteredSalons.map(salon => `
      <div class="salon-list-item" onclick="TbilisiMap.selectSalonFromList('${salon.id}')" data-salon-id="${salon.id}">
        <div class="salon-list-image">
          ${salon.photo ? `<img src="${salon.photo}" alt="${this.escapeHtml(salon.name)}" onerror="this.src='/images/default-salon.png'">` : '<div class="no-image">✨</div>'}
        </div>
        <div class="salon-list-info">
          <h4>${this.escapeHtml(salon.name)}</h4>
          <p class="salon-list-address">📍 ${this.escapeHtml(salon.address || '')}</p>
          <div class="salon-list-meta">
            <span class="salon-rating">⭐ ${(salon.rating || 0).toFixed(1)}</span>
            <span class="salon-reviews">(${salon.reviewCount || 0} შეფასება)</span>
          </div>
        </div>
      </div>
    `).join('');
  },
  
  // Alias for backward compatibility
  updateSidebarList: function() {
    this.renderSalonsList();
  },
  
  filterSalons: function(options = {}) {
    const { category, rating, search } = options;
    
    this.filteredSalons = this.salons.filter(salon => {
      if (category && category !== 'all') {
        const hasCategory = (salon.categories || []).includes(category) ||
                           (salon.services || []).some(s => s.toLowerCase().includes(category.toLowerCase()));
        if (!hasCategory) return false;
      }
      
      if (rating) {
        if ((salon.rating || 0) < parseFloat(rating)) return false;
      }
      
      if (search) {
        const searchLower = search.toLowerCase();
        const matchName = (salon.name || '').toLowerCase().includes(searchLower);
        const matchAddress = (salon.address || '').toLowerCase().includes(searchLower);
        const matchServices = (salon.services || []).some(s => s.toLowerCase().includes(searchLower));
        if (!matchName && !matchAddress && !matchServices) return false;
      }
      
      return true;
    });
    
    this.addSalonMarkers();
    this.renderSalonsList();
    
    if (this.markers.length > 0) {
      setTimeout(() => {
        const group = L.featureGroup(this.markers);
        this.map.fitBounds(group.getBounds().pad(0.1), { animate: true });
      }, this.markers.length * 100 + 200);
    }
  },
  
  flyToSalon: function(salonId) {
    const salon = this.salons.find(s => s.id === salonId || s.id.toString() === salonId);
    if (!salon || !salon.coordinates) return;
    
    this.map.flyTo([salon.coordinates.lat, salon.coordinates.lng], 16, {
      animate: true,
      duration: 1
    });
    
    document.querySelectorAll('.salon-list-item').forEach(el => el.classList.remove('active'));
    const listItem = document.querySelector(`.salon-list-item[data-salon-id="${salonId}"]`);
    if (listItem) {
      listItem.classList.add('active');
      listItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  },
  
  // Select salon from list - flies to it and opens modal
  selectSalonFromList: function(salonId) {
    const salon = this.salons.find(s => s.id === salonId || s.id.toString() === salonId);
    if (!salon) return;
    
    // Highlight in list
    document.querySelectorAll('.salon-list-item').forEach(el => el.classList.remove('active'));
    const listItem = document.querySelector(`.salon-list-item[data-salon-id="${salonId}"]`);
    if (listItem) {
      listItem.classList.add('active');
    }
    
    // Fly to salon on map if coordinates exist
    if (salon.coordinates && salon.coordinates.lat && salon.coordinates.lng) {
      this.map.flyTo([salon.coordinates.lat, salon.coordinates.lng], 16, {
        animate: true,
        duration: 0.8
      });
    }
    
    // Open salon modal
    this.openSalonModal(salonId);
  },
  
  openSalonModal: async function(salonId) {
    try {
      // Show loading state
      let modal = document.getElementById('salonDetailModal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'salonDetailModal';
        modal.className = 'salon-modal';
        document.body.appendChild(modal);
      }
      modal.innerHTML = `
        <div class="salon-modal-overlay" onclick="TbilisiMap.closeSalonModal()"></div>
        <div class="salon-modal-content" style="display:flex;align-items:center;justify-content:center;min-height:300px;">
          <div class="loading-spinner"></div>
        </div>
      `;
      modal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
      
      // Try to load full salon details from API
      let salon = null;
      try {
        const response = await fetch(`/api/salons/${salonId}`);
        if (response.ok) {
          salon = await response.json();
        }
      } catch (e) {
        console.log('API /api/salons/:id not available, using cached data');
      }
      
      // Fallback to cached salon data
      if (!salon) {
        salon = this.salons.find(s => s.id === salonId || s.id.toString() === salonId);
      }
      
      // Also load specialists for this salon
      let specialists = [];
      try {
        const specResponse = await fetch(`/api/salons/${salonId}/specialists`);
        if (specResponse.ok) {
          specialists = await specResponse.json();
        }
      } catch (e) {
        console.log('Could not load specialists');
      }
      
      // Also load gallery for this salon
      let gallery = [];
      try {
        const galleryResponse = await fetch(`/api/salon/${salonId}/gallery`);
        if (galleryResponse.ok) {
          gallery = await galleryResponse.json();
        }
      } catch (e) {
        console.log('Could not load gallery');
      }
      
      if (salon) {
        salon.specialists = specialists;
        salon.gallery = gallery;
        this.selectedSalon = salon;
        this.renderSalonModal(salon);
      } else {
        this.closeSalonModal();
        console.error('Salon not found:', salonId);
      }
      
    } catch (error) {
      console.error('Error loading salon details:', error);
      this.closeSalonModal();
    }
  },
  
  renderSalonModal: function(salon) {
    let modal = document.getElementById('salonDetailModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'salonDetailModal';
      modal.className = 'salon-modal';
      document.body.appendChild(modal);
    }
    
    // Check if user is logged in
    const isLoggedIn = !!localStorage.getItem('token');
    const salonId = salon.id || salon._id;
    
    // Helper function to format working hours
    const formatWorkingHour = (hour) => {
      if (!hour) return '-';
      if (typeof hour === 'string') return hour;
      if (typeof hour === 'object') {
        if (hour.isOpen === false) return 'დახურულია';
        if (hour.isOpen === true) return '10:00-20:00';
        if (hour.from && hour.to) return `${hour.from}-${hour.to}`;
      }
      return '-';
    };
    
    // Working hours
    const workingHoursHtml = salon.workingHours ? `
      <div class="salon-working-hours">
        <h4>🕐 სამუშაო საათები / Working Hours</h4>
        <ul>
          <li><span>ორშაბათი / Mon:</span> ${formatWorkingHour(salon.workingHours.monday)}</li>
          <li><span>სამშაბათი / Tue:</span> ${formatWorkingHour(salon.workingHours.tuesday)}</li>
          <li><span>ოთხშაბათი / Wed:</span> ${formatWorkingHour(salon.workingHours.wednesday)}</li>
          <li><span>ხუთშაბათი / Thu:</span> ${formatWorkingHour(salon.workingHours.thursday)}</li>
          <li><span>პარასკევი / Fri:</span> ${formatWorkingHour(salon.workingHours.friday)}</li>
          <li><span>შაბათი / Sat:</span> ${formatWorkingHour(salon.workingHours.saturday)}</li>
          <li><span>კვირა / Sun:</span> ${formatWorkingHour(salon.workingHours.sunday)}</li>
        </ul>
      </div>
    ` : '';
    
    // Google Maps data section with interactive embed
    const coords = salon.coordinates || { lat: 41.7151, lng: 44.8271 };
    const mapQuery = encodeURIComponent(salon.address || `${coords.lat},${coords.lng}`);
    const googleMapsUrl = salon.googleMapsPlaceId 
      ? `https://www.google.com/maps/place/?q=place_id:${salon.googleMapsPlaceId}`
      : `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;
    
    const googleMapsHtml = `
      <div class="google-maps-info">
        <h4>📍 Google Maps</h4>
        
        <!-- Interactive Map Embed -->
        <div class="google-maps-embed">
          <iframe 
            src="https://maps.google.com/maps?q=${coords.lat},${coords.lng}&z=16&output=embed" 
            width="100%" 
            height="200" 
            style="border:0; border-radius: 12px;" 
            allowfullscreen="" 
            loading="lazy" 
            referrerpolicy="no-referrer-when-downgrade">
          </iframe>
          <a href="${googleMapsUrl}" target="_blank" class="google-maps-overlay-link">
            <span class="overlay-icon">🗺️</span>
            <span>Google Maps-ში გახსნა</span>
          </a>
        </div>
        
        ${(salon.googleMapsRating || salon.googleMapsReviews) ? `
        <div class="google-maps-stats">
          ${salon.googleMapsRating ? `
            <div class="google-stat">
              <span class="google-icon">⭐</span>
              <span class="google-value">${salon.googleMapsRating.toFixed(1)}</span>
              <span class="google-label">Google რეიტინგი</span>
            </div>
          ` : ''}
          ${salon.googleMapsReviews ? `
            <div class="google-stat">
              <span class="google-icon">💬</span>
              <span class="google-value">${salon.googleMapsReviews}</span>
              <span class="google-label">Google შეფასება</span>
            </div>
          ` : ''}
        </div>
        ` : ''}
        
        <div class="google-maps-actions">
          <a href="${googleMapsUrl}" target="_blank" class="google-link">
            🗺️ Google Maps-ზე ნახვა
          </a>
          <a href="https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lng}" target="_blank" class="google-link directions">
            🚗 მიმართულება
          </a>
        </div>
      </div>
    `;
    
    // Category icons
    const categoryIcons = {
      nails: '💅', hair: '💇‍♀️', face: '✨', body: '💆‍♀️', makeup: '💄', spa: '🧖‍♀️', other: '⭐'
    };
    
    // Specialists with their services, prices, booking and review buttons
    const specialistsHtml = (salon.specialists && salon.specialists.length > 0) ? `
      <div class="salon-specialists">
        <h4>👩‍🎨 სპეციალისტები / Specialists (${salon.specialists.length})</h4>
        <div class="specialists-list">
          ${salon.specialists.map(sp => {
            const spId = sp._id || sp.id;
            const spRating = sp.averageRating || sp.rating || 0;
            const spReviews = sp.reviewCount || 0;
            return `
            <div class="specialist-card-enhanced" data-specialist-id="${spId}">
              <div class="specialist-header">
                <img src="${sp.photoUrl || sp.photo || '/images/default-avatar.svg'}" alt="${this.escapeHtml(sp.name)}" onerror="this.onerror=null; this.src='/images/default-avatar.svg'">
                <div class="specialist-main-info">
                  <h5>${this.escapeHtml(sp.name)}</h5>
                  <p class="specialist-position">${this.escapeHtml(sp.position || 'სპეციალისტი')}</p>
                  <div class="specialist-rating">
                    <span class="stars">⭐ ${spRating.toFixed(1)}</span>
                    <span class="review-count">(${spReviews} შეფასება)</span>
                  </div>
                </div>
              </div>
              
              ${sp.description ? `<p class="specialist-bio">${this.escapeHtml(sp.description)}</p>` : ''}
              
              <!-- Services with prices -->
              <div class="specialist-services-detailed">
                <h6>💅 სერვისები და ფასები / Services & Prices</h6>
                <div class="services-price-list">
                  ${(sp.services || []).map(s => `
                    <div class="service-price-item">
                      <div class="service-left">
                        <span class="service-icon">${categoryIcons[s.category] || '⭐'}</span>
                        <div class="service-details">
                          <span class="service-name">${this.escapeHtml(s.name)}</span>
                          <span class="service-duration">⏱ ${s.duration || 30} წუთი</span>
                        </div>
                      </div>
                      <div class="service-right">
                        <span class="service-bp-price">${s.bpPrice || 10} BP</span>
                        ${s.price ? `<span class="service-gel-price">${s.price} ₾</span>` : ''}
                      </div>
                    </div>
                  `).join('')}
                  ${(sp.services || []).length === 0 ? '<p class="no-services-msg">სერვისები არ არის / No services</p>' : ''}
                </div>
              </div>
              
              <!-- Action buttons -->
              <div class="specialist-actions">
                <button class="btn btn-primary btn-book-specialist" data-salon-id="${salonId}" data-specialist-id="${spId}" data-specialist-name="${this.escapeHtml(sp.name)}" onclick="bookSpecialistClick(this)">
                  📅 დაჯავშნა / Book
                </button>
                <button class="btn btn-outline btn-review-specialist" data-specialist-id="${spId}" data-specialist-name="${this.escapeHtml(sp.name)}" onclick="reviewSpecialistClick(this)">
                  ✍️ შეფასება / Review
                </button>
                <button class="btn btn-outline btn-view-reviews" data-specialist-id="${spId}" data-specialist-name="${this.escapeHtml(sp.name)}" onclick="viewSpecialistReviewsClick(this)">
                  📖 შეფასებები (${spReviews})
                </button>
              </div>
              
              <!-- Specialist reviews (collapsed by default) -->
              <div class="specialist-reviews-section" id="specialistReviews_${spId}" style="display:none;">
                <div class="reviews-loading">იტვირთება...</div>
              </div>
            </div>
          `}).join('')}
        </div>
      </div>
    ` : `
      <div class="salon-specialists">
        <h4>👩‍🎨 სპეციალისტები / Specialists</h4>
        <p class="no-specialists-msg">სპეციალისტები ჯერ არ არის დამატებული / No specialists added yet</p>
      </div>
    `;
    
    // Services
    const servicesHtml = (salon.services && salon.services.length > 0) ? `
      <div class="salon-services-list">
        <h4>💅 სერვისები / Services</h4>
        <div class="services-grid">
          ${salon.services.map(sv => `
            <div class="service-item">
              <div class="service-info">
                <h5>${this.escapeHtml(typeof sv === 'string' ? sv : sv.name || sv)}</h5>
                ${sv.duration ? `<span class="service-duration">⏱ ${sv.duration} წუთი</span>` : ''}
              </div>
              <div class="service-price">
                ${sv.bpPrice ? `<span class="bp-price">${sv.bpPrice} BP</span>` : ''}
                ${sv.price ? `<span class="regular-price">${sv.price} ₾</span>` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    ` : '';
    
    // Reviews section with ability to read all
    const reviews = salon.reviews || [];
    const avgRating = reviews.length > 0 ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1) : '0.0';
    const reviewsHtml = `
      <div class="salon-reviews-box">
        <div class="reviews-header">
          <div class="reviews-title">
            <span class="reviews-icon">⭐</span>
            <h4>შეფასებები / Reviews</h4>
          </div>
          <div class="reviews-stats">
            <span class="avg-rating">${avgRating}</span>
            <span class="reviews-count">(${reviews.length} შეფასება)</span>
          </div>
        </div>
        ${reviews.length > 0 ? `
          <div class="reviews-list-modern" id="reviewsList">
            ${reviews.slice(0, 5).map(r => `
              <div class="review-card">
                <div class="review-top">
                  <div class="reviewer-avatar">${(r.userName || 'A').charAt(0).toUpperCase()}</div>
                  <div class="reviewer-info">
                    <span class="reviewer-name">${this.escapeHtml(r.userName || r.userId?.firstName || 'ანონიმი')}</span>
                    <span class="review-date">${r.createdAt ? new Date(r.createdAt).toLocaleDateString('ka-GE') : ''}</span>
                  </div>
                  <div class="review-stars">${'★'.repeat(r.rating || 0)}${'☆'.repeat(5 - (r.rating || 0))}</div>
                </div>
                ${r.comment ? `<p class="review-comment">${this.escapeHtml(r.comment)}</p>` : ''}
              </div>
            `).join('')}
            ${reviews.length > 5 ? `<button class="btn btn-outline btn-sm" onclick="alert('ყველა ${reviews.length} შეფასება')">ყველას ნახვა (${reviews.length})</button>` : ''}
          </div>
        ` : `
          <div class="no-reviews-modern">
            <span class="no-reviews-icon">💭</span>
            <p>ჯერ არ არის შეფასებები</p>
            <small>იყავი პირველი!</small>
          </div>
        `}
      </div>
    `;
    
    // Photos gallery - включая загруженную галерею салона
    const galleryItems = salon.gallery || [];
    const oldPhotos = salon.photos || (salon.photo ? [salon.photo] : []);
    
    // Генерируем HTML для галереи (фото и видео)
    let galleryHtml = '';
    if (galleryItems.length > 0 || oldPhotos.length > 0) {
      galleryHtml = `
        <div class="salon-gallery-section">
          <h4>📸 გალერეა / Gallery</h4>
          <div class="salon-gallery">
            ${galleryItems.map(item => {
              if (item.type === 'video') {
                return `<video src="${item.url}" onclick="TbilisiMap.openVideoViewer('${item.url}')" poster="" preload="metadata"></video>`;
              } else {
                return `<img src="${item.url}" alt="Salon" onclick="TbilisiMap.openPhotoViewer('${item.url}')" onerror="this.style.display='none'">`;
              }
            }).join('')}
            ${oldPhotos.slice(0, Math.max(0, 6 - galleryItems.length)).map(photo => `
              <img src="${photo}" alt="Salon photo" onclick="TbilisiMap.openPhotoViewer('${photo}')" onerror="this.style.display='none'">
            `).join('')}
          </div>
        </div>
      `;
    }
    const photosHtml = galleryHtml;
    
    const salonPhoto = salon.salonPhotoUrl || salon.photo || (salon.photos && salon.photos[0]) || (galleryItems[0]?.url) || '';
    
    // Add review form (only for logged in users)
    const addReviewHtml = isLoggedIn ? `
      <div class="add-review-box">
        <div class="add-review-header">
          <span class="add-icon">✍️</span>
          <h4>დატოვე შეფასება</h4>
        </div>
        <div class="review-form-modern">
          <div class="rating-selector">
            <span class="rating-label">შეფასება:</span>
            <div class="star-rating-modern" id="starRating">
              <span class="star" data-rating="1">☆</span>
              <span class="star" data-rating="2">☆</span>
              <span class="star" data-rating="3">☆</span>
              <span class="star" data-rating="4">☆</span>
              <span class="star" data-rating="5">☆</span>
            </div>
          </div>
          <textarea id="reviewComment" placeholder="დაწერე კომენტარი..." maxlength="500"></textarea>
          <button class="btn btn-primary btn-submit-review" onclick="TbilisiMap.submitReview('${salonId}')">
            <span>📤</span> გაგზავნა
          </button>
        </div>
      </div>
    ` : `
      <div class="login-prompt-box">
        <span class="lock-icon">🔒</span>
        <p>შეფასების დასატოვებლად გაიარე ავტორიზაცია</p>
        <button class="btn btn-outline btn-sm" onclick="TbilisiMap.closeSalonModal(); if(typeof showLoginForm === 'function') showLoginForm();">
          შესვლა
        </button>
      </div>
    `;
    
    modal.innerHTML = `
      <div class="salon-modal-overlay" onclick="TbilisiMap.closeSalonModal()"></div>
      <div class="salon-modal-content">
        <button class="salon-modal-close" onclick="TbilisiMap.closeSalonModal()">&times;</button>
        
        <div class="salon-modal-header">
          ${salonPhoto ? `<img src="${salonPhoto}" alt="${this.escapeHtml(salon.name)}" class="salon-modal-cover" onerror="this.style.display='none'">` : '<div class="salon-modal-cover-placeholder">✨</div>'}
          <div class="salon-modal-title">
            <h2>${this.escapeHtml(salon.name)}</h2>
            <div class="salon-modal-rating">
              <span class="rating-stars">⭐ ${(salon.averageRating || salon.rating || 0).toFixed(1)}</span>
              <span class="rating-count">(${salon.totalReviews || salon.reviewCount || reviews.length} შეფასება)</span>
            </div>
          </div>
        </div>
        
        <div class="salon-modal-body">
          <div class="salon-info-grid">
            <div class="salon-info-item">
              <span class="info-icon">📍</span>
              <span>${this.escapeHtml(salon.address || '')}</span>
            </div>
            ${salon.phone ? `
              <div class="salon-info-item">
                <span class="info-icon">📞</span>
                <a href="tel:${salon.phone}">${this.escapeHtml(salon.phone)}</a>
              </div>
            ` : ''}
          </div>
          
          ${salon.description ? `<p class="salon-description">${this.escapeHtml(salon.description)}</p>` : ''}
          
          ${reviewsHtml}
          ${addReviewHtml}
          ${googleMapsHtml}
          ${photosHtml}
          ${workingHoursHtml}
          ${specialistsHtml}
          ${servicesHtml}
          
          <div class="salon-modal-actions">
            <button class="btn btn-primary btn-lg" onclick="TbilisiMap.bookSalon('${salonId}')">
              📅 ჯავშანი / Book Now
            </button>
            <button class="btn btn-outline btn-lg" onclick="TbilisiMap.getDirections(${coords.lat}, ${coords.lng})">
              🗺️ მიმართულება / Directions
            </button>
            ${salon.phone ? `
              <a href="tel:${salon.phone}" class="btn btn-outline btn-lg">
                📞 დარეკვა / Call
              </a>
            ` : ''}
          </div>
        </div>
      </div>
    `;
    
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    if (isLoggedIn) {
      this.initStarRating();
    }
  },
  
  initStarRating: function() {
    const stars = document.querySelectorAll('#starRating .star');
    let selectedRating = 0;
    
    stars.forEach(star => {
      star.addEventListener('click', function() {
        selectedRating = parseInt(this.dataset.rating);
        stars.forEach((s, i) => {
          s.textContent = i < selectedRating ? '★' : '☆';
          s.classList.toggle('selected', i < selectedRating);
        });
      });
      
      star.addEventListener('mouseenter', function() {
        const hoverRating = parseInt(this.dataset.rating);
        stars.forEach((s, i) => {
          s.textContent = i < hoverRating ? '★' : '☆';
        });
      });
      
      star.addEventListener('mouseleave', function() {
        stars.forEach((s, i) => {
          s.textContent = i < selectedRating ? '★' : '☆';
        });
      });
    });
    
    document.getElementById('starRating').getRating = () => selectedRating;
  },
  
  submitReview: async function(salonId) {
    const starRating = document.getElementById('starRating');
    const rating = starRating.getRating ? starRating.getRating() : 0;
    const comment = document.getElementById('reviewComment').value.trim();
    
    if (rating === 0) {
      alert('გთხოვთ აირჩიოთ რეიტინგი / Please select a rating');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('გთხოვთ გაიაროთ ავტორიზაცია / Please login to submit a review');
        if (typeof showLoginForm === 'function') showLoginForm();
        return;
      }
      
      const response = await fetch(`/api/map/salon/${salonId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ rating, comment })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        alert('შეფასება დამატებულია! / Review added successfully!');
        this.openSalonModal(salonId);
      } else {
        alert(result.message || 'შეცდომა / Error');
      }
    } catch (error) {
      console.error('Submit review error:', error);
      alert('შეცდომა შეფასების დამატებისას / Error submitting review');
    }
  },
  
  // Book specific specialist directly
  bookSpecialist: async function(salonId, specialistId, specialistName) {
    console.log('bookSpecialist called:', { salonId, specialistId, specialistName });
    
    const isLoggedIn = !!localStorage.getItem('token');
    if (!isLoggedIn) {
      alert('ჯავშანისთვის გაიარეთ ავტორიზაცია / Please login to book');
      this.closeSalonModal();
      if (typeof showLoginForm === 'function') showLoginForm();
      return;
    }
    
    try {
      // Use selectedSalon if available (from current modal), otherwise find in list
      let salon = this.selectedSalon;
      if (!salon || (salon.id !== salonId && salon._id !== salonId)) {
        salon = this.salons.find(s => s.id === salonId || s._id === salonId || s.id?.toString() === salonId || s._id?.toString() === salonId);
      }
      
      // If still not found, create minimal salon object from salonId
      if (!salon) {
        console.log('Creating minimal salon object for:', salonId);
        salon = { id: salonId, name: 'სალონი' };
      }
      
      console.log('Using salon:', salon);
      
      // Load specialists
      const response = await fetch(`/api/salons/${salonId}/specialists`);
      if (!response.ok) throw new Error('Failed to load specialists');
      
      const specialists = await response.json();
      console.log('Loaded specialists:', specialists);
      
      if (specialists.length === 0) {
        alert('ამ სალონში სპეციალისტები ჯერ არ არის / No specialists available yet');
        return;
      }
      
      this.showBookingModal(salon, specialists);
      
      // Pre-select the specialist
      setTimeout(() => {
        this.selectSpecialist(specialistId, specialistName);
      }, 100);
      
    } catch (error) {
      console.error('Book specialist error:', error);
      alert('შეცდომა / Error loading booking form: ' + error.message);
    }
  },
  
  // Open specialist review form
  openSpecialistReview: function(specialistId, specialistName) {
    const isLoggedIn = !!localStorage.getItem('token');
    if (!isLoggedIn) {
      alert('შეფასებისთვის გაიარეთ ავტორიზაცია / Please login to leave a review');
      if (typeof showLoginForm === 'function') showLoginForm();
      return;
    }
    
    let reviewModal = document.getElementById('specialistReviewModal');
    if (!reviewModal) {
      reviewModal = document.createElement('div');
      reviewModal.id = 'specialistReviewModal';
      reviewModal.className = 'specialist-review-modal';
      document.body.appendChild(reviewModal);
    }
    
    reviewModal.innerHTML = `
      <div class="specialist-review-overlay" onclick="TbilisiMap.closeSpecialistReviewModal()"></div>
      <div class="specialist-review-content">
        <button class="specialist-review-close" onclick="TbilisiMap.closeSpecialistReviewModal()">&times;</button>
        
        <div class="specialist-review-header">
          <h3>✍️ შეფასება / Review</h3>
          <p>${this.escapeHtml(specialistName)}</p>
        </div>
        
        <div class="specialist-review-body">
          <div class="rating-input">
            <span>რეიტინგი / Rating:</span>
            <div class="star-rating" id="specialistStarRating">
              <span class="star" data-rating="1">☆</span>
              <span class="star" data-rating="2">☆</span>
              <span class="star" data-rating="3">☆</span>
              <span class="star" data-rating="4">☆</span>
              <span class="star" data-rating="5">☆</span>
            </div>
          </div>
          
          <textarea id="specialistReviewComment" placeholder="თქვენი კომენტარი სპეციალისტზე... / Your comment about the specialist..." maxlength="500"></textarea>
          
          <button class="btn btn-primary btn-lg" onclick="TbilisiMap.submitSpecialistReview('${specialistId}')">
            გაგზავნა / Submit Review
          </button>
        </div>
      </div>
    `;
    
    // Set high z-index inline to ensure it's on top
    reviewModal.style.cssText = 'display: flex; position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 999999; align-items: center; justify-content: center;';
    this.initSpecialistStarRating();
  },
  
  initSpecialistStarRating: function() {
    const stars = document.querySelectorAll('#specialistStarRating .star');
    let selectedRating = 0;
    
    stars.forEach(star => {
      star.addEventListener('click', function() {
        selectedRating = parseInt(this.dataset.rating);
        stars.forEach((s, i) => {
          s.textContent = i < selectedRating ? '★' : '☆';
          s.classList.toggle('selected', i < selectedRating);
        });
      });
      
      star.addEventListener('mouseenter', function() {
        const hoverRating = parseInt(this.dataset.rating);
        stars.forEach((s, i) => {
          s.textContent = i < hoverRating ? '★' : '☆';
        });
      });
      
      star.addEventListener('mouseleave', function() {
        stars.forEach((s, i) => {
          s.textContent = i < selectedRating ? '★' : '☆';
        });
      });
    });
    
    document.getElementById('specialistStarRating').getRating = () => selectedRating;
  },
  
  submitSpecialistReview: async function(specialistId) {
    const starRating = document.getElementById('specialistStarRating');
    const rating = starRating.getRating ? starRating.getRating() : 0;
    const comment = document.getElementById('specialistReviewComment').value.trim();
    
    if (rating === 0) {
      alert('გთხოვთ აირჩიოთ რეიტინგი / Please select a rating');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('გთხოვთ გაიაროთ ავტორიზაცია / Please login to submit a review');
        if (typeof showLoginForm === 'function') showLoginForm();
        return;
      }
      
      const response = await fetch(`/api/specialists/${specialistId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ rating, comment })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        alert('შეფასება დამატებულია! / Review added successfully!');
        this.closeSpecialistReviewModal();
      } else {
        alert(result.message || 'შეცდომა / Error');
      }
    } catch (error) {
      console.error('Submit specialist review error:', error);
      alert('შეცდომა შეფასების დამატებისას / Error submitting review');
    }
  },
  
  closeSpecialistReviewModal: function() {
    const modal = document.getElementById('specialistReviewModal');
    if (modal) {
      modal.style.display = 'none';
    }
  },
  
  closeSalonModal: function() {
    const modal = document.getElementById('salonDetailModal');
    if (modal) {
      modal.style.display = 'none';
      document.body.style.overflow = '';
    }
  },
  
  // Open booking modal from profile page (no specific salon selected)
  openBookingFromProfile: async function() {
    const isLoggedIn = !!localStorage.getItem('token');
    if (!isLoggedIn) {
      alert('ჯავშანისთვის გაიარეთ ავტორიზაცია / Please login to book');
      if (typeof showLoginForm === 'function') showLoginForm();
      return;
    }
    
    // Load all salons if not loaded yet
    if (this.salons.length === 0) {
      await this.loadSalonsFromAPI();
    }
    
    // Show salon selection modal first
    this.showSalonSelectionModal();
  },
  
  // Show salon selection modal
  showSalonSelectionModal: function() {
    let modal = document.getElementById('salonSelectModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'salonSelectModal';
      modal.className = 'booking-modal';
      document.body.appendChild(modal);
    }
    
    modal.innerHTML = `
      <div class="booking-modal-overlay" onclick="TbilisiMap.closeSalonSelectModal()"></div>
      <div class="booking-modal-content">
        <button class="booking-modal-close" onclick="TbilisiMap.closeSalonSelectModal()">&times;</button>
        
        <div class="booking-modal-header">
          <h2>📅 ჯავშანი / Book Appointment</h2>
          <p>აირჩიეთ სალონი / Choose a Salon</p>
        </div>
        
        <div class="booking-modal-body">
          <div class="salon-select-search">
            <input type="text" id="salonSearchInput" placeholder="🔍 მოძებნე სალონი..." oninput="TbilisiMap.filterSalonsList()">
          </div>
          
          <div class="salon-select-list" id="salonSelectList">
            ${this.salons.map(salon => `
              <div class="salon-select-item" data-name="${(salon.name || '').toLowerCase()}" onclick="TbilisiMap.selectSalonFromList('${salon.id}')">
                <div class="salon-select-image">
                  ${salon.photo ? `<img src="${salon.photo}" onerror="this.parentElement.innerHTML='💅'">` : '<span>💅</span>'}
                </div>
                <div class="salon-select-info">
                  <h4>${this.escapeHtml(salon.name)}</h4>
                  <p>📍 ${this.escapeHtml(salon.address || '')}</p>
                  <div class="salon-select-rating">
                    <span>⭐ ${(salon.rating || 0).toFixed(1)}</span>
                    <span class="reviews-count">(${salon.reviewCount || 0})</span>
                  </div>
                </div>
                <span class="salon-select-arrow">→</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
    
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  },
  
  filterSalonsList: function() {
    const searchTerm = document.getElementById('salonSearchInput').value.toLowerCase();
    document.querySelectorAll('.salon-select-item').forEach(item => {
      const name = item.dataset.name;
      item.style.display = name.includes(searchTerm) ? '' : 'none';
    });
  },
  
  selectSalonFromList: async function(salonId) {
    this.closeSalonSelectModal();
    
    const salon = this.salons.find(s => s.id === salonId || s.id.toString() === salonId);
    if (!salon) {
      alert('სალონი ვერ მოიძებნა / Salon not found');
      return;
    }
    
    // Load specialists for this salon
    try {
      const response = await fetch(`/api/salons/${salonId}/specialists`);
      if (!response.ok) throw new Error('Failed to load specialists');
      
      const specialists = await response.json();
      
      if (specialists.length === 0) {
        alert('ამ სალონში სპეციალისტები ჯერ არ არის / No specialists available yet');
        return;
      }
      
      this.showBookingModal(salon, specialists);
    } catch (error) {
      console.error('Load specialists error:', error);
      alert('შეცდომა სპეციალისტების ჩატვირთვისას / Error loading specialists');
    }
  },
  
  closeSalonSelectModal: function() {
    const modal = document.getElementById('salonSelectModal');
    if (modal) {
      modal.style.display = 'none';
      document.body.style.overflow = '';
    }
  },
  
  bookSalon: async function(salonId) {
    const salon = this.salons.find(s => s.id === salonId || s.id.toString() === salonId);
    if (!salon) {
      alert('სალონი ვერ მოიძებნა / Salon not found');
      return;
    }
    
    // Check if user is logged in
    const isLoggedIn = !!localStorage.getItem('token');
    if (!isLoggedIn) {
      alert('ჯავშანისთვის გაიარეთ ავტორიზაცია / Please login to book');
      this.closeSalonModal();
      if (typeof showLoginForm === 'function') showLoginForm();
      return;
    }
    
    // Load specialists for this salon
    try {
      const response = await fetch(`/api/salons/${salonId}/specialists`);
      if (!response.ok) throw new Error('Failed to load specialists');
      
      const specialists = await response.json();
      
      if (specialists.length === 0) {
        alert('ამ სალონში სპეციალისტები ჯერ არ არის / No specialists available yet');
        return;
      }
      
      this.showBookingModal(salon, specialists);
    } catch (error) {
      console.error('Load specialists error:', error);
      alert('შეცდომა სპეციალისტების ჩატვირთვისას / Error loading specialists');
    }
  },
  
  showBookingModal: function(salon, specialists) {
    console.log('showBookingModal called with:', salon, specialists);
    
    if (!salon) {
      console.error('No salon provided to showBookingModal');
      alert('Ошибка: данные салона не найдены');
      return;
    }
    
    let bookingModal = document.getElementById('bookingModal');
    if (!bookingModal) {
      bookingModal = document.createElement('div');
      bookingModal.id = 'bookingModal';
      bookingModal.className = 'booking-modal';
      document.body.appendChild(bookingModal);
      console.log('Created new booking modal element');
    }
    
    // Category icons
    const categoryIcons = {
      nails: '💅',
      hair: '💇‍♀️',
      face: '✨',
      body: '💆‍♀️',
      makeup: '💄',
      spa: '🧖‍♀️',
      other: '⭐'
    };
    
    // Group specialists by category
    const categories = [...new Set(specialists.flatMap(sp => 
      (sp.services || []).map(s => s.category)
    ).filter(Boolean))];
    
    bookingModal.innerHTML = `
      <div class="booking-modal-overlay" onclick="TbilisiMap.closeBookingModal()"></div>
      <div class="booking-modal-content">
        <button class="booking-modal-close" onclick="TbilisiMap.closeBookingModal()">&times;</button>
        
        <div class="booking-modal-header">
          <h2>📅 ჯავშანი / Book Appointment</h2>
          <p>${this.escapeHtml(salon.name)}</p>
        </div>
        
        <div class="booking-modal-body">
          <!-- Step 1: Choose Category -->
          <div class="booking-step" id="bookingStep1">
            <h3>1. აირჩიე კატეგორია / Choose Category</h3>
            <div class="booking-categories">
              ${categories.map(cat => `
                <button class="booking-category-btn" data-category="${cat}" onclick="TbilisiMap.filterSpecialistsByCategory('${cat}')">
                  <span class="cat-icon">${categoryIcons[cat] || '⭐'}</span>
                  <span class="cat-name">${this.getCategoryName(cat)}</span>
                </button>
              `).join('')}
              <button class="booking-category-btn active" data-category="all" onclick="TbilisiMap.filterSpecialistsByCategory('all')">
                <span class="cat-icon">🌟</span>
                <span class="cat-name">ყველა / All</span>
              </button>
            </div>
          </div>
          
          <!-- Step 2: Choose Specialist -->
          <div class="booking-step" id="bookingStep2">
            <h3>2. აირჩიე სპეციალისტი / Choose Specialist</h3>
            <div class="booking-specialists" id="bookingSpecialists">
              ${specialists.map(sp => `
                <div class="booking-specialist-card" data-specialist-id="${sp._id}" data-categories="${(sp.services || []).map(s => s.category).join(',')}" onclick="TbilisiMap.selectSpecialist('${sp._id}', '${this.escapeHtml(sp.name)}')">
                  <img src="${sp.photoUrl || '/images/default-avatar.svg'}" alt="${this.escapeHtml(sp.name)}" onerror="this.onerror=null; this.src='/images/default-avatar.svg'">
                  <div class="specialist-details">
                    <h4>${this.escapeHtml(sp.name)}</h4>
                    <p class="specialist-position">${this.escapeHtml(sp.position || '')}</p>
                    <div class="specialist-services">
                      ${(sp.services || []).slice(0, 3).map(s => `<span class="service-tag">${categoryIcons[s.category] || ''} ${this.escapeHtml(s.name)}</span>`).join('')}
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
          
          <!-- Step 3: Choose Service -->
          <div class="booking-step hidden" id="bookingStep3">
            <h3>3. აირჩიე სერვისი / Choose Service</h3>
            <div class="booking-services" id="bookingServices"></div>
          </div>
          
          <!-- Step 4: Choose Date & Time -->
          <div class="booking-step hidden" id="bookingStep4">
            <h3>4. აირჩიე დრო / Choose Date & Time</h3>
            <div class="booking-datetime">
              <div class="date-picker">
                <label>თარიღი / Date:</label>
                <input type="date" id="bookingDate" min="${new Date().toISOString().split('T')[0]}" onchange="TbilisiMap.loadAvailableSlots()">
              </div>
              <div class="time-slots" id="bookingTimeSlots">
                <p class="slots-hint">აირჩიე თარიღი / Select a date first</p>
              </div>
            </div>
          </div>
          
          <!-- Booking Summary & Confirm -->
          <div class="booking-summary hidden" id="bookingSummary">
            <h3>📋 ჯავშნის დეტალები / Booking Summary</h3>
            <div class="summary-content">
              <p><strong>სალონი:</strong> <span id="summSalon">${this.escapeHtml(salon.name)}</span></p>
              <p><strong>სპეციალისტი:</strong> <span id="summSpecialist">-</span></p>
              <p><strong>სერვისი:</strong> <span id="summService">-</span></p>
              <p><strong>თარიღი:</strong> <span id="summDate">-</span></p>
              <p><strong>დრო:</strong> <span id="summTime">-</span></p>
              <p><strong>ფასი:</strong> <span id="summPrice">-</span></p>
            </div>
            <button class="btn btn-primary btn-lg booking-confirm-btn" onclick="TbilisiMap.confirmBooking()">
              ✅ ჯავშნის დადასტურება / Confirm Booking
            </button>
          </div>
        </div>
      </div>
    `;
    
    // Store booking data
    this.bookingData = {
      salonId: salon.id,
      salonName: salon.name,
      specialists: specialists,
      specialistId: null,
      specialistName: null,
      service: null,
      date: null,
      time: null
    };
    
    // Close salon modal first so booking modal appears on top
    this.closeSalonModal();
    
    // Set high z-index inline to ensure it's on top
    bookingModal.style.cssText = 'display: flex; position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 999999; align-items: center; justify-content: center;';
    document.body.style.overflow = 'hidden';
  },
  
  getCategoryName: function(cat) {
    const names = {
      nails: 'ფრჩხილები / Nails',
      hair: 'თმა / Hair',
      face: 'სახე / Face',
      body: 'სხეული / Body',
      makeup: 'მაკიაჟი / Makeup',
      spa: 'სპა / Spa',
      other: 'სხვა / Other'
    };
    return names[cat] || cat;
  },
  
  filterSpecialistsByCategory: function(category) {
    // Update active button
    document.querySelectorAll('.booking-category-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.category === category);
    });
    
    // Filter specialists
    document.querySelectorAll('.booking-specialist-card').forEach(card => {
      if (category === 'all') {
        card.style.display = '';
      } else {
        const cats = card.dataset.categories.split(',');
        card.style.display = cats.includes(category) ? '' : 'none';
      }
    });
  },
  
  selectSpecialist: function(specialistId, specialistName) {
    // Update UI
    document.querySelectorAll('.booking-specialist-card').forEach(card => {
      card.classList.toggle('selected', card.dataset.specialistId === specialistId);
    });
    
    // Store selection
    this.bookingData.specialistId = specialistId;
    this.bookingData.specialistName = specialistName;
    
    // Find specialist services
    const specialist = this.bookingData.specialists.find(s => s._id === specialistId);
    const services = specialist?.services || [];
    
    // Show step 3 - services
    const step3 = document.getElementById('bookingStep3');
    step3.classList.remove('hidden');
    
    const categoryIcons = {
      nails: '💅', hair: '💇‍♀️', face: '✨', body: '💆‍♀️', makeup: '💄', spa: '🧖‍♀️', other: '⭐'
    };
    
    document.getElementById('bookingServices').innerHTML = services.map(s => `
      <div class="booking-service-card" data-service='${JSON.stringify(s)}' onclick="TbilisiMap.selectService(this)">
        <span class="service-icon">${categoryIcons[s.category] || '⭐'}</span>
        <div class="service-info">
          <h4>${this.escapeHtml(s.name)}</h4>
          <p>⏱ ${s.duration || 30} წუთი</p>
        </div>
        <div class="service-price">${s.bpPrice || 10} BP</div>
      </div>
    `).join('') || '<p class="no-services">სერვისები არ არის / No services</p>';
    
    // Scroll to step 3
    step3.scrollIntoView({ behavior: 'smooth', block: 'start' });
    
    // Update summary
    document.getElementById('summSpecialist').textContent = specialistName;
  },
  
  selectService: function(element) {
    // Update UI
    document.querySelectorAll('.booking-service-card').forEach(card => {
      card.classList.remove('selected');
    });
    element.classList.add('selected');
    
    // Store selection
    const service = JSON.parse(element.dataset.service);
    this.bookingData.service = service;
    
    // Show step 4 - datetime
    const step4 = document.getElementById('bookingStep4');
    step4.classList.remove('hidden');
    step4.scrollIntoView({ behavior: 'smooth', block: 'start' });
    
    // Update summary
    document.getElementById('summService').textContent = `${service.name} (${service.duration || 30} წუთი)`;
    document.getElementById('summPrice').textContent = `${service.bpPrice || 10} BP`;
  },
  
  loadAvailableSlots: async function() {
    const dateInput = document.getElementById('bookingDate');
    const selectedDate = dateInput.value;
    
    if (!selectedDate || !this.bookingData.specialistId) return;
    
    this.bookingData.date = selectedDate;
    document.getElementById('summDate').textContent = new Date(selectedDate).toLocaleDateString('ka-GE');
    
    const slotsContainer = document.getElementById('bookingTimeSlots');
    slotsContainer.innerHTML = '<div class="loading-spinner"></div>';
    
    try {
      const response = await fetch(`/api/specialists/${this.bookingData.specialistId}/slots?date=${selectedDate}`);
      if (!response.ok) throw new Error('Failed to load slots');
      
      const slots = await response.json();
      
      // Filter available slots (not booked)
      const availableSlots = slots.filter(slot => !slot.isBooked);
      
      if (availableSlots.length === 0) {
        slotsContainer.innerHTML = `
          <p class="no-slots">ამ თარიღზე თავისუფალი დრო არ არის<br>No available slots for this date<br><small style="color:#999;">სალონს ჯერ არ დაუმატებია სლოტები ამ თარიღისთვის</small></p>
        `;
        return;
      }
      
      slotsContainer.innerHTML = `
        <div class="slots-grid">
          ${availableSlots.map(slot => `
            <button class="time-slot-btn" data-slot-id="${slot._id}" data-time="${slot.time}" onclick="TbilisiMap.selectTimeSlot(this, '${slot.time}', '${slot._id}')">
              ${slot.time}
              <small style="display:block;font-size:10px;color:#666;">${slot.serviceName || ''}</small>
            </button>
          `).join('')}
        </div>
      `;
      
    } catch (error) {
      console.error('Load slots error:', error);
      slotsContainer.innerHTML = `
        <p class="no-slots">შეცდომა სლოტების ჩატვირთვისას<br>Error loading slots</p>
      `;
    }
  },
  
  selectTimeSlot: function(element, time, slotId) {
    document.querySelectorAll('.time-slot-btn').forEach(btn => {
      btn.classList.remove('selected');
    });
    element.classList.add('selected');
    
    this.bookingData.time = time;
    this.bookingData.slotId = slotId;
    document.getElementById('summTime').textContent = time;
    
    // Show summary
    const summary = document.getElementById('bookingSummary');
    summary.classList.remove('hidden');
    summary.scrollIntoView({ behavior: 'smooth', block: 'start' });
  },
  
  confirmBooking: async function() {
    const { salonId, specialistId, specialistName, service, date, time, slotId } = this.bookingData;
    
    if (!specialistId || !service || !date || !time) {
      alert('გთხოვთ შეავსოთ ყველა ველი / Please fill all fields');
      return;
    }
    
    const token = localStorage.getItem('token');
    if (!token) {
      alert('გთხოვთ გაიაროთ ავტორიზაცია / Please login');
      return;
    }
    
    const confirmBtn = document.querySelector('.booking-confirm-btn');
    confirmBtn.disabled = true;
    confirmBtn.innerHTML = '⏳ მუშავდება... / Processing...';
    
    try {
      // Проверяем, это изменение существующего бронирования
      if (window.bookingToChange && slotId) {
        const response = await fetch(`/api/booking/${window.bookingToChange}/change`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ newSlotId: slotId })
        });
        
        const result = await response.json();
        
        if (response.ok) {
          window.bookingToChange = null; // Очищаем флаг
          this.closeBookingModal();
          this.closeSalonModal();
          alert('✅ ჯავშანი შეიცვალა!\nBooking changed successfully!\n\nახალი დრო: ' + date + ' ' + time);
          
          // Обновляем список бронирований и слотов
          if (typeof loadUserBookings === 'function') {
            loadUserBookings();
          }
          if (typeof loadAvailableSlots === 'function') {
            loadAvailableSlots();
          }
        } else {
          alert(result.message || 'შეცდომა ჯავშნის შეცვლისას / Change error');
        }
        return;
      }
      
      // If we have a slotId, use the slot booking endpoint
      const endpoint = slotId ? '/api/booking/slot' : '/api/booking/specialist';
      const bodyData = slotId ? {
        slotId: slotId
      } : {
        salonId: salonId,
        specialistId: specialistId,
        specialistName: specialistName,
        serviceName: service.name,
        serviceCategory: service.category,
        date: date,
        times: [time],
        duration: service.duration || 30,
        bpPrice: service.bpPrice || 10
      };
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bodyData)
      });
      
      const result = await response.json();
      
      if (response.ok) {
        this.closeBookingModal();
        this.closeSalonModal();
        alert('🎉 ჯავშანი წარმატებით დადასტურდა!\nBooking confirmed successfully!');
        
        // Refresh user balance if function exists
        if (typeof updateUserBalance === 'function') {
          updateUserBalance();
        }
      } else {
        alert(result.message || 'შეცდომა ჯავშნისას / Booking error');
      }
    } catch (error) {
      console.error('Booking error:', error);
      alert('შეცდომა ჯავშნისას / Booking error');
    } finally {
      confirmBtn.disabled = false;
      confirmBtn.innerHTML = '✅ ჯავშნის დადასტურება / Confirm Booking';
    }
  },
  
  closeBookingModal: function() {
    const modal = document.getElementById('bookingModal');
    if (modal) {
      modal.style.display = 'none';
    }
    this.bookingData = null;
  },
  
  getDirections: function(lat, lng) {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, '_blank');
  },
  
  fitAllMarkers: function() {
    if (this.markers.length > 0) {
      setTimeout(() => {
        const group = L.featureGroup(this.markers);
        this.map.fitBounds(group.getBounds().pad(0.1), {
          animate: true,
          duration: 1
        });
      }, this.markers.length * 100 + 300);
    }
  },
  
  openPhotoViewer: function(photoUrl) {
    const viewer = document.createElement('div');
    viewer.className = 'photo-viewer';
    viewer.innerHTML = `
      <div class="photo-viewer-overlay" onclick="this.parentElement.remove()"></div>
      <img src="${photoUrl}" alt="Photo">
      <button class="photo-viewer-close" onclick="this.parentElement.remove()">&times;</button>
    `;
    document.body.appendChild(viewer);
  },
  
  openVideoViewer: function(videoUrl) {
    const viewer = document.createElement('div');
    viewer.className = 'photo-viewer video-viewer';
    viewer.innerHTML = `
      <div class="photo-viewer-overlay" onclick="this.parentElement.remove()"></div>
      <video src="${videoUrl}" controls autoplay style="max-width: 90vw; max-height: 90vh; border-radius: 12px;"></video>
      <button class="photo-viewer-close" onclick="this.parentElement.remove()">&times;</button>
    `;
    document.body.appendChild(viewer);
  },
  
  escapeHtml: function(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },
  
  refresh: async function() {
    await this.loadSalonsFromAPI();
    this.renderSalonsList();
  }
};

// Global helper functions for onclick handlers
window.bookSpecialistClick = async function(btn) {
  try {
    const salonId = btn.getAttribute('data-salon-id');
    const specialistId = btn.getAttribute('data-specialist-id');
    const specialistName = btn.getAttribute('data-specialist-name');
    console.log('bookSpecialistClick:', salonId, specialistId, specialistName);
    
    // Check login
    const token = localStorage.getItem('token');
    if (!token) {
      alert('ჯავშანისთვის გაიარეთ ავტორიზაცია / Please login to book');
      if (typeof showLoginForm === 'function') showLoginForm();
      return;
    }
    
    // Load specialists
    const response = await fetch('/api/salons/' + salonId + '/specialists');
    const specialists = await response.json();
    console.log('Loaded specialists:', specialists);
    
    if (!specialists || specialists.length === 0) {
      alert('სპეციალისტები ვერ მოიძებნა / No specialists found');
      return;
    }
    
    // Get salon info
    const salon = TbilisiMap.selectedSalon || { id: salonId, name: 'სალონი' };
    
    // Show booking modal
    TbilisiMap.showBookingModal(salon, specialists);
    
    // Pre-select specialist after modal shows
    setTimeout(() => {
      TbilisiMap.selectSpecialist(specialistId, specialistName);
    }, 200);
    
  } catch (error) {
    console.error('bookSpecialistClick error:', error);
    alert('შეცდომა: ' + error.message);
  }
};

window.reviewSpecialistClick = function(btn) {
  try {
    const specialistId = btn.getAttribute('data-specialist-id');
    const specialistName = btn.getAttribute('data-specialist-name');
    console.log('reviewSpecialistClick:', specialistId, specialistName);
    
    // Check login
    const token = localStorage.getItem('token');
    if (!token) {
      alert('შეფასებისთვის გაიარეთ ავტორიზაცია / Please login to leave a review');
      if (typeof showLoginForm === 'function') showLoginForm();
      return;
    }
    
    TbilisiMap.openSpecialistReview(specialistId, specialistName);
  } catch (error) {
    console.error('reviewSpecialistClick error:', error);
    alert('შეცდომა: ' + error.message);
  }
};

// View specialist reviews
window.viewSpecialistReviewsClick = async function(btn) {
  try {
    const specialistId = btn.getAttribute('data-specialist-id');
    const specialistName = btn.getAttribute('data-specialist-name');
    
    // Create modal
    let modal = document.getElementById('specialistReviewsViewModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'specialistReviewsViewModal';
      document.body.appendChild(modal);
    }
    
    modal.innerHTML = `
      <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); z-index: 999998;" onclick="document.getElementById('specialistReviewsViewModal').style.display='none'"></div>
      <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; border-radius: 20px; max-width: 500px; width: 90%; max-height: 80vh; overflow-y: auto; z-index: 999999; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
        <div style="padding: 20px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
          <h3 style="margin: 0;">📖 შეფასებები: ${specialistName}</h3>
          <button onclick="document.getElementById('specialistReviewsViewModal').style.display='none'" style="background: none; border: none; font-size: 24px; cursor: pointer;">&times;</button>
        </div>
        <div id="specialistReviewsList" style="padding: 20px;">
          <p style="text-align: center; color: #666;">იტვირთება...</p>
        </div>
      </div>
    `;
    
    modal.style.display = 'block';
    
    // Load reviews
    const response = await fetch('/api/specialists/' + specialistId + '/reviews');
    const data = await response.json();
    const reviews = data.reviews || [];
    
    const reviewsContainer = document.getElementById('specialistReviewsList');
    
    if (!reviews || reviews.length === 0) {
      reviewsContainer.innerHTML = `
        <div style="text-align: center; padding: 40px 20px; color: #666;">
          <span style="font-size: 48px; display: block; margin-bottom: 16px;">📝</span>
          <p>შეფასებები ჯერ არ არის / No reviews yet</p>
        </div>
      `;
    } else {
      reviewsContainer.innerHTML = `
        <div style="text-align: center; margin-bottom: 16px; padding: 12px; background: #f8f4ff; border-radius: 12px;">
          <span style="font-size: 24px; color: #f39c12;">⭐ ${(data.averageRating || 0).toFixed(1)}</span>
          <span style="color: #666; margin-left: 8px;">(${data.reviewCount || reviews.length} შეფასება)</span>
        </div>
      ` + reviews.map(r => `
        <div style="padding: 16px; border-bottom: 1px solid #f0f0f0; margin-bottom: 8px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <strong style="color: #333;">${r.userName || 'ანონიმური'}</strong>
            <span style="color: #f39c12; font-weight: 600;">⭐ ${r.rating}/5</span>
          </div>
          ${r.comment ? `<p style="margin: 0; color: #666; font-size: 14px;">${r.comment}</p>` : ''}
          <small style="color: #999; margin-top: 8px; display: block;">${new Date(r.createdAt).toLocaleDateString('ka-GE')}</small>
        </div>
      `).join('');
    }
    
  } catch (error) {
    console.error('View specialist reviews error:', error);
    alert('შეცდომა შეფასებების ჩატვირთვისას');
  }
};

// Inject CSS styles
const mapStyles = document.createElement('style');
mapStyles.textContent = `
  #tbilisiMap { width: 100%; height: 500px; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.15); }
  @media (max-width: 768px) { #tbilisiMap { height: 350px; border-radius: 16px; } }
  .beauty-marker { background: transparent; border: none; }
  .marker-container { position: relative; cursor: pointer; transition: transform 0.3s ease; }
  .marker-container:hover { transform: scale(1.15); }
  .marker-pin { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(232, 67, 147, 0.4); animation: markerDrop 0.5s ease-out; }
  .marker-pulse { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 50px; height: 50px; border-radius: 50%; animation: pulse 2s infinite; z-index: -1; }
  .high-rated .marker-pin { box-shadow: 0 4px 12px rgba(108, 92, 231, 0.5); }
  .high-rated .marker-pulse { background: rgba(108, 92, 231, 0.3); }
  @keyframes markerDrop { 0% { opacity: 0; transform: translateY(-30px); } 60% { transform: translateY(5px); } 100% { opacity: 1; transform: translateY(0); } }
  @keyframes pulse { 0% { transform: translate(-50%, -50%) scale(0.5); opacity: 1; } 100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; } }
  .beauty-popup .leaflet-popup-content-wrapper { background: white; border-radius: 16px; padding: 0; box-shadow: 0 10px 40px rgba(0,0,0,0.15); overflow: hidden; }
  .beauty-popup .leaflet-popup-content { margin: 0; min-width: 280px; }
  .beauty-popup .leaflet-popup-tip { background: white; }
  .salon-popup { overflow: hidden; }
  .popup-image { width: 100%; height: 120px; overflow: hidden; }
  .popup-image img { width: 100%; height: 100%; object-fit: cover; }
  .popup-body { padding: 16px; }
  .popup-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
  .popup-header h4 { margin: 0; font-size: 1.1rem; color: #333; }
  .popup-rating { font-size: 0.9rem; font-weight: 600; color: #f39c12; }
  .popup-rating .review-count { font-size: 0.75rem; color: #999; font-weight: normal; }
  .popup-address, .popup-phone { font-size: 0.85rem; color: #666; margin-bottom: 8px; }
  .popup-services { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px; }
  .popup-service { background: #fce4ec; color: #e84393; padding: 4px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: 500; }
  .popup-actions { display: flex; gap: 8px; }
  .popup-actions .btn { flex: 1; padding: 8px 12px; font-size: 0.8rem; border-radius: 8px; }
  .map-sidebar { background: white; border-radius: 16px; padding: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); max-height: 600px; overflow-y: auto; }
  .map-filters { margin-bottom: 20px; }
  .map-search { width: 100%; padding: 12px 16px; border: 2px solid #eee; border-radius: 12px; font-size: 1rem; margin-bottom: 12px; transition: border-color 0.2s; }
  .map-search:focus { outline: none; border-color: #e84393; }
  .filter-row { display: flex; gap: 12px; margin-bottom: 12px; }
  .filter-select { flex: 1; padding: 10px 14px; border: 2px solid #eee; border-radius: 10px; font-size: 0.9rem; background: white; cursor: pointer; }
  .category-pills { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
  .category-pill { padding: 8px 16px; border: 2px solid #eee; border-radius: 20px; background: white; font-size: 0.85rem; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 4px; }
  .category-pill:hover { border-color: #e84393; color: #e84393; }
  .category-pill.active { background: linear-gradient(135deg, #e84393, #a29bfe); color: white; border-color: transparent; }
  .salon-list-item { display: flex; gap: 12px; padding: 12px; border-radius: 12px; cursor: pointer; transition: all 0.2s; margin-bottom: 8px; }
  .salon-list-item:hover, .salon-list-item.active { background: #fce4ec; }
  .salon-list-image { width: 60px; height: 60px; border-radius: 12px; overflow: hidden; flex-shrink: 0; }
  .salon-list-image img { width: 100%; height: 100%; object-fit: cover; }
  .salon-list-image .no-image { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: #fce4ec; font-size: 1.5rem; }
  .salon-list-info h4 { margin: 0 0 4px; font-size: 0.95rem; }
  .salon-list-address { font-size: 0.8rem; color: #666; margin: 0 0 4px; }
  .salon-list-meta { font-size: 0.8rem; }
  .salon-rating { color: #f39c12; font-weight: 600; }
  .salon-reviews { color: #666; margin-left: 4px; }
  .no-salons { text-align: center; padding: 40px 20px; color: #666; }
  .no-salons span { font-size: 3rem; display: block; margin-bottom: 12px; }
  .salon-modal { display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 10000; align-items: center; justify-content: center; }
  .salon-modal-overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(4px); }
  .salon-modal-content { position: relative; background: white; border-radius: 24px; max-width: 700px; width: 90%; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3); animation: modalSlideIn 0.3s ease-out; }
  @keyframes modalSlideIn { from { opacity: 0; transform: translateY(30px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
  .salon-modal-close { position: absolute; top: 16px; right: 16px; width: 36px; height: 36px; border-radius: 50%; border: none; background: rgba(255, 255, 255, 0.9); font-size: 1.5rem; cursor: pointer; z-index: 10; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 10px rgba(0,0,0,0.1); transition: transform 0.2s; }
  .salon-modal-close:hover { transform: scale(1.1); }
  .salon-modal-header { position: relative; }
  .salon-modal-cover { width: 100%; height: 200px; object-fit: cover; }
  .salon-modal-title { padding: 20px 24px; background: linear-gradient(to top, white 60%, transparent); margin-top: -60px; position: relative; }
  .salon-modal-title h2 { margin: 0 0 8px; font-size: 1.5rem; }
  .salon-modal-rating { display: flex; align-items: center; gap: 8px; }
  .rating-stars { font-size: 1.1rem; color: #f39c12; }
  .rating-count { color: #666; font-size: 0.9rem; }
  .salon-modal-body { padding: 0 24px 24px; }
  .salon-info-grid { display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px; padding: 16px; background: #f8f9fa; border-radius: 12px; }
  .salon-info-item { display: flex; align-items: center; gap: 10px; font-size: 0.95rem; }
  .salon-info-item a { color: #e84393; text-decoration: none; }
  .info-icon { font-size: 1.2rem; }
  .salon-description { color: #666; line-height: 1.6; margin-bottom: 20px; }
  .salon-gallery-section { margin-bottom: 24px; }
  .salon-gallery-section h4 { margin: 0 0 12px; font-size: 1.1rem; color: #333; }
  .salon-gallery { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 8px; flex-wrap: wrap; }
  .salon-gallery img, .salon-gallery video { width: 100px; height: 100px; object-fit: cover; border-radius: 12px; cursor: pointer; transition: transform 0.2s; }
  .salon-gallery img:hover, .salon-gallery video:hover { transform: scale(1.05); }
  .salon-gallery video { background: #000; }
  .salon-working-hours, .salon-specialists, .salon-services-list, .salon-reviews-section { margin-bottom: 24px; }
  .salon-working-hours h4, .salon-specialists h4, .salon-services-list h4, .salon-reviews-section h4 { margin: 0 0 16px; font-size: 1.1rem; }
  .salon-working-hours ul { list-style: none; padding: 0; margin: 0; }
  .salon-working-hours li { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; font-size: 0.9rem; }
  .salon-working-hours li span:first-child { color: #666; }
  .specialists-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 16px; }
  .specialist-card { text-align: center; padding: 16px; background: #f8f9fa; border-radius: 16px; transition: transform 0.2s; }
  .specialist-card:hover { transform: translateY(-4px); }
  .specialist-card img { width: 80px; height: 80px; border-radius: 50%; object-fit: cover; margin-bottom: 12px; border: 3px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
  .specialist-info h5 { margin: 0 0 4px; font-size: 0.95rem; }
  .specialist-info p { margin: 0; font-size: 0.8rem; color: #666; }
  .specialist-rating { display: inline-block; margin-top: 6px; font-size: 0.8rem; color: #f39c12; }
  
  /* Enhanced Specialist List */
  .specialists-list { display: flex; flex-direction: column; gap: 16px; }
  .specialist-card-full { display: flex; gap: 16px; padding: 16px; background: #f8f9fa; border-radius: 16px; transition: all 0.2s; }
  .specialist-card-full:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
  .specialist-card-full img { width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 3px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.1); flex-shrink: 0; }
  .specialist-card-full .specialist-info { flex: 1; }
  .specialist-card-full .specialist-info h5 { margin: 0 0 4px; font-size: 1rem; }
  .specialist-position { color: #e84393; font-weight: 500; margin: 0 0 6px !important; }
  .specialist-desc { margin: 0 0 10px !important; font-size: 0.85rem !important; color: #666 !important; line-height: 1.4; }
  .specialist-services-tags { display: flex; flex-wrap: wrap; gap: 6px; }
  .specialist-services-tags .service-tag { background: white; border: 1px solid #eee; padding: 4px 10px; border-radius: 12px; font-size: 0.75rem; color: #333; }
  .specialist-services-tags .service-tag.more { background: #e84393; color: white; border-color: transparent; }
  .no-specialists-msg { color: #666; font-size: 0.9rem; padding: 20px; text-align: center; background: #f8f9fa; border-radius: 12px; }
  
  .services-grid { display: flex; flex-direction: column; gap: 12px; }
  .service-item { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: #f8f9fa; border-radius: 12px; }
  .service-info h5 { margin: 0 0 4px; font-size: 0.95rem; }
  .service-duration { font-size: 0.8rem; color: #666; }
  .service-price { text-align: right; }
  .bp-price { display: block; font-weight: 600; color: #e84393; }
  .regular-price { font-size: 0.85rem; color: #666; }
  .reviews-list { display: flex; flex-direction: column; gap: 16px; }
  .review-item { padding: 16px; background: #f8f9fa; border-radius: 12px; }
  .review-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
  .review-author { font-weight: 600; font-size: 0.95rem; }
  .review-rating { color: #f39c12; }
  .review-text { margin: 0 0 8px; font-size: 0.9rem; color: #333; line-height: 1.5; }
  .review-date { font-size: 0.8rem; color: #666; }
  .salon-modal-actions { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 24px; }
  .salon-modal-actions .btn { flex: 1; min-width: 150px; }
  .add-review-section { padding: 20px; background: #f8f9fa; border-radius: 16px; }
  .add-review-section h4 { margin: 0 0 16px; }
  .review-form { display: flex; flex-direction: column; gap: 16px; }
  .rating-input { display: flex; align-items: center; gap: 12px; }
  .star-rating { display: flex; gap: 4px; }
  .star-rating .star { font-size: 1.8rem; cursor: pointer; color: #ddd; transition: color 0.2s, transform 0.1s; }
  .star-rating .star:hover, .star-rating .star.selected { color: #f39c12; transform: scale(1.1); }
  .review-form textarea { width: 100%; min-height: 100px; padding: 12px 16px; border: 2px solid #eee; border-radius: 12px; font-size: 0.95rem; resize: vertical; font-family: inherit; }
  .review-form textarea:focus { outline: none; border-color: #e84393; }
  .photo-viewer { position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 10001; display: flex; align-items: center; justify-content: center; }
  .photo-viewer-overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.9); }
  .photo-viewer img { position: relative; max-width: 90%; max-height: 90%; border-radius: 8px; }
  .photo-viewer-close { position: absolute; top: 20px; right: 20px; width: 40px; height: 40px; border-radius: 50%; border: none; background: white; font-size: 1.5rem; cursor: pointer; }
  .map-section-container { display: grid; grid-template-columns: 1fr 350px; gap: 24px; margin: 40px 0; }
  @media (max-width: 992px) { .map-section-container { grid-template-columns: 1fr; } .map-sidebar { max-height: 400px; } }
  
  /* Google Maps Info */
  .google-maps-info { background: linear-gradient(135deg, #4285f4, #34a853); padding: 20px; border-radius: 16px; margin-bottom: 24px; color: white; }
  .google-maps-info h4 { margin: 0 0 16px; color: white; }
  .google-maps-stats { display: flex; gap: 24px; margin-bottom: 16px; }
  .google-stat { display: flex; flex-direction: column; align-items: center; }
  .google-icon { font-size: 1.5rem; }
  .google-value { font-size: 1.5rem; font-weight: 700; }
  .google-label { font-size: 0.8rem; opacity: 0.9; }
  .google-link { display: inline-block; background: white; color: #4285f4; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 600; transition: transform 0.2s; }
  .google-link:hover { transform: scale(1.05); }
  
  /* No reviews & Login to review */
  .no-reviews { text-align: center; padding: 30px; background: #f8f9fa; border-radius: 12px; color: #666; }
  .login-to-review { text-align: center; padding: 24px; background: linear-gradient(135deg, #fce4ec, #f3e5f5); border-radius: 16px; margin-top: 16px; }
  .login-to-review p { margin: 0 0 8px; color: #666; }
  .login-to-review p:first-child { font-weight: 600; color: #e84393; }
  .login-to-review .btn { margin-top: 12px; }
  
  /* Modal cover placeholder */
  .salon-modal-cover-placeholder { width: 100%; height: 200px; background: linear-gradient(135deg, #e84393, #a29bfe); display: flex; align-items: center; justify-content: center; font-size: 4rem; }
  
  /* Loading spinner */
  .loading-spinner { width: 50px; height: 50px; border: 4px solid #eee; border-top-color: #e84393; border-radius: 50%; animation: spin 1s linear infinite; margin: 20px auto; }
  @keyframes spin { to { transform: rotate(360deg); } }
  
  /* Booking Modal Styles - z-index 99999 to be on top of everything */
  .booking-modal { display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 99999; align-items: center; justify-content: center; }
  .booking-modal-overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.7); backdrop-filter: blur(4px); z-index: 99999; }
  .booking-modal-content { position: relative; background: white; border-radius: 24px; max-width: 600px; width: 95%; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3); animation: modalSlideIn 0.3s ease-out; z-index: 100000; }
  .booking-modal-close { position: absolute; top: 16px; right: 16px; width: 36px; height: 36px; border-radius: 50%; border: none; background: #f8f9fa; font-size: 1.5rem; cursor: pointer; z-index: 100001; display: flex; align-items: center; justify-content: center; transition: transform 0.2s; }
  .booking-modal-close:hover { transform: scale(1.1); background: #eee; }
  .booking-modal-header { background: linear-gradient(135deg, #e84393, #a29bfe); padding: 24px; color: white; border-radius: 24px 24px 0 0; }
  .booking-modal-header h2 { margin: 0 0 8px; }
  .booking-modal-header p { margin: 0; opacity: 0.9; }
  .booking-modal-body { padding: 24px; }
  
  /* Booking Steps */
  .booking-step { margin-bottom: 24px; padding-bottom: 24px; border-bottom: 2px solid #f0f0f0; }
  .booking-step.hidden { display: none; }
  .booking-step h3 { margin: 0 0 16px; font-size: 1.1rem; color: #333; }
  
  /* Category Buttons */
  .booking-categories { display: flex; flex-wrap: wrap; gap: 10px; }
  .booking-category-btn { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 12px 20px; border: 2px solid #eee; border-radius: 12px; background: white; cursor: pointer; transition: all 0.2s; }
  .booking-category-btn:hover { border-color: #e84393; }
  .booking-category-btn.active { background: linear-gradient(135deg, #e84393, #a29bfe); color: white; border-color: transparent; }
  .booking-category-btn .cat-icon { font-size: 1.5rem; }
  .booking-category-btn .cat-name { font-size: 0.8rem; font-weight: 500; }
  
  /* Specialists Grid */
  .booking-specialists { display: flex; flex-direction: column; gap: 12px; max-height: 300px; overflow-y: auto; }
  .booking-specialist-card { display: flex; gap: 16px; padding: 16px; border: 2px solid #eee; border-radius: 16px; cursor: pointer; transition: all 0.2s; }
  .booking-specialist-card:hover { border-color: #e84393; background: #fce4ec; }
  .booking-specialist-card.selected { border-color: #e84393; background: #fce4ec; box-shadow: 0 4px 12px rgba(232, 67, 147, 0.2); }
  .booking-specialist-card img { width: 70px; height: 70px; border-radius: 50%; object-fit: cover; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
  .specialist-details h4 { margin: 0 0 4px; font-size: 1rem; }
  .specialist-position { margin: 0 0 8px; font-size: 0.85rem; color: #666; }
  .specialist-services { display: flex; flex-wrap: wrap; gap: 6px; }
  .service-tag { background: #f0f0f0; padding: 4px 10px; border-radius: 12px; font-size: 0.75rem; color: #666; }
  
  /* Services Grid */
  .booking-services { display: flex; flex-direction: column; gap: 10px; }
  .booking-service-card { display: flex; align-items: center; gap: 16px; padding: 16px; border: 2px solid #eee; border-radius: 12px; cursor: pointer; transition: all 0.2s; }
  .booking-service-card:hover { border-color: #e84393; }
  .booking-service-card.selected { border-color: #e84393; background: #fce4ec; }
  .booking-service-card .service-icon { font-size: 1.8rem; }
  .booking-service-card .service-info { flex: 1; }
  .booking-service-card .service-info h4 { margin: 0 0 4px; font-size: 0.95rem; }
  .booking-service-card .service-info p { margin: 0; font-size: 0.85rem; color: #666; }
  .booking-service-card .service-price { font-size: 1.2rem; font-weight: 700; color: #e84393; }
  .no-services { text-align: center; padding: 20px; color: #666; }
  
  /* Date & Time Picker */
  .booking-datetime { display: flex; flex-direction: column; gap: 16px; }
  .date-picker { display: flex; align-items: center; gap: 12px; }
  .date-picker label { font-weight: 600; color: #333; }
  .date-picker input { padding: 12px 16px; border: 2px solid #eee; border-radius: 12px; font-size: 1rem; cursor: pointer; }
  .date-picker input:focus { outline: none; border-color: #e84393; }
  
  /* Time Slots */
  .time-slots { background: #f8f9fa; border-radius: 16px; padding: 16px; }
  .slots-hint { margin: 0; color: #666; text-align: center; font-size: 0.9rem; }
  .no-slots { margin: 0; color: #e74c3c; text-align: center; font-size: 0.9rem; line-height: 1.5; }
  .slots-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(70px, 1fr)); gap: 8px; }
  .time-slot-btn { padding: 10px 8px; border: 2px solid #ddd; border-radius: 10px; background: white; font-size: 0.9rem; cursor: pointer; transition: all 0.2s; }
  .time-slot-btn:hover { border-color: #e84393; background: #fce4ec; }
  .time-slot-btn.selected { border-color: #e84393; background: #e84393; color: white; }
  .time-slot-btn.booked { background: #f0f0f0; color: #999; cursor: not-allowed; text-decoration: line-through; }
  
  /* Booking Summary */
  .booking-summary { background: linear-gradient(135deg, #f8f9fa, #fff); padding: 20px; border-radius: 16px; border: 2px solid #e84393; }
  .booking-summary.hidden { display: none; }
  .booking-summary h3 { margin: 0 0 16px; color: #e84393; }
  .summary-content { margin-bottom: 20px; }
  .summary-content p { margin: 8px 0; display: flex; gap: 8px; }
  .summary-content strong { min-width: 100px; color: #666; }
  .booking-confirm-btn { width: 100%; padding: 16px; font-size: 1.1rem; }
  .booking-confirm-btn:disabled { opacity: 0.7; cursor: wait; }
  
  /* ===== Enhanced Google Maps Embed ===== */
  .google-maps-embed { position: relative; margin-bottom: 16px; border-radius: 12px; overflow: hidden; }
  .google-maps-embed iframe { display: block; width: 100%; border-radius: 12px; }
  .google-maps-overlay-link { position: absolute; bottom: 10px; right: 10px; background: rgba(255,255,255,0.95); color: #4285f4; padding: 8px 14px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 0.85rem; display: flex; align-items: center; gap: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.2); transition: transform 0.2s, box-shadow 0.2s; }
  .google-maps-overlay-link:hover { transform: scale(1.05); box-shadow: 0 4px 12px rgba(0,0,0,0.3); }
  .overlay-icon { font-size: 1.2rem; }
  .google-maps-actions { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 12px; }
  .google-link.directions { background: #34a853; color: white; }
  .google-link.directions:hover { background: #2d9248; }
  
  /* ===== Enhanced Specialist Cards ===== */
  .specialist-card-enhanced { background: white; border: 2px solid #eee; border-radius: 20px; padding: 20px; margin-bottom: 16px; transition: all 0.3s ease; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
  .specialist-card-enhanced:hover { border-color: #e84393; box-shadow: 0 8px 24px rgba(232, 67, 147, 0.15); }
  .specialist-header { display: flex; gap: 16px; align-items: flex-start; margin-bottom: 16px; }
  .specialist-header img { width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 3px solid #e84393; box-shadow: 0 4px 12px rgba(232, 67, 147, 0.2); flex-shrink: 0; }
  .specialist-main-info { flex: 1; }
  .specialist-main-info h5 { margin: 0 0 4px; font-size: 1.15rem; color: #333; }
  .specialist-main-info .specialist-position { color: #e84393; font-weight: 600; font-size: 0.9rem; margin: 0 0 8px; }
  .specialist-main-info .specialist-rating { display: flex; align-items: center; gap: 8px; font-size: 0.9rem; }
  .specialist-main-info .specialist-rating .stars { color: #f39c12; font-weight: 600; }
  .specialist-main-info .specialist-rating .review-count { color: #666; }
  .specialist-bio { color: #666; font-size: 0.9rem; line-height: 1.5; margin: 0 0 16px; padding: 12px; background: #f8f9fa; border-radius: 12px; }
  
  /* Specialist Services List */
  .specialist-services-detailed { margin-bottom: 16px; }
  .specialist-services-detailed h6 { margin: 0 0 12px; font-size: 0.95rem; color: #333; display: flex; align-items: center; gap: 8px; }
  .services-price-list { display: flex; flex-direction: column; gap: 8px; }
  .service-price-item { display: flex; justify-content: space-between; align-items: center; padding: 12px 14px; background: #f8f9fa; border-radius: 12px; transition: background 0.2s; }
  .service-price-item:hover { background: #fce4ec; }
  .service-left { display: flex; align-items: center; gap: 10px; }
  .service-left .service-icon { font-size: 1.3rem; }
  .service-details { display: flex; flex-direction: column; }
  .service-name { font-weight: 600; font-size: 0.9rem; color: #333; }
  .service-duration { font-size: 0.8rem; color: #888; }
  .service-right { display: flex; flex-direction: column; align-items: flex-end; }
  .service-bp-price { font-weight: 700; font-size: 1rem; color: #e84393; }
  .service-gel-price { font-size: 0.8rem; color: #666; }
  
  /* Specialist Action Buttons */
  .specialist-actions { display: flex; gap: 10px; flex-wrap: wrap; }
  .btn-book-specialist { flex: 1; min-width: 140px; padding: 12px 16px; font-size: 0.9rem; }
  .btn-review-specialist { flex: 1; min-width: 140px; padding: 12px 16px; font-size: 0.9rem; }
  
  /* ===== Modern Salon Reviews Box ===== */
  .salon-reviews-box { background: linear-gradient(135deg, #fff9fc, #fff); border: 2px solid #fce4ec; border-radius: 20px; padding: 20px; margin-bottom: 20px; }
  .reviews-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 12px; }
  .reviews-title { display: flex; align-items: center; gap: 10px; }
  .reviews-title .reviews-icon { font-size: 1.5rem; }
  .reviews-title h4 { margin: 0; font-size: 1.1rem; color: #333; }
  .reviews-stats { display: flex; align-items: center; gap: 8px; background: #e84393; padding: 8px 16px; border-radius: 20px; }
  .reviews-stats .avg-rating { font-size: 1.3rem; font-weight: 700; color: white; }
  .reviews-stats .reviews-count { color: rgba(255,255,255,0.9); font-size: 0.85rem; }
  
  .reviews-list-modern { display: flex; flex-direction: column; gap: 12px; }
  .review-card { background: white; border: 1px solid #eee; border-radius: 16px; padding: 16px; transition: all 0.2s; }
  .review-card:hover { border-color: #e84393; box-shadow: 0 4px 12px rgba(232, 67, 147, 0.1); }
  .review-top { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
  .reviewer-avatar { width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, #e84393, #a29bfe); color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1rem; flex-shrink: 0; }
  .reviewer-info { flex: 1; }
  .reviewer-name { display: block; font-weight: 600; color: #333; font-size: 0.95rem; }
  .review-date { display: block; font-size: 0.8rem; color: #999; }
  .review-stars { color: #f39c12; font-size: 0.9rem; letter-spacing: 2px; }
  .review-comment { margin: 0; color: #555; font-size: 0.9rem; line-height: 1.5; padding: 10px 12px; background: #f8f9fa; border-radius: 10px; }
  
  .no-reviews-modern { text-align: center; padding: 30px 20px; }
  .no-reviews-icon { font-size: 3rem; display: block; margin-bottom: 12px; opacity: 0.5; }
  .no-reviews-modern p { margin: 0 0 4px; color: #666; font-weight: 500; }
  .no-reviews-modern small { color: #999; }
  
  /* ===== Add Review Box ===== */
  .add-review-box { background: linear-gradient(135deg, #f8f9fa, #fff); border: 2px solid #eee; border-radius: 20px; padding: 20px; margin-bottom: 20px; }
  .add-review-header { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
  .add-review-header .add-icon { font-size: 1.3rem; }
  .add-review-header h4 { margin: 0; font-size: 1rem; color: #333; }
  .review-form-modern { display: flex; flex-direction: column; gap: 16px; }
  .rating-selector { display: flex; align-items: center; gap: 12px; }
  .rating-label { font-size: 0.9rem; color: #666; }
  .star-rating-modern { display: flex; gap: 4px; }
  .star-rating-modern .star { font-size: 1.8rem; color: #ddd; cursor: pointer; transition: all 0.2s; }
  .star-rating-modern .star:hover, .star-rating-modern .star.selected { color: #f39c12; transform: scale(1.1); }
  .review-form-modern textarea { width: 100%; min-height: 80px; padding: 14px; border: 2px solid #eee; border-radius: 14px; font-size: 0.95rem; resize: vertical; font-family: inherit; box-sizing: border-box; transition: border-color 0.2s; }
  .review-form-modern textarea:focus { outline: none; border-color: #e84393; }
  .btn-submit-review { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 14px 24px; font-size: 1rem; }
  
  .login-prompt-box { text-align: center; padding: 24px; background: #f8f9fa; border-radius: 16px; margin-bottom: 20px; }
  .login-prompt-box .lock-icon { font-size: 2rem; display: block; margin-bottom: 12px; }
  .login-prompt-box p { margin: 0 0 16px; color: #666; }
  
  /* ===== Enhanced Google Maps ===== */
  .google-maps-info { margin-bottom: 20px; background: #f8f9fa; border-radius: 16px; padding: 16px; }
  .google-maps-info h4 { margin: 0 0 12px; display: flex; align-items: center; gap: 8px; font-size: 1rem; color: #333; }
  
  /* Specialist Review Modal - z-index 99999 to be on top */
  .specialist-review-modal { display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 99999; align-items: center; justify-content: center; }
  .specialist-review-overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.7); backdrop-filter: blur(4px); z-index: 99999; }
  .specialist-review-content { position: relative; background: white; border-radius: 24px; max-width: 450px; width: 95%; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3); animation: modalSlideIn 0.3s ease-out; z-index: 100000; }
  .specialist-review-close { position: absolute; top: 12px; right: 12px; width: 32px; height: 32px; border-radius: 50%; border: none; background: rgba(255,255,255,0.9); font-size: 1.3rem; cursor: pointer; z-index: 100001; display: flex; align-items: center; justify-content: center; }
  .specialist-review-header { background: linear-gradient(135deg, #e84393, #a29bfe); padding: 20px; color: white; border-radius: 24px 24px 0 0; }
  .specialist-review-header h3 { margin: 0 0 4px; }
  .specialist-review-header p { margin: 0; opacity: 0.9; font-size: 0.95rem; }
  .specialist-review-body { padding: 24px; }
  .specialist-review-body .rating-input { margin-bottom: 16px; }
  .specialist-review-body textarea { width: 100%; min-height: 100px; padding: 12px 16px; border: 2px solid #eee; border-radius: 12px; font-size: 0.95rem; resize: vertical; font-family: inherit; margin-bottom: 16px; box-sizing: border-box; }
  .specialist-review-body textarea:focus { outline: none; border-color: #e84393; }
  .specialist-review-body .btn { width: 100%; }
  
  /* ===== Salon Selection Modal ===== */
  .salon-select-search { margin-bottom: 16px; }
  .salon-select-search input { width: 100%; padding: 14px 18px; border: 2px solid #eee; border-radius: 14px; font-size: 1rem; background: #f8f9fa; transition: all 0.2s; box-sizing: border-box; }
  .salon-select-search input:focus { outline: none; border-color: #e84393; background: white; }
  .salon-select-list { display: flex; flex-direction: column; gap: 12px; max-height: 400px; overflow-y: auto; }
  .salon-select-item { display: flex; align-items: center; gap: 14px; padding: 14px; border: 2px solid #eee; border-radius: 16px; cursor: pointer; transition: all 0.2s; background: white; }
  .salon-select-item:hover { border-color: #e84393; background: #fce4ec; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(232, 67, 147, 0.15); }
  .salon-select-image { width: 60px; height: 60px; border-radius: 12px; overflow: hidden; flex-shrink: 0; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #fce4ec, #f3e5f5); font-size: 1.8rem; }
  .salon-select-image img { width: 100%; height: 100%; object-fit: cover; }
  .salon-select-info { flex: 1; }
  .salon-select-info h4 { margin: 0 0 4px; font-size: 1rem; color: #333; }
  .salon-select-info p { margin: 0 0 6px; font-size: 0.85rem; color: #666; }
  .salon-select-rating { display: flex; align-items: center; gap: 6px; font-size: 0.85rem; }
  .salon-select-rating span:first-child { color: #f39c12; font-weight: 600; }
  .salon-select-rating .reviews-count { color: #999; }
  .salon-select-arrow { font-size: 1.3rem; color: #e84393; font-weight: 600; }
`;
document.head.appendChild(mapStyles);

window.TbilisiMap = TbilisiMap;

// Initialize map when DOM is ready
function initMapWhenReady() {
  const mapContainer = document.getElementById('tbilisiMap');
  if (mapContainer) {
    console.log('🗺️ Initializing Tbilisi Map...');
    TbilisiMap.init('tbilisiMap');
  } else {
    console.log('⏳ Map container not found, waiting...');
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMapWhenReady);
} else {
  // DOM already loaded
  setTimeout(initMapWhenReady, 500);
}
