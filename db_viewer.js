import { getRecordings, getRecordingById, deleteRecording } from './db.js';

document.addEventListener('DOMContentLoaded', () => {
  const refreshButton = document.getElementById('refreshButton');
  const dbDataContainer = document.getElementById('dbData');
  const modal = document.getElementById('detailsModal');
  const modalTitle = document.getElementById('modalTitle');
  const modalTranscript = document.getElementById('modalTranscript');
  const modalSummary = document.getElementById('modalSummary');
  const closeButton = document.querySelector('.close-button');

  async function loadData() {
    dbDataContainer.innerHTML = '<tr><td colspan="4">Loading...</td></tr>';
    try {
      const recordings = await getRecordings();
      dbDataContainer.innerHTML = '';
      if (!recordings || recordings.length === 0) {
        dbDataContainer.innerHTML = '<tr><td colspan="4">No recordings found.</td></tr>';
        return;
      }
      recordings.sort((a, b) => b.id - a.id);
      recordings.forEach(rec => {
        const row = dbDataContainer.insertRow();
        const sizeInKB = rec.size ? Math.round(rec.size / 1024) : 'N/A';

        const summarizeButton = rec.transcript
          ? rec.summary
            ? `<button class="summarize-button" data-id="${rec.id}" disabled>Summarized</button>`
            : `<button class="summarize-button" data-id="${rec.id}">Summarize</button>`
          : `<button class="summarize-button" data-id="${rec.id}" disabled>Summarize</button>`;
        
        const transcribeButton = rec.transcript
          ? `<button class="transcribe-button" data-id="${rec.id}" disabled>Transcribed</button>`
          : `<button class="transcribe-button" data-id="${rec.id}">Transcribe</button>`;

        row.innerHTML = `
          <td>${rec.id}</td>
          <td>${new Date(rec.createdAt).toLocaleString()}</td>
          <td>${sizeInKB} KB</td>
          <td>
            ${transcribeButton}
            ${summarizeButton}
            <button class="view-button" data-id="${rec.id}">View</button>
            <button class="delete-button" data-id="${rec.id}">Delete</button>
          </td>
        `;
      });
    } catch (error) {
      dbDataContainer.innerHTML = '<tr><td colspan="4">Error loading data.</td></tr>';
    }
  }

  async function showDetails(id) {
    // This function is for the modal, which we are replacing with the details page.
    // We will call the details page directly instead.
    chrome.tabs.create({ url: `details.html?id=${id}` });
  }

  dbDataContainer.addEventListener('click', async (event) => {
    const target = event.target;
    if (!target.matches('button')) return;

    const recordingId = parseInt(target.dataset.id);

    if (target.matches('.view-button')) {
      // Open the dedicated details page in a new tab
      chrome.tabs.create({ url: `details.html?id=${recordingId}` });
    }

    if (target.matches('.delete-button')) {
      if (confirm(`Are you sure you want to delete Recording ${recordingId}?`)) {
        await deleteRecording(recordingId);
        loadData(); // Refresh the list after deleting
      }
    }

    if (target.matches('.transcribe-button')) {
      target.textContent = "Transcribing...";
      target.disabled = true;
      chrome.runtime.sendMessage({ action: 'transcribeRecording', id: recordingId });
    }

    if (target.matches('.summarize-button')) {
      target.textContent = "Summarizing...";
      target.disabled = true;
      chrome.runtime.sendMessage({ action: 'summarizeRecording', id: recordingId });
    }
  });

  // Listener to auto-refresh when AI tasks are complete
  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'transcriptionComplete' || message.action === 'summarizationComplete') {
        console.log(`Received ${message.action}, refreshing data...`);
        loadData();
    }
  });
  
  // Modal close logic (can be removed if you're not using the modal anymore)
  closeButton.onclick = () => { modal.style.display = 'none'; };
  window.onclick = (event) => {
    if (event.target == modal) {
      modal.style.display = 'none';
    }
  };

  refreshButton.addEventListener('click', loadData);
  loadData();
});