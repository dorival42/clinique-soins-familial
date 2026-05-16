-- ============================================================
-- CLINIQUE FAMILIALE — Schéma complet Supabase
-- À exécuter dans : Supabase Dashboard > SQL Editor
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ROLES
CREATE TYPE user_role AS ENUM ('admin', 'doctor', 'finance');
CREATE TYPE devise_type AS ENUM ('HTG', 'USD');
CREATE TYPE record_status AS ENUM ('pending', 'completed', 'cancelled');
CREATE TYPE service_status AS ENUM ('performed', 'pending', 'cancelled');
CREATE TYPE finance_cat_type AS ENUM ('Recette', 'Dépense');
CREATE TYPE slot_status AS ENUM ('Disponible', 'Réservé');
CREATE TYPE report_status_type AS ENUM ('open', 'reviewing', 'resolved');

-- PROFILES
CREATE TABLE profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role       user_role NOT NULL DEFAULT 'finance',
  full_name  TEXT NOT NULL,
  specialty  TEXT,
  phone      TEXT,
  active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Déclencher la création auto du profil
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name)
  VALUES (NEW.id, 'doctor', COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- PATIENTS
CREATE TABLE patients (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom            TEXT NOT NULL,
  prenom         TEXT NOT NULL,
  date_naissance DATE,
  sexe           TEXT CHECK (sexe IN ('HOMME','FEMME','AUTRE')),
  tel_whatsapp   TEXT,
  tel_secondaire TEXT,
  email          TEXT,
  adresse        TEXT,
  allergies      TEXT,
  custom_fields  JSONB NOT NULL DEFAULT '{}',
  created_by     UUID REFERENCES profiles(id),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_patients_nom    ON patients (LOWER(nom));
CREATE INDEX idx_patients_prenom ON patients (LOWER(prenom));

-- MEDICAL CATEGORIES
CREATE TABLE medical_categories (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom        TEXT NOT NULL,
  parent_id  UUID REFERENCES medical_categories(id),
  type       TEXT NOT NULL DEFAULT 'consultation',
  active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- SERVICES
CREATE TABLE services (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom         TEXT NOT NULL,
  description TEXT,
  parent_id   UUID REFERENCES services(id),
  category_id UUID REFERENCES medical_categories(id),
  prix_htg    NUMERIC(12,2),
  active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- MEDICAL RECORDS
CREATE TABLE medical_records (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id       UUID NOT NULL REFERENCES patients(id),
  doctor_id        UUID NOT NULL REFERENCES profiles(id),
  date_consultation DATE NOT NULL DEFAULT CURRENT_DATE,
  motif            TEXT,
  diagnostic       TEXT,
  traitement       TEXT,
  notes            TEXT,
  status           record_status NOT NULL DEFAULT 'pending',
  custom_fields    JSONB NOT NULL DEFAULT '{}',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_records_patient ON medical_records (patient_id);
CREATE INDEX idx_records_doctor  ON medical_records (doctor_id);
CREATE INDEX idx_records_date    ON medical_records (date_consultation);

-- RECORD SERVICES (pivot)
CREATE TABLE record_services (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  record_id  UUID NOT NULL REFERENCES medical_records(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id),
  status     service_status NOT NULL DEFAULT 'pending',
  notes      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- FINANCE CATEGORIES
CREATE TABLE finance_categories (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type       finance_cat_type NOT NULL,
  nom        TEXT NOT NULL,
  active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (type, nom)
);
INSERT INTO finance_categories (type, nom) VALUES
  ('Recette','Consultation'),('Recette','Service'),
  ('Dépense','Fournitures'),('Dépense','Salaires');

-- EXCHANGE RATES
CREATE TABLE exchange_rates (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  taux_usd_htg NUMERIC(8,2) NOT NULL DEFAULT 135,
  updated_by   UUID REFERENCES profiles(id),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
INSERT INTO exchange_rates (taux_usd_htg) VALUES (135);

-- PAYMENTS (Recettes)
CREATE TABLE payments (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id    UUID REFERENCES patients(id),
  record_id     UUID REFERENCES medical_records(id),
  categorie_id  UUID REFERENCES finance_categories(id),
  categorie_nom TEXT,
  montant       NUMERIC(12,2) NOT NULL,
  devise        devise_type NOT NULL DEFAULT 'HTG',
  montant_htg   NUMERIC(12,2) NOT NULL,
  taux_applique NUMERIC(8,2),
  notes         TEXT,
  date_paiement DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by    UUID REFERENCES profiles(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_payments_date    ON payments (date_paiement);
CREATE INDEX idx_payments_patient ON payments (patient_id);

-- EXPENSES (Dépenses)
CREATE TABLE expenses (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  description   TEXT NOT NULL,
  categorie_id  UUID REFERENCES finance_categories(id),
  categorie_nom TEXT,
  montant       NUMERIC(12,2) NOT NULL,
  devise        devise_type NOT NULL DEFAULT 'HTG',
  montant_htg   NUMERIC(12,2) NOT NULL,
  taux_applique NUMERIC(8,2),
  notes         TEXT,
  date_depense  DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by    UUID REFERENCES profiles(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_expenses_date ON expenses (date_depense);

-- PHARMACY SALES
CREATE TABLE pharmacy_sales (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  description   TEXT NOT NULL,
  montant       NUMERIC(12,2) NOT NULL,
  devise        devise_type NOT NULL DEFAULT 'HTG',
  montant_htg   NUMERIC(12,2) NOT NULL,
  taux_applique NUMERIC(8,2),
  notes         TEXT,
  date_vente    DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by    UUID REFERENCES profiles(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_pharmacy_date ON pharmacy_sales (date_vente);

-- AUDIT LOGS
CREATE TABLE audit_logs (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID REFERENCES profiles(id),
  action     TEXT NOT NULL,
  table_name TEXT,
  record_id  UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_audit_user ON audit_logs (user_id);
CREATE INDEX idx_audit_date ON audit_logs (created_at);

-- ERROR REPORTS
CREATE TABLE error_reports (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id     UUID REFERENCES profiles(id),
  description     TEXT NOT NULL,
  related_table   TEXT,
  related_id      UUID,
  status          report_status_type NOT NULL DEFAULT 'open',
  resolved_by     UUID REFERENCES profiles(id),
  resolution_note TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at     TIMESTAMPTZ
);

-- CUSTOM FIELD DEFINITIONS
CREATE TABLE custom_field_definitions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type TEXT NOT NULL,
  field_name  TEXT NOT NULL,
  field_label TEXT NOT NULL,
  field_type  TEXT NOT NULL,
  options     JSONB,
  required    BOOLEAN NOT NULL DEFAULT FALSE,
  created_by  UUID REFERENCES profiles(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (entity_type, field_name)
);

-- VUE ALERTES METIER
CREATE OR REPLACE VIEW business_alerts AS
SELECT
  p.id          AS patient_id,
  p.nom || ' ' || p.prenom AS patient_nom,
  mr.id         AS record_id,
  mr.date_consultation,
  CASE
    WHEN rs.id IS NOT NULL AND pay.id IS NULL THEN 'SERVICE_SANS_PAIEMENT'
    WHEN pay.id IS NOT NULL AND rs.id IS NULL THEN 'PAIEMENT_SANS_SERVICE'
  END AS alert_type,
  mr.status     AS record_status,
  pay.montant_htg AS montant_paye
FROM medical_records mr
JOIN patients p ON p.id = mr.patient_id
LEFT JOIN record_services rs ON rs.record_id = mr.id AND rs.status = 'performed'
LEFT JOIN payments pay ON pay.record_id = mr.id
WHERE
  mr.status != 'cancelled' AND (
    (rs.id IS NOT NULL AND pay.id IS NULL)
    OR (pay.id IS NOT NULL AND rs.id IS NULL)
  );

-- AUDIT LOG TRIGGER (payments, expenses, pharmacy_sales, patients, medical_records)
CREATE OR REPLACE FUNCTION log_audit_event()
RETURNS TRIGGER AS $$
DECLARE
  v_action TEXT;
  v_old    JSONB;
  v_new    JSONB;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_action := 'INSERT'; v_old := NULL; v_new := to_jsonb(NEW);
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'UPDATE'; v_old := to_jsonb(OLD); v_new := to_jsonb(NEW);
  ELSE
    v_action := 'DELETE'; v_old := to_jsonb(OLD); v_new := NULL;
  END IF;

  INSERT INTO audit_logs (user_id, action, table_name, record_id, old_values, new_values)
  VALUES (auth.uid(), v_action, TG_TABLE_NAME, COALESCE(NEW.id, OLD.id), v_old, v_new);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_audit_payments
  AFTER INSERT OR UPDATE OR DELETE ON payments FOR EACH ROW EXECUTE FUNCTION log_audit_event();
CREATE TRIGGER trg_audit_expenses
  AFTER INSERT OR UPDATE OR DELETE ON expenses FOR EACH ROW EXECUTE FUNCTION log_audit_event();
CREATE TRIGGER trg_audit_pharmacy
  AFTER INSERT OR UPDATE OR DELETE ON pharmacy_sales FOR EACH ROW EXECUTE FUNCTION log_audit_event();
CREATE TRIGGER trg_audit_patients
  AFTER INSERT OR UPDATE OR DELETE ON patients FOR EACH ROW EXECUTE FUNCTION log_audit_event();
CREATE TRIGGER trg_audit_records
  AFTER INSERT OR UPDATE OR DELETE ON medical_records FOR EACH ROW EXECUTE FUNCTION log_audit_event();

-- TRIGGER updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_patients_updated_at
  BEFORE UPDATE ON patients FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_records_updated_at
  BEFORE UPDATE ON medical_records FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ROW LEVEL SECURITY
ALTER TABLE profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients          ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records   ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments          ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses          ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacy_sales    ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs        ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_reports     ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchange_rates    ENABLE ROW LEVEL SECURITY;
ALTER TABLE services          ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Profiles : chacun voit son propre profil, admin voit tout
CREATE POLICY "profiles_self"  ON profiles FOR SELECT USING (id = auth.uid() OR get_user_role() = 'admin');
CREATE POLICY "profiles_admin" ON profiles FOR ALL USING (get_user_role() = 'admin');

-- Finance : accès finance + admin
CREATE POLICY "payments_fa"   ON payments       FOR ALL USING (get_user_role() IN ('admin','finance'));
CREATE POLICY "expenses_fa"   ON expenses       FOR ALL USING (get_user_role() IN ('admin','finance'));
CREATE POLICY "pharmacy_fa"   ON pharmacy_sales FOR ALL USING (get_user_role() IN ('admin','finance'));
CREATE POLICY "fin_cats_all"  ON finance_categories FOR ALL USING (TRUE);
CREATE POLICY "rates_all"     ON exchange_rates FOR ALL USING (TRUE);

-- Patients : médecin voit ses patients, finance + admin voient tout
CREATE POLICY "patients_fa"   ON patients FOR ALL USING (get_user_role() IN ('admin','finance'));
CREATE POLICY "patients_doc"  ON patients FOR SELECT USING (
  get_user_role() = 'doctor' AND
  id IN (SELECT patient_id FROM medical_records WHERE doctor_id = auth.uid())
);
CREATE POLICY "patients_doc_insert" ON patients FOR INSERT WITH CHECK (get_user_role() = 'doctor');

-- Records : médecin voit ses dossiers, admin voit tout
CREATE POLICY "records_doc"   ON medical_records FOR ALL USING (get_user_role() = 'admin' OR doctor_id = auth.uid());

-- Services : tout le monde peut lire
CREATE POLICY "services_read" ON services FOR SELECT USING (TRUE);
CREATE POLICY "services_admin" ON services FOR ALL USING (get_user_role() = 'admin');

-- Audit : admin seulement
CREATE POLICY "audit_admin"   ON audit_logs FOR SELECT USING (get_user_role() = 'admin');
CREATE POLICY "audit_insert"  ON audit_logs FOR INSERT WITH CHECK (TRUE);

-- Error reports
CREATE POLICY "error_insert"  ON error_reports FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "error_admin"   ON error_reports FOR ALL USING (get_user_role() = 'admin');
