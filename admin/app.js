// Admin Portal JavaScript
let sessionToken = '';
let apiBaseUrl = 'https://api.daribati.com';
let currentPage = 1;
let currentFilters = {};
let currentUser = null;
let calculatorTimeframe = 30; // Default to 30 days

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  // Load saved session and user
  const savedSession = localStorage.getItem('admin_session_token');
  const savedUser = localStorage.getItem('admin_user');

  if (savedSession) {
    sessionToken = savedSession;
    
    // Restore user from localStorage
    if (savedUser) {
      try {
        currentUser = JSON.parse(savedUser);
      } catch (e) {
        console.error('Error parsing saved user:', e);
      }
    }
    
    // Verify session is still valid
    verifySession();
  }

  setupEventListeners();
});

function setupEventListeners() {
  // Auth - Form submission handles both button click and Enter key
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      handleLogin();
    });
  }

  // Also support button click (for backwards compatibility)
  document.getElementById('loginBtn').addEventListener('click', (e) => {
    e.preventDefault();
    handleLogin();
  });

  // Navbar buttons (in sticky nav)
  document.getElementById('refreshBtnNav').addEventListener('click', refreshCurrentTab);
  document.getElementById('logoutBtnNav').addEventListener('click', handleLogout);

  // Tabs
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // Notifications
  document
    .getElementById('broadcastNotificationForm')
    .addEventListener('submit', handleBroadcastNotification);
  document
    .getElementById('applyNotificationFiltersBtn')
    .addEventListener('click', loadNotificationsList);

  // Feedback
  document
    .getElementById('applyFeedbackFiltersBtn')
    .addEventListener('click', loadFeedbackList);
  document
    .getElementById('updateFeedbackForm')
    .addEventListener('submit', handleUpdateFeedback);
  document
    .getElementById('deleteFeedbackBtn')
    .addEventListener('click', handleDeleteFeedback);
  document
    .getElementById('closeFeedbackModalBtn')
    .addEventListener('click', () => closeFeedbackModal());

  // Services
  document
    .getElementById('addServiceBtn')
    .addEventListener('click', () => openServiceModal());
  document
    .getElementById('serviceForm')
    .addEventListener('submit', handleSaveService);
  document
    .getElementById('cancelServiceBtn')
    .addEventListener('click', closeServiceModal);
  document
    .getElementById('closeServiceModal')
    .addEventListener('click', closeServiceModal);

  // Disclaimers
  document
    .getElementById('addDisclaimerBtn')
    .addEventListener('click', () => openDisclaimerModal());
  document
    .getElementById('disclaimerForm')
    .addEventListener('submit', handleSaveDisclaimer);
  document
    .getElementById('cancelDisclaimerBtn')
    .addEventListener('click', closeDisclaimerModal);
  document
    .querySelector('#disclaimerModal .close')
    .addEventListener('click', closeDisclaimerModal);

  // Admin Users (Super Admin Only)
  document
    .getElementById('addAdminUserBtn')
    .addEventListener('click', () => openAdminUserModal());
  document
    .getElementById('adminUserForm')
    .addEventListener('submit', handleSaveAdminUser);
  document
    .getElementById('cancelAdminUserBtn')
    .addEventListener('click', closeAdminUserModal);
  document
    .getElementById('closeAdminUserModal')
    .addEventListener('click', closeAdminUserModal);

  // Admin Sessions (Super Admin Only)
  document
    .getElementById('sessionsSubTabBtn')
    .addEventListener('click', () => switchSubTab('sessions'));
  document
    .getElementById('historySubTabBtn')
    .addEventListener('click', () => switchSubTab('history'));
  document
    .getElementById('sessionUserFilter')
    .addEventListener('change', loadAdminSessions);
  document
    .getElementById('historyUserFilter')
    .addEventListener('change', loadLoginHistory);
  document
    .getElementById('activeSessionsOnly')
    .addEventListener('change', loadAdminSessions);

  // Announcements
  document
    .getElementById('addAnnouncementBtn')
    .addEventListener('click', showAddAnnouncementModal);
  document
    .getElementById('announcementForm')
    .addEventListener('submit', saveAnnouncement);
  document
    .getElementById('closeAnnouncementModal')
    .addEventListener('click', closeAnnouncementModal);
  document
    .getElementById('cancelAnnouncementBtn')
    .addEventListener('click', closeAnnouncementModal);

  // App Versions
  document
    .getElementById('iosVersionForm')
    .addEventListener('submit', updateIOSVersion);
  document
    .getElementById('androidVersionForm')
    .addEventListener('submit', updateAndroidVersion);

  // Taxi Contributions
  document
    .getElementById('addTaxiContributionBtn')
    .addEventListener('click', showAddTaxiContributionModal);
  document
    .getElementById('taxiContributionForm')
    .addEventListener('submit', handleSaveTaxiContribution);
  document
    .getElementById('closeTaxiContributionModal')
    .addEventListener('click', closeTaxiContributionModal);
  document
    .getElementById('cancelTaxiContributionBtn')
    .addEventListener('click', closeTaxiContributionModal);

  // Add keyboard shortcuts
  setupKeyboardShortcuts();

  // Add sticky navbar scroll effect
  setupStickyNavbar();
}

// Sticky Navbar with Shadow Effect
function setupStickyNavbar() {
  const tabs = document.querySelector('.tabs');
  const mainContent = document.getElementById('mainContent');
  
  if (!tabs || !mainContent) return;

  // Use Intersection Observer for better performance
  const observer = new IntersectionObserver(
    ([entry]) => {
      // When the main content top goes above the viewport, add shadow
      if (entry.boundingClientRect.top < 0) {
        tabs.classList.add('scrolled');
      } else {
        tabs.classList.remove('scrolled');
      }
    },
    {
      threshold: [0],
      rootMargin: '-1px 0px 0px 0px'
    }
  );

  // Observe the main content
  observer.observe(mainContent);

  // Also add scroll listener as fallback
  let ticking = false;
  
  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        // Add shadow when scrolled down more than 10px
        if (scrollTop > 10) {
          tabs.classList.add('scrolled');
        } else {
          tabs.classList.remove('scrolled');
        }
        
        ticking = false;
      });
      
      ticking = true;
    }
  });
}

// Keyboard Shortcuts
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // ESC key - Close all modals
    if (e.key === 'Escape' || e.keyCode === 27) {
      closeServiceModal();
      closeDisclaimerModal();
      closeAdminUserModal();
      closeFeedbackModal();
      closeAlertModal();
    }

    // Ctrl/Cmd + K - Focus search/filter inputs
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      const activeTab = document.querySelector('.tab.active');
      if (activeTab) {
        const searchInput = activeTab.querySelector('input[type="text"], input[type="search"]');
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      }
    }
  });

  // Add Ctrl+S shortcut to save in modals (prevent browser save dialog)
  document.querySelectorAll('.modal form').forEach(form => {
    form.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn && !submitBtn.disabled) {
          submitBtn.click();
        }
      }
    });
  });
}

// Refresh Current Tab
async function refreshCurrentTab() {
  // Add loading state to refresh button
  const refreshBtnNav = document.getElementById('refreshBtnNav');
  
  if (!refreshBtnNav) return;
  
  // Disable button and add loading class
  refreshBtnNav.disabled = true;
  refreshBtnNav.classList.add('loading');
  
  // Clear all cache for fresh data
  cache.clearAll();
  
  // Get active tab
  const activeTabBtn = document.querySelector('.tab-btn.active');
  const activeTab = activeTabBtn ? activeTabBtn.dataset.tab : 'dashboard';
  
  // Reload the current tab's data
  try {
    switch(activeTab) {
      case 'dashboard':
        await loadDashboard();
        break;
      case 'notifications':
        await loadNotificationsTab();
        break;
      case 'services':
        await loadServices();
        break;
      case 'disclaimers':
        await loadDisclaimers();
        break;
      case 'feedback':
        await loadFeedbackList();
        break;
      case 'announcements':
        await loadAnnouncements();
        break;
      case 'appVersions':
        await loadAppVersionsTab();
        break;
      case 'taxiContributions':
        await loadTaxiContributions();
        break;
      case 'adminUsers':
        await loadAdminUsers();
        break;
      case 'adminSessions':
        await loadAdminSessions();
        break;
      case 'systemAlerts':
        await loadSystemAlerts();
        break;
      case 'cleanup':
        await loadCleanup();
        break;
      default:
        location.reload();
    }
    
    console.log(`✅ Refreshed ${activeTab} tab`);
    
    // Show brief success indicator
    const originalTitle = refreshBtnNav.title;
    refreshBtnNav.title = '✓ Refreshed!';
    setTimeout(() => {
      refreshBtnNav.title = originalTitle;
    }, 2000);
    
  } finally {
    // Remove loading state and re-enable button
    refreshBtnNav.classList.remove('loading');
    refreshBtnNav.disabled = false;
  }
}

// Authentication
async function handleLogin() {
  const username = document.getElementById('usernameInput').value;
  const password = document.getElementById('passwordInput').value;
  const loginBtn = document.getElementById('loginBtn');

  if (!username || !password) {
    showError('authError', 'Please enter both username and password');
    return;
  }

  setButtonLoading(loginBtn, true);

  try {
    const response = await fetch(`${apiBaseUrl}/api/admin/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      setButtonLoading(loginBtn, false);
      showError('authError', data.error || 'Login failed');
      return;
    }

    // Save session token
    sessionToken = data.session_token;
    currentUser = data.user;
    localStorage.setItem('admin_session_token', sessionToken);
    localStorage.setItem('admin_user', JSON.stringify(currentUser));

    // Hide auth section and show main content
    document.getElementById('authSection').style.display = 'none';
    document.getElementById('mainContent').style.display = 'block';

    // Show super admin tabs row if super admin
    const superAdminTabsRow = document.getElementById('superAdminTabsRow');
    if (currentUser.role === 'super_admin') {
      if (superAdminTabsRow) superAdminTabsRow.style.display = 'flex';
    } else {
      if (superAdminTabsRow) superAdminTabsRow.style.display = 'none';
    }

    // Clear password field
    document.getElementById('passwordInput').value = '';

    // Note: Don't reset button loading here since we're hiding the auth section
    // The button will be reset when the page reloads or user logs out

    // Load dashboard
    loadDashboard();
  } catch (error) {
    setButtonLoading(loginBtn, false);
    showError('authError', 'Connection failed. Please check the API base URL.');
  }
}

async function handleLogout() {
  try {
    if (sessionToken) {
      await fetch(`${apiBaseUrl}/api/admin/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-token': sessionToken,
        },
        body: JSON.stringify({ session_token: sessionToken }),
      });
    }
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    sessionToken = '';
    currentUser = null;
    localStorage.removeItem('admin_session_token');
    localStorage.removeItem('admin_user');
    document.getElementById('authSection').style.display = 'flex';
    document.getElementById('mainContent').style.display = 'none';
    document.getElementById('usernameInput').value = '';
    document.getElementById('passwordInput').value = '';

    // Reset login button state when logging out
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
      setButtonLoading(loginBtn, false);
    }
  }
}

async function verifySession() {
  try {
    const response = await fetch(`${apiBaseUrl}/api/admin/auth/me`, {
      method: 'GET',
      headers: {
        'x-session-token': sessionToken,
      },
    });

    if (response.ok) {
      const data = await response.json();
      currentUser = data.user;
      
      // Save to localStorage
      localStorage.setItem('admin_user', JSON.stringify(currentUser));
      
      document.getElementById('authSection').style.display = 'none';
      document.getElementById('mainContent').style.display = 'block';

      // Show super admin tabs row if super admin
      const superAdminTabsRow = document.getElementById('superAdminTabsRow');
      if (currentUser.role === 'super_admin') {
        if (superAdminTabsRow) superAdminTabsRow.style.display = 'flex';
        
        // Show System Health section on dashboard
        const systemHealthSection = document.getElementById('systemHealthSection');
        if (systemHealthSection) {
          systemHealthSection.style.display = 'block';
        }
      } else {
        if (superAdminTabsRow) superAdminTabsRow.style.display = 'none';
      }

      loadDashboard();
    } else {
      // Session invalid, clear it
      sessionToken = '';
      localStorage.removeItem('admin_session_token');
    }
  } catch (error) {
    // Session invalid, clear it
    sessionToken = '';
    localStorage.removeItem('admin_session_token');
  }
}

