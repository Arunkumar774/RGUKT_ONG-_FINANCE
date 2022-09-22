let express=require("express");
const dotenv=require("dotenv");
const cors=require("cors");
const bodyParser=require("body-parser");
const crypto=require("crypto");
const Razorpay=require("razorpay");
const mysql = require('mysql');
const session = require('express-session');
const path = require('path');
const nodemailer=require('nodemailer');
dotenv.config();
let app=express();
const DB_HOST = process.env.DB_HOST;
const DB_USER =process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_DATABASE =process.env.DB_DATABASE;
const DB_PORT = process.env.DB_PORT;
const port = process.env.PORT;
const db = mysql.createConnection({
    connectionLimit:100,
    host:DB_HOST,
    user:DB_USER,
    password:DB_PASSWORD,
    database:DB_DATABASE,
    port:DB_PORT
});
app.use(express.static('public'))
app.get('/' ,(req,res)=>{

  res.sendFile(__dirname + "/index.html")

})
//contact nodemailer
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.post('/contact',(req,res)=>{
   const transporter = nodemailer.createTransport({
      service:'gmail',
      auth:{
          user:'nakkasrikanth798@gmail.com',
          pass:'wdhzqhndkkrzuuvh',
      }
   })
   const mailOptions={
        from: '', // sender address
        to: "O170284@rguktong.ac.in", // list of receivers
        subject: req.body.issue, // Subject line
        html:` Student name:${req.body.name} <br> Student Id:${req.body.id} <br> Student email: ${req.body.email} <br> Student Issue:${req.body.message}`, // plain text body
   }

  transporter.sendMail(mailOptions,(error,info)=>{
      if(error){
          console.log(error);
          res.send('error');
      }
      else{
          console.log('Email send:'+info.response);
          res.send(`<h1 style="color:green">Your message successfully sent to admin</h1><br><a href="/">Click to go back to home page</a>`)
      }
  })
}
)
//Razorpay
const instance=new Razorpay({
    key_id:process.env.KEY_ID,
    key_secret:process.env.KEY_SECRET
});
//Middlewares
app.use(cors());
app.use(express.json());
app.use(
    bodyParser.urlencoded({
        extended:false
    })
);
app.use(bodyParser.json());
app.use(express.static('views'));
//Routes
app.get("/pay.html",(req,res)=>{
    res.sendFile(__dirname + "/public/pay.html",{key:process.env.KEY_ID});
});
app.post("/api/payment/order",(req,res)=>{
    params=req.body;
    instance.orders
        .create(params)
        .then((data)=>{
            res.send({sub:data,status:"success"});
        })
        .catch((error)=>{
            res.send({sub:error,status:"failed"});
        });
});
app.post("/api/payment/verify",(req,res)=>{
    body=req.body.razorpay_order_id + "|" + req.body.razorpay_payment_id;

    var expectedSignature=crypto
        .createHmac("sha256",process.env.KEY_SECRET)
        .update(body.toString())
        .digest("hex");
    console.log("sig" + req.body.razorpay_signature);
    console.log("sig" + expectedSignature);
    var response={status:"failure"};
    if(expectedSignature === req.body.razorpay_signature)
        response={status:"success"};
    res.send(response);
});
//Database
app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));
app.post('/auth', (req,res)=> {
	let username = req.body.username;
	let password = req.body.password;
	if (username && password) {
		db.query('SELECT * FROM LoginDB.datauser WHERE user = ? AND password = ?', [username, password], function(error, results, fields) {
			if (error) throw error;
			if (results.length > 0) {
				req.session.loggedin = true;
				req.session.username = username;
                // db.query('SELECT id FROM LoginDB.datauser WHERE user = ? AND password = ?', [username, password],(err,results,fields)=>{
                //     if (error) throw error;
			    //     if (results.length > 0){
                //         const ob = JSON.stringify(results);
                //         // console.log(JSON.stringify(results))
                //         const obj = JSON.parse(ob,(key,val)=>{
                //             Id=key
                //             console.log(val)
                //         })
                //     }
                // })
                // res.send(`<h1>${username} successfully Logged in!</h1><br><a href="/">Click to logout</a>`)
				res.redirect('/logged.html');
			} else {
				res.send(`<h1>Incorrect Username or Password!</h1>`);
			}			
			res.end();
		});
	} else {
		res.send(`<h1>Please enter Username and Password!</h1>`);
		res.end();
	}
});

app.listen(3000, () => {
   console.log(`Server is running at ${DB_HOST}:${port}`)
});