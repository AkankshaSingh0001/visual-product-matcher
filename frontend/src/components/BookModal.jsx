import React, { useState, useEffect } from 'react';

const API_BASE_URL = 'http://localhost:5001';

const BookModal = ({ book, onClose }) => {
  const [details, setDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // This effect runs whenever a new book is selected to fetch its details
    if (!book) return;

    const fetchDetails = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/api/book-details/${book.id}`);
        if (!response.ok) throw new Error('Failed to fetch details from server.');
        const data = await response.json();
        setDetails(data);
      } catch (error) {
        console.error("Failed to fetch book details:", error);
        setDetails({ description: "Could not load details for this book." });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetails();
  }, [book]);

  // If no book is selected, the component renders nothing.
  if (!book) return null;

  const proxyImageUrl = `${API_BASE_URL}/api/image-proxy?url=${encodeURIComponent(book.cover_image_url)}`;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-button" onClick={onClose}>&times;</button>
        <div className="modal-body">
          <div className="modal-image-container">
            <img src={proxyImageUrl} alt={book.title} />
          </div>
          <div className="modal-details">
            <h2>{book.title}</h2>
            <p className="author">by {book.author}</p>
            {isLoading ? (
              <div className="details-skeleton">
                <div className="skeleton-text"></div>
                <div className="skeleton-text long"></div>
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
                  <a href={details.open_library_link} target="_blank" rel="noopener noreferrer" className="external-link">
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

export default BookModal;