// API Requests
async function makeRequest(endpoint, options = {}) {
  const url = `${apiBaseUrl}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Add session token if available
  if (sessionToken) {
    headers['x-session-token'] = sessionToken;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    // If unauthorized, redirect to login
    if (response.status === 401) {
      handleLogout();
      throw new Error('Session expired. Please login again.');
    }
    const error = await response
      .json()
      .catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return await response.json();
}

// Tab Management
function switchTab(tabName) {
  // Clear all result messages to prevent cross-tab contamination
  document.querySelectorAll('.result-message').forEach((msg) => {
    msg.style.display = 'none';
    msg.textContent = '';
  });

  // Update tab buttons
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.classList.remove('active');
    if (btn.dataset.tab === tabName) {
      btn.classList.add('active');
    }
  });

  // Update tab content
  document.querySelectorAll('.tab-content').forEach((content) => {
    content.classList.remove('active');
  });
  document.getElementById(`${tabName}Tab`).classList.add('active');

  // Load tab data
  if (tabName === 'dashboard') {
    loadDashboard();
  } else if (tabName === 'notifications') {
    loadNotificationsTab();
  } else if (tabName === 'services') {
    loadServices();
  } else if (tabName === 'disclaimers') {
    loadDisclaimers();
  } else if (tabName === 'feedback') {
    loadFeedbackList();
  } else if (tabName === 'announcements') {
    loadAnnouncements();
  } else if (tabName === 'appVersions') {
    loadAppVersionsTab();
  } else if (tabName === 'adminUsers') {
    loadAdminUsers();
  } else if (tabName === 'adminSessions') {
    loadAdminSessions();
    loadLoginHistory();
  } else if (tabName === 'systemAlerts') {
    loadSystemAlerts();
  } else if (tabName === 'taxiContributions') {
    loadTaxiContributions();
  } else if (tabName === 'cleanup') {
    loadCleanup();
  }
}


// Dashboard
async function loadDashboard() {
  try {
    // Show loading state
    showDashboardLoading();

    const stats = await makeCachedRequest('/api/admin/stats/users');

    // Update stats
    document.getElementById('statTotalUsers').textContent = stats.users.total;
    document.getElementById('statActiveUsers').textContent = stats.users.active;
    document.getElementById('statNewToday').textContent = stats.users.new_today;
    document.getElementById('statNewWeek').textContent =
      stats.users.new_this_week;
    document.getElementById('statPushTokens').textContent =
      stats.users.with_push_tokens;
    document.getElementById('statTotalNotifications').textContent =
      stats.notifications.total;

    // Update new stats
    document.getElementById('statUnresolvedAlerts').textContent = stats.alerts?.unresolved || 0;
    document.getElementById('statCriticalAlerts').textContent = stats.alerts?.critical_today || 0;
    document.getElementById('statRecentFeedback').textContent = stats.feedback?.recent_7_days || 0;
    
    // Handle read_rate safely
    const readRate = stats.notifications?.read_rate;
    if (readRate !== null && readRate !== undefined && !isNaN(readRate)) {
      document.getElementById('statReadRate').textContent = `${Number(readRate).toFixed(1)}%`;
    } else {
      document.getElementById('statReadRate').textContent = '-';
    }
    
    document.getElementById('statActiveSessions').textContent = stats.admin?.active_sessions || 0;

    // Update API Health stats (super admin only)
    if (stats.api_health) {
      const apiHealth = stats.api_health;
      const healthCard = document.getElementById('apiHealthCard');
      
      // Set health status
      document.getElementById('statApiHealth').textContent = apiHealth.status.toUpperCase();
      
      // Color code based on status
      if (healthCard) {
        if (apiHealth.status === 'healthy') {
          healthCard.style.background = 'linear-gradient(135deg, #27ae60 0%, #229954 100%)';
        } else if (apiHealth.status === 'degraded') {
          healthCard.style.background = 'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)';
        } else {
          healthCard.style.background = 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)';
        }
      }
      
      document.getElementById('statResponseTime').textContent = apiHealth.response_time?.average_ms 
        ? `${apiHealth.response_time.average_ms}ms` 
        : '-';
      document.getElementById('statApiErrors').textContent = apiHealth.errors?.last_5_min || 0;
    }

    // Update Calculator Usage stats
    if (stats.calculator_usage) {
      const calc = stats.calculator_usage.last_30_days;
      document.getElementById('statSalaryTax').textContent = calc?.salaryTax || 0;
      document.getElementById('statDeemedProfit').textContent = calc?.deemedProfit || 0;
      document.getElementById('statPropertyTax').textContent = calc?.propertyTax || 0;
      document.getElementById('statRealEstateFees').textContent = calc?.realEstateFees || 0;
      document.getElementById('statTaxiContributions').textContent = calc?.taxiContributions || 0;
      document.getElementById('statNSSF').textContent = calc?.nssf || 0;
    }

    // Show System Health section only for super admins
    const systemHealthSection = document.getElementById('systemHealthSection');
    if (currentUser && currentUser.role === 'super_admin') {
      if (systemHealthSection) {
        systemHealthSection.style.display = 'block';
      }
    } else {
      if (systemHealthSection) {
        systemHealthSection.style.display = 'none';
      }
    }

    // Render charts with error handling
    try {
      renderDailyActiveUsersChart(stats.users.daily_active);
    } catch (e) {
      console.error('Error rendering daily active users chart:', e);
    }
    
    try {
      renderPlatformChart(stats.users.by_platform);
    } catch (e) {
      console.error('Error rendering platform chart:', e);
    }

    try {
      renderVersionChart(stats.users.by_version);
    } catch (e) {
      console.error('Error rendering version chart:', e);
    }

    try {
      renderFeedbackChart(stats.feedback?.by_category || []);
    } catch (e) {
      console.error('Error rendering feedback chart:', e);
    }
    
    try {
      renderNotificationEngagementChart(stats.notifications);
    } catch (e) {
      console.error('Error rendering notification engagement chart:', e);
    }
    
    try {
      // Store stats for filter usage
      window.lastDashboardStats = stats;
      renderCalculatorUsageChart(stats.calculator_usage, calculatorTimeframe);
    } catch (e) {
      console.error('Error rendering calculator usage chart:', e);
    }

    // Hide loading state
    hideDashboardLoading();
  } catch (error) {
    console.error('Error loading dashboard:', error);
    hideDashboardLoading();
    
    // Show error on dashboard itself (remove existing errors first)
    const dashboardTab = document.getElementById('dashboardTab');
    if (dashboardTab) {
      // Remove any existing error messages
      const existingErrors = dashboardTab.querySelectorAll('.result-message.error');
      existingErrors.forEach(err => err.remove());
      
      // Create new error message
      const errorDiv = document.createElement('div');
      errorDiv.className = 'result-message error';
      errorDiv.style.display = 'block';
      errorDiv.style.marginBottom = '20px';
      errorDiv.innerHTML = `
        <strong>Failed to load dashboard data.</strong> 
        ${error.message ? `Error: ${error.message}` : ''} 
        <button onclick="loadDashboard()" class="btn btn-primary" style="margin-left: 15px; padding: 5px 15px; font-size: 14px;">
          Retry
        </button>
      `;
      dashboardTab.insertBefore(errorDiv, dashboardTab.firstChild.nextSibling);
    }
  }
}

function showDashboardLoading() {
  // Show loading on stat cards
  document.getElementById('statTotalUsers').textContent = '...';
  document.getElementById('statActiveUsers').textContent = '...';
  document.getElementById('statNewToday').textContent = '...';
  document.getElementById('statNewWeek').textContent = '...';
  document.getElementById('statPushTokens').textContent = '...';
  document.getElementById('statTotalNotifications').textContent = '...';
    document.getElementById('statUnresolvedAlerts').textContent = '...';
    document.getElementById('statCriticalAlerts').textContent = '...';
    document.getElementById('statRecentFeedback').textContent = '...';
    document.getElementById('statReadRate').textContent = '...';
    document.getElementById('statActiveSessions').textContent = '...';
    document.getElementById('statTaxiContributions').textContent = '...';

  // Show loading on charts
  document.getElementById('dailyActiveUsersChart').innerHTML = '<div class="loading">Loading...</div>';
  document.getElementById('platformChart').innerHTML = '<div class="loading">Loading...</div>';
  document.getElementById('versionChart').innerHTML = '<div class="loading">Loading...</div>';
  document.getElementById('feedbackChart').innerHTML = '<div class="loading">Loading...</div>';
  document.getElementById('notificationEngagementChart').innerHTML = '<div class="loading">Loading...</div>';
  document.getElementById('calculatorUsageChart').innerHTML = '<div class="loading">Loading...</div>';
}

function hideDashboardLoading() {
  // Clear loading spinners from charts (if they're still showing)
  const chartIds = [
    'dailyActiveUsersChart',
    'platformChart',
    'versionChart',
    'feedbackChart',
    'notificationEngagementChart',
    'calculatorUsageChart'
  ];
  
  chartIds.forEach(chartId => {
    const chart = document.getElementById(chartId);
    if (chart && chart.innerHTML.includes('Loading...')) {
      chart.innerHTML = '<p style="text-align: center; padding: 40px; color: #999;">No data available</p>';
    }
  });
  
  // Clear loading from stat cards
  const statIds = [
    'statTotalUsers', 'statActiveUsers', 'statNewToday', 'statNewWeek',
    'statPushTokens', 'statTotalNotifications', 'statUnresolvedAlerts',
    'statCriticalAlerts', 'statRecentFeedback', 'statReadRate', 'statActiveSessions',
    'statApiHealth', 'statResponseTime', 'statApiErrors',
    'statSalaryTax', 'statDeemedProfit', 'statPropertyTax', 'statRealEstateFees', 'statTaxiContributions'
  ];
  
  statIds.forEach(statId => {
    const stat = document.getElementById(statId);
    if (stat && stat.textContent === '...') {
      stat.textContent = '-';
    }
  });
}

function renderPlatformChart(data) {
  const container = document.getElementById('platformChart');
  if (!container) return;
  
  container.innerHTML = '';

  const total = Object.values(data).reduce((sum, val) => sum + val, 0);
  
  if (total === 0) {
    container.innerHTML = createEmptyState('No platform data', 'User platforms will be tracked here');
    return;
  }

  Object.entries(data).forEach(([platform, count]) => {
    const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
    const bar = document.createElement('div');
    bar.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 15px;
            margin-bottom: 10px;
            background: #f8f9fa;
            border-radius: 6px;
            border: 1px solid #e9ecef;
        `;
    bar.innerHTML = `
            <span style="font-weight: 600; text-transform: capitalize; min-width: 80px; color: #495057;">${platform}</span>
            <div style="flex: 1; margin: 0 20px;">
                <div style="background: #e9ecef; height: 24px; border-radius: 12px; overflow: hidden; box-shadow: inset 0 1px 2px rgba(0,0,0,0.1);">
                    <div style="background: linear-gradient(135deg, #005544 0%, #007f66 100%); height: 100%; width: ${percentage}%; transition: width 0.5s ease;"></div>
                </div>
            </div>
            <span style="font-weight: 600; min-width: 100px; text-align: right; color: #005544;">${count} <span style="color: #999; font-weight: 400;">(${percentage}%)</span></span>
        `;
    container.appendChild(bar);
  });
}

