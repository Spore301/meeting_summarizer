import { getRecordingById, updateRecording } from './db.js';

export async function handleSummarization(recordingId) {
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