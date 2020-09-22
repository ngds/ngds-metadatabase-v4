/* NGDS Front End  App V1.2
   G. Hudman
   
   sept 15 2020 
   
*/  

require('dotenv').config();
var  Path = process.env.NODE_PATH;
const port = 443;
var  fs = require("fs");

var https = require("https");
const cert = fs.readFileSync('../ssl/__geothermaldata_org_cert.cer');
const ca = fs.readFileSync('../ssl/__geothermaldata_org.cer');
const key = fs.readFileSync('../ssl/myserver.key');

var credentials = { key: key,
                    cert: cert };
 
// Load pycsw xml transaction template
 var iXml = fs.readFileSync(Path+'/transact-insert-template.xml', 'utf8');
 
const pg = require('pg');

const connectionString =  ''; 

const xml2js = require('xml2js');

var csw = require('csw-client');
var options = { "outputSchema" :"http://www.isotc211.org/2005/gmd" };

//options.schema = 'iso';
//options.compat
options.typeName = 'gmd:MD_Metadata';
options.outputSchema = 'http://www.isotc211.org/2005/gmd';
options.outputFormat = 'application/xml';
options.maxRecords = 10;
options.startPosition = 21;
options.elementSetName = 'full';
var cswClient = csw('http://catalog.usgin.org/geothermal/csw', options);


var express = require('express'),
    app = express(),
	fs = require("fs"),
	xmldoc = require('xmldoc'),
    request = require('request'),

    urlExists = require('url-exists-async-await'),
    bodyParser = require('body-parser');

var mdapi = require("./ngds-routes-db.js");
var schemapi = require("./ngds-schema-api.js");
var cswapi = require("./ngds-routes-csw.js");
var mapapi =  require("./ngds-routes-map.js");

var j2h = require('node-json2html');
                    
var httpsServer = https.createServer(credentials, app);

app.use(function(req, res, next){
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    next();
});
 
app.use( bodyParser.json({limit: '50mb'}) ); 

app.use('/img', express.static(__dirname + '/public/img'));
app.use('/js', express.static(__dirname + '/public/js'));
app.use('/css', express.static(__dirname + '/public/css'));
app.use('/jsonSchemas', express.static(__dirname + '/public/jsonSchemas'));
app.use('/action',mdapi);
app.use('/csw',cswapi);
app.use('/spatial',mapapi);
const client = new pg.Client(connectionString);

const results = [];
client.connect();


