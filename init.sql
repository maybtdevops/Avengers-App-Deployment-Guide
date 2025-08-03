CREATE DATABASE IF NOT EXISTS avengersdb;
USE avengersdb;

CREATE TABLE IF NOT EXISTS avengers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50),
    power VARCHAR(100)
);

INSERT INTO avengers (name, power) VALUES
('Iron Man', 'Powered Armor'),
('Thor', 'God of Thunder'),
('Hulk', 'Super Strength');
