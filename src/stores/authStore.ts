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
  | 'FARMACISTA'
  | 'ALMACEN'
  | 'COMPRAS'
  | 'CAJERO'
  | 'SUPER_ADMIN'
  | string

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
  isInitialized: boolean
  isAuthenticated: boolean
  setUser: (user: AuthUser | null) => void
  setLoading: (loading: boolean) => void
  logout: () => Promise<void>
  initialize: () => Promise<void>
}

export const useAuthStore = create<AuthStore>()(
  devtools(
    persist(
      (set) => ({
        user: null,
        isLoading: false,
        isInitialized: false,
        isAuthenticated: false,

        setUser: (user) => {
          if (!user) {
            localStorage.removeItem('hosix_session')
          }

          set({
            user,
            isAuthenticated: !!user,
            isInitialized: true,
          })
        },

        setLoading: (isLoading) => {
          set({ isLoading })
        },

        logout: async () => {
          try {
            await supabase.auth.signOut()
          } catch (err) {
            console.warn('No se pudo cerrar sesión de Supabase:', err)
          }

          localStorage.removeItem('hosix_session')
          set({
            user: null,
            isAuthenticated: false,
            isInitialized: true,
          })
        },

        initialize: async () => {
          set({ isLoading: true, isInitialized: false })
          try {
            const sessionStr = localStorage.getItem('hosix_session')
            if (sessionStr) {
              const session = JSON.parse(sessionStr)
              const user = session?.user as AuthUser | undefined
              const expiresAt = session?.expiresAt ? new Date(session.expiresAt) : null

              if (user && expiresAt && expiresAt > new Date()) {
                set({ user, isAuthenticated: true, isInitialized: true })
                return
              }
            }
          } catch (err) {
            console.error('Error inicializando auth store:', err)
          } finally {
            set({ isLoading: false, isInitialized: true })
          }
        },
      }),
      {
        name: 'auth-store',
      }
    )
  )
)
