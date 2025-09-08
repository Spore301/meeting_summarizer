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
    recordingsList.innerHTML = ''; // Clear the list

    if (!recordings || recordings.length === 0) {
      recordingsList.innerHTML = '<p>No recordings found.</p>';
      return;
    }

    recordings.sort((a, b) => b.id - a.id);

    recordings.forEach(rec => {
      const recordingItem = document.createElement('div');
      recordingItem.className = 'recording-item';
      
      const recordingDate = new Date(rec.createdAt).toLocaleString();
      
      // **KEY CHANGE IS HERE**
      // Format the size from bytes to KB for display
      const sizeInKB = rec.size ? `${Math.round(rec.size / 1024)} KB` : '';

      let actionButton;
      if (rec.transcript) {
        actionButton = `<button class="summarize-button" data-id="${rec.id}">Summarize</button>`;
      } else {
        actionButton = `<button class="transcribe-button" data-id="${rec.id}">Transcribe</button>`;
      }

      // Updated to include the sizeInKB variable
      recordingItem.innerHTML = `
        <span>Recording ${rec.id} - ${recordingDate} - <strong>${sizeInKB}</strong></span>
        ${actionButton}
      `;
      recordingsList.appendChild(recordingItem);
    });
  }

  // Event listener for both Transcribe and Summarize buttons
  recordingsList.addEventListener('click', (event) => {
    if (event.target && event.target.matches('.transcribe-button')) {
      const recordingId = parseInt(event.target.dataset.id);
      event.target.textContent = 'Transcribing...';
      event.target.disabled = true;
      chrome.runtime.sendMessage({ action: 'transcribeRecording', id: recordingId });
    }

    if (event.target && event.target.matches('.summarize-button')) {
      const recordingId = parseInt(event.target.dataset.id);
      event.target.textContent = 'Summarizing...';
      event.target.disabled = true;
      chrome.runtime.sendMessage({ action: 'summarizeRecording', id: recordingId });
    }
  });

  // Listen for completion messages from the background script
  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'transcriptionComplete' || message.action === 'summarizationComplete') {
        refreshRecordingsList();
    }
  });

  // Automatically refresh the list when the popup is opened
  refreshRecordingsList();
});