#!/usr/bin/env node

/**
 * Script para crear el bucket 'documents' en Supabase Storage
 * Uso:
 *   node scripts/create-storage-bucket.js
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://wdieynendfjbkbhfovrx.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY no está configurada');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function createBucket() {
  try {
    console.log('📦 Creando bucket "documents"...');
    
    const { data, error } = await supabase.storage.createBucket('documents', {
      public: true,
      fileSizeLimit: 52428800, // 50MB
    });

    if (error) {
      if (error.message.includes('already exists')) {
        console.log('✅ Bucket "documents" ya existe');
        return;
      }
      throw error;
    }

    console.log('✅ Bucket "documents" creado exitosamente');
    console.log('📋 Detalles:', data);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

createBucket();
