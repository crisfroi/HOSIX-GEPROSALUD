import React, { useState, useEffect } from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Hospital, Lock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useHosixAuth } from '@/hooks/useHosixAuth';
import { useProfesionalAuth } from '@/hooks/useProfesionalAuth';

const HosixLogin: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading: adminLoading, error: authError, isAuthenticated } = useHosixAuth();
  const { loginProfesional, isLoading: profLoading, profesionalSession } = useProfesionalAuth();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const isLoading = adminLoading || profLoading;

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/hosix');
    }
    if (profesionalSession) {
      navigate('/hosix');
    }
  }, [isAuthenticated, profesionalSession, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Por favor ingrese usuario y contraseña');
      return;
    }

    // Detectar si es profesional: formato MED-2025-001 o similar
    const isProfesional = /^[A-Z]{2,}-\d{4}-\d{3}$/.test(username.trim());

    try {
      if (isProfesional) {
        // Login de profesional
        const result = await loginProfesional(username.trim(), password);
        if (result.success) {
          // El hook maneja el cambio obligatorio de contraseña
          navigate('/hosix');
        }
      } else {
        // Login de admin
        await login(username, password);
        navigate('/hosix');
      }
    } catch (err) {
      setError(authError || 'Error al iniciar sesión. Verifique sus credenciales.');
      console.error(err);
    }
  };

  const isDev = import.meta.env.DEV;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-white rounded-lg p-3">
              <Hospital className="w-8 h-8 text-blue-900" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white">HOSIX</h1>
          <p className="text-blue-100 mt-2">Sistema de Gestión Hospitalaria</p>
        </div>

        {/* Login Form */}
        <Card className="border-0 shadow-xl">
          <CardHeader>
            <CardTitle>Iniciar Sesión</CardTitle>
            <CardDescription>
              Administrador, Médico o Profesional Sanitario
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Username */}
              <div className="space-y-2">
                <label htmlFor="username" className="text-sm font-medium">
                  Usuario / ID Profesional
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="admin o MED-2025-001"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10"
                    disabled={isLoading}
                    autoComplete="username"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Ingrese su contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    disabled={isLoading}
                    autoComplete="current-password"
                  />
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2" />
                  <span>Recuérdame</span>
                </label>
                <a href="#" className="text-blue-600 hover:underline">
                  ¿Olvidó su contraseña?
                </a>
              </div>

              {/* Login Button */}
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={isLoading}
              >
                {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </Button>
            </form>

            {/* Development Credentials Info */}
            {isDev && (
              <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <h3 className="text-sm font-semibold text-amber-900 mb-2">🔧 Credenciales de Desarrollo</h3>
                <div className="space-y-2 text-xs text-amber-800">
                  <div>
                    <span className="font-medium">Admin:</span> <code className="bg-white px-1 py-0.5 rounded">admin</code>
                  </div>
                  <div>
                    <span className="font-medium">Médico:</span> <code className="bg-white px-1 py-0.5 rounded">MED-2025-001</code>
                  </div>
                  <div>
                    <span className="font-medium">Contraseña:</span> Generada automáticamente o configurada por director
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-6 text-center text-blue-100 text-sm">
          <p>Sistema de Gestión Hospitalaria - GEPROSTEC</p>
          <p className="text-xs mt-2 opacity-75">© 2025 Todos los derechos reservados</p>
        </div>
      </div>
    </div>
  );
};

export default HosixLogin;
