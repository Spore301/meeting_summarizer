// Saves options to chrome.storage
function save_options() {
  const apiKey = document.getElementById('apiKey').value;
  chrome.storage.sync.set({
    geminiApiKey: apiKey
  }, function() {
    // Update status to let user know options were saved.
    const status = document.getElementById('status');
    status.textContent = 'Options saved.';
    setTimeout(function() {
      status.textContent = '';
    }, 1500);
  });
}

// Restores input box state using the preferences stored in chrome.storage.
function restore_options() {
  chrome.storage.sync.get({
    geminiApiKey: ''
  }, function(items) {
    document.getElementById('apiKey').value = items.geminiApiKey;
  });
}

document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);