function renderVersionChart(data) {
  const container = document.getElementById('versionChart');
  if (!container) return;
  
  container.innerHTML = '';

  if (data.length === 0) {
    container.innerHTML = createEmptyState('No version data', 'User app versions will appear here');
    return;
  }

  const maxCount = Math.max(...data.map((item) => item.count));

  data.forEach((item) => {
    const percentage =
      maxCount > 0 ? ((item.count / maxCount) * 100).toFixed(1) : 0;
    const bar = document.createElement('div');
    bar.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 15px;
            margin-bottom: 10px;
            background: #f8f9fa;
            border-radius: 6px;
            border: 1px solid #e9ecef;
        `;
    bar.innerHTML = `
            <span style="font-weight: 600; min-width: 80px; color: #495057;">${
              item.app_version || 'Unknown'
            }</span>
            <div style="flex: 1; margin: 0 20px;">
                <div style="background: #e9ecef; height: 24px; border-radius: 12px; overflow: hidden; box-shadow: inset 0 1px 2px rgba(0,0,0,0.1);">
                    <div style="background: linear-gradient(135deg, #005544 0%, #007f66 100%); height: 100%; width: ${percentage}%; transition: width 0.5s ease;"></div>
                </div>
            </div>
            <span style="font-weight: 600; min-width: 80px; text-align: right; color: #005544;">${item.count} <span style="color: #999; font-weight: 400;">users</span></span>
        `;
    container.appendChild(bar);
  });
}

function renderDailyActiveUsersChart(data) {
  const container = document.getElementById('dailyActiveUsersChart');
  if (!container) return;
  
  container.innerHTML = '';

  if (!data || data.length === 0) {
    container.innerHTML = `
      <div style="
        padding: 30px;
        text-align: center;
        background: #f8f9fa;
        border-radius: 8px;
        border: 2px dashed #dee2e6;
      ">
        <div style="font-size: 16px; color: #999; margin-bottom: 8px;">No activity data yet</div>
        <div style="font-size: 13px; color: #adb5bd;">User activity will be tracked here</div>
      </div>
    `;
    return;
  }

  const maxUsers = Math.max(...data.map((item) => item.active_users));
  const chartHeight = 250;

  // Create SVG-like chart with divs
  const chartWrapper = document.createElement('div');
  chartWrapper.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: 20px;
        padding: 20px;
        background: white;
        border-radius: 8px;
    `;

  // Chart area
  const chartArea = document.createElement('div');
  chartArea.style.cssText = `
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        height: ${chartHeight}px;
        border-bottom: 2px solid #e9ecef;
        border-left: 2px solid #e9ecef;
        padding: 10px 0 10px 10px;
        gap: 2px;
    `;

  // Add bars
  data.forEach((item, index) => {
    const barHeightPercent = maxUsers > 0 ? (item.active_users / maxUsers) * 100 : 0;
    const barHeightPx = maxUsers > 0 ? Math.max(5, (item.active_users / maxUsers) * chartHeight) : 0;
    const date = new Date(item.date);
    const dateStr = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });

    const barWrapper = document.createElement('div');
    barWrapper.style.cssText = `
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: flex-end;
            align-items: center;
            position: relative;
            height: 100%;
        `;

    const bar = document.createElement('div');
    bar.style.cssText = `
            width: 100%;
            background: linear-gradient(180deg, #007d60 0%, #005544 100%);
            border-radius: 4px 4px 0 0;
            height: ${barHeightPx}px;
            min-height: ${item.active_users > 0 ? '5px' : '0'};
            transition: all 0.3s ease;
            cursor: pointer;
            position: relative;
        `;

    // Tooltip on hover
    const tooltip = document.createElement('div');
    tooltip.style.cssText = `
            position: absolute;
            bottom: 100%;
            left: 50%;
            transform: translateX(-50%);
            background: #333;
            color: white;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 12px;
            white-space: nowrap;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.2s;
            margin-bottom: 5px;
            z-index: 100;
        `;
    tooltip.textContent = `${item.active_users} users - ${dateStr}`;
    bar.appendChild(tooltip);

    bar.addEventListener('mouseenter', () => {
      tooltip.style.opacity = '1';
      bar.style.background =
        'linear-gradient(180deg, #009C7D 0%, #007d60 100%)';
    });

    bar.addEventListener('mouseleave', () => {
      tooltip.style.opacity = '0';
      bar.style.background =
        'linear-gradient(180deg, #007d60 0%, #005544 100%)';
    });

    barWrapper.appendChild(bar);
    chartArea.appendChild(barWrapper);
  });

  // Legend/Date labels (show every 5th date for readability)
  const labelsArea = document.createElement('div');
  labelsArea.style.cssText = `
        display: flex;
        justify-content: space-between;
        margin-top: 10px;
        font-size: 11px;
        color: #666;
    `;

  data.forEach((item, index) => {
    if (index % 5 === 0 || index === data.length - 1) {
      const date = new Date(item.date);
      const label = document.createElement('span');
      label.textContent = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      label.style.cssText = 'flex: 1; text-align: center;';
      labelsArea.appendChild(label);
    }
  });

  // Summary stats
  const summaryArea = document.createElement('div');
  summaryArea.style.cssText = `
        display: flex;
        gap: 30px;
        padding-top: 15px;
        border-top: 1px solid #e9ecef;
        font-size: 14px;
    `;

  const totalActive = data.reduce((sum, item) => sum + item.active_users, 0);
  const avgActive = (totalActive / data.length).toFixed(0);
  const peakDay = data.reduce(
    (max, item) => (item.active_users > max.active_users ? item : max),
    data[0]
  );
  const peakDate = new Date(peakDay.date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  summaryArea.innerHTML = `
        <div><strong>Average:</strong> ${avgActive} users/day</div>
        <div><strong>Peak:</strong> ${
          peakDay.active_users
        } users (${peakDate})</div>
        <div><strong>Today:</strong> ${
          data[data.length - 1]?.active_users || 0
        } users</div>
    `;

  chartWrapper.appendChild(chartArea);
  chartWrapper.appendChild(labelsArea);
  chartWrapper.appendChild(summaryArea);
  container.appendChild(chartWrapper);
}

// Feedback Chart
function renderFeedbackChart(feedbackByCategory) {
  const container = document.getElementById('feedbackChart');
  if (!container) return;

  container.innerHTML = '';

  if (!feedbackByCategory || feedbackByCategory.length === 0) {
    container.innerHTML = `
      <div style="
        padding: 30px;
        text-align: center;
        background: #f8f9fa;
        border-radius: 8px;
        border: 2px dashed #dee2e6;
      ">
        <div style="font-size: 16px; color: #999; margin-bottom: 8px;">No feedback yet</div>
        <div style="font-size: 13px; color: #adb5bd;">User feedback will appear here when submitted</div>
      </div>
    `;
    return;
  }

  const total = feedbackByCategory.reduce((sum, item) => sum + item.count, 0);
  const colors = {
    bug: '#e74c3c',
    feature_request: '#3498db',
    improvement: '#f39c12',
    general: '#95a5a6',
    other: '#7f8c8d',
  };

  const labels = {
    bug: 'Bug Reports',
    feature_request: 'Feature Requests',
    improvement: 'Improvements',
    general: 'General',
    other: 'Other',
  };

  const chartWrapper = document.createElement('div');
  chartWrapper.className = 'bar-chart-wrapper';
  
  const chartArea = document.createElement('div');
  chartArea.className = 'bar-chart-area';
  
  const labelsArea = document.createElement('div');
  labelsArea.className = 'bar-chart-labels';
  
  const maxCount = Math.max(...feedbackByCategory.map(item => item.count));

  feedbackByCategory.forEach(item => {
    const barContainer = document.createElement('div');
    barContainer.className = 'bar-container';
    
    const bar = document.createElement('div');
    bar.className = 'bar';
    bar.style.width = `${(item.count / maxCount) * 100}%`;
    bar.style.backgroundColor = colors[item.category] || colors.other;
    bar.innerHTML = `<span class="bar-label">${item.count}</span>`;
    
    barContainer.appendChild(bar);
    chartArea.appendChild(barContainer);
    
    const label = document.createElement('div');
    label.className = 'chart-label';
    label.textContent = labels[item.category] || item.category;
    labelsArea.appendChild(label);
  });

  const summaryArea = document.createElement('div');
  summaryArea.className = 'chart-summary';
  summaryArea.innerHTML = `<strong>Total Feedback (30 days):</strong> ${total}`;

  chartWrapper.appendChild(chartArea);
  chartWrapper.appendChild(labelsArea);
  chartWrapper.appendChild(summaryArea);
  container.appendChild(chartWrapper);
}

// Notification Engagement Chart
function renderNotificationEngagementChart(notificationStats) {
  const container = document.getElementById('notificationEngagementChart');
  if (!container) return;

  container.innerHTML = '';

  const sent = notificationStats?.sent_last_30_days || 0;
  
  if (sent === 0) {
    container.innerHTML = `
      <div style="
        padding: 30px;
        text-align: center;
        background: #f8f9fa;
        border-radius: 8px;
        border: 2px dashed #dee2e6;
      ">
        <div style="font-size: 16px; color: #999; margin-bottom: 8px;">No notification data yet</div>
        <div style="font-size: 13px; color: #adb5bd;">Send notifications to see engagement metrics here</div>
      </div>
    `;
    return;
  }

  const read = notificationStats.read_last_30_days || 0;
  const unread = sent - read;
  const readRate = notificationStats.read_rate || 0;
  const readPercentage = sent > 0 ? (read / sent * 100) : 0;
  const unreadPercentage = sent > 0 ? (unread / sent * 100) : 0;

  // Create a stacked progress bar style chart
  const chartHTML = `
    <div style="margin-bottom: 30px;">
      <!-- Summary Stats -->
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 25px;">
        <div style="text-align: center; padding: 15px; background: #f8f9fa; border-radius: 8px;">
          <div style="font-size: 32px; font-weight: bold; color: #3498db; margin-bottom: 5px;">${sent}</div>
          <div style="font-size: 14px; color: #666;">Total Sent</div>
        </div>
        <div style="text-align: center; padding: 15px; background: #f8f9fa; border-radius: 8px;">
          <div style="font-size: 32px; font-weight: bold; color: #27ae60; margin-bottom: 5px;">${read}</div>
          <div style="font-size: 14px; color: #666;">Read (${readPercentage.toFixed(1)}%)</div>
        </div>
        <div style="text-align: center; padding: 15px; background: #f8f9fa; border-radius: 8px;">
          <div style="font-size: 32px; font-weight: bold; color: #e74c3c; margin-bottom: 5px;">${unread}</div>
          <div style="font-size: 14px; color: #666;">Unread (${unreadPercentage.toFixed(1)}%)</div>
        </div>
      </div>

      <!-- Stacked Bar Chart -->
      <div style="margin-bottom: 15px;">
        <div style="font-size: 14px; font-weight: 600; color: #666; margin-bottom: 8px;">Engagement Breakdown</div>
        <div style="display: flex; height: 40px; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          ${read > 0 ? `
            <div style="
              background: linear-gradient(135deg, #27ae60 0%, #229954 100%);
              width: ${readPercentage}%;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: 600;
              font-size: 14px;
              transition: all 0.3s ease;
            " title="Read: ${read} (${readPercentage.toFixed(1)}%)">
              ${readPercentage > 15 ? `${readPercentage.toFixed(0)}%` : ''}
            </div>
          ` : ''}
          ${unread > 0 ? `
            <div style="
              background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
              width: ${unreadPercentage}%;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: 600;
              font-size: 14px;
              transition: all 0.3s ease;
            " title="Unread: ${unread} (${unreadPercentage.toFixed(1)}%)">
              ${unreadPercentage > 15 ? `${unreadPercentage.toFixed(0)}%` : ''}
            </div>
          ` : ''}
        </div>
        <div style="display: flex; justify-content: space-between; margin-top: 8px; font-size: 12px; color: #999;">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>

      <!-- Performance Indicator -->
      <div style="
        padding: 15px;
        background: ${readPercentage >= 50 ? 'linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%)' : 
                     readPercentage >= 25 ? 'linear-gradient(135deg, #fff3cd 0%, #ffe69c 100%)' : 
                     'linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%)'};
        border-left: 4px solid ${readPercentage >= 50 ? '#28a745' : readPercentage >= 25 ? '#ffc107' : '#dc3545'};
        border-radius: 6px;
        margin-top: 15px;
      ">
        <div style="font-weight: 600; margin-bottom: 5px; color: #333;">
          ${readPercentage >= 50 ? 'Good Engagement' : readPercentage >= 25 ? 'Moderate Engagement' : 'Low Engagement'}
        </div>
        <div style="font-size: 13px; color: #666;">
          ${readPercentage >= 50 ? 'More than half of your notifications are being read.' : 
            readPercentage >= 25 ? 'About a quarter of notifications are being read. Consider improving notification relevance.' : 
            'Very few notifications are being read. Review your notification strategy.'}
        </div>
      </div>
    </div>
  `;

  container.innerHTML = chartHTML;
}

// Set calculator timeframe filter
function setCalculatorTimeframe(timeframe) {
  calculatorTimeframe = timeframe;
  
  // Update active button
  const buttons = document.querySelectorAll('.calculator-filter-btn');
  buttons.forEach(btn => {
    if (btn.getAttribute('data-timeframe') == timeframe) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
  
  // Re-render chart with new timeframe
  // Get stats from the cached data if available, or reload dashboard
  if (window.lastDashboardStats && window.lastDashboardStats.calculator_usage) {
    renderCalculatorUsageChart(window.lastDashboardStats.calculator_usage, timeframe);
  } else {
    // Reload dashboard to get fresh data
    loadDashboard();
  }
}

// Calculator Usage Chart
function renderCalculatorUsageChart(calculatorStats, timeframe = calculatorTimeframe) {
  const container = document.getElementById('calculatorUsageChart');
  if (!container) return;

  container.innerHTML = '';

  if (!calculatorStats) {
    container.innerHTML = '<p style="text-align: center; padding: 40px; color: #999;">No calculator usage data available</p>';
    return;
  }

  // Get data based on timeframe
  let data;
  let periodLabel;
  
  if (timeframe === 'lifetime') {
    data = calculatorStats.lifetime || calculatorStats.all_time;
    periodLabel = 'Lifetime';
  } else if (timeframe === 30) {
    data = calculatorStats.last_30_days;
    periodLabel = 'Last 30 days';
  } else if (timeframe === 60) {
    data = calculatorStats.last_60_days;
    periodLabel = 'Last 60 days';
  } else if (timeframe === 90) {
    data = calculatorStats.last_90_days;
    periodLabel = 'Last 90 days';
  } else {
    // Default to 30 days
    data = calculatorStats.last_30_days;
    periodLabel = 'Last 30 days';
  }

  if (!data) {
    container.innerHTML = '<p style="text-align: center; padding: 40px; color: #999;">No calculator usage data available</p>';
    return;
  }

  const labels = calculatorStats.labels;
  const total = data.total || 0;

  if (total === 0) {
    container.innerHTML = `
      <div style="
        padding: 30px;
        text-align: center;
        background: #f8f9fa;
        border-radius: 8px;
        border: 2px dashed #dee2e6;
      ">
        <div style="font-size: 16px; color: #999; margin-bottom: 8px;">No calculator data yet</div>
        <div style="font-size: 13px; color: #adb5bd;">Calculator usage will appear here once users start using the app</div>
      </div>
    `;
    return;
  }

  const calculators = [
    { key: 'salaryTax', count: data.salaryTax || 0, color: '#3498db' },
    { key: 'deemedProfit', count: data.deemedProfit || 0, color: '#9b59b6' },
    { key: 'propertyTax', count: data.propertyTax || 0, color: '#e74c3c' },
    { key: 'realEstateFees', count: data.realEstateFees || 0, color: '#f39c12' },
    { key: 'taxiContributions', count: data.taxiContributions || 0, color: '#16a085' },
    { key: 'nssf', count: data.nssf || 0, color: '#2ecc71' },
  ].sort((a, b) => b.count - a.count); // Sort by usage

  const maxCount = Math.max(...calculators.map(c => c.count));
  const mostPopular = calculators[0];

  const chartHTML = `
    <div>
      <!-- Summary Card -->
      <div style="
        padding: 20px;
        background: linear-gradient(135deg, #005544 0%, #007f66 100%);
        border-radius: 8px;
        margin-bottom: 25px;
        color: white;
        text-align: center;
      ">
        <div style="font-size: 48px; font-weight: bold; margin-bottom: 10px;">${total}</div>
        <div style="font-size: 16px; opacity: 0.9;">Total Calculator Uses (${periodLabel})</div>
        ${mostPopular.count > 0 ? `
          <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.3);">
            <div style="font-size: 14px; opacity: 0.8; margin-bottom: 5px;">Most Popular</div>
            <div style="font-size: 18px; font-weight: 600;">${labels[mostPopular.key]} (${((mostPopular.count / total) * 100).toFixed(1)}%)</div>
          </div>
        ` : ''}
      </div>

      <!-- Bar Chart -->
      <div class="bar-chart-wrapper">
        ${calculators.map(calc => {
          const percentage = total > 0 ? (calc.count / total * 100).toFixed(1) : 0;
          const barWidth = maxCount > 0 ? (calc.count / maxCount) * 100 : 0;
          return `
            <div class="calc-bar-item">
              <div class="calc-bar-header">
                <span class="calc-bar-title">${labels[calc.key]}</span>
                <span class="calc-bar-count">${calc.count} <span style="color: #999; font-weight: 400;">(${percentage}%)</span></span>
              </div>
              <div class="calc-bar-background">
                <div class="calc-bar-fill" style="width: ${barWidth}%; background: ${calc.color};">
                  ${calc.count > 0 ? '<span class="calc-bar-pulse"></span>' : ''}
                </div>
              </div>
            </div>
          `;
        }).join('')}
        <div class="chart-summary" style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e9ecef; text-align: center; color: #666;">
          <strong style="color: #005544;">Total Calculations:</strong> ${total} | 
          <strong style="color: #005544;">Period:</strong> ${periodLabel}
        </div>
      </div>
    </div>
  `;

  container.innerHTML = chartHTML;
}

// Notifications Tab Management
async function loadNotificationsTab() {
  try {
    await loadNotificationVersionFilters();
    
    // Set up event listeners for filter changes (if not already set)
    const sendPlatformFilter = document.getElementById('sendPlatformFilter');
    const sendVersionFilter = document.getElementById('sendVersionFilter');
    
    if (sendPlatformFilter && !sendPlatformFilter.hasAttribute('data-listener-added')) {
      sendPlatformFilter.addEventListener('change', updateTargetUsersCount);
      sendPlatformFilter.setAttribute('data-listener-added', 'true');
    }
    if (sendVersionFilter && !sendVersionFilter.hasAttribute('data-listener-added')) {
      sendVersionFilter.addEventListener('change', updateTargetUsersCount);
      sendVersionFilter.setAttribute('data-listener-added', 'true');
    }
    
    await updateTargetUsersCount();
    await loadNotificationsList();
  } catch (error) {
    console.error('Error loading notifications tab:', error);
  }
}

async function loadNotificationVersionFilters() {
  try {
    const stats = await makeCachedRequest('/api/admin/stats/users');

    // Populate send version filter
    const sendVersionSelect = document.getElementById('sendVersionFilter');
    sendVersionSelect.innerHTML = '<option value="">All Versions</option>';

    if (stats.users.by_version && stats.users.by_version.length > 0) {
      stats.users.by_version.forEach(v => {
        const option = document.createElement('option');
        option.value = v.app_version;
        option.textContent = `${v.app_version} (${v.count} users)`;
        sendVersionSelect.appendChild(option);
      });
    }

    // Populate history version filter
    const historyVersionSelect = document.getElementById('notificationVersionFilter');
    historyVersionSelect.innerHTML = '<option value="">All Versions</option>';

    if (stats.users.by_version && stats.users.by_version.length > 0) {
      stats.users.by_version.forEach(v => {
        const option = document.createElement('option');
        option.value = v.app_version;
        option.textContent = v.app_version;
        historyVersionSelect.appendChild(option);
      });
    }
  } catch (error) {
    console.error('Error loading app versions:', error);
  }
}

async function updateTargetUsersCount() {
  try {
    const platformEl = document.getElementById('sendPlatformFilter');
    const versionEl = document.getElementById('sendVersionFilter');
    const countSpan = document.getElementById('targetUsersCount');
    
    if (!platformEl || !versionEl || !countSpan) return;
    
    const platform = platformEl.value;
    const version = versionEl.value;
    
    const params = new URLSearchParams({ count_only: 'true', with_push_tokens: 'true' });
    if (platform) params.append('platform', platform);
    if (version) params.append('app_version', version);

    const result = await makeCachedRequest(`/api/admin/users?${params}`);
    const totalUsers = result.total || 0;
    const usersWithTokens = result.with_push_tokens || 0;
    
    if (usersWithTokens > 0) {
      countSpan.innerHTML = `Will send push to <strong>${usersWithTokens}</strong> user${usersWithTokens !== 1 ? 's' : ''} with tokens`;
      if (usersWithTokens < totalUsers) {
        countSpan.innerHTML += ` <span style="color: #999;">(${totalUsers} total, ${totalUsers - usersWithTokens} without tokens)</span>`;
      }
      countSpan.style.color = '#005544';
    } else if (totalUsers > 0) {
      countSpan.innerHTML = `<span style="color: #ffc107;">Warning: ${totalUsers} user${totalUsers !== 1 ? 's' : ''} match, but none have push tokens</span>`;
      countSpan.style.color = '#ffc107';
    } else {
      countSpan.textContent = 'No users match these filters';
      countSpan.style.color = '#dc3545';
      countSpan.style.fontWeight = '600';
    }
  } catch (error) {
    console.error('Error counting target users:', error);
    const countSpan = document.getElementById('targetUsersCount');
    if (countSpan) countSpan.textContent = '';
  }
}

// Notifications
async function handleBroadcastNotification(e) {
  e.preventDefault();

  const title = document.getElementById('broadcastTitle').value;
  const body = document.getElementById('broadcastBody').value;
  const type = document.getElementById('broadcastType').value;
  const platform = document.getElementById('sendPlatformFilter').value;
  const version = document.getElementById('sendVersionFilter').value;

  // Get target user count to validate before sending
  const countSpan = document.getElementById('targetUsersCount');
  const countText = countSpan?.textContent || '';
  
  // Check if there are users with push tokens
  if (countText.includes('none have push tokens') || countText.includes('No users match')) {
    showResult(
      'notificationResult',
      'Cannot send notification: No users with push tokens match the selected filters',
      'error'
    );
    return;
  }

  let confirmMessage = 'Are you sure you want to send this notification';
  if (platform && version) {
    confirmMessage += ` to ${platform.toUpperCase()} users on version ${version}?`;
  } else if (platform) {
    confirmMessage += ` to all ${platform.toUpperCase()} users?`;
  } else if (version) {
    confirmMessage += ` to all users on version ${version}?`;
  } else {
    confirmMessage += ' to ALL users with push tokens?';
  }
  
  confirmMessage += '\n\nNote: Only users with registered push tokens will receive this notification.';

  if (!confirm(confirmMessage)) {
    return;
  }

  const submitBtn = e.target.querySelector('button[type="submit"]');
  setButtonLoading(submitBtn, true);

  try {
    const requestBody = { title, body, type };
    if (platform) requestBody.platform = platform;
    if (version) requestBody.app_version = version;

    const result = await makeRequest('/api/admin/notifications/broadcast', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    // Invalidate notification caches
    invalidateNotificationCaches();

    const successCount = result.push_result?.successCount || 0;
    const errorCount = result.push_result?.errorCount || 0;
    
    let message = `Notification sent successfully to ${result.devices_notified} device${result.devices_notified !== 1 ? 's' : ''} with push tokens!`;
    if (errorCount > 0) {
      message += ` (${successCount} succeeded, ${errorCount} failed)`;
    }
    
    showResult('notificationResult', message, 'success');
    e.target.reset();
    await updateTargetUsersCount();
    await loadNotificationsList();
    setButtonLoading(submitBtn, false);
  } catch (error) {
    setButtonLoading(submitBtn, false);
    
    // Handle specific error for no devices with tokens
    if (error.message.includes('No devices with push tokens')) {
      showResult(
        'notificationResult',
        'Cannot send notification: No users with push tokens match the selected filters',
        'error'
      );
    } else {
      showResult('notificationResult', `Error: ${error.message}`, 'error');
    }
  }
}

// Notifications List Management
let notificationsCurrentPage = 1;

async function loadNotificationsList() {
  const container = document.getElementById('notificationsList');
  
  try {
    if (!container) {
      console.error('notificationsList container not found');
      return;
    }
    
    // Show loading state
    container.innerHTML = '<div class="loading">Loading...</div>';

    const typeFilter = document.getElementById('notificationTypeFilter')?.value || '';
    const platformFilter = document.getElementById('notificationPlatformFilter')?.value || '';
    const versionFilter = document.getElementById('notificationVersionFilter')?.value || '';
    const unreadOnly = document.getElementById('unreadNotificationsOnly')?.checked || false;

    const params = new URLSearchParams({
      limit: 50,
      offset: (notificationsCurrentPage - 1) * 50,
    });

    if (typeFilter) {
      params.append('type', typeFilter);
    }

    if (platformFilter) {
      params.append('platform', platformFilter);
    }

    if (versionFilter) {
      params.append('app_version', versionFilter);
    }

    if (unreadOnly) {
      params.append('unread_only', 'true');
    }

    const result = await makeCachedRequest(`/api/admin/notifications?${params}`);

    if (!result || !result.notifications || result.notifications.length === 0) {
      container.innerHTML = `
        <div style="
          padding: 30px;
          text-align: center;
          background: #f8f9fa;
          border-radius: 8px;
          border: 2px dashed #dee2e6;
        ">
          <div style="font-size: 16px; color: #999; margin-bottom: 8px;">No notifications found</div>
          <div style="font-size: 13px; color: #adb5bd;">
            ${platformFilter || versionFilter || typeFilter || unreadOnly ? 'Try adjusting your filters' : 'Send your first notification to see it here'}
          </div>
        </div>
      `;
      return;
    }

    container.innerHTML = result.notifications
      .map(
        (notif) => `
            <div class="list-item">
                <div class="list-item-header">
                    <div>
                        <div class="list-item-title">
                            ${notif.title}
                            ${
                              notif.unread_count > 0
                                ? `<span style="color: #007bff; font-size: 12px; margin-left: 10px;">● ${notif.unread_count} Unread</span>`
                                : ''
                            }
                            ${
                              notif.read_count > 0
                                ? `<span style="color: #999; font-size: 12px; margin-left: 10px;">● ${notif.read_count} Read</span>`
                                : ''
                            }
                        </div>
                        <div style="color: #666; font-size: 14px; margin-top: 5px;">
                            Type: <strong>${notif.type || 'general'}</strong>
                            | Recipients: <strong>${
                              notif.recipient_count
                            }</strong>
                            ${
                              notif.platforms && notif.platforms.length > 0
                                ? ` | Platforms: <strong>${notif.platforms.join(
                                    ', '
                                  )}</strong>`
                                : ''
                            }
                        </div>
                    </div>
                    <div class="list-item-actions">
                        ${
                          notif.unread_count > 0
                            ? `<button class="btn btn-primary btn-sm" onclick="resendNotificationToUnread(${notif.id}, this); return false;">Resend to ${notif.unread_count} Unread</button>`
                            : ''
                        }
                        <button class="btn btn-danger btn-sm" onclick="deleteNotificationConfirm(${
                          notif.id
                        }, this); return false;">Delete</button>
                    </div>
                </div>
                <div style="color: #666; margin-top: 10px; font-size: 14px;">
                    <div><strong>Message:</strong> ${notif.body}</div>
                    <div style="margin-top: 5px;">Sent: <strong>${new Date(
                      notif.created_at
                    ).toLocaleString()}</strong></div>
                    <div style="margin-top: 5px;">
                        <strong>Recipients (${notif.recipient_count}):</strong>
                        ${
                          notif.unread_count > 0
                            ? `<div style="margin-top: 5px; color: #007bff; font-size: 13px;"><strong>${notif.unread_count} unread</strong> | ${notif.read_count} read</div>`
                            : ''
                        }
                        <div style="margin-top: 5px; max-height: 100px; overflow-y: auto; background: #f5f5f5; padding: 8px; border-radius: 4px;">
                            ${
                              notif.device_uuids &&
                              notif.device_uuids.length > 0
                                ? notif.device_uuids
                                    .slice(0, 10)
                                    .map((uuid) => {
                                      const isUnread =
                                        notif.unread_device_uuids &&
                                        notif.unread_device_uuids.includes(
                                          uuid
                                        );
                                      return `<code style="font-size: 11px; display: block; margin: 2px 0; ${
                                        isUnread
                                          ? 'color: #007bff; font-weight: bold;'
                                          : ''
                                      }">${uuid} ${
                                        isUnread ? '(unread)' : ''
                                      }</code>`;
                                    })
                                    .join('') +
                                  (notif.device_uuids.length > 10
                                    ? `<div style="color: #999; font-size: 11px; margin-top: 5px;">... and ${
                                        notif.device_uuids.length - 10
                                      } more</div>`
                                    : '')
                                : 'No recipients'
                            }
                        </div>
                    </div>
                    ${
                      notif.app_versions && notif.app_versions.length > 0
                        ? `<div style="margin-top: 5px;">App Versions: <strong>${notif.app_versions.join(
                            ', '
                          )}</strong></div>`
                        : ''
                    }
                    ${
                      notif.data
                        ? `<div style="margin-top: 5px; font-size: 12px; color: #999;">Data: <code>${JSON.stringify(
                            notif.data
                          )}</code></div>`
                        : ''
                    }
                </div>
            </div>
        `
      )
      .join('');
  } catch (error) {
    console.error('Error loading notifications:', error);
    
    // Always clear loading state
    if (container) {
      container.innerHTML = `
        <div style="
          padding: 30px;
          text-align: center;
          background: #fff3cd;
          border-radius: 8px;
          border: 2px solid #ffc107;
        ">
          <div style="font-size: 16px; color: #856404; margin-bottom: 8px; font-weight: 600;">Failed to load notifications</div>
          <div style="font-size: 13px; color: #856404; margin-bottom: 15px;">${error.message || 'Unknown error occurred'}</div>
          <button onclick="loadNotificationsList()" class="btn btn-primary btn-sm">
            Retry
          </button>
        </div>
      `;
    }
    showResult('notificationsListResult', `Error: ${error.message}`, 'error');
  }
}

async function resendNotificationToUnread(id, btnElement) {
  if (
    !confirm(
      'Are you sure you want to resend this notification to all unread recipients?'
    )
  ) {
    return;
  }

  const resendBtn =
    btnElement ||
    document.querySelector(
      `button[onclick*="resendNotificationToUnread(${id}"]`
    );

  try {
    setButtonLoading(resendBtn, true);
    const result = await makeRequest(
      `/api/admin/notifications/${id}/resend-unread`,
      {
        method: 'POST',
      }
    );

    // Invalidate notification caches
    invalidateNotificationCaches();
    
    showResult(
      'notificationsListResult',
      `Notification resent to ${result.devices_notified} devices!${
        result.devices_failed > 0 ? ` (${result.devices_failed} failed)` : ''
      }`,
      'success'
    );
    loadNotificationsList();
    setButtonLoading(resendBtn, false);
  } catch (error) {
    setButtonLoading(resendBtn, false);
    showResult('notificationsListResult', `Error: ${error.message}`, 'error');
  }
}

async function deleteNotificationConfirm(id, btnElement) {
  if (
    !confirm(
      'Are you sure you want to delete this notification? This action cannot be undone.'
    )
  ) {
    return;
  }

  const deleteBtn =
    btnElement ||
    document.querySelector(
      `button[onclick*="deleteNotificationConfirm(${id}"]`
    );

  try {
    setButtonLoading(deleteBtn, true);
    await makeRequest(`/api/admin/notifications/${id}`, {
      method: 'DELETE',
    });

    // Invalidate notification caches
    invalidateNotificationCaches();
    
    showResult(
      'notificationsListResult',
      'Notification deleted successfully!',
      'success'
    );
    loadNotificationsList();
    setButtonLoading(deleteBtn, false);
  } catch (error) {
    setButtonLoading(deleteBtn, false);
    showResult('notificationsListResult', `Error: ${error.message}`, 'error');
  }
}

// Services
async function loadServices() {
  try {
    const container = document.getElementById('servicesList');
    container.innerHTML = '<div class="loading">Loading...</div>';

    const services = await makeCachedRequest('/api/admin/services');

    if (services.length === 0) {
      container.innerHTML = createEmptyState('No services found', 'Add your first service to manage content');
      return;
    }

    container.innerHTML = services
      .map(
        (service) => `
            <div class="list-item">
                <div class="list-item-header">
                    <div>
                        <div class="list-item-title">
                            ${service.service_title}
                            ${
                              service.featured
                                ? '<span style="color: #ffc107; font-size: 12px; margin-left: 10px;">⭐ Featured</span>'
                                : ''
                            }
                            ${
                              !service.active
                                ? '<span style="color: #dc3545; font-size: 12px; margin-left: 10px;">● Inactive</span>'
                                : '<span style="color: #28a745; font-size: 12px; margin-left: 10px;">● Active</span>'
                            }
                        </div>
                        ${
                          service.service_title_ar
                            ? `<div style="color: #666; font-size: 14px; margin-top: 5px; direction: rtl;">${service.service_title_ar}</div>`
                            : ''
                        }
                    </div>
                    <div class="list-item-actions">
                        <button class="btn btn-primary btn-sm" onclick="editService(${
                          service.id
                        })">Edit</button>
                        <button class="btn btn-danger btn-sm" onclick="deleteService(${
                          service.id
                        }, this); return false;" data-service-id="${
          service.id
        }">Delete</button>
                    </div>
                </div>
                <div style="color: #666; margin-top: 10px;">
                    <div><strong>Phone:</strong> ${service.phone_number}</div>
                    <div style="margin-top: 5px;"><strong>Message:</strong> ${
                      service.message
                    }</div>
                    ${
                      service.featured && service.featured_description
                        ? `<div style="margin-top: 5px;"><strong>Featured Description (EN):</strong> ${service.featured_description}</div>`
                        : ''
                    }
                    ${
                      service.featured && service.featured_description_ar
                        ? `<div style="margin-top: 5px; direction: rtl;"><strong>Featured Description (AR):</strong> ${service.featured_description_ar}</div>`
                        : ''
                    }
                </div>
                <div style="font-size: 12px; color: #999; margin-top: 10px;">
                    Updated: ${new Date(service.updated_at).toLocaleString()}
                </div>
            </div>
        `
      )
      .join('');
  } catch (error) {
    console.error('Error loading services:', error);
    showResult('notificationResult', 'Failed to load services', 'error');
  }
}

function openServiceModal(id = null) {
  const modal = document.getElementById('serviceModal');
  const form = document.getElementById('serviceForm');
  const title = document.getElementById('serviceModalTitle');

  if (id) {
    title.textContent = 'Edit Service';
    document.getElementById('serviceId').value = id;
    loadServiceData(id);
  } else {
    title.textContent = 'Add Service';
    form.reset();
    document.getElementById('serviceId').value = '';
    document.getElementById('serviceActive').checked = true;
    document.getElementById('serviceFeatured').checked = false;
  }

  modal.style.display = 'block';
}

async function loadServiceData(id) {
  try {
    const service = await makeRequest(`/api/admin/services/${id}`);
    document.getElementById('serviceTitle').value = service.service_title;
    document.getElementById('serviceTitleAr').value =
      service.service_title_ar || '';
    document.getElementById('serviceMessage').value = service.message;
    document.getElementById('servicePhone').value = service.phone_number;
    document.getElementById('serviceFeatured').checked = service.featured === 1;
    document.getElementById('featuredDescription').value =
      service.featured_description || '';
    document.getElementById('featuredDescriptionAr').value =
      service.featured_description_ar || '';
    document.getElementById('serviceActive').checked = service.active === 1;
  } catch (error) {
    showResult(
      'notificationResult',
      `Error loading service: ${error.message}`,
      'error'
    );
  }
}

function closeServiceModal() {
  document.getElementById('serviceModal').style.display = 'none';
}

async function handleSaveService(e) {
  e.preventDefault();

  const submitBtn = e.target.querySelector('button[type="submit"]');
  const id = document.getElementById('serviceId').value;
  const serviceTitle = document.getElementById('serviceTitle').value;
  const serviceTitleAr = document.getElementById('serviceTitleAr').value;
  const serviceMessage = document.getElementById('serviceMessage').value;
  const servicePhone = document.getElementById('servicePhone').value;
  const serviceFeatured = document.getElementById('serviceFeatured').checked;
  const featuredDescription = document.getElementById(
    'featuredDescription'
  ).value;
  const featuredDescriptionAr = document.getElementById(
    'featuredDescriptionAr'
  ).value;
  const serviceActive = document.getElementById('serviceActive').checked;

  setButtonLoading(submitBtn, true);

  try {
    const data = {
      service_title: serviceTitle,
      service_title_ar: serviceTitleAr || null,
      message: serviceMessage,
      phone_number: servicePhone,
      featured: serviceFeatured,
      featured_description: featuredDescription || null,
      featured_description_ar: featuredDescriptionAr || null,
      active: serviceActive,
    };

    if (id) {
      // Update
      await makeRequest(`/api/admin/services/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      showResult(
        'servicesResult',
        'Service updated successfully!',
        'success'
      );
    } else {
      // Create
      await makeRequest('/api/admin/services', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      showResult(
        'servicesResult',
        'Service created successfully!',
        'success'
      );
    }

    // Invalidate cache to force refresh
    invalidateServiceCaches();

    closeServiceModal();
    loadServices();
    e.target.reset();
    setButtonLoading(submitBtn, false);
  } catch (error) {
    setButtonLoading(submitBtn, false);
    showResult('servicesResult', `Error: ${error.message}`, 'error');
  }
}

async function editService(id) {
  openServiceModal(id);
}

async function deleteService(id, btnElement) {
  if (!confirm('Are you sure you want to delete this service?')) {
    return;
  }

  const deleteBtn =
    btnElement || document.querySelector(`button[data-service-id="${id}"]`);

  try {
    setButtonLoading(deleteBtn, true);
    await makeRequest(`/api/admin/services/${id}`, {
      method: 'DELETE',
    });

    // Invalidate cache to force refresh
    invalidateServiceCaches();

    showResult(
      'servicesResult',
      'Service deleted successfully!',
      'success'
    );
    loadServices();
    setButtonLoading(deleteBtn, false);
  } catch (error) {
    setButtonLoading(deleteBtn, false);
    showResult('servicesResult', `Error: ${error.message}`, 'error');
  }
}

// Disclaimers
async function loadDisclaimers() {
  try {
    const container = document.getElementById('disclaimersList');
    container.innerHTML = '<div class="loading">Loading...</div>';

    const disclaimers = await makeCachedRequest('/api/admin/disclaimers');

    if (disclaimers.length === 0) {
      container.innerHTML = createEmptyState('No disclaimers found', 'Add disclaimers to manage legal content');
      return;
    }

    container.innerHTML = disclaimers
      .map(
        (disclaimer) => `
            <div class="list-item">
                <div class="list-item-header">
                    <div>
                        <div class="list-item-title">${
                          disclaimer.screen_name
                        }</div>
                        ${
                          disclaimer.disclaimer_text_ar
                            ? '<span style="color: #ffc107; font-size: 12px; margin-left: 10px;">🌐 Bilingual</span>'
                            : '<span style="color: #999; font-size: 12px; margin-left: 10px;">English Only</span>'
                        }
                    </div>
                    <div class="list-item-actions">
                        <button class="btn btn-primary btn-sm" onclick="editDisclaimer(${
                          disclaimer.id
                        })">Edit</button>
                        <button class="btn btn-danger btn-sm" onclick="deleteDisclaimer(${
                          disclaimer.id
                        }, this); return false;" data-disclaimer-id="${
          disclaimer.id
        }">Delete</button>
                    </div>
                </div>
                <div style="color: #666; margin-top: 10px;">
                    <div><strong>English:</strong> ${
                      disclaimer.disclaimer_text
                    }</div>
                    ${
                      disclaimer.disclaimer_text_ar
                        ? `<div style="margin-top: 10px; direction: rtl;"><strong>Arabic:</strong> ${disclaimer.disclaimer_text_ar}</div>`
                        : ''
                    }
                </div>
                <div style="font-size: 12px; color: #999; margin-top: 10px;">
                    Updated: ${new Date(disclaimer.updated_at).toLocaleString()}
                </div>
            </div>
        `
      )
      .join('');
  } catch (error) {
    console.error('Error loading disclaimers:', error);
    showResult('disclaimersList', 'Failed to load disclaimers', 'error');
  }
}

function openDisclaimerModal(id = null) {
  const modal = document.getElementById('disclaimerModal');
  const form = document.getElementById('disclaimerForm');
  const title = document.getElementById('modalTitle');

  if (id) {
    title.textContent = 'Edit Disclaimer';
    document.getElementById('disclaimerId').value = id;
    // Load disclaimer data
    loadDisclaimerData(id);
  } else {
    title.textContent = 'Add Disclaimer';
    form.reset();
    document.getElementById('disclaimerId').value = '';
  }

  modal.style.display = 'block';
}

async function loadDisclaimerData(id) {
  try {
    const disclaimer = await makeRequest(`/api/admin/disclaimers/${id}`);
    document.getElementById('screenName').value = disclaimer.screen_name;
    document.getElementById('disclaimerText').value =
      disclaimer.disclaimer_text;
    document.getElementById('disclaimerTextAr').value =
      disclaimer.disclaimer_text_ar || '';
  } catch (error) {
    showResult(
      'notificationResult',
      `Error loading disclaimer: ${error.message}`,
      'error'
    );
  }
}

function closeDisclaimerModal() {
  document.getElementById('disclaimerModal').style.display = 'none';
}

async function handleSaveDisclaimer(e) {
  e.preventDefault();

  const submitBtn = e.target.querySelector('button[type="submit"]');
  const id = document.getElementById('disclaimerId').value;
  const screenName = document.getElementById('screenName').value;
  const disclaimerText = document.getElementById('disclaimerText').value;
  const disclaimerTextAr = document.getElementById('disclaimerTextAr').value;

  setButtonLoading(submitBtn, true);

  try {
    const data = {
      screen_name: screenName,
      disclaimer_text: disclaimerText,
      disclaimer_text_ar: disclaimerTextAr || null,
    };

    if (id) {
      // Update
      await makeRequest(`/api/admin/disclaimers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      showResult(
        'disclaimersResult',
        'Disclaimer updated successfully!',
        'success'
      );
    } else {
      // Create
      await makeRequest('/api/admin/disclaimers', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      showResult(
        'disclaimersResult',
        'Disclaimer created successfully!',
        'success'
      );
    }

    // Invalidate cache to force refresh
    invalidateDisclaimerCaches();

    closeDisclaimerModal();
    loadDisclaimers();
    e.target.reset();
    setButtonLoading(submitBtn, false);
  } catch (error) {
    setButtonLoading(submitBtn, false);
    showResult('disclaimersResult', `Error: ${error.message}`, 'error');
  }
}

