# 📚 Technical Details: OTT Ratings Extension

This document provides an in-depth look into the architecture, design, and implementation details of the OTT Ratings Extension. It's intended for developers who want to understand the codebase, contribute, or troubleshoot advanced issues.

## 🏗️ Architecture Overview

The extension follows a standard WebExtensions architecture, primarily utilizing a **Background Script** for core logic and API interactions, and **Content Scripts** for DOM manipulation and UI injection on streaming platforms. Communication between these components is handled via Chrome's messaging API.

```mermaid
graph TD
    User[User Interaction] --> Browser[Browser]
    Browser --> Popup[Extension Popup (src/popup)]
    Browser --> StreamingPlatform[Streaming Platform (e.g., Netflix, Prime Video, Hotstar)]

    Popup -- "Toggle Extension State" --> Background[Background Script (src/background)]

    StreamingPlatform -- "Injects UI Script" --> InjectedUI[Injected UI (src/ui)]
    StreamingPlatform -- "DOM Observation & Event Listeners" --> ContentScript[Content Script (src/content)]

    ContentScript -- "Request Ratings (Title, Rect)" --> Background
    Background -- "Fetch from OMDb API" --> OMDb[OMDb API]
    OMDb --> Background
    Background -- "Respond with Ratings/Status" --> ContentScript

    ContentScript -- "Update UI (Status, Ratings, Rect)" --> InjectedUI
    InjectedUI -- "Render Overlay" --> StreamingPlatform

    Background -- "Manage Enabled State" <--> ChromeStorage[chrome.storage.local]
    Background -- "Dynamic Script Injection/Removal" --> Browser
```

## 💡 Design Principles

*   **Modularity:** Code is separated into distinct concerns (background logic, content interaction, UI rendering) for better organization and maintainability.
*   **Performance:** Employs debouncing for hover events and client-side caching to minimize network requests and ensure a smooth user experience.
*   **Non-Intrusiveness:** The UI overlay is designed to be minimal and blend with the host website's theme, appearing only when relevant.
*   **Robustness:** Includes comprehensive error handling for API calls and dynamic DOM changes, along with a fallback mechanism for title matching.
*   **Privacy:** Adheres to strict privacy principles, only requesting necessary permissions and avoiding any user data collection.

## 📂 Code Documentation & Flow

### 1. `manifest.json`

This is the heart of the extension, defining its properties, permissions, and scripts. Key sections:

