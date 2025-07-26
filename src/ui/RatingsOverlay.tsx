import React, { useState, useEffect, useRef } from 'react';

interface RatingsOverlayProps {
  imdb?: string;
  rottenTomatoes?: string;
  metacritic?: string;
  year?: string;
  genre?: string;
  runtime?: string;
  plot?: string;
  searchedTitle: string;
  rect: DOMRect; // Bounding client rect of the hovered element
  status: 'loading' | 'success' | 'error'; // New status prop
}

const RatingsOverlay: React.FC<RatingsOverlayProps> = ({ imdb, rottenTomatoes, metacritic, year, genre, runtime, plot, searchedTitle, rect, status }) => {
  const hasRatings = imdb || rottenTomatoes || metacritic;
  const hasMetadata = year || genre || runtime || plot;
  const overlayRef = useRef<HTMLDivElement>(null);
  const [leftPosition, setLeftPosition] = useState(rect.right + window.scrollX + 10); // Initial guess

  useEffect(() => {
    if (overlayRef.current) {
      const overlayRect = overlayRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;

      let newLeft = rect.right + window.scrollX + 10; // Default to right

      // If overlay goes off screen to the right
      if (newLeft + overlayRect.width > viewportWidth) {
        // Position to the left of the hovered element
        newLeft = rect.left + window.scrollX - overlayRect.width - 10;
        // Ensure it doesn't go off screen to the left either
        if (newLeft < 0) {
          newLeft = 0; // Clamp to left edge
        }
      }
      setLeftPosition(newLeft);
    }
  }, [imdb, rottenTomatoes, metacritic, year, genre, runtime, plot, searchedTitle, rect, status]); // Recalculate if props change

  return (
    <div ref={overlayRef} style={{
      position: 'absolute',
      backgroundColor: 'rgba(20, 20, 20, 0.9)', // Dark, slightly transparent background
      color: '#E0E0E0', // Light grey text
      padding: '10px 15px',
      borderRadius: '8px',
      zIndex: 99999, // Ensure it's on top
      fontSize: '13px',
      fontFamily: 'Inter, sans-serif', // Modern font stack
      pointerEvents: 'none',
      whiteSpace: 'nowrap',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)', // Subtle shadow
      backdropFilter: 'blur(8px)', // Frosted glass effect
      WebkitBackdropFilter: 'blur(8px)', // For Safari compatibility
      border: '1px solid rgba(255, 255, 255, 0.1)', // Very subtle light border
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
      left: `${leftPosition}px`,
      top: `${rect.top + window.scrollY}px`,
    }}>
      <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', color: '#FFF' }}>
        Searched for: "{searchedTitle}"
      </p>
      {status === 'loading' && (
        <p style={{ margin: '0', color: '#B0B0B0' }}>Loading ratings...</p>
      )}
      {status === 'error' && (
        <p style={{ margin: '0', color: '#FF6B6B' }}>Error or No ratings found.</p>
      )}
      {status === 'success' && (
        <>
          {hasRatings && (
            <div style={{ marginBottom: hasMetadata ? '8px' : '0' }}>
              {imdb && (
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ fontWeight: 'bold', color: '#F5C518', marginRight: '5px' }}>IMDb:</span>
                  <span>{imdb}</span>
                </div>
              )}
              {rottenTomatoes && (
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ fontWeight: 'bold', color: '#FA320A', marginRight: '5px' }}>RT:</span>
                  <span>{rottenTomatoes}</span>
                </div>
              )}
              {metacritic && (
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ fontWeight: 'bold', color: '#6C3', marginRight: '5px' }}>MC:</span>
                  <span>{metacritic}</span>
                </div>
              )}
            </div>
          )}

          {hasMetadata && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '12px', color: '#B0B0B0' }}>
              {year && <p style={{ margin: '0' }}>Year: {year}</p>}
              {genre && <p style={{ margin: '0' }}>Genre: {genre}</p>}
              {runtime && <p style={{ margin: '0' }}>Runtime: {runtime}</p>}
              {plot && <p style={{ margin: '0' }}>Plot: {plot.substring(0, 100)}...</p>} {/* Truncate plot for brevity */}
            </div>
          )}

          {!hasRatings && !hasMetadata && (
            <p style={{ margin: '0', color: '#B0B0B0' }}>No ratings or metadata available.</p>
          )}
        </>
      )}
    </div>
  );
};

export default RatingsOverlay;
