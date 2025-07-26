import ReactDOM from 'react-dom/client';
import RatingsOverlay from './RatingsOverlay';

// This script will be injected into the page by the content script.
// It will listen for messages from the content script to update the overlay.

const rootElement = document.createElement('div');
rootElement.id = 'ott-ratings-ui-root';
document.body.appendChild(rootElement);

const reactRoot = ReactDOM.createRoot(rootElement);

window.addEventListener('message', (event) => {
  // Only accept messages from ourselves
  if (event.source !== window) {
    return;
  }

  if (event.data.type === 'UPDATE_RATINGS_OVERLAY') {
    const { ratings, position } = event.data.payload;

    reactRoot.render(
      <div style={{
        position: 'absolute',
        left: `${position.x}px`,
        top: `${position.y}px`,
        display: 'block',
      }}>
        <RatingsOverlay
          imdb={ratings?.imdb}
          rottenTomatoes={ratings?.rottenTomatoes}
          metacritic={ratings?.metacritic}
        />
      </div>
    );
  } else if (event.data.type === 'HIDE_RATINGS_OVERLAY') {
    reactRoot.render(null); // Unmount the component to hide it
  }
});