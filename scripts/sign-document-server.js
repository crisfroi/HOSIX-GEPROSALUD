#!/usr/bin/env node

/**
 * Lightweight signing server that signs documents using a server-side secret
 * and updates the Supabase record. Run locally or deploy to a trusted host.
 *
 * Usage:
 *  SIGNING_SECRET=your_secret SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/sign-document-server.js
 */

import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const PORT = process.env.PORT || 5174;
const SIGNING_SECRET = process.env.SIGNING_SECRET;
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SIGNING_SECRET) {
  console.error('SIGNING_SECRET not set');
  process.exit(1);
}
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.post('/sign', async (req, res) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace('Bearer ', '').trim();
    if (!token) return res.status(401).json({ error: 'Missing token' });

    // Validate user token
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData?.user) {
      return res.status(401).json({ error: 'Invalid user token' });
    }
    const user = userData.user;

    const { document_id } = req.body;
    if (!document_id) return res.status(400).json({ error: 'document_id required' });

    // Fetch document content
    const { data: docData, error: docErr } = await supabase
      .from('configuracion.documentos_generados')
      .select('*')
      .eq('id', document_id)
      .single();

    if (docErr || !docData) return res.status(404).json({ error: 'Document not found' });

    const contenido = (docData as any).contenido_final || '';
    const now = new Date().toISOString();
    const nonce = crypto.randomBytes(8).toString('hex');

    // Compute HMAC-SHA256 over content + signer + timestamp + nonce
    const hmac = crypto.createHmac('sha256', SIGNING_SECRET);
    hmac.update(contenido);
    hmac.update(user.id);
    hmac.update(now);
    hmac.update(nonce);
    const hash = hmac.digest('hex');

    // Update document record
    const { data: updated, error: updateErr } = await supabase
      .from('configuracion.documentos_generados')
      .update({ firmado: true, firmado_por: user.id, firmado_en: now, hash_firma: hash })
      .eq('id', document_id)
      .select()
      .single();

    if (updateErr) return res.status(500).json({ error: updateErr.message });

    return res.json({ ok: true, document: updated });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'internal_error' });
  }
});

app.listen(PORT, () => {
  console.log(`Signing server listening on http://localhost:${PORT}`);
});
