const express = require("express");
const app = express();
const cors = require("cors");
const mongodb = require("mongodb");
const mongoclient = mongodb.MongoClient;
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");

const URL = "mongodb+srv://shaunakDas:admin123@cluster0.exlrt.mongodb.net/test"; 

app.use(express.json());
app.use(cors({
    origin: "*"
}));

function authenticate(req, res, next) {
    // Check is the token is present in header
    if (req.headers.authorization) {
        // Check if the token is valid
        let valid = jwt.verify(req.headers.authorization, "}QF_w,(<u7BBt>V}");
        if (valid) {
            // if valid all next()
            req.userid = valid.id
            next();
        } else {
            res.status(401).json({
                message: "Unauthorized"
            })
        }
    } else {
        res.status(401).json({
            message: "Unauthorized"
        })
    }

}

app.post("/user/register/:type", async function(req,res){
    try {
        //open the connection
        let conn = await mongoclient.connect(URL);

        //select the db
        let db= conn.db("loan");

        let salt = await bcryptjs.genSalt(10);
        let hash = await bcryptjs.hash(req.body.password,salt);

        req.body.password = hash;
        req.body.confirmPassword = hash;
        req.body.type = req.params.type;
        //select the collection
        //do operation
        let user = await db.collection("user").findOne({userEmail: req.body.userEmail});
        if(user){
            res.status(401).json({
                message:"user already exists. Only one user allowed per email."
            })
        }else{
            await db.collection('user').insertOne(req.body);
            res.json({
                message: "User Created"
            })    
        }
        //close the connection
        await conn.close();
    } catch (error) {
        //console.log(error);
        res.status(500).json({
            message: "Error"
        })
    }
})

app.post("/user/login", async function(req,res){
    try {
        //open the connection
        let conn = await mongoclient.connect(URL);

        //select the db
        let db= conn.db("loan");

        //find user with email id
        let user = await db.collection("user").findOne({userEmail: req.body.userEmail});
        //console.log(user);
        if(user){
            let result = await bcryptjs.compare(req.body.password,user.password);

            if(result){
                let token = jwt.sign({
                    id: user._id,
                    exp: Math.floor(Date.now() / 1000) + (60 * 60)
                }, "}QF_w,(<u7BBt>V}")
                res.status(200)
                    .json({
                        message: "Success",
                        token
                    })
            }else{
                res.status(401).json({
                    message: "Password incorrect or User not found"
                })
            }

        }else{
            res.status(401).json({
                message:"Password incorrect or User not found"
            })
        }

        //close the connection
        await conn.close();
        
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message:"login error"
        })
    }
})

//get user details based on email
app.get("/user/:email",authenticate,async function(req,res){
    try {
        //open the connection
        let conn = await mongoclient.connect(URL);

        //select the db
        let db= conn.db("loan");

        //select the collection
        //do operation
        let user = await db.collection("user").findOne({userEmail:req.params.email})
        
        if(user){
            res.json(user);
        }else{
            res.status(401).json({
                message:"user not found. please enter valid email"
            })
        }
        
        //close the connection
        await conn.close();
    } catch (error) {
        console.log(error)
        res.json({
            message: "there was an error"
        })
    }
})

//loan application
app.post("/user/applyloan",authenticate, async function(req,res){
    try {
        //open the connection
        let conn = await mongoclient.connect(URL);

        //select the db
        let db= conn.db("loan");

        //select the collection
        //do operation
        req.body.userid = req.userid;
        await db.collection('applyLoan').insertOne(req.body);
        res.json({
            message: "Loan Application Successful"
        })   
        
        //close the connection
        await conn.close();
    } catch (error) {
        //console.log(error);
        res.status(500).json({
            message: "Error. Try Again"
        })
    }
})

//get all loans
app.get("/getloan/:type", authenticate,async function(req,res){
    try {
        //open the connection
        let conn = await mongoclient.connect(URL);

        //select the db
        let db= conn.db("loan");
        let type = req.params.type;

        //select the collection
        //do operation
        let projects;
        if(type === "user"){
            projects = await db.collection('applyLoan').find({userid : req.userid}).toArray();
        }else if(type === "admin"){
            projects = await db.collection('applyLoan').find().toArray();
        }
    
        //close the connection
        await conn.close();

        res.json(projects);
    } catch (error) {
        res.status(500).json({
            message: "Error"
        })
    }
})

//delete loan by email
app.delete("/delLoanApp/:email",authenticate, async function(req,res){
    try {
        //open the connection
        let conn = await mongoclient.connect(URL);

        //select the db
        let db= conn.db("loan");

        //select the collection
        //do operation
        await db.collection("applyLoan").findOneAndDelete({userEmail:req.params.email});

        //close the connection
        await conn.close();

        res.json({
            message: "Deleted"
        });
    } catch (error) {
        res.status(500).json({
            message: "error"
        })
    }
})

//get all users
app.get("/getusers",authenticate, async function(req,res){
    try {
        //open the connection
        let conn = await mongoclient.connect(URL);

        //select the db
        let db= conn.db("loan");

        //select the collection
        //do operation
        let projects = await db.collection('user').find().toArray();

        //close the connection
        await conn.close();

        res.json(projects);
    } catch (error) {
        res.status(500).json({
            message: "Error"
        })
    }
})

//delete user by email
app.delete("/delUser/:email", authenticate,async function(req,res){
    try {
        //open the connection
        let conn = await mongoclient.connect(URL);

        //select the db
        let db= conn.db("loan");

        //select the collection
        //do operation
        await db.collection("user").findOneAndDelete({userEmail:req.params.email});

        //close the connection
        await conn.close();

        res.json({
            message: "Deleted"
        });
    } catch (error) {
        res.status(500).json({
            message: "error"
        })
    }
})

//update user by Email
app.put("/updateuser/:email", authenticate,async function(req,res){
    try {
        //open the connection
        let conn = await mongoclient.connect(URL);

        //select the db
        let db= conn.db("loan");

        //select the collection
        //do operation
        await db.collection("user").findOneAndUpdate({userEmail:req.params.email},{$set:req.body})

        //close the connection
        await conn.close();

        res.json({
            message : "Updated"
        })
    } catch (error) {
        console.log(error)
    }
})


app.listen( process.env.PORT || 3000,function(){
    console.log(`Server is running in PORT ${process.env.port}`);
})