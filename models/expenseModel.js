import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    splitMethod: {
        type: String,
        enum: ["equal", "exact", "percentage"],
        required: true,
    },
    exactAmounts: [
        {
            userId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                required: function() {
                    return this.splitMethod === "exact";
                },
            },
            amount: {
                type: Number,
                required: function() {
                    return this.splitMethod === "exact";
                },
            },
        },
    ],
    percentages: [
        {
            userId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                required: function() {
                    return this.splitMethod === "percentage";
                },
            },
            percentage: {
                type: Number,
                required: function() {
                    return this.splitMethod === "percentage";
                },
            },
        },
    ],
}, { timestamps: true });

const Expense = mongoose.model("Expense", expenseSchema);

export default Expense;