async function editDisclaimer(id) {
  openDisclaimerModal(id);
}

async function deleteDisclaimer(id, btnElement) {
  if (!confirm('Are you sure you want to delete this disclaimer?')) {
    return;
  }

  // Find the delete button
  const deleteBtn =
    btnElement || document.querySelector(`button[data-disclaimer-id="${id}"]`);

  try {
    setButtonLoading(deleteBtn, true);
    await makeRequest(`/api/admin/disclaimers/${id}`, {
      method: 'DELETE',
    });

    // Invalidate cache to force refresh
    invalidateDisclaimerCaches();

    showResult(
      'disclaimersResult',
      'Disclaimer deleted successfully!',
      'success'
    );
    loadDisclaimers();
    setButtonLoading(deleteBtn, false);
  } catch (error) {
    setButtonLoading(deleteBtn, false);
    showResult('disclaimersResult', `Error: ${error.message}`, 'error');
  }
}

// Admin Users Management (Super Admin Only)
async function loadAdminUsers() {
  try {
    const container = document.getElementById('adminUsersList');
    container.innerHTML = '<div class="loading">Loading...</div>';

    const users = await makeCachedRequest('/api/admin/auth/users');

    if (users.users.length === 0) {
      container.innerHTML = createEmptyState('No admin users found', 'Create admin users to manage the portal');
      return;
    }

    container.innerHTML = users.users
      .map(
        (user) => `
            <div class="list-item">
                <div class="list-item-header">
                    <div>
                        <div class="list-item-title">${user.username} ${
          user.role === 'super_admin'
            ? '<span style="color: #ffc107; font-size: 12px;">(Super Admin)</span>'
            : ''
        }</div>
                        <div style="color: #666; font-size: 14px; margin-top: 5px;">
                            ${user.full_name || 'No name'} ${
          user.email ? `| ${user.email}` : ''
        }
                        </div>
                    </div>
                    <div class="list-item-actions">
                        <button class="btn btn-primary btn-sm" onclick="editAdminUser(${
                          user.id
                        })">Edit</button>
                        ${
                          user.id !== currentUser.id
                            ? `<button class="btn btn-danger btn-sm" onclick="deleteAdminUserConfirm(${user.id}, '${user.username}', this); return false;">Delete</button>`
                            : '<span style="color: #999; font-size: 12px;">Current User</span>'
                        }
                    </div>
                </div>
                <div style="color: #666; margin-top: 10px; font-size: 14px;">
                    <div>Role: <strong>${
                      user.role
                    }</strong> | Status: <strong>${
          user.is_active ? 'Active' : 'Inactive'
        }</strong></div>
                    ${
                      user.last_login
                        ? `<div style="margin-top: 5px;">Last Login: ${new Date(
                            user.last_login
                          ).toLocaleString()}</div>`
                        : '<div style="margin-top: 5px;">Never logged in</div>'
                    }
                    <div style="margin-top: 5px; font-size: 12px; color: #999;">Created: ${new Date(
                      user.created_at
                    ).toLocaleString()}</div>
                </div>
            </div>
        `
      )
      .join('');
  } catch (error) {
    console.error('Error loading admin users:', error);
    showResult('adminUsersList', `Error: ${error.message}`, 'error');
  }
}

