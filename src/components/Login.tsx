import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User } from 'lucide-react';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('tables'); // Default: Masalara Erişim
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Kullanıcı adı ve şifre gereklidir');
      return;
    }

    if (role === 'tables') {
      // Statik kullanıcı kontrolü
      if (username === 'abc' && password === '1234') {
        navigate('/tables', { replace: true });
      } else {
        setError('Kullanıcı adı veya şifre hatalı');
      }
      return;
    }

    // Yönetim erişimi: API üzerinden doğrulama
    try {
      const response = await fetch("https://ispiroglucafe.com/auth/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ username: username.trim(), password: password.trim() }),
      });

      if (response.status === 200) {
        const data = await response.json();
        localStorage.setItem('token', data.access_token);
        navigate('/admin', { replace: true });
      } else {
        setError('Kullanıcı adı veya şifre hatalı');
      }
    } catch (error) {
      console.error('Giriş sırasında hata oluştu:', error);
      setError('Bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[80vh]">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-amber-800">Giriş Yap</h2>
          <p className="text-gray-600 mt-1">
            {role === 'admin' 
              ? 'Yönetim Paneline erişmek için bilgilerinizi girin' 
              : 'Masalara erişmek için bilgilerinizi girin'}
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              Kullanıcı Adı
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User size={18} className="text-gray-400" />
              </div>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="pl-10 w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="Kullanıcı adını girin"
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Şifre
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock size={18} className="text-gray-400" />
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="Şifreyi girin"
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
              Erişim Seviyesi
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              <option value="tables">Masalara Erişim</option>
              <option value="admin">Yönetim Erişimi</option>
            </select>
          </div>
          
          <div>
            <button
              type="submit"
              className="w-full bg-amber-700 text-white py-2 px-4 rounded-md hover:bg-amber-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
            >
              Giriş Yap
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;
