const express = require('express')
const dot_env = require('dotenv')
const mongoose = require('mongoose')
const cors = require('cors')
const connectDB = require('./config/db')
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const leadRoutes = require('./routes/leads');
const tagRoutes = require('./routes/tags');
const activity = require('./routes/activity')

dot_env.config();

connectDB()

const app = express()
app.use(cors())
app.use(express.json());
app.use(express.urlencoded({extended:true}))

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/activity', activity);
app.use('/api/excel', require('./routes/excel'));

app.listen(process.env.PORT, () => {
    console.log('server is running')
})