// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcrypt');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true,
}));
app.use(bodyParser.json());
app.use(session({
    secret: 'your_session_secret',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // set to true if using https
}));

// MongoDB connection
mongoose.connect('mongodb+srv://r555sid:z3IErgTiwGlzHUPw@cluster0.09upf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0');

// Define schemas
const userSchema = new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    password: { type: String, required: true },
});

const goalSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    title: String,
    description: String,
    targetDate: Date,
});

const healthMetricSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    type: String,
    value: Number,
    date: Date,
});

const mealSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: String,
    calories: Number,
    date: Date,
});

// Define models
const User = mongoose.model('User', userSchema);
const Goal = mongoose.model('Goal', goalSchema);
const HealthMetric = mongoose.model('HealthMetric', healthMetricSchema);
const Meal = mongoose.model('Meal', mealSchema);

// Auth routes
app.post('/api/signup', async (req, res) => {
    try {
        const { username, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ username, password: hashedPassword });
        await user.save();
        req.session.userId = user._id;
        res.json({ message: 'Signup successful', userId: user._id });
    } catch (error) {
        res.status(400).json({ message: 'Signup failed', error: error.message });
    }
});

app.post('/api/signin', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        req.session.userId = user._id;
        res.json({ message: 'Signin successful', userId: user._id });
    } catch (error) {
        res.status(400).json({ message: 'Signin failed', error: error.message });
    }
});

app.post('/api/signout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ message: 'Signout failed' });
        }
        res.json({ message: 'Signout successful' });
    });
});

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
    if (req.session.userId) {
        next();
    } else {
        res.status(401).json({ message: 'Not authenticated' });
    }
};

// Protected routes
app.get('/api/goals', isAuthenticated, async (req, res) => {
    const goals = await Goal.find({ userId: req.session.userId });
    res.json(goals);
});

app.post('/api/goals', isAuthenticated, async (req, res) => {
    const goal = new Goal({ ...req.body, userId: req.session.userId });
    await goal.save();
    res.json(goal);
});

app.get('/api/health-metrics', isAuthenticated, async (req, res) => {
    const metrics = await HealthMetric.find({ userId: req.session.userId });
    res.json(metrics);
});

app.post('/api/health-metrics', isAuthenticated, async (req, res) => {
    const metric = new HealthMetric({ ...req.body, userId: req.session.userId });
    await metric.save();
    res.json(metric);
});

app.get('/api/meals', isAuthenticated, async (req, res) => {
    const meals = await Meal.find({ userId: req.session.userId });
    res.json(meals);
});

app.post('/api/meals', isAuthenticated, async (req, res) => {
    const meal = new Meal({ ...req.body, userId: req.session.userId });
    await meal.save();
    res.json(meal);
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});