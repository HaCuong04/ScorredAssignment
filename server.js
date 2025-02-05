const express = require('express');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = 'your_secret_key';
const REFRESH_SECRET_KEY = 'your_refresh_secret_key';

app.use(bodyParser.json());

const users = {
    admin: { username: 'admin', password: 'adminpass', role: 'admin' },
    user: { username: 'user', password: 'userpass', role: 'user' }
};

let posts = [];
let refreshTokens = [];

app.post('/signin', (req, res) => {
    const { username, password } = req.body;

    const user = users[username];
    if (user && user.password === password) {
        const accessToken = jwt.sign({ username, role: user.role }, SECRET_KEY, { expiresIn: '15m' });
        const refreshToken = jwt.sign({ username, role: user.role }, REFRESH_SECRET_KEY, { expiresIn: '7d' });
        
        refreshTokens.push(refreshToken);
        
        return res.json({ accessToken, refreshToken });
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

const checkAdminRole = (req, res, next) => {
    if (req.user.role === 'admin') {
        next();
    } else {
        res.sendStatus(403);
    }
};

app.get('/posts', authenticateToken, (req, res) => {
    res.json(posts);
});

app.post('/posts', authenticateToken, checkAdminRole, (req, res) => {
    const { message } = req.body;
    if (message) {
        posts.push(message);
        return res.status(201).json({ message: 'Post added successfully' });
    }
    return res.status(400).json({ message: 'Message is required' });
});

app.post('/token', (req, res) => {
    const { token } = req.body;

    if (!token || !refreshTokens.includes(token)) {
        return res.sendStatus(403);
    }

    jwt.verify(token, REFRESH_SECRET_KEY, (err, user) => {
        if (err) return res.sendStatus(403);
        
        const accessToken = jwt.sign({ username: user.username, role: user.role }, SECRET_KEY, { expiresIn: '15m' });
        return res.json({ accessToken });
    });
});

app.post('/logout', (req, res) => {
    const { token } = req.body;
    refreshTokens = refreshTokens.filter(t => t !== token);
    res.sendStatus(204);
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});