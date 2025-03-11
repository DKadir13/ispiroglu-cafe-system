import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import AdminPanel from './components/AdminPanel';
import CafeMenu from './components/CafeMenu';
import Tables from './components/Tables';
import Login from './components/Login';
import { Product } from './types';
import { Coffee, Menu, X } from 'lucide-react';

function App() {
  const [menuItems, setMenuItems] = useState<Product[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  
  const navigate = useNavigate();

  // Fetch menu items from API
  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        const response = await fetch('https://ispiroglucafe.com/menu-items');
        const data = await response.json();
        setMenuItems(data);
      } catch (error) {
        console.error('Menü öğeleri alınırken hata oluştu:', error);
      }
    };
    fetchMenuItems();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-amber-800 text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Coffee size={24} />
            <h1 className="text-xl font-bold">İspiroğlu Cafe</h1>
          </div>
          <button
            className="md:hidden text-white"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>
      
      <main className="container mx-auto p-4">
        <Routes>
          <Route path="/" element={<CafeMenu  />} />
          <Route path="/login" element={<Login />} />
          <Route path="/tables" element={<Tables />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;