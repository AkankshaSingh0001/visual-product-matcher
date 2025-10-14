import React, { useState } from 'react';

const API_BASE_URL = 'http://localhost:5001';

const BookCard = ({ book, onFindSimilar }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [details, setDetails] = useState(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  const proxyImageUrl = `${API_BASE_URL}/api/image-proxy?url=${encodeURIComponent(book.cover_image_url)}`;

  const handleFlip = () => {
    if (!details && !isFlipped) {
      fetchDetails();
    }
    setIsFlipped(!isFlipped);
  };

  const fetchDetails = async () => {
    setIsLoadingDetails(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/book-details/${book.id}`);
      if (!response.ok) throw new Error('Failed to fetch details.');
      const data = await response.json();
      setDetails(data);
    } catch (error) {
      console.error("Failed to fetch book details:", error);
      setDetails({ description: "Could not load details." });
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleSimilarClick = (e) => {
    e.stopPropagation();
    onFindSimilar(book.id);
  };

  return (
    <div className="card-container" onClick={handleFlip}>
      <div className={`book-card ${isFlipped ? 'is-flipped' : ''}`}>
        {/* --- FRONT OF THE CARD --- */}
        <div className="card-face card-face--front">
          <img src={proxyImageUrl} alt={book.title} />
          <div className="book-info">
          {book.similarity && (
              <p className="similarity">
                Match: {(book.similarity * 100).toFixed(1)}%
              </p>
            )}
            <br></br><h3>{book.title}</h3>
            <p>{book.author}</p>
            
          </div>
          <button className="find-similar-button" title="Find similar books" onClick={handleSimilarClick}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" /></svg>
          </button>
        </div>

        {/* --- BACK OF THE CARD --- */}
        <div className="card-face card-face--back">
          <div className="back-content">
            <h3>{book.title}</h3>
            {isLoadingDetails ? (
              <div className="details-skeleton">
                <div className="skeleton-text"></div>
                <div className="skeleton-text long"></div>
                <div className="skeleton-text short"></div>
              </div>
            ) : (
              <>
                <p className="description">{details?.description}</p>
                <div className="meta-info">
                  <strong>Published:</strong> {details?.publish_date || 'N/A'}
                </div>
                {details?.open_library_link && (
                  <a href={details.open_library_link} target="_blank" rel="noopener noreferrer" className="external-link" onClick={(e) => e.stopPropagation()}>
                    View on Open Library
                  </a>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookCard;