# 🏥 Clinique SaaS — Guide de déploiement

## Prérequis
- Compte Supabase (gratuit) : https://supabase.com
- Compte Vercel (gratuit) : https://vercel.com
- Node.js 20+

---

## Étape 1 — Créer le projet Supabase

1. Aller sur https://supabase.com > New Project
2. Nommer le projet `clinique-familiale`
3. Choisir région : **us-east-1** (la plus proche d'Haïti)
4. Créer le projet et attendre l'initialisation

## Étape 2 — Exécuter le schéma SQL

1. Dashboard Supabase > **SQL Editor**
2. Copier-coller le contenu de `supabase/migrations/0001_init.sql`
3. Cliquer **Run**

## Étape 3 — Configurer les variables d'environnement

1. Dashboard Supabase > **Settings > API**
2. Copier :
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public key` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3. Modifier `.env.local` :
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
```

## Étape 4 — Créer le premier admin

1. Dashboard Supabase > **Authentication > Users > Invite User**
2. Email : `admin@clinique.com`
3. Une fois créé, aller dans **Table Editor > profiles**
4. Modifier le role de cet utilisateur à `admin`

## Étape 5 — Lancer en local

```bash
cd clinique-saas
npm run dev
```

Ouvrir http://localhost:3000

## Étape 6 — Déployer sur Vercel

```bash
npm install -g vercel
vercel
```

Ou via GitHub :
1. Push le projet sur GitHub
2. Aller sur https://vercel.com > New Project > Importer le repo
3. Ajouter les variables d'environnement dans Vercel Dashboard
4. Deploy !

---

## Accès par rôle

| Rôle    | URL d'accès     | Permissions |
|---------|----------------|-------------|
| admin   | `/admin`        | Tout        |
| finance | `/finance`      | Paiements, dépenses, pharmacie |
| doctor  | `/doctor`       | Patients, dossiers médicaux |

---

## Services médicaux — Données initiales (optionnel)

Exécuter dans SQL Editor pour ajouter des services :

```sql
INSERT INTO services (nom, active) VALUES
  ('Consultation générale', TRUE),
  ('Consultation de suivi', TRUE),
  ('Soins dentaires', TRUE),
  ('Vaccination', TRUE),
  ('Bilan de santé', TRUE),
  ('Urgence', TRUE);
```

---

## Structure des fichiers

```
clinique-saas/
├── app/
│   ├── login/          ← Page connexion
│   ├── (app)/
│   │   ├── finance/    ← Interface Finance
│   │   ├── doctor/     ← Interface Médecin
│   │   └── admin/      ← Interface Admin
├── components/
│   ├── shared/         ← AppLayout, Autocomplete, AmountInput...
│   ├── finance/
│   ├── doctor/
│   └── admin/
├── lib/
│   ├── supabase/       ← Clients Supabase
│   ├── types/          ← Types TypeScript
│   └── utils.ts        ← Utilitaires
└── supabase/
    └── migrations/     ← SQL complet
```

---

## Note importante

Le projet Google Apps Script existant **n'a PAS été modifié**.
Ce nouveau système est **100% indépendant**.
