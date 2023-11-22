const express = require("express");
const app = express();
const bodyParser = require("body-parser");
var sessions = require('express-session');
require('dotenv').config();
app.use(sessions({
  secret: process.env.SESSION_SECRET,
  saveUninitialized:true,
  resave: false
}));

var sess;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.set("view engine", "ejs");

var mysql = require("mysql2");
const { render } = require("ejs");
var con = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT),
});

con.connect(function (err) {
  if (!err) console.log("Connected!");
  else console.log(err);
});


app.get("/", function (req, res) {
  res.render("index");
});

app.get("/login", function (req, res) {
  sess = req.session;
  if(sess.number){
    if(sess.type=='barb'){
      res.redirect('newbarb');
    }
    else if(sess.type=='cust'){
      res.redirect('newcust');
    }
  }
  else
    res.render("login");
});

app.get("/cust", function(req,res){
  if(sess.number){
    if(sess.type=='cust') res.redirect('newcust');
    else res.redirect('/newbarb');
  }
  else res.render("login");
});

app.get("/logout", function (req, res) {
  sess = req.session;
  if(sess.number){
    sess.number = undefined;
    sess.type = undefined;
    res.redirect('/');
  }
});

app.get("/blockmsg",function(req,res){
  res.render("blockmsg");
})

app.post("/abcde",function(req,res){
  const num = req.body.number;
  con.query("select * from blocklist",function(err,res1){
    if(res1){
      for(let i=0;i<res1.length;i++){
        if(res1[i].mobNumber == num){
          res.send('blocked');
          break;
        }
      }
    }
  })
})


app.post("/abcd",function(req,res){
  const num = req.body.number;
  sess = req.session;
  sess.number = num;
  if(num=='8360270013'){
    sess.type = 'barb';
    res.send('newbarb');
  }
  else{
    con.query("INSERT Into Customers values ('"+num+"');",function(err,res1){
      if(!err || err.code == 'ER_DUP_ENTRY'){
        sess.type = 'cust';
        res.send('cust');
      }
      else{
        console.log(err);
      }
    });
  }
});

app.get("/newcust", function (req, res) {
  sess = req.session;
  if(sess.type=='cust')
    res.render("newcust.ejs");
  else
    res.redirect('login');
});

app.get("/newbarb", function (req, res) {
  sess = req.session;
  if(sess.type=='barb')
    res.render("newbarb.ejs");
  else
    res.redirect('login');
});

app.get("/bookapp", function (req, res) {
  sess = req.session;
  if(sess.type=='cust'){
    con.query("SELECT DISTINCT Services.serviceId,Services.serviceName, Services.forGender, Services.price FROM Services join Materials join Inventory WHERE forGender='F' and Services.serviceId=Materials.serviceId and Materials.itemId=Inventory.itemId and Inventory.qtyAvail>0;", function (err, result) {
      con.query("SELECT DISTINCT Services.serviceId,Services.serviceName, Services.forGender, Services.price FROM Services join Materials join Inventory WHERE forGender='M' and Services.serviceId=Materials.serviceId and Materials.itemId=Inventory.itemId and Inventory.qtyAvail>0;", function (err, result1) {
        console.log(result1);
        console.log(result);
        res.render("bookapp.ejs",{female:result,male:result1});
      });
    });
  }
  else{
    res.redirect('login');
  }
});

app.post("/temptoday",function(req,res){
  var date = req.body.date;
  var gender = req.body.gender;
  var sql = "SELECT startTime FROM Appointments where date = '"+date+"' AND gender = '"+gender+"'";
  con.query(sql,function(err,res1){
    res.send(res1);
  });
});

app.post("/appbookedd", function (req, res) {
  sess = req.session;
  var name = req.body.name;
  var gender = req.body.gender;
  var services = req.body.services;
  var time = req.body.slots;
  var day = req.body.date;
  var date = new Date().toDateString();
  if(day!="today"){
    var tomorrow = new Date(date);  
    tomorrow.setDate(tomorrow.getDate()+1);
    date = tomorrow.toDateString();
  }
  var sql = "INSERT INTO Appointments (`isPaid`,`mobNumber`,`gender`,`custName`,`date`,`startTime`) values (0,'"+sess.number+"','"+gender+"','"+name+"','"+date+"','"+time+"');"
  con.query(sql,function(err,res1){
    if(!err){
      con.query("SELECT appointmentId from Appointments where startTime = '"+time+"' AND date = '"+date+"';",function(err1,res2){
        if(!err1){
          for(let i=0;i<services.length;i++){
            con.query("INSERT INTO AppointmentServices (`appointmentId`, `serviceId`) VALUES ("+res2[0].appointmentId+","+services[i]+" );",function(err2,res3){
              if(!err2){
                
              }
              else console.log(err2);
            })
          }
          res.redirect("custApp");
        }
        else console.log(err1);
      })
    }
    else console.log(err);
  });
});

