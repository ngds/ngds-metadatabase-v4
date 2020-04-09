// This module not in use !!

var express = require('express');
var router = express.Router();

var csw = require('csw-client');
const xml2js = require('xml2js');
var options = {};
var  fs = require("fs");

var  Path = process.env.NODE_PATH;
const pg = require('pg'),
	xmldoc = require('xmldoc');
//const connectionString = process.env.DATABASE_URL || 'postgres://localhost:5432/GEOTHERMAL';
const connectionString = 'postgres://ngdsdb:geonewton@localhost:5432/geothermal'; 

 var iXml = fs.readFileSync(Path+'/transact-insert-template.xml', 'utf8');
 
let afMap = new Map();
class autoFunction {
  constructor(n) {
    this.name =  n;
    afMap.set(n,this);
    
  }
  exec(o) { return this.name;}
}

var autoFinder = function(n){
  for (let [key, value] of afMap.entries()) {
    if ( key == n) {
      return value;
    }
  }
  return null;
}


function XMLtoJ(data) {
	var aj = {};
	 var parser = new xml2js.Parser({explicitArray: false, ignoreAttrs: false, mergeAttrs: false });
	 parser.parseString(data, function (err, result) {
        aj = result;
        console.log(' xml Parser !!!!'); // + JSON.stringify(aj) );
    });
	 return aj;
}


