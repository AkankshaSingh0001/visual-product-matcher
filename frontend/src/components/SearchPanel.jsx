import React, { useState } from 'react';

const SearchPanel = ({ onSearch, isLoading }) => {
  const [searchType, setSearchType] = useState('file');
  const [imageFile, setImageFile] = useState(null);
  const [imageURL, setImageURL] = useState('');
  const [previewURL, setPreviewURL] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreviewURL(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleUrlChange = (e) => {
    setImageURL(e.target.value);
    setImageFile(null);
    setPreviewURL(e.target.value);
  };

  const handleSearch = () => {
    onSearch({ imageFile, imageURL });
  };
  
  const isSearchDisabled = isLoading || (!imageFile && !imageURL);

  return (
    <div className="search-panel">
      <h2>Find a Similar Book</h2>
      <div className="tab-buttons">
        <button 
          className={searchType === 'file' ? 'active' : ''}
          onClick={() => setSearchType('file')}
        >
          Upload File
        </button>
        <button 
          className={searchType === 'url' ? 'active' : ''}
          onClick={() => setSearchType('url')}
        >
          Use Image URL
        </button>
      </div>

      {searchType === 'file' ? (
        <input type="file" accept="image/*" onChange={handleFileChange} />
      ) : (
        <input 
          type="text" 
          placeholder="Paste image URL here..." 
          value={imageURL}
          onChange={handleUrlChange}
        />
      )}

      {previewURL && (
        <div className="preview-container">
          <img src={previewURL} alt="Preview" onError={() => setPreviewURL('')}/>
        </div>
      )}

      <button className="search-button" onClick={handleSearch} disabled={isSearchDisabled}>
        {isLoading ? 'Searching...' : 'Search'}
      </button>
    </div>
  );
};

export default SearchPanel;

