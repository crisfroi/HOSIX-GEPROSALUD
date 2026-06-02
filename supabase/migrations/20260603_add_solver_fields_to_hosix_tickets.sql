-- Migration: Add solver-driven fields to hosix_tickets
-- Date: 2026-06-03

alter table if exists hosix_tickets
  add column if not exists asignado_a uuid references profesionales_sanitarios(id),
  add column if not exists consultorio text,
  add column if not exists prioridad text default 'normal',
  add column if not exists orden integer,
  add column if not exists es_embarazada boolean default false,
  add column if not exists metadata jsonb;

create index if not exists idx_hosix_tickets_orden on hosix_tickets (orden);
