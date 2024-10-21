import express from 'express';
import dotenv from 'dotenv';
import connectMongo from './db/connectmongo.js';
import userRoutes from './routes/userRoutes.js';
import cookieParser from 'cookie-parser';
import expenseRoutes from './routes/expenseRoutes.js'
import cors from 'cors';

dotenv.config();

const app = express();
connectMongo();

app.use(cookieParser());
app.use(express.json());
app.use(cors({
    origin: '*', // or specify your frontend URL
}));


app.use('/api/users', userRoutes);
app.use('/api/expense',expenseRoutes);

const PORT = process.env.PORT || 5000;

app.get('/', (req, res) => {
    res.send('Backend is running');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
