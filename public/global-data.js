// Global Data - defines global variables needed by other scripts
let SALONS = [];
let SERVICES = [];
let PACKAGES = [];
let SPECIALISTS = [];

// Global state object (used by salon-chat-functions.js and others)
let state = {
    user: null,
    isLoggedIn: false,
    currentPage: 'home'
};

// Admin data placeholder
let adminData = {
    email: null,
    isLoggedIn: false
};

// Utility function to escape HTML
function escapeHtml(text) {
    if (!text) return '';
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Toast notification function
function showToast(message, type) {
    type = type || 'info';
    var container = document.getElementById('toastContainer');
    if (!container) {
        console.log('[Toast]', type, message);
        return;
    }
    var toast = document.createElement('div');
    toast.className = 'toast toast-' + type;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(function() {
        toast.remove();
    }, 3000);
}

// Load global data from API
async function loadGlobalData() {
    try {
        console.log('Loading global data from API...');

        // Load salons
        if (typeof fetchSalons === 'function') {
            SALONS = await fetchSalons() || [];
            console.log('Loaded', SALONS.length, 'salons');
        }

        // Load services
        if (typeof fetchServices === 'function') {
            SERVICES = await fetchServices() || [];
            console.log('Loaded', SERVICES.length, 'services');
        }

        // Load packages
        if (typeof fetchPackages === 'function') {
            PACKAGES = await fetchPackages() || [];
            console.log('Loaded', PACKAGES.length, 'packages');
        }

        console.log('Global data loaded successfully');
    } catch (e) {
        console.error('Error loading global data:', e);
    }
}

// Auto-load global data when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Small delay to ensure api-client.js is loaded
    setTimeout(loadGlobalData, 100);
});

console.log('global-data.js loaded');
