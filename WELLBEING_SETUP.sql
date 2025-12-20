-- Create the wellbeing table
CREATE TABLE IF NOT EXISTS public.wellbeing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    mood SMALLINT CHECK (mood >= 1 AND mood <= 5),
    priorities JSONB DEFAULT '[]'::jsonb,
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- Ensure one entry per user per day
    UNIQUE(user_id, date)
);

-- Enable RLS
ALTER TABLE public.wellbeing ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own wellbeing data" 
ON public.wellbeing FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own wellbeing data" 
ON public.wellbeing FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own wellbeing data" 
ON public.wellbeing FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Function to handle updated_at
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER set_wellbeing_updated_at
    BEFORE UPDATE ON public.wellbeing
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();
