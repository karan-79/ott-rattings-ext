const API_KEY = import.meta.env.VITE_OMDB_API_KEY;

// Cache duration: 2 days in milliseconds
const CACHE_DURATION = 2 * 24 * 60 * 60 * 1000; 

// Function to get current enabled state
async function getIsEnabled(): Promise<boolean> {
    return new Promise((resolve) => {
        chrome.storage.local.get(['isEnabled'], (result) => {
            resolve(result.isEnabled !== undefined ? result.isEnabled : true); // Default to true
        });
    });
}

// Function to inject content script into a tab
async function injectContentScript(tabId: number) {
    try {
        await chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ['assets/content.js'],
        });
        console.log(`Background: Injected content.js into tab ${tabId}`);
        // Also inject the UI script if it's not already there (content script handles this now)
        // and send the initial state
        chrome.tabs.sendMessage(tabId, { type: "updateExtensionState", isEnabled: true });
    } catch (error) {
        console.error(`Background: Failed to inject content.js into tab ${tabId}:`, error);
    }
}

// Function to remove content script (by sending a disable message)
async function removeContentScript(tabId: number) {
    try {
        // We can't directly remove a script injected by files[], so we send a message to disable it
        await chrome.tabs.sendMessage(tabId, { type: "updateExtensionState", isEnabled: false });
        console.log(`Background: Sent disable message to content.js in tab ${tabId}`);
    } catch (error) {
        console.error(`Background: Failed to send disable message to content.js in tab ${tabId}:`, error);
    }
}

// Listener for messages from popup or content script
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    if (request.type === "toggleExtension") {
        const isEnabled = request.isEnabled;
        chrome.storage.local.set({ isEnabled: isEnabled }, async () => {
            console.log(`Background: Extension toggled to ${isEnabled}`);

            // Get all tabs that match our host permissions
            const tabs = await chrome.tabs.query({
                url: [
                    "*://*.netflix.com/*",
                    "*://*.primevideo.com/*",
                    "*://*.hotstar.com/*",
                    "*://hotstar.com/*",
                    "*://*.disneyhotstar.com/*",
                    "*://*.hulu.com/*"
                ]
            });

            for (const tab of tabs) {
                if (tab.id) {
                    if (isEnabled) {
                        // Inject if enabled
                        injectContentScript(tab.id);
                    } else {
                        // Remove/disable if disabled
                        removeContentScript(tab.id);
                    }
                }
            }
        });
    } else if (request.type === "getRating") {
        const originalTitle = request.title;
        console.log("Background: Received title:", originalTitle);

        if (!API_KEY) {
            console.error("Background: OMDb API Key is not defined.");
            sendResponse({ ratings: null, searchedTitle: originalTitle });
            return;
        }

        // Attempt to clean up title for TV shows (remove season info, etc.)
        let cleanedTitle = originalTitle.replace(/\s*\(TV\)\s*-\s*SEASON\s*\d+\s*|\s*-\s*Season\s*\d+\s*|\s*-\s*S\d+\s*/i, '').trim();
        // If cleaning results in an empty string, use original title
        if (!cleanedTitle) cleanedTitle = originalTitle;

        // Check persistent cache first
        chrome.storage.local.get([originalTitle], async (result) => {
            if (result[originalTitle] && (Date.now() - result[originalTitle].timestamp < CACHE_DURATION)) {
                console.log("Background: Serving from persistent cache for:", originalTitle);
                sendResponse({ ratings: result[originalTitle].data, searchedTitle: cleanedTitle, status: 'success' });
                return; // Exit early as response is sent
            }

            // Determine if it's likely a series based on common patterns
            const isSeries = /\s*\(TV\)|\s*Season\s*\d+|\s*S\d+/i.test(originalTitle);
            const typeParam = isSeries ? "series" : undefined;

            const omdbUrl = `http://www.omdbapi.com/?t=${encodeURIComponent(cleanedTitle)}&type=${typeParam || ''}&apikey=${API_KEY}`;
            console.log("Background: Fetching from OMDb (cleaned title, type=series if applicable):", omdbUrl);

            try {
                const response = await fetch(omdbUrl);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();

                console.log("Background: OMDb API response:", data);
                if (data.Response === "True") {
                    const ratings = {
                        imdb: data.imdbRating,
                        rottenTomatoes: data.Ratings?.find((r: any) => r.Source === "Rotten Tomatoes")?.Value,
                        metacritic: data.Metascore,
                        year: data.Year,
                        genre: data.Genre,
                        runtime: data.Runtime,
                        plot: data.Plot
                    };
                    // Store in persistent cache
                    chrome.storage.local.set({ [originalTitle]: { data: ratings, timestamp: Date.now() } }, () => {
                        console.log("Background: Stored in persistent cache for:", originalTitle);
                    });
                    sendResponse({ ratings: ratings, searchedTitle: cleanedTitle });
                } else {
                    console.log("Background: OMDb API Response was False or no data:", data.Error || "No specific error message.");
                    sendResponse({ ratings: null, searchedTitle: cleanedTitle });
                }
            } catch (error) {
                console.error("Background: Error fetching rating from OMDb:", error);
                sendResponse({ ratings: null, searchedTitle: cleanedTitle });
            }
        });

        return true; // Indicates that the response is sent asynchronously
    }
});

// On extension install/update, set default state and inject into existing tabs
chrome.runtime.onInstalled.addListener(async () => {
    const isEnabled = await getIsEnabled();
    if (isEnabled) {
        const tabs = await chrome.tabs.query({
            url: [
                "*://*.netflix.com/*",
                "*://*.primevideo.com/*",
                "*://*.hotstar.com/*",
                "*://hotstar.com/*",
                "*://*.disneyhotstar.com/*",
                "*://*.hulu.com/*"
            ]
        });
        for (const tab of tabs) {
            if (tab.id) {
                injectContentScript(tab.id);
            }
        }
    }
});

// Listen for tab updates (e.g., navigation within a supported site)
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        const isEnabled = await getIsEnabled();
        if (isEnabled && (
            tab.url.includes("netflix.com") ||
            tab.url.includes("primevideo.com") ||
            tab.url.includes("hotstar.com") ||
            tab.url.includes("disneyhotstar.com") ||
            tab.url.includes("hulu.com")
        )) {
            // Send message to content script to update its state
            // This is a fallback if executeScript doesn't re-inject on navigation
            chrome.tabs.sendMessage(tabId, { type: "updateExtensionState", isEnabled: true }).catch(() => {
                // If content script is not yet injected, inject it
                injectContentScript(tabId);
            });
        }
    }
});