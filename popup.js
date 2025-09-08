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

    recordings.forEach(rec => {
      const recordingItem = document.createElement('div');
      recordingItem.className = 'recording-item';

      const recordingDate = new Date(rec.createdAt).toLocaleString();
      // Added a class to the button to make it easy to target
      recordingItem.innerHTML = `
        <span>Recording ${rec.id} - ${recordingDate}</span>
        <button class="transcribe-button" data-id="${rec.id}">Transcribe</button>
      `;
      recordingsList.appendChild(recordingItem);
    });
  }

  // **NEW CODE BLOCK**
  // This listens for clicks on any of the "Transcribe" buttons
  recordingsList.addEventListener('click', (event) => {
    if (event.target && event.target.classList.contains('transcribe-button')) {
      const recordingId = parseInt(event.target.dataset.id);
      
      // Update UI to show that transcription is in progress
      event.target.textContent = 'Transcribing...';
      event.target.disabled = true;
      
      // Send message to background script to start transcription
      chrome.runtime.sendMessage({ action: 'transcribeRecording', id: recordingId });
    }
  });

  // Automatically refresh the list when the popup is opened
  refreshRecordingsList();
});