function XMLtoJ(data) {
	var aj = {};
	 var parser = new xml2js.Parser({explicitArray: false, ignoreAttrs: false, mergeAttrs: false });
	 
	 parser.parseString(data, function (err, result) {
        aj = result;
       
    });
	 return aj;
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
	var nw = rd();

	if ( typeof(ore) !== 'undefined' ) {
		console.error(ip + ' ' + nw + ' ' + rm  + ' ' + lp + ' ' + qs + ' : ' + ore);
	} else {
		console.log(ip + ' ' + nw + ' ' + rm  + ' ' + lp + qs);
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

app.get('/' , function(req,res) {
	console.log('path '+Path);
	
	 var lp = '/public/ngds-ssl.htm';
	 routelog(req, lp);
	 res.header('Access-Control-Allow-Origin', '*');
	 res.header('Access-Control-Allow-Headers', '*');
	 res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
     res.sendFile(Path+lp);
} );

app.get('/maptest' , function(req,res) {
	var lp = '/public/maptest.htm';
	routelog(req, lp);
	res.sendFile(Path+lp);
} );

app.get('/admin' , function(req,res) {
	 
	var lp = '/public/ngds-admin.htm';
	routelog(req, lp);
	res.sendFile(Path+lp);

} );


app.get('/schema' , function(req,res) {
	 
    var lp = '/public/schema-builder.htm';
	routelog(req, lp);
	res.sendFile(Path+lp);

} );

// generic sql request
app.get('/getData', (request, response) => {
	
	var lp = '/getData';
	routelog(request, lp);

	var tbn = request.query.tbn;
	var qfld = request.query.qfld;
	var qv = request.query.qv;
	var fmt = request.query.fmt;
	var sqlStr = 'Select * from ' + tbn + ' where ' + qfld + ' = ' + qv;

	client.query(sqlStr, (err, res) => {
	  if ( typeof(res) !== "undefined" ) {
		 
		  if ( res.hasOwnProperty('rows') ) {
			var rta = res.rows;
			  var stack = "Data Request: ";
			  if ( fmt == 'kw' ) {
				for ( var k in rta) {
				  var nx = rta[k];
				  Object.keys(nx).forEach(function(key) {
					  stack = stack + 'Key : ' + key + ', Value : ' + nx[key];
				  })
				  //stack = stack + ' ' + nx;
			  	}
			  	response.json("Data :" + stack); 

			  } else {
			  		stack = {};
			  		stack.dataset = tbn;
			  		stack.data = rta;
					response.json(stack); 			  	
			  }
 
		  } else {
			 response.json('No Data Found');  
		  }
	  } else {
		response.json('Not Ready'); 
	  }

	})
});
	
app.get('/get_json', (request, response) => {

	var qid = request.query.qid;

	var lp = '/get_json';
	routelog(request, lp);

	var sqlStr = 'Select * from mdn_jsonout('+ qid +')';
	console.log ( sqlStr );
	client.query(sqlStr, (err, res) => {
	  if ( typeof(res) !== "unedfined" ) {

		  if ( res.hasOwnProperty('rows') ) {
			var rta = res.rows;
			  var stack = "<html><body>DATA RESPONSE<pre>";
			  for ( var k in rta) {
				  var nx = rta[k];
				  
				  Object.keys(nx).forEach(function(key) {
					  var jd = JSON.parse(nx[key]);
					  stack = stack + JSON.stringify(jd);
				  })
			  }
			  stack = stack + '</pre></body></html>';
			  response.json(stack);  
		  } else {
			 
			 lp = lp + ' No Data Found';
			 routelog(request,lp, 'err');
			 response.json(lp);  
		  }
	  } else {
		lp = lp + ' Not Ready';
		routelog(request,lp, 'err');
		response.json(lp); 
	  }
	})
});

app.get('/getXML', (request, response) => {
	
	var qid = request.query.qid;
	var lp = '/getXML';
	routelog(request, lp);
	var sqlStr = 'Select * from mdn_jsonout('+ qid +')';
	console.log ( sqlStr );
	client.query(sqlStr, (err, res) => {
	  if ( typeof(res) !== "undefined" ) {
		  if ( res.hasOwnProperty('rows') ) {
			var rta = res.rows;
			  var stack = "<html><body>DATA RESPONSE<pre>";
			  for ( var k in rta) {
				  var nx = rta[k];
				  
				  Object.keys(nx).forEach(function(key) {
					  var jd = JSON.parse(nx[key]);
					  stack = stack + JSON.stringify(jd);
				  }) 
			  }
			  stack = stack + '</pre></body></html>';
			  response.json(stack);  
		  } else {
			lp = lp + ' No Data Found';
			routelog(request,lp, 'err');
			 response.json(lp);  
		  }
	  } else {
		lp = lp + ' Not Ready';
		routelog(request,lp, 'err');
		response.json(lp); 
	  }
	
	})
});

app.get('/previewMap',(req, res) => {
	var offset = req.query.offset;
	var tn = req.query.typeName;
	var mf = req.query.maxFeature;
	var opf = req.query.outputFormat;
	var rq = req.query.request;
	var bb = req.query.bbox;
	var srs = req.query.srs;

	var lp = '/previewMap';
	routelog(request, lp);

	var hurl = 'http://geothermal.smu.edu:9000/geoserver/gtda/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=gtda:wells&maxFeatures=50&outputFormat=application%2Fjson';
	
	hurl = 'http://search.geothermaldata.org/geoserver-srv/WaterQuality-REWJ/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=WaterQuality-REWJ:WaterQuality&maxFeatures=50&outputFormat=application/json';
	
	hurl = 'http://search.geothermaldata.org/geoserver-srv/WaterQuality-REWJ/ows?service=WFS&version=1.0.0&request=GetFeature';
	hurl= hurl + tn+mf+srs+bb+opf;

	var r = require('request');
    var body = '';
     
     r.get(hurl)
       .on ('response',function(response) {           		
      	})
        .on ('data', function(chunk) {
          body += chunk;
        })
        .on ('end', function() {
            res.send(body); 			    
     });
	
});

app.get('/preview', (request, response) => {
	var lp = '/preview';
	routelog(request, lp);

    var offset = request.query.offset;
	var hurl = request.query.hurl;
	var hid = request.query.hid;

	var sl = false;
	if ( hurl.substring(0,5) == 'https' ) {
		sl = true;
	}
	var o = {};
	o.request='GetRecords';
	o.service='CSW';
	o.version='2.0.2';
	o.elementSetName = 'summary';
	o.typeNames='csw:Record';
	o.resultType='results';
	o.sortby='apiso:Modified';
	o.startPosition = offset;
	o.outputFormat='application/xml';
	o.maxRecords=25;
	o.outputSchema = 'http://www.isotc211.org/2005/gmd';

	var mxr = o.maxRecords;
	
    var rc = 0;
	var rsp = { "results" : [] };
	//console.log('PREVIEW URL B4 ' + hurl );

	async function url_params(hid,o) {
		sqlStr = "select * from collections where set_id = " + hid;
		client.query(sqlStr, (err, res) => {
			if ( typeof(res) !== "undefined" ) { 
				if ( res.hasOwnProperty('rows') ) {
				  	var rowrec = res.rows;
					var params = rowrec[0].url_params;
					if ( params ) {
						for (var k in params) {
							o[k] = params[k];
							// usgs wont start on zero 
							if ( k == 'startPosition') {
								o[k] = o[k] + params[k];
							}
						}
					
						sslPreview(hurl,o)	
					} else {
						
						sslPreview(hurl,o)	
					}

				}						
			} else {
				//console.log('no params for '+hid);
				sslPreview(hurl,o)				
			}			
		})
	}

    async function fw() {
 
	   var rp = await cswPC.records(o);
	  
	   var ret = rp.returned;
	   var mat = rp.matched;
	   
   
       var guids = [];
       for (var k in rp.records) {
		   
		   var mx = rp.records[k];
		  
           var mTitle = mx.title;
           var mGuid = mx.originalId;
           guids.push(mGuid);

           var mCid = mx.id;
           var mDate = mx.modified;
           var mBody = JSON.stringify(mx.body);
           var rbg = JSON.stringify(mx);
           rsp.results.push(rbg);

          if ( (mxr - 1) == rc ) {
          	    if ( guids.length ) {
          	    	// Check if the guids have been loaded locally
          	    	var sqlStr = 'select r.md_id, v.mdv_id, r.guid, v.version_id, v.create_date '
          	    				+ ' from md_record r, md_version v '
          	    				+ ' where r.md_id = v.md_id and v.end_date is null and guid in (\''+ guids.join("\',\'") + '\')';
          	    	
          	    	client.query(sqlStr, (err, res) => {
            	    	if ( typeof(res) !== "undefined" ) {
							if ( res.hasOwnProperty('rows') ) {
								var rta = res.rows;
								rsp.lv = rta;
								response.json(rsp);
	  							return;
							}
						}
					});
          	    } else {
					routelog(request, lp+' No records found', 'err');
          	    	response.json(rsp);
	  				return;
          	    	
          	    }      	   
	  			
	  	   }
	  	  rc++;               	 
       }

	}

	async function sslPreview(hurl,o) {

		var burl = hurl+'?';
		var s = '';

		for ( k in o) {
			if ( k == 'sortby') {
				burl = burl+s+k+':'+o[k];
			} else {
				burl = burl+s+k+'='+o[k];
			}
			
			s='&';
		}
	
		var r = require('request');
		var body = '';
		
		var timFix = false;

		r.get(burl)
		.on ('response',function(res) {  
				//console.log('preview responded');       		
			})
			.on ('data', function(chunk) {
				
				body += chunk;
			})
			.on ('error', function(e){
				
				response.json('{ "data" : "error"}');
			})
			.on ('end', function() {
				
				var mxr = o.maxRecords;
    			var rc = 0;
				var xlj = XMLtoJ(body);

				if ( xlj["ows:ExceptionReport"] ) {
					console.log('exception!!!');
					response.json(data);
				
				} else {

					if ( ! xlj['csw:GetRecordsResponse'] ) {
						response.json(data);
					}
				
					if  ( xlj['csw:GetRecordsResponse']["csw:SearchResults"].hasOwnProperty["$"] ) {
						var ret = xlj['csw:GetRecordsResponse']["csw:SearchResults"]["$"]["numberOfRecordsReturned"];
						var mat = xlj['csw:GetRecordsResponse']["csw:SearchResults"]["$"]["numberOfRecordsMatched"];
					} else {
						ret = xlj['csw:GetRecordsResponse']["csw:SearchResults"]["numberOfRecordsReturned"];
						mat = xlj['csw:GetRecordsResponse']["csw:SearchResults"]["numberOfRecordsMatched"];
					}
					var rb=xlj['csw:GetRecordsResponse']["csw:SearchResults"]["gmd:MD_Metadata"];
					var data = {};
					data.results = [];

					var guids = [];
					for (var k in rb) {
						var mx = rb[k];
						var mTitle = mx["gmd:identificationInfo"]["gmd:MD_DataIdentification"]["gmd:citation"]["gmd:CI_Citation"]["gmd:title"]["gco:CharacterString"];
						var mGuid =  mx["gmd:fileIdentifier"]["gco:CharacterString"];
						var mDate =  mx["gmd:dateStamp"]["gco:DateTime"];
						var mAbs =  mx["gmd:identificationInfo"]["gmd:MD_DataIdentification"]["gmd:abstract"]["gco:CharacterString"];
						var mO = {"title": mTitle, "fileIdentifier": mGuid, "modified" : mDate, "identificationInfo": {} };
						mO.identificationInfo.abstract = mAbs;
						data.results.push(mO);

						guids.push(mGuid);
						if ( (mxr - 1) == rc ) {
							if ( guids.length ) {
								// Check if the guids have been loaded locally
								var sqlStr = 'select r.md_id, v.mdv_id, r.guid, v.version_id, v.create_date '
											+ ' from md_record r, md_version v '
											+ ' where r.md_id = v.md_id and v.end_date is null and guid in (\''+ guids.join("\',\'") + '\')';
								
								client.query(sqlStr, (err, res) => {
								if ( typeof(res) !== "undefined" ) {
									if ( res.hasOwnProperty('rows') ) {
										var rta = res.rows;
										//console.log(' db has returned ' + JSON.stringify(rta));
										data.lv = rta;
										response.json(data);
										return;
									}
								}
							});
							} else {
								//console.log('NO GUIDS found ');
								routelog(request, lp+' No records found', 'err');
								response.json(data);
								return;
								
							}  
						}
						rc++;
					}
            
			}			    
		});
	}

	if (hid) {
		url_params(hid,o);
	} else {
		sslPreview(hurl,o);	
	}


});

app.get('/harvestCompat', (request, response) => {
	var lp = '/harvestCompat';
	routelog(request, lp);
    var offset = request.query.offset;
    var hurl = request.query.hurl;

    options.startPosition = offset;
    var mxr = options.maxRecords;
    var rc = 0;
    var rsp = { "results" : [] };
   

    async function gc() {

    	options.compatOptions = ['progressive-element-set-name','no-encode-qs','define-namespace'];
    	options.resultType='results';
    	options.typeNames='gmd:MD_Metadata';
    	options.maxRecords= 10;
    	options.elementSetName='brief';
    	options.constraintlanguage='Filter';
    	options.outputFormat='text/xml';
    	options.outputSchema='http://www.isotc211.org/2005/gmd';
    	options.Constraint='q=%Texas%';

    	var cswC = csw('http://catalog.usgin.org/geothermal/csw', options);
    	var qry = {'sortby':'apiso:Modified', 'q':'usgin'};
    	var rp = await cswC.records(options);
    	var recP = rp.records;
    	for (var k in recP) {
    		var mx = recP[k];
           var mTitle = mx.title;
           var mGuid = mx.originalId;
           var mCid = mx.id;
           var mDate = mx.modified;
           var mBody = JSON.stringify(mx.body);
           var mfid = mBody.fileIdentifier;

    	}

    	response.json(rp);
    }

    gc();

});

app.get('/getActDef', (request, response) => {



});

app.get('/collectionClear', (request, response) => {

	var lp = '/collectionClear';
	routelog(request, lp);

	var setid = request.query.setid;
    var cAction = 'clear-harvest';
    var directive = 'now';

    var sqlStr = 'Select * from new_collection_activity(' + setid + ',\'' + cAction + '\',\'' + directive + '\',null)';


  	client.query(sqlStr, (err, res) => {
  		if ( typeof(res) !== "undefined" ) {		 
		 
		  response.send(res); 
	  } else {
		
		routelog(request, lp+' '+err, 'err');
	  	response.send({"Not Ready" : + err});  
	  }

  	});


});

// Active api
app.get('/harvest', (request, response) => {
   	var lp = '/harvest';
	routelog(request, lp);

    var offset = request.query.offset;
    var hurl = request.query.hurl;
    var htype = request.query.htype;

    options.startPosition = offset;
    var mxr = options.maxRecords;
    var rc = 0;
    var rsp = { "results" : [] };

    cswClient = csw(hurl, options);

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
         

           var rcd = await create_record(mGuid, mCid, mTitle, mBody).catch(err=>console.log('create record err '+err));
 
           var rbg = JSON.stringify(mx);
         
           rsp.results.push(rbg);

           if ( (mxr - 1) == rc ) {
	  			response.json(rsp);
	  			return;
	  		}
	  		rc++;
          	 
       }

       

	}

	async function create_record(mGuid, mCid, mTitle, mBody) {

		var sqlStr = 'select * from makemdrecord(\''+mGuid+'\',1,\''+mCid+'\',\''+mTitle+'\',6,\'' + mBody + '\'::json)';
		console.log('create record  '+mGuid)
		return new Promise(function(resolve, reject){

			client.query(sqlStr, (err, res) => {
				 
				  if ( typeof(res) !== "undefined" ) {
				  	resolve(res);				  
				  } else {
					routelog(request, lp+' '+err, 'err');
					reject("create_record error ");	  	
				  }
			});
			     
		});
	}

	fw();


});


