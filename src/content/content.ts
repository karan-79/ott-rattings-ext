
console.log("OTT Ratings content script loaded on:", window.location.href);

// Inject the UI script into the page
function injectUIScript() {
    // console.log("Attempting to inject UI script..."); // Removed for performance
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('assets/ui.js');
    script.type = 'module';
    script.onload = () => {
        // console.log("UI script injected and loaded."); // Removed for performance
        script.remove();
    };
    script.onerror = (e) => {
        console.error("Failed to inject UI script:", e);
    };
    (document.head || document.documentElement).appendChild(script);
}

injectUIScript();

const NETFLIX_SELECTORS = [
    ".title-card",
    ".slider-item",
    ".video-card",
    "div[data-list-item-id]",
    "a[aria-label][href*='/title/']",
    "div[data-ui-tracking-context*='video']",
];

function sendRatingsToUI(ratings: any, position: { x: number, y: number }) {
    // console.log("Sending ratings to UI:", ratings, position); // Removed for performance
    window.postMessage({ type: 'UPDATE_RATINGS_OVERLAY', payload: { ratings, position } }, '*');
}

function hideRatingsUI() {
    // console.log("Hiding ratings UI."); // Removed for performance
    window.postMessage({ type: 'HIDE_RATINGS_OVERLAY' }, '*');
}

let hoverTimeout: number | undefined;
const HOVER_DEBOUNCE_TIME = 300; // milliseconds

function findAndSendTitle(element: HTMLElement) {
    const titleElement = element.querySelector('[aria-label], .video-title, .title, .fallback-text');
    if (titleElement) {
        const title = titleElement.getAttribute('aria-label') || titleElement.textContent;
        if (title) {
            // console.log("Detected title:", title.trim()); // Removed for performance
            chrome.runtime.sendMessage({ type: "getRating", title: title.trim() }, (response) => {
                if (response) {
                    const rect = element.getBoundingClientRect();
                    sendRatingsToUI(response, { x: rect.right + window.scrollX + 10, y: rect.top + window.scrollY });
                } else {
                    // console.log("No ratings found for", title.trim()); // Removed for performance
                    hideRatingsUI();
                }
            });
        }
    } else {
        // console.log("No title element found within hovered element.", element); // Removed for performance
    }
}

function handleMouseOver(event: Event) {
    const mouseEvent = event as MouseEvent;
    const target = mouseEvent.target as HTMLElement;
    
    // Clear any existing timeout to restart the debounce timer
    if (hoverTimeout) {
        clearTimeout(hoverTimeout);
    }

    hoverTimeout = setTimeout(() => {
        let foundTitleCard = false;
        for (const selector of NETFLIX_SELECTORS) {
            const titleCard = target.closest(selector);
            if (titleCard) {
                // console.log("Mouse over detected on element matching selector:", selector, titleCard); // Removed for performance
                findAndSendTitle(titleCard as HTMLElement);
                foundTitleCard = true;
                break;
            }
        }
        if (!foundTitleCard) {
            // console.log("Mouse over on non-title card element:", target); // Removed for performance
        }
    }, HOVER_DEBOUNCE_TIME);
}

function handleMouseOut() {
    if (hoverTimeout) {
        clearTimeout(hoverTimeout);
    }
    hideRatingsUI();
}

function observeDOM() {
    // console.log("Starting DOM observation..."); // Removed for performance
    new MutationObserver((mutationsList) => {
        // console.log("MutationObserver fired.", mutationsList.length, "mutations."); // Removed for performance
        for(const mutation of mutationsList) {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(node => {
                    if (node instanceof HTMLElement) {
                        for (const selector of NETFLIX_SELECTORS) {
                            const elements = node.querySelectorAll(selector);
                            elements.forEach(element => {
                                // console.log("Adding listeners to new element matching selector:", selector, element); // Removed for performance
                                element.addEventListener('mouseover', handleMouseOver);
                                element.addEventListener('mouseout', handleMouseOut);
                            });
                            if (node.matches(selector)) {
                                // console.log("Adding listeners to new node matching selector:", selector, node); // Removed for performance
                                node.addEventListener('mouseover', handleMouseOver);
                                node.addEventListener('mouseout', handleMouseOut);
                            }
                        }
                    }
                });
            }
        }
    }).observe(document.body, { childList: true, subtree: true });

    // Also add listeners to existing elements on initial load
    for (const selector of NETFLIX_SELECTORS) {
        document.querySelectorAll(selector).forEach(element => {
            // console.log("Adding listeners to existing element matching selector:", selector, element); // Removed for performance
            element.addEventListener('mouseover', handleMouseOver);
            element.addEventListener('mouseout', handleMouseOut);
        });
    }
    // console.log("Initial listeners added."); // Removed for performance
}

observeDOM();
