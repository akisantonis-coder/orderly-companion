# Replit Setup Guide

## Environment Variables

Το Replit χρειάζεται να έχει ορισμένα environment variables για να λειτουργήσει σωστά:

### DATABASE_URL (Απαραίτητο)

Το `DATABASE_URL` πρέπει να είναι set στο Replit Secrets/Environment Variables.

**Πώς να το ρυθμίσεις:**
1. Πήγαινε στο Replit Secrets (Tools → Secrets)
2. Πρόσθεσε ένα νέο secret με όνομα `DATABASE_URL`
3. Βάλε το connection string της PostgreSQL βάσης σου

**Format:**
```
postgresql://username:password@host:port/database
```

**Για Replit Database:**
Αν χρησιμοποιείς Replit Database, το DATABASE_URL είναι αυτόματα διαθέσιμο. Αν όχι, πρέπει να το προσθέσεις χειροκίνητα.

## Database Schema

Πρέπει να τρέξεις migrations για να δημιουργήσεις τα tables:

```bash
npm run db:push
```

Αν έχεις προβλήματα, μπορείς να χρησιμοποιήσεις:

```bash
npm run db:push:force
```

## Troubleshooting

### "vite: not found"
- Τρέξε `npm run replit-setup` για να εγκαταστήσεις dependencies

### "DATABASE_URL must be set"
- Βεβαιώσου ότι έχεις προσθέσει το `DATABASE_URL` στα Replit Secrets
- Τρέξε `npm run db:check` για να ελέγξεις αν είναι set

### "Σφάλμα κατά την δημιουργία"
- Έλεγξε τα console logs στο Replit Console για να δεις το συγκεκριμένο error
- Βεβαιώσου ότι το database schema έχει εφαρμοστεί (`npm run db:push`)
- Έλεγξε αν το DATABASE_URL είναι σωστό και η βάση είναι προσβάσιμη

## Console Logs

Η εφαρμογή τώρα έχει εκτεταμένα console.log statements που θα σου βοηθήσουν να εντοπίσεις προβλήματα:

- `[DB]` - Database connection logs
- `[API]` - API endpoint logs  
- `[Storage]` - Database storage layer logs
- `[API Request]` - Frontend API request logs
- `[useCreateSupplier]` - React hook logs
- `[Suppliers]` - Component logs

Όλα τα errors θα εμφανίζονται στο Replit Console με πλήρη stack traces.
