var express=require('express');
var http=require('http');
var nodemailer = require("nodemailer");
var app=express();
var xml2js =require('xml2js');
var port = process.env.PORT || 8000;
// var replaceall = require("replaceall");
var fs = require('fs');
var xml2js = require('xml2js');
// const SMA = require('technicalindicators').SMA;
var monitorGraphTimer = 40000;

var smtpTransport = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    auth: {
        user: 'tharaka.ranwaththa@gmail.com',
        pass: 'zlunbwisjmtwyquz'
    },
    tls: {rejectUnauthorized: false},
    debug:true
});


app.listen(port,function(){
	console.log("Express Started on Port ...." + port);
});


/*------------------SMTP Over-----------------------------*/

/*------------------Routing Started ------------------------*/

app.get('/',function(req,res){
	res.sendfile('index.html');
});


app.get('/monitorGraph',function(req,res){
	res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
 
	var unit = req.query.unit;
	var type = req.query.type;
	var monitorCount = 0;
	var a,b,c=0;
	var date,minutes,hours,time;
	console.log('MONITOR GRAPH');
	var symbolValue;
	var symbolMark=new Array();
	var cycle=0;

	monitorGraph(function(err,result){

		sendMail();

		result.Rates.Rate.forEach(function(item){
			var monitorGraph={};
		    if(item.$.Symbol==unit){
		    	console.log('added');

		    	var intervalMonitor = setInterval(function(){ 
		    		callWebService(function(err,result){
					  
					  	result.Rates.Rate.forEach(function(item){
					          monitorGraphList.forEach(function(objMonitoring){
					            if(item.$.Symbol==objMonitoring.unit){
									b = objMonitoring.ask;
									// console.log('b =' +b);
									date = new Date();
				                    minutes = String(date.getMinutes());
				                    hours = String(date.getHours());
				                    time = hours.concat(".",minutes);

					            	if(type=="buy"){
					            		a = parseFloat(item.Bid.toString()).toFixed(5);
					            		symbolValue = parseFloat(a - b).toFixed(5);
					            		console.log('VALUE '+ a +'-' + b + " = " + symbolValue);
					            		if(symbolValue>0){//making profit
					            			console.log('making profit by buying ');
					            			symbolMark[cycle]="PLUS";
					            			if(cycle>1){
					            				if(symbolMark[cycle]==symbolMark[cycle-1]){

					            					if(objMonitoring.sentLastMailtime==undefined){
                            
							                            console.log("SAME - SEND AN EMAIL first time");
							                            send
							                            objMonitoring.sentLastMailtime = time;

							                          }else{
							                            var x = time - objMonitoring.sentLastMailtime ;
							                            if(x>0.5){
							                                console.log("SAME - SEND AN EMAIL pass more than 5 min " + time);
							                            }else{
							                              console.log('has send within 5 min '+time);
							                            }
							                          }

					            				}else{
					            					//first cycle
					            					if(objMonitoring.sentLastMailtime==undefined){
                            
							                            console.log("SAME - SEND AN EMAIL first time");
							                            objMonitoring.sentLastMailtime = time;

							                          }else{
							                            var x = time - objMonitoring.sentLastMailtime ;
							                            if(x>0.5){
							                                console.log("SAME - SEND AN EMAIL pass more than 5 min " + time);
							                            }else{
							                              console.log('has send within 5 min '+time);
							                            }
							                          }
					            				}


					            			}else{
					            				console.log('first time making profit');
			            						//send mail

					            			}
					            		}else{
					            			//no profit 
					            			console.log('NO PROFIT  '+ (symbolValue/objMonitoring.initialRatio) );
					            			if(Math.abs(symbolValue/objMonitoring.initialRatio)>10){
					            				console.log('big lost');
					            				//send mail

					            			}else{

					            			}

					            		}

					            	}else{
					            		a = parseFloat(item.Bid.toString()).toFixed(5);
					            		symbolValue = parseFloat(b - a).toFixed(5);
					            	}
					       	
					            }
					          });  
					    });
					});
					

		    	},monitorGraphTimer);


		    	if(type=="buy"){
		    		monitorGraph={id:monitorCount,unit:unit, Date:new Date(),ask:item.Ask,bid:item.Bid,monitor:intervalMonitor,initialRatio:symbolValue};
		    		
		    	}else if(type=="sale"){
		    		monitorGraph={id:monitorCount,unit:unit, Date:new Date(),ask:item.Ask,bid:item.Bid,monitor:intervalMonitor};
		    	}
		    	monitorGraphList.push(monitorGraph);
		    	console.log(monitorGraph);
		    	monitorCount=monitorCount+1;
		    }
		});      
		res.end("sent");
	});
	
	
});

var monitorGraphList= new Array();

function monitorGraph(callback){
	callWebService(function(err,result){
		callback(err,result);
	});

}


app.get('/monitorGraphStop',function(req,res){
	var unit = req.query.unit;
	console.log("----------------stopping -----------------------------");
	monitorGraphStop(unit,function(monitorGraphList){
		
		console.log(monitorGraphList);
	});
});

function monitorGraphStop(unit,callback){
	monitorGraphList.forEach(function(objMonitoring){

		 if(unit==objMonitoring.unit){
		 	console.log('going to stop ' + unit);
		 	console.log(objMonitoring.monitor);
		 	clearInterval(objMonitoring.monitor);


monitorGraphList = monitorGraphList.filter(item => item !== objMonitoring);

console.log("ARRAY" + monitorGraphList); 




		 }else{
		 	console.log('????	');
		 }
	});

	callback(monitorGraphList);

}



//web service 
function callWebService(callback){

 var parser = new xml2js.Parser();

 parser.on('error', function(err) { console.log('Parser error', err); });

 var data = '';
 http.get('http://rates.fxcm.com/RatesXML', function(res) {
     if (res.statusCode >= 200 && res.statusCode < 400) {
       res.on('data', function(data_) { data += data_.toString(); });
       res.on('end', function() {
         // console.log('------------------DATS-----------', data);
         
         parser.parseString(data, function(err, result) {
          callback(err, result);
         });
       });
     }
   });

}

function sendMail(){
	

	var mailOptions={
		to : 'dev@icebergcoldrooms.com.au',
		subject : 'HURRY',
		text : 'notification'
	}
	console.log(mailOptions);

	smtpTransport.sendMail(mailOptions, function(error, response){
   	 if(error){
        	console.log(error);
		res.end("error");
	 }else{
        	console.log("Message sent: " + response.message);
		res.end("sent");
    	 }
});


}



