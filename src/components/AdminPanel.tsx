import React, { useState } from 'react';
import { Product, Order } from '../types';
import { Plus, Edit, Trash, ReceiptText } from 'lucide-react';

interface AdminPanelProps {
  products: Product[];
  addProduct: (product: Omit<Product, 'id'>) => Promise<Product>;
  updateProduct: (product: Product) => Promise<Product>;
  deleteProduct: (id: number) => Promise<void>;
  tableCount: number;
  updateTableCount: (count: number) => void;
  endDay: () => Promise<Order[]>;
  orders: Order[];
  lastEndOfDay: Date;
}

const AdminPanel: React.FC<AdminPanelProps> = ({
  products,
  addProduct,
  updateProduct,
  deleteProduct,
  tableCount,
  updateTableCount,
  endDay,
  lastEndOfDay
}) => {
  const [showForm, setShowForm] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    price: 0,
    category: '',
    description: ''
  });
  const [endOfDayOrders, setEndOfDayOrders] = useState<Order[]>([]);
  const [showEndOfDay, setShowEndOfDay] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'price' ? parseFloat(value) : value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (currentProduct) {
        await updateProduct({
          ...formData,
          id: currentProduct.id
        } as Product);
      } else {
        await addProduct(formData);
      }
      resetForm();
    } catch (error) {
      console.error('Ürün kaydedilirken hata oluştu:', error);
    }
  };

  const handleEdit = (product: Product) => {
    setCurrentProduct(product);
    setFormData({
      name: product.name,
      price: product.price,
      category: product.category,
      description: product.description
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Bu ürünü silmek istediğinizden emin misiniz?')) {
      try {
        await deleteProduct(id);
      } catch (error) {
        console.error('Ürün silinirken hata oluştu:', error);
      }
    }
  };

  const resetForm = () => {
    setCurrentProduct(null);
    setFormData({
      name: '',
      price: 0,
      category: '',
      description: ''
    });
    setShowForm(false);
  };

  const handleEndDay = async () => {
    try {
      const endOfDayData = await endDay();
      setEndOfDayOrders(endOfDayData);
      setShowEndOfDay(true);
    } catch (error) {
      console.error('Gün sonu raporu alınırken hata oluştu:', error);
    }
  };

  return (
    <div className="space-y-8">
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
                onChange={(e) => updateTableCount(parseInt(e.target.value))}
                className="border rounded px-2 py-1 w-20"
              />
            </div>
          </div>
          
          <button
            onClick={handleEndDay}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center gap-2"
          >
            <ReceiptText size={18} />
            Gün Sonu Raporu
          </button>
        </div>
        
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
            
            {endOfDayOrders.length === 0 ? (
              <p>Bu dönemde sipariş yok.</p>
            ) : (
              <div className="space-y-4">
                <p className="font-medium">Toplam Sipariş: {endOfDayOrders.length}</p>
                <p className="font-medium">
                  Toplam Gelir: ₺{endOfDayOrders.reduce((sum, order) => sum + order.total, 0).toFixed(2)}
                </p>
                
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Sipariş Detayları:</h4>
                  <div className="max-h-60 overflow-y-auto">
                    {endOfDayOrders.map((order, index) => (
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
              </div>
            )}
          </div>
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
                  <option value="Coffee">Kahve</option>
                  <option value="Tea">Çay</option>
                  <option value="Dessert">Tatlı</option>
                  <option value="Snack">Atıştırmalık</option>
                  <option value="Meal">Yemek</option>
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
                  <td colSpan={5} className="py-4 text-center text-gray-500">
                    Ürün bulunmamaktadır. Başlamak için ürün ekleyin.
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="border-t">
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
                          onClick={() => handleDelete(product.id)}
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
    </div>
  );
};

export default AdminPanel;