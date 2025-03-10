import  { useState, useEffect, useMemo } from 'react';
import { Product } from '../types';
import { Coffee, CakeSlice, Utensils, Soup } from 'lucide-react';

interface CafeMenuProps {
  apiUrl: string;
}

function CafeMenu({ apiUrl }: CafeMenuProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(`${apiUrl}/products`);
        const data = await response.json();
        setProducts(data);
      } catch (error) {
        console.error('Ürünler alınırken hata oluştu:', error);
      }
    };

    fetchProducts();
  }, [apiUrl]);

  const categories = useMemo(() => {
    return Array.from(new Set(products.map(product => product.category)));
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (!selectedCategory) return products;
    return products.filter(product => product.category === selectedCategory);
  }, [products, selectedCategory]);

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'coffee':
        return <Coffee size={20} />;
      case 'dessert':
        return <CakeSlice size={20} />;
      case 'meal':
        return <Utensils size={20} />;
      default:
        return <Soup size={20} />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6">Ürünlerimiz</h2>
        
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-full ${
              selectedCategory === null
                ? 'bg-amber-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            Hepsi
          </button>
          
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full flex items-center gap-2 ${
                selectedCategory === category
                  ? 'bg-amber-600 text-white'
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              {getCategoryIcon(category)}
              {category}
            </button>
          ))}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.length === 0 ? (
            <p className="col-span-full text-center text-gray-500 py-8">
              No products available in this category.
            </p>
          ) : (
            filteredProducts.map(product => (
              <div key={product.id} className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg">{product.name}</h3>
                      <p className="text-gray-600 text-sm">{product.category}</p>
                    </div>
                    <span className="font-bold text-amber-700">₺{product.price.toFixed(2)}</span>
                  </div>
                  <p className="mt-2 text-gray-700">{product.description}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default CafeMenu;