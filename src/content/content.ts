
console.log("OTT Ratings content script loaded on:", window.location.href);

let extensionEnabled = true; // Default state

// Function to inject the UI script into the page
function injectUIScript() {
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('assets/ui.js');
    script.type = 'module';
    script.onload = () => {
        script.remove();
    };
    script.onerror = (e) => {
        console.error("Failed to inject UI script:", e);
    };
    (document.head || document.documentElement).appendChild(script);
}

// Inject UI script immediately, it will handle its own visibility
injectUIScript();

const PLATFORM_SELECTORS = [
    // Netflix selectors
    ".title-card",
    ".slider-item",
    ".video-card",
    "div[data-list-item-id]",
    "a[aria-label][href*='/title/']",
    "div[data-ui-tracking-context*='video']",
    // Amazon Prime Video selectors
    "article[data-testid='card']",
    "article[data-testid='super-carousel-card']",
    // Jio Hotstar selectors
    "div[data-testid='tray-card-default']",
];

// Pass the entire rect and the response object to the UI script
function sendRatingsToUI(payload: { status: 'loading' | 'success' | 'error', ratings?: any, searchedTitle: string }, rect: DOMRect) {
    if (!extensionEnabled) return; // Don't send if disabled
    window.postMessage({ type: 'UPDATE_RATINGS_OVERLAY', payload: { response: payload, rect: { top: rect.top, left: rect.left, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height } } }, '*');
}

function hideRatingsUI() {
    window.postMessage({ type: 'HIDE_RATINGS_OVERLAY' }, '*');
}

let hoverTimeout: number | undefined;
const HOVER_DEBOUNCE_TIME = 300; // milliseconds
const ANIMATION_SETTLE_DELAY = 150; // milliseconds to wait for hover animations to settle

function findAndSendTitle(element: HTMLElement) {
    let title: string | null = null;

    // Try to get title from data-card-title attribute (common on Prime Video)
    if (element.hasAttribute('data-card-title')) {
        title = element.getAttribute('data-card-title');
    }

    // Try to get title from aria-label on the element itself (common on Prime Video featured)
    if (!title && element.hasAttribute('aria-label')) {
        title = element.getAttribute('aria-label');
    }

    // Try to get title from aria-label on a child element with data-testid="action" (common on Hotstar)
    if (!title) {
        const actionElement = element.querySelector('[data-testid="action"]');
        if (actionElement && actionElement.hasAttribute('aria-label')) {
            const hotstarLabel = actionElement.getAttribute('aria-label');
            if (hotstarLabel) {
                title = hotstarLabel.split(',')[0]; // Take the part before the comma
            }
        }
    }

    // Fallback to existing title detection methods
    if (!title) {
        const titleElement = element.querySelector('[aria-label], .video-title, .title, .fallback-text');
        if (titleElement) {
            title = titleElement.getAttribute('aria-label') || titleElement.textContent;
        }
    }

    if (title) {
        const currentTitle = title.trim();
        const initialRect = element.getBoundingClientRect();

        // Immediately send loading state with initial rect
        sendRatingsToUI({ status: 'loading', searchedTitle: currentTitle }, initialRect);

        // Send message to background script to fetch ratings
        chrome.runtime.sendMessage({ type: "getRating", title: currentTitle }, (response) => {
            // Schedule the final UI update after a consistent delay, now that response is available
            setTimeout(() => {
                const finalRect = element.getBoundingClientRect(); // Get the latest rect after animation settles
                if (response && response.ratings) {
                    sendRatingsToUI({ status: 'success', ratings: response.ratings, searchedTitle: response.searchedTitle }, finalRect);
                } else { // response is null or ratings are null (error/not found)
                    sendRatingsToUI({ status: 'error', searchedTitle: response.searchedTitle }, finalRect);
                }
            }, ANIMATION_SETTLE_DELAY);
        });

    } else {
        // If no title is found, hide the UI (as there's nothing to search for)
        hideRatingsUI();
    }
}

function handleMouseOver(event: Event) {
    if (!extensionEnabled) return; // Do nothing if disabled
    const mouseEvent = event as MouseEvent;
    const target = mouseEvent.target as HTMLElement;
    
    // Clear any existing timeout to restart the debounce timer
    if (hoverTimeout) {
        clearTimeout(hoverTimeout);
    }

    hoverTimeout = setTimeout(() => {
        for (const selector of PLATFORM_SELECTORS) {
            const titleCard = target.closest(selector);
            if (titleCard) {
                findAndSendTitle(titleCard as HTMLElement);
                break; // Found a matching selector, no need to check others
            }
        }
    }, HOVER_DEBOUNCE_TIME);
}

function handleMouseOut() {
    if (hoverTimeout) {
        clearTimeout(hoverTimeout);
    }
    hideRatingsUI();
}

let observer: MutationObserver | null = null;

function observeDOM() {
    if (observer) observer.disconnect(); // Disconnect previous observer if exists

    observer = new MutationObserver((mutationsList) => {
        if (!extensionEnabled) return; // Do nothing if disabled
        for(const mutation of mutationsList) {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(node => {
                    if (node instanceof HTMLElement) {
                        for (const selector of PLATFORM_SELECTORS) {
                            const elements = node.querySelectorAll(selector);
                            elements.forEach(element => {
                                element.addEventListener('mouseover', handleMouseOver);
                                element.addEventListener('mouseout', handleMouseOut);
                            });
                            if (node.matches(selector)) {
                                node.addEventListener('mouseover', handleMouseOver);
                                node.addEventListener('mouseout', handleMouseOut);
                            }
                        }
                    }
                });
            }
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    for (const selector of PLATFORM_SELECTORS) {
        document.querySelectorAll(selector).forEach(element => {
            element.addEventListener('mouseover', handleMouseOver);
            element.addEventListener('mouseout', handleMouseOut);
        });
    }
}

function disconnectDOMObserver() {
    if (observer) {
        observer.disconnect();
        observer = null;
    }
    // Also remove all existing event listeners to prevent memory leaks and unwanted behavior
    for (const selector of PLATFORM_SELECTORS) {
        document.querySelectorAll(selector).forEach(element => {
            element.removeEventListener('mouseover', handleMouseOver);
            element.removeEventListener('mouseout', handleMouseOut);
        });
    }
    hideRatingsUI(); // Hide any visible UI when disabled
}

// Listen for messages from the background script to update enabled state
chrome.runtime.onMessage.addListener((request, _sender, _sendResponse) => {
    if (request.type === "updateExtensionState") {
        extensionEnabled = request.isEnabled;
        console.log("Content script: Extension state updated to", extensionEnabled);
        if (extensionEnabled) {
            observeDOM(); // Re-enable observation and listeners
        } else {
            disconnectDOMObserver(); // Disable observation and remove listeners
        }
    }
});

// Initial check for enabled state from storage (in case content script is injected after background script is ready)
chrome.storage.local.get(['isEnabled'], (result) => {
    extensionEnabled = result.isEnabled !== undefined ? result.isEnabled : true; // Default to true
    if (extensionEnabled) {
        observeDOM();
    } else {
        disconnectDOMObserver();
    }
});
