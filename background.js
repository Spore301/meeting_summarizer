import { saveRecording, getRecordings, getRecordingById } from './db.js';

const OFFSCREEN_DOCUMENT_PATH = '/offscreen.html';

async function setupOffscreenDocument() {
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT']
  });
  if (existingContexts.length > 0) {
    return;
  }
  await chrome.offscreen.createDocument({
    url: OFFSCREEN_DOCUMENT_PATH,
    reasons: ['USER_MEDIA'],
    justification: 'To capture tab audio and video with getDisplayMedia',
  });
}

// Converts a base64 string from offscreen.js back into a real Blob
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
    case 'stopRecording':
      setupOffscreenDocument().then(() => {
        chrome.runtime.sendMessage(message);
      });
      break;
    
    case 'saveRecording':
      if (message.data) {
        // Reconstruct the blob from the base64 Data URL
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
  }
});

// Converts a Blob to a base64 string for the API call
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function handleTranscription(recordingId) {
  console.log(`--- NEW TRANSCRIPTION REQUEST ---`);
  console.log(`1. Received request for recording ID: ${recordingId}`);
  
  try {
    const storageItems = await chrome.storage.sync.get('geminiApiKey');
    const geminiApiKey = storageItems.geminiApiKey;
    
    console.log("2. Attempting to retrieve API key...");
    if (!geminiApiKey) {
      console.error('3. ERROR: Gemini API Key not found.');
      return;
    }
    console.log("3. API Key found successfully.");

    const recording = await getRecordingById(recordingId);
    if (!recording || !recording.blob) {
      console.error('4. ERROR: Recording not found in database.');
      return;
    }
    console.log("4. Recording blob found in database.");

    const audioBase64 = await blobToBase64(recording.blob);
    console.log("5. Blob converted to base64 successfully.");

    console.log("6. Sending data to Gemini API...");
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`;
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: "Transcribe the following audio:" },
              { inline_data: { mime_type: "video/webm", data: audioBase64 } }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`API request failed with status ${response.status}: ${errorBody}`);
    }

    const result = await response.json();
    const transcript = result.candidates[0].content.parts[0].text;
    
    console.log("7. SUCCESS! Transcript received.");
    console.log(`--- TRANSCRIPT for Recording ${recordingId} ---`);
    console.log(transcript);

  } catch (error) {
    console.error('--- A CRITICAL ERROR OCCURRED ---');
    console.error('Error during transcription process:', error);
  }
}