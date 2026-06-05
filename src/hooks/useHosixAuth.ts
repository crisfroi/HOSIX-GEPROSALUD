import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, validateCentroMembership } from '@/integrations/supabase/hosixClient';
import { useToast } from '@/components/ui/use-toast';
import { useAuthStore, AuthUser } from '@/stores/authStore';

export interface HosixUser {
  id: string;
  username: string;
  email: string;
  nombre_completo: string;
  perfil_id: string;
  centro_salud_id: string;
  activo: boolean;
  ultimo_acceso?: string;
}

export const useHosixAuth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isLoading, isAuthenticated, setUser, setLoading, logout: storeLogout } = useAuthStore();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user && !isAuthenticated) {
      const restoreSession = async () => {
        try {
          const sessionStr = localStorage.getItem('hosix_session');
          if (sessionStr) {
            const session = JSON.parse(sessionStr);
            const storedUser = session?.user as AuthUser | undefined;
            const expiresAt = session?.expiresAt ? new Date(session.expiresAt) : null;
            if (storedUser && expiresAt && expiresAt > new Date()) {
              setUser(storedUser);
            }
          }
        } catch (err) {
          console.error('Error restoring session from localStorage:', err);
        }
      };

      restoreSession();
    }
  }, [user, isAuthenticated, setUser]);

  const login = useCallback(
    async (username: string, password: string) => {
      try {
        setLoading(true);
        setError(null);

        if (!username) {
          throw new Error('Usuario requerido');
        }

        if (!password) {
          throw new Error('Contraseña requerida');
        }

        // Llamar a la edge function hosix-auth-login
        const { data, error } = await supabase.functions.invoke('hosix-auth-login', {
          body: {
            username: username.trim(),
            password: password.trim(),
          },
        });

        if (error) {
          throw new Error(error.message || 'Error al conectar con el servidor');
        }

        if (!data?.success || !data?.user) {
          throw new Error(data?.error || 'Usuario o contraseña incorrectos');
        }

        const centroSaludId = data.user.centro_salud_id || '';
        const validation = await validateCentroMembership(centroSaludId);

        if (!validation.valid) {
          throw new Error(validation.error || 'El usuario no está autorizado para acceder al centro de salud.');
        }

        const [nombre, ...apellidoParts] = (data.user.nombre_completo || '').split(' ');
        const apellido = apellidoParts.join(' ');

        const authUser: AuthUser = {
          id: data.user.id,
          email: data.user.email || '',
          nombre: nombre || data.user.username,
          apellido,
          rol: data.user.perfil_id || 'MEDICO',
          centro_salud_id: centroSaludId,
          centro_salud_nombre: validation.centroNombre,
        };

        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 8);

        localStorage.setItem(
          'hosix_session',
          JSON.stringify({ user: authUser, expiresAt: expiresAt.toISOString() })
        );

        setUser(authUser);

        toast({
          title: '¡Bienvenido!',
          description: `Bienvenido ${authUser.nombre}`,
        });

        return authUser;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error al iniciar sesión';
        console.error('Error en login:', errorMessage, err);
        setError(errorMessage);
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setUser, toast]
  );

  const logout = useCallback(async () => {
    try {
      await storeLogout();
      toast({
        title: 'Sesión cerrada',
        description: 'Ha cerrado sesión correctamente',
      });
      navigate('/hosix/login');
    } catch (err) {
      console.error('Error logging out:', err);
    }
  }, [navigate, storeLogout, toast]);

  const requireLogin = useCallback(() => {
    if (!isAuthenticated) {
      navigate('/hosix/login');
      throw new Error('Authentication required');
    }
  }, [isAuthenticated, navigate]);

  return {
    user,
    isLoading,
    error,
    isAuthenticated,
    login,
    logout,
    requireLogin,
  };
};
