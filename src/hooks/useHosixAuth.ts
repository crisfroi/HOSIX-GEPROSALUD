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

        // Login real con Supabase Auth
        // El usuario puede ser email o username
        let email = username.trim();

        // Si es username, obtener el email
        if (!username.includes('@')) {
          const { data: usuario } = await supabase
            .from('hosix_usuarios')
            .select('email')
            .eq('username', username.trim())
            .single();

          if (usuario?.email) {
            email = usuario.email;
          }
        }

        // Intentar login con Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: email,
          password: password.trim(),
        });

        if (authError) {
          throw new Error(authError.message || 'Error al autenticarse');
        }

        if (!authData.user) {
          throw new Error('Error: No se pudo obtener usuario autenticado');
        }

        // Obtener datos del usuario de hosix_usuarios
        const { data: usuario, error: usuarioError } = await supabase
          .from('hosix_usuarios')
          .select('id, username, email, nombre_completo, perfil_id, centro_salud_id, perfil:hosix_perfiles(nombre)')
          .eq('email', email)
          .single();

        if (usuarioError || !usuario) {
          throw new Error('Usuario HOSIX no encontrado. Contacte al administrador.');
        }

        const perfil = Array.isArray(usuario.perfil) ? usuario.perfil[0] : usuario.perfil;

        const authUser: AuthUser = {
          id: usuario.id,
          email: usuario.email,
          nombre: usuario.nombre_completo?.split(' ')[0] || 'Admin',
          apellido: usuario.nombre_completo?.split(' ')[1] || 'Sistema',
          rol: 'SUPER_ADMINISTRADOR',
          centro_salud_id: usuario.centro_salud_id,
          centro_salud_nombre: 'Centro de Salud Principal',
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

        navigate('/hosix');
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
