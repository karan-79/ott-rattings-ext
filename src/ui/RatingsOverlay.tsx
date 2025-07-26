import React from 'react';

interface RatingsOverlayProps {
  imdb?: string;
  rottenTomatoes?: string;
  metacritic?: string;
}

const RatingsOverlay: React.FC<RatingsOverlayProps> = ({ imdb, rottenTomatoes, metacritic }) => {
  const hasRatings = imdb || rottenTomatoes || metacritic;

  return (
    <div style={{
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
    }}>
      {hasRatings ? (
        <>
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
        </>
      ) : (
        <p style={{ margin: '0', color: '#B0B0B0' }}>No ratings available.</p>
      )}
    </div>
  );
};

export default RatingsOverlay;
