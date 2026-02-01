// Beauty Pass Admin Dashboard - Professional Version
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:3000'
  : 'https://beauty-pass-api.onrender.com';

const ADMIN_CREDENTIALS = {
    username: 'admin',
    password: 'beauty2025'
};

let currentData = {
    salons: [],
    services: [],
    bookings: [],
    customers: []
};

let charts = {};

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    checkAuth();
});

function setupEventListeners() {
    // Login form
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    
    // Salon form
    document.getElementById('salonForm').addEventListener('submit', handleAddSalon);
    
    // Service form
    document.getElementById('serviceForm').addEventListener('submit', handleAddService);
    
    // Navigation
    document.querySelectorAll('.menu-link').forEach(link => {
        link.addEventListener('click', handleNavigation);
    });
}

function checkAuth() {
    if (localStorage.getItem('adminLoggedIn') === 'true') {
        showDashboard();
    }
}

// Authentication
async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorEl = document.getElementById('loginError');

    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
        localStorage.setItem('adminLoggedIn', 'true');
        showDashboard();
    } else {
        errorEl.textContent = 'Invalid username or password';
        errorEl.style.display = 'block';
    }
}

function logout() {
    localStorage.removeItem('adminLoggedIn');
    location.reload();
}

function showDashboard() {
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    loadAllData();
}

// Navigation
function handleNavigation(e) {
    e.preventDefault();
    const page = e.currentTarget.dataset.page;
    
    // Update active menu
    document.querySelectorAll('.menu-link').forEach(link => {
        link.classList.remove('active');
    });
    e.currentTarget.classList.add('active');
    
    // Update page title
    const titles = {
        overview: 'Dashboard Overview',
        salons: 'Salon Management',
        services: 'Service Management',
        bookings: 'Booking Management',
        customers: 'Customer Management',
        analytics: 'Analytics & Reports',
        settings: 'System Settings'
    };
    document.getElementById('pageTitle').textContent = titles[page];
    
    // Show page
    document.querySelectorAll('.page-content').forEach(content => {
        content.classList.add('hide');
    });
    document.getElementById(page + 'Page').classList.remove('hide');
    
    // Load page data
    loadPageData(page);
}

