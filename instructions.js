document.addEventListener('DOMContentLoaded', () => {
  const startButton = document.getElementById('startPromptButton');
  
  startButton.addEventListener('click', () => {
    // Tell the background script to finally show the real permission prompt
    chrome.runtime.sendMessage({ action: 'startRecording' });
    // Close this instructions tab
    window.close();
  });
});