const express = require('express');
const mysql = require('mysql2');
const app = express();
const port = 3000;

app.use(express.json());

const db = mysql.createConnection({
  host: 'mysql',
  user: 'root',
  password: 'rootpassword',
  database: 'avengersdb'
});

db.connect(err => {
  if (err) throw err;
  console.log('Connected to MySQL');
});

app.get('/avengers', (req, res) => {
  db.query('SELECT * FROM avengers', (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});

app.post('/avengers', (req, res) => {
  const { name, power } = req.body;
  db.query('INSERT INTO avengers (name, power) VALUES (?, ?)', [name, power], (err) => {
    if (err) throw err;
    res.send('Avenger added');
  });
});

app.listen(port, () => console.log(`Server running on port ${port}`));
