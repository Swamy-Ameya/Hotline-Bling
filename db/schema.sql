-- ===========================================================================
--  OUTBREAK RADAR — DATABASE SCHEMA
--  Manipal University Jaipur
--
--  Run once against Postgres (Supabase, Neon, or local). The app reads through
--  lib/db, which currently returns seeded mock rows in the same shape, so the
--  switch to a live database is a change of one module and no UI changes.
--
--  Resolution note: we model block → floor → room, and one overhead tank per
--  block. We do NOT model individual filter cartridges. No hostel in India
--  tracks water to that level, and a warden could not act on it if we did.
--  "B4, second floor" is an address someone can walk to.
-- ===========================================================================

drop table if exists alerts             cascade;
drop table if exists cluster_cases      cascade;
drop table if exists clusters           cascade;
drop table if exists water_tests        cascade;
drop table if exists meal_attendance    cascade;
drop table if exists mess_meals         cascade;
drop table if exists self_reports       cascade;
drop table if exists consultations      cascade;
drop table if exists students           cascade;
drop table if exists staff              cascade;
drop table if exists messes             cascade;
drop table if exists blocks             cascade;
drop table if exists water_sources      cascade;

drop type if exists risk_level    cascade;
drop type if exists confidence    cascade;
drop type if exists source_kind   cascade;
drop type if exists report_origin cascade;
drop type if exists staff_role    cascade;
drop type if exists alert_state   cascade;

create type risk_level    as enum ('normal','watch','elevated','critical');
create type confidence    as enum ('low','medium','high');
create type source_kind   as enum ('block_water','campus_water','mess_food','person_to_person','unclear');
create type report_origin as enum ('self','doctor');
create type staff_role    as enum ('doctor','warden','admin');
create type alert_state   as enum ('draft','sent','resolved','dismissed');

-- --------------------------------------------------------------------------
-- Physical campus
-- --------------------------------------------------------------------------

create table water_sources (
  id         text primary key,          -- 'ro-plant', 'tank-B4'
  name       text not null,
  kind       text not null,             -- 'plant' | 'tank'
  parent_id  text references water_sources(id),
  lat        double precision,
  lng        double precision
);

create table blocks (
  id                text primary key,   -- 'block-B4'
  name              text not null,      -- 'B4'
  gender            text not null,      -- 'boys' | 'girls'
  floors            int  not null,
  rooms_per_floor   int  not null,
  students_per_room int  not null,
  tank_id           text references water_sources(id),
  lat               double precision,
  lng               double precision
);

create table messes (
  id    text primary key,
  name  text not null,                  -- 'Blue Dove Mess'
  lat   double precision,
  lng   double precision
);

-- --------------------------------------------------------------------------
-- People
-- --------------------------------------------------------------------------

create table students (
  id           uuid primary key default gen_random_uuid(),
  registration text unique not null,     -- university registration number
  name         text not null,
  email        text,
  phone        text,
  -- null block = day scholar. They eat at the mess but drink no hostel water,
  -- which makes them the natural control group for anything water-related.
  block_id     text references blocks(id),
  floor        int,
  room         text,
  mess_id      text references messes(id),
  created_at   timestamptz not null default now()
);
create index on students(block_id, floor);
create index on students(registration);

create table staff (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  role       staff_role not null,
  email      text unique,
  -- wardens are scoped to a block; doctors and admins are campus-wide
  block_id   text references blocks(id),
  created_at timestamptz not null default now()
);

-- --------------------------------------------------------------------------
-- Health records
--
-- consultations = what the campus doctor records during a visit. This is the
-- high-trust channel: someone medically trained examined the patient.
-- --------------------------------------------------------------------------

create table consultations (
  id            uuid primary key default gen_random_uuid(),
  student_id    uuid references students(id) on delete cascade,
  doctor_id     uuid references staff(id),
  symptoms      text[] not null default '{}',
  onset_at      timestamptz not null,       -- when the student says it started
  seen_at       timestamptz not null default now(),
  severity      int not null default 3,     -- 1-5, clinician's judgement
  diagnosis     text,
  prescription  text,
  notes         text,
  -- meals the student recalls eating in the 72h before onset
  recalled_meal_ids uuid[] not null default '{}'
);
create index on consultations(onset_at);
create index on consultations(student_id);