// Data Loading
async function loadAllData() {
    try {
        await Promise.all([
            loadSalons(),
            loadServices(),
            loadBookings()
        ]);
        
        updateStats();
        createCharts();
        loadRecentBookings();
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

async function loadSalons() {
    try {
        const response = await fetch(`${API_URL}/api/salons`);
        currentData.salons = await response.json();
        renderSalonsTable();
        updateSalonDropdown();
    } catch (error) {
        console.error('Error loading salons:', error);
    }
}

async function loadServices() {
    try {
        const response = await fetch(`${API_URL}/api/admin/services`);
        if (response.ok) {
            currentData.services = await response.json();
            renderServicesTable();
        }
    } catch (error) {
        console.error('Error loading services:', error);
    }
}

async function loadBookings() {
    try {
        const response = await fetch(`${API_URL}/api/admin/bookings`);
        if (response.ok) {
            currentData.bookings = await response.json();
            renderBookingsTable();
            processCustomerData();
        }
    } catch (error) {
        console.error('Error loading bookings:', error);
    }
}

function loadPageData(page) {
    switch(page) {
        case 'overview':
            updateStats();
            loadRecentBookings();
            break;
        case 'analytics':
            createAnalyticsCharts();
            break;
        case 'customers':
            renderCustomersTable();
            break;
    }
}

// Stats Update
function updateStats() {
    document.getElementById('totalSalons').textContent = currentData.salons.length;
    document.getElementById('totalBookings').textContent = currentData.bookings.length;
    document.getElementById('totalServices').textContent = currentData.services.length;
    
    // Calculate revenue
    let totalRevenue = 0;
    currentData.bookings.forEach(booking => {
        const service = currentData.services.find(s => s.id === booking.service_id);
        if (service) {
            totalRevenue += service.price;
        }
    });
    document.getElementById('totalRevenue').textContent = '₾' + totalRevenue.toLocaleString();
}

// Table Rendering
function renderSalonsTable() {
    const tbody = document.getElementById('salonsTable');
    if (!currentData.salons.length) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color: var(--gray);">No salons found</td></tr>';
        return;
    }
    
    tbody.innerHTML = currentData.salons.map(salon => `
        <tr>
            <td>${salon.id}</td>
            <td><strong>${salon.name}</strong></td>
            <td>${salon.address}</td>
            <td>${salon.phone}</td>
            <td>${salon.email}</td>
            <td><span class="badge badge-warning">${salon.rating} ⭐</span></td>
            <td>
                <div class="action-buttons">
                    <button class="btn-icon btn-edit" onclick="editSalon(${salon.id})" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-delete" onclick="deleteSalon(${salon.id})" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function renderServicesTable() {
    const tbody = document.getElementById('servicesTable');
    if (!currentData.services.length) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color: var(--gray);">No services found</td></tr>';
        return;
    }
    
    tbody.innerHTML = currentData.services.map(service => `
        <tr>
            <td>${service.id}</td>
            <td>${service.salon_name || 'N/A'}</td>
            <td><strong>${service.name}</strong></td>
            <td><span class="badge badge-success">₾${service.price}</span></td>
            <td>${service.duration} min</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-icon btn-edit" onclick="editService(${service.id})" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-delete" onclick="deleteService(${service.id})" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function renderBookingsTable() {
    const tbody = document.getElementById('bookingsTable');
    if (!currentData.bookings.length) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; color: var(--gray);">No bookings found</td></tr>';
        return;
    }
    
    tbody.innerHTML = currentData.bookings.map(booking => {
        const statusClass = {
            'pending': 'badge-warning',
            'confirmed': 'badge-info',
            'completed': 'badge-success',
            'cancelled': 'badge-danger'
        }[booking.status] || 'badge-info';
        
        return `
        <tr>
            <td>${booking.id}</td>
            <td><strong>${booking.customer_name}</strong></td>
            <td>${booking.customer_phone}</td>
            <td>${booking.salon_name}</td>
            <td>${booking.service_name}</td>
            <td>${new Date(booking.booking_date).toLocaleDateString()}</td>
            <td>${booking.booking_time}</td>
            <td><span class="badge ${statusClass}">${booking.status}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="btn-icon btn-delete" onclick="deleteBooking(${booking.id})" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
        `;
    }).join('');
}

function loadRecentBookings() {
    const tbody = document.getElementById('recentBookingsTable');
    const recent = currentData.bookings.slice(0, 5);
    
    if (!recent.length) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color: var(--gray);">No bookings yet</td></tr>';
        return;
    }
    
    tbody.innerHTML = recent.map(booking => {
        const service = currentData.services.find(s => s.id === booking.service_id) || {};
        const statusClass = {
            'pending': 'badge-warning',
            'confirmed': 'badge-info',
            'completed': 'badge-success',
            'cancelled': 'badge-danger'
        }[booking.status] || 'badge-info';
        
        return `
        <tr>
            <td>#${booking.id}</td>
            <td>${booking.customer_name}</td>
            <td>${booking.salon_name}</td>
            <td>${booking.service_name}</td>
            <td>${new Date(booking.booking_date).toLocaleDateString()}</td>
            <td><span class="badge ${statusClass}">${booking.status}</span></td>
            <td><strong>₾${service.price || 0}</strong></td>
        </tr>
        `;
    }).join('');
}

function processCustomerData() {
    const customersMap = {};
    
    currentData.bookings.forEach(booking => {
        const email = booking.customer_email;
        if (!customersMap[email]) {
            customersMap[email] = {
                name: booking.customer_name,
                email: booking.customer_email,
                phone: booking.customer_phone,
                bookings: 0,
                totalSpent: 0,
                lastVisit: booking.booking_date
            };
        }
        
        customersMap[email].bookings++;
        const service = currentData.services.find(s => s.id === booking.service_id);
        if (service) {
            customersMap[email].totalSpent += service.price;
        }
        
        if (new Date(booking.booking_date) > new Date(customersMap[email].lastVisit)) {
            customersMap[email].lastVisit = booking.booking_date;
        }
    });
    
    currentData.customers = Object.values(customersMap);
}

function renderCustomersTable() {
    const tbody = document.getElementById('customersTable');
    if (!currentData.customers.length) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color: var(--gray);">No customers found</td></tr>';
        return;
    }
    
    tbody.innerHTML = currentData.customers.map(customer => `
        <tr>
            <td><strong>${customer.name}</strong></td>
            <td>${customer.email}</td>
            <td>${customer.phone}</td>
            <td><span class="badge badge-info">${customer.bookings}</span></td>
            <td><span class="badge badge-success">₾${customer.totalSpent}</span></td>
            <td>${new Date(customer.lastVisit).toLocaleDateString()}</td>
        </tr>
    `).join('');
}

