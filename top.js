var playData = [];
var allSessions = 0;
var winSessions = 0;

var loggedIn = false;

/**
 * Create dashboard
 */
function showDashboard() {
  if (document.getElementById('zrr-dashboard') != null) {
    return;
  }
  var div = document.createElement("div");
  div.id = 'zrr-dashboard';
  div.style.zIndex = 9999;
  div.style.position = 'absolute';
  div.style.left = '0';
  div.style.top = '0';
  div.style.height = '100%';
  div.style.width = '280px';
  div.style.backgroundColor = 'black';
  div.style.fontFamily = "Arial";
  div.style.fontSize = '18px';
  document.body.appendChild(div);

  var html = `
    <div style='padding: 8px;' id='zrr-login-container'>
      <div style='padding: 8px; text-align: center; color: yellow'>Zen Roulette Login</div>
      <div id='zrr-login-error'></div>
      <div style='padding: 8px; text-align: center;'>Email:</div>
      <div><input type="text" id="zrr-email" style='width: 100%; font-size: 16px; padding: 4px;' /></div>
      <div style='text-align: center; padding: 8px;'>Password:</div>
      <div><input type="password" id="zrr-password" style='width: 100%; font-size: 16px; padding: 4px;' /></div>
      <div style='text-align: center; padding: 16px;'>
        <button id="zrr-login-btn" style='font-size: 16px; padding: 4px;'>Login</button>
        <button id="zrr-signup-btn" style='font-size: 16px; padding: 4px;'>Sign Up</button>
      </div>
    </div>
  `;

  div.innerHTML = html;

  document.getElementById('zrr-login-btn').onclick = loginZRR;
  document.getElementById('zrr-signup-btn').onclick = signupZRR;
}

/**
 * Log in to Zen Roulette
 */
async function loginZRR() {
  let email = document.getElementById('zrr-email').value;
  let password = document.getElementById('zrr-password').value;

  try {
    let response = await chrome.runtime.sendMessage({
      type: "api",
      data: { action: "auth", email: email, password: password }
    });

    if (response.success) {
      loggedIn = true;
      console.log("Login successful:", response);
      document.getElementById('zrr-login-error').innerHTML = "";
    } else {
      throw new Error(response.msg || "Login failed");
    }
  } catch (error) {
    document.getElementById('zrr-login-error').innerHTML = `
      <div style='padding: 8px; color: orangered; text-align: center;'>${error.message}</div>
    `;
    console.error("Login error:", error);
  }
}

/**
 * Redirect to sign-up page
 */
function signupZRR() {
  window.open('https://www.zenroulette.com/zen-roulette-assistant/', '_blank');
}

/**
 * Toggle dashboard visibility
 */
function toggleDashboard() {
  let dashboard = document.getElementById('zrr-dashboard');
  if (dashboard) {
    dashboard.style.display = dashboard.style.display === 'none' ? '' : 'none';
  } else {
    showDashboard();
  }
}

/**
 * Handle incoming messages
 */
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log("Message received in top.js:", msg);

  if (msg.type === "update-dashboard") {
    showDashboard();
    // Update dashboard logic here (placeholder for simplicity)
    console.log("Updating dashboard with:", msg);
  } else if (msg.type === "logout") {
    loggedIn = false;
    console.log("Logged out.");
    // Reset UI or state here
  } else if (msg.type === "toggle") {
    toggleDashboard();
  }

  sendResponse({ success: true }); // Always acknowledge the message
});

/**
 * Initialize the content script
 */
document.addEventListener("DOMContentLoaded", () => {
  console.log("Zen Roulette script loaded.");
  showDashboard();
});
