create extension if not exists "pgcrypto";

create table if not exists public.survey_responses (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  nom text,
  prenom text,
  telephone text,
  filiere text,
  interet text,
  equipment jsonb not null default '{}'::jsonb,
  jeux jsonb not null default '{}'::jsonb,
  format text,
  budget text,
  recompense text,
  disponibilite text,
  non_participation jsonb not null default '{}'::jsonb,
  remarque text
);

alter table public.survey_responses enable row level security;

drop policy if exists "Allow anonymous insert on survey responses"
on public.survey_responses;

create policy "Allow anonymous insert on survey responses"
on public.survey_responses
for insert
with check (true);

drop policy if exists "Allow anon read survey responses"
on public.survey_responses;

create policy "Allow anon read survey responses"
on public.survey_responses
for select
using (true);

drop policy if exists "Allow anon delete survey responses"
on public.survey_responses;

create policy "Allow anon delete survey responses"
on public.survey_responses
for delete
using (true);

grant insert, select, delete on public.survey_responses to anon;
