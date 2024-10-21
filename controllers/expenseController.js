import Expense from "../models/expenseModel.js";
import XLSX from "xlsx";
import User from "../models/userModel.js";

export const addExpense = async (req, res) => {
    try {
        const { description, amount, participants, splitMethod, exactAmounts, percentages } = req.body;
        const userId = req.userId; // Get the user ID from the request

        // Validate participants array
        if (!participants || participants.length === 0) {
            return res.status(400).json({ message: "Participants are required" });
        }

        let expenseData = {
            userId,
            description,
            amount,
            participants, // Ensure participants are included
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

export const getBalanceSheet = async (req, res) => {
    try {
        const userId = req.userId; // Get the authenticated user's ID

        // Fetch all expenses where the user is a participant
        const expenses = await Expense.find({
            $or: [
                { "exactAmounts.userId": userId },
                { "percentages.userId": userId }
            ]
        });

        let balanceSheet = {
            owes: {}, // Use an object to aggregate amounts owed to others
            owedTo: {}, // Use an object to aggregate amounts others owe to the user
            totalOwes: 0,
            totalOwedTo: 0
        };

        // Calculate the balances
        expenses.forEach(expense => {
            // Check exact amounts
            if (expense.splitMethod === 'exact') {
                const userExactAmount = expense.exactAmounts.find(entry => entry.userId.toString() === userId.toString());
                if (userExactAmount) {
                    // Calculate what others owe to the user
                    expense.exactAmounts.forEach(entry => {
                        if (entry.userId.toString() !== userId.toString()) {
                            balanceSheet.owedTo[entry.userId] = (balanceSheet.owedTo[entry.userId] || 0) + userExactAmount.amount;
                            balanceSheet.totalOwedTo += userExactAmount.amount;
                        }
                    });
                }
            }

            // Check percentages
            if (expense.splitMethod === 'percentage') {
                const userPercentage = expense.percentages.find(entry => entry.userId.toString() === userId.toString());
                if (userPercentage) {
                    const amountOwed = (userPercentage.percentage / 100) * expense.amount;

                    // Calculate what others owe to the user
                    expense.percentages.forEach(entry => {
                        if (entry.userId.toString() !== userId.toString()) {
                            balanceSheet.owedTo[entry.userId] = (balanceSheet.owedTo[entry.userId] || 0) + amountOwed;
                            balanceSheet.totalOwedTo += amountOwed;
                        }
                    });
                }
            }
        });

        // Calculate what the user owes to others
        expenses.forEach(expense => {
            // Check exact amounts
            if (expense.splitMethod === 'exact') {
                const userExactAmount = expense.exactAmounts.find(entry => entry.userId.toString() === userId.toString());
                if (userExactAmount) {
                    expense.exactAmounts.forEach(entry => {
                        if (entry.userId.toString() !== userId.toString()) {
                            balanceSheet.owes[entry.userId] = (balanceSheet.owes[entry.userId] || 0) + entry.amount;
                            balanceSheet.totalOwes += entry.amount;
                        }
                    });
                }
            }

            // Check percentages
            if (expense.splitMethod === 'percentage') {
                const userPercentage = expense.percentages.find(entry => entry.userId.toString() === userId.toString());
                if (userPercentage) {
                    expense.percentages.forEach(entry => {
                        if (entry.userId.toString() !== userId.toString()) {
                            const amountOwed = (entry.percentage / 100) * expense.amount;
                            balanceSheet.owes[entry.userId] = (balanceSheet.owes[entry.userId] || 0) + amountOwed;
                            balanceSheet.totalOwes += amountOwed;
                        }
                    });
                }
            }
        });

        // Convert balances to arrays for easier handling in the response
        balanceSheet.owes = Object.entries(balanceSheet.owes).map(([userId, amount]) => ({ userId, amount }));
        balanceSheet.owedTo = Object.entries(balanceSheet.owedTo).map(([userId, amount]) => ({ userId, amount }));

        return res.status(200).json({ balance: balanceSheet });
    } catch (error) {
        console.error("Error in getBalanceSheet:", error);
        return res.status(500).json({ message: "Error fetching balance sheet" });
    }
};


export const generateBalanceSheet = async (req, res) => {
    try {
        const userId = req.userId; // Get authenticated user ID
        const expenses = await Expense.find({ userId });

        // Process expenses to create balance sheet data
        const balanceData = {}; // { userId: { totalAmount, username } }
        
        // Initialize balance data with usernames
        const participants = new Set(); // To collect participant user IDs
        expenses.forEach(expense => {
            expense.exactAmounts.forEach(entry => {
                const amount = entry.amount;
                const participantId = entry.userId.toString();

                // Add participant IDs to the set
                participants.add(participantId);

                // Sum up amounts owed or paid
                if (!balanceData[participantId]) {
                    balanceData[participantId] = { totalAmount: 0, username: null };
                }
                balanceData[participantId].totalAmount += amount;
            });
        });

        // Fetch usernames for participants
        const users = await User.find({ _id: { $in: Array.from(participants) } });
        const userMap = {};
        users.forEach(user => {
            userMap[user._id.toString()] = user.username; // Map userId to username
        });

        // Update balanceData with usernames
        Object.keys(balanceData).forEach(userId => {
            balanceData[userId].username = userMap[userId]; // Add username to balanceData
        });

        // Convert balanceData to a format suitable for Excel
        const balanceArray = Object.entries(balanceData).map(([userId, { totalAmount, username }]) => ({
            userId,
            username, // Include username
            totalAmount,
        }));

        // Create a new workbook and add data
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(balanceArray);
        XLSX.utils.book_append_sheet(wb, ws, "Balance Sheet");

        // Set response headers
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="balance_sheet.xlsx"');

        // Write to buffer and send it as response
        const buffer = XLSX.write(wb, { bookType: "xlsx", type: "buffer" });
        res.send(buffer);
    } catch (error) {
        console.error("Error in generateBalanceSheet:", error);
        return res.status(500).json({ message: "Error generating balance sheet" });
    }
};