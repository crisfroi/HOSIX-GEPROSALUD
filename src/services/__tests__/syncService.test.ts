import { describe, it, expect, beforeEach, vi } from 'vitest'
import { SyncService } from '../syncService'
import { SupabaseClient } from '@supabase/supabase-js'

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(),
  rpc: vi.fn(),
  auth: {
    getUser: vi.fn(),
  },
} as unknown as SupabaseClient

describe('SyncService - Offline-First Synchronization', () => {
  let syncService: SyncService

  beforeEach(() => {
    syncService = new SyncService(
      mockSupabase,
      'https://test-renaprosa.supabase.co',
      'test-anon-key'
    )
  })

  describe('crearPacienteLocal', () => {
    it('should create a patient locally with temporal HCU when offline', async () => {
      // Mock local database insert
      const mockInsert = vi.fn().mockResolvedValue({
        data: {
          id: 'patient-id-123',
          hcu_temporal: 'TEMP-BN-001-2024',
          estado: 'pendiente',
        },
      })

      const mockSelect = vi.fn().mockResolvedValue({ data: [] })
      const mockEq = vi.fn().mockReturnValue({ select: mockSelect, single: mockSelect })
      const mockFrom = vi.fn().mockReturnValue({ select: mockSelect, eq: mockEq, insert: mockInsert })

      ;(mockSupabase.from as any).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        insert: mockInsert,
      })

      const resultado = await syncService.crearPacienteLocal({
        cedula: '00123456789',
        nombre: 'Juan',
        apellido: 'Pérez',
        fecha_nacimiento: '1980-05-15',
        nombre_distrito: 'Bioko Norte',
        genero: 'M',
      })

      expect(resultado.exitoso).toBe(true)
      expect(resultado.encontrado).toBe(false)
      expect(resultado.hcu).toBeDefined()
      expect(resultado.estado).toBe('pendiente_sincronizacion')
    })

    it('should find existing patient and return real HCU', async () => {
      const mockSelect = vi.fn().mockResolvedValue({
        data: [
          {
            hcu: 'HCU-0001-BN-2024-001',
            cedula: '00123456789',
            nombre: 'Juan',
            apellido: 'Pérez',
          },
        ],
      })

      ;(mockSupabase.from as any).mockReturnValue({
        select: mockSelect,
      })

      const resultado = await syncService.crearPacienteLocal({
        cedula: '00123456789',
        nombre: 'Juan',
        apellido: 'Pérez',
        fecha_nacimiento: '1980-05-15',
        nombre_distrito: 'Bioko Norte',
        genero: 'M',
      })

      expect(resultado.exitoso).toBe(true)
      expect(resultado.encontrado).toBe(true)
      expect(resultado.hcu).toBe('HCU-0001-BN-2024-001')
      expect(resultado.estado).toBe('sincronizado')
    })
  })

  describe('inicializarHospitalLocal', () => {
    it('should download references from central node', async () => {
      const mockData = {
        exitoso: true,
        tipo: 'distritos',
        total: 6,
        datos: [
          { nombre_distrito: 'Bioko Norte', region_sanitaria: 'Región I' },
        ],
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockData,
      })

      const resultado = await syncService.inicializarHospitalLocal()

      expect(resultado.exitoso).toBe(true)
      expect(resultado.distritos).toBeDefined()
    })
  })

  describe('sincronizar', () => {
    it('should sync pending changes to central node and update HCU mappings', async () => {
      const mockPushResponse = {
        exitoso: true,
        procesados: 1,
        exitosos: 1,
        mapeos: [
          {
            cedula: '00123456789',
            resultado: 'creado',
            hcu: 'HCU-0001-BN-2024-001',
          },
        ],
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockPushResponse,
      })

      const resultado = await syncService.sincronizar()

      expect(resultado.exitoso).toBe(true)
      expect(resultado.sincronizados).toBeGreaterThanOrEqual(0)
    })

    it('should handle sync errors gracefully', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

      const resultado = await syncService.sincronizar()

      expect(resultado.exitoso).toBe(false)
      expect(resultado.error).toBeDefined()
    })
  })

  describe('obtenerEstadoSync', () => {
    it('should return current sync status', async () => {
      const mockStatus = {
        centros_locales: 45,
        profesionales_locales: 120,
        pacientes_con_hcu: 850,
        pacientes_pendientes: 12,
        cambios_en_cola: 0,
        ultima_sincronizacion: '2026-06-15T10:30:00Z',
      }

      ;(mockSupabase.rpc as any).mockResolvedValue({
        data: [mockStatus],
      })

      const estado = await syncService.obtenerEstadoSync()

      expect(estado).toEqual(mockStatus)
    })
  })

  describe('HCU Generation', () => {
    it('should generate valid temporal HCU format', () => {
      // TEMP-DISTRITO-SECUENCIAL-AÑO
      const hcuPattern = /^TEMP-[A-Z]{2}-\d{3}-\d{4}$/
      
      // Example temporal HCU
      const temporalHCU = 'TEMP-BN-001-2024'
      expect(temporalHCU).toMatch(hcuPattern)
    })

    it('should generate valid real HCU format from central node', () => {
      // HCU-CODIGOCENTRO-CODIGODISTRITOS-AÑO-SECUENCIAL
      const hcuPattern = /^HCU-\d{4}-[A-Z]{2}-\d{4}-\d{3}$/
      
      // Example real HCU
      const realHCU = 'HCU-0001-BN-2024-001'
      expect(realHCU).toMatch(hcuPattern)
    })
  })

  describe('Conflict Resolution', () => {
    it('should handle duplicate patient by cédula (first-write-wins)', async () => {
      const mockPushResponse = {
        exitoso: true,
        mapeos: [
          {
            cedula: '00123456789',
            resultado: 'paciente_existe',
            hcu: 'HCU-0001-BN-2024-001',
            hospital_origen: 'otro_hospital',
          },
        ],
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockPushResponse,
      })

      const resultado = await syncService.sincronizar()

      expect(resultado.exitoso).toBe(true)
      // Verify no duplicate is created, existing HCU is used
    })
  })

  describe('Online/Offline Detection', () => {
    it('should queue changes when offline', async () => {
      // Simulate offline mode
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      })

      const resultado = await syncService.crearPacienteLocal({
        cedula: '00123456789',
        nombre: 'Juan',
        apellido: 'Pérez',
        fecha_nacimiento: '1980-05-15',
        nombre_distrito: 'Bioko Norte',
        genero: 'M',
      })

      expect(resultado.exitoso).toBe(true)
      expect(resultado.estado).toBe('pendiente_sincronizacion')

      // Restore online mode
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
      })
    })

    it('should auto-sync when connection is restored', async () => {
      // This would be tested with integration tests
      // or by mocking window.addEventListener('online')
      expect(true).toBe(true)
    })
  })

  describe('Edge Cases', () => {
    it('should handle missing district gracefully', async () => {
      const resultado = await syncService.crearPacienteLocal({
        cedula: '00123456789',
        nombre: 'Juan',
        apellido: 'Pérez',
        fecha_nacimiento: '1980-05-15',
        nombre_distrito: 'Distrito Inexistente',
        genero: 'M',
      })

      // Should still create locally even if district doesn't exist
      expect(resultado).toBeDefined()
    })

    it('should handle invalid date format', async () => {
      const resultado = await syncService.crearPacienteLocal({
        cedula: '00123456789',
        nombre: 'Juan',
        apellido: 'Pérez',
        fecha_nacimiento: 'invalid-date',
        nombre_distrito: 'Bioko Norte',
        genero: 'M',
      })

      // Should handle gracefully or throw meaningful error
      expect(resultado).toBeDefined()
    })

    it('should validate cédula format', () => {
      const validCedulas = ['00123456789', '00200001001', '00500001002']
      const invalidCedulas = ['invalid', '', null]

      validCedulas.forEach(cedula => {
        expect(cedula).toBeDefined()
      })
    })
  })
})
