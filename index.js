const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;
const app = express();
app.use(cors());
app.use(express.json());



const port = process.env.PORT||5000

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.qrydk.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;



const client = new MongoClient(uri);
async function run() {
  try {
    await client.connect();
    const database = client.db("Quizz-app");
    const Questions = database.collection("questions");
    const quesAnswer = database.collection("quesAns");
    const Users = database.collection("users");
    


    // ============= User & Admin Codes =====================

    // user posting in Db

    app.post('/addUser',async (req,res)=>{

      const user = req.body.user;
      console.log("user data is : ",user);
      const result = await Users.insertOne(user);
      console.log(result);
      res.json(result);

    })

    // -------- Getting users from Db ----------

    app.get('/users',async(req,res)=>{
  
      const result =  Users.find({});
      const Allusers = await result.toArray();
      const  users = Allusers.filter((user)=>{
        return (user.role!=="admin")
      })
     
      res.send(users);
    })


     // User upserting in Db
     app.put('/addUser',async (req,res)=>{
      const user = req.body.user;
      console.log("from put user ",user);
      const filter = {email: user.email};
      const options ={upsert:true};
      const updateDoc = {$set: user};
      const result = await Users.updateOne(filter,updateDoc,options);
      res.json(result);
    })

    // Adding Admin in Db with checking admin
    app.put('/users/admin', async (req,res)=>{

      const email = req.body.email;
      const userEmail = req.body.userEmail;
      console.log("making admin :",email);
      console.log("email decoded is : ",userEmail);
      const requester = userEmail;
      if(requester){
        const requesterAccount = await Users.findOne({email:requester});
        if(requesterAccount.role ==='admin'){
          const filter = {email:email};
          const updateDoc = { $set: { role: 'admin' }};
          const result = await Users.updateOne(filter,updateDoc);
          res.json(result);
        }
        else{
          res.status(403).json({message:'you donot have access to this page'})
        }
      }
     
    })


     // Checking if user is admin

     app.get('/user/:email',async(req,res)=>{
      const email = req.params.email;
      console.log("email is ",email);
      const query = {email:email};
      const user = await Users.findOne(query);
      let isAdmin = false;
      if(user?.role === 'admin'){
        isAdmin = true ;
      }
     
      res.json({admin:isAdmin})
    })





// =============== Question Part ==================


// ---------- Post Single Question to Db ---------

app.post('/postQuestion', async (req,res)=>{
  const data = req.body;
  console.log("found question to post : ",req.body);
  const result = await Questions.insertOne(data);
  res.send(result);
})

// ----------- Get Single question from db --------------
app.get('/question/:id', async (req,res)=>{
  const {id} = req.params;
  console.log("question search id is ", id);
  const filter = { _id: ObjectId(id) };
  const result = Questions.findOne(filter);
  const question = await result;
  res.send(question);
})



// ------ Updating Single Question to db ------
app.put('/updateQuestion/:id' ,async (req,res)=>{
  const { id } = req.params;
  console.log(" Question update request id is : ", id);
  const data =  req.body;
  console.log("Question update request status is : ", data);
  const filter = { _id: ObjectId(id) };
  const options = { upsert: true };
  const updateDoc = {$set:
     {
        question: data.question,
        opt1: data.opt1,
        opt2: data.opt2,
        opt3: data.opt3,
        opt4 : data.opt4,
        correctAns : data.correctAns
    }, };
  console.log("updated Question is : ", updateDoc);
  const result = await Questions.updateOne(filter,updateDoc,options);
  console.log("final update Question result is : ", result);
  res.send(result);
})

// ------------ Delete Single Question ---------------

app.delete('/deleteQuestion/:id',async (req,res)=>{
  const {id} = req.params;
  console.log("Delete Question by id hitted",id);
  const query = { _id: ObjectId(id) };
   const result = await  Questions.deleteOne(query);
   console.log("Deleted Question for Reviews",result);
   res.json(result);
})


// -------- Get All Question ---------

app.get('/allquestion',async (req,res)=>{
  const result =  Questions.find({});
       const questions = await result.toArray();
       res.json(questions);

})


// ====================== Ans Part ==========================


// -------------POST ANS-------------------

 app.post('/quesSubmit',async(req,res)=>{
   console.log("post hitted");
   const quesAns = req.body;
   console.log("request is ", quesAns)
   console.log("questions are ",quesAns);
   const result = await quesAnswer.insertMany(quesAns);
   res.send(result);

 })



//----------GET ALL ANS ---------------
 app.get('/myResults',async (req,res)=>{
  const result =  quesAnswer.find({});
       const myAns = await result.toArray();
       res.json(myAns);

})


// get ans by email

app.get('/myResults/:email',async (req,res)=>{
  const {email} = req.params;
  const result =  quesAnswer.find({email:email});
       const myAns = await result.toArray();
       res.json(myAns);

})


//------- Get All ans by Retake number ----------

app.get('/myRetake/:email/:ReId',async (req,res)=>{

  const {email} = req.params;
  const {ReId} = req.params;
  const retake = Number(ReId);
  console.log("user email :",email ,"recheck id :",retake);
  const query ={retake:retake, email:email};
  const result =  quesAnswer.find(query);
       const retakes = await result.toArray();
       res.json(retakes);

})




    
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Server Running at http://localhost:${port}`)
})



// app.get('/users')
// app.post('/users')
// app.get('/user/:id')
// app.put('/user/:id')
// app.delete('/user/:id')