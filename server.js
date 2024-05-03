require('dotenv').config();
const express = require('express');
const { MongoClient } = require('mongodb');

const app = express();
app.use(express.json()); // Middleware to parse JSON
//mongodb+srv://adityakuma0308:7CLaE1M7ZuZ2IKOr@finances.ikebao9.mongodb.net/
const uri = 'mongodb+srv://adityakuma0308:7CLaE1M7ZuZ2IKOr@finances.ikebao9.mongodb.net/'
async function startServer() {
    let db;
    try {
        const client = await MongoClient.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
        db = client.db('Finances'); // Ensure this matches your actual database name
        console.log('Connected to Database');

        app.post('/addReceipt', async (req, res) => {
            try {
                const receiptsCollection = db.collection('receipts');
                const result = await receiptsCollection.insertOne(req.body);
                res.status(200).json(result);
            } catch (error) {
                console.error('Error inserting data:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });

        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => {
            console.log(`Server listening on port ${PORT}`);
        });
    } catch (err) {
        console.error('Failed to connect to MongoDB', err);
    }
}

app.get('/getTransactions', async (req, res) => {
    try {
        const transactions = await db.collection('transactions').find({}).toArray(); // Ensure the collection name is correct
        res.status(200).json(transactions);
    } catch (error) {
        console.error('Failed to retrieve transactions:', error);
        res.status(500).json({ message: 'Failed to retrieve transactions' });
    }
});


startServer();