// Charts
function createCharts() {
    createBookingsChart();
    createRevenueChart();
}

function createBookingsChart() {
    const ctx = document.getElementById('bookingsChart');
    if (!ctx) return;
    
    if (charts.bookingsChart) {
        charts.bookingsChart.destroy();
    }
    
    // Last 7 days data
    const last7Days = [];
    const bookingCounts = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        last7Days.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        
        const count = currentData.bookings.filter(b => {
            const bookingDate = new Date(b.booking_date);
            return bookingDate.toDateString() === date.toDateString();
        }).length;
        bookingCounts.push(count);
    }
    
    charts.bookingsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: last7Days,
            datasets: [{
                label: 'Bookings',
                data: bookingCounts,
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

function createRevenueChart() {
    const ctx = document.getElementById('revenueChart');
    if (!ctx) return;
    
    if (charts.revenueChart) {
        charts.revenueChart.destroy();
    }
    
    const revenueByDalon = {};
    currentData.bookings.forEach(booking => {
        const salonName = booking.salon_name;
        const service = currentData.services.find(s => s.id === booking.service_id);
        
        if (!revenueByDalon[salonName]) {
            revenueByDalon[salonName] = 0;
        }
        if (service) {
            revenueByDalon[salonName] += service.price;
        }
    });
    
    charts.revenueChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(revenueByDalon),
            datasets: [{
                data: Object.values(revenueByDalon),
                backgroundColor: [
                    '#667eea',
                    '#764ba2',
                    '#f093fb',
                    '#4facfe',
                    '#43e97b'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function createAnalyticsCharts() {
    createMonthlyRevenueChart();
    createServicesChart();
    createStatusChart();
}

function createMonthlyRevenueChart() {
    const ctx = document.getElementById('monthlyRevenueChart');
    if (!ctx) return;
    
    if (charts.monthlyRevenueChart) {
        charts.monthlyRevenueChart.destroy();
    }
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const revenue = new Array(12).fill(0);
    
    currentData.bookings.forEach(booking => {
        const month = new Date(booking.booking_date).getMonth();
        const service = currentData.services.find(s => s.id === booking.service_id);
        if (service) {
            revenue[month] += service.price;
        }
    });
    
    charts.monthlyRevenueChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: months,
            datasets: [{
                label: 'Revenue (₾)',
                data: revenue,
                backgroundColor: 'rgba(102, 126, 234, 0.8)',
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function createServicesChart() {
    const ctx = document.getElementById('servicesChart');
    if (!ctx) return;
    
    if (charts.servicesChart) {
        charts.servicesChart.destroy();
    }
    
    const serviceCounts = {};
    currentData.bookings.forEach(booking => {
        const serviceName = booking.service_name;
        serviceCounts[serviceName] = (serviceCounts[serviceName] || 0) + 1;
    });
    
    const sortedServices = Object.entries(serviceCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
    
    charts.servicesChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sortedServices.map(s => s[0]),
            datasets: [{
                label: 'Bookings',
                data: sortedServices.map(s => s[1]),
                backgroundColor: '#10b981',
                borderRadius: 8
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: true
        }
    });
}

function createStatusChart() {
    const ctx = document.getElementById('statusChart');
    if (!ctx) return;
    
    if (charts.statusChart) {
        charts.statusChart.destroy();
    }
    
    const statusCounts = {
        pending: 0,
        confirmed: 0,
        completed: 0,
        cancelled: 0
    };
    
    currentData.bookings.forEach(booking => {
        statusCounts[booking.status] = (statusCounts[booking.status] || 0) + 1;
    });
    
    charts.statusChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Pending', 'Confirmed', 'Completed', 'Cancelled'],
            datasets: [{
                data: Object.values(statusCounts),
                backgroundColor: ['#f59e0b', '#3b82f6', '#10b981', '#ef4444']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// Modal Functions
function openSalonModal() {
    document.getElementById('salonModal').classList.add('active');
}

function closeSalonModal() {
    document.getElementById('salonModal').classList.remove('active');
    document.getElementById('salonForm').reset();
}

function openServiceModal() {
    document.getElementById('serviceModal').classList.add('active');
}

function closeServiceModal() {
    document.getElementById('serviceModal').classList.remove('active');
    document.getElementById('serviceForm').reset();
}

function updateSalonDropdown() {
    const select = document.getElementById('serviceSalonId');
    select.innerHTML = '<option value="">Choose a salon...</option>' +
        currentData.salons.map(salon => 
            `<option value="${salon.id}">${salon.name}</option>`
        ).join('');
}

// CRUD Operations
async function handleAddSalon(e) {
    e.preventDefault();
    
    const salonData = {
        name: document.getElementById('salonName').value,
        address: document.getElementById('salonAddress').value,
        phone: document.getElementById('salonPhone').value,
        email: document.getElementById('salonEmail').value,
        rating: parseFloat(document.getElementById('salonRating').value),
        image_url: document.getElementById('salonImage').value || 'https://via.placeholder.com/800'
    };
    
    try {
        const response = await fetch(`${API_URL}/api/admin/salons`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(salonData)
        });
        
        if (response.ok) {
            closeSalonModal();
            await loadSalons();
            updateStats();
            showNotification('Salon added successfully!', 'success');
        } else {
            showNotification('Error adding salon', 'error');
        }
    } catch (error) {
        showNotification('Connection error', 'error');
    }
}

async function handleAddService(e) {
    e.preventDefault();
    
    const serviceData = {
        salon_id: parseInt(document.getElementById('serviceSalonId').value),
        name: document.getElementById('serviceName').value,
        price: parseInt(document.getElementById('servicePrice').value),
        duration: parseInt(document.getElementById('serviceDuration').value),
        description: document.getElementById('serviceDescription').value
    };
    
    try {
        const response = await fetch(`${API_URL}/api/admin/services`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(serviceData)
        });
        
        if (response.ok) {
            closeServiceModal();
            await loadServices();
            updateStats();
            showNotification('Service added successfully!', 'success');
        } else {
            showNotification('Error adding service', 'error');
        }
    } catch (error) {
        showNotification('Connection error', 'error');
    }
}

async function deleteSalon(id) {
    if (!confirm('Are you sure you want to delete this salon?')) return;
    
    try {
        const response = await fetch(`${API_URL}/api/admin/salons/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            await loadSalons();
            updateStats();
            showNotification('Salon deleted!', 'success');
        } else {
            showNotification('Error deleting salon', 'error');
        }
    } catch (error) {
        showNotification('Connection error', 'error');
    }
}

async function deleteService(id) {
    if (!confirm('Are you sure you want to delete this service?')) return;
    
    try {
        const response = await fetch(`${API_URL}/api/admin/services/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            await loadServices();
            updateStats();
            showNotification('Service deleted!', 'success');
        } else {
            showNotification('Error deleting service', 'error');
        }
    } catch (error) {
        showNotification('Connection error', 'error');
    }
}

async function deleteBooking(id) {
    if (!confirm('Are you sure you want to delete this booking?')) return;
    
    try {
        const response = await fetch(`${API_URL}/api/admin/bookings/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            await loadBookings();
            updateStats();
            showNotification('Booking deleted!', 'success');
        } else {
            showNotification('Error deleting booking', 'error');
        }
    } catch (error) {
        showNotification('Connection error', 'error');
    }
}

function filterBookings(status) {
    const filtered = status === 'all' 
        ? currentData.bookings 
        : currentData.bookings.filter(b => b.status === status);
    
    const tbody = document.getElementById('bookingsTable');
    if (!filtered.length) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; color: var(--gray);">No bookings found</td></tr>';
        return;
    }
    
    tbody.innerHTML = filtered.map(booking => {
        const statusClass = {
            'pending': 'badge-warning',
            'confirmed': 'badge-info',
            'completed': 'badge-success',
            'cancelled': 'badge-danger'
        }[booking.status] || 'badge-info';
        
        return `
        <tr>
            <td>${booking.id}</td>
            <td><strong>${booking.customer_name}</strong></td>
            <td>${booking.customer_phone}</td>
            <td>${booking.salon_name}</td>
            <td>${booking.service_name}</td>
            <td>${new Date(booking.booking_date).toLocaleDateString()}</td>
            <td>${booking.booking_time}</td>
            <td><span class="badge ${statusClass}">${booking.status}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="btn-icon btn-delete" onclick="deleteBooking(${booking.id})" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
        `;
    }).join('');
}

// Utility Functions
function showNotification(message, type) {
    // Simple console notification for now
    console.log(`[${type}] ${message}`);
    
    // You can implement toast notifications here
    alert(message);
}

function editSalon(id) {
    console.log('Edit salon:', id);
    // Implement edit functionality
}

function editService(id) {
    console.log('Edit service:', id);
    // Implement edit functionality
}
