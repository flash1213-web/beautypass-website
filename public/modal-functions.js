// ===== NAVIGATION AND MODAL FUNCTIONS =====

// Navigate to section - scrolls on homepage
window.navigate = function(sectionId) {
    console.log("Navigate called:", sectionId);
    
    // Remove # if present
    if (sectionId.startsWith('#')) {
        sectionId = sectionId.substring(1);
    }
    
    // For home - scroll to top
    if (sectionId === "home") {
        showSection("home");
        window.scrollTo({ top: 0, behavior: "smooth" });
    } 
    // For salons, tariffs, contact - scroll on main page
    else if (sectionId === "salons" || sectionId === "tariffs" || sectionId === "services" || sectionId === "contact") {
        showSection("home");
        setTimeout(function() {
            var el = document.getElementById(sectionId);
            if (!el && sectionId === "salons") {
                el = document.getElementById("salonsGrid") || document.querySelector(".salons-section");
            }
            if (el) {
                el.scrollIntoView({ behavior: "smooth", block: "start" });
            }
        }, 100);
    } 
    // For other sections - show as separate page
    else {
        showSection(sectionId);
        window.scrollTo({ top: 0, behavior: "smooth" });
    }
    
    history.pushState(null, null, "#" + sectionId);
};

// Show section (page)
window.showSection = function(sectionId) {
    console.log("showSection:", sectionId);
    
    document.querySelectorAll(".page-section").forEach(function(s) {
        s.classList.remove("active");
        s.style.display = "none";
    });
    
    var section = document.getElementById(sectionId);
    if (section) {
        section.classList.add("active");
        section.style.display = "block";
    } else {
        var home = document.getElementById("home");
        if (home) {
            home.classList.add("active");
            home.style.display = "block";
        }
    }
};

// Go to About page
window.showAboutModal = function() {
    window.location.href = "about.html";
};

// Test Backend Connection
window.testBackendConnection = async function() {
    var statusEl = document.getElementById('connectionStatus');
    if (statusEl) statusEl.innerHTML = '<span style="color: orange;">Testing...</span>';
    
    try {
        var response = await fetch('/api/status');
        if (response.ok) {
            if (statusEl) statusEl.innerHTML = '<span style="color: green;">✅ Connected</span>';
        } else {
            throw new Error('Server returned ' + response.status);
        }
    } catch (e) {
        console.error('Backend connection failed:', e);
        if (statusEl) statusEl.innerHTML = '<span style="color: red;">❌ Failed</span>';
    }
};

// ===== REGISTRATION / LOGIN FORM SWITCHING =====

// Show Register Form - FIXED with correct IDs
window.showRegisterForm = function() {
    console.log("showRegisterForm called");
    
    // First navigate to client section
    showSection("client");
    window.scrollTo({ top: 0, behavior: "smooth" });
    
    // Then switch to register form with correct IDs
    setTimeout(function() {
        var loginCard = document.getElementById('loginFormCard');
        var registerCard = document.getElementById('registerFormCard');
        var twoFACard = document.getElementById('twoFACard');
        var forgotCard = document.getElementById('forgotPasswordCard');
        var resetCard = document.getElementById('resetPasswordCard');
        var profileCard = document.getElementById('clientProfileCard');
        
        // Hide all cards
        if (loginCard) loginCard.style.display = 'none';
        if (twoFACard) twoFACard.style.display = 'none';
        if (forgotCard) forgotCard.style.display = 'none';
        if (resetCard) resetCard.style.display = 'none';
        if (profileCard) profileCard.style.display = 'none';
        
        // Show register card
        if (registerCard) {
            registerCard.style.display = 'block';
            console.log("Register card shown");
        } else {
            console.error("registerFormCard not found!");
        }
    }, 150);
};

// Show Login Form - FIXED with correct IDs
window.showLoginForm = function() {
    console.log("showLoginForm called");
    
    // Navigate to client section
    showSection("client");
    window.scrollTo({ top: 0, behavior: "smooth" });
    
    setTimeout(function() {
        var loginCard = document.getElementById('loginFormCard');
        var registerCard = document.getElementById('registerFormCard');
        var twoFACard = document.getElementById('twoFACard');
        var forgotCard = document.getElementById('forgotPasswordCard');
        var resetCard = document.getElementById('resetPasswordCard');
        var profileCard = document.getElementById('clientProfileCard');
        
        // Hide all cards
        if (registerCard) registerCard.style.display = 'none';
        if (twoFACard) twoFACard.style.display = 'none';
        if (forgotCard) forgotCard.style.display = 'none';
        if (resetCard) resetCard.style.display = 'none';
        if (profileCard) profileCard.style.display = 'none';
        
        // Show login card
        if (loginCard) {
            loginCard.style.display = 'block';
            console.log("Login card shown");
        }
    }, 150);
};

