# 🍿 OTT Ratings Extension

Enhance your streaming experience by instantly surfacing external ratings (IMDb, Rotten Tomatoes, Metacritic) and key metadata for movies and shows on major OTT platforms. Get real-time insights without leaving your favorite streaming service!

## ✨ Features

*   **Cross-Platform Compatibility:** Designed to work seamlessly across popular streaming platforms like Netflix, Amazon Prime Video, Disney+ Hotstar, Hulu, and more.
*   **Real-time Title Detection:** Automatically detects the movie or show title you're hovering over, previewing, or actively watching, adapting to various DOM structures.
*   **Aggregated Ratings & Metadata:** Fetches and displays consolidated ratings and additional information from OMDb API:
    *   **IMDb Rating**
    *   **Rotten Tomatoes Score**
    *   **Metacritic Score**
    *   **Release Year**
    *   **Genre**
    *   **Runtime**
    *   **Short Plot Synopsis**
*   **Intuitive UI Overlay:** Ratings and metadata appear in a sleek, modern, and non-blocking overlay that blends with the streaming UI. Features:
    *   **Dynamic Positioning:** Automatically adjusts its position to stay within the viewport, even near screen edges.
    *   **Loading State:** Shows a "Loading..." indicator while fetching data.
    *   **Error Feedback:** Clearly indicates if ratings are not found or an error occurred.
    *   **Searched Title Display:** Shows the exact title used for the API search, aiding in debugging and understanding.
*   **Performance Optimized:** Utilizes debouncing for hover events and client-side caching with a 2-day invalidation period to minimize API calls and ensure a smooth, responsive experience.
*   **Toggle Feature:** Easily enable or disable the extension directly from its browser action popup.
*   **Privacy-Respecting:** Designed with privacy in mind – no tracking, no data collection, minimal permissions.

## 🛠️ Technologies Used

This extension is built with modern web technologies to ensure a robust, scalable, and maintainable codebase:

