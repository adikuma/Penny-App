const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB URI
const dbUsername = 'adityakuma0308';
const dbPassword = 'zwVhRygCQZArhQhc';
const clusterUrl = 'cluster0.l3f9wif.mongodb.net';
const dbName = 'Project0';
const db = `mongodb+srv://${dbUsername}:${dbPassword}@${clusterUrl}/${dbName}?retryWrites=true&w=majority`;

// Connect to MongoDB
mongoose.connect(db, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("MongoDB connected"))
    .catch(err => console.log(err));

// Receipt schema
const receiptSchema = new mongoose.Schema({
    storeName: String,
    date: String,
    category: String,
    imageUrl: String,
    lineItems: [{ itemName: String, itemValue: String, itemQuantity: Number }],
    total: String
});

const Receipt = mongoose.model('Receipt', receiptSchema);

// Route to handle POST requests to /receipts
app.post('/receipts', async (req, res) => {
    try {
        const newReceipt = new Receipt(req.body);
        await newReceipt.save();
        res.status(201).json({ message: 'Receipt saved successfully!', receipt: newReceipt });
    } catch (error) {
        console.error('Error saving receipt:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
