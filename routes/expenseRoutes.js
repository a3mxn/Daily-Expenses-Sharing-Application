import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import {
    addExpense,
    getUserExpenses,
    getBalanceSheet,
    generateBalanceSheet
} from '../controllers/expenseController.js';

const router = express.Router();

router.post('/', authMiddleware, addExpense);
router.get('/', authMiddleware, getUserExpenses);
router.get('/balance-sheet', authMiddleware, getBalanceSheet);
router.get('/generate-balance-sheet', authMiddleware, generateBalanceSheet); // Add this line

export default router;
