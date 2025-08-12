import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import '../assets/Category.css';


const PRODUCTS_PER_PAGE = 12; // сколько товаров показывать за один раз

const Category = ({ categories, products }) => {
  const { id } = useParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(PRODUCTS_PER_PAGE);

  const category = categories.find(c => c.id === parseInt(id));
  const categoryProducts = products.filter(p => p.categoryId === parseInt(id));

  // Фильтрация товаров по поисковому запросу
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) {
      return categoryProducts;
    }
    
    const query = searchQuery.toLowerCase().trim();
    return categoryProducts.filter(product => 
      product.name.toLowerCase().includes(query) ||
      product.description.toLowerCase().includes(query)
    );
  }, [categoryProducts, searchQuery]);

  // Товары, которые сейчас видим (с учётом lazy load)
  const visibleProducts = filteredProducts.slice(0, visibleCount);

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + PRODUCTS_PER_PAGE);
  };

  if (!category) {
    return <div>Category not found</div>;
  }

  return (
    <div className="category-page">
      <div className="category-header">
        <h1>{category.name}</h1>
        <div className="search-container">
          <input
            type="text"
            placeholder={`Search in Category "${category.name}"...`}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setVisibleCount(PRODUCTS_PER_PAGE); // сброс видимых товаров при поиске
            }}
            className="category-search"
          />
        </div>
        <p>Found products: {filteredProducts.length} out of {categoryProducts.length}</p>
      </div>
      
      {categoryProducts.length === 0 ? (
        <div className="no-products">
          <p>There are no products in this category yet</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="no-products">
          <p>For the query "{searchQuery}" nothing found</p>
          <p>Try changing the search query</p>
        </div>
      ) : (
        <>
          <div className="products-grid">
            {visibleProducts.map(product => (
              <Link 
                key={product.id} 
                to={`/product/${product.id}`} 
                className="product-card"
              >
                <div className="product-image">
                  {product.images && product.images.length > 0 ? (
                    <img 
                      src={`http://localhost:5000${product.images[0]}`} 
                      alt={product.name} 
                    />
                  ) : (
                    '📦'
                  )}
                </div>
                <div className="product-info">
                  <h3 className="product-name">{product.name}</h3>
                  <div className="product-price">{product.price} ₼</div>
                  <p className="product-description">
                    {product.description.substring(0, 100)}...
                  </p>
                </div>
              </Link>
            ))}
          </div>

          {visibleCount < filteredProducts.length && (
            <div className="load-more-container">
              <button className="load-more-btn" onClick={handleLoadMore}>
                Load More
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Category;