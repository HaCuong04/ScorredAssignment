const express = require('express');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = 'your_secret_key'; 

app.use(bodyParser.json());

const user = {
    username: 'user',
    password: 'password'
};

app.post('/signin', (req, res) => {
    const { username, password } = req.body;

    if (username === user.username && password === user.password) {
        const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: '1h' });
        return res.json({ token });
    }
    
    return res.status(401).json({ message: 'Invalid credentials' });
});

const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

app.get('/posts', authenticateToken, (req, res) => {
    const posts = [
        "The early bird catches the worm."
    ];
    res.json(posts);
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

