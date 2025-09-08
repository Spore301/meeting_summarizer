let mediaRecorder;
let recordedChunks = [];

// Helper function to convert a Blob to a base64 string
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result); // Resolve with the full Data URL
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

chrome.runtime.onMessage.addListener(async (message) => {
  if (message.action === 'startRecording') {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      return; // Already recording, do nothing.
    }
    
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ audio: true, video: true });
      
      mediaRecorder = new MediaRecorder(stream);
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunks.push(event.data);
        }
      };
      
      // This function is now async to await the conversion
      mediaRecorder.onstop = async () => { 
        const blob = new Blob(recordedChunks, { type: 'video/webm' });
        
        // Convert the blob to a base64 Data URL before sending
        const dataUrl = await blobToBase64(blob);
        chrome.runtime.sendMessage({ action: 'saveRecording', data: dataUrl });

        recordedChunks = []; 
      };
      
      mediaRecorder.start();
      
    } catch (err) {
      console.error('Error in offscreen document:', err);
    }
    
  } else if (message.action === 'stopRecording') {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
    }
  }
});