*   `manifest_version`: Set to `3` (Manifest V3).
*   `permissions`: `storage` (for caching and settings), `activeTab` (for current tab info), `scripting` (for dynamic content script injection).
*   `host_permissions`: Specifies the URLs where the extension can interact (Netflix, Prime Video, Hotstar, Hulu).
*   `background.service_worker`: Points to `assets/background.js` (bundled by Vite).
*   `content_scripts`: Defines when and which content scripts are injected. Note that `content.js` is injected via `chrome.scripting.executeScript` for dynamic control, but the `matches` array here still defines the URLs where the extension *can* run.
*   `web_accessible_resources`: Crucial for allowing `assets/ui.js` and `assets/client.js` (Vite's React runtime) to be injected into the web page by the content script.

### 2. `src/background/background.ts`

This script runs in the background and acts as the central hub for the extension. It handles:

*   **API Key Management:** Reads `VITE_OMDB_API_KEY` from the `.env` file during build time.
*   **Client-Side Caching:** Implements an in-memory cache (`ratingsCache`) with a `CACHE_DURATION` (2 days) using `chrome.storage.local` for persistence across browser sessions. It checks the cache before making API calls.
*   **Message Listener (`chrome.runtime.onMessage`):**
    *   **`getRating`:** Receives requests from content scripts with a movie/show title.
        *   Cleans the title (removes season info, years, etc.) for better OMDb search accuracy.
        *   Determines if the title is likely a series to add `type=series` to the OMDb request.
        *   Fetches data from OMDb API.
        *   Stores successful responses in `chrome.storage.local` with a timestamp.
        *   Sends the `ratings` and `searchedTitle` back to the content script.
    *   **`toggleExtension`:** Receives requests from the popup to enable/disable the extension.
        *   Updates the `isEnabled` state in `chrome.storage.local`.
        *   Queries all tabs matching the `host_permissions`.
        *   Dynamically injects (`chrome.scripting.executeScript`) or sends a disable message to content scripts in relevant tabs.
*   **`chrome.runtime.onInstalled`:** Sets the initial `isEnabled` state and injects content scripts into already open, matching tabs upon installation or update.
*   **`chrome.tabs.onUpdated`:** Listens for tab navigation events to ensure content scripts are injected or updated when a user navigates within a supported streaming site.

### 3. `src/content/content.ts`

This script is injected into supported streaming platform pages. It's responsible for:

*   **DOM Observation (`MutationObserver`):** Continuously watches for changes in the page's DOM (e.g., new movie cards loading dynamically) to attach event listeners.
*   **Platform-Specific Selectors (`PLATFORM_SELECTORS`):** Contains an array of CSS selectors tailored to identify movie/show cards on Netflix, Amazon Prime Video, and Jio Hotstar. This array is iterated to find the most relevant element.
*   **Hover Event Handling (`handleMouseOver`, `handleMouseOut`):**
    *   Uses `HOVER_DEBOUNCE_TIME` (300ms) to prevent excessive triggers.
    *   When a relevant element is hovered, it extracts the title using various strategies (e.g., `data-card-title`, `aria-label`, text content).
    *   Sends a `getRating` message to the background script.
*   **UI Communication (`sendRatingsToUI`, `hideRatingsUI`):**
    *   Communicates with the injected UI script (`src/ui/index.tsx`) using `window.postMessage`.
    *   Sends `status` (`loading`, `success`, `error`), `ratings`, `searchedTitle`, and the `rect` (bounding box) of the hovered element.
*   **Dynamic UI Injection (`injectUIScript`):** Injects `assets/ui.js` into the page as a module.
*   **Extension State Management:** Listens for `updateExtensionState` messages from the background script to enable/disable its functionality (`extensionEnabled` flag) and manage the `MutationObserver` and event listeners accordingly.
*   **Animation Settle Delay (`ANIMATION_SETTLE_DELAY`):** Introduces a small delay (150ms) after receiving the background script response before sending the final UI update. This allows platform-specific hover animations to complete, ensuring the overlay is positioned correctly.

### 4. `src/ui/index.tsx`

This is the entry point for the React-based UI overlay. It is injected into the web page by the content script.

*   **React Root:** Creates a `div` element (`#ott-ratings-ui-root`) and renders the `RatingsOverlay` component into it.
*   **Message Listener:** Listens for `UPDATE_RATINGS_OVERLAY` and `HIDE_RATINGS_OVERLAY` messages from the content script.
*   **Dynamic Positioning Logic:** Receives the `rect` of the hovered element and calculates the optimal `left` and `top` position for the overlay, ensuring it stays within the viewport and adjusts if it would go off-screen to the right.

### 5. `src/ui/RatingsOverlay.tsx`

This is the React component responsible for rendering the visual overlay.

*   **Props:** Receives `imdb`, `rottenTomatoes`, `metacritic`, `year`, `genre`, `runtime`, `plot`, `searchedTitle`, `rect`, and `status`.
*   **Conditional Rendering:** Displays a loading message, error message, or the actual ratings and metadata based on the `status` prop.
*   **Styling:** Uses inline styles for a modern, translucent, and non-intrusive appearance. Includes specific colors for different rating sources.
*   **Self-Positioning:** Uses `useRef` and `useEffect` to calculate and set its own `left` position after rendering, ensuring accurate placement relative to the hovered element and viewport boundaries.

## 📦 Dependencies

*   `react`: For building the UI components.
*   `react-dom`: For rendering React components to the DOM.
*   `@types/chrome`: TypeScript type definitions for the Chrome Extensions API.
*   `@types/react`, `@types/react-dom`: TypeScript type definitions for React.
*   `@vitejs/plugin-react`: Vite plugin for React support.
*   `typescript`: The TypeScript compiler.
*   `vite`: The build tool.

## ⚙️ Build Process

The project uses Vite as its build tool. The `vite.config.ts` file defines multiple entry points for the different parts of the extension (background, content, popup, options, UI). During `npm run build`, Vite compiles the TypeScript, bundles the JavaScript, and copies static assets from the `public/` directory to the `dist/` folder. The `manifest.json` is also placed in `public/` so it gets copied to the `dist/` root.

## 🤝 Contributing

Refer to the main `README.md` for contribution guidelines.
