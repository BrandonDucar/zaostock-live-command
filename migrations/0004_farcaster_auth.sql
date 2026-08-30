ALTER TABLE team_members ADD COLUMN auth_provider TEXT;
ALTER TABLE team_members ADD COLUMN provider_subject TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_team_members_provider_subject
  ON team_members(auth_provider, provider_subject);
