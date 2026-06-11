BEGIN;

-- 1. Add new compliance columns
ALTER TABLE legacy_exit_cases 
ADD COLUMN IF NOT EXISTS legal_hold BOOLEAN DEFAULT false;

ALTER TABLE legacy_exit_cases 
ADD COLUMN IF NOT EXISTS payroll_status VARCHAR(50) DEFAULT 'pending';

-- 2. Add constraint for payroll_status
ALTER TABLE legacy_exit_cases
ADD CONSTRAINT chk_payroll_status 
CHECK (payroll_status IN ('pending', 'processing', 'settled'));

-- 3. Backfill historic completed cases so they aren't marked as pending
UPDATE legacy_exit_cases
SET payroll_status = 'settled'
WHERE status = 'completed' AND payroll_status = 'pending';

-- 4. Re-expose the PostgREST schema cache
NOTIFY pgrst, 'reload schema';

COMMIT;
