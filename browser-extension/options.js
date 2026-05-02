/**
 * Options page script for MDB Filtering Tool
 * Manages user settings and preferences
 */

// Load saved settings
document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
});

function loadSettings() {
  chrome.storage.sync.get(
    ['keywordFilterEnabled', 'aiFilterEnabled', 'showStats', 'confidenceThreshold'],
    (result) => {
      document.getElementById('keywordFilter').checked = result.keywordFilterEnabled !== false;
      document.getElementById('aiFilter').checked = result.aiFilterEnabled === true;
      document.getElementById('showStats').checked = result.showStats !== false;
      
      const threshold = result.confidenceThreshold || 0.5;
      document.getElementById('threshold').value = threshold;
      document.getElementById('thresholdValue').textContent = threshold.toFixed(1);
    }
  );
}

// Update threshold display
document.getElementById('threshold').addEventListener('input', (e) => {
  document.getElementById('thresholdValue').textContent = parseFloat(e.target.value).toFixed(1);
});

// Save settings
document.getElementById('save').addEventListener('click', () => {
  const settings = {
    keywordFilterEnabled: document.getElementById('keywordFilter').checked,
    aiFilterEnabled: document.getElementById('aiFilter').checked,
    showStats: document.getElementById('showStats').checked,
    confidenceThreshold: parseFloat(document.getElementById('threshold').value)
  };
  
  chrome.storage.sync.set(settings, () => {
    showStatus('✅ Settings saved successfully!', 'success');
    setTimeout(() => {
      document.getElementById('status').style.display = 'none';
    }, 3000);
  });
});

// Reset to defaults
document.getElementById('reset').addEventListener('click', () => {
  if (confirm('Reset all settings to defaults?')) {
    chrome.storage.sync.set({
      keywordFilterEnabled: true,
      aiFilterEnabled: false,
      showStats: true,
      confidenceThreshold: 0.5
    }, () => {
      loadSettings();
      showStatus('✅ Settings reset to defaults', 'success');
    });
  }
});

function showStatus(message, type) {
  const status = document.getElementById('status');
  status.textContent = message;
  status.className = 'status ' + type;
}
