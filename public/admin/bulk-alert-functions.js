// Bulk Alert Operations
function updateBulkActions() {
  const checkboxes = document.querySelectorAll('.alert-checkbox');
  const selectedCheckboxes = document.querySelectorAll('.alert-checkbox:checked');
  const selectAllCheckbox = document.getElementById('selectAllAlerts');
  const bulkActionsBar = document.getElementById('bulkActionsBar');
  const selectedCount = document.getElementById('selectedAlertsCount');

  // Update count
  selectedCount.textContent = selectedCheckboxes.length;

  // Show/hide bulk actions bar
  if (selectedCheckboxes.length > 0) {
    bulkActionsBar.style.display = 'flex';
  } else {
    bulkActionsBar.style.display = 'none';
  }

  // Update select all checkbox state
  if (selectAllCheckbox) {
    selectAllCheckbox.checked = checkboxes.length > 0 && selectedCheckboxes.length === checkboxes.length;
    selectAllCheckbox.indeterminate = selectedCheckboxes.length > 0 && selectedCheckboxes.length < checkboxes.length;
  }
}

function getSelectedAlertIds() {
  const selectedCheckboxes = document.querySelectorAll('.alert-checkbox:checked');
  return Array.from(selectedCheckboxes).map(cb => parseInt(cb.dataset.alertId));
}

async function bulkResolveAlerts() {
  const alertIds = getSelectedAlertIds();
  if (alertIds.length === 0) {
    alert('No alerts selected');
    return;
  }

  if (!confirm(`Resolve ${alertIds.length} selected alert(s)?`)) {
    return;
  }

  try {
    const response = await fetch(`${apiBaseUrl}/api/admin/alerts/bulk/resolve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-session-token': sessionToken,
      },
      body: JSON.stringify({ alert_ids: alertIds }),
    });

    const data = await response.json();

    if (response.ok) {
      // Invalidate alert caches
      if (typeof invalidateAlertCaches !== 'undefined') {
        invalidateAlertCaches();
      }
      
      showResult('alertsResult', `${data.resolved_count} alert(s) resolved successfully`, 'success');
      await loadAlertsList();
      await loadAlertStats();
    } else {
      showResult('alertsResult', data.error || 'Failed to resolve alerts', 'error');
    }
  } catch (error) {
    console.error('Error resolving alerts:', error);
    showResult('alertsResult', 'Failed to resolve alerts', 'error');
  }
}

async function bulkDeleteAlerts() {
  const alertIds = getSelectedAlertIds();
  if (alertIds.length === 0) {
    alert('No alerts selected');
    return;
  }

  if (!confirm(`Delete ${alertIds.length} selected alert(s)? This action cannot be undone.`)) {
    return;
  }

  try {
    const response = await fetch(`${apiBaseUrl}/api/admin/alerts/bulk`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'x-session-token': sessionToken,
      },
      body: JSON.stringify({ alert_ids: alertIds }),
    });

    const data = await response.json();

    if (response.ok) {
      // Invalidate alert caches
      if (typeof invalidateAlertCaches !== 'undefined') {
        invalidateAlertCaches();
      }
      
      showResult('alertsResult', `${data.deleted_count} alert(s) deleted successfully`, 'success');
      await loadAlertsList();
      await loadAlertStats();
    } else {
      showResult('alertsResult', data.error || 'Failed to delete alerts', 'error');
    }
  } catch (error) {
    console.error('Error deleting alerts:', error);
    showResult('alertsResult', 'Failed to delete alerts', 'error');
  }
}

async function bulkChangeSeverity() {
  const severity = document.getElementById('bulkSeveritySelect').value;
  if (!severity) {
    return; // No severity selected
  }

  const alertIds = getSelectedAlertIds();
  if (alertIds.length === 0) {
    alert('No alerts selected');
    return;
  }

  if (!confirm(`Change severity to "${severity.toUpperCase()}" for ${alertIds.length} selected alert(s)?`)) {
    return;
  }

  try {
    const response = await fetch(`${apiBaseUrl}/api/admin/alerts/bulk/severity`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-session-token': sessionToken,
      },
      body: JSON.stringify({ alert_ids: alertIds, severity }),
    });

    const data = await response.json();

    if (response.ok) {
      // Invalidate alert caches
      if (typeof invalidateAlertCaches !== 'undefined') {
        invalidateAlertCaches();
      }
      
      showResult('alertsResult', `Severity updated for ${data.updated_count} alert(s)`, 'success');
      document.getElementById('bulkSeveritySelect').value = ''; // Reset dropdown
      await loadAlertsList();
    } else {
      showResult('alertsResult', data.error || 'Failed to update severity', 'error');
    }
  } catch (error) {
    console.error('Error updating severity:', error);
    showResult('alertsResult', 'Failed to update severity', 'error');
  }
}

// Select/Deselect all alerts
document.getElementById('selectAllAlerts')?.addEventListener('change', function() {
  const checkboxes = document.querySelectorAll('.alert-checkbox');
  checkboxes.forEach(cb => cb.checked = this.checked);
  updateBulkActions();
});

// Bulk action buttons
document.getElementById('bulkResolveBtn')?.addEventListener('click', bulkResolveAlerts);
document.getElementById('bulkDeleteBtn')?.addEventListener('click', bulkDeleteAlerts);
document.getElementById('bulkSeveritySelect')?.addEventListener('change', bulkChangeSeverity);

