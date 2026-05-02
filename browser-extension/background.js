/**
 * Background Service Worker for MDB Filtering Tool
 * Manages extension state and communication between content scripts and popup
 */

// Initialize extension on install
chrome.runtime.onInstalled.addListener(() => {
  console.log('MDB Filtering Tool installed');
  
  // Set default settings
  chrome.storage.sync.set({
    keywordFilterEnabled: true,
    aiFilterEnabled: false,
    showStats: true,
    blockedCount: 0,
    processedCount: 0
  });
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background received message:', request);
  
  if (request.action === 'updateStats') {
    // Update statistics when messages are processed
    chrome.storage.sync.get(['blockedCount', 'processedCount'], (result) => {
      const newStats = {
        blockedCount: (result.blockedCount || 0) + (request.blocked ? 1 : 0),
        processedCount: (result.processedCount || 0) + 1
      };
      chrome.storage.sync.set(newStats);
      sendResponse({ success: true, stats: newStats });
    });
    return true; // Keep channel open for async response
  }
  
  if (request.action === 'getSettings') {
    chrome.storage.sync.get(['keywordFilterEnabled', 'aiFilterEnabled', 'showStats'], (result) => {
      sendResponse(result);
    });
    return true;
  }
  
  sendResponse({ success: false, message: 'Unknown action' });
});

// Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Notify popup when tab content changes
  if (changeInfo.status === 'complete') {
    chrome.runtime.sendMessage({
      action: 'tabUpdated',
      tab: tab
    }).catch(() => {
      // Popup might not be open, ignore error
    });
  }
});
