/* Server side async processing for task automation
   including harvest jobs
   G. Hudman
   5/23/19
*/

var pg = require('pg'),
    connectionString = '',
   
    pgClient;

require('dotenv').config();
const port = 3001;
const Path = process.env.NODE_PATH;
console.log('Start .. '+ Path + ' ' + port + ' ' + connectionString);
const xmldoc = require('xmldoc');
const xml2js = require('xml2js');
var express = require('express'),
    app = express(),
	fs = require("fs"),
	util = require('util'),
    request = require('request'),
    urlExists = require('url-exists'),
    bodyParser = require('body-parser'),
    jobQueue = [];  // collection activity stack
    curActProcs = []; // ca process stack
    jCnt = 0;
    jobCon = {};
    jqTemplate = { "ca_id" : 0, 
    				"set_id" : 0, 
    				"ca_type" : "", 
    				"status" :"new", 
    				"action_date" : new Date };

var csw = require("./ngds-routes-csw.js");
app.use('/csw',csw);

pgClient = new pg.Client( connectionString );
pgClient.connect();

initialize();
//getActivities();

pgClient.query('LISTEN jobmsg');
pgClient.on('notification', async function (data) {
    console.log("jobmsg " + new Date + ' ' + data.payload);

    var pyld = data.payload.split("-");
    
    if ( pyld[0] == "newaction") {
    	var action = pyld[2];
    	var caid = pyld[3];
    	var hres = getActivities(caid);
    }
    
    //jobhistory.log.push(data.payload);
    //jobhistory.index++;

});


