const DB_NAME = 'meeting-summarizer-db';
const STORE_NAME = 'recordings';
const DB_VERSION = 3; 

function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('Database error:', event.target.error);
      reject('Database error');
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      let store;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      } else {
        store = event.target.transaction.objectStore(STORE_NAME);
      }
      
      if (!store.indexNames.contains('createdAt')) {
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
      if (!store.indexNames.contains('size')) {
        store.createIndex('size', 'size', { unique: false });
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
      size: blob.size
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

export async function updateRecording(id, newData) {
  const db = await initDB();
  return new Promise(async (resolve, reject) => {
    const record = await getRecordingById(id);
    if (!record) {
      return reject('Record not found to update');
    }
    
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    const updatedRecord = { ...record, ...newData, updatedAt: new Date() };
    const request = store.put(updatedRecord);

    request.onsuccess = () => {
      console.log(`Recording ${id} updated successfully.`);
      resolve(request.result);
    };

    request.onerror = (event) => {
      console.error('Error updating recording:', event.target.error);
      reject('Error updating recording');
    };
  });
}

export async function deleteRecording(id) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => {
      console.log(`Recording ${id} deleted successfully.`);
      resolve();
    };

    request.onerror = (event) => {
      console.error(`Error deleting recording ${id}:`, event.target.error);
      reject('Error deleting recording');
    };
  });
}