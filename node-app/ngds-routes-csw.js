/*
  data.geothermaldata 
  pyCSW interface
  May 14, 2020

  modified for production system using data.geothermaldata.org
  Sep 15, 2020

*/

var express = require('express');
var router = express.Router();

var csw = require('csw-client');
const xml2js = require('xml2js');
var xml = require('xml');
var options = {};
var  fs = require("fs");

var  Path = process.env.NODE_PATH;
const pg = require('pg'),
	xmldoc = require('xmldoc');

const connectionString = 'xxxxx'; 
const pyUrl = 'xxxxx';
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

function routelog(req,lp, ore) {
	var ip = req.headers['x-forwarded-for'] || 
	req.connection.remoteAddress || 
	req.socket.remoteAddress ||
	(req.connection.socket ? req.connection.socket.remoteAddress : null);

	if (ip.substr(0, 7) == "::ffff:") {
	   ip = ip.substr(7)
	}
	var qs = '';
	if ( req.query ) {
		qs = '?';
		for (var key in req.query) {
			qs = qs + '&' + key + '=' + req.query[key];
		  }
	}
	
	var rm = req.method;
	if ( !ore || ore == 'err') {
		console.error(ip + ' ' + rd() + ' ' + rm  + ' ' + lp + qs);
	} else {
		console.log(ip + ' ' + rd() + ' ' + rm  + ' ' + lp + qs);
	}	
}

function rd() {
	var d = new Date();
	d = '['+d.getFullYear() + "-" + ('0' + (d.getMonth() + 1)).slice(-2) 
		+ "-" + ('0' + d.getDate()).slice(-2) + " " + ('0' + d.getHours()).slice(-2) 
		+ ":" + ('0' + d.getMinutes()).slice(-2) + ":" + ('0' 
		+ d.getSeconds()).slice(-2).slice(-2)+'.'+d.getMilliseconds()+']';
	return d;
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

            return new Promise(function(resolve, reject){
            	if (typeof(oiw) !== "undefined") {
            		var jBody =  XMLtoJ( oiw.toString({compressed:true}) );
            		var mBody = JSON.stringify(jBody);
					mBody = mBody.replace(/'/g, "\''");
					gTitle = gTitle.replace(/'/g, "\''");
				
            		// makemd - upserts as necessary 
            		var sqlStr = 'select * from makemdrecord(\''+rGuid+'\','+setid+',\''+rGuid+'\',\''+ gTitle + '\',6,\'' + mBody + '\'::json)';
            		//console.log('makemd function call '+ sqlStr); 
					client.query(sqlStr, (err, res) => {						 	
						if ( typeof(res) !== "undefined" ) {		  
                  			pyPost(oiw);                  
							r.json(res);                                                                     					  	
						} else {
						  	//console.log('write q errored '+JSON.stringify(err));
						  	r.json(err);							
						  	}
						});   
            	} else {
            	    reject("error")
            	}
          	
     		});

     	});
}

// pyPost - sends xml to pyCSW api for insert during harvest - r is the request object

