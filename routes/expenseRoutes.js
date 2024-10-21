import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import {
    addExpense,
    getUserExpenses,
} from '../controllers/expenseController.js';

const router = express.Router();

router.post('/',authMiddleware, addExpense);
router.get('/',authMiddleware, getUserExpenses);

export default router;
