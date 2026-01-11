-- Profiles table (users extension)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name text,
  email text,
  role text DEFAULT 'employee' CHECK (role IN ('employee', 'admin', 'doctor')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Tasks
CREATE TABLE IF NOT EXISTS public.tasks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  assigned_to uuid REFERENCES profiles(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  priority text DEFAULT 'medium' CHECK (priority IN ('low','medium','high')),
  due_date date,
  status text DEFAULT 'pending' CHECK (status IN ('pending','in-progress','completed')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin full tasks" ON tasks FOR ALL TO authenticated USING (
  EXISTS(SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Employee own tasks" ON tasks FOR ALL TO authenticated USING (auth.uid() = assigned_to);

-- Pending doctors
CREATE TABLE IF NOT EXISTS public.pending_doctors (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  speciality text,
  organization text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE pending_doctors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public insert pending" ON pending_doctors FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin manage pending" ON pending_doctors FOR ALL TO authenticated USING (
  EXISTS(SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Trigger for profiles on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
