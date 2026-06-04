create table public.hosix_diagnosticos (
  id uuid not null default gen_random_uuid (),
  paciente_id uuid not null,
  episodio_id uuid null,
  tipo_episodio character varying(50) null,
  worklist_id uuid null,
  consulta_id uuid null,
  codigo_cie10 character varying(20) null,
  descripcion_diagnostico text not null,
  tipo_diagnostico character varying(50) null default 'principal'::character varying,
  certeza character varying(50) null default 'presuntivo'::character varying,
  fecha_diagnostico timestamp with time zone not null default now(),
  medico_id uuid null,
  observaciones text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint hosix_diagnosticos_pkey primary key (id),
  constraint hosix_diagnosticos_medico_id_fkey foreign KEY (medico_id) references hosix_usuarios (id),
  constraint hosix_diagnosticos_paciente_id_fkey foreign KEY (paciente_id) references hosix_pacientes (id),
  constraint hosix_diagnosticos_worklist_id_fkey foreign KEY (worklist_id) references hosix_medicos_worklist (id)
) TABLESPACE pg_default;

create index IF not exists idx_diagnosticos_paciente on public.hosix_diagnosticos using btree (paciente_id, fecha_diagnostico desc) TABLESPACE pg_default;

create index IF not exists idx_diagnosticos_episodio on public.hosix_diagnosticos using btree (episodio_id, tipo_episodio) TABLESPACE pg_default;

create index IF not exists idx_diagnosticos_cie10 on public.hosix_diagnosticos using btree (codigo_cie10) TABLESPACE pg_default;

create index IF not exists idx_diagnosticos_tipo on public.hosix_diagnosticos using btree (tipo_diagnostico) TABLESPACE pg_default;