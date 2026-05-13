const express = require('express');
const app = express();
app.get('/', (req, res) => res.send('OK'));
app.listen(5005, () => console.log('Minimal server on 5005'));
