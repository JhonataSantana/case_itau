const express = require('express');
const bodyParser = require('body-parser');
const isValidPassword = require('./passwordValidator');

const app = express();
app.use(bodyParser.json());

app.post('/validate_password', (req, res) => {
    const password = req.body.password || '';
    const isValid = isValidPassword(password);
    res.json({ is_valid: isValid });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`O servidor está rodando na porta ${PORT}`);
});
