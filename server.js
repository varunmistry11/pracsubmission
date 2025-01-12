var express=require('express');
var app=express();
var multer=require('multer');
var upload=multer({dest:'./files/'});
var fs=require('fs');
var PORT=3000;
var bodyParser=require('body-parser');	
app.use( bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
})); 
var mysql=require('mysql');
var mkdirp=require('node-mkdirp');
var connection = mysql.createConnection({
  host: 'localhost',
  user     : 'root',
  password : 'Varunsmail@96',
  database : 'project'
});

function createFolder(path){
	fs.stat('./files/'+path,function(err,stats){
		if(!stats)
		{
			fs.mkdir('./files/'+path);
		}
	});
}

function convertToRoman(number){
	if(number==1){
		return 'I';
	}else if(number==2){
		return 'II';
	}else if(number==3){
		return 'III';
	}else if(number==4){
		return 'IV';
	}else if(number==5){
		return 'V';
	}else if(number==6){
		return 'VI';
	}else if(number==7){
		return 'VII';
	}else{
		return 'VIII';
	}

}

app.post('/send',upload.single('files'),function (req,res) {

		mkdirp('./files/141070098/I/'+req.body.subject+'/');
	
		fs.rename(req.file.path,'files\\141070098\\I\\'+req.body.subject+'\\'+req.file.originalname,function(error){
			if(error){
				fs.stat(req.file.path,function(err,stats){
					if(stats.isFile()){
						fs.unlink(req.file.path,function(err){
							if(err)
								throw err;
						});
					}
				});
				res.send("Failed");
			}else{
				connection.query('INSERT INTO submissions (student_id,file_path,practical_id) VALUES (?,?, (SELECT id FROM practicals WHERE course_id=? and practical_no=?))',['141070098','files\\141070098\\'+req.file.originalname,req.body.subject,req.body.practicalNumber],function(err,result){
					if(err){
						fs.stat('files\\141070098\\'+req.file.originalname,function(err,stats){
							if(stats.isFile()){
								fs.unlink(req.file.path,function(err){
									if(err)
										throw err;
								});
							}
						});
					}
					return res.json(result);
				});
				// res.send(JSON.stringify(req.body)+JSON.stringify(req.file.originalname));
			}	
	}); 
	
});	

app.post('/register',function (req,res){
	var query='INSERT INTO student(id,password,first_name,last_name,sem_dept_id) VALUES (?,?,?,?,'+
		'(SELECT id FROM sem_dept where semester=? AND department=?))';

	connection.query(query,[req.body.registrationNumber,req.body.password,req.body.firstName,req.body.lastName,req.body.semester,req.body.branch], function(err, rows) {
		  if (err) throw err;
		  createFolder(req.body.registrationNumber);
		  createFolder(req.body.registrationNumber+'/'+convertToRoman(req.body.semester));
	  	  res.json(rows);
	});	
});

app.post('/registerTeacher',function (req,res){
	var query='INSERT INTO teacher(id,password,department,first_name,last_name) VALUES (?,?,?,?,?)';

	connection.query(query,[req.body.idNumber,req.body.password,req.body.department,req.body.firstName,req.body.lastName], function(err, rows) {
		  if (err) throw err;
		  res.json(rows);
	});	
});

app.post('/changeTeacherPassword',function(req,res){
	var query='UPDATE teacher SET password=? WHERE id=? AND password=?';
	connection.query(query,[req.body.newPassword,req.body.idNumber,req.body.oldPassword], function(err, rows){
		if (err) {throw err;}
		res.json(rows);
	});
});

app.post('/resetStudentPassword',function(req, res){
	var query='UPDATE student SET password=? WHERE id=?';
	connection.query(query,[req.body.password,req.body.idNumber],function(err, rows){
		if (err) {throw err;}
		res.json(rows);
	});
});

app.post('/login',function (req,res){
	connection.query('SELECT password FROM `student` where id=?',[req.body.registrationNumber], function(err, rows) {
	  if (err) throw err;
	  if(rows.length===0){
	  	return res.json("No such user exists");
	  }else{
	  	if(rows[0].password===req.body.password){
	  		return res.json("Logged In");	
	  	}else{
		  	return res.json("Failed to Login");
	    }	
	  }
	});
});

