-- set password of postgres user to csye7374
ALTER USER postgres WITH PASSWORD 'csye7374';

-- create users table in public schema
CREATE TABLE IF NOT EXISTS users (id VARCHAR(200), first_name VARCHAR(200),last_name  VARCHAR(200),password VARCHAR(200), email_address VARCHAR(30) NOT NULL, account_created VARCHAR(200) NOT NULL, account_updated VARCHAR(200));
-- command to connect to public schema of postgres user
--  psql -h localhost -d public -U postgres -W 