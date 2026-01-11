# Appliquer les Corrections sur Supabase Remote

## Projet : rwqzweqrfiucqokghgjg
## Migration : 20260109000000_fix_polymorphic_fk_validation.sql

---

## Option 1 : Via Supabase CLI (Recommandé)

### Étape 1 : Login Supabase
```bash
cd C:\Users\kouas\Documents\deepl-test\02-mlops-data-lab\apex-ml-platform
npx supabase login
```

Cela ouvrira votre navigateur pour vous connecter avec votre compte Supabase.

### Étape 2 : Link au projet remote
```bash
npx supabase link --project-ref rwqzweqrfiucqokghgjg
```

### Étape 3 : Push les migrations
```bash
npx supabase db push
```

Cette commande appliquera automatiquement toutes les migrations locales qui ne sont pas encore sur le remote, y compris `20260109000000_fix_polymorphic_fk_validation.sql`.

---

## Option 2 : Via SQL Editor de Supabase (Plus rapide)

### Étape 1 : Aller sur Supabase Dashboard
1. Ouvrir https://supabase.com/dashboard/project/rwqzweqrfiucqokghgjg
2. Cliquer sur "SQL Editor" dans le menu de gauche

### Étape 2 : Copier-coller le SQL
Copier le contenu complet de `supabase/migrations/20260109000000_fix_polymorphic_fk_validation.sql` dans l'éditeur SQL.

### Étape 3 : Exécuter
Cliquer sur "Run" pour exécuter la migration.

---

## Option 3 : Via Database URL directe

Si vous avez le mot de passe de la base de données :

```bash
npx supabase db push --db-url "postgresql://postgres:[PASSWORD]@db.rwqzweqrfiucqokghgjg.supabase.co:5432/postgres"
```

Le mot de passe se trouve dans :
- Supabase Dashboard > Project Settings > Database > Connection String

---

## Vérification après application

Pour vérifier que la migration a été appliquée, exécuter dans le SQL Editor :

```sql
-- Vérifier que le trigger existe
SELECT tgname, tgrelid::regclass
FROM pg_trigger
WHERE tgname = 'validate_principal_role_binding_principal_trg';

-- Vérifier que les indexes ont été créés
SELECT indexname, tablename
FROM pg_indexes
WHERE indexname IN (
  'idx_comment_thread_entity',
  'idx_notification_entity',
  'idx_approval_request_entity',
  'idx_attachment_entity',
  'idx_work_item_assignee',
  'idx_work_item_reporter',
  'idx_metric_alert_acknowledged'
);

-- Vérifier que la fonction de vérification existe
SELECT routine_name
FROM information_schema.routines
WHERE routine_name = 'check_referential_integrity';
```

Résultat attendu :
- 1 trigger trouvé
- 7 indexes trouvés
- 1 fonction trouvée

---

## Quelle option préférez-vous ?

**Je recommande l'Option 2** (SQL Editor) car c'est le plus rapide et ne nécessite pas de configuration CLI.
