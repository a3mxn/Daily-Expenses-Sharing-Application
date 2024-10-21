import express from 'express';
import dotenv from 'dotenv';
import connectMongo from './db/connectmongo.js';
import userRoutes from './routes/userRoutes.js';

dotenv.config();

const app = express();

app.use(express.json());

connectMongo();

app.use('/api/users', userRoutes);

const PORT = process.env.PORT || 5000;

app.get('/', (req, res) => {
    res.send('Backend is running');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
