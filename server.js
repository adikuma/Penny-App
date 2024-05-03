require('dotenv').config();
const express = require('express');
const { MongoClient } = require('mongodb');

const app = express();
app.use(express.json());
const uri = 'mongodb+srv://adityakuma0308:7CLaE1M7ZuZ2IKOr@finances.ikebao9.mongodb.net/';

let db = null;  // Global db instance

async function connectDB() {
    if (db) return db;  // Use existing db connection if already connected
    try {
        const client = await MongoClient.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
        db = client.db('Finances');
        console.log('Connected to Database');
        return db;
    } catch (error) {
        console.error('Failed to connect to MongoDB:', error);
        throw error;  // Throw error to be handled by caller
    }
}

app.post('/addReceipt', async (req, res) => {
    try {
      const db = await connectDB(); 
      const receiptsCollection = db.collection('receipts');
      const dataToInsert = {
        storeName: req.body.storeName,
        date: req.body.date,
        category: req.body.category,
        description: req.body.description,
        lineItems: req.body.lineItems,
        total: req.body.total,
        imageUrl: req.body.imageUrl, // Make sure to include imageUrl here
      };
      const result = await receiptsCollection.insertOne(dataToInsert);
      console.log("Receipt inserted successfully:", result);
      res.status(200).json(result);
    } catch (error) {
      console.error('Error inserting receipt:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
app.get('/getTransactions', async (req, res) => {
    try {
        console.log("Starting...");
        const db = await connectDB(); 
        console.log("Successful db");
        const transactions = await db.collection('receipts').find({}).toArray();
        console.log("Transactions retrieved successfully:", transactions);
        res.status(200).json(transactions);
    } catch (error) {
        console.error('Failed to retrieve transactions:', error);
        res.status(500).json({ message: 'Failed to retrieve transactions' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
