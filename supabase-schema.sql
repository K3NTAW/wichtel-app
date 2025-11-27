-- Create groups table
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  share_code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_assigned BOOLEAN DEFAULT FALSE
);

-- Create participants table
CREATE TABLE participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  hobbies TEXT,
  favorite_colors TEXT,
  interests TEXT,
  gift_preferences TEXT,
  other_info TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create assignments table (who gets whom as Wichtel)
CREATE TABLE assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  giver_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_id, giver_id)
);

-- Create index for faster lookups
CREATE INDEX idx_groups_share_code ON groups(share_code);
CREATE INDEX idx_participants_group_id ON participants(group_id);
CREATE INDEX idx_assignments_group_id ON assignments(group_id);
CREATE INDEX idx_assignments_giver_id ON assignments(giver_id);

-- Enable Row Level Security (RLS) - allow all reads/writes for now since we don't have auth
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations (since we don't have authentication)
CREATE POLICY "Allow all operations on groups" ON groups
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on participants" ON participants
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on assignments" ON assignments
  FOR ALL USING (true) WITH CHECK (true);