app.get('/cswRBId', (request, response) => { 
	// obsolete - retrieves a single record for inspection
	var lp = '/cswRBId';
	routelog(request, lp);
	var rGuid = request.query.guid;
	var hAction = request.query.action;
	var hFormat = request.query.outputFormat;

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

            response.header('Content-Type', 'text/xml');
            response.type('text/xml');
            response.send(oiw.toString({compressed:true}));		    
     });

});

app.get('/cswTemp', (req, res) => { 

	var lp = '/cswTemp';
	routelog(req, lp);
	// retrieves a single test record for inspection

	var hurl = 'http://catalog.usgin.org/geothermal/csw?service=CSW&version=2.0.2&&typeNames=gmd:&request=GetRecordById&id=98ddf901b9782a25982e01af3b0bda50&elementsetname=full&outputschema=http://www.isotc211.org/2005/gmd';

    var r = require('request');
 
     var body = '';
     
     console.log('Remote IP ' + req.connection.remoteAddress);
     
     r.get(hurl)
       .on ('response',function(response) {           		
      	})
        .on ('data', function(chunk) {
          body += chunk;
        })
        .on ('end', function() {
    		
             var xlj = XMLtoJ(body);
            res.send(xlj); 
    		    
     });


});


app.get('/get_schema' , function(req,res) {

	var lp = '/get_schema';
	routelog(req, lp);

	var sid = req.query.schema_id;

	async function getSchema(qStr) {
		return new Promise(function(resolve, reject){
			client.query(qStr, (err, res) => {
				
				if ( typeof(res) !== "undefined" ) {
				  	var rowrec = res.rows;
				  	resolve(JSON.stringify(rowrec));
				} else {
					reject("schema query error ");	  	
				}
			});
			     
		});
	}

    async function sender(sqlStr) {
    	var scO = {};

	    if ( typeof(sid) !== "undefined" ) {
			// t - temp fix for debugging -gh aug15 since schema 6 has not top root
			var t = 'select 0 as node_id,6 as schema_id,4 as version_id,-1 as parent_id,\'root\' as node_name,'
				+ '\'\' as node_val,\'object\' as node_datatype,\'s\' as node_def_type,0 as lvl,\'MD_Metadata\' as mpath';

			 var sqlStr = t + ' union select * from schemanodesrview where schema_id = '+sid;

	    	 var sdefStr = 'select * from schemanodedefview where schema_id = '+sid;
	    	 var smStr = 'select * from schema_map where schema_id = '+sid;
	    } else {
	    	// get them all
	   		 var sqlStr = 'select * from schemas where status = \'active\''; 	
	    }
      
   		var rq = await getSchema(sqlStr);
   		scO.schema = rq;

    	// Get the map
        
    	if ( typeof(smStr) !== "undefined" ) {
    		var defq = await getSchema(sdefStr);
    		scO.def = defq;

        	var mapq = await getSchema(smStr);
        	scO.map = mapq;


    	}
       
    	res.send(scO); 	
    }

    sender();

    
} );

  
app.post('/create_schema', function(request,response) {
	var lp = '/create_schema';
	routelog(request, lp);
	const inspect = obj => {
	  var cob = {};
	  for (const prop in obj) {
	    if (obj.hasOwnProperty(prop)) {
	     
	      var pr = prop;
	      var pval = obj[prop];
	      cob[prop] = pval;
	     
	    }
	  }
	  return cob;
	}


    var pbody = request.body;
    var cc = inspect(pbody);
    var sname = JSON.stringify(pbody);
   
    var resp= { 'result': 'test' };

    var schemaName = cc.schema_name;
  	var sVersion = cc.version;
  	var sSource = cc.source;
  	var sFedId = cc.FedId;
  	var schemabody = cc.mdbody;
  	console.dir(schemabody);
    var txts = JSON.stringify(schemabody);

    var sqlStr = 'Select * from  makeSchemaDef(\'' + schemaName + '\',\'json\',' +  sVersion + ',\'' + sSource + '\',0,\'' + txts + '\'::json)';
    console.log(sqlStr);

  	client.query(sqlStr, (err, res) => {
  		if ( typeof(res) !== "unedfined" ) {
		  response.send({"Data" : + res});  

	  	} else {
			routelog(request, lp+' '+err, 'err');
	  	
	  		response.send({"Not Ready" : + err});  
	  	}

  	});
});

