import { useState, useEffect, useCallback } from 'react';
import './App.css';
import BookGrid from './components/BookGrid';
import image from './image.jpg';
import SearchPanel from './components/SearchPanel';

const API_BASE_URL = 'http://localhost:5001';
const BOOKS_PER_PAGE = 24;

function App() {
  const [allBooks, setAllBooks] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreBooks, setHasMoreBooks] = useState(true);
  const [isCollectionLoading, setIsCollectionLoading] = useState(false);
  
  const [searchResults, setSearchResults] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  
  const [error, setError] = useState('');
  const [similarityFilter, setSimilarityFilter] = useState(0);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');

  // The state for managing the modal has been removed.

  const fetchBooksPage = useCallback(async (page) => {
    setIsCollectionLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/books?page=${page}&limit=${BOOKS_PER_PAGE}`);
      const data = await response.json();
      setAllBooks(prevBooks => page === 1 ? data.books : [...prevBooks, ...data.books]);
      setHasMoreBooks((page * BOOKS_PER_PAGE) < data.total);
    } catch (err) {
      setError('Could not connect to the server.');
    } finally {
      setIsCollectionLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBooksPage(1);
  }, [fetchBooksPage]);

  const loadMoreBooks = () => {
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    fetchBooksPage(nextPage);
  };
  
  useEffect(() => {
    if (searchResults.length > 0) {
      let results = searchResults;
      if (selectedCategory !== 'All') results = results.filter(book => book.category === selectedCategory);
      results = results.filter(book => (book.similarity * 100) >= similarityFilter);
      setFilteredResults(results);
    }
  }, [similarityFilter, selectedCategory, searchResults]);

  const handleSearch = useCallback(async ({ imageFile, imageURL }) => {
    setIsSearchLoading(true);
    setError('');
    setSearchResults([]);
    setFilteredResults([]);
    let response;
    try {
      if(imageFile){const f=new FormData();f.append('image',imageFile);response=await fetch(`${API_BASE_URL}/api/search`,{method:'POST',body:f})}else if(imageURL){response=await fetch(`${API_BASE_URL}/api/search`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({imageUrl:imageURL})})}else{throw new Error("Provide image or URL.")}
      if(!response.ok){const e=await response.json();throw new Error(e.error||'Search failed.')}
      const r=await response.json();setSearchResults(r);setFilteredResults(r);
      const c=['All',...new Set(r.map(b=>b.category).filter(Boolean))];setAvailableCategories(c);
    } catch (err) { setError(err.message) } finally { setIsSearchLoading(false) }
  }, []);
  
  const handleFindSimilar = useCallback(async (bookId) => {
    setIsSearchLoading(true);
    setError('');
    setSearchResults([]);
    setFilteredResults([]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    try {
      const response = await fetch(`${API_BASE_URL}/api/search-by-id`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:bookId})});
      if(!response.ok){const e=await response.json();throw new Error(e.error||'Find similar failed.')}
      const r=await response.json();setSearchResults(r);setFilteredResults(r);
      const c=['All',...new Set(r.map(b=>b.category).filter(Boolean))];setAvailableCategories(c);
    } catch (err) { setError(err.message) } finally { setIsSearchLoading(false) }
  }, []);

  const handleClearSearch = () => {
    setSearchResults([]);
    setFilteredResults([]);
    setAvailableCategories([]);
    setSelectedCategory('All');
    setSimilarityFilter(0);
    setError('');
  };

  const showSearchResults = searchResults.length > 0 || isSearchLoading;

  return (
    <div className="container">
      <header>
        <div><img src={image} alt="Image description" /></div>
      </header>
      <main>
        <div className="main-layout">
          <aside>
            <SearchPanel onSearch={handleSearch} isLoading={isSearchLoading} />
          </aside>
          <div className="content">
            {error && <p className="error-message">Error: {error}</p>}
            
            {showSearchResults && (
              <div className="search-results-container">
                <div className="results-header">
                  <h2>Search Results</h2>
                  <button onClick={handleClearSearch} className="clear-search-button">Clear Search</button>
                </div>
                {!isSearchLoading && (
                  <>
                    <div className="filter-panel">
                      <label htmlFor="similarity">Minimum Match: {similarityFilter}%</label>
                      <input type="range" id="similarity" min="0" max="100" value={similarityFilter} onChange={(e) => setSimilarityFilter(Number(e.target.value))} />
                    </div>
                    {availableCategories.length > 1 && (
                      <div className="category-filter">
                        {availableCategories.map(c=>(<button key={c} className={`category-button ${selectedCategory === c ? 'active' : ''}`} onClick={() => setSelectedCategory(c)}>{c}</button>))}
                      </div>
                    )}
                  </>
                )}
                <BookGrid books={filteredResults} isLoading={isSearchLoading} onFindSimilar={handleFindSimilar} isSearchResults={true} />
              </div>
            )}
            
            {!showSearchResults && (
              <div className="collection-container">
                <BookGrid books={allBooks} title={``} isLoading={isCollectionLoading && allBooks.length === 0} onFindSimilar={handleFindSimilar} />
                {hasMoreBooks && !isCollectionLoading && (
                  <div className="load-more-container">
                    <button onClick={loadMoreBooks} className="load-more-button">Load More</button>
                  </div>
                )}
                {isCollectionLoading && allBooks.length > 0 && <p className="loading-more">Loading more books...</p>}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;

