let mediaRecorder;
let recordedChunks = [];

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function startRecording() {
  try {
    // We only need one capture request now.
    // The user MUST select "Entire Screen" or "Window" and check "Share system audio".
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: true // This will capture system audio when the user allows it.
    });

    mediaRecorder = new MediaRecorder(stream);
    
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunks.push(event.data);
      }
    };
    
    mediaRecorder.onstop = async () => { 
      const blob = new Blob(recordedChunks, { type: 'video/webm' });
      const dataUrl = await blobToBase64(blob);
      chrome.runtime.sendMessage({ action: 'saveRecording', data: dataUrl });
      recordedChunks = [];
      window.close();
    };
    
    mediaRecorder.start();
    console.log("System audio recording started.");

  } catch (err) {
    console.error('Error starting system audio capture:', err);
  }
}

chrome.runtime.onMessage.addListener((message) => {
  if (message.action === 'stopRecording') {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      // Stop all tracks to remove the recording indicators from the browser UI
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
  }
});

startRecording();