var pyPost = async function(xml,r) {
	 
	var xa = xml.attr;

	if ( !xa["xmlns:xsi"]) {
		xa["xmlns:xsi"] = "http://www.w3.org/2001/XMLSchema-instance";
	}

	if ( !xa["xmlns:gmd"]) {
		xa["xmlns:gmd"] ="http://www.isotc211.org/2005/gmd" ;
	}

	if ( !xa["xmlns:gco"]) {
		xa["xmlns:gco"] ="http://www.isotc211.org/2005/gco";
	}

	if ( !xa["xmlns:xlink"]) {
		xa["xmlns:xlink"] ="http://www.w3.org/1999/xlink";
	}

	if ( !xa["xmlns:gml"]) {
		xa["xmlns:gml"] ="http://www.opengis.net/gml";
	}

     var xTemplate = fs.readFileSync(Path+'/transact-insert-template.xml', 'utf8');
     var xmlBody = xTemplate.replace('##EMBED##',xml);
     
     //console.log('pypost '); //+ xmlBody);
     pyRequest = require('request');
     var hurl = pyUrl+'?service=CSW&version=2.0.2&request=Transaction&TransactionSchemas=';
     hurl = hurl + 'http://www.isotc211.org/2005/gmi';
    
     var bl = xmlBody.length;
    
      var options = {url: hurl, 
         method: "POST",
         body : xmlBody,
         headers: {
           'sendImmediately': true,
           contentType: "text/xml",
           contentLength: bl
         }
       };
     //console.log(' pypost ' + hurl);
     var pyResponse = function(err, httpResponse, body) {
        if (err) {
			stuff = {"result": "Save error : " + err};
			routelog(request,lp+' '+err, 'err');
            //console.error('upload failed:', err);
            if ( r ) { r.send(stuff) };
        } else {
            stuff = {"result": "Upload response: " + body};
            //console.log('Upload response ' + httpResponse + ' body:', body);
            if ( r ) {
              r.set('Content-Type', 'text/xml');
              r.send(body);
            }
        }
      }

     pyRequest.post(options, pyResponse);

}

	async function create_record(mGuid, mCid, mTitle, mBody) {

        mBody = mBody.replace(/'/g, "\''");
		var sqlStr = 'select * from makemdrecord(\''+mGuid+'\',1,\''+mCid+'\',\''+mTitle+'\',6,\'' + mBody + '\'::json)';
		//console.log('create record  '+mGuid)
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
            var xd = new xmldoc.XmlDocument(body);
            var oiw;
            xd.eachChild(function(d){
            	if ( oiw ) {
            		return;
            	}
            	oiw = d;
            })
            var babyXd = xd.firstChild;
            //console.log(' body ' + oiw.toString({compressed:true}) ); // + new xmldoc.XmlDocument(body).toString({trimmed:true}));
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
	//console.log( JSON.stringify(options));

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
// This routes to the pyCsw services and passes any parameters without modification
router.get('/', (request, response) => { 

	var lp = '/';
	routelog(request, lp);

  //console.log(JSON.stringify(request.query));
  var params = request.query;
  
  var pStr = '';
  for (var k in params) {
    pStr = pStr + '&' + k + '=' + params[k];
  }
  
  var purl = 'http://10.208.3.120:8000/?' + pStr
  //console.log(purl);
  
   var pyRequest = require('request');
   var pyResponse = function(err, httpResponse, body) {
     if (err) {
	   stuff = {"result" : "pyCSW error - " + err};
	   routelog(request,lp+' pyCSW '+err, 'err');
	   response.send(stuff);
		
     } else {
        stuff = {"result": "Upload response: " + body};
        //console.log('Upload response ' + httpResponse + ' body:', body);
        response.set('Content-Type', 'text/xml');
        response.send(body);
      }
    }
              
  //var purl = 'http://10.208.11.160:8000/?service=CSW&version=2.0.2&request=Transaction&TransactionSchemas=';
  // purl = purl + 'http://www.isotc211.org/2005/gmi';
  pyRequest(purl, pyResponse);
  //response.send('pycsw' + purl);
});


// test post with auto function
router.post('/', (request, response) => { 
	var lp = '/';
	routelog(request, lp);
  	var xmlBody = request.body;
  	pyPost(xmlBody,response);
});

// This support transctions - to change pyCsw metadata 
// The incoming XML must conform to the csw-t temtplate

router.post('/pypost-old', (request, response) => { 
  
  var xmlBody = request.body;
  //console.log('>>> CSW request object ' + JSON.stringify(request));
  //var xml = fs.readFileSync(Path+'/transaction-insert.xml', 'utf8');
   var hurl = 'http://10.208.3.120:8000/?service=CSW&version=2.0.2&request=Transaction&TransactionSchemas=';
   hurl = hurl + 'http://www.isotc211.org/2005/gmi';
  
  var bl = xmlBody.length;
  
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
            response.send(stuff);
        } else {
            stuff = {"result": "Upload response: " + body};
            //console.log('Upload response ' + httpResponse + ' body:', body);
            response.set('Content-Type', 'text/xml');
            response.send(body);
        }
    }

   request.post(options, pyResponse);
 
});


// currrenty this bypasses creating new job with newcollectionActivity