app.post('/teacherlogin',function (req,res){
	connection.query('SELECT password FROM `teacher` where id=?',[req.body.registrationNumber], function(err, rows) {
	  if (err) throw err;
	  if(rows.length===0){
	  	return res.json("No such user exists");
	  }else{
	  	if(rows[0].password===req.body.password){
	  		return res.json("Logged In");	
	  	}else{
		  	return res.json("Failed to Login");
	    }	
	  }
	});
});

app.post('/adminLogin',function(req,res){
	connection.query('SELECT password FROM admin WHERE admin=?',[req.body.adminUserName], function(err, rows){
		if (err) {throw err;}
		if(rows.length===0){
			return res.json("Admin User Name is wrong.");
		}else{
			if(rows[0].password===req.body.password){
				//window.open("/src/admin5.html",_self,"","");
				//alert("Logged In");
				//alert("Logged In");
				res.send("Logged In");
			}else{
				return res.json("Failed to Login");
			}
		}
	});
});

app.get('/results/:course_id&:practical_number',function(req,res){
	var query="SELECT student_id,file_path,marks,date FROM submissions WHERE practical_id= (SELECT id FROM practicals WHERE course_id=? AND practical_no=?)";
	connection.query(query,[req.params.course_id,req.params.practical_number],function(err,rows){
		if(err) 
			throw err;
		res.json(rows);
	});
});

app.get('/practicals/:course_id&:student_id',function(req,res){
	var query='SELECT `practical_count`, MAX(`practical_no`) as `practical_number` FROM `courses`'+
	'join practicals on courses.course_id=practicals.course_id '+ 
	'join submissions on practical_id=practicals.id WHERE courses.course_id=?  AND submissions.student_id=?';
	
	connection.query(query,[req.params.course_id,req.params.student_id], function(err, rows) {
	  
	  if(err){
	  	return res.json(err);
	  }

	  if(rows.length===0){
	  	return res.json("No Practicals");
	  }else{
	  	return res.json(rows);
	  }
	});
});

app.get('/subjects/:teacher_id',function(req,res){
	
	connection.query('SELECT course_name,course_id FROM `courses` where teacher_id=?',[req.params.teacher_id], function(err, rows) {
	  
	  if(err){
	  	return res.json("Error Occured, Try Later");
	  }

	  if(rows.length===0){
	  	return res.json("No Subjects");
	  }else{
	  	return res.json(rows);
	  }
	});
});

app.get('/practicalcount/:course_id',function(req,res){
	connection.query('SELECT practical_count FROM `courses` where course_id=?',[req.params.course_id], function(err, rows) {
	  
	  if(err){
	  	return res.json("Error Occured, Try Later");
	  }

	  if(rows.length===0){
	  	return res.json("No Practical");
	  }else{
	  	return res.json(rows);
	  }
	});
});

app.get('/semsubjects/:student_id',function(req,res){
	var query='SELECT course_id,course_name FROM courses '+
	'WHERE sem_dept_id=(SELECT sem_dept_id FROM student where id=?)';
	connection.query(query,[req.params.student_id], function(err, rows) {
	  if (err) throw err;
	  	res.json(rows);
	});
});

app.post('/practical',function(req,res){
	var query="INSERT INTO practicals (submission_date,question,course_id,practical_no) "+
	"SELECT ?,?,course_id,(practical_count+1) FROM courses where course_id=? ";
	connection.query(query,[req.body.submissionDate,req.body.question,req.body.course], function(err, result) {
	  if (err) throw err;
	  	updatePractical();
	  	res.json(result);
	});
			
	function updatePractical(){
		  connection.query('UPDATE courses SET practical_count=practical_count+1 WHERE course_id=?',[req.body.course], function(err, rows) {
			  if (err) throw err;
		});
	}	
});

