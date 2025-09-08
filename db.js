const DB_NAME = 'meeting-summarizer-db';
const STORE_NAME = 'recordings';

function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onerror = (event) => {
      console.error('Database error:', event.target.error);
      reject('Database error');
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };
  });
}

export async function saveRecording(blob) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const recording = {
      blob: blob,
      createdAt: new Date(),
    };
    const request = store.add(recording);

    request.onsuccess = (event) => {
      console.log('Recording saved successfully with ID:', event.target.result);
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      console.error('Error saving recording:', event.target.error);
      reject('Error saving recording');
    };
  });
}

export async function getRecordings() {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      console.error('Error fetching recordings:', event.target.error);
      reject('Error fetching recordings');
    };
  });
}

export async function getRecordingById(id) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      reject('Error fetching recording by ID');
    };
  });
}