app.get("/custApp",function(req,res){
  sess = req.session;
  if(sess.type=='cust'){
    con.query(
      "select Appointments.date, Appointments.appointmentId, Appointments.custName, Customers.mobNumber, Services.serviceName, Appointments.startTime, Services.price, Appointments.isPaid from Customers join Appointments on Customers.mobNumber = Appointments.mobNumber join AppointmentServices on Appointments.appointmentId = AppointmentServices.appointmentId join Services on AppointmentServices.serviceId = Services.serviceId where Customers.mobNumber = '"+ sess.number +"' Order by Appointments.startTime ASC;",
      function (err, result) {
        res.render("custApp", { tables: result });
      }
    );
  }
  else{
    res.redirect('login');
  }
});


app.get("/placeorder",function(req,res){
  sess = req.session;
  if(sess.type=='cust')
    res.render("placeOrder.ejs");
  else
    res.redirect('login');
});

app.post("/orderForm",(req, res) => {
  sess = req.session;
  var productName = req.body.productName;
  var name = req.body.name;
  var qty = req.body.qty;
  console.log(name);
  console.log(productName);
  console.log(qty);
  var date = new Date().toDateString();
  var time = new Date().toLocaleTimeString('en-US');
  con.query("INSERT INTO Orders (`orderDate`, `orderTime`, `mobNumber`, `product`, `customerName`,`qty`, `orderStatus`) VALUES ('"+date+"','"+time+"','"+sess.number+"','"+productName+"','"+name+"',"+qty+", 'Pending');",function(err,res1){
    if(!err){
      res.redirect("custOrders");
    }
    else console.log(err);
  })
});

app.get("/custOrders",function(req,res){
  sess = req.session;
  if(sess.type=='cust')
    res.render('custOrders');
  else
    res.redirect('/login');
})


// ******************************** Barber End *********************************** //

app.get('/block', function(req,res){
  sess = req.session;
  if(sess.type=='barb')
    res.render('block');
  else
    res.redirect('login');
});

app.post("/blocknum",function(req,res){
  const number = req.body.mnum;
  const reason = req.body.reason;
  con.query("INSERT INTO blocklist (`mobNumber`, `reason`) VALUES ('"+number+"','"+reason+"');",function(err,res1){
    if(!err){
      res.redirect("barb");
    }
    else{
      console.log(err);
    }
  })
})

app.get("/blocklist", function (req, res) {
  sess = req.session;
  if(sess.type=='barb'){
    con.query("select * from blocklist;",
      function (err, result) {
        res.render("blocklist.ejs", { tables: result });
      }
    );
  }
  else
    res.redirect('login');
});

app.post("/unblock",function(req,res){
  const number = req.body.arr.number;
  con.query("DELETE FROM blocklist WHERE mobNumber= '"+number+"';",function(err,res1){
    if(!err){
      res.send('done');
    }
    else{
      console.log(err);
    }
  })
});

app.get("/appointments", function (req, res) {
  sess = req.session;
  if(sess.type=='barb'){
    con.query("select Appointments.appointmentId, Appointments.date, Appointments.custName, Customers.mobNumber, Services.serviceName, Appointments.startTime, Services.price, Appointments.isPaid from Customers join Appointments on Customers.mobNumber = Appointments.mobNumber join AppointmentServices on Appointments.appointmentId = Appointmentservices.appointmentId join Services on AppointmentServices.serviceId = Services.ServiceId where Appointments.isPaid=0 Order by Appointments.startTime ASC;",
      function (err, result) {
        res.render("appointments.ejs", { tables: result });
      }
    );
  }
  else
    res.redirect('login');
});

app.get("/inventory", function (req, res) {
  sess = req.session;
  if(sess.type=='barb'){
    con.query("SELECT * FROM Inventory where itemStatus !='Inactive'", function (err, result) {
      res.render("inventory.ejs", { tables: result });
    });
  }
  else
    res.redirect('login');
});

