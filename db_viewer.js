import { getRecordings } from './db.js';

document.addEventListener('DOMContentLoaded', () => {
  const refreshButton = document.getElementById('refreshButton');
  const dbDataContainer = document.getElementById('dbData');

  async function loadData() {
    console.log("Loading database contents...");
    dbDataContainer.innerHTML = '<tr><td colspan="6">Loading...</td></tr>';
    
    try {
      const recordings = await getRecordings();
      if (!recordings || recordings.length === 0) {
        dbDataContainer.innerHTML = '<tr><td colspan="6">No recordings found in the database.</td></tr>';
        return;
      }

      // Clear loading message
      dbDataContainer.innerHTML = '';

      recordings.sort((a, b) => a.id - b.id); // Sort by ID

      recordings.forEach(rec => {
        const row = dbDataContainer.insertRow();
        
        const sizeInKB = rec.size ? Math.round(rec.size / 1024) : 'N/A';
        const hasTranscript = rec.transcript ? '✔️' : '❌';
        const hasSummary = rec.summary ? '✔️' : '❌';

        row.innerHTML = `
          <td>${rec.id}</td>
          <td>${new Date(rec.createdAt).toLocaleString()}</td>
          <td>${sizeInKB}</td>
          <td>${hasTranscript}</td>
          <td>${hasSummary}</td>
          <td><button data-id="${rec.id}">Delete</button></td>
        `;
      });

    } catch (error) {
      console.error("Failed to load database data:", error);
      dbDataContainer.innerHTML = '<tr><td colspan="6">Error loading data. Check console.</td></tr>';
    }
  }

  refreshButton.addEventListener('click', loadData);

  // Initial load
  loadData();
});