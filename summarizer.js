import { getRecordingById, updateRecording } from './db.js';

// **IMPORTANT**: Change this to the exact model name you have downloaded in Ollama
// For Qwen, it might be "qwen:7b", "qwen2", or similar.
const OLLAMA_MODEL = "gemma3:1b"; 

export async function handleSummarization(recordingId) {
  console.log(`--- NEW LOCAL SUMMARY REQUEST for Recording ${recordingId} ---`);
  try {
    const recording = await getRecordingById(recordingId);

    if (!recording || !recording.transcript) {
      throw new Error("Recording or transcript not found for summarization.");
    }

    console.log("Found transcript, sending to local Ollama server...");
    const OLLAMA_API_URL = `http://localhost:11434/api/generate`;

    // The prompt remains the same, we're just sending it to a different place
    const prompt = `Based on the following meeting transcript, please provide a concise summary. Structure your response in two parts: first, a "Key Points" section with a bulleted list of the main topics discussed. Second, an "Action Items" section that lists any specific tasks, assignments, or deadlines mentioned. If no action items are found, state "None."

    Transcript:
    ---
    ${recording.transcript}
    ---`;
    
    const response = await fetch(OLLAMA_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: prompt,
        stream: false // We want the full response at once
      })
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Ollama API request failed with status ${response.status}: ${errorBody}`);
    }

    const result = await response.json();
    // In Ollama's API, the full response text is in the 'response' property
    const summary = result.response; 
    
    console.log("SUCCESS! Local summary received. Saving to database...");
    
    await updateRecording(recordingId, { summary: summary });
    
    chrome.runtime.sendMessage({ action: 'summarizationComplete', id: recordingId });

  } catch (error) {
    // Add a more helpful error for when the Ollama server isn't running
    if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error('Error during local summarization: Could not connect to Ollama server. Is it running at http://localhost:11434?');
    } else {
        console.error('Error during local summarization:', error);
    }
  }
}