import React from 'react';

interface RatingsOverlayProps {
  imdb?: string;
  rottenTomatoes?: string;
  metacritic?: string;
}

const RatingsOverlay: React.FC<RatingsOverlayProps> = ({ imdb, rottenTomatoes, metacritic }) => {
  return (
    <div style={{
      position: 'absolute',
      backgroundColor: 'rgba(255, 0, 0, 0.9)', // Bright red background for visibility
      color: 'white',
      padding: '8px 12px',
      borderRadius: '5px',
      zIndex: 99999, // Ensure it's on top of everything
      fontSize: '14px',
      pointerEvents: 'none',
      whiteSpace: 'nowrap',
      border: '2px solid yellow', // Yellow border for extra visibility
      minWidth: '150px', // Ensure it has some size
      boxSizing: 'border-box'
    }}>
      <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>Ratings:</p>
      {imdb && <p style={{ margin: '0' }}>IMDb: {imdb}</p>}
      {rottenTomatoes && <p style={{ margin: '0' }}>Rotten Tomatoes: {rottenTomatoes}</p>}
      {metacritic && <p style={{ margin: '0' }}>Metacritic: {metacritic}</p>}
      {!imdb && !rottenTomatoes && !metacritic && <p style={{ margin: '0' }}>No ratings available.</p>}
    </div>
  );
};

export default RatingsOverlay;