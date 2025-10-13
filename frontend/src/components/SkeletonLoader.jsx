import React from 'react';

const SkeletonLoader = ({ title }) => {
  return (
    <section>
      {title && <h2>{title}</h2>}
      <div className="book-grid skeleton">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="book-card-skeleton">
            <div className="skeleton-img"></div>
            <div className="skeleton-text"></div>
            <div className="skeleton-text short"></div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default SkeletonLoader;

