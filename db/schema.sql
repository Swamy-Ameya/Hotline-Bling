-- ===========================================================================
--  OUTBREAK RADAR - SCHEMA
--  Paste this whole file into the Supabase SQL editor and run it once.
--  Mirrors lib/types.ts. If you change one, change the other.
-- ===========================================================================

drop table if exists interventions   cascade;
drop table if exists advisories      cascade;
drop table if exists clusters        cascade;
drop table if exists symptom_reports cascade;
drop table if exists mess_tickets    cascade;
drop table if exists mess_menu       cascade;
drop table if exists users           cascade;
drop table if exists infra_nodes     cascade;

drop type if exists node_type      cascade;
drop type if exists user_role      cascade;
drop type if exists residency      cascade;
drop type if exists report_source  cascade;
drop type if exists cluster_status cascade;
drop type if exists hypothesis     cascade;

create type node_type      as enum ('source','mess','tank','floor','filter');
create type user_role      as enum ('student','doctor','warden');
create type residency      as enum ('hosteller','day_scholar');
create type report_source  as enum ('self','doctor');
create type cluster_status as enum ('watch','alert','confirmed','dismissed','resolved');
create type hypothesis     as enum ('water','food','mess_water','unresolved');

-- --------------------------------------------------------------------------
-- The resource graph. Self-referencing tree:
--   source -> mess   -> filter (M1, M2)
--   source -> tank   -> floor -> filter (two per floor)
-- exposed_population is THE DENOMINATOR. Five cases across forty rooms is
-- calmer than three across twelve, and without this column you cannot say so.
-- --------------------------------------------------------------------------
create table infra_nodes (
  id                 uuid primary key default gen_random_uuid(),
  name               text      not null,
  type               node_type not null,
  parent_id          uuid      references infra_nodes(id) on delete cascade,
  serves_rooms       text,                       -- '301-320', filter nodes only
  exposed_population int       not null default 0,
  block_label        text,                       -- 'Block B'
  floor_label        text,                       -- 'Floor 3'
  created_at         timestamptz not null default now()
);
create index on infra_nodes(parent_id);
create index on infra_nodes(type);

-- --------------------------------------------------------------------------
-- room_filter_id is null for day scholars: they eat at the mess but drink no
-- hostel tank water, which makes them a free control group for the water
-- hypothesis. If day scholars are sick, water is near-eliminated campus-wide.
-- --------------------------------------------------------------------------
create table users (
  id             uuid primary key default gen_random_uuid(),
  name           text      not null,
  role           user_role not null default 'student',
  residency      residency not null default 'hosteller',
  student_id     text unique,
  room_number    text,
  room_filter_id uuid references infra_nodes(id),
  contact        text,
  created_at     timestamptz not null default now()
);
create index on users(room_filter_id);
create index on users(role);

create table mess_menu (
  id            uuid primary key default gen_random_uuid(),
  date          date not null,
  meal_type     text not null,          -- breakfast | lunch | dinner
  items         text[] not null default '{}',
  serving_start timestamptz not null,
  serving_end   timestamptz not null
);
create index on mess_menu(serving_start);

-- --------------------------------------------------------------------------
-- The exposed-cohort denominator for the 2x2 table. This is the real reason
-- mess ticket data matters - not the timestamps, but knowing who ate a given
-- meal and stayed perfectly fine.
-- --------------------------------------------------------------------------
create table mess_tickets (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid references users(id) on delete cascade,
  meal_id     uuid references mess_menu(id) on delete cascade,
  ticket_time timestamptz
);
create index on mess_tickets(meal_id);
create index on mess_tickets(student_id);

-- advisories is declared before symptom_reports because reports reference it.
create table advisories (
  id             uuid primary key default gen_random_uuid(),
  cluster_id     uuid,
  cohort_node_id uuid references infra_nodes(id),
  message        text,
  sent_at        timestamptz not null default now()
);

-- --------------------------------------------------------------------------
-- prompted_by_advisory_id: this report came from someone who had ALREADY been
-- notified about a cluster. Push an alert at a block and its students start
-- reporting mild symptoms they would otherwise have ignored - the cluster
-- appears to grow, confidence rises, more alerts fire. A rumour amplifier with
-- a p-value on it. Detection reads only rows where this is null. The reports
-- still count for care and still appear in case lists.
-- --------------------------------------------------------------------------
create table symptom_reports (
  id                      uuid primary key default gen_random_uuid(),
  student_id              uuid references users(id) on delete cascade,
  reported_by             report_source not null default 'self',
  symptoms                text[] not null default '{}',
  meals_eaten             uuid[] not null default '{}',
  onset_time              timestamptz not null,
  report_time             timestamptz not null default now(),
  severity                int not null default 3,
  room_filter_id          uuid references infra_nodes(id),
  source_weight           numeric not null default 0.6,  -- doctor 1.0 / self 0.6
  prompted_by_advisory_id uuid references advisories(id),
  doctor_notes            text
);
create index on symptom_reports(onset_time);
create index on symptom_reports(room_filter_id);
create index on symptom_reports(prompted_by_advisory_id);

create table clusters (
  id                      uuid primary key default gen_random_uuid(),
  infra_node_id           uuid references infra_nodes(id),
  meal_id                 uuid references mess_menu(id),
  name                    text not null,
  hypothesis              hypothesis not null default 'unresolved',
  status                  cluster_status not null default 'watch',
  window_start            timestamptz not null,
  window_end              timestamptz not null,
  window_hours            int not null,
  observed                numeric not null,
  expected                numeric not null,
  llr                     numeric not null,
  p_spatial               numeric not null,
  q_value                 numeric not null,
  significant             boolean not null default false,
  relative_risk           numeric,
  exposed_sick            int not null default 0,
  exposed_well            int not null default 0,
  unexposed_sick          int not null default 0,
  unexposed_well          int not null default 0,
  median_incubation_hours numeric,
  curve_width_hours       numeric,
  verdict                 text not null default '',
  alternative             text,
  confirmed_by            uuid references users(id),
  created_at              timestamptz not null default now()
);
create index on clusters(status);

alter table advisories
  add constraint advisories_cluster_fk
  foreign key (cluster_id) references clusters(id) on delete cascade;

-- --------------------------------------------------------------------------
-- Closing the loop. Most designs stop at "we suspect Filter 3A" - a claim the
-- system never learns from. cause_code is the ground-truth label that lets us
-- measure our own precision later and re-tune the thresholds honestly.
-- --------------------------------------------------------------------------
create table interventions (
  id                uuid primary key default gen_random_uuid(),
  cluster_id        uuid references clusters(id) on delete cascade,
  kind              text not null,   -- water_test | kitchen_inspection | filter_replaced
  tds               numeric,         -- mg/L
  residual_chlorine numeric,         -- mg/L
  turbidity         numeric,         -- NTU
  coliform_positive boolean,
  outcome           text,
  cause_code        text,
  performed_by      uuid references users(id),
  performed_at      timestamptz not null default now()
);
create index on interventions(cluster_id);

-- ===========================================================================
--  The rollup every part of the engine uses: walk down the tree from any node
--  and total the weighted, UNPROMPTED cases underneath it.
--
--    with recursive descendants as (
--      select id from infra_nodes where id = :node_id
--      union all
--      select n.id from infra_nodes n join descendants d on n.parent_id = d.id
--    )
--    select coalesce(sum(source_weight), 0) from symptom_reports
--    where room_filter_id in (select id from descendants)
--      and prompted_by_advisory_id is null
--      and onset_time > now() - interval '72 hours';
-- ===========================================================================
