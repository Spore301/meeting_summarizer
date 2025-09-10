import { getRecordingById } from './db.js';

document.addEventListener('DOMContentLoaded', async () => {
  const title = document.getElementById('title');
  const videoPlayer = document.getElementById('videoPlayer');
  const summary = document.getElementById('summary');
  const transcript = document.getElementById('transcript');
  const copySummaryBtn = document.getElementById('copySummary');
  const copyTranscriptBtn = document.getElementById('copyTranscript');

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
      title.textContent = `Details for Recording #${recording.id}`;
      
      // Load the video blob into the player
      if (recording.blob) {
        const videoUrl = URL.createObjectURL(recording.blob);
        videoPlayer.src = videoUrl;
      }

      summary.textContent = recording.summary || 'No summary generated yet.';
      transcript.textContent = recording.transcript || 'No transcript generated yet.';
      
      if(recording.summary) summary.classList.remove('placeholder');
      if(recording.transcript) transcript.classList.remove('placeholder');

      // Add click listeners for copy buttons
      copySummaryBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(summary.textContent);
        copySummaryBtn.textContent = 'Copied!';
        setTimeout(() => { copySummaryBtn.textContent = 'Copy'; }, 2000);
      });

      copyTranscriptBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(transcript.textContent);
        copyTranscriptBtn.textContent = 'Copied!';
        setTimeout(() => { copyTranscriptBtn.textContent = 'Copy'; }, 2000);
      });

    } else {
      title.textContent = `Error: Recording #${recordingId} not found.`;
    }
  } catch (error) {
    console.error("Failed to load recording details:", error);
    title.textContent = "Error loading recording details.";
  }
});