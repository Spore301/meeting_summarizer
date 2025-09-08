import { saveRecording, getRecordings, getRecordingById, updateRecording } from './db.js';
import { handleSummarization } from './summarizer.js';
import { handleTranscription } from './transcriber.js';

let recorderTabId = null;

// Helper function to convert base64 back to a Blob for saving
function base64ToBlob(dataUrl, mimeType) {
  const byteCharacters = atob(dataUrl.split(',')[1]);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case 'startRecording':
      // Open the recorder helper tab
      chrome.tabs.create({ url: chrome.runtime.getURL('recorder.html'), active: true }, (tab) => {
        recorderTabId = tab.id;
      });
      break;
    
    case 'stopRecording':
      // Send a message to the specific recorder tab to stop
      if (recorderTabId) {
        // Use tabs.sendMessage as it's directed to a content script or extension page
        chrome.tabs.sendMessage(recorderTabId, { action: 'stopRecording' });
        recorderTabId = null;
      }
      break;

    case 'saveRecording':
      if (message.data) {
        const mimeType = message.data.match(/:(.*?);/)[1];
        const blob = base64ToBlob(message.data, mimeType);
        saveRecording(blob);
      }
      break;

    case 'getRecordings':
      getRecordings().then(recordings => {
        sendResponse(recordings);
      });
      return true;
    
    case 'transcribeRecording':
      handleTranscription(message.id);
      break;

    case 'summarizeRecording':
      handleSummarization(message.id);
      break;
  }
});