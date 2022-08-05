const express = require('express');
const cors = require('cors');
const port = process.env.PORT || 5000;
const app = express();
const jwt = require('jsonwebtoken');

require('dotenv').config();
//middle ware
app.use(cors());
app.use(express.json());


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.APP_USER}:${process.env.APP_PASS}@cluster0.wxhn4.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        const serviceCollection = client.db("creative-agency").collection("services");
        const orderCollection = client.db("creative-agency").collection("orders");
        const reviewCollection = client.db("creative-agency").collection("orders");
        const userCollection = client.db("creative-agency").collection("users");

        // -----------------------------
        // service collection
        app.get('/services', async (req, res) => {
            const result = await serviceCollection.find().toArray();
            res.send(result)
        })
        app.get('/service/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await serviceCollection.findOne(query);
            res.send(result)
        })
        // add service/ product api
        app.post('/service', async (req, res) => {
            const product = req.body;
            const result = await serviceCollection.insertOne(product);
            res.send(result)
        })


        // ============= order collection =============
        // post client order info
        app.post('/order', async (req, res) => {
            const order = req.body;
            if (!(order.name || order.projectDescription)) {
                return res.send({ success: false, message: 'Please fill up all input!' })
            }
            const result = await orderCollection.insertOne(order)
            res.send({ success: true, message: 'This order successfully added!' })
        })
        // post client review
        app.post('/review', async (req, res) => {
            const review = req.body;
            if (!(review.name || review.description || review.companyName)) {
                return res.send({ success: false, message: 'Please fill up all input!' })
            }
            const result = await reviewCollection.insertOne(review)
            res.send({ success: true, message: 'This review successfully added!' })
        })
        // -----------------------------
        // order collection here

        // get all order by email
        app.get('/orders/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const result = await orderCollection.find(query).toArray();
            res.send(result)
        })
        // get all orders

        app.get('/allorders', async (req, res) => {

            const result = await orderCollection.find().toArray();
            res.send({ success: true, result })
        })

        // ---------------------------------
        // User collection
        // add user in database mongo db
        app.put('/user/:email', async (req, res) => {
            const email = req.params.email;
            const userInfo = req.body;

            const filter = { email: userInfo.email }
            const option = { upsert: true };
            const updateDoc = {
                $set: userInfo,
            };
            const result = await userCollection.updateOne(filter, updateDoc, option);
            const token = jwt.sign({ email: email }, process.env.APP_JWT, { expiresIn: '10d' });
            res.send({ success: true, token });
        })

        // get user info
        app.get('/user/admin/:email', async (req, res) => {
            const email = req.params.email;
            const requesterUser = await userCollection.findOne({ email: email });
            const isAdmin = requesterUser?.role === 'admin';
            res.send({ admin: isAdmin })
        })
    }

    finally {
        // client.close()
    }
}
run().catch(console.dir)



app.get("/", (req, res) => {
    res.send("This project is running")
})
app.listen(port, () => {
    console.log("Project running on", port)
})