/* Initialization - retrieves pending jobs and procs from the database */

    function initialize() {
    	console.log('Initializing .. ');
    	getActivities();

    	//setTimeout(function() {
    	execStack();
    	//}, 5000);
    	//execStack();
    }
    // manages the job stack - dispatcher in oldspeak

    function execStack() {
        jCnt++;
    	
    	setTimeout(function() {
    		//console.log('exec Stack count -- ' + jCnt);
    		for ( var i in curActProcs ) {
    			// waiting on next proc
    			console.log('EXEC loop ' + i + curActProcs[i].process_call + ' ' + curActProcs[i].pjstatus);
				// if its running and wd is curent
				if ( curActProcs[i].pjstatus == 'running') {
					console.log('===>>> ' + JSON.stringify(curActProcs[i]) );
					var p = curActProcs[i].complete;
					if ( typeof(p) !== "undefined" && p !== null && p.length > 3 ) {
						var caTime = new Date(p);
						var runAge = new Date() - caTime;
						console.log('Timestamp - Current ' + p + ' age  ' + runAge.toString())
						// want to trap timeout
					
					} else {
						// starts out null so populate
						var z = new Date() ;
						curActProcs[i].complete = z.toISOString();
						console.log(' timestamp start ' + z.toISOString());
					}

                
					//console.log('Process running ' + curActProcs[i].process_call);
					break;
    			}

    			//if ( curActProcs[i].pjstatus == 'new' || curActProcs[i].pjstatus == 'running' ) {
				if ( curActProcs[i].pjstatus == 'new'  ) {
					var o = curActProcs[i];
					console.log('STARTING PROCESS -- ' + i + curActProcs[i].process_call + ' ' + curActProcs[i].pjstatus);
    				var af = autoFinder(curActProcs[i].process_call);
					if ( af !== null ) {
						//dbUpdateProcStatus(o,'running');
						//console.log('execStack - ' + JSON.stringify(o));
						var gf = eP(o, af);
					
						//dbUpdateProcStatus(o,'complete');
						
						break;
					}
    			}
			}
			
    		process.nextTick(execStack);
    	}, 5000);
    	
    }

    async function eP (o, af) {
    	o.pjstatus = 'running';
    	var n = dbUpdateProcStatus(o);
    	var gf = await af.exec(o);
    	o.pjstatus = 'complete';
    	n = dbUpdateProcStatus(o);
    	return gf;
    }

    async function dbUpdateProcStatus (o) {
       
    	var iSql = 'update cap_jobque set status = \'' + o.pjstatus + '\', completed = current_timestamp '
            		+ ' where pjq_id = ' + o.pjq_id;
        console.log(' dbupProcStatus  -- ' + iSql);
        return new Promise(function(resolve, reject){
            pgClient.query(iSql, (err, res) => { 
            	if ( typeof(res) !== "undefined" ) { 
            		resolve(res); } 
            	else {  reject('error') }
            	
            });
        });
	}

    // top level job tracking - returns the list of pending CA tasks
    // 
	function getActivities( caid ) {
		

		var cSql = 'select * from collection_activity where status <> \'complete\'';
		cSql = 'select c.ca_id,c.ca_type, c.action_date, c.end_date, c.set_id, a.agentid '
				+ 'from activity_definition a, collection_activity c '
				+ 'where a.ad_id = c.activity_id and a.agentid = 1 and c.status <> \'complete\'';
		if ( typeof(caid) !== "undefined" ) {
			cSql = cSql + ' and c.ca_id = ' + caid;
		}
		console.log(' Retrieving jobs ... ' + cSql );
		pgClient.query(cSql, (err, res) => {
			if ( typeof(res) !== "undefined" ) {
			  	var rowrec = res.rows;
			  	for ( var k in rowrec) {
			  		var jn = 'CA-Task ID: ' + rowrec[k].ca_id 
			  				+ ' Task type: ' + rowrec[k].ca_type
			  				+ ' Start: '  + rowrec[k].action_date 
			  				+ ' Status : ' + rowrec[k].status
			  				+ ' Col ID: ' + rowrec[k].set_id;
			  				
			  		console.log('Startup Active Tasks: ' + jn);
			  		jobQueue.push(rowrec[k]);
			  		var pq = rowrec[k].ca_id;
			  		var rk = getProcessQueue(pq);		
			  	}
			} else {
				console.log('getActivities Error ' + JSON.stringify(err)) ;
			}
		});
	}

    // retrieve the process tasks for an activity
	async function getProcessQueue(colActId, directive) {
		console.log('   Job ' + colActId + ' getProcessQ ');
		return new Promise(function(resolve, reject){
			var qStr = 'select * from process_jobque where ca_id = ' + colActId;
			// clear out the process stack for this activity
			if ( curActProcs.length > 0 )  {
				for ( var a in curActProcs ) {
					if ( curActProcs[a].set_id == colActId ) {
						console.log('curActProces cleared ' + curActProcs[a].pjq_id )
						curActProcs.splice(a);
					}
				}
			}
			//curActProcs.length = 0;

			pgClient.query(qStr, (err, res) => {
				if ( typeof(res) !== "undefined" ) {
				  	var rowrec = res.rows;
					for ( var k in rowrec) {
						if ( rowrec[k].jobtype == 'node-API' ) {
							curActProcs.push(rowrec[k]);
							var jn =  'Process : ' + rowrec[k].pjq_id
			  					+ ':' + rowrec[k].process_call
			  					+ ' Type: ' + rowrec[k].jobtype
			  					+ ' Order : '  + rowrec[k].process_order 
			  					+ ' Status: '  + rowrec[k].pjstatus
			  					+ ' Col ID: ' + rowrec[k].set_id
                            if ( rowrec[k].pjstatus !== 'complete' ){
								console.log('>>   ' + jn);
							}
			  			}
				  	}

				  	resolve(JSON.stringify(rowrec));
				} else {
					reject("query error ");	  	
				}
			});
			     
		});
	}


  // deep clone
var dc = function(o) {
  	var a = JSON.stringify(o);
  	var c = JSON.parse(a);
  	return c;
  }

function XMLtoJ(data) {
	var aj = {};
	 var parser = new xml2js.Parser({explicitArray: false, ignoreAttrs: false, mergeAttrs: false });
	 parser.parseString(data, function (err, result) {
        aj = result;
        
    });
	 return aj;
}

function jToXML(data) {
	var builder = new xml2js.Builder({renderOpts: {pretty: false}});
	var xmlA = builder.buildObject(data);
    return xmlA;
}

