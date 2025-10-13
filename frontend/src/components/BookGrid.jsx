import React from 'react';
import BookCard from './BookCard';
import SkeletonLoader from './SkeletonLoader';

const BookGrid = ({ books, title, isLoading, onFindSimilar, onBookClick, isSearchResults }) => {
  // If data is loading and we have no books to show yet, display the skeleton loader.
  if (isLoading && (!books || books.length === 0)) {
    return <SkeletonLoader title={title || 'Loading...'} />;
  }
  
  // If this is for search results, it's not loading, and the list is empty, show the "empty state" message.
  if (isSearchResults && !isLoading && books.length === 0) {
    return (
      <div className="empty-state">
        <h3>No Matches Found</h3>
        <p>Try adjusting your similarity or category filters, or search for a different image.</p>
      </div>
    );
  }

  // If there are no books to display for any other reason, render nothing.
  if (!books || books.length === 0) {
    return null;
  }

  // Otherwise, render the grid of books.
  return (
    <section>
      {title && <h2>{title}</h2>}
      <div className="book-grid">
        {books.map((book) => (
          <BookCard 
            key={`${book.id}-${title || 'search'}`} 
            book={book} 
            onFindSimilar={onFindSimilar}
            onClick={() => onBookClick(book)} // Pass the click handler down to the card
          />
        ))}
      </div>
    </section>
  );
};

export default BookGrid;