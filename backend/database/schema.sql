CREATE SCHEMA IF NOT EXISTS pdrb;
CREATE TABLE IF NOT EXISTS pdrb.schema_migrations (
  version integer PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS pdrb.institutions (
  name text PRIMARY KEY, path jsonb, data jsonb NOT NULL
);
CREATE TABLE IF NOT EXISTS pdrb.users (
  id text PRIMARY KEY, username text NOT NULL UNIQUE,
  role text NOT NULL CHECK (role IN ('admin','institution')),
  institution text REFERENCES pdrb.institutions(name), path jsonb NOT NULL, data jsonb NOT NULL
);
CREATE TABLE IF NOT EXISTS pdrb.datasets (
  id text PRIMARY KEY, origin text NOT NULL CHECK (origin IN ('seed','upload')),
  source_order integer NOT NULL CHECK (source_order >= 0),
  institution text REFERENCES pdrb.institutions(name), title text, filename text,
  path jsonb NOT NULL, data jsonb NOT NULL
);
CREATE TABLE IF NOT EXISTS pdrb.sheets (
  dataset_id text NOT NULL REFERENCES pdrb.datasets(id),
  kind text NOT NULL CHECK (kind IN ('base','extra')),
  sheet_index integer NOT NULL CHECK (sheet_index >= 0), sheet_id text, name text,
  path jsonb NOT NULL, data jsonb NOT NULL,
  PRIMARY KEY (dataset_id,kind,sheet_index)
);
CREATE TABLE IF NOT EXISTS pdrb.cell_overrides (
  dataset_id text NOT NULL REFERENCES pdrb.datasets(id),
  sheet_index integer NOT NULL CHECK (sheet_index >= 0),
  row_index integer NOT NULL CHECK (row_index >= 0), col_index integer NOT NULL CHECK (col_index >= 0),
  path jsonb NOT NULL, data jsonb NOT NULL,
  PRIMARY KEY (dataset_id,sheet_index,row_index,col_index)
);
CREATE TABLE IF NOT EXISTS pdrb.added_rows (
  dataset_id text NOT NULL REFERENCES pdrb.datasets(id), sheet_index integer NOT NULL CHECK (sheet_index >= 0),
  position integer NOT NULL CHECK (position >= 0), path jsonb NOT NULL, data jsonb NOT NULL,
  PRIMARY KEY (dataset_id,sheet_index,position)
);
CREATE TABLE IF NOT EXISTS pdrb.added_columns (
  dataset_id text NOT NULL REFERENCES pdrb.datasets(id), sheet_index integer NOT NULL CHECK (sheet_index >= 0),
  position integer NOT NULL CHECK (position >= 0), path jsonb NOT NULL, data jsonb NOT NULL,
  PRIMARY KEY (dataset_id,sheet_index,position)
);
CREATE TABLE IF NOT EXISTS pdrb.edited_rows (
  dataset_id text NOT NULL REFERENCES pdrb.datasets(id), sheet_index integer NOT NULL CHECK (sheet_index >= 0),
  position integer NOT NULL CHECK (position >= 0), path jsonb NOT NULL, data jsonb NOT NULL,
  PRIMARY KEY (dataset_id,sheet_index,position)
);
CREATE TABLE IF NOT EXISTS pdrb.table_states (
  dataset_id text NOT NULL REFERENCES pdrb.datasets(id), sheet_index integer NOT NULL CHECK (sheet_index >= 0),
  table_id text NOT NULL, path jsonb NOT NULL, data jsonb NOT NULL,
  PRIMARY KEY (dataset_id,sheet_index,table_id)
);
CREATE TABLE IF NOT EXISTS pdrb.dataset_details (
  dataset_id text PRIMARY KEY REFERENCES pdrb.datasets(id),
  institution text REFERENCES pdrb.institutions(name), path jsonb NOT NULL, data jsonb NOT NULL
);
CREATE TABLE IF NOT EXISTS pdrb.deleted_datasets (
  dataset_id text PRIMARY KEY REFERENCES pdrb.datasets(id), path jsonb NOT NULL, data jsonb NOT NULL
);
CREATE TABLE IF NOT EXISTS pdrb.audit_events (
  id text PRIMARY KEY, position integer NOT NULL, action text NOT NULL, actor text,
  dataset_id text, institution text, path jsonb NOT NULL, data jsonb NOT NULL
);
CREATE TABLE IF NOT EXISTS pdrb.notifications (
  id text PRIMARY KEY, position integer NOT NULL,
  recipient_id text NOT NULL REFERENCES pdrb.users(id), event_id text, dataset_id text,
  read_at timestamptz, path jsonb NOT NULL, data jsonb NOT NULL
);
CREATE TABLE IF NOT EXISTS pdrb.app_metadata (
  key text PRIMARY KEY, path jsonb, data jsonb NOT NULL
);
CREATE TABLE IF NOT EXISTS pdrb.imports (
  id text PRIMARY KEY, imported_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  source_hashes jsonb NOT NULL, counts jsonb NOT NULL
);
CREATE INDEX IF NOT EXISTS datasets_institution_idx ON pdrb.datasets(institution);
CREATE INDEX IF NOT EXISTS audit_events_institution_idx ON pdrb.audit_events(institution,position);
CREATE INDEX IF NOT EXISTS notifications_recipient_idx ON pdrb.notifications(recipient_id,position);
CREATE INDEX IF NOT EXISTS notifications_unread_idx ON pdrb.notifications(recipient_id) WHERE read_at IS NULL;
INSERT INTO pdrb.schema_migrations(version) VALUES (1) ON CONFLICT (version) DO NOTHING;
