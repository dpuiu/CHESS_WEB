CREATE DATABASE IF NOT EXISTS CHESS_DB;

CREATE USER IF NOT EXISTS 'chess_admin'@'%' IDENTIFIED WITH caching_sha2_password BY 'your_admin_password';
CREATE USER IF NOT EXISTS 'chess_admin'@'localhost' IDENTIFIED WITH caching_sha2_password BY 'your_admin_password';

GRANT ALL PRIVILEGES ON CHESS_DB.* TO 'chess_admin'@'%' WITH GRANT OPTION;
GRANT ALL PRIVILEGES ON CHESS_DB.* TO 'chess_admin'@'localhost' WITH GRANT OPTION;

CREATE USER IF NOT EXISTS 'chess_public'@'%' IDENTIFIED WITH caching_sha2_password BY 'your_public_password';
CREATE USER IF NOT EXISTS 'chess_public'@'localhost' IDENTIFIED WITH caching_sha2_password BY 'your_public_password';

GRANT SELECT ON CHESS_DB.* TO 'chess_public'@'%';
GRANT SELECT ON CHESS_DB.* TO 'chess_public'@'localhost';

FLUSH PRIVILEGES;

