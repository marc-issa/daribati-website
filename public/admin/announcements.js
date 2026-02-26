// Announcements Management Functions

// Load announcements
async function loadAnnouncements() {
  const container = document.getElementById('announcementsList');
  
  try {
    // Show loading state
    container.innerHTML = '<div class="loading">Loading announcements...</div>';
    
    const sessionToken = localStorage.getItem('admin_session_token');
    const response = await fetch('/api/admin/announcements', {
      headers: {
        'Content-Type': 'application/json',
        'x-session-token': sessionToken,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || 'Failed to load announcements');
    }

    const announcements = await response.json();
    displayAnnouncements(announcements);
  } catch (error) {
    console.error('Load announcements error:', error);
    container.innerHTML = createEmptyState('Error loading announcements', error.message);
    showResult('announcementsResult', error.message, 'error');
  }
}

// Display announcements
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
    
    // Check if Arabic content is available
    const hasArabic = ann.title_ar || ann.message_ar;
    const langBadge = hasArabic 
      ? '<span class="badge" style="background: #4CAF50; color: white;">🌍 EN+AR</span>'
      : '<span class="badge" style="background: #999; color: white;">EN only</span>';
    
    const formatDate = (dateStr) => {
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
              <span>Start: ${formatDate(ann.start_date)}</span> | 
              <span>End: ${formatDate(ann.end_date)}</span>
            </div>
            <div style="font-size: 12px; color: #888;">
              Dismissable: ${ann.dismissable ? 'Yes' : 'No'} | 
              Created: ${formatDate(ann.created_at)}
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

// Show add announcement modal
function showAddAnnouncementModal() {
  document.getElementById('announcementModalTitle').textContent = 'Create Announcement';
  document.getElementById('announcementForm').reset();
  document.getElementById('announcementId').value = '';
  document.getElementById('announcementModal').style.display = 'block';
}

// Edit announcement
async function editAnnouncement(id) {
  try {
    const sessionToken = localStorage.getItem('admin_session_token');
    const response = await fetch(`/api/admin/announcements/${id}`, {
      headers: {
        'Content-Type': 'application/json',
        'x-session-token': sessionToken,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to load announcement');
    }

    const ann = await response.json();
    
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

// Save announcement
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
    const sessionToken = localStorage.getItem('admin_session_token');
    const url = id ? `/api/admin/announcements/${id}` : '/api/admin/announcements';
    const method = id ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-session-token': sessionToken,
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to save announcement');
    }

    document.getElementById('announcementModal').style.display = 'none';
    showResult('announcementsResult', `Announcement ${id ? 'updated' : 'created'} successfully`, 'success');
    loadAnnouncements();
  } catch (error) {
    console.error('Save announcement error:', error);
    showResult('announcementsResult', error.message, 'error');
  }
}

// Toggle announcement status
async function toggleAnnouncementStatus(id, currentStatus) {
  if (currentStatus && !confirm('Deactivating will hide this announcement from all users. Continue?')) {
    return;
  }
  if (!currentStatus && !confirm('Activating will show this announcement to all users and deactivate any currently active announcement. Continue?')) {
    return;
  }

  try {
    const sessionToken = localStorage.getItem('admin_session_token');
    const response = await fetch(`/api/admin/announcements/${id}/toggle`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-session-token': sessionToken,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to toggle status');
    }

    const result = await response.json();
    showResult('announcementsResult', result.message, 'success');
    loadAnnouncements();
  } catch (error) {
    console.error('Toggle status error:', error);
    showResult('announcementsResult', error.message, 'error');
  }
}

// Delete announcement
async function deleteAnnouncement(id) {
  if (!confirm('Are you sure you want to delete this announcement? This action cannot be undone.')) {
    return;
  }

  try {
    const sessionToken = localStorage.getItem('admin_session_token');
    const response = await fetch(`/api/admin/announcements/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'x-session-token': sessionToken,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete announcement');
    }

    showResult('announcementsResult', 'Announcement deleted successfully', 'success');
    loadAnnouncements();
  } catch (error) {
    console.error('Delete announcement error:', error);
    showResult('announcementsResult', error.message, 'error');
  }
}

// Helper functions
function createEmptyState(title, subtitle) {
  return `
    <div style="
      padding: 60px 20px;
      text-align: center;
      background: white;
      border-radius: 8px;
      border: 2px dashed #dee2e6;
    ">
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1.5" style="margin: 0 auto 20px;">
        <path d="M11 15h2v2h-2zm0-8h2v6h-2zm.99-5C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/>
      </svg>
      <div style="font-size: 18px; color: #495057; margin-bottom: 8px; font-weight: 600;">${title}</div>
      <div style="font-size: 14px; color: #adb5bd;">${subtitle}</div>
    </div>
  `;
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

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showResult(elementId, message, type) {
  const resultDiv = document.getElementById(elementId);
  if (!resultDiv) return;

  resultDiv.className = `result-message ${type}`;
  resultDiv.innerHTML = `
    ${message}
    <button class="close-notification" onclick="this.parentElement.style.display='none'">&times;</button>
  `;
  resultDiv.style.display = 'block';

  // Auto-hide after 5 seconds
  setTimeout(() => {
    resultDiv.style.display = 'none';
  }, 5000);
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  // Add announcement button
  const addBtn = document.getElementById('addAnnouncementBtn');
  if (addBtn) {
    addBtn.addEventListener('click', showAddAnnouncementModal);
  }

  // Close modal button
  const closeBtn = document.getElementById('closeAnnouncementModal');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      document.getElementById('announcementModal').style.display = 'none';
    });
  }

  // Cancel button
  const cancelBtn = document.getElementById('cancelAnnouncementBtn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      document.getElementById('announcementModal').style.display = 'none';
    });
  }

  // Form submission
  const form = document.getElementById('announcementForm');
  if (form) {
    form.addEventListener('submit', saveAnnouncement);
  }
});

