export type UserRole = 'admin' | 'doctor' | 'finance'
export type DeviseType = 'HTG' | 'USD'
export type RecordStatus = 'pending' | 'completed' | 'cancelled'
export type AlertType = 'SERVICE_SANS_PAIEMENT' | 'PAIEMENT_SANS_SERVICE'

export interface Profile {
  id: string
  role: UserRole
  full_name: string
  specialty?: string
  phone?: string
  active: boolean
  created_at: string
}

export interface Patient {
  id: string
  nom: string
  prenom: string
  date_naissance?: string
  sexe?: 'HOMME' | 'FEMME' | 'AUTRE'
  tel_whatsapp?: string
  tel_secondaire?: string
  email?: string
  adresse?: string
  allergies?: string
  custom_fields: Record<string, unknown>
  created_by?: string
  created_at: string
  updated_at: string
}

export interface MedicalRecord {
  id: string
  patient_id: string
  doctor_id: string
  date_consultation: string
  motif?: string
  diagnostic?: string
  traitement?: string
  notes?: string
  status: RecordStatus
  custom_fields: Record<string, unknown>
  created_at: string
  updated_at: string
  patient?: Patient
  doctor?: Profile
}

export interface Payment {
  id: string
  patient_id?: string
  record_id?: string
  categorie_id?: string
  categorie_nom?: string
  montant: number
  devise: DeviseType
  montant_htg: number
  taux_applique?: number
  notes?: string
  date_paiement: string
  created_by?: string
  created_at: string
  patient?: Patient
}

export interface Expense {
  id: string
  description: string
  categorie_id?: string
  categorie_nom?: string
  montant: number
  devise: DeviseType
  montant_htg: number
  taux_applique?: number
  notes?: string
  date_depense: string
  created_by?: string
  created_at: string
}

export interface PharmacySale {
  id: string
  description: string
  montant: number
  devise: DeviseType
  montant_htg: number
  taux_applique?: number
  notes?: string
  date_vente: string
  created_by?: string
  created_at: string
}

export interface FinanceCategory {
  id: string
  type: 'Recette' | 'Dépense'
  nom: string
  active: boolean
  created_at: string
}

export interface ExchangeRate {
  id: string
  taux_usd_htg: number
  updated_by?: string
  updated_at: string
}

export interface Service {
  id: string
  nom: string
  description?: string
  parent_id?: string
  category_id?: string
  prix_htg?: number
  active: boolean
  created_at: string
  children?: Service[]
}

export interface AuditLog {
  id: string
  user_id?: string
  action: string
  table_name?: string
  record_id?: string
  old_values?: Record<string, unknown>
  new_values?: Record<string, unknown>
  ip_address?: string
  created_at: string
  profile?: Profile
}

export interface ErrorReport {
  id: string
  reporter_id?: string
  description: string
  related_table?: string
  related_id?: string
  status: 'open' | 'reviewing' | 'resolved'
  resolved_by?: string
  resolution_note?: string
  created_at: string
  resolved_at?: string
  reporter?: Profile
}

export interface BusinessAlert {
  patient_id: string
  patient_nom: string
  record_id: string
  date_consultation: string
  alert_type: AlertType
  record_status: RecordStatus
  montant_paye?: number
}

export interface FinanceReport {
  totalRecettes: number
  totalPharmacie: number
  totalDepenses: number
  beneficeNet: number
  taux: number
  recByCat: Record<string, number>
  depByCat: Record<string, number>
  phaByCat: Record<string, number>
  recettes: Payment[]
  depenses: Expense[]
  pharmacie: PharmacySale[]
}
