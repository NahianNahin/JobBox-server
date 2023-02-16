require("dotenv").config();
const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;

const cors = require("cors");

app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.4k7t9co.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

const run = async () => {
  try {
    const db = client.db("jobbox");
    const userCollection = db.collection("user");
    const jobCollection = db.collection("job");

    app.post("/user", async (req, res) => {
      const user = req.body;

      const result = await userCollection.insertOne(user);

      res.send(result);
    });

    app.get("/user/:email", async (req, res) => {
      const email = req.params.email;

      const result = await userCollection.findOne({ email });

      if (result?.email) {
        return res.send({ status: true, data: result });
      }

      res.send({ status: false });
    });
    app.get("/users/:id", async (req, res) => {
      const id = req.params.id;
      
      const result = await userCollection.findOne({ _id: new ObjectId(id) });

      return res.send({ status: true, data: result });
    });

    app.patch("/apply", async (req, res) => {
      const userId = req.body.userId;
      const jobId = req.body.jobId;
      const email = req.body.email;
      const firstName = req.body.firstName;
      const lastName = req.body.lastName;

      const filter = { _id: new ObjectId(jobId) };
      const updateDoc = {
        $push: { applicants: { id: new ObjectId(userId), email, jobId,firstName,lastName } },
      };

      const result = await jobCollection.updateOne(filter, updateDoc);

      if (result.acknowledged) {
        return res.send({ status: true, data: result });
      }

      res.send({ status: false });
    });

    app.patch("/query", async (req, res) => {
      const userId = req.body.userId;
      const jobId = req.body.jobId;
      const email = req.body.email;
      const question = req.body.question;

      const filter = { _id: new ObjectId(jobId) };
      const updateDoc = {
        $push: {
          queries: {
            id: new ObjectId(userId),
            email,
            question: question,
            reply: [],
          },
        },
      };

      const result = await jobCollection.updateOne(filter, updateDoc);

      if (result?.acknowledged) {
        return res.send({ status: true, data: result });
      }

      res.send({ status: false });
    });
    app.patch("/chat", async (req, res) => {
      const userId = req.body.userId;
      const emailFrom = req.body.emailFrom;
      const message = req.body.message;

      const filter = { _id: new ObjectId(userId) };
      const updateDoc = {
        $push: {
          chat: {
            id: new ObjectId(userId),
            emailFrom ,
            message: message,
          },
        },
      };

      const result = await userCollection.updateOne(filter, updateDoc);

      if (result?.acknowledged) {
        return res.send({ status: true, data: result });
      }

      res.send({ status: false });
    });

    app.patch("/reply", async (req, res) => {

      const reply = req.body.reply;
      const userId = req.body.userId;
      console.log(reply);
      console.log(userId);

      const filter = { "queries.id": new ObjectId(userId) };
      console.log(filter);
      const updateDoc = {
        $push: {
          "queries.$[user].reply": reply,
        },
      };
      const arrayFilter = {
        arrayFilters: [{ "user.id": new ObjectId(userId) }],
      };

      const result = await jobCollection.updateOne(
        filter,
        updateDoc,
        arrayFilter
      );
      if (result.acknowledged) {
        return res.send({ status: true, data: result });
      }

      res.send({ status: false });
    });




    app.get("/applied-jobs/:id", async (req, res) => {
      const id = req.params.id;
      const query = { applicants: { $elemMatch: { id: new ObjectId(id) } } };
      const cursor = jobCollection.find(query).project({ applicants: 0 });
      const result = await cursor.toArray();

      res.send({ status: true, data: result });
    });

    app.get("/jobs", async (req, res) => {
      const cursor = jobCollection.find({});
      const result = await cursor.toArray();
      res.send({ status: true, data: result });
    });

    app.get("/job/:id", async (req, res) => {
      const id = req.params.id;

      const result = await jobCollection.findOne({ _id: new ObjectId(id) });
      res.send({ status: true, data: result });
    });

    app.post("/job", async (req, res) => {
      const job = req.body;

      const result = await jobCollection.insertOne(job);

      res.send({ status: true, data: result })
    });

    app.put('/jop/application/:id', async (req, res) => {
      const id = req.params.id;
      const applicationState = req.body.applicationState;
      console.log(id);
      const filter = {
        _id: new ObjectId(id)
      }

      const options = { upsert: true };
      const updateDoc = {
        $set: {
          application: applicationState
        },
      };
      const result = await jobCollection.updateOne(filter, updateDoc, options);
      res.send({ status: true, data: result });
    })
  } finally {
  }
};

run().catch((err) => console.log(err));

app.get("/", (req, res) => {
  res.send("Hello World! Welcome to JobBox!");
});

app.listen(port, () => {
  console.log(`JobBox server is listening on port ${port}`);
});