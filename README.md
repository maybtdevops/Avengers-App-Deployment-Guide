# Avengers App Deployment Guide
**From Local Development to Kubernetes (k3s with Traefik)**

---

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [Local Development](#2-local-development)
   - [MySQL Setup](#21-setup-mysql)
   - [Node.js App Setup](#22-nodejs-app-setup)
3. [Docker Setup](#3-docker-setup)
   - [Backend Image](#31-backend-dockerfile)
   - [Custom MySQL Image](#32-custom-mysql-image)
4. [Kubernetes Deployment (k3s + Traefik)](#4-kubernetes-deployment-k3s--traefik)
   - [MySQL Deployment](#41-mysql-deployment)
   - [Backend Deployment](#42-backend-deployment)
   - [Ingress Setup](#43-traefik-ingress)
5. [Troubleshooting Guide](#5-troubleshooting-guide)

---

## 1. Project Overview
This project demonstrates how to build and deploy a simple Node.js application with a MySQL backend and static frontend.

- **Frontend**: Displays Avengers list with a GIF.
- **Backend**: REST API (`/avengers`) powered by Node.js and Express.
- **Database**: MySQL storing Avengers data.
- **Deployment**: Local → Docker → Kubernetes (k3s + Traefik)

---

## 2. Local Development

### 2.1 Setup MySQL
```bash
sudo apt install mysql-server or mariadb


Create database and table:

create file : init.sql

CREATE DATABASE avengersdb;
USE avengersdb;
CREATE TABLE avengers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50),
    power VARCHAR(100)
);
INSERT INTO avengers (name, power) VALUES
('Iron Man', 'Powered Armor'),
('Thor', 'God of Thunder'),
('Hulk', 'Super Strength');



Create a user:

CREATE USER 'avengers'@'%' IDENTIFIED BY 'rootpassword';
GRANT ALL PRIVILEGES ON avengersdb.* TO 'avengers'@'%';
FLUSH PRIVILEGES;

