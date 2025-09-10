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
      recordings.sort((a, b) => b.id - a.id); // Newest first
      recordings.forEach(rec => {
        const row = dbDataContainer.insertRow();
        const sizeInKB = rec.size ? Math.round(rec.size / 1024) : 'N/A';
        row.innerHTML = `
          <td>${rec.id}</td>
          <td>${new Date(rec.createdAt).toLocaleString()}</td>
          <td>${sizeInKB} KB</td>
          <td>
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
    const record = await getRecordingById(id);
    modalTitle.textContent = `Details for Recording ${id}`;
    modalTranscript.textContent = record.transcript || 'No transcript available.';
    modalSummary.textContent = record.summary || 'No summary available.';
    modal.style.display = 'block';
  }

  dbDataContainer.addEventListener('click', async (event) => {
    const target = event.target;
    if (target.matches('button.view-button')) {
      const recordingId = parseInt(target.dataset.id);
      showDetails(recordingId);
    }
    if (target.matches('button.delete-button')) {
      const recordingId = parseInt(target.dataset.id);
      if (confirm(`Are you sure you want to delete Recording ${recordingId}?`)) {
        await deleteRecording(recordingId);
        loadData(); 
      }
    }
  });

  closeButton.onclick = () => { modal.style.display = 'none'; };
  window.onclick = (event) => {
    if (event.target == modal) {
      modal.style.display = 'none';
    }
  };

  refreshButton.addEventListener('click', loadData);
  loadData();
});