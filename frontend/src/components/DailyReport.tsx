import React, { useState, useEffect } from 'react';

interface DailyOrder {
  id: string;
  tableNumber: number;
  items: Array<{
    product: {
      name: string;
      price: number;
      image?: string;
    };
    quantity: number;
  }>;
  total: number;
  timestamp: string;
}

const DailyReport: React.FC = () => {
  const [orders, setOrders] = useState<DailyOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    fetchDailyOrders();
  }, []);

  const fetchDailyOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Oturum bulunamadı');
      }

      const response = await fetch('https://api.ispiroglucafe.com/api/reports/daily', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Siparişler alınırken bir hata oluştu');
      }

      const data = await response.json();
      setOrders(data.orders);
    } catch (err) {
      console.error('Günlük siparişler yüklenirken hata:', err);
      setError(err instanceof Error ? err.message : 'Siparişler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const calculateDailyTotal = () => {
    return orders.reduce((total, order) => total + order.total, 0);
  };

  const handleSaveDailyReport = async () => {
    setShowConfirmation(true);
  };

  const handleConfirmSave = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Oturum bulunamadı');
      }

      const totalAmount = orders.reduce((total, order) => total + (order.total || 0), 0);

      const response = await fetch('https://api.ispiroglucafe.com/api/reports/save-daily', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          orders,
          totalAmount: totalAmount
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Rapor kaydedilirken bir hata oluştu');
      }

      // PDF'i indir
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      const date = new Date().toLocaleDateString('tr-TR').replace(/\./g, '-');
      a.href = url;
      a.download = `Gunluk_Rapor_${date}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Verileri sıfırla ve sayfayı yenile
      setOrders([]);
      setShowConfirmation(false);

      // Başarılı mesajı göster
      alert('Rapor başarıyla kaydedildi ve veriler silindi.');

      // Sayfayı yenile
      window.location.reload();

    } catch (err) {
      console.error('Rapor kaydedilirken hata:', err);
      alert(err instanceof Error ? err.message : 'Rapor kaydedilirken bir hata oluştu');
    }
  };

  // Raporu iptal et
  const handleCancelSave = () => {
    setShowConfirmation(false);
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-4">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Günlük Rapor</h2>
        <button
          onClick={handleSaveDailyReport}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Raporu Kaydet
        </button>
      </div>

      {/* Onay Dialog */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Raporu İndirmek ve Verileri Silmek İstiyor musunuz?</h3>
            <p className="mb-2">Günlük raporu PDF olarak indirmek ve tüm günlük verileri kalıcı olarak silmek istediğinize emin misiniz?</p>
            <p className="mb-6 text-red-600 font-semibold">Dikkat: Bu işlem geri alınamaz!</p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowConfirmation(false)}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                İptal
              </button>
              <button
                onClick={handleConfirmSave}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                İndir ve Sil
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Masa
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ürünler
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Toplam
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tarih
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders && orders.length > 0 ? (
              orders.map((order) => (
                <tr key={order._id || order.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      Masa {order.tableNumber}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {order.items.map((item, index) => (
                        <div key={`${order._id}-${index}`} className="flex items-center gap-4 p-4 border-b">
                          <img
                            src={getImageUrl(item.product?.image)}
                            alt={item.product?.name}
                            className="w-16 h-16 object-cover rounded"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.onerror = null;
                              target.src = 'httpss://via.placeholder.com/150?text=Resim+Yok';
                            }}
                          />
                          {item.quantity}x {item.product?.name || 'Ürün Adı Yok'} - ₺{(item.product?.price || 0) * item.quantity}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {order.total.toFixed(2)} TL
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(order.timestamp).toLocaleString('tr-TR')}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                  Bugün için sipariş bulunmuyor
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {orders && orders.length > 0 && (
        <div className="mt-4 text-right">
          <p className="text-lg font-semibold">
            Günlük Toplam: {calculateDailyTotal().toFixed(2)} TL
          </p>
        </div>
      )}
    </div>
  );
};

export default DailyReport; 