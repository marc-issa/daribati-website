// App Version Management Functions

// Load app versions and stats
async function loadAppVersions() {
  try {
    const sessionToken = localStorage.getItem('admin_session_token');
    
    // Load version stats
    const statsResponse = await fetch('/api/admin/app-versions/stats', {
      headers: {
        'Content-Type': 'application/json',
        'x-session-token': sessionToken,
      },
      credentials: 'include',
    });

    if (statsResponse.ok) {
      const stats = await statsResponse.json();
      displayVersionStats(stats);
    }

    // Load current versions for both platforms
    const platforms = ['ios', 'android'];
    
    for (const platform of platforms) {
      const response = await fetch(`/api/admin/app-versions/${platform}`, {
        headers: {
          'Content-Type': 'application/json',
          'x-session-token': sessionToken,
        },
        credentials: 'include',
      });

      if (response.ok) {
        const version = await response.json();
        populateVersionForm(platform, version);
      }
    }
  } catch (error) {
    console.error('Load app versions error:', error);
    showResult('appVersionsResult', error.message, 'error');
  }
}

// Display version stats
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
        ${needsUpdate > 0 ? `<div style="font-size: 12px; margin-top: 5px; opacity: 0.85; color: #FFD54F;">⚠️ ${needsUpdate} need update</div>` : ''}
      </div>
    `;
  }).join('');
}

// Populate version form with current data
function populateVersionForm(platform, version) {
  const prefix = platform === 'ios' ? 'ios' : 'android';
  
  document.getElementById(`${prefix}LatestVersion`).value = version.latest_version || '';
  document.getElementById(`${prefix}MinVersion`).value = version.min_supported_version || '';
  document.getElementById(`${prefix}ReleaseNotes`).value = version.release_notes || '';
  document.getElementById(`${prefix}ReleaseNotesAr`).value = version.release_notes_ar || '';
  document.getElementById(`${prefix}StoreUrl`).value = version.store_url || '';
}

// Update iOS version
async function updateIOSVersion(event) {
  event.preventDefault();
  await updatePlatformVersion('ios');
}

// Update Android version
async function updateAndroidVersion(event) {
  event.preventDefault();
  await updatePlatformVersion('android');
}

// Update platform version
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

  // Validate versions
  const versionRegex = /^\d+\.\d+\.\d+$/;
  if (!versionRegex.test(data.latest_version)) {
    showResult('appVersionsResult', 'Invalid latest version format. Use X.Y.Z (e.g., 2.0.0)', 'error');
    return;
  }
  if (!versionRegex.test(data.min_supported_version)) {
    showResult('appVersionsResult', 'Invalid minimum version format. Use X.Y.Z (e.g., 1.5.0)', 'error');
    return;
  }

  // Compare versions to ensure min <= latest
  if (compareVersions(data.min_supported_version, data.latest_version) > 0) {
    showResult('appVersionsResult', 'Minimum version cannot be higher than latest version', 'error');
    return;
  }

  try {
    const sessionToken = localStorage.getItem('admin_session_token');
    const response = await fetch(`/api/admin/app-versions/${platform}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-session-token': sessionToken,
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update version');
    }

    const result = await response.json();
    showResult('appVersionsResult', `${platformName} version updated successfully!`, 'success');
    
    // Reload stats
    loadAppVersions();
  } catch (error) {
    console.error('Update version error:', error);
    showResult('appVersionsResult', error.message, 'error');
  }
}

// Compare semantic versions (returns -1 if v1 < v2, 0 if equal, 1 if v1 > v2)
function compareVersions(v1, v2) {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  
  for (let i = 0; i < 3; i++) {
    if (parts1[i] > parts2[i]) return 1;
    if (parts1[i] < parts2[i]) return -1;
  }
  return 0;
}

// Helper functions
function showResult(elementId, message, type) {
  const resultDiv = document.getElementById(elementId);
  if (!resultDiv) return;

  resultDiv.className = `result-message ${type}`;
  resultDiv.innerHTML = `
    ${message}
    <button class="close-notification" onclick="this.parentElement.style.display='none'">&times;</button>
  `;
  resultDiv.style.display = 'block';

  setTimeout(() => {
    resultDiv.style.display = 'none';
  }, 5000);
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  // iOS form
  const iosForm = document.getElementById('iosVersionForm');
  if (iosForm) {
    iosForm.addEventListener('submit', updateIOSVersion);
  }

  // Android form
  const androidForm = document.getElementById('androidVersionForm');
  if (androidForm) {
    androidForm.addEventListener('submit', updateAndroidVersion);
  }
});

