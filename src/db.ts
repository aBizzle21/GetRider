import { Pool } from 'pg';

// Railway injects DATABASE_URL. SSL is required on Railway Postgres.
const connectionString = process.env.DATABASE_URL;
export const pool = new Pool({
  connectionString,
  ssl: connectionString && !connectionString.includes('localhost')
    ? { rejectUnauthorized: false }
    : false,
});

// One row per (tester_key, test_id). Re-submitting the same test overwrites —
// so a tester changing a verdict just updates their row, never duplicates.
export async function initSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS results (
      id            BIGSERIAL PRIMARY KEY,
      tester_key    TEXT NOT NULL,
      tester_name   TEXT NOT NULL,
      tag           TEXT NOT NULL,
      device        TEXT NOT NULL,
      role          TEXT NOT NULL,
      wave          TEXT,
      group_name    TEXT NOT NULL,
      test_id       TEXT NOT NULL,
      test_text     TEXT NOT NULL,
      verdict       TEXT NOT NULL,
      severity      TEXT,
      recording     BOOLEAN NOT NULL DEFAULT FALSE,
      notes         TEXT,
      logged_at     TIMESTAMPTZ,
      received_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (tester_key, test_id)
    );
    CREATE INDEX IF NOT EXISTS idx_results_verdict ON results (verdict);
    CREATE INDEX IF NOT EXISTS idx_results_tag ON results (tag);
    CREATE INDEX IF NOT EXISTS idx_results_testerkey ON results (tester_key);
  `);
}

export interface IncomingResult {
  tester_key: string;
  tester: string;
  tag: string;
  device: string;
  role: string;
  wave?: string;
  group: string;
  test_id: string;
  test: string;
  verdict: string;
  severity?: string;
  recording?: boolean;
  notes?: string;
  logged_at?: string;
}

export async function upsertResult(r: IncomingResult) {
  await pool.query(
    `INSERT INTO results
       (tester_key, tester_name, tag, device, role, wave, group_name,
        test_id, test_text, verdict, severity, recording, notes, logged_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
     ON CONFLICT (tester_key, test_id) DO UPDATE SET
       tester_name = EXCLUDED.tester_name,
       tag         = EXCLUDED.tag,
       device      = EXCLUDED.device,
       role        = EXCLUDED.role,
       wave        = EXCLUDED.wave,
       verdict     = EXCLUDED.verdict,
       severity    = EXCLUDED.severity,
       recording   = EXCLUDED.recording,
       notes       = EXCLUDED.notes,
       logged_at   = EXCLUDED.logged_at,
       received_at = NOW()`,
    [
      r.tester_key, r.tester, r.tag, r.device, r.role, r.wave || null, r.group,
      r.test_id, r.test, r.verdict, r.severity || null, !!r.recording,
      r.notes || null, r.logged_at ? new Date(r.logged_at) : null,
    ],
  );
}

export async function allResults() {
  const { rows } = await pool.query(
    `SELECT tester_name, tag, device, role, wave, group_name, test_id, test_text,
            verdict, severity, recording, notes, logged_at, received_at
       FROM results
      ORDER BY tag, tester_name, group_name, test_id`,
  );
  return rows;
}

export async function summary() {
  const totals = await pool.query(
    `SELECT verdict, COUNT(*)::int AS n FROM results GROUP BY verdict`,
  );
  const bySeverity = await pool.query(
    `SELECT severity, COUNT(*)::int AS n
       FROM results WHERE verdict='fail' AND severity IS NOT NULL
      GROUP BY severity ORDER BY severity`,
  );
  const byTester = await pool.query(
    `SELECT tester_name, tag, device, role, wave,
            COUNT(*)::int AS logged,
            COUNT(*) FILTER (WHERE verdict='pass')::int  AS pass,
            COUNT(*) FILTER (WHERE verdict='fail')::int  AS fail,
            COUNT(*) FILTER (WHERE verdict='block')::int AS blocked,
            MAX(received_at) AS last_seen
       FROM results
      GROUP BY tester_name, tag, device, role, wave
      ORDER BY fail DESC, logged DESC`,
  );
  const failures = await pool.query(
    `SELECT tester_name, tag, device, test_id, test_text, severity, recording, notes, received_at
       FROM results WHERE verdict IN ('fail','block')
      ORDER BY
        CASE severity WHEN 'S1' THEN 1 WHEN 'S2' THEN 2 WHEN 'S3' THEN 3 WHEN 'S4' THEN 4 ELSE 5 END,
        received_at DESC`,
  );
  const byGroup = await pool.query(
    `SELECT group_name,
            COUNT(*)::int AS logged,
            COUNT(*) FILTER (WHERE verdict='fail')::int AS fail
       FROM results GROUP BY group_name ORDER BY fail DESC, group_name`,
  );
  return {
    totals: totals.rows,
    bySeverity: bySeverity.rows,
    byTester: byTester.rows,
    failures: failures.rows,
    byGroup: byGroup.rows,
  };
}
