import { getRecordingById } from './db.js';

document.addEventListener('DOMContentLoaded', async () => {
  const title = document.getElementById('title');
  const summary = document.getElementById('summary');
  const transcript = document.getElementById('transcript');
  const downloadButton = document.getElementById('downloadButton');

  const urlParams = new URLSearchParams(window.location.search);
  const recordingId = parseInt(urlParams.get('id'));

  if (!recordingId) {
    title.textContent = "Error: No Recording ID provided.";
    return;
  }

  try {
    const recording = await getRecordingById(recordingId);
    
    if (recording) {
      const recordingDate = new Date(recording.createdAt).toLocaleString();
      title.textContent = `Details for Recording #${recording.id} (${recordingDate})`;
      
      summary.textContent = recording.summary || 'No summary generated yet.';
      transcript.textContent = recording.transcript || 'No transcript generated yet.';
      
      if(recording.summary) summary.classList.remove('placeholder');
      if(recording.transcript) transcript.classList.remove('placeholder');

      // **NEW DOWNLOAD LOGIC**
      if (recording.blob) {
        downloadButton.style.display = 'block'; // Show the button
        downloadButton.addEventListener('click', () => {
          const url = URL.createObjectURL(recording.blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `recording-${recording.id}.webm`;
          document.body.appendChild(a);
          a.click();
          // Clean up by removing the link and revoking the URL
          window.URL.revokeObjectURL(url);
          a.remove();
        });
      }

    } else {
      title.textContent = `Error: Recording #${recordingId} not found.`;
    }
  } catch (error) {
    console.error("Failed to load recording details:", error);
    title.textContent = "Error loading recording details.";
  }
});