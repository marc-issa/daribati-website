// Taxi Contributions Management Functions

// Helper function for number formatting
function formatNumber(num) {
  return new Intl.NumberFormat('en-US').format(num);
}

// Load taxi contributions
async function loadTaxiContributions() {
  const container = document.getElementById('taxiContributionsList');
  
  try {
    // Show loading state
    container.innerHTML = '<div class="loading">Loading taxi contributions...</div>';
    
    const sessionToken = localStorage.getItem('admin_session_token');
    const response = await fetch(`${apiBaseUrl}/api/admin/taxi-contributions`, {
      headers: {
        'Content-Type': 'application/json',
        'x-session-token': sessionToken,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || 'Failed to load taxi contributions');
    }

    const result = await response.json();
    displayTaxiContributions(result.data || []);
  } catch (error) {
    console.error('Load taxi contributions error:', error);
    container.innerHTML = createEmptyState('Error loading taxi contributions', error.message);
    showResult('taxiContributionsResult', error.message, 'error');
  }
}

// Display taxi contributions
function displayTaxiContributions(contributions) {
  const container = document.getElementById('taxiContributionsList');
  
  if (contributions.length === 0) {
    container.innerHTML = createEmptyState(
      'No taxi contributions found',
      'Add your first taxi contribution entry'
    );
    return;
  }

  // Group by type
  const ownerContributions = contributions.filter(c => c.type === 'owner');
  const nonOwnerContributions = contributions.filter(c => c.type === 'non_owner');

  // Calculate statistics
  const totalEntries = contributions.length;
  const ownerCount = ownerContributions.length;
  const nonOwnerCount = nonOwnerContributions.length;

  let html = `
    <!-- Statistics Section -->
    <div class="stats-grid" style="margin-bottom: 25px;">
      <div class="stat-card">
        <div class="stat-label">Total Entries</div>
        <div class="stat-value">${totalEntries}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Owner Entries</div>
        <div class="stat-value">${ownerCount}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Non-Owner Entries</div>
        <div class="stat-value">${nonOwnerCount}</div>
      </div>
    </div>
  `;

  // Owner Contributions Section
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

  // Non-Owner Contributions Section
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

// Create contribution item HTML
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
            Created: ${formatDate(contrib.created_at)}
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

// Show add taxi contribution modal
function showAddTaxiContributionModal() {
  document.getElementById('taxiContributionModalTitle').textContent = 'Add Taxi Contribution';
  document.getElementById('taxiContributionForm').reset();
  document.getElementById('taxiContributionId').value = '';
  document.getElementById('taxiContributionDisplayOrder').value = '0';
  document.getElementById('taxiContributionModal').style.display = 'block';
}

// Edit taxi contribution
async function editTaxiContribution(id) {
  try {
    const sessionToken = localStorage.getItem('admin_session_token');
    const response = await fetch(`${apiBaseUrl}/api/admin/taxi-contributions/${id}`, {
      headers: {
        'Content-Type': 'application/json',
        'x-session-token': sessionToken,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to load taxi contribution');
    }

    const result = await response.json();
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

// Delete taxi contribution
async function deleteTaxiContribution(id) {
  if (!confirm('Are you sure you want to delete this taxi contribution?')) {
    return;
  }

  try {
    const sessionToken = localStorage.getItem('admin_session_token');
    const response = await fetch(`${apiBaseUrl}/api/admin/taxi-contributions/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'x-session-token': sessionToken,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || 'Failed to delete taxi contribution');
    }

    showResult('taxiContributionsResult', 'Taxi contribution deleted successfully', 'success');
    loadTaxiContributions();
  } catch (error) {
    console.error('Delete taxi contribution error:', error);
    showResult('taxiContributionsResult', error.message, 'error');
  }
}

// Handle save taxi contribution form
async function handleSaveTaxiContribution(e) {
  e.preventDefault();

  const form = e.target;
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
    const sessionToken = localStorage.getItem('admin_session_token');
    const url = isEdit
      ? `${apiBaseUrl}/api/admin/taxi-contributions/${id}`
      : `${apiBaseUrl}/api/admin/taxi-contributions`;
    const method = isEdit ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-session-token': sessionToken,
      },
      credentials: 'include',
      body: JSON.stringify(formData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `Failed to ${isEdit ? 'update' : 'create'} taxi contribution`);
    }

    showResult('taxiContributionsResult', `Taxi contribution ${isEdit ? 'updated' : 'created'} successfully`, 'success');
    closeTaxiContributionModal();
    loadTaxiContributions();
  } catch (error) {
    console.error('Save taxi contribution error:', error);
    showResult('taxiContributionsResult', error.message, 'error');
  }
}

// Close taxi contribution modal
function closeTaxiContributionModal() {
  document.getElementById('taxiContributionModal').style.display = 'none';
  document.getElementById('taxiContributionForm').reset();
}

// Setup event listeners when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const addBtn = document.getElementById('addTaxiContributionBtn');
  const form = document.getElementById('taxiContributionForm');
  const closeBtn = document.getElementById('closeTaxiContributionModal');
  const cancelBtn = document.getElementById('cancelTaxiContributionBtn');

  if (addBtn) {
    addBtn.addEventListener('click', showAddTaxiContributionModal);
  }

  if (form) {
    form.addEventListener('submit', handleSaveTaxiContribution);
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', closeTaxiContributionModal);
  }

  if (cancelBtn) {
    cancelBtn.addEventListener('click', closeTaxiContributionModal);
  }

  // Close modal when clicking outside
  const modal = document.getElementById('taxiContributionModal');
  if (modal) {
    window.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeTaxiContributionModal();
      }
    });
  }
});

// Helper functions (if not already defined in app.js)
function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleString();
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function createEmptyState(title, message) {
  return `
    <div style="text-align: center; padding: 40px 20px; color: #666;">
      <div style="font-size: 48px; margin-bottom: 15px;">📋</div>
      <h3 style="color: #333; margin-bottom: 10px;">${title}</h3>
      <p>${message}</p>
    </div>
  `;
}

function showResult(elementId, message, type) {
  const element = document.getElementById(elementId);
  if (!element) return;

  element.textContent = message;
  element.className = `result-message ${type}`;
  element.style.display = 'block';

  // Auto-hide after 5 seconds
  setTimeout(() => {
    element.style.display = 'none';
  }, 5000);
}

