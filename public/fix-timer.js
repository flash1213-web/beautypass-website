const fs = require('fs');
let c = fs.readFileSync('app.js', 'utf8');

const oldTimer = `function startOTPTimer() {
  let timeLeft = 600;
  const timerEl = document.getElementById("otpTimer");
  if (!timerEl) return;

  if (window.otpInterval) clearInterval(window.otpInterval);

  window.otpInterval = setInterval(() => {
    if (timeLeft <= 0) {
      clearInterval(window.otpInterval);
      timerEl.textContent = "კოდი ვადაგასულია";
      return;
    }
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    timerEl.textContent = \`⏰ დარჩა: \${mins}:\${secs.toString().padStart(2, '0')}\`;
    timeLeft--;
  }, 1000);
}`;

const newTimer = `function startOTPTimer() {
  let timeLeft = 120; // 2 minutes
  let resendUnlockTime = 30; // 30 seconds until resend allowed
  const timerEl = document.getElementById("otpTimer");
  const resendBtn = document.getElementById("resendBtn");
  
  if (!timerEl) return;

  // Disable resend button initially
  if (resendBtn) {
    resendBtn.disabled = true;
    resendBtn.style.opacity = '0.5';
    resendBtn.style.cursor = 'not-allowed';
  }

  if (window.otpInterval) clearInterval(window.otpInterval);
  if (window.resendInterval) clearInterval(window.resendInterval);

  // Resend button unlock timer
  window.resendInterval = setInterval(() => {
    resendUnlockTime--;
    if (resendBtn) {
      if (resendUnlockTime <= 0) {
        resendBtn.disabled = false;
        resendBtn.style.opacity = '1';
        resendBtn.style.cursor = 'pointer';
        resendBtn.textContent = 'კოდის ხელახლა გაგზავნა';
        clearInterval(window.resendInterval);
      } else {
        resendBtn.textContent = \`კოდის ხელახლა გაგზავნა (\${resendUnlockTime}წმ)\`;
      }
    }
  }, 1000);

  // Main countdown timer
  window.otpInterval = setInterval(() => {
    if (timeLeft <= 0) {
      clearInterval(window.otpInterval);
      timerEl.textContent = "⚠️ კოდის ვადა ამოიწურა! გაიარეთ რეგისტრაცია თავიდან.";
      timerEl.style.color = '#e74c3c';
      return;
    }
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    timerEl.textContent = \`⏰ დარჩა: \${mins}:\${secs.toString().padStart(2, '0')}\`;
    timeLeft--;
  }, 1000);
}`;

if (c.includes('let timeLeft = 600;')) {
  c = c.replace(oldTimer, newTimer);
  fs.writeFileSync('app.js', c, 'utf8');
  console.log('Timer updated to 2 minutes with 30sec resend delay!');
} else {
  console.log('Pattern not found');
}
