CREATE OR REPLACE FUNCTION pdrb.bump_revision() RETURNS trigger
LANGUAGE plpgsql SET search_path=pg_catalog AS $$
BEGIN
  IF TG_TABLE_NAME='app_metadata' THEN
    IF TG_OP='DELETE' THEN
      IF OLD.key='revision' THEN RETURN NULL; END IF;
    ELSE
      IF NEW.key='revision' THEN RETURN NULL; END IF;
    END IF;
  END IF;
  INSERT INTO pdrb.app_metadata(key,path,data)
    VALUES ('revision',NULL,pg_catalog.to_jsonb(pg_catalog.txid_current()::text))
    ON CONFLICT (key) DO UPDATE SET data=EXCLUDED.data;
  RETURN NULL;
END;
$$;
INSERT INTO pdrb.app_metadata(key,path,data)
  VALUES ('revision',NULL,pg_catalog.to_jsonb(pg_catalog.txid_current()::text))
  ON CONFLICT (key) DO UPDATE SET data=EXCLUDED.data;
INSERT INTO pdrb.schema_migrations(version) VALUES (2) ON CONFLICT (version) DO NOTHING;