router.get('/harvestRecord', (request, response) => { 
	var lp = '/harvestRecord';
	routelog(request, lp);
    //console.log('nca '+JSON.stringify(request.query) );
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
    var lp = '/getRecordById';
	routelog(request, lp);
  	var rGuid = request.query.guid;
	var hAction = request.query.action;
	var hFormat = request.query.outputFormat;
	var burl =  request.query.hurl;
    var oft = 'application/xml';

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
			
            var xd = new xmldoc.XmlDocument(body);
            var oiw;
            xd.eachChild(function(d){
            	if ( oiw ) {
            		return;
            	}
            	oiw = d;
            	
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
            	response.send(oiw.toString({compressed:true}));		    
            }
     });


});


router.get('/getRecords', async function(req, res) {
	var lp = '/getRecords';
	routelog(request, lp);
  var cid = req.query.collid;
  var pAction = req.query.action;
  var cSql = 'select * from collections where set_id = ' + cid;
  var hRec = await dbquery(cSql);

  var hurl = hRec.rows[0].source_url;
   
  cswGetRecords(hurl);
  res.send('prewired');

});

router.get('/record_search', async function(req, res) {
	var lp = '/record_search';
	routelog(request, lp);
	var qry = req.query.qry;
	if ( typeof(req.query.start) !== "undefined")  { var offset = req.query.start; } else { var offset = 0;  } 
	if ( typeof(req.query.page) !== "undefined") {  var lim = req.query.page; } else { var lim = 25; } 

 
    if ( qry.length ) {
    	var rcd = await find_records(qry,offset, lim);
    	
    	
    	res.send(rcd);	
    } else {
		routelog(request,lp+' Missing query', 'err');
    	res.send('Missing  query');	
    }  	
});

router.get('/record_show', async function(req, res) {
	var lp = '/record_show';
	routelog(request, lp);
	var rid = req.query.id;
	
 
    if ( rid.length ) {
    	var rcd = await record_show(rid);
    	res.send(rcd);	
    } else {
		routelog(request,lp+' ID', 'err');
    	res.send('Enter a record id');	
    }  	
});

router.get('/getCategories', async function(req, res) {
	var lp = '/getCategories';
	routelog(request, lp);
	var lid = req.query.lid;
	
    var cats = await categories(lid);
    if ( cats ) {
    	
    	res.send(cats);	
    } else {
		routelog(request,lp+' Missing categories', 'err');
    	res.send('Not Categories');	
    }  	
});


// generic debuggin tool
router.get('/getData', (request, response) => {
	var lp = '/getData';
	routelog(request, lp);
	var tbn = request.query.tbn;
	var qfld = request.query.qfld;
	var qv = request.query.qv;
	var sqlStr = 'Select * from ' + tbn + ' where ' + qfld + ' = ' + qv;
	console.log ( sqlStr );
	client.query(sqlStr, (err, res) => {
	  if ( typeof(res) !== "undefined" ) {
		 
		 
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
	  } else {
		response.json('Not Ready'); 
	  }
	  //client.end()
	})
});

// Start a HJ - setup tables and initiate server
router.get('/harvestJob', (request, response) => {
	var lp = '/harvestJob';
	routelog(request, lp);

	var setid = request.query.setid;
	var action = 'standard harvest';
	var directive = 'now';

	var sqlStr = 'Select * from new_collection_activity(' + setid + ',\'' + action + '\',\'' + directive + '\',null)';

	
	client.query(sqlStr, (err, res) => {
		 if ( typeof(res) !== "undefined" ) {
		 	response.json(res); 
		 } else {
			routelog(request,lp+' '+err, 'err');
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

	}

	fw();


});

router.get('/harvestSourceInfo', (request, response) => {
   var lp = '/harvestSourceInfo';
	routelog(request, lp);
    var hsid = request.query.hsid;
  
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


    client.query(sqlStr, (err, res) => {

	  if ( typeof(res) !== "undefined" ) {
	  	response.json(res);  	  
	  } else {
		routelog(request,lp+' Not ready', 'err');
		response.json('Not Ready'); 
	  }

	})


 });

router.get('/harvestSourceList', (request, response) => {
	// retrieve list of harvest sources
	var lp = '/harvestSourceList';
	routelog(request, lp);
    var sqlStr = 'Select set_id, set_name, source_url from collections where status = \'active\' and set_type = \'harvest\'';

    client.query(sqlStr, (err, res) => {
    	if ( typeof(res) !== "undefined" ) {	 
	  	response.json(res);  
	  	
	  } else {
		routelog(request,lp+' Error', 'err');
		response.json('Error'); 
	  }

	})

 });

module.exports = router;
 