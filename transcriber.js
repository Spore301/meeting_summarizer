import { getRecordingById, updateRecording } from './db.js';

// Helper function now lives here
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function handleTranscription(recordingId) {
  console.log(`--- NEW TRANSCRIPTION REQUEST for Recording ${recordingId} ---`);
  try {
    const { geminiApiKey } = await chrome.storage.sync.get('geminiApiKey');
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