function openAdminUserModal(id = null) {
  const modal = document.getElementById('adminUserModal');
  const form = document.getElementById('adminUserForm');
  const title = document.getElementById('adminUserModalTitle');

  if (id) {
    title.textContent = 'Edit Admin User';
    document.getElementById('adminUserId').value = id;
    loadAdminUserData(id);
  } else {
    title.textContent = 'Add Admin User';
    form.reset();
    document.getElementById('adminUserId').value = '';
    document.getElementById('adminUsername').readOnly = false; // Enable for new users
    document.getElementById('adminPassword').required = true;
    document.getElementById('adminIsActive').checked = true;
  }

  modal.style.display = 'block';
}

async function loadAdminUserData(id) {
  try {
    const users = await makeRequest('/api/admin/auth/users');
    const user = users.users.find((u) => u.id === parseInt(id));

    if (!user) {
      showResult('adminUsersResult', 'Admin user not found', 'error');
      return;
    }

    document.getElementById('adminUsername').value = user.username;
    document.getElementById('adminUsername').readOnly = true; // Username cannot be changed
    document.getElementById('adminEmail').value = user.email || '';
    document.getElementById('adminFullName').value = user.full_name || '';
    document.getElementById('adminRole').value = user.role;
    document.getElementById('adminIsActive').checked = user.is_active;
    document.getElementById('adminPassword').required = false;
    document.getElementById('adminPassword').placeholder =
      'Leave empty to keep current password';
  } catch (error) {
    showResult(
      'adminUsersResult',
      `Error loading admin user: ${error.message}`,
      'error'
    );
  }
}

function closeAdminUserModal() {
  document.getElementById('adminUserModal').style.display = 'none';
}