app.get("/manageService",function(req,res){
  sess = req.session;
  if(sess.type=='barb'){
    con.query("SELECT * FROM Services where serviceStatus = 'Active' ORDER BY forGender ASC;",function(err,res1){
      con.query("SELECT * FROM Inventory",function(err1,res2){
        res.render("manageService",{tables:res1,tables1:res2});
      })
    });
  }
  else
    res.redirect('login');
});

app.post("/serviceEdit",function(req,res){
  const arr = req.body.arr;
  const serviceName = arr.fname;
  const forGender = arr.lname;
  const price = arr.email;
  con.query("UPDATE Services SET `serviceName` = '"+serviceName+"',`forGender` = '"+forGender+"', `price` = "+price+" WHERE `serviceId` = "+arr.id+";",function(err,res1){
    if(!err) res.send('done');
    else console.log(err);
  })
});

app.post("/serviceInsert",function(req,res){
  const arr = req.body.arr;
  const serviceName = arr.name;
  const forGender = arr.forGender;
  const price = arr.price;
  con.query("INSERT INTO Services (`serviceName`, `forGender`, `price`,`serviceStatus`) VALUES ('"+serviceName+"','"+forGender+"',"+price+",'Active');",function(err,res1){
    if(!err) res.send('done');
    else console.log(err);
  })
});

app.post("/inventoryEdit",function(req,res){
  const arr = req.body.arr;
  const itemName = arr.name;
  const qty = arr.qty;
  con.query("UPDATE Inventory SET `itemName` = '"+itemName+"',`qtyAvail` = "+qty+" WHERE `itemId` = "+arr.id+";",function(err,res1){
    if(!err) res.send('done');
    else console.log(err);
  })
});


app.post("/itemInsert",function(req,res){
  const arr = req.body.arr;
  const itemName = arr.name;
  const qty = arr.qty;
  con.query("INSERT INTO Inventory (`itemName`, `qtyAvail`) VALUES ('"+itemName+"',"+qty+");",function(err,res1){
    if(!err) res.send('done');
    else console.log(err);
  })
});

app.get("/delete/:proId", (req, res) => {
  sess = req.session;
  if(sess.type=='barb'){
    const proId = req.params.proId;
    let sql = `UPDATE Inventory SET itemStatus = 'Inactive' where itemId = ${proId}`;
    let query = con.query(sql, (err, result) => {
      if (err) console.log(err);
      else{
        res.redirect("/inventory");
      }
  });
  }
  else{
    res.redirect("/login");
  }
});

app.get("/deleteService/:proId", (req, res) => {
  sess = req.session;
  if(sess.type=='barb'){
    const proId = req.params.proId;
    let sql = `UPDATE Services SET serviceStatus='Inactive' where serviceId = ${proId}`;
    let query = con.query(sql, (err, result) => {
      if (err) throw err;
      else{
        res.redirect("/manageService");
      }
  });
  }
  else res.redirect("/login");
});

var sId;
var name;
app.post("/mapItems", (req, res) => {
  sId = req.body.arr.id;
  name= req.body.arr.fname;
  res.send('done');
});

app.get("/map",function(req,res){
  sess = req.session;
  if(sess.type=='barb'){
    con.query("SELECT * from Inventory where itemStatus = 'Active';",function(err,res1){
    if(!err){
    console.log(name);
      res.render("mapItemForm",{tables:res1,name:name});}
    else
      console.log(err);
  })
  }
  else{
    res.redirect("/login");
  }
});

app.post("/submitItemForm",function(req,res){
  const items = req.body.items;
  var sql = "insert into Materials values ("+sId+","+items[0]+")";
  for(let i=1;i<items.length;i++){
    sql+=",("+sId+","+items[i]+")";
  }
  sql+=";"
  con.query(sql,function(err,res1){
    if(!err || err.code == 'ER_DUP_ENTRY'){
      res.redirect('/manageService');
    }
    else{
      console.log(err);
    }
  })
});

