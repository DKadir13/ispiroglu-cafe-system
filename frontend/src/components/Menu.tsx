import  { useState, useEffect } from 'react';
import { Product } from '../types';

function Menu() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('http://api.ispiroglucafe.com/api/products');
        if (!response.ok) {
          throw new Error('Ürünler alınamadı');
        }

        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          setProducts(result.data);
        } else {
          console.error('Geçersiz ürün verisi:', result);
          setProducts([]);
        }
      } catch (error) {
        console.error('Ürün yükleme hatası:', error);
        setProducts([]);
        setError('Ürünler yüklenirken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const categories = ['İçecek', 'Yemek', 'Tatlı', 'Atıştırmalık'];
  const filteredProducts = selectedCategory
    ? products.filter(product => product.category === selectedCategory)
    : products;

  // Resim URL'sini oluşturan yardımcı fonksiyon
  const getImageUrl = (imagePath: string | null | undefined): string => {
    if (!imagePath) {
      return 'https://via.placeholder.com/150?text=Resim+Yok';
    }
    // Eğer tam URL ise olduğu gibi kullan
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    // Eğer /uploads ile başlıyorsa, doğrudan backend URL'sine ekle
    if (imagePath.startsWith('/uploads')) {
      return `http://api.ispiroglucafe.com${imagePath}`;
    }
    // Diğer durumlar için /uploads/ ekleyerek dene
    return `http://api.ispiroglucafe.com/uploads/${imagePath}`;
  };

  if (loading) return <div className="text-center p-8">Yükleniyor...</div>;
  if (error) return <div className="text-red-500 text-center p-8">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Menü</h1>
        
        {/* Kategori Filtreleme */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => setSelectedCategory('')}
              className={`px-4 py-2 rounded-full ${
                selectedCategory === ''
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Tümü
            </button>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Ürün Listesi */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <div
              key={product._id}
              className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow"
            >
              <div className="aspect-w-16 aspect-h-9 mb-4">
                <img
                  src={getImageUrl(product.image)}
                  alt={product.name}
                  className="object-cover rounded-lg w-full h-48"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.src = 'https://via.placeholder.com/150?text=Resim+Yok';
                  }}
                />
              </div>
              <h3 className="text-lg font-semibold mb-2">{product.name}</h3>
              <p className="text-gray-600 mb-2">{product.description}</p>
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold">₺{product.price.toFixed(2)}</span>
               
              </div>
            </div>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            Bu kategoride ürün bulunmamaktadır.
          </div>
        )}
      </div>
    </div>
  );
}

export default Menu; 