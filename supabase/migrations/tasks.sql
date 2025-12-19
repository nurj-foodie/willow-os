-- Create a custom type for task status
CREATE TYPE task_status AS ENUM ('todo', 'done', 'parked');

-- Create a custom type for color themes
CREATE TYPE color_theme AS ENUM ('oat', 'matcha', 'clay', 'lavender', 'sage');

-- Create the tasks table
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status task_status DEFAULT 'todo',
  due_date TIMESTAMPTZ,
  color_theme color_theme DEFAULT 'oat',
  position_rank FLOAT NOT NULL,
  emoji TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can create their own tasks"
  ON tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own tasks"
  ON tasks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks"
  ON tasks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks"
  ON tasks FOR DELETE
  USING (auth.uid() = user_id);

-- Enable Realtime for the tasks table
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
