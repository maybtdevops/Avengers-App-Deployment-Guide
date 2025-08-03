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
```

2.2 Node.js App Setup
Project structure:

avengers-app/
│── public/
│   └── index.html
│── server.js
│── package.json


Install dependencies:

```bash
npm init -y
npm install express mysql2

```

server.js:

```bash
javascript
Copy
Edit
const express = require('express');
const mysql = require('mysql2');
const path = require('path');
const app = express();
const port = 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

const db = mysql.createConnection({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'avengers',
  password: process.env.DB_PASSWORD || 'rootpassword',
  database: process.env.DB_NAME || 'avengersdb'
});

db.connect(err => {
  if (err) {
    console.error('DB connection failed:', err);
    process.exit(1);
  }
  console.log('Connected to MySQL');
});

app.get('/avengers', (req, res) => {
  db.query('SELECT * FROM avengers', (err, results) => {
    if (err) return res.status(500).send(err);
    res.json(results);
  });
});

app.listen(port, () => console.log(`Server running at http://localhost:${port}`));
```


public/index.html:

```bash
<!DOCTYPE html>
<html>
<head>
  <title>Avengers</title>
  <style>
    body { font-family: Arial; text-align: center; background-color: #1a1a1a; color: white; }
    img { width: 400px; margin: 20px; border-radius: 10px; }
    ul { list-style: none; padding: 0; }
    li { font-size: 20px; margin: 10px 0; }
  </style>
</head>
<body>
  <h1>Avengers Assemble!</h1>
  <img src="https://media.giphy.com/media/xT0xeJpnrWC4XWblEk/giphy.gif" alt="Avengers GIF">
  <h2>Team Members</h2>
  <ul id="avengers-list"></ul>
  <script>
    fetch('/avengers')
      .then(res => res.json())
      .then(data => {
        const list = document.getElementById('avengers-list');
        data.forEach(a => {
          const li = document.createElement('li');
          li.textContent = `${a.name} - ${a.power}`;
          list.appendChild(li);
        });
      });
  </script>
</body>
</html>


```


Run locally:
node server.js
Open http://localhost:3000



3. Docker Setup
3.1 Backend Dockerfile
dockerfile
```bash
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]

```
3.2 Custom MySQL Image
init.sql:
```bash

CREATE DATABASE IF NOT EXISTS avengersdb;
CREATE USER IF NOT EXISTS 'avengers'@'%' IDENTIFIED BY 'rootpassword';
GRANT ALL PRIVILEGES ON avengersdb.* TO 'avengers'@'%';
FLUSH PRIVILEGES;
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
```
Dockerfile:

```bash
FROM mysql:8
ENV MYSQL_ROOT_PASSWORD=rootpassword
COPY init.sql /docker-entrypoint-initdb.d/
Run locally:
```


```bash
docker build -t custom-mysql:1.0 mysql-custom/
docker build -t avengers-backend:1.0 avengers-app/
docker network create avengers-net
docker run -d --name mysql --network avengers-net custom-mysql:1.0
docker run -d --name backend --network avengers-net -p 3000:3000 \
  -e DB_HOST=mysql -e DB_USER=avengers -e DB_PASSWORD=rootpassword -e DB_NAME=avengersdb \
  avengers-backend:1.0
```
4. Kubernetes Deployment (k3s + Traefik)
4.1 MySQL Deployment yaml


```bash
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mysql
spec:
  replicas: 1
  selector:
    matchLabels:
      app: mysql
  template:
    metadata:
      labels:
        app: mysql
    spec:
      containers:
      - name: mysql
        image: your-dockerhub/custom-mysql:1.0
        ports:
        - containerPort: 3306
        env:
        - name: MYSQL_ROOT_PASSWORD
          value: rootpassword
        volumeMounts:
        - name: mysql-storage
          mountPath: /var/lib/mysql
      volumes:
      - name: mysql-storage
        persistentVolumeClaim:
          claimName: mysql-pvc
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: mysql-pvc
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 1Gi
---
apiVersion: v1
kind: Service
metadata:
  name: mysql
spec:
  selector:
    app: mysql
  ports:
  - port: 3306
    targetPort: 3306

```


4.2 Backend Deployment yaml

```bash
apiVersion: apps/v1
kind: Deployment
metadata:
  name: avengers-backend
spec:
  replicas: 2
  selector:
    matchLabels:
      app: avengers-backend
  template:
    metadata:
      labels:
        app: avengers-backend
    spec:
      containers:
      - name: backend
        image: your-dockerhub/avengers-backend:1.0
        ports:
        - containerPort: 3000
        env:
        - name: DB_HOST
          value: mysql
        - name: DB_USER
          value: avengers
        - name: DB_PASSWORD
          value: rootpassword
        - name: DB_NAME
          value: avengersdb
---
apiVersion: v1
kind: Service
metadata:
  name: avengers-backend
spec:
  selector:
    app: avengers-backend
  ports:
  - port: 3000
    targetPort: 3000
  type: ClusterIP

```

4.3 Traefik Ingress yaml


```bash
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: avengers-ingress
  annotations:
    traefik.ingress.kubernetes.io/router.entrypoints: web
spec:
  rules:
  - host: avengers.local
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: avengers-backend
            port:
              number: 3000


```

Update /etc/hosts:
<k3s-node-ip> avengers.local


5. Troubleshooting Guide
MySQL Issues
Access denied for 'root'@'localhost' → Enable password-based auth or create a user.

Access denied for 'avengers'@'10.x.x.x' → Create user with @'%' and allow remote access.

ECONNREFUSED ::1:3306 → Use 127.0.0.1 instead of localhost.

Kubernetes Issues
Backend can't connect to MySQL → Use Service name (mysql) instead of ClusterIP.

Pods crash-loop → Add retry logic or InitContainers to wait for MySQL.

Ingress not working → Check Traefik logs and verify /etc/hosts.




