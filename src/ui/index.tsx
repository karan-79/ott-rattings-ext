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
    const { response, rect } = event.data.payload;
    const { ratings, searchedTitle, status } = response;

    reactRoot.render(
      <RatingsOverlay
        imdb={ratings?.imdb}
        rottenTomatoes={ratings?.rottenTomatoes}
        metacritic={ratings?.metacritic}
        searchedTitle={searchedTitle}
        rect={rect}
        status={status}
      />
    );

  } else if (event.data.type === 'HIDE_RATINGS_OVERLAY') {
    reactRoot.render(null); // Unmount the component to hide it
  }
});
