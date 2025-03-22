import { useState, useEffect, useMemo } from 'react';
import { Product, OrderItem, Table } from '../types';
import { ShoppingCart, Printer, Plus, Minus, Coffee } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Tables: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [cart, setCart] = useState<OrderItem[]>(() => {
    const savedCart = localStorage.getItem('cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });
  const [orderComplete, setOrderComplete] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReceiptOptions, setShowReceiptOptions] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Oturum bulunamadı');
        }

        const [productsRes, tablesRes] = await Promise.all([
          fetch('http://api.ispiroglucafe.com/api/products', {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch('http://api.ispiroglucafe.com/api/tables', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);

        if (!productsRes.ok || !tablesRes.ok) {
          throw new Error('Veri yükleme hatası');
        }

        const [productsData, tablesData] = await Promise.all([
          productsRes.json(),
          tablesRes.json()
        ]);

        setProducts(productsData.data);
        setTables(tablesData.data);
        setLoading(false);
      } catch (error) {
        console.error('Veri yükleme hatası:', error);
        setError(error instanceof Error ? error.message : 'Veri yüklenirken bir hata oluştu');
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  useEffect(() => {
    const uniqueCategories = Array.from(new Set(products.map(p => p.category)));
    setCategories(uniqueCategories);
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (selectedCategory === 'all') return products;
    return products.filter(p => p.category === selectedCategory);
  }, [products, selectedCategory]);

  const handleSelectTable = (table: Table) => {
    setSelectedTable(table);
    setOrderComplete(false);
  };

  const addToCart = (product: Product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.product._id === product._id);
      
      if (existingItem) {
        return prevCart.map(item => 
          item.product._id === product._id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      } else {
        return [...prevCart, { product, quantity: 1 }];
      }
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.product._id === productId);
      
      if (existingItem && existingItem.quantity > 1) {
        return prevCart.map(item => 
          item.product._id === productId 
            ? { ...item, quantity: item.quantity - 1 } 
            : item
        );
      } else {
        return prevCart.filter(item => item.product._id !== productId);
      }
    });
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  };

  const handleCompleteOrder = async () => {
    if (!selectedTable || cart.length === 0) {
      alert('Lütfen masa seçin ve sepete ürün ekleyin');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Oturum bulunamadı');
      }

      // Sipariş verilerini hazırla
      const orderData = {
        tableNumber: selectedTable.number,
        items: cart.map(item => ({
          product: item.product._id,
          quantity: item.quantity
        })),
        total: calculateTotal()
      };

      console.log('Gönderilen sipariş:', orderData); // Debug için

      const response = await fetch('http://api.ispiroglucafe.com/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(orderData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Sipariş oluşturulurken bir hata oluştu');
      }

      const data = await response.json();
      console.log('Sunucu yanıtı:', data); // Debug için

      setOrderComplete(true);
      setReceiptUrl(data.data?.receiptUrl);
      setShowReceiptOptions(true);

      // 5 saniye sonra sipariş tamamlandı mesajını kaldır
      setTimeout(() => {
        setOrderComplete(false);
      }, 5000);

      // Başarılı siparişten sonra sepeti temizle
      setCart([]);
      localStorage.removeItem('cart');

    } catch (error) {
      console.error('Sipariş tamamlama hatası:', error);
      alert(error instanceof Error ? error.message : 'Sipariş tamamlanırken bir hata oluştu');
    }
  };

  const handlePrintReceipt = () => {
    if (receiptUrl) {
      window.open(receiptUrl, '_blank');
      // Fiş yazdırıldıktan sonra sepeti temizle
      setCart([]);
      localStorage.removeItem('cart');
      setShowReceiptOptions(false);
    }
  };

  const handleAddToDailyReport = () => {
    // Gün sonu raporuna ekleme işlemi zaten backend'de otomatik olarak yapılıyor
    setCart([]);
    localStorage.removeItem('cart');
    setShowReceiptOptions(false);
  };

  const handleConfirmOrder = () => {
    setShowConfirmation(true);
  };

  const handleCancelConfirmation = () => {
    setShowConfirmation(false);
  };

  const handleConfirmCompleteOrder = () => {
    setShowConfirmation(false);
    handleCompleteOrder();
  };

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl text-gray-600">Yükleniyor...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Masalar</h1>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
            >
              Çıkış Yap
            </button>
          </div>

          {selectedTable === null ? (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-bold mb-6">Bir Masa Seçin</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {tables.map(table => (
                  <button
                    key={table.number}
                    onClick={() => handleSelectTable(table)}
                    className="bg-amber-100 hover:bg-amber-200 text-amber-800 p-4 rounded-lg flex flex-col items-center justify-center h-24 transition-colors"
                  >
                    <Coffee size={24} />
                    <span className="mt-2 font-medium">Masa {table.number}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">Masa {selectedTable.number}</h2>
                    <button
                      onClick={() => setSelectedTable(null)}
                      className="text-gray-600 hover:text-gray-800"
                    >
                      Masalara Dön
                    </button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-6">
                    <button
                      onClick={() => setSelectedCategory('all')}
                      className={`px-4 py-2 rounded-full ${
                        selectedCategory === 'all'
                          ? 'bg-amber-600 text-white'
                          : 'bg-gray-200 hover:bg-gray-300'
                      }`}
                    >
                      Tüm Kategoriler
                    </button>
                    
                    {categories.map(category => (
                      <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`px-4 py-2 rounded-full ${
                          selectedCategory === category
                            ? 'bg-amber-600 text-white'
                            : 'bg-gray-200 hover:bg-gray-300'
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products.map((product) => (
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
                          <button
                            onClick={() => addToCart(product)}
                            className="bg-amber-600 text-white px-4 py-2 rounded hover:bg-amber-700"
                          >
                            Sepete Ekle
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md h-fit">
                <div className="flex items-center gap-2 mb-4">
                  <ShoppingCart size={20} />
                  <h3 className="text-xl font-bold">Sipariş</h3>
                </div>
                
                {cart.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">Sepetiniz boş</p>
                ) : (
                  <>
                    <div className="space-y-4">
                      {cart.map(item => (
                        <div key={item.product._id} className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{item.product.name}</h4>
                            <p className="text-sm text-gray-600">₺{item.product.price.toFixed(2)}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => removeFromCart(item.product._id)}
                              className="p-1 hover:bg-gray-100 rounded"
                            >
                              <Minus size={16} />
                            </button>
                            <span className="w-8 text-center">{item.quantity}</span>
                            <button
                              onClick={() => addToCart(item.product)}
                              className="p-1 hover:bg-gray-100 rounded"
                            >
                              <Plus size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-6 pt-4 border-t">
                      <div className="flex justify-between items-center mb-4">
                        <span className="font-medium">Toplam</span>
                        <span className="font-bold text-lg">₺{calculateTotal().toFixed(2)}</span>
                      </div>
                      
                      <button
                        onClick={handleConfirmOrder}
                        className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-4 rounded flex items-center justify-center gap-2"
                      >
                        <Printer size={20} />
                        Siparişi Tamamla
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Siparişi Onayla</h3>
            <p className="mb-6">Bu siparişi tamamlamak istediğinizden emin misiniz?</p>
            <div className="flex justify-end gap-4">
              <button
                onClick={handleCancelConfirmation}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                İptal
              </button>
              <button
                onClick={handleConfirmCompleteOrder}
                className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700"
              >
                Onayla
              </button>
            </div>
          </div>
        </div>
      )}

      {showReceiptOptions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Fiş İşlemleri</h3>
            <p className="mb-6">Fişiniz hazır. Aşağıdaki seçeneklerden birini seçin:</p>
            <div className="flex flex-col gap-4">
              <button
                onClick={handlePrintReceipt}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded flex items-center justify-center gap-2"
              >
                <Printer size={20} />
                Fişi Yazdır
              </button>
              <button
                onClick={handleAddToDailyReport}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded flex items-center justify-center gap-2"
              >
                Gün Sonuna Ekle
              </button>
            </div>
          </div>
        </div>
      )}

      {orderComplete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full text-center">
            <div className="text-green-500 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Sipariş Tamamlandı!</h3>
            <p className="text-gray-600">Siparişiniz başarıyla oluşturuldu.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tables;