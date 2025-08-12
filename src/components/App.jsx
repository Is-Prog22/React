import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import '../assets/App.css';
import Header from './Header';
import Home from './Home';
import Category from './Category';
import Login from './Login';
import AdminPanel from './AdminPanel';
import ProductDetail from './ProductDetail';
import CartPage from './CartPage'; 
import { CartProvider } from './CartContent';
import Footer from './Footer';
import About from './About';
import Advertising from './Advertising';
import PrivacyPolicy from './Privacy';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userData, setUserData] = useState(null);

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, categoriesRes, usersRes] = await Promise.all([
          fetch('http://localhost:5000/products'),
          fetch('http://localhost:5000/categories'),
          fetch('http://localhost:5000/users'),
        ]);

        if (!productsRes.ok || !categoriesRes.ok || !usersRes.ok) {
          throw new Error('Error loading data from the server');
        }

        const productsData = await productsRes.json();
        const categoriesData = await categoriesRes.json();
        const usersData = await usersRes.json();

        setProducts(productsData);
        setCategories(categoriesData);
        setUsers(usersData);
      } catch (error) {
        console.error(error);
        alert('Error loading data from the server');
      }
    };

    fetchData();
  }, []);

  const handleLogin = (email, username) => {
    const newUser = { email, username, loginTime: new Date().toISOString() };
    setUsers(prev => [...prev, newUser]);

    const adminEmail = process.env.REACT_APP_ADMIN_EMAIL?.toLowerCase();
    const adminUsername = process.env.REACT_APP_ADMIN_NAME?.toLowerCase();

    if (
      email.toLowerCase() === adminEmail &&
      username.toLowerCase() === adminUsername
    ) {
      setIsAdmin(true);
      setIsLoggedIn(true);
      setUserData(newUser);
    } else {
      setIsLoggedIn(true);
      setUserData(newUser);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setIsAdmin(false);
    setUserData(null);
  };

  const addProduct = async (formData) => {
    try {
      const res = await fetch('http://localhost:5000/products', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Error adding product');

      const newProduct = await res.json();
      setProducts(prev => [...prev, newProduct]);
      return true;
    } catch (error) {
      alert(error.message);
      return false;
    }
  };

  const updateProduct = async (id, formData) => {
    try {
      const res = await fetch(`http://localhost:5000/products/${id}`, {
        method: 'PUT',
        body: formData,
      });

      if (!res.ok) throw new Error('Error updating product');

      const updated = await res.json();

      setProducts(prev => prev.map(p => (p.id === id ? updated : p)));
      return true;
    } catch (error) {
      alert(error.message);
      return false;
    }
  };

  const deleteProduct = async (id) => {
    try {
      const res = await fetch(`http://localhost:5000/products/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Error deleting product');

      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      alert(error.message);
    }
  };

  const addCategory = async (category) => {
    if (!category.name || !category.description) {
      alert('Please fill in all fields!');
      return false;
    }

    try {
      const res = await fetch('http://localhost:5000/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(category),
      });

      if (!res.ok) throw new Error('Error adding category');

      const newCategory = await res.json();
      setCategories(prev => [...prev, newCategory]);
      return true;
    } catch (error) {
      alert(error.message);
      return false;
    }
  };

  const deleteCategory = async (id) => {
    try {
      const res = await fetch(`http://localhost:5000/categories/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Error deleting category');

      setCategories(prev => prev.filter(c => c.id !== id));
      setProducts(prev => prev.filter(p => p.categoryId !== id));
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <CartProvider>
      <Router>
        <div className="App">
          <Header 
            isLoggedIn={isLoggedIn} 
            isAdmin={isAdmin} 
            onLogout={handleLogout}
            userData={userData}
          />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home categories={categories} />} />
              <Route path="/category/:id" element={<Category categories={categories} products={products} />} />
              <Route path="/product/:id" element={<ProductDetail products={products} />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/login" element={
                !isLoggedIn ? (
                  <Login onLogin={handleLogin} />
                ) : isAdmin ? (
                  <Navigate to="/admin" />
                ) : (
                  <Navigate to="/" />
                )
              } />
              <Route path="/admin" element={
                isAdmin ? (
                  <AdminPanel 
                    products={products}
                    categories={categories}
                    users={users}
                    onAddProduct={addProduct}
                    onUpdateProduct={updateProduct}
                    onDeleteProduct={deleteProduct}
                    onAddCategory={addCategory}
                    onDeleteCategory={deleteCategory}
                  />
                ) : (
                  <Navigate to="/login" />
                )
              } />
              {/* Новые страницы */}
              <Route path="/about" element={<About />} />
              <Route path="/advertising" element={<Advertising />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            </Routes>
          </main>

          {/* Footer */}
          <footer className="footer">
            <div className="footer-content">
              <div className="footer-links">
                <Link to="/about" className="footer-link">About Us</Link>
                <Link to="/advertising" className="footer-link">Реклама</Link>
                <Link to="/privacy-policy" className="footer-link">Политика конфиденциальности</Link>
              </div>
              <div className="footer-rights">
                <span>© {new Date().getFullYear()} Fast And Trust. All rights reserved.</span>
              </div>
            </div>
          </footer>
        </div>
      </Router>
    </CartProvider>
  );
}

export default App;