create extension if not exists btree_gist;

create type public.app_role as enum ('admin', 'patient');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);

grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;

alter table public.user_roles enable row level security;

create policy "Users can read their own roles"
  on public.user_roles for select to authenticated
  using (auth.uid() = user_id);

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

grant execute on function public.has_role(uuid, app_role) to authenticated;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  phone text,
  created_at timestamptz not null default now()
);

grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;

alter table public.profiles enable row level security;

create policy "Users read own profile"
  on public.profiles for select to authenticated
  using (auth.uid() = id or public.has_role(auth.uid(), 'admin'));

create policy "Users insert own profile"
  on public.profiles for insert to authenticated
  with check (auth.uid() = id);

create policy "Users update own profile"
  on public.profiles for update to authenticated
  using (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create table public.doctors (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  specialty text not null,
  bio text not null default '',
  active boolean not null default true,
  sort_order int not null default 0
);

grant select on public.doctors to anon, authenticated;
grant all on public.doctors to service_role;

alter table public.doctors enable row level security;

create policy "Public read active doctors"
  on public.doctors for select to anon, authenticated
  using (active = true or public.has_role(auth.uid(), 'admin'));

create table public.treatments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  duration_minutes int not null default 30,
  price_from numeric(10,2),
  active boolean not null default true,
  sort_order int not null default 0
);

grant select on public.treatments to anon, authenticated;
grant all on public.treatments to service_role;

alter table public.treatments enable row level security;

create policy "Public read active treatments"
  on public.treatments for select to anon, authenticated
  using (active = true or public.has_role(auth.uid(), 'admin'));

create table public.doctor_schedules (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.doctors(id) on delete cascade,
  weekday int not null check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null,
  check (end_time > start_time)
);

grant select on public.doctor_schedules to anon, authenticated;
grant all on public.doctor_schedules to service_role;

alter table public.doctor_schedules enable row level security;

create policy "Public read schedules"
  on public.doctor_schedules for select to anon, authenticated
  using (true);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references auth.users(id) on delete cascade,
  doctor_id uuid not null references public.doctors(id),
  treatment_id uuid not null references public.treatments(id),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'pending' check (status in ('pending','confirmed','cancelled','completed')),
  notes text,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at),
  exclude using gist (
    doctor_id with =,
    tstzrange(starts_at, ends_at) with &&
  ) where (status in ('pending','confirmed'))
);

grant select, insert, update on public.appointments to authenticated;
grant all on public.appointments to service_role;

alter table public.appointments enable row level security;

create policy "Patients read own appointments, admins read all"
  on public.appointments for select to authenticated
  using (auth.uid() = patient_id or public.has_role(auth.uid(), 'admin'));

create policy "Patients create own appointments"
  on public.appointments for insert to authenticated
  with check (auth.uid() = patient_id);

create policy "Patients cancel own appointments, admins update all"
  on public.appointments for update to authenticated
  using (auth.uid() = patient_id or public.has_role(auth.uid(), 'admin'));

create or replace function public.available_slots(_doctor_id uuid, _date date, _duration_minutes int)
returns table (slot_start timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  with sched as (
    select start_time, end_time
    from public.doctor_schedules
    where doctor_id = _doctor_id
      and weekday = extract(isodow from _date)::int % 7
  ),
  slots as (
    select
      ((_date + s.start_time + (g * interval '30 minutes')) at time zone 'Europe/Madrid') as slot_start,
      ((_date + s.end_time) at time zone 'Europe/Madrid') as sched_end
    from sched s
    cross join lateral generate_series(0, greatest(0, floor(extract(epoch from (s.end_time - s.start_time)) / 1800)::int - 1)) g
  )
  select slot_start
  from slots
  where slot_start > now() + interval '2 hours'
    and slot_start + make_interval(mins => _duration_minutes) <= sched_end
    and not exists (
      select 1 from public.appointments a
      where a.doctor_id = _doctor_id
        and a.status in ('pending','confirmed')
        and tstzrange(a.starts_at, a.ends_at) && tstzrange(slot_start, slot_start + make_interval(mins => _duration_minutes))
    )
  order by slot_start;
$$;

grant execute on function public.available_slots(uuid, date, int) to anon, authenticated;

insert into public.treatments (name, description, duration_minutes, price_from, sort_order) values
  ('Primera visita y revisión', 'Exploración completa, diagnóstico y plan de tratamiento personalizado.', 30, 0, 1),
  ('Limpieza dental profesional', 'Higiene completa con ultrasonidos y pulido para una sonrisa sana.', 45, 50, 2),
  ('Ortodoncia', 'Brackets metálicos, estéticos o alineadores invisibles. Estudio inicial incluido.', 60, 1800, 3),
  ('Implantes dentales', 'Sustitución de piezas dentales con implantes de titanio de última generación.', 90, 900, 4),
  ('Estética dental', 'Carillas, coronas y reconstrucciones para mejorar el aspecto de tu sonrisa.', 60, 250, 5),
  ('Blanqueamiento dental', 'Tratamiento profesional para recuperar el blanco natural de tus dientes.', 60, 150, 6),
  ('Endodoncia', 'Tratamiento de conducto para salvar piezas dañadas por caries profundas.', 60, 180, 7),
  ('Urgencia dental', 'Atención inmediata para dolor agudo, traumatismos o roturas.', 30, 60, 8);

insert into public.doctors (full_name, specialty, bio, sort_order) values
  ('Dra. Carmen Ruiz', 'Odontología general y estética', 'Más de 15 años de experiencia en odontología conservadora y estética dental.', 1),
  ('Dr. Andrés Molina', 'Implantología y cirugía oral', 'Especialista en implantes dentales y rehabilitación oral compleja.', 2),
  ('Dra. Lucía Ferrer', 'Ortodoncia', 'Especialista en ortodoncia invisible y ortopedia dentofacial para todas las edades.', 3);

insert into public.doctor_schedules (doctor_id, weekday, start_time, end_time)
select d.id, w.wd, s.st, s.et
from public.doctors d
cross join generate_series(1, 5) as w(wd)
cross join (values (time '09:00', time '14:00'), (time '16:00', time '19:30')) as s(st, et);

insert into public.doctor_schedules (doctor_id, weekday, start_time, end_time)
select id, 6, time '10:00', time '13:30'
from public.doctors where full_name = 'Dra. Carmen Ruiz';