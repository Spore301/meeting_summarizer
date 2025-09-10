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
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: true 
    });

    // **NEW**: Check if an audio track was actually included
    if (stream.getAudioTracks().length === 0) {
      // If not, stop the process and log an error.
      console.error("Recording failed: No audio track was provided. Please ensure 'Share system audio' is checked.");
      // Stop the video track to remove the browser's "sharing this screen" indicator.
      stream.getVideoTracks().forEach(track => track.stop());
      // Close the helper tab.
      window.close();
      return; 
    }

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
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
    else {
      
    }
  }
}); 

startRecording();