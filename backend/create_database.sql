-- Run this once against your MySQL server before starting the backend.
-- The application (SQLAlchemy) will automatically create all tables inside
-- this database on startup — you only need to create the empty database itself.

CREATE DATABASE IF NOT EXISTS task_ai_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- Optional: create a dedicated app user instead of using root.
-- CREATE USER 'task_ai_user'@'%' IDENTIFIED BY 'change_this_password';
-- GRANT ALL PRIVILEGES ON task_ai_db.* TO 'task_ai_user'@'%';
-- FLUSH PRIVILEGES;