app.get("/deleteAppointment/:proId", (req, res) => {
  sess = req.session;
  if(sess.type=='cust'){
    const proId = req.params.proId;
    let sql = `DELETE from AppointmentServices where appointmentId = ${proId}`;
    let sql1 = `DELETE from Appointments where appointmentId = ${proId}`;
    con.query(sql,function(err,res1){
      if(!err){
        con.query(sql1,function(err1,res2){
          if(!err1){
            res.redirect("/custApp");
          }
          else{
            console.log(err1);
          }
        })
      }
      else{
        console.log(err);
      }
    })
  }
  else{
    res.redirect("/login");
  }
  
});

app.post('/completeApp',function(req,res){
  //console.log(req.body.appId);
  con.query("UPDATE Appointments SET `isPaid` = 1 WHERE `appointmentId` ="+req.body.appId+";",function(err,res1){
    if(!err) res.send('done');
    else console.log(err);
  })
});

app.get("/orders",function(req,res){
  sess = req.session;
  if(sess.type=='barb'){
    res.render("orders");
  }
  else{
    res.redirect("/login");
  }
});

app.post("/pending",function(req,res){
  sess = req.session;
  if(sess.type=='cust'){
    con.query("select * from Orders where orderStatus = 'Pending' and mobNumber='"+sess.number+"';",function(err,res1){
      if(!err)
        res.send(res1);
      else
        console.log(err);
    })
  }
  else if(sess.type=='barb'){
    con.query("select * from Orders where orderStatus = 'Pending';",function(err,res1){
      if(!err)
        res.send(res1);
      else
        console.log(err);
    })
  }
});


app.post("/approved",function(req,res){
  sess = req.session;
  if(sess.type=='cust'){
    con.query("select * from Orders where orderStatus = 'Approved' and mobNumber='"+sess.number+"';",function(err,res1){
      if(!err)
        res.send(res1);
      else
        console.log(err);
    })
  }
  else if(sess.type=='barb'){
    con.query("select * from Orders where orderStatus = 'Approved';",function(err,res1){
      if(!err)
        res.send(res1);
      else
        console.log(err);
    })
  }
});

app.post("/declined",function(req,res){
  sess = req.session;
  if(sess.type=='cust'){
    con.query("select * from Orders where orderStatus = 'Declined' and mobNumber='"+sess.number+"';",function(err,res1){
      if(!err)
        res.send(res1);
      else
        console.log(err);
    })
  }
  else if(sess.type=='barb'){
    con.query("select * from Orders where orderStatus = 'Declined';",function(err,res1){
      if(!err)
        res.send(res1);
      else
        console.log(err);
    })
  }
});

app.post("/completed",function(req,res){
  sess = req.session;
  if(sess.type=='cust'){
    con.query("select * from Orders where orderStatus = 'Completed' and mobNumber='"+sess.number+"';",function(err,res1){
      if(!err)
        res.send(res1);
      else
        console.log(err);
    })
  }
  else if(sess.type=='barb'){
    con.query("select * from Orders where orderStatus = 'Completed';",function(err,res1){
      if(!err)
        res.send(res1);
      else
        console.log(err);
    })
  }
});

app.post('/tempcancelOrder',function(req,res){
  const orderId = req.body.orderId;
  con.query("UPDATE Orders SET `orderStatus` = 'Declined' WHERE `orderId` = "+orderId+";",function(err,res1){
    if(!err){
      res.send('done');
    }
    else console.log(err);
  })
})

app.post('/tempapproveOrder',function(req,res){
  const orderId = req.body.orderId;
  con.query("UPDATE Orders SET `orderStatus` = 'Approved' WHERE `orderId` = "+orderId+";",function(err,res1){
    if(!err){
      res.send('done');
    }
    else console.log(err);
  })
})


app.post('/tempcompleteOrder',function(req,res){
  const orderId = req.body.orderId;
  con.query("UPDATE Orders SET `orderStatus` = 'Completed' WHERE `orderId` = "+orderId+";",function(err,res1){
    if(!err){
      res.send('done');
    }
    else console.log(err);
  })
})


app.post("/orderEditbyBarber",function(req,res){
  const arr = req.body.arr;
  const amt = arr.amt;
  const deliveryDate = arr.date;
  con.query("UPDATE Orders SET `amount` = "+amt+",`deliveryDate` = '"+deliveryDate+"' WHERE `orderId` = "+arr.orderId+";",function(err,res1){
    if(!err)
      res.send('done');
    else
      console.log(err);
  })
});


const port = parseInt(process.env.PORT, 10) || 3001;

app.listen(port, function () {
  console.log(`Running on port ${port}`);
});