app.post('/startNewSem',function(req, res){
	connection.query('UPDATE student SET sem_dept_id = CASE WHEN (sem_dept_id%8 = 0) THEN null ELSE sem_dept_id+1 END',function(err, data){
		if(err)
			res.json({"message":"Error"});
		else
			res.json({"message":"Successful"});
	});
	/*
	connection.query('SELECT id, sem_dept_id FROM student WHERE sem_dept_id <= 7',function(err, rows){
		if (err) throw err;
		connection.query('UPDATE student SET sem_dept_id=? WHERE id=?',rows[0].sem_dept_id + 1,rows[0].id);
	});
	connection.query('SELECT id, sem_dept_id FROM student WHERE sem_dept_id >= 9 AND sem_dept_id <= 15',function(err, rows){
		if (err) throw err;
		connection.query('UPDATE student SET sem_dept_id=? WHERE id=?',rows[0].sem_dept_id + 1,rows[0].id);
	});
	connection.query('SELECT id, sem_dept_id FROM student WHERE sem_dept_id >= 17 AND sem_dept_id <= 23',function(err, rows){
		if (err) throw err;
		connection.query('UPDATE student SET sem_dept_id=? WHERE id=?',rows[0].sem_dept_id + 1,rows[0].id);
	});
	connection.query('SELECT id, sem_dept_id FROM student WHERE sem_dept_id >= 25 AND sem_dept_id <= 31',function(err, rows){
		if (err) throw err;
		connection.query('UPDATE student SET sem_dept_id=? WHERE id=?',rows[0].sem_dept_id + 1,rows[0].id);
	});
	connection.query('SELECT id, sem_dept_id FROM student WHERE sem_dept_id >= 33 AND sem_dept_id <= 39',function(err, rows){
		if (err) throw err;
		connection.query('UPDATE student SET sem_dept_id=? WHERE id=?',rows[0].sem_dept_id + 1,rows[0].id);
	});
	connection.query('SELECT id, sem_dept_id FROM student WHERE sem_dept_id >= 41 AND sem_dept_id <= 47',function(err, rows){
		if (err) throw err;
		connection.query('UPDATE student SET sem_dept_id=? WHERE id=?',rows[0].sem_dept_id + 1,rows[0].id);
	});
	connection.query('SELECT id, sem_dept_id FROM student WHERE sem_dept_id >= 49 AND sem_dept_id <= 55',function(err, rows){
		if (err) throw err;
		connection.query('UPDATE student SET sem_dept_id=? WHERE id=?',rows[0].sem_dept_id + 1,rows[0].id);
	});
	connection.query('SELECT id, sem_dept_id FROM student WHERE sem_dept_id >= 57 AND sem_dept_id <= 63',function(err, rows){
		if (err) throw err;
		connection.query('UPDATE student SET sem_dept_id=? WHERE id=?',rows[0].sem_dept_id + 1,rows[0].id);
	});
	connection.query('SELECT id, sem_dept_id FROM student WHERE sem_dept_id >= 65 AND sem_dept_id <= 71',function(err, rows){
		if (err) throw err;
		connection.query('UPDATE student SET sem_dept_id=? WHERE id=?',rows[0].sem_dept_id + 1,rows[0].id);
	});
	connection.query('SELECT id,sem_dept_id FROM student WHERE sem_dept_id = 8 OR sem_dept_id = 16 OR sem_dept_id = 24 OR sem_dept_id = 32 OR sem_dept_id = 40 OR sem_dept_id = 48 OR sem_dept_id = 56 OR sem_dept_id = 64 OR sem_dept_id = 72',function(err, rows){
		if (err) {throw err;}
		connection.query('UPDATE student SET sem_dept_id=? WHERE id=?',null,rows[0].id);
	});*/
});


app.use('/fileupload',express.static(__dirname+'/public/fileupload.html'));
//app.use('/registerform',express.static(__dirname+'/public/registerform.html'));
// app.use('/loginform',express.static(__dirname+'/public/loginform.html'));
app.use('/practicalform',express.static(__dirname+'/public/practicalform.html'));
app.use('/checkingpage',express.static(__dirname+'/public/checkingpage.html'));
app.use('/admin',express.static(__dirname+'/public/admin.html'));
app.use('/admin1',express.static(__dirname+'/public/admin1.html'));
app.use('/admin2',express.static(__dirname+'/public/admin2.html'));
app.use('/admin3',express.static(__dirname+'/public/admin3.html'));
app.use('/adminlogin',express.static(__dirname+'/public/admin4.html'));
app.use('/admin5',express.static(__dirname+'/public/admin5.html'));
app.use('/',express.static(__dirname+'/public'));

app.listen(3000,function(){
	console.log("Express started: "+PORT);
});