// Show Forgot Password Form
window.showForgotPasswordForm = function() {
    console.log("showForgotPasswordForm called");
    
    var loginCard = document.getElementById('loginFormCard');
    var forgotCard = document.getElementById('forgotPasswordCard');
    var resetCard = document.getElementById('resetPasswordCard');
    var profileCard = document.getElementById('clientProfile');
    
    if (loginCard) loginCard.style.display = 'none';
    if (resetCard) resetCard.style.display = 'none';
    if (profileCard) profileCard.style.display = 'none';
    
    if (forgotCard) {
        forgotCard.style.display = 'block';
    } else {
        alert("ფუნქცია მალე დაემატება!");
    }
};

// Request Password Reset - Step 1: Send code to email
window.requestPasswordReset = async function() {
    var email = document.getElementById('forgotEmail').value;
    var submitBtn = document.getElementById('forgotSubmitBtn');
    
    if (!email) {
        showToast('შეიყვანეთ ელფოსტა', 'error');
        return;
    }
    
    // Save email for step 2
    window.resetPasswordEmail = email;
    
    // Disable button
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'იგზავნება...';
    }
    
    try {
        var response = await fetch('/api/auth/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email })
        });
        
        var data = await response.json();
        
        if (response.ok) {
            showToast(data.message || 'კოდი გაგზავნილია!', 'success');
            
            // Show reset password form (step 2)
            var forgotCard = document.getElementById('forgotPasswordCard');
            var resetCard = document.getElementById('resetPasswordCard');
            
            if (forgotCard) forgotCard.style.display = 'none';
            if (resetCard) resetCard.style.display = 'block';
        } else {
            showToast(data.message || 'შეცდომა', 'error');
        }
    } catch (error) {
        console.error('Password reset request error:', error);
        showToast('სერვერის შეცდომა', 'error');
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'კოდის გაგზავნა / Send Code';
        }
    }
};

// Complete Password Reset - Step 2: Verify code and set new password
window.completePasswordReset = async function() {
    var code = document.getElementById('resetOtp').value;
    var newPassword = document.getElementById('resetNewPassword').value;
    var submitBtn = document.getElementById('resetSubmitBtn');
    var email = window.resetPasswordEmail;
    
    if (!code || !newPassword) {
        showToast('შეავსეთ ყველა ველი', 'error');
        return;
    }
    
    if (!email) {
        showToast('დაიწყეთ თავიდან', 'error');
        showForgotPasswordForm();
        return;
    }
    
    if (newPassword.length < 8) {
        showToast('პაროლი უნდა იყოს მინიმუმ 8 სიმბოლო', 'error');
        return;
    }
    
    // Check password complexity
    var hasNumber = /\d/.test(newPassword);
    var hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
    if (!hasNumber || !hasSpecial) {
        showToast('პაროლი უნდა შეიცავდეს ციფრს და სპეციალურ სიმბოლოს (!@#$...)', 'error');
        return;
    }
    
    // Disable button
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'მუშავდება...';
    }
    
    try {
        var response = await fetch('/api/auth/reset-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                email: email,
                code: code,
                newPassword: newPassword 
            })
        });
        
        var data = await response.json();
        
        if (response.ok && data.success) {
            showToast(data.message || 'პაროლი წარმატებით შეიცვალა!', 'success');
            
            // Clear saved email
            window.resetPasswordEmail = null;
            
            // Clear form
            document.getElementById('resetOtp').value = '';
            document.getElementById('resetNewPassword').value = '';
            
            // Hide reset card immediately
            var resetCard = document.getElementById('resetPasswordCard');
            if (resetCard) resetCard.style.display = 'none';
            
            // Go back to login
            setTimeout(function() {
                showLoginForm();
            }, 500);
        } else {
            showToast(data.message || 'შეცდომა', 'error');
        }
    } catch (error) {
        console.error('Password reset error:', error);
        showToast('სერვერის შეცდომა', 'error');
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'პაროლის შეცვლა / Reset Password';
        }
    }
};

// Back to Login
window.backToLogin = function() {
    var loginCard = document.getElementById('loginFormCard');
    var registerCard = document.getElementById('registerFormCard');
    var forgotCard = document.getElementById('forgotPasswordCard');
    var resetCard = document.getElementById('resetPasswordCard');
    
    if (registerCard) registerCard.style.display = 'none';
    if (forgotCard) forgotCard.style.display = 'none';
    if (resetCard) resetCard.style.display = 'none';
    if (loginCard) loginCard.style.display = 'block';
};

// Close any modal
window.closeModal = function() {
    document.querySelectorAll('.modal').forEach(function(modal) {
        modal.style.display = 'none';
    });
};

// Show Community Chat
window.showCommunityChat = function() {
    alert("Chat ფუნქცია მალე დაემატება!");
};

// Toggle Profile Dropdown
window.toggleProfileDropdown = function() {
    var dropdown = document.getElementById('profileDropdown');
    if (dropdown) {
        dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
    }
};

// Close About Modal (if modal exists)
window.closeAboutModal = function() {
    var modal = document.getElementById('aboutModal');
    if (modal) modal.style.display = 'none';
};

// Initialize on load
document.addEventListener('DOMContentLoaded', function() {
    var hash = window.location.hash.substring(1);
    if (hash) {
        setTimeout(function() { navigate(hash); }, 300);
    } else {
        showSection('home');
    }
});

console.log("modal-functions.js loaded");