var grbi = new autoFunction('getRecordById');
grbi.exec = async function(o,r) {

  	var rGuid = o.guid;
	var hAction = o.action;
	var hFormat = o.outputFormat;
	var gTitle = o.title;
	var setid = o.setid;
    var burl =  o.hurl;
	
	var bServ = '?service=CSW&version=2.0.2&request=GetRecordById';
	var bOpts = '&outputFormat=' + hFormat + '&elementsetname=' + hAction + '&outputschema=http://www.isotc211.org/2005/gmd';
	var bId  = '&id='+rGuid;
	var hUrl = burl+bServ+bId+bOpts;
	console.log(' hurl ' + hUrl);

	var hr = require('request');
	var body = '';

	hr.get(hUrl)
       .on ('response',function(response) {           		
      	})
        .on ('data', function(chunk) {
          body += chunk;
        })
        .on ('end', function() {

            var xd = new xmldoc.XmlDocument(body);
            var oiw;
            xd.eachChild(function(d){
            	if ( oiw ) {
            		return;
            	}
            	oiw = d;
            	
            	
            })
            var babyXd = xd.firstChild;

            //response.header('Content-Type', 'text/xml');
            //response.type('text/xml');
            //console.log(' body ' + oiw.toString({compressed:true}) ); // + new xmldoc.XmlDocument(body).toString({trimmed:true}));
            return new Promise(function(resolve, reject){
            	if (typeof(oiw) !== "undefined") {
            		var jBody =  XMLtoJ( oiw.toString({compressed:true}) );
            		var mBody = JSON.stringify(jBody);
            		mBody = mBody.replace(/'/g, "\''");
            		//var rcd = create_record(rGuid, setid, gTitle, mBody).catch(err=>console.log('create record err '+err));
            		var sqlStr = 'select * from makemdrecord(\''+rGuid+'\','+setid+',\''+rGuid+'\',\''+ gTitle + '\',6,\'' + mBody + '\'::json)';
            		console.log(' makdmd call' + sqlStr);

            		//return new Promise(function(resolve, reject){

						client.query(sqlStr, (err, res) => {
						 	console.log('Write query return '+JSON.stringify(res) );
						  	if ( typeof(res) !== "undefined" ) {
						  	//var pic = res.rows;
						  		//resolve(res);
						  		console.log('write q response '+JSON.stringify(res));
						  		r.json(res);
						  	//resolve(JSON.stringify(res));
						  	} else {
						  		console.log('write q errored '+JSON.stringify(err));
						  		r.json(err);
								//reject("create_record error " + err);	  	
						  	}
						});
			     
					//});
            		//resolve(oiw.toString({compressed:true}) );
            	} else {
            	    reject("error")
            	}
          	
     		});

     	});
}

	async function create_record(mGuid, mCid, mTitle, mBody) {

        mBody = mBody.replace(/'/g, "\''");
		var sqlStr = 'select * from makemdrecord(\''+mGuid+'\',1,\''+mCid+'\',\''+mTitle+'\',6,\'' + mBody + '\'::json)';
		console.log('create record  '+mGuid)
		return new Promise(function(resolve, reject){

			client.query(sqlStr, (err, res) => {
				 console.log('Write query return '+res);
				  if ( typeof(res) !== "undefined" ) {
				  	//var pic = res.rows;
				  	resolve(res);
				  	//resolve(JSON.stringify(res));
				  } else {
					reject("create_record error ");	  	
				  }
			});
			     
		});
	}


var cswRBId = async function (o) { 
	// retrieves a single record for inspection
	//var hurl = request.query.hurl;
	var rGuid = o.guid;
	var hAction = o.action;
	var hFormat = o.outputFormat;
    
	var burl = 'http://catalog.usgin.org/geothermal/csw';
	var bServ = '?service=CSW&version=2.0.2&request=GetRecordById';
	var bOpts = '&outputFormat=' + hFormat + '&elementsetname=' + hAction + '&outputschema=http://www.isotc211.org/2005/gmd';
	var bId  = '&id='+rGuid;
	var hUrl = burl+bServ+bId+bOpts;

	var hr = require('request');
	var body = '';

	hr.get(hUrl)
       .on ('response',function(response) {           		
      	})
        .on ('data', function(chunk) {
          body += chunk;
        })
        .on ('end', function() {
    		//var tb = JSON.parse(body);
            //var xlj = XMLtoJ(body);
            //var x = body.children[0];
            var xd = new xmldoc.XmlDocument(body);
            var oiw;
            xd.eachChild(function(d){
            	if ( oiw ) {
            		return;
            	}
            	oiw = d;
            	
            	//console.log('child pass '+ d.toString({trimmed:true}) );
            })
            var babyXd = xd.firstChild;

            //response.header('Content-Type', 'text/xml');
            //response.type('text/xml');
            console.log(' body ' + oiw.toString({compressed:true}) ); // + new xmldoc.XmlDocument(body).toString({trimmed:true}));
            return new Promise(function(resolve, reject){
            	if (typeof(oiw) !== "undefined") {
            		resolve(oiw.toString({compressed:true}) );
            	} else {
            	    reject("error")
            	}
          	
     		});

     	});

};

const client = new pg.Client(connectionString);

const results = [];
client.connect();

function n(mdvid) {
	var sqlStr = 'Select * from mdview where version_id='+mdvid;
	console.log('bingo');
	return new Promise(function(resolve, reject){
		client.query(sqlStr, (err, res) => {
			  if ( typeof(res) !== "undefined" ) {
			  	resolve(JSON.stringify(res));
			  } else {
				reject("error noodle");	  	
			  }
		});
		     
	});

}

async function dbquery(qry) {

	console.log('db query ' + qry);
	return new Promise(function(resolve, reject){
		client.query(qry, (err, res) => {
			  if ( typeof(res) !== "undefined" ) {
			  	resolve(res);
			  } else {
				reject("error ");	  	
			  }
		});		     
	});

}

function cswGetRecords(url){

	var hurl = url; //'http://catalog.usgin.org/geothermal/csw';
	var rc = 0;
	var options = {};
	options.startPosition = 0;
	options.resultType='results';
	options.typeNames='gmd:MD_Metadata';
	options.maxRecords= 10;
	options.elementSetName='full';
	//options.constraintlanguage='Filter';
	options.outputFormat='text/xml';
	options.outputSchema='http://www.isotc211.org/2005/gmd';
	console.log( JSON.stringify(options));

	cswClient = csw(hurl, options);
	cswClient.harvest(options)
		.on('record', record => { 
			rc++;
			if ( rc == 1 ) { console.log('body ' + JSON.stringify(record) )}
			console.log('record ' + rc + record.type); 
			})
	.on('error', err => console.error(err))
	.on('end', () => console.log('Finished!'))
	.resume();

}
// currrenty this bypasses creating new job with newcollectionActivity

router.get('/harvestRecord', (request, response) => { 

    console.log('nca '+JSON.stringify(request.query) );
	var z= { "guid" : "o"};
    z.guid = request.query.guid;
	z.action = request.query.action;
	z.outputFormat = request.query.outputFormat;
	z.title = request.query.title;
	z.setid = request.query.setid;
	z.hurl = request.query.hurl;
	
	var mf = autoFinder('getRecordById');
	var rtn = {};
	rtn.fn ='newCAtest';
	mf.exec(z,response);
   
});

// This handles json or xml - always makes xml req tho
router.get('/getRecordById', async function(request, response) {
    
  	var rGuid = request.query.guid;
	var hAction = request.query.action;
	var hFormat = request.query.outputFormat;
	var burl =  request.query.hurl;
    var oft = 'application/xml';

	//var burl = 'http://catalog.usgin.org/geothermal/csw';
	var bServ = '?service=CSW&version=2.0.2&request=GetRecordById';
	var bOpts = '&outputFormat=' + oft + '&elementsetname=' + hAction + '&outputschema=http://www.isotc211.org/2005/gmd';
	var bId  = '&id='+rGuid;
	var hUrl = burl+bServ+bId+bOpts;

	var hr = require('request');
	var body = '';

	hr.get(hUrl)
       .on ('response',function(response) {           		
      	})
        .on ('data', function(chunk) {
          body += chunk;
        })
        .on ('end', function() {
    		//var tb = JSON.parse(body);
            //var xlj = XMLtoJ(body);
            //var x = body.children[0];
            var xd = new xmldoc.XmlDocument(body);
            var oiw;
            xd.eachChild(function(d){
            	if ( oiw ) {
            		return;
            	}
            	oiw = d;
            	
            	//console.log('child pass '+ d.toString({trimmed:true}) );
            })
            var babyXd = xd.firstChild;
            var gResp = oiw.toString({compressed:true});

            if ( hFormat !== oft ) {
            	response.header('Content-Type', 'application/json');
            	response.type('application/json');
                var jr = XMLtoJ(gResp);
                response.json(jr);
			} else {


            	response.header('Content-Type', 'text/xml');
            	response.type('text/xml');
            //console.log(' body ' + oiw.toString({compressed:true}) ); // + new xmldoc.XmlDocument(body).toString({trimmed:true}));
            	response.send(oiw.toString({compressed:true}));		    
            }
     });


});


router.get('/getRecords', async function(req, res) {
  var cid = req.query.collid;
  var pAction = req.query.action;
  var cSql = 'select * from collections where set_id = ' + cid;
  var hRec = await dbquery(cSql);
  console.log('DB ' + JSON.stringify(hRec));
  var hurl = hRec.rows[0].source_url;
   
  cswGetRecords(hurl);
  res.send('prewired');

});

router.get('/record_search', async function(req, res) {
	var qry = req.query.qry;
	if ( typeof(req.query.start) !== "undefined")  { var offset = req.query.start; } else { var offset = 0;  } 
	if ( typeof(req.query.page) !== "undefined") {  var lim = req.query.page; } else { var lim = 25; } 
	console.log(' >>> record search '+qry)
 
    if ( qry.length ) {
    	var rcd = await find_records(qry,offset, lim);
    	console.log(' search >>'+qry+' '+rcd.rows.length);
    	
    	res.send(rcd);	
    } else {
    	res.send('Enter a query');	
    }  	
});

router.get('/record_show', async function(req, res) {
	var rid = req.query.id;
	console.log(' >>> record show '+rid)
 
    if ( rid.length ) {
    	var rcd = await record_show(rid);
    	res.send(rcd);	
    } else {
    	res.send('Enter a record id');	
    }  	
});

router.get('/getCategories', async function(req, res) {
	var lid = req.query.lid;
	console.log(' >>> categoruesrecord show '+lid)
    var cats = await categories(lid);
    if ( cats ) {
    	//var rcd = await record_show(rid);
    	res.send(cats);	
    } else {
    	res.send('Not Categories');	
    }  	
});


// generic debuggin tool
router.get('/getData', (request, response) => {
	
	var tbn = request.query.tbn;
	var qfld = request.query.qfld;
	var qv = request.query.qv;
	var sqlStr = 'Select * from ' + tbn + ' where ' + qfld + ' = ' + qv;
	console.log ( sqlStr );
	client.query(sqlStr, (err, res) => {
	  if ( typeof(res) !== "undefined" ) {
		 
		  //console.log(err, res)
		  if ( res.hasOwnProperty('rows') ) {
			var rta = res.rows;
			  var stack = "Data Request: ";
			  for ( var k in rta) {
				  var nx = rta[k];
				  Object.keys(nx).forEach(function(key) {
					  stack = stack + 'Key : ' + key + ', Value : ' + nx[key];
				  })
				  //stack = stack + ' ' + nx;
			  }
			  response.json("Data :" + stack);  
		  } else {
			 response.json('No Data Found');  
		  }
	  } else {
		response.json('Not Ready'); 
	  }
	  //client.end()
	})
});
// Start a HJ - setup tables and initiate server
router.get('/harvestJob', (request, response) => {
	var setid = request.query.setid;
	var action = 'standard harvest';
	var directive = 'now';

	var sqlStr = 'Select * from new_collection_activity(' + setid + ',\'' + action + '\',\'' + directive + '\',null)';
	console.log('new hj ' + sqlStr);
	
	client.query(sqlStr, (err, res) => {
		 if ( typeof(res) !== "undefined" ) {
		 	response.json(res); 
		 } else {
		 	response.json(err); 
		 }
	});

});

// OLD - Router harvest not currently active use the main one
router.get('/harvest', (request, response) => {
    
    var offset = request.query.offset;
    var hurl = request.query.hurl;

    options.startPosition = offset;
    var mxr = options.maxRecords;
    var rc = 0;
    var rsp = { "results" : [] };

    cswClient = csw('http://catalog.usgin.org/geothermal/csw', options);

	async function fw() {
	   var rp = await cswClient.records(options);
	   var ret = rp.returned;
       var mat = rp.matched;

       for (var k in rp.records) {
           var mx = rp.records[k];
           var mTitle = mx.title;
           var mGuid = mx.originalId;
           var mCid = mx.id;
           var mDate = mx.modified;
           var mBody = JSON.stringify(mx.body);
         
           console.log('Writing  ', mGuid, mTitle);

           var rcd = await create_record(mGuid, mCid, mTitle, mBody);
           var rbg = JSON.stringify(rcd);
           rsp.results.push(rbg);

           if ( (mxr - 1) == rc ) {
	  			response.json(rsp);
	  			return;
	  		}
	  		rc++;
           	 
       }

       console.log( ' return json --> ', JSON.stringify(rsp) );

	}

	fw();


});

router.get('/harvestSourceInfo', (request, response) => {
   
    var hsid = request.query.hsid;
    //var sqlStr = 'Select * from collections where set_id = '+ hsid;
    var sqlStr = 'select set_id, set_name, c.status, c.user_id, c.create_date, '  
							+ '		source_url, '
							+ '		set_description, '
							+ '		activity_name,'
							+ '		c.schema_id,'
							+ '		schema_name,'
							+ '		u.name as username'
							+ '	from collections c, activity_definition a, schemas s, users u'
							+ '	where c.activity_definition_id = a.ad_id and '
							+ '		c.schema_id = s.schema_id and'
							+ '		c.user_id = u.user_id and'
							+ '		c.set_type = \'harvest\' and' 
							+ '		c.status = \'active\' and c.set_id = ' + hsid;

    console.log('sql ' + sqlStr);

    client.query(sqlStr, (err, res) => {

	  if ( typeof(res) !== "undefined" ) {
		 
	  	response.json(res);  
	  	/*
		  if ( res.hasOwnProperty('rows') ) {
			var rta = res.rows;
			  var stack = "Data Request: ";
			  for ( var k in rta) {
				  var nx = rta[k];
				  Object.keys(nx).forEach(function(key) {
					  stack = stack + 'Key : ' + key + ', Value : ' + nx[key];
				  })

			  }
			  response.json("Data :" + stack);  
		  } else {
			 response.json('No Data Found');  
		  }
		*/
	  } else {
		response.json('Not Ready'); 
	  }

	})


 });

router.get('/harvestSourceList', (request, response) => {
    // retrie list of harvest sources
    var sqlStr = 'Select set_id, set_name, source_url from collections where status = \'active\' and set_type = \'harvest\'';

    client.query(sqlStr, (err, res) => {
    	if ( typeof(res) !== "undefined" ) {	 
	  	response.json(res);  
	  	
	  } else {
		response.json('Error'); 
	  }

	})

 });

router.post('/transact', (req, res) => {
     var pbody = re.body;
  // var xml = fs.readFileSync(Path+'/transaction-insert.xml', 'utf8');
     var xml = iXml; //fs.readFileSync(Path+'/transaction-insert.xml', 'utf8');
     xml = xml.replace("##EMBED##", pbody)
     var bl = xml.length;
     console.log('xml ' + xml);
   
     var hurl = 'http://10.208.11.160:8000/?service=CSW&version=2.0.2&request=Transaction&TransactionSchemas=';
     hurl = hurl + 'http://www.isotc211.org/2005/gmi';
     var options = {url: hurl, 
         method: "POST",
         body : xml,
         headers: {
           'sendImmediately': true,
           contentType: "text/xml",
           contentLength: bl
         }
     };

    var pyResponse = function(err, httpResponse, body) {
        if (err) {
            stuff = {"result": "Save error : " + err};
            console.error('upload failed:', err);
        } else {
            stuff = {"result": "Upload response: " + body};
            console.log('Upload response ' + httpResponse + ' body:', body);
            res.send(stuff);
        }
    }

   request.post(options, rtnRes);
   //res.send('Testing transactions'); 
   

});



module.exports = router;

//module.exports = { Router: router, create_record: create_record } ;
 