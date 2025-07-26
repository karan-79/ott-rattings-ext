import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    // Load the current state from storage when the popup opens
    chrome.storage.local.get(['isEnabled'], (result) => {
      setIsEnabled(result.isEnabled !== undefined ? result.isEnabled : true); // Default to true
    });
  }, []);

  const toggleExtension = () => {
    const newState = !isEnabled;
    setIsEnabled(newState);
    // Save the new state to storage
    chrome.storage.local.set({ isEnabled: newState }, () => {
      // Send a message to the background script to update content script state
      chrome.runtime.sendMessage({ type: "toggleExtension", isEnabled: newState });
    });
  };

  return (
    <div className="App" style={{ width: '200px', padding: '15px', textAlign: 'center' }}>
      <h1 style={{ fontSize: '1.2em', marginBottom: '15px' }}>OTT Ratings</h1>
      <button
        onClick={toggleExtension}
        style={{
          backgroundColor: isEnabled ? '#4CAF50' : '#f44336',
          color: 'white',
          padding: '10px 20px',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          fontSize: '1em',
        }}
      >
        {isEnabled ? 'Disable Extension' : 'Enable Extension'}
      </button>
      <p style={{ marginTop: '15px', fontSize: '0.9em', color: '#888' }}>
        Status: {isEnabled ? 'Enabled' : 'Disabled'}
      </p>
    </div>
  );
}

export default App;