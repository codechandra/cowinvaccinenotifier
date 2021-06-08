require('dotenv').config()
const express=require('express');
const app=express();
const path = require('path');
const got = require('got');
const nodemailer = require("nodemailer");
const mongoose = require('mongoose');
const bodyParser=require('body-parser');
const User=require('./models/user');
var mailBody="";
var n="";

app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());
app.use(function(req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', true);
  next();
});

app.use("/static", express.static('../Frontend/static'));
//app.use(express.static(__dirname + '/public'));


mongoose.connect(process.env.mongodburl,{ 
    useUnifiedTopology: true,
    useNewUrlParser: true 
 })

 console.log(path.join(__dirname,'../Frontend/index.html'))

 app.get('/',(req,res)=>{
  console.log(path.join(__dirname,'../Frontend/index.html'))
   res.sendFile(path.join(__dirname,'../Frontend/index.html'));
 })

 app.post('/register',(req,res)=>{
  User.find({pincode:req.body.pincode,email:req.body.email}).then(result=>{
    if(result.length===0){
      const user=new User({
        _id:new mongoose.Types.ObjectId(),
        pincode:req.body.pincode,
        email:req.body.email,
});
user.save().then(result=>{
    console.log("After storing data",result);
    res.status(200).json({
      message:"You'll be notified once the vaccination slots are available"
    })
})
.catch(err=>{
    console.log(err);
})

    }
    else{
      res.status(401).json({
        message:"User is already registered with same mail and pincode combo"
      })
    }
  })

  console.log(req.body.email,req.body.pincode);
  

 })



var initial=`<!DOCTYPE html>
<html>
<head>
<style>
table {
  font-family: arial, sans-serif;
  border-collapse: collapse;
  width: 100%;
}

td, th {
  border: 2px solid #dddddd;
  text-align: left;
  padding: 8px;
}

tr:nth-child(even) {
  background-color: #dddddd;
}
</style>
</head>
<body>

<h2>Hurray!! Vaccination slots are available in your area</h2>

<table>
  <tr>
    <th>Center_Name</th>
    <th>Address</th>
    <th>Fee_type</th>
     <th>Slots</th>
  </tr>`;
  var end=`</table>
  </body>
  </html>`

var y;

const constructEmailBody=(centerName,centerAddress,fee_type,centerSessions)=>{
    y="";
   for(let i=0;i<centerSessions.length;i++){
       y=y+"Date:"+centerSessions[i].date+"\n"+"Available_Capacity:"+centerSessions[i].available_capacity+"\nMinimum_Age_Limit:"+centerSessions[i].min_age_limit+"\nVaccine:"+centerSessions[i].vaccine+"Slots:"+centerSessions[i].slots+"available_capacity_dose1:"+centerSessions[i].vaccine.available_capacity_dose1+"available_capacity_dose2:"+centerSessions[i].vaccine.available_capacity_dose2
   }
    var x=`<tr>
        <td>${centerName}</td>
        <td>${centerAddress}</td>
        <td>${fee_type}</td>
        <td>${y}</td>
    </tr>`
    //console.log(x);
    return x;

}
const getVaccineSlotsAvailble=(pincode,email)=>{
  var now = new Date();
  var day = ("0" + now.getDate()).slice(-2);
  var month = ("0" + (now.getMonth() + 1)).slice(-2);
  var today = (day)+ "-" + (month) + "-" + now.getFullYear() ;
  
  console.log(today);
  let baseURL=`https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/calendarByPin?pincode=${pincode}&date=${today}`
  //console.log(baseURL);
    got.get(baseURL, {responseType: 'json'})
    .then(res => {
      const headerDate = res.headers && res.headers.date ? res.headers.date : 'no response date';
      console.log('Status Code:', res.statusCode);
      console.log('Date in Response header:', headerDate);
  
      const users = res.body;
      
      for(let i=0;i<users.centers.length;i++){
          if(!users.centers[i].sessions[0].available_capacity)
         initial+= constructEmailBody(users.centers[i].name,
          users.centers[i].address+","+users.centers[i].district_name+","+users.centers[i].block_name+","+users.centers[i].state_name+","+users.centers[i].pincode,
          users.centers[i].fee_type, users.centers[i].sessions)

      }
      //console.log("inside getVaccineDetails",mailBody);
        sendEmail(initial+end,email);
      
    })
    .catch(err => {
      console.log('Error: ', err.message);
    });

}
const sendEmail=(body,email)=>{
   // console.log("inside construct mail",body);
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'cowin.vaccine.slots@gmail.com',
          pass: process.env.mailPassword
        }
      });
      
      const mailOptions = {
        from: 'cowin.vaccine.slots@gmail.com',
        to: `${email}`,
        subject: 'Vaccination slots Available',
        html: `${body}`
      
      };
      
      transporter.sendMail(mailOptions, function(error, info){
        if (error) {
          console.log(error);
        } else {
         // console.log("Complete mail Body:",`${initial}+${body}+${end}`);
          console.log('Email sent: ' + info.response);
        }
      });
    
}


const pausecomp=(ms)=> {
  console.log("Waiting for 10 seconds before making an API Call to avoid IP Blockage");
  ms += new Date().getTime();
  while (new Date() < ms){}
  }
  

const getAllDataFromDB=()=>{
  User.find().exec().then(result=>{
    processData(result);
   })
   .catch(err=>{
       console.log(err);
   })
}


const processData=(data)=>{

  for(let i=0;i<data.length;i++){
  console.log(data[i].pincode,data[i].email);
  getVaccineSlotsAvailble(data[i].pincode,data[i].email);
  pausecomp(10000);
    
  }

}



getAllDataFromDB();

//console.log(`${initial}+${mailBody}+${end}`)
setInterval(()=>{
   // getVaccineSlotsAvailble();
},1000)
//getVaccineSlotsAvailble();







  app.listen((process.env.port), () => {
      console.log(`Server started on ${process.env.port}`);
  });
