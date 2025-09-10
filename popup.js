document.addEventListener('DOMContentLoaded', () => {
  const startButton = document.getElementById('startButton');
  const stopButton = document.getElementById('stopButton');
  const refreshButton = document.getElementById('refreshButton');
  const recordingsList = document.getElementById('recordingsList');

  // --- Recording Controls ---
  startButton.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'startRecording' });
  });

  stopButton.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'stopRecording' });
  });

  // --- Displaying Recordings ---
  refreshButton.addEventListener('click', refreshRecordingsList);

  function refreshRecordingsList() {
    chrome.runtime.sendMessage({ action: 'getRecordings' }, (response) => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError);
        recordingsList.innerHTML = '<p>Error loading recordings.</p>';
        return;
      }
      renderRecordings(response);
    });
  }

  function renderRecordings(recordings) {
    recordingsList.innerHTML = ''; 

    if (!recordings || recordings.length === 0) {
      recordingsList.innerHTML = '<p>No recordings found.</p>';
      return;
    }

    recordings.sort((a, b) => b.id - a.id);

    recordings.forEach(rec => {
      const recordingItem = document.createElement('div');
      recordingItem.className = 'recording-item';
      const recordingDate = new Date(rec.createdAt).toLocaleString();
      const sizeInKB = rec.size ? `${Math.round(rec.size / 1024)} KB` : '';

      let actionButton;
      if (rec.summary) {
        actionButton = `<button class="view-button" data-id="${rec.id}">View</button>`;
      } else if (rec.transcript) {
        actionButton = `<button class="summarize-button" data-id="${rec.id}">Summarize</button>`;
      } else {
        actionButton = `<button class="transcribe-button" data-id="${rec.id}">Transcribe</button>`;
      }

      recordingItem.innerHTML = `
        <span>Recording ${rec.id} - ${recordingDate} - <strong>${sizeInKB}</strong></span>
        ${actionButton}
      `;
      recordingsList.appendChild(recordingItem);
    });
  }

  // Event listener for all action buttons
  recordingsList.addEventListener('click', (event) => {
    const target = event.target;
    if (target && target.tagName === 'BUTTON') {
      const recordingId = parseInt(target.dataset.id);
      let action = '';

      if (target.matches('.transcribe-button')) {
        target.textContent = 'Transcribing...';
        action = 'transcribeRecording';
      } else if (target.matches('.summarize-button')) {
        target.textContent = 'Summarizing...';
        action = 'summarizeRecording';
      } else if (target.matches('.view-button')) {
        // This opens our details page
        chrome.tabs.create({ url: `details.html?id=${recordingId}` });
        return;
      }
      
      target.disabled = true;
      chrome.runtime.sendMessage({ action: action, id: recordingId });
    }
  });

  // Listen for completion messages from the background script to auto-refresh
  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'transcriptionComplete' || message.action === 'summarizationComplete') {
        refreshRecordingsList();
    }
  });

  // Automatically load the recordings when the popup is opened
  refreshRecordingsList();
});