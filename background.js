import { saveRecording, getRecordings, getRecordingById, updateRecording } from './db.js';

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

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function handleTranscription(recordingId) {
  console.log(`--- NEW TRANSCRIPTION REQUEST for Recording ${recordingId} ---`);
  try {
    const storageItems = await chrome.storage.sync.get('geminiApiKey');
    const geminiApiKey = storageItems.geminiApiKey;
    
    if (!geminiApiKey) {
      throw new Error('Gemini API Key not found.');
    }

    const recording = await getRecordingById(recordingId);
    if (!recording || !recording.blob) {
      throw new Error('Recording not found in database.');
    }

    const audioBase64 = await blobToBase64(recording.blob);

    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`;
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: "This is a video file, but please ignore the video content. Your task is to transcribe only the audio track. Provide a clean, verbatim transcript of all spoken words in the audio." },
            { inline_data: { mime_type: "video/webm", data: audioBase64 } }
          ]
        }]
      })
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`API request failed with status ${response.status}: ${errorBody}`);
    }

    const result = await response.json();
    const transcript = result.candidates[0].content.parts[0].text;
    
    console.log("SUCCESS! Transcript received. Saving to database...");
    await updateRecording(recordingId, { transcript: transcript });
    
    chrome.runtime.sendMessage({ action: 'transcriptionComplete', id: recordingId });

  } catch (error) {
    console.error('Error during transcription process:', error);
  }
}

async function handleSummarization(recordingId) {
  console.log(`--- NEW SUMMARY REQUEST for Recording ${recordingId} ---`);
  try {
    const { geminiApiKey } = await chrome.storage.sync.get('geminiApiKey');
    const recording = await getRecordingById(recordingId);

    if (!geminiApiKey || !recording || !recording.transcript) {
      throw new Error("API Key, recording, or transcript not found for summarization.");
    }

    console.log("Found transcript, preparing summary request...");
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`;

    const prompt = `Based on the following meeting transcript, please provide a concise summary. Structure your response in two parts: first, a "Key Points" section with a bulleted list of the main topics discussed. Second, an "Action Items" section that lists any specific tasks, assignments, or deadlines mentioned. If no action items are found, state "None."

    Transcript:
    ---
    ${recording.transcript}
    ---`;
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const result = await response.json();
    const summary = result.candidates[0].content.parts[0].text;
    
    console.log("SUCCESS! Summary received. Saving to database...");
    
    await updateRecording(recordingId, { summary: summary });
    
    chrome.runtime.sendMessage({ action: 'summarizationComplete', id: recordingId });

  } catch (error) {
    console.error('Error during summarization:', error);
  }
}