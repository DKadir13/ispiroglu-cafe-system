import React, { useState, useEffect } from 'react';
import { Product, Order } from '../types';
import { Plus, Edit, Trash, ReceiptText, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Table, Settings } from 'lucide-react';
import DailyReport from './DailyReport';

function AdminPanel() {
  const [products, setProducts] = useState<Product[]>([]);
  const [tableCount, setTableCount] = useState<number>(1);
  const [lastEndOfDay, setLastEndOfDay] = useState<Date>(new Date());
  const [showForm, setShowForm] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    price: 0,
    category: '',
    description: '',
    imageUrl: ''
  });
  const [endOfDayOrders, setEndOfDayOrders] = useState<Order[]>([]);
  const [showEndOfDay, setShowEndOfDay] = useState(false);
  const [fetchedEndOfDayOrders, setFetchedEndOfDayOrders] = useState<Order[]>([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'products' | 'daily-report'>('products');

  /** Giriş kontrol için yaptığımız useeffect kısmımız */
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (!token || !userData) {
          navigate('/login');
          return;
        }

        const user = JSON.parse(userData);
        if (user.role !== 'admin') {
          navigate('/tables');
          return;
        }

        const response = await fetch('http://api.ispiroglucafe.com/api/admin/check-auth', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem('token');
            navigate('/login');
            return;
          }
          throw new Error('Yetkilendirme hatası');
        }

        const data = await response.json();
        if (data.success) {
          fetchData();
        } else {
          localStorage.removeItem('token');
          navigate('/login');
        }
      } catch (error) {
        console.error('Yetkilendirme hatası:', error);
        localStorage.removeItem('token');
        navigate('/login');
      }
    };

    checkAuth();
  }, [navigate]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const headers = {
        'Authorization': `Bearer ${token}`
      };

      const [productsRes, tablesRes, usersRes, ordersRes] = await Promise.all([
        fetch('https://api.ispiroglucafe.com/api/admin/products', { headers }),
        fetch('https://api.ispiroglucafe.com/api/admin/tables', { headers }),
        fetch('https://api.ispiroglucafe.com/api/admin/users', { headers }),
        fetch('https://api.ispiroglucafe.com/api/admin/orders', { headers })
      ]);

      if (!productsRes.ok || !tablesRes.ok || !usersRes.ok || !ordersRes.ok) {
        throw new Error('Veri çekme hatası');
      }

      const [productsData, tablesData, usersData, ordersData] = await Promise.all([
        productsRes.json(),
        tablesRes.json(),
        usersRes.json(),
        ordersRes.json()
      ]);

      setProducts(productsData.data);
      setTableCount(tablesData.data.length);
      setEndOfDayOrders(ordersData.data);
      setLoading(false);
    } catch (error) {
      console.error('Veri çekme hatası:', error);
      setError('Veriler yüklenirken bir hata oluştu');
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'price' ? Number(value) || 0 : value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Form validasyonu
      if (!formData.name.trim()) {
        throw new Error('Ürün adı zorunludur');
      }
      if (!formData.category) {
        throw new Error('Kategori seçimi zorunludur');
      }
      if (!formData.price || formData.price <= 0) {
        throw new Error('Geçerli bir fiyat giriniz');
      }
      if (!formData.description.trim()) {
        throw new Error('Ürün açıklaması zorunludur');
      }

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Oturum bulunamadı');
      }

      const productData = {
        name: formData.name.trim(),
        price: formData.price,
        category: formData.category,
        description: formData.description.trim(),
        image: formData.imageUrl
      };

      const url = currentProduct
        ? `https://api.ispiroglucafe.com/api/admin/products/${currentProduct._id}`
        : 'https://api.ispiroglucafe.com/api/admin/products';
      
      const method = currentProduct ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(productData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Ürün kaydedilirken bir hata oluştu');
      }
      
      if (currentProduct) {
        // Ürün güncelleme
        const updatedProduct = {
          ...currentProduct,
          ...result.data,
          image: result.data.image || formData.imageUrl
        };
        setProducts(prevProducts => 
          prevProducts.map(p => 
            p._id === currentProduct._id ? updatedProduct : p
          )
        );
        alert('Ürün başarıyla güncellendi');
      } else {
        // Yeni ürün ekleme
        setProducts(prevProducts => [...prevProducts, result.data]);
        alert('Ürün başarıyla eklendi');
      }
      
      resetForm();
      setShowForm(false);
      fetchData(); // Ürünleri yeniden yükle
    } catch (error) {
      console.error('Ürün kaydetme hatası:', error);
      alert(error instanceof Error ? error.message : 'Ürün kaydedilirken bir hata oluştu');
    }
  };

  // Resim URL'sini oluşturan yardımcı fonksiyon
  const getImageUrl = (imagePath: string | null | undefined): string => {
    if (!imagePath) {
      return 'httpss://via.placeholder.com/150?text=Resim+Yok';
    }
    // Eğer tam URL ise olduğu gibi kullan
    if (imagePath.startsWith('https')) {
      return imagePath;
    }
    // Eğer /uploads ile başlıyorsa, doğrudan backend URL'sine ekle
    if (imagePath.startsWith('/uploads')) {
      return `https://api.ispiroglucafe.com${imagePath}`;
    }
    // Diğer durumlar için /uploads/ ekleyerek dene
    return `https://api.ispiroglucafe.com/uploads/${imagePath}`;
  };

  const handleEdit = (product: Product) => {
    setCurrentProduct(product);
    setFormData({
      name: product.name,
      price: product.price,
      category: product.category,
      description: product.description,
      imageUrl: product.image || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bu ürünü silmek istediğinizden emin misiniz?')) {
      try {
        const response = await fetch(`https://api.ispiroglucafe.com/api/admin/products/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!response.ok) {
          throw new Error('Ürün silinirken bir hata oluştu');
        }

        setProducts(products.filter(p => p._id !== id));
        alert('Ürün başarıyla silindi');
      } catch (error) {
        console.error('Ürün silme hatası:', error);
        alert('Ürün silinirken bir hata oluştu');
      }
    }
  };

  const resetForm = () => {
    setCurrentProduct(null);
    setFormData({
      name: '',
      price: 0,
      category: '',
      description: '',
      imageUrl: ''
    });
    setShowForm(false);
  };

  const handleEndDay = async () => {
    try {
      const response = await fetch('httpss://api.ispiroglucafe.com/api/admin/end-of-day', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Gün sonu raporu oluşturulurken bir hata oluştu');
      }

      const data = await response.json();
      alert('Gün sonu raporu başarıyla oluşturuldu ve Drive\'a yüklendi');
    } catch (error) {
      console.error('Gün sonu raporu hatası:', error);
      alert('Gün sonu raporu oluşturulurken bir hata oluştu');
    }
  };

  const handleLogout = () => {
    try {
      // Kullanıcı verilerini localStorage'dan sil
      localStorage.removeItem('user');
      // Login sayfasına yönlendir
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Çıkış yapılırken hata oluştu:', error);
    }
  };

  const handleAddTables = async () => {
    try {
      const response = await fetch('https://api.ispiroglucafe.com/api/admin/tables', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ 
          number: tableCount,
          status: 'available'
        })
      });

      if (!response.ok) {
        throw new Error('Masa eklenirken bir hata oluştu');
      }

      const data = await response.json();
      alert(`${tableCount} adet masa başarıyla eklendi`);
      fetchData(); // Masaları yeniden yükle
    } catch (error) {
      console.error('Masa ekleme hatası:', error);
      alert('Masa eklenirken bir hata oluştu');
    }
  };

  const handleTableCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0) {
      setTableCount(value);
    }
  };

  if (loading) return <div className="text-center p-8">Yükleniyor...</div>;
  if (error) return <div className="text-red-500 text-center p-8">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Yönetim Paneli</h1>
            <div className="flex gap-4">
              <button
                onClick={() => setActiveTab('products')}
                className={`px-4 py-2 rounded-lg ${
                  activeTab === 'products'
                    ? 'bg-amber-600 text-white'
                    : 'bg-gray-200 hover:bg-gray-300'
                }`}
              >
                Ürünler
              </button>
              <button
                onClick={() => setActiveTab('daily-report')}
                className={`px-4 py-2 rounded-lg ${
                  activeTab === 'daily-report'
                    ? 'bg-amber-600 text-white'
                    : 'bg-gray-200 hover:bg-gray-300'
                }`}
              >
                Gün Sonu Raporu
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
              >
                Çıkış Yap
              </button>
            </div>
          </div>
          <nav className="bg-gray-800 text-white p-4 grid justify-between items-center">
            <div className="flex space-x-4">
              <Link to="/tables" className="flex items-center gap-1 hover:text-gray-400">
                <Table size={18} /> Tablolar
              </Link>
              <Link to="/admin" className="flex items-center gap-1 hover:text-gray-400">
                <Settings size={18} /> Yönetici Paneli
              </Link>
            </div>
          </nav>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4">Yönetim Paneli</h2>
            
            <div className="flex flex-col lg:flex-row justify-between items-center mb-6">
              <div className="mb-4 lg:mb-0">
                <h3 className="text-lg font-semibold">Masa Konfigürasyonu</h3>
                <div className="flex items-center mt-2">
                  <label htmlFor="tableCount" className="mr-2">Masa Sayısı:</label>
                  <input
                    type="number"
                    id="tableCount"
                    min="1"
                    max="50"
                    value={tableCount}
                    onChange={handleTableCountChange}
                    className="border rounded px-2 py-1 w-20"
                  />
                  <button
                    onClick={handleAddTables}
                    className="bg-blue-600 text-white px-4 py-2 rounded ml-4 hover:bg-blue-700"
                  >
                    Masa Ekle
                  </button>
                </div>
              </div>
              
            
            </div>
            
            {activeTab === 'products' ? (
              <>
                {showEndOfDay && (
                  <div className="mt-6 p-4 border rounded-lg bg-gray-50">
                    <div className="flex justify-between mb-4">
                      <h3 className="text-lg font-semibold">Gün Sonu Raporu</h3>
                      <button 
                        onClick={() => setShowEndOfDay(false)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        Kapat
                      </button>
                    </div>
                    <p className="mb-2">Dönem: {lastEndOfDay.toLocaleString()} - {new Date().toLocaleString()}</p>
                    
                    {fetchedEndOfDayOrders.length === 0 ? (
                      <p>Bu dönemde sipariş yok.</p>
                    ) : (
                      <div className="space-y-4">
                        <p className="font-medium">Toplam Sipariş: {fetchedEndOfDayOrders.length}</p>
                        <p className="font-medium">
                          Toplam Gelir: ₺{fetchedEndOfDayOrders.reduce((sum, order) => sum + order.total, 0).toFixed(2)}
                        </p>
                        
                        <div className="mt-4">
                          <h4 className="font-medium mb-2">Sipariş Detayları:</h4>
                          <div className="max-h-60 overflow-y-auto">
                            {fetchedEndOfDayOrders.map((order, index) => (
                              <div key={index} className="p-3 border-b last:border-b-0">
                                <p className="font-medium">Masa {order.tableNumber} - {new Date(order.timestamp).toLocaleTimeString()}</p>
                                <ul className="ml-4 mt-1">
                                  {order.items.map((item, idx) => (
                                    <li key={idx}>
                                      {item.product.name} x{item.quantity} - ₺{(item.product.price * item.quantity).toFixed(2)}
                                    </li>
                                  ))}
                                </ul>
                                <p className="mt-1 font-medium">Toplam: ₺{order.total.toFixed(2)}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                        <button
                          onClick={() => setShowEndOfDay(false)}
                          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                        >
                          Onayla ve Gönder
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <DailyReport />
            )}
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex flex-col lg:flex-row justify-between items-center mb-6">
              <h3 className="text-xl font-bold mb-4 lg:mb-0">Ürün Yönetimi</h3>
              <button
                onClick={() => setShowForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2"
              >
                <Plus size={18} />
                Ürün Ekle
              </button>
            </div>

            {showForm && (
              <div className="mb-8 p-4 border rounded-lg bg-gray-50">
                <h4 className="text-lg font-semibold mb-4">
                  {currentProduct ? 'Ürünü Düzenle' : 'Yeni Ürün Ekle'}
                </h4>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block mb-1">Ürün Adı</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="price" className="block mb-1">Fiyat (₺)</label>
                    <input
                      type="number"
                      id="price"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      required
                      min="0"
                      step="0.01"
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="category" className="block mb-1">Kategori</label>
                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      required
                      className="w-full border rounded px-3 py-2"
                    >
                      <option value="">Bir kategori seçin</option>
                      <option value="İçecek">İçecek</option>
                      <option value="Yemek">Yemek</option>
                      <option value="Tatlı">Tatlı</option>
                      <option value="Atıştırmalık">Atıştırmalık</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="description" className="block mb-1">Açıklama</label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      className="w-full border rounded px-3 py-2"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label htmlFor="imageUrl" className="block mb-1">Resim URL'si</label>
                    <input
                      type="text"
                      id="imageUrl"
                      name="imageUrl"
                      value={formData.imageUrl}
                      onChange={handleInputChange}
                      placeholder="httpss://example.com/image.jpg"
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                    >
                      {currentProduct ? 'Ürünü Güncelle' : 'Ürün Ekle'}
                    </button>
                    <button
                      type="button"
                      onClick={resetForm}
                      className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                    >
                      İptal
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="py-2 px-4 text-left">Resim</th>
                    <th className="py-2 px-4 text-left">Adı</th>
                    <th className="py-2 px-4 text-left">Fiyat</th>
                    <th className="py-2 px-4 text-left">Kategori</th>
                    <th className="py-2 px-4 text-left">Açıklama</th>
                    <th className="py-2 px-4 text-left">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {products.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-4 text-center text-gray-500">
                        Ürün bulunmamaktadır. Başlamak için ürün ekleyin.
                      </td>
                    </tr>
                  ) : (
                    products.map((product) => (
                      <tr key={product._id} className="border-t">
                        <td className="py-2 px-4">
                          {product.image ? (
                            <img 
                              src={getImageUrl(product.image)}
                              alt={product.name}
                              className="w-16 h-16 object-cover rounded"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.onerror = null;
                                target.src = 'httpss://via.placeholder.com/150?text=Resim+Yok';
                              }}
                            />
                          ) : (
                            <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                              <span className="text-gray-500">Resim Yok</span>
                            </div>
                          )}
                        </td>
                        <td className="py-2 px-4">{product.name}</td>
                        <td className="py-2 px-4">₺{product.price.toFixed(2)}</td>
                        <td className="py-2 px-4">{product.category}</td>
                        <td className="py-2 px-4">{product.description}</td>
                        <td className="py-2 px-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(product)}
                              className="text-blue-600 hover:text-blue-800 p-2"
                              title="Düzenle"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(product._id)}
                              className="text-red-600 hover:text-red-800 p-2"
                              title="Sil"
                            >
                              <Trash size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {showConfirmation && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-bold mb-4">Gün sonu almak istediğinize emin misiniz?</h3>
                <div className="flex justify-end gap-4">
                  <button
                    onClick={() => setShowConfirmation(false)}
                    className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                  >
                    İptal
                  </button>
                  <button
                    onClick={handleEndDay}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                  >
                    Evet
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminPanel;