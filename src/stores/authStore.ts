// src/stores/authStore.ts
import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { supabase } from '@/app/supabase'

export type UserRole = 
  | 'SUPER_ADMINISTRADOR'
  | 'DIRECTOR'
  | 'CONTADOR_GENERAL'
  | 'CONTADOR'
  | 'MEDICO'
  | 'ENFERMERO'
  | 'RECEPCIONISTA'
  | 'PACIENTE'

export interface AuthUser {
  id: string
  email: string
  nombre: string
  apellido: string
  rol: UserRole
  centro_salud_id?: string
  centro_salud_nombre?: string
  avatar_url?: string
}

interface AuthStore {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  setUser: (user: AuthUser | null) => void
  setLoading: (loading: boolean) => void
  logout: () => void
  initialize: () => Promise<void>
}

export const useAuthStore = create<AuthStore>()(
  devtools(
    persist(
      (set) => ({
        user: null,
        isLoading: false,
        isAuthenticated: false,

        setUser: (user) => {
          set({
            user,
            isAuthenticated: !!user,
          })
        },

        setLoading: (isLoading) => {
          set({ isLoading })
        },

        logout: async () => {
          await supabase.auth.signOut()
          set({
            user: null,
            isAuthenticated: false,
          })
        },

        initialize: async () => {
          set({ isLoading: true })
          try {
            const { data } = await supabase.auth.getSession()
            if (data.session?.user) {
              // Aquí deberías obtener datos adicionales del usuario
              // desde tu tabla hosix_usuarios
              set({
                user: {
                  id: data.session.user.id,
                  email: data.session.user.email || '',
                  nombre: '',
                  apellido: '',
                  rol: 'PACIENTE',
                },
                isAuthenticated: true,
              })
            }
          } finally {
            set({ isLoading: false })
          }
        },
      }),
      {
        name: 'auth-store',
      }
    )
  )
)