let afMap = new Map();
class autoFunction {
  constructor(n) {
    this.name =  n;
    this.status = 'idle';
    afMap.set(n,this);
    
  }
  exec(o) { return this.name;}
}

// quick automation function lookup

var autoFinder = function(n){

  for (let [key, value] of afMap.entries()) {
  	console.log('finder '+ key + ' ' + value)
    if ( key == n) {
      return value;
    }
  }
  return null;
}
// automation library
// cswGetRecords - is the gather step
var cg = new autoFunction('cswGetRecords');
cg.exec = async function(o) {

	return new Promise(function(resolve, reject){
		var rlog = '/log/gather_'+Date.now()+'.log';
		var glog = fs.createWriteStream(__dirname + rlog, {flags : 'w'});
        if ( jobCon.hasOwnProperty('pjqId') ){
        	if ( jobCon.pjqId !== o.pjq_id ) {
        		jobCon = {};
		        jobCon.elmset = "summary";	
		        jobCon.start = 0;
				jobCon.mx = 50;
				jobCon.pCount=0;
				jobCon.total=jobCon.mx + 1;
				jobCon.colactId = o.ca_id;
				jobCon.pjqId = o.pjq_id;
				jobCon.source_url = o.source_url;
				jobCon.url_params = o.url_params;
				jobCon.status = 'init';
        	}
        } else {
        	jobCon.elmset = "summary";	
	        jobCon.start = 0;
			jobCon.mx = 50;
			jobCon.source_url = o.source_url;
			jobCon.url_params = o.url_params;
			jobCon.pCount=0;
			jobCon.total=jobCon.mx + 1;
			jobCon.colactId = o.ca_id;
			jobCon.pjqId = o.pjq_id;
			jobCon.status = 'init';
        }
      
		async function gatherRecords(jc, o) {
           
			var b= jc.source_url,
			s= "?service=CSW&version=2.0.2",
			r = "&request=getrecords",
			o = "&outputschema=http://www.isotc211.org/2005/gmd",
			t = "&typeNames=csw:Record",
			y = "&resulttype=results",
			e = "&elementsetname="+jc.elmset,
        	p = "&startposition="+jc.start,
        	m = "&maxrecords="+jc.mx;

			console.log('>>>>>  before '+p);
			var params ='';
			if ( jc.url_params ) {		
				for ( k in jc.url_params) {
					if ( k == 'startPosition') {
						// this is to handle the usgs bug - needs to start a 1 higher
                     
						var iP = parseInt(jc.start)+parseInt(jc.url_params[k]);
						p = "&startposition="+iP;
					} else {
						params = params+'&'+k+'='+jc.url_params[k];
					}
				}
			}

			console.log('>>>>>>>>>> after  '+p);
        	var gUrl = b+s+r+o+t+y+e+p+m+params;
			var hr = require('request');
			var body = '';
			glog.write(util.format(gUrl) + '\n');
      		console.log(' gather csw call ' + gUrl);
			hr.get(gUrl)
	       		.on ('response',function(response) {           		
	      	})
	        .on ('data', function(chunk) {
	          body += chunk;
	        }).on ('end', function() {
	        	
				var jBody =  XMLtoJ( body );   	
				//for (var k in jBody ) {
				//	console.log('property list '+k)
				//}
				var sStats = {};
				if ( jBody["csw:GetRecordsResponse"]) {
					//console.log(' is Record Response ');
					if ( jBody["csw:GetRecordsResponse"]["csw:SearchResults"] ) {
						//console.log(' searchResults ');
						if  ( jBody['csw:GetRecordsResponse']["csw:SearchResults"]["$"] ) {
							sStats = jBody["csw:GetRecordsResponse"]["csw:SearchResults"]["$"];
						//	console.log('as attribute ');
						} else {
							sStats = jBody["csw:GetRecordsResponse"]["csw:SearchResults"];
						//	console.log(' in body');
						}

						//for (var k in sStats ) {
						//	console.log('stats list '+k);
						//}

					}
				}

	
	           // var sStats = jBody["csw:GetRecordsResponse"]["csw:SearchResults"]["$"];
				var nextR = sStats["nextRecord"];
				var nRtn = sStats["numberOfRecordsReturned"];
				var nbrRec = sStats["numberOfRecordsMatched"];
				console.log('>>>>> retrieved next ' + nextR + ' ' + nRtn + ' ' + nbrRec );

				var sResults = jBody["csw:GetRecordsResponse"]["csw:SearchResults"]["gmd:MD_Metadata"];
				
              	jc.total = nbrRec;
				jc.start = nextR;

				if ( nextR == "0" || nRtn == "0" || nextR == 0 || nRtn == 0 ) {
					jc.status = 'complete';
				}  
                if ( sResults ) { 
	              	for (var p = 0; p < sResults.length; p++) {
	            	  var k = sResults[p];
	            	// These paths may be schema dependent - may want parameterize ....
	            	  var fid = k["gmd:fileIdentifier"]["gco:CharacterString"];
	            	  var dstamp= k["gmd:dateStamp"]["gco:DateTime"];
	            	  var tl = k["gmd:identificationInfo"]["gmd:MD_DataIdentification"]["gmd:citation"]["gmd:CI_Citation"]["gmd:title"]["gco:CharacterString"];
	            	  var rtn = dbGatherRecordInsert(jc,fid,dstamp);
              		}
					if ( nextR == 0 ) {
						jc.status = 'complete';
					}
				} else {
                	jc.status = 'complete';
            	}
				return(jc);
				
	        });
	    }
	    
	    async function dbGatherRecordInsert (jc,fid,dstamp) {

	    	var iSql = 'insert into cap_records (ca_id, pjq_id, status,guid, modified) values ('
	            			+ jc.colactId + ',' + jc.pjqId + ',\'new\',\''+fid+'\',\''
	            			+ dstamp+'\'::timestamp)';
        // dont resinsert same record in same job
	    	var iSql = 'insert into cap_records (ca_id, pjq_id, status,guid, modified) '
                    + ' select  ' + jc.colactId + ',' + jc.pjqId + ',\'new\',\''+fid+'\',\'' + dstamp+'\'::timestamp '
                    + ' WHERE NOT EXISTS (  select pjq_id from cap_records where ca_id = ' +  jc.colactId
                    + ' and pjq_id = ' + jc.pjqId + ' and guid =\'' + fid + '\'  )';
	            		//	+ jc.colactId + ',' + jc.pjqId + ',\'new\',\''+fid+'\',\''
	            	//		+ dstamp+'\'::timestamp)';

	        return new Promise(function(resolve, reject){
	            pgClient.query(iSql, (err, res) => { 
	            	if ( typeof(res) !== "undefined" ) { 
	            		//jc.status = 'ok';
	            		jc.pCount++; 
	            		resolve(res); 
					 } else {  
						jc.status = err; 
						reject('error');
					}
	            	
	            });
	        });
	    } 
	 
      function gRepeater(jobCon) {
			  function timedRepeat() {
			    setTimeout(function () {
			    	gatherRecords(jobCon);
					if ( jobCon.status == 'complete' )
					{
						glog.write('job complete ' + util.format() + '\n');
						console.log('job proc complete ' + jobCon.pjqId); 
						o.pjstatus = 'complete';
						var n = dbUpdateProcStatus(o);
					} else {
							if ( Number(jobCon.start) < (jobCon.total) ) {
								timedRepeat();
							} else { 
						jobCon.status = 'complete';
						}
					}       
				}, 2000);
			}
			if (jobCon.start == 0 ) {
				timedRepeat();
			}			
        }
 		gRepeater(jobCon);
	});
}

