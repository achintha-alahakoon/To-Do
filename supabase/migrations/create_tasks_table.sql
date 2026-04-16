/*
  # Create tasks table

  1. New Tables
    - `tasks`
      - `id` (uuid, primary key, auto-generated)
      - `title` (text, required)
      - `description` (text, optional)
      - `status` (text, default 'todo') - values: 'todo', 'in_progress', 'done'
      - `priority` (text, default 'medium') - values: 'low', 'medium', 'high'
      - `created_at` (timestamptz, auto-set)
      - `updated_at` (timestamptz, auto-set)

  2. Security
    - Enable RLS on `tasks` table
    - Add policy for public read/write access (anonymous CRUD for demo purposes)

  3. Notes
    - This is a demo CRUD app, so we allow anon access
    - updated_at is automatically maintained via trigger
*/

CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  status text NOT NULL DEFAULT 'todo',
  priority text NOT NULL DEFAULT 'medium',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon select"
  ON tasks FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anon insert"
  ON tasks FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon update"
  ON tasks FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anon delete"
  ON tasks FOR DELETE
  TO anon
  USING (true);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
