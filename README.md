# Meeting Summarizer PM

A Chrome extension to record, transcribe, and summarize meetings using a hybrid cloud/local AI approach. This project is built with Manifest V3 and modern JavaScript, focusing on a modular and private-by-default architecture.

## Key Features

  * **System Audio Recording:** Captures high-quality audio from any meeting or media playing in the browser.
  * **Cloud-Powered Transcription:** Integrates with the Google Gemini API for fast and accurate speech-to-text.
  * **Local AI Summarization:** Uses a locally-run Ollama model (e.g., Qwen, Llama3) to generate summaries, ensuring the privacy of the meeting's content.
  * **Persistent Local Storage:** All recordings, transcripts, and summaries are stored securely in the browser's IndexedDB, so your data stays on your machine.
  * **Results Viewer:** A dedicated details page to play back recordings and view full transcripts and summaries.
  * **Admin Panel:** Includes a developer tool to view and manage the raw database contents.

## Technology Stack

  * **Platform:** Chrome Extension (Manifest V3)
  * **Language:** JavaScript (ES Modules)
  * **Transcription:** Google Gemini API
  * **Summarization:** Ollama (local LLMs)
  * **Database:** IndexedDB
  * **UI:** Vanilla HTML/CSS/JS

## Setup and Installation

Follow these steps to set up the extension for local development and use.

### 1\. Set Up Local AI (Ollama)

This is required for the summarization feature.

  * **Install Ollama:** Download and install Ollama from the official website.
  * **Pull a Model:** Open your terminal and pull a model for summarization (e.g., `qwen2`).
    ```bash
    ollama pull qwen2
    ```
  * **Run Ollama with CORS Enabled:** To allow the extension to connect to your local AI, you must start the Ollama server with a special command. Keep this terminal window open while using the extension.
    ```bash
    OLLAMA_ORIGINS='*' ollama serve
    ```

### 2\. Set Up Cloud AI (Gemini)

This is required for the transcription feature.

  * Go to the **Google AI Studio** website.
  * Sign in and create a new **API Key**.
  * Copy this key to a safe place.

### 3\. Install the Chrome Extension

  * Open Google Chrome and navigate to `chrome://extensions`.
  * Enable **"Developer mode"** in the top-right corner.
  * Click **"Load unpacked"**.
  * Select your local `meeting_summarizer` project folder.

### 4\. Configure the Extension

  * **Right-click** on the new Meeting Summarizer icon in your toolbar and select **"Options"**.
  * Paste your **Gemini API Key** into the input field and click **"Save"**.

## Usage

1.  **Start Recording:** Click the extension icon and click **"Start Recording"**. A new "Recording in progress..." tab will open.
2.  **Grant Permission:** In the screen sharing prompt, you **must** select the **"Entire Screen"** or **"Window"** tab and check the **"Share system audio"** box at the bottom. Click **"Share"**.
3.  **Stop Recording:** Click the extension icon again and click **"Stop Recording"**.
4.  **Process Your Recording:** Open the popup to see your recording in the list.
      * Click **"Transcribe"** to generate the transcript.
      * Once finished, the button will change to **"Summarize"**. Click it to generate the summary.
      * Finally, the button will change to **"View"**. Click it to open the details page with all your results.