-- self_reports = a student flagging symptoms from their phone. Lower trust,
-- but it arrives a day or two earlier than a clinic visit, which is where the
-- head start actually comes from.
create table self_reports (
  id            uuid primary key default gen_random_uuid(),
  student_id    uuid references students(id) on delete cascade,
  symptoms      text[] not null default '{}',
  onset_at      timestamptz not null,
  reported_at   timestamptz not null default now(),
  severity      int not null default 2,
  recalled_meal_ids uuid[] not null default '{}',
  -- Set when this student had already received an alert. Excluded from
  -- detection so a warning cannot manufacture the evidence for the next one.
  prompted_by_alert_id uuid
);
create index on self_reports(onset_at);
create index on self_reports(prompted_by_alert_id);

-- --------------------------------------------------------------------------
-- Mess
-- --------------------------------------------------------------------------

create table mess_meals (
  id          uuid primary key default gen_random_uuid(),
  mess_id     text references messes(id),
  served_on   date not null,
  meal_type   text not null,              -- breakfast | lunch | snacks | dinner
  menu_items  text[] not null default '{}',
  opens_at    timestamptz not null,
  closes_at   timestamptz not null
);
create index on mess_meals(served_on, mess_id);

-- One row per plate collected. Most hostels already scan an ID card at the
-- counter, which is where this comes from — nobody types it in.
create table meal_attendance (
  id          uuid primary key default gen_random_uuid(),
  meal_id     uuid references mess_meals(id) on delete cascade,
  student_id  uuid references students(id) on delete cascade,
  scanned_at  timestamptz not null default now()
);
create index on meal_attendance(meal_id);
create index on meal_attendance(student_id);

-- --------------------------------------------------------------------------
-- Maintenance — how we find out whether the system was right
-- --------------------------------------------------------------------------

create table water_tests (
  id            uuid primary key default gen_random_uuid(),
  source_id     text references water_sources(id),
  tested_at     timestamptz not null default now(),
  tested_by     uuid references staff(id),
  tds           numeric,        -- mg/L
  ph            numeric,
  chlorine      numeric,        -- mg/L residual
  turbidity     numeric,        -- NTU
  coliform      boolean,
  passed        boolean not null,
  notes         text
);
create index on water_tests(source_id, tested_at);

-- --------------------------------------------------------------------------
-- Detection output
-- --------------------------------------------------------------------------

create table clusters (
  id              uuid primary key default gen_random_uuid(),
  detected_at     timestamptz not null default now(),
  window_start    timestamptz not null,
  window_end      timestamptz not null,
  -- where: a block, or a specific floor, or campus-wide
  block_id        text references blocks(id),
  floor           int,
  level           risk_level not null,
  confidence      confidence not null,
  likely_source   source_kind not null,
  case_count      int not null,
  usual_count     numeric not null,
  summary         text not null,
  recommended_action text,
  -- the mess meal implicated, when the cause looks like food
  suspect_meal_id uuid references mess_meals(id),
  resolved_at     timestamptz,
  resolved_cause  text
);
create index on clusters(detected_at);
create index on clusters(level);

create table cluster_cases (
  cluster_id      uuid references clusters(id) on delete cascade,
  consultation_id uuid references consultations(id) on delete cascade,
  self_report_id  uuid references self_reports(id) on delete cascade,
  primary key (cluster_id, consultation_id, self_report_id)
);

create table alerts (
  id          uuid primary key default gen_random_uuid(),
  cluster_id  uuid references clusters(id) on delete cascade,
  state       alert_state not null default 'draft',
  -- who it goes to: one block, one floor, or everyone
  block_id    text references blocks(id),
  floor       int,
  title       text not null,
  body        text not null,
  created_at  timestamptz not null default now(),
  sent_at     timestamptz,
  sent_by     uuid references staff(id),
  recipients  int not null default 0
);
create index on alerts(cluster_id);
create index on alerts(state);
