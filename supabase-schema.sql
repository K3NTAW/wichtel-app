-- Enable Supabase Auth (this is usually already enabled, but good to note)
-- Users will be stored in auth.users automatically by Supabase

-- Create groups table
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  share_code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_assigned BOOLEAN DEFAULT FALSE
);

-- Create participants table
CREATE TABLE participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
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
CREATE INDEX idx_groups_created_by ON groups(created_by);
CREATE INDEX idx_participants_group_id ON participants(group_id);
CREATE INDEX idx_participants_user_id ON participants(user_id);
CREATE INDEX idx_assignments_group_id ON assignments(group_id);
CREATE INDEX idx_assignments_giver_id ON assignments(giver_id);

-- Enable Row Level Security (RLS)
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

-- Groups: Anyone can read, authenticated users can create, owners can update/delete
CREATE POLICY "Anyone can view groups" ON groups
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create groups" ON groups
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Group creators can update their groups" ON groups
  FOR UPDATE USING (auth.uid() = created_by);

-- Participants: Anyone can read, authenticated users can create/update their own
CREATE POLICY "Anyone can view participants" ON participants
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create participants" ON participants
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own participant entries" ON participants
  FOR UPDATE USING (auth.uid() = user_id);

-- Assignments: Anyone can read (needed to view Wichtels), authenticated users can create
CREATE POLICY "Anyone can view assignments" ON assignments
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create assignments" ON assignments
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
