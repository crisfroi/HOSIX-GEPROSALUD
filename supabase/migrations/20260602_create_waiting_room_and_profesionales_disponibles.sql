-- Migration: Create profesionales_disponibles, hosix_tickets, hosix_pantallas_turno
-- Date: 2026-06-02

-- Create table for available clinicians (profesionales_disponibles)
create table if not exists profesionales_disponibles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  nombre text,
  apellido text,
  especialidades text[],
  servicios jsonb,
  equipos text[],
  esta_en_turno boolean default false,
  turno_inicio timestamptz,
  turno_fin timestamptz,
  ubicacion text,
  activo boolean default true,
  created_at timestamptz default now()
);

create index if not exists idx_profesionales_disponibles_esta_en_turno on profesionales_disponibles (esta_en_turno);

-- Tickets for waiting room / turn display
create table if not exists hosix_tickets (
  id uuid primary key default gen_random_uuid(),
  numero integer,
  tipo text,
  estado text default 'pendiente',
  paciente_id uuid,
  servicio_id uuid,
  created_at timestamptz default now()
);

create index if not exists idx_hosix_tickets_numero on hosix_tickets (numero);

-- Screens / Turn display configuration
create table if not exists hosix_pantallas_turno (
  id uuid primary key default gen_random_uuid(),
  nombre text,
  playlist_url text,
  mostrar_numeros_consulta boolean default true,
  configuracion_consultas jsonb,
  tts_enabled boolean default true,
  tts_language text default 'es-ES',
  tts_voice text default 'es-ES-Standard-A',
  ultimo_llamado jsonb,
  creado_en timestamptz default now(),
  actualizado_en timestamptz default now()
);

create or replace function update_hosix_pantallas_updated_at()
returns trigger as $$
begin
  new.actualizado_en = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_update_pantallas_updated_at on hosix_pantallas_turno;

create trigger trg_update_pantallas_updated_at
before update on hosix_pantallas_turno
for each row
execute function update_hosix_pantallas_updated_at();