*   **[Vite](https://vitejs.dev/)**: A fast and opinionated build tool for modern web projects.
*   **[React](https://react.dev/)**: A declarative, component-based JavaScript library for building user interfaces.
*   **[TypeScript](https://www.typescriptlang.org/)**: A superset of JavaScript that adds static types, enhancing code quality and developer experience.
*   **[WebExtensions API](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions)**: The standard API for developing cross-browser extensions.
*   **[OMDb API](http://www.omdbapi.com/)**: Used for fetching movie and show metadata and ratings.

## 🚀 Getting Started

Follow these steps to set up and run the OTT Ratings Extension locally.

### Prerequisites

*   [Node.js](https://nodejs.org/en/download/) (LTS version recommended)
*   [npm](https://www.npmjs.com/get-npm) (comes with Node.js) or [Yarn](https://yarnpkg.com/) / [pnpm](https://pnpm.io/)

### Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/karan-79/ott-rattings-ext.git
    cd ott-rattings-ext
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    # or yarn install
    # or pnpm install
    ```

### Environment Variables (API Key)

The extension uses the [OMDb API](http://www.omdbapi.com/) to fetch movie and show ratings. You need to provide an API key for this service.

1.  **Obtain an OMDb API Key:**
    *   Go to [www.omdbapi.com/apikey.aspx](http://www.omdbapi.com/apikey.aspx).
    *   Register for a free API key.

2.  **Create a `.env` file:**
    In the root directory of the `ott-rattings-ext` project, create a file named `.env`.

3.  **Add your API key to `.env`:**
    Open the `.env` file and add your OMDb API key in the following format:

    ```
    VITE_OMDB_API_KEY=YOUR_OMDB_API_KEY_HERE
    ```
    Replace `YOUR_OMDB_API_KEY_HERE` with the actual key you obtained from OMDb.

    **Important:** The `.env` file is included in `.gitignore` to prevent your API key from being committed to version control.

### Build the Extension

After setting up the environment variable, build the extension for production:

```bash
npm run build
# or yarn build
# or pnpm build
```

This command will compile the TypeScript code, bundle the assets, and place the production-ready extension files in the `dist/` directory.

## 📦 Loading the Extension in Your Browser

This extension is designed to be loaded as an "unpacked" extension in Chromium-based browsers (Chrome, Edge, Brave) and Firefox.

### For Google Chrome / Microsoft Edge / Brave

1.  **Open Extensions Page:**
    *   Open your browser.
    *   Type `chrome://extensions` (for Chrome/Brave) or `edge://extensions` (for Edge) in the address bar and press Enter.

2.  **Enable Developer Mode:**
    *   In the top right corner of the Extensions page, toggle on "Developer mode".

3.  **Load Unpacked:**
    *   Click the "Load unpacked" button that appears.

4.  **Select the Build Directory:**
    *   Navigate to your project directory (`ott-rattings-ext`).
    *   Select the `dist/` folder (e.g., `/path/to/your/ott-rattings-ext/dist`).

The extension should now appear in your list of installed extensions.

### For Mozilla Firefox

1.  **Open Add-ons Page:**
    *   Open Firefox.
    *   Type `about:debugging#/runtime/this-firefox` in the address bar and press Enter.

2.  **Load Temporary Add-on:**
    *   Click the "Load Temporary Add-on..." button.

3.  **Select `manifest.json`:**
    *   Navigate to your project's `dist/` folder (e.g., `/path/to/your/ott-rattings-ext/dist`).
    *   Select the `manifest.json` file inside the `dist/` folder.

The extension will be loaded temporarily until you close Firefox. For permanent installation, you would typically package and sign it.

## 📺 Usage

Once the extension is loaded:

1.  Navigate to a supported streaming platform (e.g., Netflix, Amazon Prime Video, Jio Hotstar).
2.  Hover your mouse over a movie or TV show thumbnail/card.
3.  After a brief moment, a sleek overlay will appear next to your cursor, displaying the IMDb, Rotten Tomatoes, and Metacritic ratings, along with additional metadata like Year, Genre, Runtime, and a short Plot summary.
4.  The overlay will disappear when you move your mouse away.

## ⚙️ Extension Toggle

Click on the extension icon in your browser toolbar. A popup will appear with a toggle button to easily enable or disable the extension's functionality across all supported sites.

## 🐛 Troubleshooting

If you encounter issues, here are some common solutions:

*   **Extension not loading/working:**
    *   Ensure you have correctly followed the "Getting Started" and "Loading the Extension" steps.
    *   Verify your OMDb API key in the `.env` file is correct and active.
    *   Check the browser's extension page (`chrome://extensions` or `about:debugging#/runtime/this-firefox`) for any red "Errors" buttons or messages.
    *   Open the Developer Tools (F12) on the streaming platform page and check the "Console" tab for any JavaScript errors.
    *   For background script errors, go to `chrome://extensions`, click the "Service Worker" or "background page" link for the extension, and check its console.
*   **Ratings not appearing for specific titles:**
    *   The OMDb API might not have data for that specific title or variation.
    *   The title cleaning logic might need adjustment for very unusual title formats.
    *   The DOM selectors for the streaming platform might have changed. Inspect the element on the page to find new selectors.
*   **Overlay position issues:**
    *   Ensure the `ANIMATION_SETTLE_DELAY` in `src/content/content.ts` is sufficient for the platform's hover animations.

## 📂 Project Structure

```
ott-rattings-ext/
├── .env                  # Environment variables (e.g., API keys) - IGNORED BY GIT
├── .gitignore            # Specifies intentionally untracked files to ignore
├── package.json          # Project metadata and dependencies
├── vite.config.ts        # Vite build configuration
├── tsconfig.json         # TypeScript configuration
├── tsconfig.node.json    # TypeScript config for Node.js environment
├── public/               # Static assets copied directly to dist/
│   ├── manifest.json     # Web Extension manifest file
│   ├── icon16.png        # Extension icon (16x16)
│   ├── icon48.png        # Extension icon (48x48)
│   └── icon128.png       # Extension icon (128x128)
└── src/
    ├── App.css           # Main application CSS
    ├── App.tsx           # Main React App component
    ├── background/       # Background script for API calls and logic
    │   └── background.ts
    ├── content/          # Content script for DOM interaction and UI injection
    │   └── content.ts
    ├── options/          # Options page for extension settings
    │   ├── App.css
    │   ├── App.tsx
    │   ├── index.css
    │   ├── options.html
    │   └── options.tsx
    ├── popup/            # Popup UI when clicking extension icon
    │   ├── App.css
    │   ├── App.tsx
    │   ├── index.css
    │   ├── popup.html
    │   └── popup.tsx
    ├── ui/               # React components for the injected UI overlay
    │   ├── RatingsOverlay.tsx
    │   └── index.tsx     # Entry point for the injected UI
    ├── index.css         # Global CSS
    ├── main.tsx          # Main entry point for React app
    └── vite-env.d.ts     # TypeScript declaration for Vite environment variables
```

## 🤝 Contributing

Contributions are welcome! If you have suggestions for improvements, bug fixes, or new features, please feel free to:

1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature/your-feature-name`).
3.  Make your changes.
4.  Commit your changes (`git commit -m 'feat: Add new feature'`).
5.  Push to your branch (`git push origin feature/your-feature-name`).
6.  Open a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the `LICENSE` file for details (if you choose to add one).

## 🙏 Acknowledgements

*   [OMDb API](http://www.omdbapi.com/) for providing movie and show data.
*   The open-source community for amazing tools and libraries.