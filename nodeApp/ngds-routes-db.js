/* ngds-routes-db.js
   /action - consistent with ckan routing
   
*/

var express = require('express');
var router = express.Router();
var  Path = process.env.NODE_PATH;
const pg = require('pg');
const connectionString = 'postgres://localhost:5432/geothermal';

const client = new pg.Client(connectionString);

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

var grbi = new autoFunction('getRecordById');
grbi.exec = function(o) {
  return this.name + ' getRecordById instance ' + o;
}

const results = [];
client.connect();

var noodlxe = new Promise(function(resolve,reject) {
	return setTimeout(function() {
		resolve("noodles back");
	}, 3000);
	reject("error noodle")
});


function noodle() {
	var sqlStr = 'Select * from mdview where version_id=101';
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


function find_records(qry,rOff, rLim,sortby,guids) {
	// primary text search 

	if ( isNaN(rOff) ) { rOff = 0 }

	if ( guids ) {
		var gA = guids.split(',');
		for (i in gA) {
			gA[i] = '\'' + gA[i] + '\'';
		}
		guids = gA.join(',')
	}

    var sort = 'date_modified desc';
	if ( sortby ) {
		switch(sortby) {
			case '0': sort = 'date_modified desc'; break;
			case '1': sort = 'title desc'; break;
			case '2': sort = 'title asc'; break;
			case '3': sort = 'date_modified desc'; break;
			default: sort = 'date_modified desc'; break;
		}
	}

  if ( qry !== '%' ) {
             
	  var qA = qry.split(' ');
	  var qs = '\'{';
	  for (var i in qA) {
		  var strm = '"%' + qA[i] + '%"';
		//if ( i == 0) { qs = qs + strm + ','}
		  if ( i < qA.length - 1) {
			  qs = qs + strm + ',';
		  } else {
			  qs = qs + strm;
		  }     	
	  }
	  qs = qs + '}\'::text[]';
	

	if ( guids ) {
		sqlStr = 'with cv as ( select identifier as guid, title, organization,'
		+ 'abstract, date_modified, wkt_geometry, links from public.records where identifier in (' + guids + ') ),'
		+ ' rc as ( select count(*) as foundrec from cv ) '
		+ 'select guid, foundrec, title as citation_title, date_modified as create_date, '
		+ 'abstract,organization, wkt_geometry, links from cv, rc order by ' + sort + ' limit ' + rLim + ' offset ' + rOff;

	} else {
		sqlStr = 'with cv as ( select identifier as guid, title, organization,'
		+ 'abstract, date_modified, wkt_geometry, links from public.records where anytext iLike ALL (' + qs + ') ),'
		+ ' rc as ( select count(*) as foundrec from cv ) '
		+ 'select guid, foundrec, title as citation_title, date_modified as create_date, '
		+ 'abstract,organization, wkt_geometry, links from cv, rc order by ' + sort + ' limit ' + rLim + ' offset ' + rOff;
	}
	

  } else {
	// no query terms just bring back the latest

	if ( guids ) {
		sqlStr = 'with cv as ( select identifier as guid, title, organization,'
		+ 'abstract, date_modified, wkt_geometry, links from public.records where identifier in (' + guids + ') ),'
		+ ' rc as ( select count(*) as foundrec from cv ) '
		+ 'select guid, foundrec, title as citation_title, date_modified as create_date, '
		+ 'abstract,organization, wkt_geometry, links from cv, rc order by ' + sort + ' limit ' + rLim + ' offset ' + rOff;

	} else {  
		sqlStr = 'with cv as ( select identifier as guid, title, organization,'
			  + 'abstract, date_modified, wkt_geometry, links from public.records ),'
			  + ' rc as ( select count(*) as foundrec from cv ) '
			  + 'select guid, foundrec, title as citation_title, date_modified as create_date, '
			  + 'abstract,organization, wkt_geometry, links from cv, rc order by ' + sort + ' limit ' + rLim + ' offset ' + rOff;
	}

  }   
  console.log('finder ' + sqlStr);
	return new Promise(function(resolve, reject){
		client.query(sqlStr, (err, res) => {
			  if ( typeof(res) !== "undefined" ) {
         
			  	resolve(res);

			  } else {
				reject("error noodle");	  	
			  }
		});
		     
	});

}

function record_show(qry) {
	
    var sqlStr = 'with cv as ( select v.mdv_id, v.source_schema_id  as sid ' 
             + ' from md_record r, md_version v where v.md_id = r.md_id and '
             + ' r.guid = \'' + qry +'\'  and v.end_date is null), '
             + ' mp as ( select node_id, node_name, node_value, substr(mp, 2, length(mp) - 2) as map_path '
             + ' from ( select node_id, node_name, node_value, mpath::text as mp from mdview2 '
             + ' where version_id = (select mdv_id from cv) ) m ), ' 
             + ' smap as ( select * from schema_map where schema_id = (select sid from cv) ),'
             + ' som as ( select o.fed_elem, o.relmapath from schema_map m, schema_object_map o where '
             + ' m.map_id = o.map_id and m.schema_id = (select sid from cv) )'
			 + ' select fed_elem as node_name, node_value, q.map_path from mp q, smap s '
			 + ' where q.map_path = s.map_path '
             + ' union '
			 + ' select fed_elem as node_name, node_value, q.map_path from mp q, som s ' 
			 + ' where q.map_path like s.relmapath'
         
	console.log('record show guid ' + qry);
	return new Promise(function(resolve, reject){
		client.query(sqlStr, (err, res) => {
			  if ( typeof(res) !== "undefined" ) {
			  	//console.log('record show success');//JSON.stringify(res));
			  	resolve(JSON.stringify(res));
			  } else {
				reject("error noodle");	  	
			  }
		});
		     
	});

}


function categories(climit, qry) {
    // categories is the keywords facet 
    if (typeof(climit) == "undefined" ) {
    	climit = "5";
    }

  var sqlStr = '';

  if ( qry ) { 
	var qA = qry.split(' ');
	var qs = '\'{';
	for (var i in qA) {
		var strm = '"%' + qA[i] + '%"';
	 
		if ( i < qA.length - 1) {
			qs = qs + strm + ',';
		} else {
			qs = qs + strm;
		}     	
	}
	qs = qs + '}\'::text[]';
	
	sqlStr = 'select distinct(kw) as node_value, count(kw) as count from ( select unnest(string_to_array(keywords,\',\')) as kw from public.records '
			+ ' where anytext iLike ALL (' + qs + ') ) pr group by kw order by 2 desc limit ' + climit;
  } else {
	sqlStr = 'select distinct(kw) as node_value, count(kw) as count from ( select unnest(string_to_array(keywords,\',\')) as kw from public.records '
		+ ' ) pr group by kw order by 2 desc limit ' + climit;
  }
	console.log('categories count ' + sqlStr);
	return new Promise(function(resolve, reject){
		client.query(sqlStr, (err, res) => {
			  if ( typeof(res) !== "undefined" ) {
			  	resolve(JSON.stringify(res));
			  } else {
				reject("error in categories");	  	
			  }
		});	     
	});

}

function authors(climit,qry ) {

	var sqlStr =  'select * from author_facet';	
	
	if ( qry ) { 
		var qA = qry.split(' ');
		var qs = '\'{';
		for (var i in qA) {
			var strm = '"%' + qA[i] + '%"';
			if ( i < qA.length - 1) {
				qs = qs + strm + ',';
			} else {
				qs = qs + strm;
			}     	
		}
		qs = qs + '}\'::text[]';
		var sqlStr = 'with zeph as ( select identifier from public.records '
					 + ' where anytext iLike ALL (' + qs + ') ) '
					 + ' select distinct(author) as node_value ,count(author) as count from author_register, zeph '
					 + ' where author_register.guid = zeph.identifier'
					 + ' group by author order by 2 desc limit ' + climit;
			
	} else {
		var sqlStr =  'select distinct(author) as node_value,count(author) as count from author_register '
		+ ' group by author order by 2 desc limit ' + climit;
	}

	
	console.log('authors ' + sqlStr);
	return new Promise(function(resolve, reject){
		client.query(sqlStr, (err, res) => {
			  if ( typeof(res) !== "undefined" ) {
			  	resolve(JSON.stringify(res));
			  } else {
				reject("error in categories");	  	
			  }
		});	     
	});
}

function contentModels(climit, qry, srt ) {

	var sqlStr =  'select * from cm_facet limit ' + climit;
    if ( qry ) { 
		var qA = qry.split(' ');
		var qs = '\'{';
		for (var i in qA) {
			var strm = '"%' + qA[i] + '%"';
			if ( i < qA.length - 1) {
				qs = qs + strm + ',';
			} else {
				qs = qs + strm;
			}     	
		}
		qs = qs + '}\'::text[]';
		var sqlStr = 'with zeph as ( select identifier from public.records '
					 + ' where anytext iLike ALL (' + qs + ') ) '
					 + ' select distinct(cm) as node_value ,count(cm) as count from cm_register, zeph '
					 + ' where cm_register.guid = zeph.identifier'
					 + ' group by cm order by 2 desc limit ' + climit;
		
		var sqlStr = 'with zeph as ( select identifier from public.records '
					 + ' where anytext iLike ALL (' + qs + ') ),'
					 + 'cm_a as (select lower(cm) as cmm from cm_register),'
					 + 'cx as (select distinct(cmm) as cm, position(\':\' in cmm) as pm, length(cmm) as lm,'
					 + 'count(cmm) as countx from cm_a group by cmm order by cmm)'
					 + 'select substring(cm, pm+1,lm-pm-1) as cm, countx from cx order by ' + srt + ' limit ' + climit;				 
			
	} else {
		var sqlStr =  'select distinct(cm) as node_value,count(cm) as count from cm_register '
		+ ' group by cm order by 2 desc limit ' + climit;

		var sqlStr = 'with cm_a as (select lower(cm) as cmm from cm_register),'
					 + 'cx as (select distinct(cmm) as cm, position(\':\' in cmm) as pm, length(cmm) as lm,'
					 + 'count(cmm) as countx from cm_a group by cmm order by cmm)'
					 + 'select substring(cm, pm+1,lm-pm-1) as cm, countx from cx order by ' + srt + ' limit ' + climit;

	}

	console.log('content model facet ' + sqlStr);
	return new Promise(function(resolve, reject){
		client.query(sqlStr, (err, res) => {
			  if ( typeof(res) !== "undefined" ) {
			  	resolve(JSON.stringify(res));
			  } else {
				reject("ERROR in content model query");	  	
			  }
		});	     
	});
}

function dataTypeFacets(climit, qry) {

	if ( !climit ) { climit = 10; }

	if ( qry ) { 
		var qA = qry.split(' ');
		var qs = '\'{';
		for (var i in qA) {
			var strm = '"%' + qA[i] + '%"';
			if ( i < qA.length - 1) {
				qs = qs + strm + ',';
			} else {
				qs = qs + strm;
			}     	
		}
		qs = qs + '}\'::text[]';
		var sqlStr = 'with zeph as ( select identifier from public.records '
					 + ' where anytext iLike ALL (' + qs + ') ) '
					 + ' select distinct(ext) as node_value ,count(ext) as count from dt_register, zeph '
					 + ' where dt_register.guid = zeph.identifier'
					 + ' group by ext order by 2 desc limit ' + climit;
			
	} else {
		var sqlStr =  'select distinct(ext) as node_value,count(ext) as count from dt_register '
		+ ' group by ext order by 2 desc limit ' + climit;
	}
		
	console.log('data types facet ' + sqlStr);
	return new Promise(function(resolve, reject){
		client.query(sqlStr, (err, res) => {
			  if ( typeof(res) !== "undefined" ) {
			  	resolve(JSON.stringify(res));
			  } else {
				reject("error in data type facet query ");	  	
			  }
		});	     
	});
}

function fetchTypeAhead(lim,qry) {

  var tSql = 'select distinct(rex) from ( select identifier, lower(unnest(string_to_array(keywords,\',\'))) as rex '
           + ' from public.records ) z where rex iLike (\'' + qry + '%\') order by rex asc limit + ' + lim;
  
  tSql = 'select zex as rex from keyword_ta where zex like \'' + qry + '%\' limit ' + lim;
  return new Promise(function(resolve, reject){
		client.query(tSql, (err, res) => {
			  if ( typeof(res) !== "undefined" ) {
			  	resolve(JSON.stringify(res));
			  } else {
				  reject("error in typeahead query ");	  	
			  }
		});	     
	});

}


function fetchMapServers() {

	var sqlStr = 'select distinct(dmm), count(dmm) from '
				 + '(select split_part(lurl,\'/\',3) as dmm from resource_links '
				 + '		where lurl ilike \'%getcapabilities%\' '
				 + '		or lurl ilike \'%wfs%\' or lurl ilike \'%wms%\' '
				 + '		or lurl ilike \'%mapserver%\') z '
				 + ' group by dmm order by dmm';
    console.log('map s ' + sqlStr);
	return new Promise(function(resolve, reject){
		client.query(sqlStr, (err, res) => {
				if ( typeof(res) !== "undefined" ) {
					resolve(JSON.stringify(res));
				} else {
				console.log(' ms err ' + err);
				reject("error in map server query ");	  	
				}
		});	     
	});

}
/* *********** Start Routes *****************************************/

router.get('/', async function(req, res) {
  var testme = await noodle();	
  console.log('returned '+testme)
  res.send(testme);
});

router.get('/record_search', async function(req, res) {
	var qry = req.query.qry;
	var sortby = req.query.sortby;
	var guids = req.query.guids;

	if ( typeof(req.query.start) !== "undefined")  { var offset = req.query.start; } else { var offset = 0;  } 
	if ( typeof(req.query.page) !== "undefined") {  var lim = req.query.page; } else { var lim = 25; } 
	console.log(' >>> record search '+qry)
 
    if ( qry.length ) {
    	var rcd = await find_records(qry ,offset, lim,sortby,guids);
    	console.log(' search >> '+qry+' '+rcd.rows.length);
   	
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
	var qry = req.query.q;
	console.log(' >>> categoruesrecord show '+lid)
    var cats = await categories(lid,qry)
    if ( cats ) {
    	
    	res.send(cats);	
    } else {
    	res.send('Not Categories');	
    }  	
});

router.get('/getAuthors', async function(req, res) {
	var qry = req.query.q;
	var lid = req.query.lid;
	if ( !lid ) { lid = 5 }
    var auths = await authors(lid,qry);
    if ( auths ) {
    	res.send(auths);	
    } else {
    	res.send('No Authors');	
    }  	
});

router.get('/getToken', async function(req, res) {
	var quark = req.query.q;
	var lib = req.query.p;

    var cms = {"akx9": "12557ffe663294a5c4432b2"};
    if ( cms ) {
    	res.send(cms);	
    } else {
    	res.send('Not authorized');	
    }  
});

router.get('/getContentModels', async function(req, res) {
	var qry = req.query.q;
	var lid = req.query.lid;
	var so = req.query.sortby;
	console.log(' sort by ' + so );
	if ( !so ) { so = 1 }
    var cms = await contentModels(lid,qry, so);
    if ( cms ) {
    	res.send(cms);	
    } else {
    	res.send('No Content Models');	
    }  	
});

router.get('/getDataTypes', async function(req, res) {
	var qry = req.query.q;
	var lid = req.query.lid;
    var cms = await dataTypeFacets(lid,qry);
    if ( cms ) {
    	res.send(cms);	
    } else {
    	res.send('No Data Types');	
    }  	
});

router.get('/typeAhead', async function(req, res) {
	var qry = req.query.q;
    var ta = await fetchTypeAhead(10,qry);
    if ( ta ) {
    	res.send(ta);	
    } else {
    	res.send('No TypeAhead data');	
    }  	
});

router.get('/getMapServers', async function(req, res) {
	
    var fms = await fetchMapServers();
    if ( fms ) {
    	res.send(fms);	
    } else {
    	res.send('No Map Server data');	
    }  	
});



// generic debugging tool
router.get('/getData', (request, response) => {
	
	var tbn = request.query.tbn;
	var qfld = request.query.qfld;
	var qv = request.query.qv;
	var sqlStr = 'Select * from ' + tbn + ' where ' + qfld + ' = ' + qv;
	console.log ( sqlStr );
	client.query(sqlStr, (err, res) => {
	  if ( typeof(res) !== "unedfined" ) {
		 

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
	  	
	  } else {
		response.json('Not Ready'); 
	  }

	})


 });

router.get('/harvestSourceList', (request, response) => {
    // retrieve list of harvest sources
	var sqlStr = 'Select set_id, set_name, source_url from collections '
	            + ' where status = \'active\' and set_type = \'harvest\'';

    client.query(sqlStr, (err, res) => {
    	if ( typeof(res) !== "undefined" ) {	
	  		response.json(res);  
	  	} else {
			response.json('Error'); 
	  	}
	})

 });


router.get('/newCollectionActivity', (request, response) => {
    var params = request.query;
	  console.log(JSON.stringify(request.query));
	
	var set_id = request.query.set_id;
	var actdef = request.query.activity;
	var directive = request.query.directive;
	var guids ='';
	if ( request.query.guids ) {
		guids = request.query.guids;		
	}

	//var sqlStr = 'select * from activity_definition where activity_name = \''+actdev+\'';
	var sqlStr = 'select * from new_collection_activity('+set_id+','+actdef+','+directive+ ',string_to_array('+guids+',\',\'))';

	client.query(sqlStr, (err, res) => {
	    if ( typeof(res) !== "undefined" ) {
	    	//var p = res.activity_params;
	    	//var ad = res.ad_id;

	    	console.log(res);
	    	if (directive == 'now') {
	    		//var state = res.
	    		//var pd = await process_dispatch(lid);

	    	}

	 
		  		response.json(res);  
		  	
		  } else {
			response.json('Error'); 
		  }

	})

	response.json(request.query);


});


function process_dispatch(caid) {

	var sqlStr = 'select * from collection_activity a, '
				+ ' cap_jobque q,  '
				+ 'process_definition p '
				+ 'where a.ca_id = q.ca_id and a.ca_id = ' + caid + ' and q.pd_id = p.pd_id';
        		
	console.log('proces dispatch ' + sqlStr);
	return new Promise(function(resolve, reject){
		client.query(sqlStr, (err, res) => {
			  if ( typeof(res) !== "undefined" ) {
			  	var prox = res.rows;
			  	for ( var k in prox) {
				  var nx = prox[k];
				}
			  	resolve(JSON.stringify(res));
			  } else {
				reject("error in categories");	  	
			  }
		});	     
	});

}

module.exports = router;

 