async function handleSaveAdminUser(e) {
  e.preventDefault();

  const submitBtn = e.target.querySelector('button[type="submit"]');
  const id = document.getElementById('adminUserId').value;
  const username = document.getElementById('adminUsername').value;
  const password = document.getElementById('adminPassword').value;
  const email = document.getElementById('adminEmail').value;
  const fullName = document.getElementById('adminFullName').value;
  const role = document.getElementById('adminRole').value;
  const isActive = document.getElementById('adminIsActive').checked;

  setButtonLoading(submitBtn, true);

  try {
    if (id) {
      // Update - username cannot be changed
      const updateData = {
        email: email || null,
        full_name: fullName || null,
        role,
        is_active: isActive,
      };

      if (password && password.trim() !== '') {
        updateData.password = password;
      }

      await makeRequest(`/api/admin/auth/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });
      showResult(
        'adminUsersResult',
        'Admin user updated successfully!',
        'success'
      );
    } else {
      // Create
      if (!password) {
        setButtonLoading(submitBtn, false);
        showResult(
          'adminUsersResult',
          'Password is required for new users',
          'error'
        );
        return;
      }

      await makeRequest('/api/admin/auth/create-user', {
        method: 'POST',
        body: JSON.stringify({
          username,
          password,
          email: email || null,
          full_name: fullName || null,
          role,
        }),
      });
      showResult(
        'adminUsersResult',
        'Admin user created successfully!',
        'success'
      );
    }

    // Invalidate cache to force refresh
    invalidateAdminCaches();

    closeAdminUserModal();
    loadAdminUsers();
    e.target.reset();
    setButtonLoading(submitBtn, false);
  } catch (error) {
    setButtonLoading(submitBtn, false);
    showResult('adminUsersResult', `Error: ${error.message}`, 'error');
  }
}

async function editAdminUser(id) {
  openAdminUserModal(id);
}

async function deleteAdminUserConfirm(id, username, btnElement) {
  if (
    !confirm(
      `Are you sure you want to delete admin user "${username}"? This action cannot be undone.`
    )
  ) {
    return;
  }

  // Find the delete button
  const deleteBtn =
    btnElement ||
    document.querySelector(`button[onclick*="deleteAdminUserConfirm(${id}"]`);

  try {
    setButtonLoading(deleteBtn, true);
    await makeRequest(`/api/admin/auth/users/${id}`, {
      method: 'DELETE',
    });

    // Invalidate cache to force refresh
    invalidateAdminCaches();

    showResult(
      'adminUsersResult',
      'Admin user deleted successfully!',
      'success'
    );
    loadAdminUsers();
    setButtonLoading(deleteBtn, false);
  } catch (error) {
    setButtonLoading(deleteBtn, false);
    showResult('adminUsersResult', `Error: ${error.message}`, 'error');
  }
}

// Utility Functions
function createEmptyState(title, description) {
  return `
    <div style="
      padding: 30px;
      text-align: center;
      background: #f8f9fa;
      border-radius: 8px;
      border: 2px dashed #dee2e6;
    ">
      <div style="font-size: 16px; color: #999; margin-bottom: 8px;">${title}</div>
      <div style="font-size: 13px; color: #adb5bd;">${description}</div>
    </div>
  `;
}

function showResult(elementId, message, type) {
  const element = document.getElementById(elementId);
  
  // Create message with close button
  element.innerHTML = `
    ${message}
    <button class="close-notification" onclick="this.parentElement.style.display='none'" title="Dismiss">
      &times;
    </button>
  `;
  
  element.className = `result-message ${type}`;
  element.style.display = 'block';

  // Auto-dismiss success messages after 5 seconds
  if (type === 'success') {
    setTimeout(() => {
      element.style.display = 'none';
    }, 5000);
  }
}

function showError(elementId, message) {
  const element = document.getElementById(elementId);
  element.textContent = message;
  element.style.display = 'block';
}

// Button Loading States
function setButtonLoading(button, isLoading) {
  if (!button) return;

  if (isLoading) {
    button.disabled = true;
    button.dataset.originalText = button.textContent;
    button.innerHTML = '<span class="btn-loading-spinner"></span> Loading...';
    button.style.opacity = '0.7';
    button.style.cursor = 'not-allowed';
  } else {
    button.disabled = false;
    button.textContent = button.dataset.originalText || button.textContent;
    button.style.opacity = '1';
    button.style.cursor = 'pointer';
  }
}

// Admin Sessions Management (Super Admin Only)
let sessionsCurrentPage = 1;
let historyCurrentPage = 1;

function switchSubTab(subTabName) {
  // Update sub-tab buttons
  document.querySelectorAll('[data-subtab]').forEach((btn) => {
    btn.classList.remove('active');
    if (btn.dataset.subtab === subTabName) {
      btn.classList.add('active');
    }
  });

  // Update sub-tab content
  document.querySelectorAll('.sub-tab-content').forEach((content) => {
    content.style.display = 'none';
  });

  if (subTabName === 'sessions') {
    document.getElementById('sessionsSubTab').style.display = 'block';
    loadAdminSessions();
  } else if (subTabName === 'history') {
    document.getElementById('historySubTab').style.display = 'block';
    loadLoginHistory();
  }
}

async function loadAdminSessions() {
  try {
    const container = document.getElementById('sessionsList');
    container.innerHTML = '<div class="loading">Loading...</div>';

    const userFilter = document.getElementById('sessionUserFilter').value;
    const activeOnly = document.getElementById('activeSessionsOnly').checked;

    const params = new URLSearchParams({
      limit: 50,
      offset: (sessionsCurrentPage - 1) * 50,
      active_only: activeOnly.toString(),
    });

    if (userFilter) {
      params.append('user_id', userFilter);
    }

    const result = await makeCachedRequest(`/api/admin/auth/sessions?${params}`);

    if (result.sessions.length === 0) {
      container.innerHTML = createEmptyState('No sessions found', 'Active admin sessions will appear here');
      return;
    }

    container.innerHTML = result.sessions
      .map(
        (session) => `
            <div class="list-item">
                <div class="list-item-header">
                    <div>
                        <div class="list-item-title">
                            ${session.user.username} ${
          session.user.role === 'super_admin'
            ? '<span style="color: #ffc107; font-size: 12px;">(Super Admin)</span>'
            : ''
        }
                            ${
                              session.is_active
                                ? '<span style="color: #28a745; font-size: 12px; margin-left: 10px;">● Active</span>'
                                : '<span style="color: #dc3545; font-size: 12px; margin-left: 10px;">● Expired</span>'
                            }
                        </div>
                        <div style="color: #666; font-size: 14px; margin-top: 5px;">
                            ${session.user.full_name || 'No name'} ${
          session.user.email ? `| ${session.user.email}` : ''
        }
                        </div>
                    </div>
                    <div class="list-item-actions">
                        ${
                          session.is_active
                            ? `<button class="btn btn-danger btn-sm" onclick="revokeSession(${session.id}, this); return false;">Revoke</button>`
                            : ''
                        }
                    </div>
                </div>
                <div style="color: #666; margin-top: 10px; font-size: 14px;">
                    <div>IP Address: <strong>${
                      session.ip_address || 'Unknown'
                    }</strong></div>
                    <div style="margin-top: 5px;">User Agent: <strong>${
                      session.user_agent || 'Unknown'
                    }</strong></div>
                    <div style="margin-top: 5px;">Session Token: <code style="font-size: 11px; background: #f5f5f5; padding: 2px 6px; border-radius: 3px;">${
                      session.session_token
                    }</code></div>
                    <div style="margin-top: 5px;">Created: ${new Date(
                      session.created_at
                    ).toLocaleString()}</div>
                    <div style="margin-top: 5px;">Expires: ${new Date(
                      session.expires_at
                    ).toLocaleString()}</div>
                    ${
                      session.is_active
                        ? `<div style="margin-top: 5px; color: #28a745;">Expires in: ${getTimeUntil(
                            session.expires_at
                          )}</div>`
                        : ''
                    }
                </div>
            </div>
        `
      )
      .join('');

    // Load user filter options
    await loadSessionUserFilter();
  } catch (error) {
    console.error('Error loading admin sessions:', error);
    showResult('sessionsResult', `Error: ${error.message}`, 'error');
  }
}

async function loadLoginHistory() {
  try {
    const container = document.getElementById('loginHistoryList');
    container.innerHTML = '<div class="loading">Loading...</div>';

    const userFilter = document.getElementById('historyUserFilter').value;

    const params = new URLSearchParams({
      limit: 50,
      offset: (historyCurrentPage - 1) * 50,
    });

    if (userFilter) {
      params.append('user_id', userFilter);
    }

    const result = await makeCachedRequest(`/api/admin/auth/login-history?${params}`);

    if (result.history.length === 0) {
      container.innerHTML = createEmptyState('No login history found', 'Admin login activity will appear here');
      return;
    }

    container.innerHTML = result.history
      .map(
        (entry) => `
            <div class="list-item">
                <div class="list-item-header">
                    <div>
                        <div class="list-item-title">
                            ${entry.username} ${
          entry.role === 'super_admin'
            ? '<span style="color: #ffc107; font-size: 12px;">(Super Admin)</span>'
            : ''
        }
                        </div>
                        <div style="color: #666; font-size: 14px; margin-top: 5px;">
                            ${entry.full_name || 'No name'} ${
          entry.email ? `| ${entry.email}` : ''
        }
                        </div>
                    </div>
                    <div class="list-item-actions">
                        ${
                          entry.current_sessions > 0
                            ? `<button class="btn btn-danger btn-sm" onclick="revokeAllUserSessions(${entry.user_id}, '${entry.username}', this); return false;">Revoke All Sessions</button>`
                            : ''
                        }
                    </div>
                </div>
                <div style="color: #666; margin-top: 10px; font-size: 14px;">
                    <div>Last Login: <strong>${
                      entry.last_login
                        ? new Date(entry.last_login).toLocaleString()
                        : 'Never'
                    }</strong></div>
                    ${
                      entry.last_login_ip
                        ? `<div style="margin-top: 5px;">Last Login IP: <strong>${entry.last_login_ip}</strong></div>`
                        : ''
                    }
                    <div style="margin-top: 5px;">Active Sessions: <strong>${
                      entry.current_sessions
                    }</strong> | Total Sessions: <strong>${
          entry.total_sessions
        }</strong></div>
                </div>
            </div>
        `
      )
      .join('');

    // Load user filter options
    await loadHistoryUserFilter();
  } catch (error) {
    console.error('Error loading login history:', error);
    showResult('sessionsResult', `Error: ${error.message}`, 'error');
  }
}

async function loadSessionUserFilter() {
  try {
    const users = await makeRequest('/api/admin/auth/users');
    const select = document.getElementById('sessionUserFilter');

    // Keep "All Users" option
    const currentValue = select.value;
    select.innerHTML = '<option value="">All Users</option>';

    users.users.forEach((user) => {
      const option = document.createElement('option');
      option.value = user.id;
      option.textContent = `${user.username} (${user.role})`;
      select.appendChild(option);
    });

    // Restore selection
    if (currentValue) {
      select.value = currentValue;
    }
  } catch (error) {
    console.error('Error loading user filter:', error);
  }
}

async function loadHistoryUserFilter() {
  try {
    const users = await makeRequest('/api/admin/auth/users');
    const select = document.getElementById('historyUserFilter');

    // Keep "All Users" option
    const currentValue = select.value;
    select.innerHTML = '<option value="">All Users</option>';

    users.users.forEach((user) => {
      const option = document.createElement('option');
      option.value = user.id;
      option.textContent = `${user.username} (${user.role})`;
      select.appendChild(option);
    });

    // Restore selection
    if (currentValue) {
      select.value = currentValue;
    }
  } catch (error) {
    console.error('Error loading user filter:', error);
  }
}

async function revokeSession(sessionId, btnElement) {
  if (
    !confirm(
      'Are you sure you want to revoke this session? The user will be logged out.'
    )
  ) {
    return;
  }

  // Find the revoke button
  const revokeBtn =
    btnElement ||
    document.querySelector(`button[onclick*="revokeSession(${sessionId})"]`);

  try {
    setButtonLoading(revokeBtn, true);
    await makeRequest(`/api/admin/auth/sessions/${sessionId}`, {
      method: 'DELETE',
    });

    // Invalidate cache to force refresh
    invalidateAdminCaches();

    showResult('sessionsResult', 'Session revoked successfully!', 'success');
    loadAdminSessions();
    setButtonLoading(revokeBtn, false);
  } catch (error) {
    setButtonLoading(revokeBtn, false);
    showResult('sessionsResult', `Error: ${error.message}`, 'error');
  }
}

async function revokeAllUserSessions(userId, username, btnElement) {
  if (
    !confirm(
      `Are you sure you want to revoke all sessions for "${username}"? They will be logged out from all devices.`
    )
  ) {
    return;
  }

  // Find the revoke button
  const revokeBtn =
    btnElement ||
    document.querySelector(
      `button[onclick*="revokeAllUserSessions(${userId}"]`
    );

  try {
    setButtonLoading(revokeBtn, true);
    await makeRequest(`/api/admin/auth/sessions/user/${userId}`, {
      method: 'DELETE',
    });

    // Invalidate cache to force refresh
    invalidateAdminCaches();

    showResult(
      'sessionsResult',
      'All sessions revoked successfully!',
      'success'
    );
    loadAdminSessions();
    loadLoginHistory();
    setButtonLoading(revokeBtn, false);
  } catch (error) {
    setButtonLoading(revokeBtn, false);
    showResult('sessionsResult', `Error: ${error.message}`, 'error');
  }
}

function getTimeUntil(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = date - now;

  if (diffMs < 0) return 'Expired';

  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''}`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
  return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
}

// ============= FEEDBACK MANAGEMENT =============

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

async function loadFeedbackStats() {
  try {
    // Show loading state
    document.getElementById('totalFeedbackCount').textContent = '...';
    document.getElementById('recentFeedbackCount').textContent = '...';
    document.getElementById('pendingFeedbackCount').textContent = '...';

    const data = await makeRequest('/api/admin/feedback/stats');

    document.getElementById('totalFeedbackCount').textContent =
      data.stats.total || 0;
    document.getElementById('recentFeedbackCount').textContent =
      data.stats.recent || 0;

    const pendingCount =
      data.stats.by_status.find((s) => s.status === 'new')?.count || 0;
    document.getElementById('pendingFeedbackCount').textContent = pendingCount;
  } catch (error) {
    console.error('Error loading feedback stats:', error);
    // Set fallback values on error
    document.getElementById('totalFeedbackCount').textContent = '-';
    document.getElementById('recentFeedbackCount').textContent = '-';
    document.getElementById('pendingFeedbackCount').textContent = '-';
  }
}

async function loadFeedbackList() {
  try {
    const feedbackList = document.getElementById('feedbackList');
    feedbackList.innerHTML = '<div class="loading">Loading...</div>';

    const status = document.getElementById('feedbackStatusFilter').value;
    const category = document.getElementById('feedbackCategoryFilter').value;

    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (category) params.append('category', category);
    params.append('limit', '100');

    const data = await makeCachedRequest(`/api/admin/feedback?${params}`);

    if (data.feedback.length === 0) {
      feedbackList.innerHTML = createEmptyState('No feedback found', 'User feedback will appear here when submitted');
      return;
    }

    feedbackList.innerHTML = data.feedback
      .map(
        (item) => `
            <div class="list-item" onclick="viewFeedbackDetails(${
              item.id
            })" style="cursor: pointer;">
                <div style="display: flex; justify-content: between; align-items: start; gap: 15px;">
                    <div style="flex: 1;">
                        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                            <span class="badge badge-${getCategoryBadgeColor(
                              item.category
                            )}">${formatCategory(item.category)}</span>
                            <span class="badge badge-${getStatusBadgeColor(
                              item.status
                            )}">${formatStatus(item.status)}</span>
                        </div>
                        <h4 style="margin: 0 0 8px 0; color: #005544;">${escapeHtml(
                          item.subject
                        )}</h4>
                        <p style="margin: 0 0 8px 0; color: #666; font-size: 14px;">${escapeHtml(
                          item.message.substring(0, 150)
                        )}${item.message.length > 150 ? '...' : ''}</p>
                        <div style="display: flex; gap: 15px; font-size: 13px; color: #999;">
                            <span>Platform: ${item.platform || 'unknown'} ${
          item.app_version || ''
        }</span>
                            <span>${new Date(
                              item.created_at
                            ).toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </div>
        `
      )
      .join('');

    await loadFeedbackStats();
  } catch (error) {
    console.error('Error loading feedback:', error);
    document.getElementById('feedbackList').innerHTML =
      '<p style="text-align: center; padding: 40px; color: #e74c3c;">Error loading feedback</p>';
  }
}

async function viewFeedbackDetails(id) {
  try {
    const data = await makeRequest(`/api/admin/feedback/${id}`);
    const feedback = data.feedback;

    document.getElementById('feedbackIdToUpdate').value = feedback.id;
    document.getElementById('feedbackStatus').value = feedback.status;
    document.getElementById('adminNotes').value = feedback.admin_notes || '';

    document.getElementById('feedbackDetailsContent').innerHTML = `
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <div style="margin-bottom: 15px;">
                    <span class="badge badge-${getCategoryBadgeColor(
                      feedback.category
                    )}">${formatCategory(feedback.category)}</span>
                    <span class="badge badge-${getStatusBadgeColor(
                      feedback.status
                    )}" style="margin-left: 8px;">${formatStatus(
      feedback.status
    )}</span>
                </div>
                <h3 style="margin: 0 0 15px 0; color: #005544;">${escapeHtml(
                  feedback.subject
                )}</h3>
                <div style="background: white; padding: 15px; border-radius: 6px; margin-bottom: 15px;">
                    <p style="white-space: pre-wrap; margin: 0; line-height: 1.6;">${escapeHtml(
                      feedback.message
                    )}</p>
                </div>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; font-size: 14px;">
                    <div><strong>Device UUID:</strong> ${
                      feedback.device_uuid
                    }</div>
                    <div><strong>Platform:</strong> ${
                      feedback.platform || 'N/A'
                    }</div>
                    <div><strong>App Version:</strong> ${
                      feedback.app_version || 'N/A'
                    }</div>
                    <div><strong>Submitted:</strong> ${new Date(
                      feedback.created_at
                    ).toLocaleString()}</div>
                </div>
                ${
                  feedback.admin_notes
                    ? `
                    <div style="margin-top: 15px; padding: 15px; background: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
                        <strong>Admin Notes:</strong>
                        <p style="margin: 5px 0 0 0; white-space: pre-wrap;">${escapeHtml(
                          feedback.admin_notes
                        )}</p>
                    </div>
                `
                    : ''
                }
            </div>
        `;

    openFeedbackModal();
  } catch (error) {
    console.error('Error loading feedback details:', error);
    showResult('feedbackResult', 'Error loading feedback details', 'error');
  }
}

async function handleUpdateFeedback(e) {
  e.preventDefault();

  const id = document.getElementById('feedbackIdToUpdate').value;
  const status = document.getElementById('feedbackStatus').value;
  const adminNotes = document.getElementById('adminNotes').value;

  const submitBtn = e.target.querySelector('button[type="submit"]');
  setButtonLoading(submitBtn, true);

  try {
    await makeRequest(`/api/admin/feedback/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status, admin_notes: adminNotes }),
    });

    // Invalidate cache to force refresh
    invalidateFeedbackCaches();

    showResult('feedbackResult', 'Feedback updated successfully!', 'success');
    closeFeedbackModal();
    loadFeedbackList();
    setButtonLoading(submitBtn, false);
  } catch (error) {
    setButtonLoading(submitBtn, false);
    showResult('feedbackResult', `Error: ${error.message}`, 'error');
  }
}

async function handleDeleteFeedback() {
  const id = document.getElementById('feedbackIdToUpdate').value;

  if (!confirm('Are you sure you want to delete this feedback?')) {
    return;
  }

  const deleteBtn = document.getElementById('deleteFeedbackBtn');
  setButtonLoading(deleteBtn, true);

  try {
    await makeRequest(`/api/admin/feedback/${id}`, {
      method: 'DELETE',
    });

    // Invalidate cache to force refresh
    invalidateFeedbackCaches();

    showResult('feedbackResult', 'Feedback deleted successfully!', 'success');
    closeFeedbackModal();
    loadFeedbackList();
    setButtonLoading(deleteBtn, false);
  } catch (error) {
    setButtonLoading(deleteBtn, false);
    showResult('feedbackResult', `Error: ${error.message}`, 'error');
  }
}

function openFeedbackModal() {
  document.getElementById('feedbackModal').style.display = 'block';
}

function closeFeedbackModal() {
  document.getElementById('feedbackModal').style.display = 'none';
}

function getCategoryBadgeColor(category) {
  const colors = {
    bug: 'danger',
    feature_request: 'primary',
    improvement: 'info',
    general: 'secondary',
    other: 'warning',
  };
  return colors[category] || 'secondary';
}

function getStatusBadgeColor(status) {
  const colors = {
    new: 'danger',
    in_review: 'warning',
    resolved: 'success',
    closed: 'secondary',
  };
  return colors[status] || 'secondary';
}

function formatCategory(category) {
  const labels = {
    bug: 'Bug',
    feature_request: 'Feature Request',
    improvement: 'Improvement',
    general: 'General',
    other: 'Other',
  };
  return labels[category] || category;
}

function formatStatus(status) {
  const labels = {
    new: 'New',
    in_review: 'In Review',
    resolved: 'Resolved',
    closed: 'Closed',
  };
  return labels[status] || status;
}

// ============= SYSTEM ALERTS MANAGEMENT =============

async function loadSystemAlerts() {
  try {
    await loadAlertStats();
    await loadAlertsList();
  } catch (error) {
    console.error('Error loading system alerts:', error);
    showResult('alertsResult', `Error: ${error.message}`, 'error');
  }
}

async function loadAlertStats() {
  try {
    // Show loading state
    document.getElementById('unresolvedAlertsCount').textContent = '...';
    document.getElementById('criticalAlertsCount').textContent = '...';
    document.getElementById('errorsCount').textContent = '...';
    document.getElementById('warningsCount').textContent = '...';

    const data = await makeCachedRequest('/api/admin/alerts/stats');

    document.getElementById('unresolvedAlertsCount').textContent = data.stats.unresolved_count || 0;
    document.getElementById('criticalAlertsCount').textContent = data.stats.critical_last_24h || 0;

    const errors = data.stats.by_type.find(t => t.alert_type === 'error');
    const warnings = data.stats.by_type.find(t => t.alert_type === 'warning');

    document.getElementById('errorsCount').textContent = errors?.count || 0;
    document.getElementById('warningsCount').textContent = warnings?.count || 0;

    // Populate source filter
    const sourceFilter = document.getElementById('alertSourceFilter');
    const currentSource = sourceFilter.value;
    sourceFilter.innerHTML = '<option value="">All Sources</option>';
    data.stats.by_source.forEach(source => {
      const option = document.createElement('option');
      option.value = source.source;
      option.textContent = `${source.source} (${source.count})`;
      sourceFilter.appendChild(option);
    });
    if (currentSource) sourceFilter.value = currentSource;

  } catch (error) {
    console.error('Error loading alert stats:', error);
    // Set fallback values on error
    document.getElementById('unresolvedAlertsCount').textContent = '-';
    document.getElementById('criticalAlertsCount').textContent = '-';
    document.getElementById('errorsCount').textContent = '-';
    document.getElementById('warningsCount').textContent = '-';
  }
}

async function loadAlertsList() {
  try {
    const container = document.getElementById('alertsList');
    container.innerHTML = '<div class="loading">Loading...</div>';

    const type = document.getElementById('alertTypeFilter').value;
    const severity = document.getElementById('alertSeverityFilter').value;
    const source = document.getElementById('alertSourceFilter').value;
    const resolved = document.getElementById('alertResolvedFilter').value;

    const params = new URLSearchParams({ limit: 100 });
    if (type) params.append('type', type);
    if (severity) params.append('severity', severity);
    if (source) params.append('source', source);
    if (resolved) params.append('resolved', resolved);

    const data = await makeCachedRequest(`/api/admin/alerts?${params}`);

    if (data.alerts.length === 0) {
      container.innerHTML = createEmptyState('No alerts found', 'System alerts will appear here when issues occur');
      return;
    }

    container.innerHTML = data.alerts.map(alert => `
      <div class="list-item" style="${alert.resolved ? 'opacity: 0.6;' : ''}">
        <div style="display: flex; justify-content: space-between; align-items: start; gap: 15px;">
          <div style="display: flex; align-items: start; gap: 10px;">
            <input type="checkbox" class="alert-checkbox" data-alert-id="${alert.id}" onclick="event.stopPropagation(); updateBulkActions();" />
            <div style="flex: 1; cursor: pointer;" onclick="viewAlertDetails(${alert.id})">
              <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                <span class="badge badge-${getAlertTypeBadge(alert.alert_type)}">${alert.alert_type.toUpperCase()}</span>
                <span class="badge badge-${getAlertSeverityBadge(alert.severity)}">${alert.severity.toUpperCase()}</span>
                <span class="badge badge-secondary">${alert.source}</span>
                ${alert.resolved ? '<span class="badge badge-success">RESOLVED</span>' : ''}
              </div>
              <h4 style="margin: 0 0 8px 0; color: ${alert.resolved ? '#666' : '#dc3545'};">${escapeHtml(alert.message)}</h4>
              ${alert.request_path ? `<p style="margin: 0 0 5px 0; color: #666; font-size: 13px;">Path: ${alert.request_method || 'GET'} ${alert.request_path}</p>` : ''}
              ${alert.device_uuid ? `<p style="margin: 0 0 5px 0; color: #666; font-size: 13px;">Device: ${alert.device_uuid}</p>` : ''}
              <div style="font-size: 12px; color: #999; margin-top: 5px;">
                ${new Date(alert.created_at).toLocaleString()}
                ${alert.resolved_at ? ` | Resolved: ${new Date(alert.resolved_at).toLocaleString()}` : ''}
                ${alert.resolved_by_username ? ` by ${alert.resolved_by_username}` : ''}
              </div>
            </div>
          </div>
        </div>
      </div>
    `).join('');

  } catch (error) {
    console.error('Error loading alerts:', error);
    document.getElementById('alertsList').innerHTML = '<p style="text-align: center; padding: 40px; color: #e74c3c;">Error loading alerts</p>';
  }
}

async function viewAlertDetails(id) {
  try {
    const data = await makeCachedRequest(`/api/admin/alerts/${id}`);
    const alert = data.alert;

    document.getElementById('alertDetailsContent').innerHTML = `
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <div style="margin-bottom: 15px;">
          <span class="badge badge-${getAlertTypeBadge(alert.alert_type)}">${alert.alert_type.toUpperCase()}</span>
          <span class="badge badge-${getAlertSeverityBadge(alert.severity)}" style="margin-left: 8px;">${alert.severity.toUpperCase()}</span>
          <span class="badge badge-secondary" style="margin-left: 8px;">${alert.source}</span>
          ${alert.resolved ? '<span class="badge badge-success" style="margin-left: 8px;">RESOLVED</span>' : ''}
        </div>
        <h3 style="margin: 0 0 15px 0; color: #dc3545;">${escapeHtml(alert.message)}</h3>
        
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; font-size: 14px; margin-bottom: 15px;">
          <div><strong>Created:</strong> ${new Date(alert.created_at).toLocaleString()}</div>
          ${alert.request_method ? `<div><strong>Method:</strong> ${alert.request_method}</div>` : ''}
          ${alert.request_path ? `<div><strong>Path:</strong> ${alert.request_path}</div>` : ''}
          ${alert.request_ip ? `<div><strong>IP:</strong> ${alert.request_ip}</div>` : ''}
          ${alert.device_uuid ? `<div><strong>Device:</strong> ${alert.device_uuid}</div>` : ''}
          ${alert.resolved_at ? `<div><strong>Resolved:</strong> ${new Date(alert.resolved_at).toLocaleString()}</div>` : ''}
          ${alert.resolved_by_username ? `<div><strong>Resolved By:</strong> ${alert.resolved_by_username}</div>` : ''}
        </div>

        ${alert.details && Object.keys(alert.details).length > 0 ? `
          <div style="background: white; padding: 15px; border-radius: 6px; margin-bottom: 15px;">
            <strong>Details:</strong>
            <pre style="margin: 10px 0 0 0; overflow-x: auto; font-size: 12px;">${JSON.stringify(alert.details, null, 2)}</pre>
          </div>
        ` : ''}

        ${alert.error_stack ? `
          <div style="background: white; padding: 15px; border-radius: 6px; margin-bottom: 15px;">
            <strong>Error Stack:</strong>
            <pre style="margin: 10px 0 0 0; overflow-x: auto; font-size: 11px; max-height: 300px;">${escapeHtml(alert.error_stack)}</pre>
          </div>
        ` : ''}

        ${alert.user_agent ? `
          <div style="background: white; padding: 15px; border-radius: 6px; font-size: 12px;">
            <strong>User Agent:</strong>
            <p style="margin: 5px 0 0 0; word-break: break-all;">${escapeHtml(alert.user_agent)}</p>
          </div>
        ` : ''}

        <div style="margin-top: 20px; display: flex; gap: 10px;">
          ${!alert.resolved ? `
            <button class="btn btn-success" onclick="resolveAlertAction(${alert.id}); return false;">Mark as Resolved</button>
          ` : `
            <button class="btn btn-warning" onclick="unresolveAlertAction(${alert.id}); return false;">Mark as Unresolved</button>
          `}
          <button class="btn btn-danger" onclick="deleteAlertAction(${alert.id}); return false;">Delete Alert</button>
          <button class="btn btn-secondary" onclick="closeAlertModal();">Close</button>
        </div>
      </div>
    `;

    openAlertModal();
  } catch (error) {
    console.error('Error loading alert details:', error);
    showResult('alertsResult', 'Error loading alert details', 'error');
  }
}

async function resolveAlertAction(id) {
  try {
    await makeRequest(`/api/admin/alerts/${id}/resolve`, { method: 'PUT' });
    
    // Invalidate cache to force refresh
    invalidateAlertCaches();
    
    showResult('alertsResult', 'Alert marked as resolved', 'success');
    closeAlertModal();
    loadSystemAlerts();
  } catch (error) {
    showResult('alertsResult', `Error: ${error.message}`, 'error');
  }
}

async function unresolveAlertAction(id) {
  try {
    await makeRequest(`/api/admin/alerts/${id}/unresolve`, { method: 'PUT' });
    
    // Invalidate cache to force refresh
    invalidateAlertCaches();
    
    showResult('alertsResult', 'Alert marked as unresolved', 'success');
    closeAlertModal();
    loadSystemAlerts();
  } catch (error) {
    showResult('alertsResult', `Error: ${error.message}`, 'error');
  }
}

async function deleteAlertAction(id) {
  if (!confirm('Are you sure you want to delete this alert?')) return;

  try {
    await makeRequest(`/api/admin/alerts/${id}`, { method: 'DELETE' });
    
    // Invalidate cache to force refresh
    invalidateAlertCaches();
    
    showResult('alertsResult', 'Alert deleted successfully', 'success');
    closeAlertModal();
    loadSystemAlerts();
  } catch (error) {
    showResult('alertsResult', `Error: ${error.message}`, 'error');
  }
}

async function deleteResolvedAlerts() {
  if (!confirm('Are you sure you want to delete ALL resolved alerts? This cannot be undone.')) return;

  try {
    const result = await makeRequest('/api/admin/alerts/bulk/resolved', { method: 'DELETE' });
    
    // Invalidate cache to force refresh
    invalidateAlertCaches();
    
    showResult('alertsResult', `${result.deleted_count} resolved alerts deleted successfully`, 'success');
    loadSystemAlerts();
  } catch (error) {
    showResult('alertsResult', `Error: ${error.message}`, 'error');
  }
}

function openAlertModal() {
  document.getElementById('alertModal').style.display = 'block';
}

function closeAlertModal() {
  document.getElementById('alertModal').style.display = 'none';
}

function getAlertTypeBadge(type) {
  const badges = {
    critical: 'danger',
    error: 'danger',
    warning: 'warning',
    info: 'info',
  };
  return badges[type] || 'secondary';
}

function getAlertSeverityBadge(severity) {
  const badges = {
    critical: 'danger',
    high: 'danger',
    medium: 'warning',
    low: 'info',
  };
  return badges[severity] || 'secondary';
}

// Event listeners for System Alerts
document.getElementById('applyAlertFiltersBtn')?.addEventListener('click', loadAlertsList);
document.getElementById('deleteResolvedAlertsBtn')?.addEventListener('click', deleteResolvedAlerts);
document.getElementById('closeAlertModal')?.addEventListener('click', closeAlertModal);

// ==========================================
// Announcements Management
// ==========================================

async function loadAnnouncements() {
  const container = document.getElementById('announcementsList');

  try {
    container.innerHTML = '<div class="loading">Loading announcements...</div>';
    const announcements = await makeRequest('/api/admin/announcements');
    displayAnnouncements(announcements);
  } catch (error) {
    console.error('Load announcements error:', error);
    container.innerHTML = createEmptyState('Error loading announcements', error.message);
    showResult('announcementsResult', error.message, 'error');
  }
}

function displayAnnouncements(announcements) {
  const container = document.getElementById('announcementsList');

  if (announcements.length === 0) {
    container.innerHTML = createEmptyState(
      'No announcements found',
      'Create your first announcement to communicate with app users'
    );
    return;
  }

  container.innerHTML = announcements.map(ann => {
    const typeColors = {
      maintenance: '#FF8F00',
      announcement: '#005544',
      warning: '#FFC107',
      success: '#4CAF50',
    };

    const typeColor = typeColors[ann.type] || '#005544';
    const isActive = ann.active;
    const statusBadge = isActive
      ? '<span class="badge badge-success">ACTIVE</span>'
      : '<span class="badge badge-secondary">Inactive</span>';

    const hasArabic = ann.title_ar || ann.message_ar;
    const langBadge = hasArabic
      ? '<span class="badge" style="background: #4CAF50; color: white;">EN+AR</span>'
      : '<span class="badge" style="background: #999; color: white;">EN only</span>';

    const fmtDate = (dateStr) => {
      if (!dateStr) return 'Not set';
      return new Date(dateStr).toLocaleString();
    };

    return `
      <div class="list-item" style="border-left-color: ${typeColor};">
        <div class="list-item-header">
          <div>
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
              <span class="list-item-title">${escapeHtml(ann.title)}</span>
              ${statusBadge}
              ${langBadge}
              <span class="badge badge-${ann.priority === 'high' ? 'danger' : ann.priority === 'low' ? 'info' : 'secondary'}">${ann.priority.toUpperCase()}</span>
            </div>
            <div style="font-size: 13px; color: #666; margin-bottom: 5px;">
              Type: <strong style="color: ${typeColor};">${capitalizeFirst(ann.type)}</strong>
            </div>
            <div style="font-size: 13px; color: #666;">
              ${ann.message.substring(0, 100)}${ann.message.length > 100 ? '...' : ''}
            </div>
            ${ann.button_text ? `<div style="font-size: 12px; color: #888; margin-top: 5px;">Button: "${ann.button_text}"</div>` : ''}
            <div style="font-size: 12px; color: #888; margin-top: 8px;">
              <span>Start: ${fmtDate(ann.start_date)}</span> |
              <span>End: ${fmtDate(ann.end_date)}</span>
            </div>
            <div style="font-size: 12px; color: #888;">
              Dismissable: ${ann.dismissable ? 'Yes' : 'No'} |
              Created: ${fmtDate(ann.created_at)}
            </div>
          </div>
          <div class="list-item-actions">
            <button onclick="toggleAnnouncementStatus(${ann.id}, ${isActive})" class="btn btn-sm ${isActive ? 'btn-secondary' : 'btn-success'}">
              ${isActive ? 'Deactivate' : 'Activate'}
            </button>
            <button onclick="editAnnouncement(${ann.id})" class="btn btn-sm btn-primary">Edit</button>
            <button onclick="deleteAnnouncement(${ann.id})" class="btn btn-sm btn-danger">Delete</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function showAddAnnouncementModal() {
  document.getElementById('announcementModalTitle').textContent = 'Create Announcement';
  document.getElementById('announcementForm').reset();
  document.getElementById('announcementId').value = '';
  document.getElementById('announcementModal').style.display = 'block';
}

function closeAnnouncementModal() {
  document.getElementById('announcementModal').style.display = 'none';
}

async function editAnnouncement(id) {
  try {
    const ann = await makeRequest(`/api/admin/announcements/${id}`);

    document.getElementById('announcementModalTitle').textContent = 'Edit Announcement';
    document.getElementById('announcementId').value = ann.id;
    document.getElementById('announcementType').value = ann.type;
    document.getElementById('announcementTitle').value = ann.title;
    document.getElementById('announcementTitleAr').value = ann.title_ar || '';
    document.getElementById('announcementMessage').value = ann.message;
    document.getElementById('announcementMessageAr').value = ann.message_ar || '';
    document.getElementById('announcementButtonText').value = ann.button_text || '';
    document.getElementById('announcementButtonTextAr').value = ann.button_text_ar || '';
    document.getElementById('announcementPriority').value = ann.priority;
    document.getElementById('announcementDismissable').checked = ann.dismissable;
    document.getElementById('announcementActive').checked = ann.active;

    if (ann.start_date) {
      document.getElementById('announcementStartDate').value = formatDateTimeLocal(ann.start_date);
    }
    if (ann.end_date) {
      document.getElementById('announcementEndDate').value = formatDateTimeLocal(ann.end_date);
    }

    document.getElementById('announcementModal').style.display = 'block';
  } catch (error) {
    console.error('Edit announcement error:', error);
    showResult('announcementsResult', error.message, 'error');
  }
}

async function saveAnnouncement(event) {
  event.preventDefault();

  const id = document.getElementById('announcementId').value;
  const data = {
    type: document.getElementById('announcementType').value,
    title: document.getElementById('announcementTitle').value,
    title_ar: document.getElementById('announcementTitleAr').value || null,
    message: document.getElementById('announcementMessage').value,
    message_ar: document.getElementById('announcementMessageAr').value || null,
    button_text: document.getElementById('announcementButtonText').value || null,
    button_text_ar: document.getElementById('announcementButtonTextAr').value || null,
    priority: document.getElementById('announcementPriority').value,
    dismissable: document.getElementById('announcementDismissable').checked,
    active: document.getElementById('announcementActive').checked,
    start_date: document.getElementById('announcementStartDate').value || null,
    end_date: document.getElementById('announcementEndDate').value || null,
  };

  try {
    const endpoint = id ? `/api/admin/announcements/${id}` : '/api/admin/announcements';
    const method = id ? 'PUT' : 'POST';

    await makeRequest(endpoint, { method, body: JSON.stringify(data) });

    closeAnnouncementModal();
    showResult('announcementsResult', `Announcement ${id ? 'updated' : 'created'} successfully`, 'success');
    loadAnnouncements();
  } catch (error) {
    console.error('Save announcement error:', error);
    showResult('announcementsResult', error.message, 'error');
  }
}

async function toggleAnnouncementStatus(id, currentStatus) {
  if (currentStatus && !confirm('Deactivating will hide this announcement from all users. Continue?')) {
    return;
  }
  if (!currentStatus && !confirm('Activating will show this announcement to all users and deactivate any currently active announcement. Continue?')) {
    return;
  }

  try {
    const result = await makeRequest(`/api/admin/announcements/${id}/toggle`, { method: 'PATCH' });
    showResult('announcementsResult', result.message, 'success');
    loadAnnouncements();
  } catch (error) {
    console.error('Toggle status error:', error);
    showResult('announcementsResult', error.message, 'error');
  }
}

async function deleteAnnouncement(id) {
  if (!confirm('Are you sure you want to delete this announcement? This action cannot be undone.')) {
    return;
  }

  try {
    await makeRequest(`/api/admin/announcements/${id}`, { method: 'DELETE' });
    showResult('announcementsResult', 'Announcement deleted successfully', 'success');
    loadAnnouncements();
  } catch (error) {
    console.error('Delete announcement error:', error);
    showResult('announcementsResult', error.message, 'error');
  }
}

function formatDateTimeLocal(dateStr) {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ==========================================
// App Versions Management
// ==========================================

async function loadAppVersionsTab() {
  try {
    const stats = await makeRequest('/api/admin/app-versions/stats');
    displayVersionStats(stats);

    const platforms = ['ios', 'android'];
    for (const platform of platforms) {
      try {
        const version = await makeRequest(`/api/admin/app-versions/${platform}`);
        populateVersionForm(platform, version);
      } catch (err) {
        console.error(`Error loading ${platform} version:`, err);
      }
    }
  } catch (error) {
    console.error('Load app versions error:', error);
    showResult('appVersionsResult', error.message, 'error');
  }
}

function displayVersionStats(stats) {
  const container = document.getElementById('versionStatsContainer');

  if (!stats || stats.length === 0) {
    container.innerHTML = '<p style="color: #666;">No statistics available</p>';
    return;
  }

  container.innerHTML = stats.map(stat => {
    const platformColor = stat.platform === 'ios' ? '#000000' : '#3DDC84';
    const platformName = stat.platform === 'ios' ? 'iOS' : 'Android';
    const updateRate = stat.total_users > 0
      ? ((stat.users_on_latest / stat.total_users) * 100).toFixed(1)
      : 0;
    const needsUpdate = stat.users_below_minimum || 0;

    return `
      <div class="stat-card" style="background: linear-gradient(135deg, ${platformColor} 0%, ${stat.platform === 'ios' ? '#4A4A4A' : '#07C160'} 100%);">
        <h4>${platformName} Users</h4>
        <p class="stat-number">${stat.total_users || 0}</p>
        <div style="font-size: 13px; margin-top: 10px; opacity: 0.9;">
          ${stat.users_on_latest || 0} on latest (${updateRate}%)
        </div>
        ${needsUpdate > 0 ? `<div style="font-size: 12px; margin-top: 5px; opacity: 0.85; color: #FFD54F;">${needsUpdate} need update</div>` : ''}
      </div>
    `;
  }).join('');
}

function populateVersionForm(platform, version) {
  const prefix = platform === 'ios' ? 'ios' : 'android';

  document.getElementById(`${prefix}LatestVersion`).value = version.latest_version || '';
  document.getElementById(`${prefix}MinVersion`).value = version.min_supported_version || '';
  document.getElementById(`${prefix}ReleaseNotes`).value = version.release_notes || '';
  document.getElementById(`${prefix}ReleaseNotesAr`).value = version.release_notes_ar || '';
  document.getElementById(`${prefix}StoreUrl`).value = version.store_url || '';
}

async function updateIOSVersion(event) {
  event.preventDefault();
  await updatePlatformVersion('ios');
}

async function updateAndroidVersion(event) {
  event.preventDefault();
  await updatePlatformVersion('android');
}

async function updatePlatformVersion(platform) {
  const prefix = platform === 'ios' ? 'ios' : 'android';
  const platformName = platform === 'ios' ? 'iOS' : 'Android';

  const data = {
    latest_version: document.getElementById(`${prefix}LatestVersion`).value,
    min_supported_version: document.getElementById(`${prefix}MinVersion`).value,
    release_notes: document.getElementById(`${prefix}ReleaseNotes`).value || null,
    release_notes_ar: document.getElementById(`${prefix}ReleaseNotesAr`).value || null,
    store_url: document.getElementById(`${prefix}StoreUrl`).value,
  };

  const versionRegex = /^\d+\.\d+\.\d+$/;
  if (!versionRegex.test(data.latest_version)) {
    showResult('appVersionsResult', 'Invalid latest version format. Use X.Y.Z (e.g., 2.0.0)', 'error');
    return;
  }
  if (!versionRegex.test(data.min_supported_version)) {
    showResult('appVersionsResult', 'Invalid minimum version format. Use X.Y.Z (e.g., 1.5.0)', 'error');
    return;
  }

  if (compareVersions(data.min_supported_version, data.latest_version) > 0) {
    showResult('appVersionsResult', 'Minimum version cannot be higher than latest version', 'error');
    return;
  }

  try {
    await makeRequest(`/api/admin/app-versions/${platform}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });

    showResult('appVersionsResult', `${platformName} version updated successfully!`, 'success');
    loadAppVersionsTab();
  } catch (error) {
    console.error('Update version error:', error);
    showResult('appVersionsResult', error.message, 'error');
  }
}

function compareVersions(v1, v2) {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);

  for (let i = 0; i < 3; i++) {
    if (parts1[i] > parts2[i]) return 1;
    if (parts1[i] < parts2[i]) return -1;
  }
  return 0;
}

// ==========================================
// Taxi Contributions Management
// ==========================================

function formatNumber(num) {
  return new Intl.NumberFormat('en-US').format(num);
}

async function loadTaxiContributions() {
  const container = document.getElementById('taxiContributionsList');

  try {
    container.innerHTML = '<div class="loading">Loading taxi contributions...</div>';
    const result = await makeRequest('/api/admin/taxi-contributions');
    displayTaxiContributions(result.data || []);
  } catch (error) {
    console.error('Load taxi contributions error:', error);
    container.innerHTML = createEmptyState('Error loading taxi contributions', error.message);
    showResult('taxiContributionsResult', error.message, 'error');
  }
}

function displayTaxiContributions(contributions) {
  const container = document.getElementById('taxiContributionsList');

  if (contributions.length === 0) {
    container.innerHTML = createEmptyState(
      'No taxi contributions found',
      'Add your first taxi contribution entry'
    );
    return;
  }

  const ownerContributions = contributions.filter(c => c.type === 'owner');
  const nonOwnerContributions = contributions.filter(c => c.type === 'non_owner');

  let html = `
    <div class="stats-grid" style="margin-bottom: 25px;">
      <div class="stat-card">
        <div class="stat-label">Total Entries</div>
        <div class="stat-value">${contributions.length}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Owner Entries</div>
        <div class="stat-value">${ownerContributions.length}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Non-Owner Entries</div>
        <div class="stat-value">${nonOwnerContributions.length}</div>
      </div>
    </div>
  `;

  if (ownerContributions.length > 0) {
    html += `
      <div style="margin-bottom: 30px;">
        <h3 style="color: #005544; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #005544;">
          Owner Contributions
        </h3>
        ${ownerContributions.map(contrib => createContributionItem(contrib)).join('')}
      </div>
    `;
  }

  if (nonOwnerContributions.length > 0) {
    html += `
      <div style="margin-bottom: 30px;">
        <h3 style="color: #005544; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #005544;">
          Non-Owner Contributions
        </h3>
        ${nonOwnerContributions.map(contrib => createContributionItem(contrib)).join('')}
      </div>
    `;
  }

  container.innerHTML = html;
}

function createContributionItem(contrib) {
  const typeBadge = contrib.type === 'owner'
    ? '<span class="badge badge-success">OWNER</span>'
    : '<span class="badge badge-info">NON-OWNER</span>';

  return `
    <div class="list-item">
      <div class="list-item-header">
        <div>
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
            <span class="list-item-title">${escapeHtml(contrib.branch_name_en)}</span>
            ${typeBadge}
          </div>
          <div style="font-size: 13px; color: #666; margin-bottom: 5px;">
            Arabic: <strong>${escapeHtml(contrib.branch_name_ar)}</strong>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 10px;">
            <div style="font-size: 13px; color: #666;">
              Monthly: <strong style="color: #005544;">${formatNumber(contrib.monthly_contribution)} LBP</strong>
            </div>
            <div style="font-size: 13px; color: #666;">
              Daily: <strong style="color: #005544;">${formatNumber(contrib.daily_contribution)} LBP</strong>
            </div>
          </div>
          <div style="font-size: 12px; color: #888; margin-top: 8px;">
            Display Order: ${contrib.display_order} |
            Created: ${new Date(contrib.created_at).toLocaleString()}
          </div>
        </div>
        <div class="list-item-actions">
          <button onclick="editTaxiContribution(${contrib.id})" class="btn btn-sm btn-primary">Edit</button>
          <button onclick="deleteTaxiContribution(${contrib.id})" class="btn btn-sm btn-danger">Delete</button>
        </div>
      </div>
    </div>
  `;
}

function showAddTaxiContributionModal() {
  document.getElementById('taxiContributionModalTitle').textContent = 'Add Taxi Contribution';
  document.getElementById('taxiContributionForm').reset();
  document.getElementById('taxiContributionId').value = '';
  document.getElementById('taxiContributionDisplayOrder').value = '0';
  document.getElementById('taxiContributionModal').style.display = 'block';
}

function closeTaxiContributionModal() {
  document.getElementById('taxiContributionModal').style.display = 'none';
  document.getElementById('taxiContributionForm').reset();
}

async function editTaxiContribution(id) {
  try {
    const result = await makeRequest(`/api/admin/taxi-contributions/${id}`);
    const contrib = result.data;

    document.getElementById('taxiContributionModalTitle').textContent = 'Edit Taxi Contribution';
    document.getElementById('taxiContributionId').value = contrib.id;
    document.getElementById('taxiContributionType').value = contrib.type;
    document.getElementById('taxiContributionBranchNameEn').value = contrib.branch_name_en;
    document.getElementById('taxiContributionBranchNameAr').value = contrib.branch_name_ar;
    document.getElementById('taxiContributionMonthly').value = contrib.monthly_contribution;
    document.getElementById('taxiContributionDaily').value = contrib.daily_contribution;
    document.getElementById('taxiContributionDisplayOrder').value = contrib.display_order || 0;
    document.getElementById('taxiContributionModal').style.display = 'block';
  } catch (error) {
    console.error('Edit taxi contribution error:', error);
    showResult('taxiContributionsResult', error.message, 'error');
  }
}

async function deleteTaxiContribution(id) {
  if (!confirm('Are you sure you want to delete this taxi contribution?')) {
    return;
  }

  try {
    await makeRequest(`/api/admin/taxi-contributions/${id}`, { method: 'DELETE' });
    showResult('taxiContributionsResult', 'Taxi contribution deleted successfully', 'success');
    loadTaxiContributions();
  } catch (error) {
    console.error('Delete taxi contribution error:', error);
    showResult('taxiContributionsResult', error.message, 'error');
  }
}

async function handleSaveTaxiContribution(e) {
  e.preventDefault();

  const id = document.getElementById('taxiContributionId').value;
  const isEdit = !!id;

  const formData = {
    type: document.getElementById('taxiContributionType').value,
    branch_name_en: document.getElementById('taxiContributionBranchNameEn').value,
    branch_name_ar: document.getElementById('taxiContributionBranchNameAr').value,
    monthly_contribution: document.getElementById('taxiContributionMonthly').value,
    daily_contribution: document.getElementById('taxiContributionDaily').value,
    display_order: document.getElementById('taxiContributionDisplayOrder').value || 0,
  };

  try {
    const endpoint = isEdit
      ? `/api/admin/taxi-contributions/${id}`
      : '/api/admin/taxi-contributions';
    const method = isEdit ? 'PUT' : 'POST';

    await makeRequest(endpoint, { method, body: JSON.stringify(formData) });

    showResult('taxiContributionsResult', `Taxi contribution ${isEdit ? 'updated' : 'created'} successfully`, 'success');
    closeTaxiContributionModal();
    loadTaxiContributions();
  } catch (error) {
    console.error('Save taxi contribution error:', error);
    showResult('taxiContributionsResult', error.message, 'error');
  }
}

// Close modal when clicking outside
window.onclick = function (event) {
  const serviceModal = document.getElementById('serviceModal');
  const disclaimerModal = document.getElementById('disclaimerModal');
  const adminUserModal = document.getElementById('adminUserModal');
  const feedbackModal = document.getElementById('feedbackModal');
  const alertModal = document.getElementById('alertModal');
  const announcementModal = document.getElementById('announcementModal');
  const taxiContributionModal = document.getElementById('taxiContributionModal');

  if (event.target === serviceModal) {
    closeServiceModal();
  }
  if (event.target === disclaimerModal) {
    closeDisclaimerModal();
  }
  if (event.target === adminUserModal) {
    closeAdminUserModal();
  }
  if (event.target === feedbackModal) {
    closeFeedbackModal();
  }
  if (event.target === alertModal) {
    closeAlertModal();
  }
  if (event.target === announcementModal) {
    closeAnnouncementModal();
  }
  if (event.target === taxiContributionModal) {
    closeTaxiContributionModal();
  }
};


// ==========================================
// DB Cleanup Tab
// ==========================================

const CLEANUP_PROCEDURES = {
  duplicates:  { method: 'GET',  endpoint: '/api/admin/cleanup/duplicates', destructive: false, param: null },
  preview:     { method: 'GET',  endpoint: '/api/admin/cleanup/preview',    destructive: false, param: null },
  execute:     { method: 'POST', endpoint: '/api/admin/cleanup/execute',    destructive: true,  param: null },
  'by-token':  { method: 'POST', endpoint: '/api/admin/cleanup/by-token',  destructive: true,  param: 'token' },
  siblings:    { method: 'GET',  endpoint: '/api/admin/cleanup/siblings',   destructive: false, param: 'uuid' },
  orphans:     { method: 'POST', endpoint: '/api/admin/cleanup/orphans',    destructive: true,  param: null },
};

async function loadCleanup() {
  // No auto-execution on tab load — user picks a procedure
  document.getElementById('cleanupResultsArea').innerHTML =
    '<p style="color: #888; text-align: center; padding: 40px 0;">Select a procedure and click "Run Procedure" to see results.</p>';
  document.getElementById('cleanupResult').style.display = 'none';
}

function onCleanupProcedureChange() {
  const selected = document.getElementById('cleanupProcedureSelect').value;
  const tokenInput = document.getElementById('cleanupTokenInput');
  const uuidInput = document.getElementById('cleanupUuidInput');
  const runBtn = document.getElementById('runCleanupBtn');

  tokenInput.style.display = 'none';
  uuidInput.style.display = 'none';

  if (!selected) {
    runBtn.disabled = true;
    return;
  }

  runBtn.disabled = false;
  const proc = CLEANUP_PROCEDURES[selected];
  if (proc.param === 'token') tokenInput.style.display = 'block';
  if (proc.param === 'uuid') uuidInput.style.display = 'block';
}

async function runCleanupProcedure() {
  const selected = document.getElementById('cleanupProcedureSelect').value;
  if (!selected) return;

  const proc = CLEANUP_PROCEDURES[selected];
  const resultMsg = document.getElementById('cleanupResult');
  const resultsArea = document.getElementById('cleanupResultsArea');

  // Confirm destructive operations
  if (proc.destructive) {
    const label = document.getElementById('cleanupProcedureSelect').selectedOptions[0].text;
    if (!confirm(`This is a DESTRUCTIVE operation:\n\n"${label}"\n\nAre you sure you want to proceed?`)) {
      return;
    }
  }

  // Validate required parameters
  if (proc.param === 'token') {
    const token = document.getElementById('cleanupPushToken').value.trim();
    if (!token) {
      resultMsg.textContent = 'Please enter a push token.';
      resultMsg.className = 'result-message error';
      resultMsg.style.display = 'block';
      return;
    }
  }
  if (proc.param === 'uuid') {
    const uuid = document.getElementById('cleanupDeviceUuid').value.trim();
    if (!uuid) {
      resultMsg.textContent = 'Please enter a device UUID.';
      resultMsg.className = 'result-message error';
      resultMsg.style.display = 'block';
      return;
    }
  }

  // Build request
  let endpoint = proc.endpoint;
  const options = { method: proc.method };

  if (proc.param === 'token') {
    options.body = JSON.stringify({ token: document.getElementById('cleanupPushToken').value.trim() });
  }
  if (proc.param === 'uuid') {
    const uuid = document.getElementById('cleanupDeviceUuid').value.trim();
    endpoint += `?uuid=${encodeURIComponent(uuid)}`;
  }

  // Execute
  resultsArea.innerHTML = '<p style="text-align: center; padding: 20px;">Running procedure...</p>';
  resultMsg.style.display = 'none';

  try {
    const response = await makeRequest(endpoint, options);

    if (!response.success) {
      throw new Error(response.error || 'Procedure failed');
    }

    const data = response.data;
    if (!data || data.length === 0) {
      resultsArea.innerHTML = '<p style="color: #888; text-align: center; padding: 20px;">No results returned.</p>';
      resultMsg.textContent = 'Procedure executed successfully — 0 rows returned.';
    } else {
      resultsArea.innerHTML = renderCleanupResultTable(data);
      resultMsg.textContent = `Procedure executed successfully — ${data.length} row(s) returned.`;
    }
    resultMsg.className = 'result-message success';
    resultMsg.style.display = 'block';
  } catch (err) {
    console.error('Cleanup procedure error:', err);
    resultsArea.innerHTML = '';
    resultMsg.textContent = `Error: ${err.message}`;
    resultMsg.className = 'result-message error';
    resultMsg.style.display = 'block';
  }
}

function renderCleanupResultTable(data) {
  if (!data || data.length === 0) return '';

  const columns = Object.keys(data[0]);
  let html = '<div style="overflow-x: auto;"><table class="data-table"><thead><tr>';
  columns.forEach(col => {
    html += `<th>${col}</th>`;
  });
  html += '</tr></thead><tbody>';

  data.forEach(row => {
    html += '<tr>';
    columns.forEach(col => {
      const val = row[col];
      html += `<td>${val !== null && val !== undefined ? val : '<em>NULL</em>'}</td>`;
    });
    html += '</tr>';
  });

  html += '</tbody></table></div>';
  return html;
}
