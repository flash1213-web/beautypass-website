// ===== Mock API for Testing (when backend is not available) =====

'use strict';

console.log('🎭 Mock API loading...');

// Mock user data for testing
const MOCK_USER = {
  id: 'demo-client-001',
  email: 'ana@demo.tld',
  name: 'ანა ბერიძე',
  phone: '+995555123456',
  balance_gel: 150,
  active_bp: 0,
  clientId: 'BP-20251025-DEMO01',
  active: true,
  pwd_hash: 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3' // Demo123!
};

// Check if we should force mock mode (when backend is not accessible)
const FORCE_MOCK_MODE = true; // ВКЛЮЧЕНО - сайт работает с тестовыми данными БЕЗ backend

// Mock auth methods
window.MockAPI = {
  // Login - returns success to proceed to 2FA
  async login({ email, password }) {
    console.log('🎭 Mock login:', email);
    
    // Simple validation
    if (email !== MOCK_USER.email) {
      throw new Error('User not found');
    }
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // In real backend, password check happens here
    // For mock, we just proceed to 2FA
    return {
      success: true,
      message: 'OTP sent to email',
      data: {
        requiresOTP: true,
        email: email
      }
    };
  },

  // Verify OTP - accepts any 6-digit code for testing
  async verifyOTP({ email, code }) {
    console.log('🎭 Mock verifyOTP:', email, code);
    
    // Accept any 6-digit code
    if (!code || code.length !== 6) {
      throw new Error('Invalid OTP format');
    }
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Return user data with token
    return {
      success: true,
      data: {
        token: 'mock-jwt-token-' + Date.now(),
        user: {
          id: MOCK_USER.id,
          email: MOCK_USER.email,
          name: MOCK_USER.name,
          phone: MOCK_USER.phone,
          balance_gel: MOCK_USER.balance_gel,
          active_bp: MOCK_USER.active_bp,
          clientId: MOCK_USER.clientId,
          active: MOCK_USER.active
        }
      }
    };
  },

  // Register - creates new user and sends OTP
  async register({ email, password, name, phone }) {
    console.log('🎭 Mock register:', email, name);
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      success: true,
      message: 'Registration successful. OTP sent to email.',
      data: {
        requiresOTP: true,
        email: email
      }
    };
  },

  // Resend OTP
  async resendOTP({ email }) {
    console.log('🎭 Mock resendOTP:', email);
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      success: true,
      message: 'OTP resent to email'
    };
  },

  // Get current user profile
  async getMe(token) {
    console.log('🎭 Mock getMe');
    
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return {
      success: true,
      data: {
        id: MOCK_USER.id,
        email: MOCK_USER.email,
        name: MOCK_USER.name,
        phone: MOCK_USER.phone,
        balance_gel: MOCK_USER.balance_gel,
        active_bp: MOCK_USER.active_bp,
        clientId: MOCK_USER.clientId,
        active: MOCK_USER.active
      }
    };
  },

  // Get user bookings
  async getBookings(token) {
    console.log('🎭 Mock getBookings');
    
    return {
      success: true,
      data: []
    };
  },

  // Create booking
  async createBooking(token, bookingData) {
    console.log('🎭 Mock createBooking:', bookingData);
    
    return {
      success: true,
      data: {
        id: 'booking-' + Date.now(),
        ...bookingData,
        status: 'confirmed'
      }
    };
  },

  // Get salons
  async getSalons() {
    console.log('🎭 Mock getSalons');
    
    return {
      success: true,
      data: [
        {
          id: 1,
          name: 'Daphne Beauty Studio',
          address: 'თბილისი, ვაკე',
          phone: '+995555111111'
        }
      ]
    };
  },

  // Get services
  async getServices() {
    console.log('🎭 Mock getServices');
    
    return {
      success: true,
      data: [
        {
          id: 1,
          name: 'მანიკური',
          price: 50,
          duration: 60
        }
      ]
    };
  },

  // Get tariffs
  async getTariffs() {
    console.log('🎭 Mock getTariffs');
    
    return {
      success: true,
      data: [
        {
          id: 1,
          name: 'Basic Pass',
          price: 150,
          bp_points: 5,
          validity_days: 30
        }
      ]
    };
  }
};

// Wait for API to be defined, then wrap it
function wrapAPIWithMock() {
  if (!window.API) {
    console.log('⏳ Waiting for API object...');
    setTimeout(wrapAPIWithMock, 50);
    return;
  }

  console.log('🔧 Wrapping API with Mock fallback...');
  
  const originalAPI = window.API;
  
  // Helper to wrap API method with mock fallback
  const wrapMethod = (originalMethod, mockMethod) => {
    return async (...args) => {
      // If force mock mode, use mock directly
      if (FORCE_MOCK_MODE) {
        console.log('🎭 Using mock (forced mode)');
        return await mockMethod(...args);
      }
      
      try {
        // Try real API first
        return await originalMethod(...args);
      } catch (error) {
        console.warn('⚠️ Backend failed, using mock:', error.message);
        // Fall back to mock
        return await mockMethod(...args);
      }
    };
  };

  // Wrap auth methods
  if (originalAPI.auth) {
    window.API.auth = {
      login: wrapMethod(originalAPI.auth.login, MockAPI.login),
      register: wrapMethod(originalAPI.auth.register, MockAPI.register),
      verifyOTP: wrapMethod(originalAPI.auth.verifyOTP, MockAPI.verifyOTP),
      resendOTP: wrapMethod(originalAPI.auth.resendOTP, MockAPI.resendOTP)
    };
  }

  // Wrap users methods
  if (originalAPI.users) {
    const originalGetProfile = originalAPI.users.getProfile;
    window.API.users.getProfile = wrapMethod(originalGetProfile, MockAPI.getMe);
  }

  console.log('✅ Mock API ready - Test credentials: ana@demo.tld / 123456! / Any 6-digit OTP');
  console.log('🎭 Force mock mode:', FORCE_MOCK_MODE ? 'ENABLED' : 'DISABLED');
}

// Start wrapping immediately (API should be loaded by now since mock-api.js is after api-client.js)
wrapAPIWithMock();

