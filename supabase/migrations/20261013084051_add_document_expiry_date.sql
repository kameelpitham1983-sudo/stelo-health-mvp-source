/*
# Add expiry_date column to documents table

## Purpose
Documents in an occupational health platform often have expiry dates (e.g. compliance certificates, vaccination records, fitness certificates). This migration adds an optional expiry_date column to the documents table so the UI can track and flag expiring/expired documents.

## Changes
1. Modified Tables
   - `documents`: Added `expiry_date` column (date, nullable, no default). Null means no expiry applies (e.g. company contracts without a fixed expiry).

## Security
- No changes to RLS policies — the existing policies on `documents` remain unchanged.
- The new column inherits the existing table-level RLS.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'expiry_date'
  ) THEN
    ALTER TABLE documents ADD COLUMN expiry_date date;
  END IF;
END $$;
