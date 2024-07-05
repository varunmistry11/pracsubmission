var express = require("express");
var mysql = require('mysql');
var connection = mysql.createConnection({
	host: 'localhost',
	user: 'root',
	password: 'password_here',
	database: 'practical_submission'
});
var app = express();

connection.connect(function(err){
	if(!err){
		console.log("Database is connected");
	}else{
		console.log("Error connecting to database");
	}
});

app.listen(3000);