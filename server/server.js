import express from 'express';
import 'dotenv/config';
import cors from 'cors';
import connectDB from './config/db.js';
import { clerkMiddleware } from '@clerk/express'
import clerkWebhooks from './controllers/clerkWebHooks.js';

connectDB();

const app = express()
app.use(cors()) //Enable Cross-origin Resource Sharing

// Middleware
app.use(express.json())
app.use(clerkMiddleware())

// API to listen clerk WebHook
app.use('/api/clerk',clerkWebhooks);

app.get('/', (req, res)=> {res.send('API is working')});

const PORT = process.env.PORT || 3000;

app.listen(PORT, ()=> {console.log(`Server Running on ${PORT}`);});
