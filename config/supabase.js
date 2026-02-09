import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  "https://uilbauanqgvvsbruuzcl.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpbGJhdWFucWd2dnNicnV1emNsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDIwMDA3MiwiZXhwIjoyMDg1Nzc2MDcyfQ.q-kOrNcMj8Ujb1DXv3-i_JWhyFOzYSSiZNg-UCVHcNs" // backend only
);