app.post('/createHarvestSource', function(request,response) {
	var lp = '/createHarvestSource';
	routelog(request, lp);
	const inspect = obj => {
	  var cob = {};
	  for (const prop in obj) {
	    if (obj.hasOwnProperty(prop)) {
	     
	      var pr = prop;
	      var pval = obj[prop];
	      cob[prop] = pval;
	    
	    }
	  }
	  return cob;
	}


    var pbody = request.body;
    var cc = inspect(pbody);

    var hName = cc.set_name;
    var hsUrl = cc.source_url
  	var sid = cc.schema_id;
  	var pid = cc.activity_definition_id;
  	var sDesc = cc.set_description;
  	
    var sqlStr = 'insert into collections (set_name, set_type, status, '
    			+ 'create_date, end_date, user_id, activity_definition_id, source_url,'
    			+ ' set_description, schema_id )'
    			+ 'values (\''+hName+'\',\'harvest\',\'active\','
    			+ 'current_timestamp,null,1,1,\''+hsUrl+'\',\''+sDesc+'\','+sid+')';



  	client.query(sqlStr, (err, res) => {
  		if ( typeof(res) !== "unedfined" ) {	 
		
		  response.send({"Data" : "success" });  
	
	  } else {
		
		routelog(request, lp+' '+err, 'err');
	  	response.send({"Not Ready" : + err});  
	
	  }

  	});
   
});

app.get('/url_status', function(req, res) {
	var lp = '/url_status';
	routelog(req, lp);
  	var exists = true;
	res.send(exists);
	
	var urlToCheck = req.query.url;
	console.log(' URL - ' + urlToCheck);
	res.send(exists);
	
});	


httpsServer.listen(port,'10.208.3.120')