var cg = new autoFunction('cswFetchRecords');
cg.exec = async function(o) {
	console.log(' fetch exec >> ' + JSON.stringify(o)); 
	return new Promise(function(resolve, reject){
		var rlog = '/log/fetch_'+Date.now()+'.log';
		var flog = fs.createWriteStream(__dirname + rlog, {flags : 'w'});
        console.log('cs fetch promise - ' + JSON.stringify(o));
		if ( jobCon.hasOwnProperty('pjqId') ){
        	if ( jobCon.pjqId !== o.pjq_id ) {
       			jobCon = {};
				jobCon.pCount=0;
				jobCon.mx =10;
				jobCon.start = 0;
				jobCon.total=jobCon.mx + 1;
				jobCon.colactId = o.ca_id;
				jobCon.pjqId = o.pjq_id;
				jobCon.source_url = o.source_url;
				jobCon.url_params = o.url_params;
				jobCon.status = 'init';
			}
		} else {
			    jobCon = {};
				jobCon.pCount=0;
				jobCon.mx =10;
				jobCon.start = 0;
				jobCon.total=jobCon.mx + 1;
				jobCon.colactId = o.ca_id;
				jobCon.pjqId = o.pjq_id;
				jobCon.status = 'init';

		}

		async function dbGetQRecords (jc,o) {

				var iSql = 'select * from cap_records where ca_id = ' + jc.colactId
								+ ' and status = \'new\' limit 100 offset ' + jc.start; 
				jc.start = jc.start+100;
				//console.log('db GetQ o  ' + JSON.stringify(o));
				console.log('db Get records sql ' + iSql);

				return new Promise(function(resolve, reject){
					pgClient.query(iSql, (err, res) => { 
						if ( typeof(res) !== "undefined" ) { 
							if ( res.hasOwnProperty('rows') ) {
								// if it has zero rows
								var rta = res.rows;
								console.log('db Getrecords to be processed ' + rta.length);
								jc.total = rta.length;
								if ( rta.length == 0 ) {	
									jc.status = 'complete';
									//capQueStatus(jc.pjqId,'complete');

								} else {
									//console.log('>>> rx')
									var stack = "Data Request: ";
									for ( var k in rta) {
										var nx = rta[k];
										//console.log('>>> fr')
										fetchRecord(o, nx, jc);
										
									}

									//o.pjstatus = 'complete';
									//capQueStatus(jc.pjqId,'complete');
								}	
								resolve(res); 
							} else { 
								//o.pjstatus = 'complete';
								jc.status = 'complete';
								//capQueStatus(jc.pjqId,'complete');
								resolve(res); 
							}
						}  	
					});
				});
		}

		async function fetchRecord(o, r, jc) {
				//console.log('fetch record o  ' + JSON.stringify(o));
			var g = r.guid;
			var b= o.source_url,
			s= "?service=CSW&version=2.0.2",
			rg = "&request=GetRecordById",
			i = "&id=" + g,
			ox = "&outputschema=http://www.isotc211.org/2005/gmd",
			e = "&elementsetname=full",
			m = "&outputFormat=application/xml";

			var gUrl = b+s+rg+i+ox+e+m;
			var hr = require('request');
			var body = '';
			console.log('>>fetch ' + gUrl);
			var n = new Date();
			flog.write(n.toISOString() + ' ' + util.format(gUrl) + '\n');
				
			hr.get(gUrl)
				.on ('response',function(response) {           		
			})
			.on ('data', function(chunk) {
			body += chunk;
			}).on ('end', function() {
				try {
					var xd = new xmldoc.XmlDocument(body);
					var oiw;
					xd.eachChild(function(d){
						if ( oiw ) {
							return;
						}
						oiw = d;           	
					});
					var jBody =  XMLtoJ( body );
					console.log('retrieved '+ r.guid);
					//var result = jBody["csw:GetRecordByIdResponse"]["gmd:MD_Metadata"];

					var result = jBody["csw:GetRecordByIdResponse"];
					var gTitle = result["gmd:MD_Metadata"]["gmd:identificationInfo"]["gmd:MD_DataIdentification"]["gmd:citation"]["gmd:CI_Citation"]["gmd:title"]["gco:CharacterString"];

					dbFetchRecordInsert(r.cpr_id, g, o.set_id,'citid',gTitle,o.schema_id, result,oiw);
					return('ok');
	
				} catch {
					console.log('Fetch Record data error for: ' + r.guid  + ' ' + jBody);
					return('error');
				}
							
			}).on('error', (e) => {
				console.log('fetch record request error ' + e);
			});
		}
			
		async function dbFetchRecordInsert (cr, mGuid,mSetId, mCid,mTitle,mSchema, mBody, xml) {
				var mb = JSON.stringify(mBody);
				mb = mb.replace(/'/g, "\''");
				mTitle = mTitle.replace(/'/g, "\''");
				var sqlStr = 'select * from makemdrecord(\''+mGuid+'\','+mSetId+',\'' + mCid
							+ '\',\'' +  mTitle + '\',' 
							+ mSchema + ',\'' + mb + '\'::json)';
				var bl = mb.length;

				console.log('DB INSERT >>> ' + mGuid + ' bodsize ' + mb.length );
				return new Promise(function(resolve, reject){

					pgClient.query(sqlStr, (err, res) => {
						
						if ( typeof(res) !== "undefined" ) {
							var rowrec = res.rows;
							var vid = 1;
							for ( var k in rowrec) {
								vid = rowrec[k]["makemdrecord"]["VersionID"];
								//console.log('dbFetchRecInsert RESPONSE b4 capUpdate '+ vid);
								dbCapUpdate( o.ca_id, mGuid, vid, 'fetchInsert')
								//console.log('dbFRI b4 pycsw-'+ vid);
								pyCswInsert(o.ca_id, vid, mGuid, xml );                        
							}					  
							resolve(res);
						} else {
							
							dbCapUpdate( o.ca_id, mGuid, null, 'error');
							reject("dbfetchrecordinsert error " + mGuid);  	
						}
					});
					
				})
				.catch(err => { 
					dbCapUpdate( o.ca_id, mGuid, null, 'error')	
					console.log('db fetchrecord insert error caught ' 
								+ mGuid + ' ' + bl +' ' + JSON.stringify(err) );
				});
		} 

		async function pyCswInsert (caid, vid, mGuid, xml) {
			
			var xTemplate = fs.readFileSync(Path+'/transact-insert-template.xml', 'utf8');
			var xmlBody = xTemplate.replace('##EMBED##',xml);
			return new Promise(function(resolve, reject){
			var hurl = 'http://10.208.11.160:8000/';
				hurl = hurl + '?service=CSW&version=2.0.2&request=Transaction&TransactionSchemas=';
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
			
			var pyRequest = require('request'); 
			var pyResponse = function(err, httpResponse, body) {
				var n = new Date();
				if (err) {
					//stuff = {"result": "Save error : " + err};
					console.error('pycsy failed:', err);				
					flog.write(n.toISOString() + ' pyInsert Error ' + mGuid + ','+ vid + '\n');
					dbCapUpdate( caid, mGuid, vid, 'pyCSW error')
					reject("pycsw error " + mGuid);  	
					//response.send(stuff);
				} else {
					flog.write(n.toISOString() + ' pyInsert ' + mGuid + ','+ vid + '\n');
					//stuff = {"result": "Upload response: " + body};
					dbCapUpdate( caid, mGuid, vid, 'finished');
					console.log('pycsw response for ' + mGuid + ' ' + vid );
					//console.log('pycsw response body:', body);
					resolve(httpResponse);
					//response.set('Content-Type', 'text/xml');
					//response.send(body);
				}
			}
			
			pyRequest.post(options, pyResponse);
			
			
			})
			.catch(err => { 
					dbCapUpdate( caid, mGuid, null, 'error')	
					flog.write('pyCswInsert Error ' + mGuid +  '\n');
					console.log('pyCswInsert error caught ' 
								+ mGuid + ' ' + bl +' ' + JSON.stringify(err) );
				});
		
		}
		//async function dbCapUpdate (capid, mvid, status) {
		async function dbCapUpdate (caid, guid, mvid, status) {
				console.log('cap update sql ' + mvid + ' ' + status);
				if ( isNaN(mvid) ) {
					status = 'error';
					var vid = null;
					var sqlStr = 'update cap_records set '
							+ ' status = \'' +  status + '\' where guid = \'' 
							+ guid + '\' and ca_id = '+ caid;

				} else {
					var vid = parseInt(mvid);	
					var sqlStr = 'update cap_records set mdv_id  = ' + vid 
							+ ', status = \'' +  status + '\' where guid = \'' 
							+ guid + '\' and ca_id = '+ caid;
	
				}
				
				return new Promise(function(resolve, reject){
					pgClient.query(sqlStr, (err, res) => {
						//console.log('update query return ');
						if ( typeof(res) !== "undefined" ) {
							//console.log('dbcapu ' + JSON.stringify(res));
							//var pic = res.rows;
							resolve(res);
							//resolve(JSON.stringify(res));
						} else {
							console.log('dbcapupdate err sql ' + sqlStr);
							reject("cap update error " + JSON.stringify(err));	  	
						}
					});
				})
				.catch(err => { 
					console.log('capupdate err catch ' + sqlStr 
								+ JSON.stringify(err) ); 
				});
					
		}

		function gRepeater(jobCon,o) {
			var watchDog = 0;

			//console.log(' gRepeater ' + JSON.stringify(o) + ' ' + JSON.stringify(jobCon)); 
				function timedRepeat(jobCon,o) {
					watchDog++;
					var tsNow = new Date();
					o.complete = tsNow.toISOString();
					
					// database watchdog sync
					if ( (watchDog % 100 ) == 0  ){
						console.log('db watchdog sync ' + watchDog + ' ' + JSON.stringify(o) );	
						dbUpdateProcStatus(o);
					}
					//console.log(' timedRepeat >> ' + JSON.stringify(o) + ' ' + JSON.stringify(jobCon)); 
					setTimeout(function () {
						//console.log(' set time out >> ' + JSON.stringify(o) + ' ' + JSON.stringify(jobCon)); 
						if ( jobCon.start == 0 ) { jobCon.start = 150; }
						dbGetQRecords (jobCon,o);	
						if ( jobCon.status == 'complete'  )
						{
							console.log('job proc complete ' + jobCon.pjqId); 
							o.pjstatus = 'complete';
						} else {
							if ( Number(jobCon.start) < 100000 ) {
									timedRepeat(jobCon,o);
							} else { 
								jobCon.status = 'complete';
							}
						}       
					}, 5000);
				}
			if (jobCon.start == 0) {
				timedRepeat(jobCon,o);
			}			
		}

        console.log(' gRepeater ' + JSON.stringify(o) + ' ' + JSON.stringify(jobCon)); 
		gRepeater(jobCon,o);
		
 		//dbGetQRecords (jobCon,o);
	});
}

    // this is a test function for the /runtask api

	async function runstack(action, id) {

		for ( var k in curActProcs) {
			var p = curActProcs[k];
			
			var pc = p.process_call;
			var runstatus = p.pjstatus;
			var jobtype = p.jobtype;

			// Starting proc
			if ( pc == null ) { console.log('Process call missing ' );}
			else {

				if ( jobtype = 'node-api' && runstatus == 'new' ) {
					if ( action == 'start' &&  id > 0 ) {

					} else if ( action == 'stop' && id > 0 ) {

					} else {
						var af = autoFinder(pc);
						if ( af !== null ) {
							var gf = await af.exec(p);
							console.log('Process results ' +JSON.stringify(gf));
						}
					}

				} else if ( jobtype = 'psql' && runstatus == 'new' ) {
					if ( action == 'start' &&  id > 0 ) {

					} else if ( action == 'stop' && id > 0 ) {

					} else {
						
					}

				}
			}

		}
	}
   
	async function getDbStatus(qStr) {
		return new Promise(function(resolve, reject){
			pgClient.query(qStr, (err, res) => {
				if ( typeof(res) !== "undefined" ) {
				  	var rowrec = res.rows;
				  	resolve(JSON.stringify(rowrec));
				} else {
					reject("query error ");	  	
				}
			});
			     
		});
	}

	async function sender(res) {
		res.send(jobhistory); 	
	}

var dbProcess = function (res) {
	sender(res);

}

app.get('/status', function(req, res){

	dbProcess(res);
	 		
});

app.get('/runtasks', function(req, res){
	var cmd = request.query.cmd;
	var pid = request.query.pid;

	// start stop - pjn 
	runstack(cmd);
	res.send(JSON.stringify(curActProcs));
	 		    
});
//command line Gather
app.get('/gather', function(req, res){
	gatherWrap(req, res);

});
// this should be consolidated 
var gatherWrap = function(req, res) {    
	console.log('start gr');
		var startAt = 0;
		var bt = "brief";
		var jobCon = {};
		jobCon.elmset = "summary";
		if ( typeof(req.query.start) !== "undefined" ) {
			jobCon.start=req.query.start;
		} else { jobCon.start = 0}

		if ( typeof(req.query.max) !== "undefined" ) {
			jobCon.mx=req.query.max;
		} else { jobCon.mx = 10}
		
		jobCon.pCount=0;
		jobCon.total=jobCon.mx + 1;
		jobCon.colactId = 7;
		jobCon.pjqId = 23;
		jobCon.status = 'init';

		async function gatherRecords(jc) {

			var b= "http://catalog.usgin.org/geothermal/csw",
			s= "?service=CSW&version=2.0.2",
			r = "&request=getrecords",
			o = "&outputschema=http://www.isotc211.org/2005/gmd",
			t = "&typeNames=csw:Record",
			y = "&resulttype=results",
			e = "&elementsetname="+jc.elmset,
        	p = "&startposition="+jc.start,
        	m = "&maxrecords="+jc.mx;

        	var gUrl = b+s+r+o+t+y+e+p+m;

			var hr = require('request');
		    var body = '';

			hr.get(gUrl)
	       		.on ('response',function(response) {           		
	      	})
	        .on ('data', function(chunk) {
	          body += chunk;
	        }).on ('end', function() {
	        	
	        	var jBody =  XMLtoJ( body );   	
	            var sStats = jBody["csw:GetRecordsResponse"]["csw:SearchResults"]["$"];
	            var nextR = sStats["nextRecord"];
	            var nbrRec = sStats["numberOfRecordsMatched"];
	            var sResults = jBody["csw:GetRecordsResponse"]["csw:SearchResults"]["gmd:MD_Metadata"];
                jc.total = nbrRec;
                jc.start = nextR;

	            for (var p = 0; p < sResults.length; p++) {
	            	var k = sResults[p];
	            	// These paths may be schema dependent - may want parameterize ....

	            	var fid = k["gmd:fileIdentifier"]["gco:CharacterString"];
	            	var dstamp= k["gmd:dateStamp"]["gco:DateTime"];
	            	var tl = k["gmd:identificationInfo"]["gmd:MD_DataIdentification"]["gmd:citation"]["gmd:CI_Citation"]["gmd:title"]["gco:CharacterString"];

	            	var rtn = dbFetchRecordInsert(jc,fid,dstamp);
				 
				}
				return(jc);
				
	        });
	    }

	    async function dbFetchRecordInsert (jc,fid,dstamp) {

	    	var iSql = 'insert into cap_records (ca_id, pjq_id, status,guid, modified) values ('
	            			+ jc.colactId + ',' + jc.pjqId + ',\'new\',\''+fid+'\',\''
	            			+ dstamp+'\'::timestamp)';

	        return new Promise(function(resolve, reject){
	            pgClient.query(iSql, (err, res) => { 
	            	if ( typeof(res) !== "undefined" ) { jc.status = 'ok'; resolve(res); } 
	            	else {  jc.status = err; reject('error') }
	            });
	        });
	    } 
	 
        function gRepeater(jobCon) {
      		
			function timedRepeat() {
			    setTimeout(function () {

			        if ( Number(jobCon.start) < (jobCon.total) ) {
			        	 timedRepeat();
			        }
			       
			    }, 1000);
			}

			if (jobCon.start == 0 ) {
					timedRepeat();
			}

        	res.header('Content-Type', 'application/json');
            res.type('application/json');
            res.send(jobCon);

        }

 	gRepeater(jobCon);
		    
}


app.get('/csw', function(req, res){

	dbProcess(res);
	 		
    
});


app.listen(port, () => {
  console.log('App running on port ${port}.')
});
