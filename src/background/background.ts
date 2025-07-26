const API_KEY = import.meta.env.VITE_OMDB_API_KEY;

const ratingsCache: { [title: string]: any } = {}; // Simple in-memory cache
const CACHE_DURATION = 1000 * 60 * 60; // Cache for 1 hour (adjust as needed)

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    if (request.type === "getRating") {
        const title = request.title;
        console.log("Background: Received title:", title);

        if (!API_KEY) {
            console.error("Background: OMDb API Key is not defined.");
            sendResponse(null);
            return;
        }

        // Check cache first
        if (ratingsCache[title] && (Date.now() - ratingsCache[title].timestamp < CACHE_DURATION)) {
            console.log("Background: Serving from cache for:", title);
            sendResponse(ratingsCache[title].data);
            return true; // Respond asynchronously
        }

        const omdbUrl = `http://www.omdbapi.com/?t=${encodeURIComponent(title)}&apikey=${API_KEY}`;
        console.log("Background: Fetching from OMDb:", omdbUrl);

        fetch(omdbUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log("Background: OMDb API response:", data);
                if (data.Response === "True") {
                    const ratings = {
                        imdb: data.imdbRating,
                        rottenTomatoes: data.Ratings?.find((r: any) => r.Source === "Rotten Tomatoes")?.Value,
                        metacritic: data.Metascore
                    };
                    // Store in cache
                    ratingsCache[title] = { data: ratings, timestamp: Date.now() };
                    console.log("Background: Sending ratings:", ratings);
                    sendResponse(ratings);
                } else {
                    console.log("Background: OMDb API Response was False or no data:", data.Error || "No specific error message.");
                    sendResponse(null);
                }
            })
            .catch(error => {
                console.error("Background: Error fetching rating from OMDb:", error);
                sendResponse(null);
            });

        return true; // Indicates that the response is sent asynchronously
    }
});