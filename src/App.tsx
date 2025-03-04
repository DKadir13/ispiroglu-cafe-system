import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import AdminPanel from './components/AdminPanel';
import CafeMenu from './components/CafeMenu';
import Tables from './components/Tables';
import Login from './components/Login';
import { Product, Order } from './types';
import { Coffee, Menu, X } from 'lucide-react';

function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [tableCount, setTableCount] = useState<number>(6);
  const [lastEndOfDay, setLastEndOfDay] = useState<Date>(new Date());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authRole, setAuthRole] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  
  const navigate = useNavigate();
  const location = useLocation();

  // Check if user is authenticated on initial load
  useEffect(() => {
    const auth = localStorage.getItem('cafeAuth');
    if (auth) {
      const authData = JSON.parse(auth);
      setIsAuthenticated(true);
      setAuthRole(authData.role);
    }
  }, []);

  // Redirect unauthenticated users
  useEffect(() => {
    if (!isAuthenticated) {
      if (location.pathname === '/admin' || location.pathname === '/tables') {
        navigate('/login', { state: { from: location.pathname } });
      }
    }
  }, [isAuthenticated, location.pathname, navigate]);

  // Fetch products from API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('https://api.example.com/products'); // Replace with your API URL
        const data = await response.json();
        setProducts(data);
      } catch (error) {
        console.error('Ürünler alınırken hata oluştu:', error);
      }
    };

    fetchProducts();
  }, []);

  const handleLogin = (username: string, password: string, role: string) => {
    // Simple authentication
    if (username === 'abc' && password === '1234') {
      setIsAuthenticated(true);
      setAuthRole(role);
      localStorage.setItem('cafeAuth', JSON.stringify({ isAuthenticated: true, role }));
      navigate(role === 'admin' ? '/admin' : '/tables');
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setAuthRole(null);
    localStorage.removeItem('cafeAuth');
    navigate('/');
  };

  const addProduct = async (product: Omit<Product, 'id'>) => {
    // This would be an API call in a real application
    try {
      const response = await fetch('https://api.example.com/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product)
      });
      const newProduct = await response.json();
      setProducts([...products, newProduct]);
      return newProduct;
    } catch (error) {
      console.error('Ürün eklenirken hata oluştu:', error);
      throw error;
    }
  };

  const updateProduct = async (product: Product) => {
    // This would be an API call in a real application
    try {
      const response = await fetch(`https://api.example.com/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product)
      });
      const updatedProduct = await response.json();
      setProducts(products.map(p => p.id === product.id ? updatedProduct : p));
      return updatedProduct;
    } catch (error) {
      console.error('Ürün güncellenirken hata oluştu:', error);
      throw error;
    }
  };

  const deleteProduct = async (id: number) => {
    // This would be an API call in a real application
    try {
      await fetch(`https://api.example.com/products/${id}`, {
        method: 'DELETE'
      });
      setProducts(products.filter(p => p.id !== id));
    } catch (error) {
      console.error('Ürün silinirken hata oluştu:', error);
      throw error;
    }
  };

  const addOrder = (order: Order) => {
    setOrders([...orders, order]);
  };

  const endDay = async () => {
    // This would be an API call in a real application
    try {
      const ordersToSend = orders.filter(order => 
        new Date(order.timestamp) > lastEndOfDay
      );
      const response = await fetch('https://api.example.com/end-of-day', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orders: ordersToSend, timestamp: new Date() })
      });
      await response.json();
      setLastEndOfDay(new Date());
      return ordersToSend;
    } catch (error) {
      console.error('Gün sonu raporu alınırken hata oluştu:', error);
      throw error;
    }
  };

  const updateTableCount = (count: number) => {
    setTableCount(count);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-amber-800 text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Coffee size={24} />
            <h1 className="text-xl font-bold">İspiroğlu Cafe</h1>
          </div>
          <nav className="hidden md:flex gap-4">
            <a href="/" className="hover:underline">Menü</a>
            {isAuthenticated && (
              <>
                {(authRole === 'tables' || authRole === 'admin') && (
                  <a href="/tables" className="hover:underline">Masalar</a>
                )}
                {authRole === 'admin' && (
                  <a href="/admin" className="hover:underline">Yönetim</a>
                )}
                <button 
                  onClick={handleLogout}
                  className="hover:underline text-white"
                >
                  Çıkış Yap
                </button>
              </>
            )}
            {!isAuthenticated && (
              <a href="/login" className="hover:underline"></a>
            )}
          </nav>
          <button
            className="md:hidden text-white"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
        {isMenuOpen && (
          <nav className="md:hidden flex flex-col gap-4 mt-4">
            <a href="/" className="hover:underline">Menü</a>
            {isAuthenticated && (
              <>
                {(authRole === 'tables' || authRole === 'admin') && (
                  <a href="/tables" className="hover:underline">Masalar</a>
                )}
                {authRole === 'admin' && (
                  <a href="/admin" className="hover:underline">Yönetim</a>
                )}
                <button 
                  onClick={handleLogout}
                  className="hover:underline text-white"
                >
                  Çıkış Yap
                </button>
              </>
            )}
            {!isAuthenticated && (
              <a href="/login" className="hover:underline"></a>
            )}
          </nav>
        )}
      </header>
      
      <main className="container mx-auto p-4">
        <Routes>
          <Route path="/" element={<CafeMenu products={products} />} />
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route 
            path="/tables" 
            element={
              isAuthenticated && (authRole === 'tables' || authRole === 'admin') ? (
                <Tables 
                  products={products} 
                  tableCount={tableCount} 
                  addOrder={addOrder} 
                />
              ) : (
                <Navigate to="/login" state={{ from: '/tables' }} replace />
              )
            } 
          />
          <Route 
            path="/admin" 
            element={
              isAuthenticated && authRole === 'admin' ? (
                <AdminPanel 
                  products={products} 
                  addProduct={addProduct} 
                  updateProduct={updateProduct} 
                  deleteProduct={deleteProduct}
                  tableCount={tableCount}
                  updateTableCount={updateTableCount}
                  endDay={endDay}
                  orders={orders}
                  lastEndOfDay={lastEndOfDay}
                />
              ) : (
                <Navigate to="/login" state={{ from: '/admin' }} replace />
              )
            } 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;