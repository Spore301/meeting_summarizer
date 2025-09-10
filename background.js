import { saveRecording, getRecordings, getRecordingById, updateRecording } from './db.js';
import { handleSummarization } from './summarizer.js';
import { handleTranscription } from './transcriber.js';

// No longer using a global variable for the tab ID

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

// Make the main listener async to handle storage calls
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    switch (message.action) {
      case 'startRecording':
        chrome.tabs.create({ url: chrome.runtime.getURL('recorder.html'), active: true }, (tab) => {
          // Save the tab ID to session storage so we don't forget it
          chrome.storage.session.set({ recorderTabId: tab.id });
        });
        break;
      
      case 'stopRecording':
        // Get the tab ID from session storage
        const { recorderTabId } = await chrome.storage.session.get('recorderTabId');
        if (recorderTabId) {
          chrome.tabs.sendMessage(recorderTabId, { action: 'stopRecording' });
          // Clear the ID from storage
          chrome.storage.session.remove('recorderTabId');
        }
        break;

      case 'saveRecording':
        if (message.data) {
          const mimeType = message.data.match(/:(.*?);/)[1];
          const blob = base64ToBlob(message.data, mimeType);
          await saveRecording(blob);
        }
        break;

      case 'getRecordings':
        const recordings = await getRecordings();
        sendResponse(recordings);
        break;
      
      case 'transcribeRecording':
        handleTranscription(message.id);
        break;

      case 'summarizeRecording':
        handleSummarization(message.id);
        break;
    }
  })();
  
  return true; // Keep the message channel open for async responses
});