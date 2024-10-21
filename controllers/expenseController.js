import Expense from "../models/expenseModel.js";

export const addExpense = async (req, res) => {
    try {
        const { description, amount, participants, splitMethod, exactAmounts, percentages } = req.body;
        const userId = req.userId; // Get the user ID from the request

        let expenseData = {
            userId,
            description,
            amount,
            participants,
            splitMethod,
        };

        // Handle split logic based on the splitting method
        if (splitMethod === 'exact') {
            // Validate that the exact amounts add up to the total amount
            const totalExactAmount = exactAmounts.reduce((sum, entry) => sum + entry.amount, 0);
            if (totalExactAmount !== amount) {
                return res.status(400).json({ message: "Exact amounts do not sum up to the total expense" });
            }
            expenseData.exactAmounts = exactAmounts; // Store exact amounts
        } else if (splitMethod === 'percentage') {
            // Validate that the percentages add up to 100
            const totalPercentage = percentages.reduce((sum, entry) => sum + entry.percentage, 0);
            if (totalPercentage !== 100) {
                return res.status(400).json({ message: "Percentages do not add up to 100%" });
            }
            // Calculate exact amounts based on percentages and total amount
            expenseData.exactAmounts = percentages.map(entry => ({
                userId: entry.userId,
                amount: (entry.percentage / 100) * amount,
            }));
            expenseData.percentages = percentages; // Store percentages
        } else if (splitMethod === 'equal') {
            // Calculate the equal share for each participant
            const equalShare = amount / participants.length;
            expenseData.exactAmounts = participants.map(participantId => ({
                userId: participantId,
                amount: equalShare,
            }));
        }

        // Create and save the new expense
        const newExpense = new Expense(expenseData);
        await newExpense.save();

        return res.status(201).json({ message: "Expense added successfully", expense: newExpense });
    } catch (error) {
        console.error("Error in addExpense:", error);
        return res.status(500).json({ message: "Error adding expense" });
    }
};


export const getUserExpenses = async (req, res) => {
    try {
        const userId = req.userId;
        const expenses = await Expense.find({ userId });

        return res.status(200).json({ expenses });
    } catch (error) {
        console.error("Error in getUserExpenses:", error);
        return res.status(500).json({ message: "Error fetching expenses" });
    }
};
