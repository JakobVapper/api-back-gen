const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

// In-memory user storage (for demonstration purposes)
const users = [];

const SECRET_KEY = "nKsVvd0od0eG3HTCZ1OQpANEqGvWyT8cYiCplNS10Hk=";

// Register Endpoint
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).send("Username and Password are required");
    }

    // Check if user already exists
    const userExists = users.find(user => user.username === username);
    if (userExists) {
        return res.status(400).send("User already exists");
    }

    // Hash the password before saving it
    const hashedPassword = await bcrypt.hash(password, 10);
    users.push({ username, password: hashedPassword });
    res.status(201).send("User registered successfully");
});

// Login Endpoint
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).send("Username and Password are required");
    }

    // Find the user
    const user = users.find(user => user.username === username);
    if (!user) {
        return res.status(400).send("Invalid credentials");
    }

    // Compare the password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(400).send("Invalid credentials");
    }

    // Generate JWT
    const token = jwt.sign({ username: user.username }, SECRET_KEY, { expiresIn: '1h' });
    res.status(200).json({ token });
});

// Middleware to protect routes
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.sendStatus(401);
    }

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) {
            return res.sendStatus(403);
        }
        req.user = user;
        next();
    });
};

// Protected Route
app.get('/protected', authenticateToken, (req, res) => {
    res.status(200).send(`Hello, ${req.user.username}`);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

const axios = require('axios');

app.get('/weather', authenticateToken, async (req, res) => {
    const city = req.query.city;
    if (!city) {
        return res.status(400).send("City is required");
    }

    try {
        const response = await axios.get(`http://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}`);
        res.status(200).json(response.data);
    } catch (error) {
        res.status(500).send("Error fetching weather data");
    }
});

