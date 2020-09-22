/* ngds-routes-db.js
   /action - consistent with ckan routing
   data.geothermaldata.org - 
   
*/

var express = require('express');
var router = express.Router();
var  Path = process.env.NODE_PATH;
const pg = require('pg');
var crypto = require('crypto');
var xml2js = require('xml2js');
var  fs = require("fs");
const util = require('util');
const pyUrl = 'http://data.geothermaldata.org:8000/';

const connectionString = 'xxxx';
const client = new pg.Client(connectionString);

const pyCon = 'postgres://ngdsdb:geonewton@localhost:5432/pycsw';
//const pyClient = new pg.Client(pyCon);

var gKeystack = [];
var gNACL = '5d097fe1065645c8';

var genRandomString = function(length){
    return crypto.randomBytes(Math.ceil(length/2))
            .toString('hex') /** convert to hexadecimal format */
            .slice(0,length);   /** return required number of characters */
};

var sha512 = function(password, salt){
    var hash = crypto.createHmac('sha512', salt); /** Hashing algorithm sha512 */
    hash.update(password);
    var value = hash.digest('hex');
    return {
        salt:salt,
        passwordHash:value
    };
};

function saltHashPassword(userpassword) {
    var salt = genRandomString(16); /** Gives us salt of length 16 */
    var salt = '5d097fe1065645c8';
    var passwordData = sha512(userpassword, salt);
    console.log('UserPassword = '+userpassword);
    console.log('Passwordhash = '+passwordData.passwordHash);
    console.log('nSalt = '+passwordData.salt);
    return passwordData;
}

function jToXML(data) {
	
	var builder = new xml2js.Builder({renderOpts: {pretty: false}});
	var xmlA = builder.buildObject(data);
    return xmlA;
}

function wrapUpdateJson(j) {
	var px = {};
	px['csw:Transaction'] = {};
	var sns = {
		"xmlns:csw": "http://www.opengis.net/cat/csw/2.0.2",
		"xmlns:ows": "http://www.opengis.net/ows",
		"xmlns:xsi" : "http://www.w3.org/2001/XMLSchema-instance",
		"xsi:schemaLocation": "http://www.opengis.net/cat/csw/2.0.2 http://schemas.opengis.net/csw/2.0.2/CSW-discovery.xsd",
		"service" : "CSW",
		"version" : "2.0.2"
	  }

	var ps = px['csw:Transaction'];
	ps['$'] = sns;
	ps ['csw:Update'] = { 'gmd:MD_Metadata' : j['gmd:MD_Metadata'] };
	ps ['csw:Update']['gmd:MD_Metadata']['$'] = {
		"xmlns:gmd" : "http://www.isotc211.org/2005/gmd",
		"xmlns:gco" : "http://www.isotc211.org/2005/gco",
		"xmlns:xsi" : "http://www.w3.org/2001/XMLSchema-instance",
		"xmlns:gml" : "http://www.opengis.net/gml",
		"xmlns:xlink" : "http://www.w3.org/1999/xlink",
		"xsi:schemaLocation" : "http://www.isotc211.org/2005/gmd http://schemas.opengis.net/csw/2.0.2/profiles/apiso/1.0.0/apiso.xsd"
	};
	return px;
	
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

function batchRecordQuery(fld, qry, guids) {

	if ( guids ) {
		sqlStr = 'select * from batchguidqry(\''+fld+'\',\'%' + qry + '%\',\''+guids+'\')';
	} else {
		sqlStr = 'select * from batchqry(\''+fld+'\',\'%' + qry + '%\')';
	}
	
	console.log('batch query ' + sqlStr);
	var qUrl = 'http://127.0.0.1:8082/query?q='+encodeURI(sqlStr);
	var qr = require('request');
	var body = '';
	return new Promise(function(resolve, reject){
		qr.get(qUrl)
		.on ('response',function(response) {         		
		})
		.on ('data', function(chunk) {
			body += chunk;
		}).on ('end', function() {
			resolve(body);
		});		 
	});
	/*
	return new Promise(function(resolve, reject){
		client.query(sqlStr, (err, res) => {
			  if ( typeof(res) !== "undefined" ) {
			  	resolve(JSON.stringify(res));
			  } else {
				reject("batch query error");	  	
			  }
		});
		     
	});
	*/

}

async function testfind(q) {
	// this example uses pg-pool service
	var sqlStr = 'Select * from mdview2 where version_id=1000';


	console.log('test '+ encodeURI(sqlStr) );

	var qUrl = 'http://127.0.0.1:8082/query?q='+encodeURI(sqlStr);

	var qr = require('request');
	var body = '';
	return new Promise(function(resolve, reject){
		qr.get(qUrl)
		.on ('response',function(response) {         		
		})
		.on ('data', function(chunk) {
			body += chunk;
		}).on ('end', function() {
			//console.log('done'+JSON.stringify(body));
			resolve(body);
		});		 
	});
}

async function poolQry(q) {
	// call able poolquery
	var sqlStr = 'Select * from mdview2 where version_id=1000';

	console.log('test '+ encodeURI(q) );

	var qUrl = 'http://127.0.0.1:8082/query?q='+encodeURI(q);

	var qr = require('request');
	var body = '';
	return new Promise(function(resolve, reject){
		qr.get(qUrl)
		.on ('response',function(response) {         		
		})
		.on ('data', function(chunk) {
			body += chunk;
		}).on ('end', function() {
			resolve(body);
		});		 
	});
}


async function find_records(qry,rOff, rLim, sortby,guids) {
//  This call uses the ngds-pysearch.js at 8080

	if ( isNaN(rOff) ) { rOff = 0 }
	if ( isNaN(rLim) ) { rLim = 10 }

	var sort = 'date_modified%20desc';
	if ( sortby ) {
		switch(sortby) {
			case '0': sort = 'date_modified%20desc'; break;
			case '1': sort = 'title%20desc'; break;
			case '2': sort = 'title%20asc'; break;
			case '3': sort = 'date_modified%20desc'; break;
			default: sort = 'date_modified%20desc'; break;
		}
	}
    
	if ( guids ) {
		var qUrl = 'http://127.0.0.1:8080/qGuids?guids='+guids+'&l='+rLim+'&o='+rOff+'&s='+sort;
	} else {
		if ( qry !== '%' ) {
			var qUrl = 'http://127.0.0.1:8080/qfind?q='+qry+'&l='+rLim+'&o='+rOff+'&s='+sort;
		} else {
			var qUrl = 'http://127.0.0.1:8080/qNew?l='+rLim+'&o='+rOff;
		}
	}

	var qr = require('request');
	console.log('test ' + qUrl);

	var body = '';
	return new Promise(function(resolve, reject){ 
		qr.get(qUrl)
		.on ('response',function(response) {   
			//console.log('response');       		
		})
		.on ('data', function(chunk) {
			//console.log('sending');
			body += chunk;
		}).on ('end', function() {
			//console.log('done'+JSON.stringify(body));
			resolve(body);
		});
	});
 
}

async function fetchUrlCache(guid,url) {
	// get cached resource link status checks by guid
	
	var sqlStr = 'select * from getUrlCheck(\''+guid+'\',\'x\')'; 
	var qUrl = 'http://127.0.0.1:8082/query?q='+encodeURI(sqlStr);
	var qr = require('request');
	var body = '';
	//console.log('request '+ qUrl);

	return new Promise(function(resolve, reject){
		qr.get(qUrl)
		.on ('response',function(response) {         		
		})
		.on ('data', function(chunk) {
			body += chunk;
		}).on ('end', function() {
			//console.log('returns '+ JSON.stringify(body));
			resolve(body);
		});		 
	});


}

function old_find_records(qry,rOff, rLim,sortby,guids) {
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
    //console.log('finder ' + sqlStr);
	return new Promise(function(resolve, reject){
		client.query(sqlStr, (err, res) => {
			  if ( typeof(res) !== "undefined" ) {
				//console.log('finder .. ' + JSON.stringify(res));
			  	resolve(res);

			  } else {
				reject("error noodle");	  	
			  }
		});
		     
	});

}

function record_show(qry, vid ) {
	// This uses the node app ngds-pg-pool at port 8082

	if ( vid > 0 ) {
		var vSql = 'with cv as ( select v.mdv_id, v.source_schema_id  as sid, v.version_id ' 
             + ' from md_record r, md_version v where v.md_id = r.md_id and '
             + ' r.guid = \'' + qry +'\'  and v.version_id = '+vid+'), ';
	} else {
		var vSql = 'with cv as ( select v.mdv_id, v.source_schema_id  as sid, v.version_id ' 
             + ' from md_record r, md_version v where v.md_id = r.md_id and '
             + ' r.guid = \'' + qry +'\'  and v.end_date is null), ';
	}
    var sqStr =  'mv as ( select 0 as node_id, \'mdversion\' as node_name, version_id::text as node_value,  '
	         +  ' \'\' as map_path from cv ), '
			 +	' mp as ( select node_id, node_name, node_value, substr(mp, 2, length(mp) - 2) as map_path '
             + ' from ( select node_id, node_name, node_value, mpath::text as mp from mdview2 '
             + ' where version_id = (select mdv_id from cv) ) m ), ' 
             + ' smap as ( select * from schema_map where schema_id = (select sid from cv) ),'
             + ' som as ( select o.fed_elem, o.relmapath from schema_map m, schema_object_map o where '
             + ' m.map_id = o.map_id and m.schema_id = (select sid from cv) )'
			 + ' select * from mv union '
			 + ' select node_id, fed_elem as node_name, node_value, q.map_path from mp q, smap s '
			 + ' where q.map_path = s.map_path '
             + ' union '
			 + ' select node_id, fed_elem as node_name, node_value, q.map_path from mp q, som s ' 
			 + ' where q.map_path like s.relmapath'
	
		 
	var sqlStr = vSql + sqStr;

	var sqlStr = 'select * from md_vms(\''+qry+'\','+vid+')';

	var qUrl = 'http://127.0.0.1:8082/query?q='+encodeURI(sqlStr);
	var qr = require('request');
	var body = '';
	return new Promise(function(resolve, reject){
		qr.get(qUrl)
		.on ('response',function(response) {         		
		})
		.on ('data', function(chunk) {
			body += chunk;
		}).on ('end', function() {
			resolve(body);
		});		 
	});

	//console.log('record show guid ' + sqlStr);
	/*
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
	*/

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
	
	var qUrl = 'http://127.0.0.1:8082/query?q='+encodeURI(sqlStr);
	var qr = require('request');
	var body = '';
	return new Promise(function(resolve, reject){
		qr.get(qUrl)
		.on ('response',function(response) {         		
		})
		.on ('data', function(chunk) {
			body += chunk;
		}).on ('end', function() {
			resolve(body);
		});		 
	});

	/*
	return new Promise(function(resolve, reject){
		client.query(sqlStr, (err, res) => {
			  if ( typeof(res) !== "undefined" ) {
			  	resolve(JSON.stringify(res));
			  } else {
				reject("error in categories");	  	
			  }
		});	     
	});
	*/


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

	
	//console.log('authors ' + sqlStr);
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

	//console.log('content model facet ' + sqlStr);
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
		
	//console.log('data types facet ' + sqlStr);
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

function fetchInspection(lim,off) {

	if ( lim == -1 ) {
		var tSql = 'select jso from inspection order by date_modified desc';
	} else {
		if ( off == -1 ) {off = 0;  }
		var tSql = 'select jso from inspection order by date_modified desc limit + ' + lim + ' offset ' + off;
	}
	//console.log (' inspect ' + tSql );
	return new Promise(function(resolve, reject){
		client.query(tSql, (err, res) => {
			  if ( typeof(res) !== "undefined" ) {
				var nro = {};
				nro.data = [];
				var trx = res.rows;
				trx.forEach(k=> {
					var nxtlev = k.jso;
					nro.data.push(nxtlev);
				});
			  	resolve(JSON.stringify(nro));
			  } else {
				  reject("error inspection ");	  	
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
    //console.log('map s ' + sqlStr);
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

function fetchAuth(u,p,s ) {

	var sqlStr = 'select name, apikey, agent_id, password from users where name = \'' 
				+ u +'\' and password = \'' + p +'\' order by 1'; 
    console.log(' sql ' + sqlStr);
    return new Promise(function(resolve, reject){
		client.query(sqlStr, (err, res) => {
				if ( typeof(res) !== "undefined" ) {
					resolve(res);
				} else {
				console.log(' ms err ' + err);
				reject("error in auth query");	  	
				}
		});	     
	});
}

function fetchUsers(u) {

	var sqlStr = 'select user_id, name, agent_id, created, fullname,email  '
				+ ' from users where state = \'active\'';

	console.log('fetch u '+ sqlStr);

	return new Promise(function(resolve, reject){
		client.query(sqlStr, (err, res) => {
				if ( typeof(res) !== "undefined" ) {
					resolve(res);
				} else {
					reject("error in user query");	  	
				}
		});	     
	});


}

function createUser(uo) {
  
  var tdate = Date.now();
  var pwh = sha512(uo.pw,gNACL);
  
  var sqlStr = 'insert into users (user_id, name, apikey, agent_id, created, password, fullname, email,state) values '
              + ' (nextval(\'user_id_seq\'),\'' + uo.uname + '\',\'' + gNACL + '\',' + uo.rp + ',current_timestamp,\'' 
              + pwh.passwordHash + '\',\'' + uo.fn + '\',\'' + uo.em + '\',\'active\')';
  console.log(' sql ' + sqlStr);
  return new Promise(function(resolve, reject) {
    client.query(sqlStr, (res, err) => {
    
  				if ( typeof(res) !== "undefined" ) {
            		//console.log(' resolve ' + JSON.stringify(res) );
  					resolve(res);
  				} else {
  				   console.log(' create user bad ' + JSON.stringify(err));
  				  reject(err);	  	  	
  				}
  		});	
  }); 
  
}

async function getVersions(guid) {
	
	var sqlStr = 'select mdv_id, version_id, status,source_schema_id, create_date, end_date from md_record r, md_version v '
				 + 'where v.md_id = r.md_id and r.guid = \'' + guid + '\' and v.status <> \'DELETE\' order by version_id desc';
	
	return new Promise(function(resolve, reject){
		client.query(sqlStr, (err, res) => {
			  if ( typeof(res) !== "undefined" ) {
				var ds = { 'guid': guid, 'versions' :  res.rows };
			  	resolve(ds);
			  } else {
				reject("versions error");	  	
			  }
		});     
	});
	
}

async function delRecordVersion(guid, version) {	
	if ( guid && version ) {
		var sqlStr = 'with cv as ( select mdv_id from md_version v, md_record r '
		     + ' where v.md_id = r.md_id and r.guid = \'' + guid + '\' and v.version_id = ' + version + ' ) '
             +	' update md_version set status = \'DELETE\' '
			 +  ' where mdv_id = ( select mdv_id from cv)';
			 
		//console.log('delete ' + sqlStr);
		return new Promise(function(resolve, reject){
			client.query(sqlStr, (err, res) => {
				  if ( typeof(res) !== "undefined" ) {
					resolve(res);
				  } else if ( err ) {
					  reject( err );
				  } else {
					reject("delete version record error");	  	
				  }
			});     
		});	
	}	
}

async function fetchRecordJson(guid, v ) {
	
	if ( !v || v==0 ) {
		var sqlStr = 'with cv as (select v.mdv_id from md_record r, md_version v where v.md_id = r.md_id and' 
             + ' r.guid = \'' + guid +'\' and v.end_date is null)'
			 + ' select * from mdvnode where version_id = (select mdv_id from cv) order by parent_id';
	} else {
		var sqlStr = 'with cv as (select v.mdv_id from md_record r, md_version v where v.md_id = r.md_id and' 
             + ' r.guid = \'' + guid +'\' and v.version_id = ' + v + ')'
			 + ' select * from mdvnode where version_id = (select mdv_id from cv) order by parent_id';
	}
	//console.log(' sql ' + sqlStr);
    var jr = {};
	
	return new Promise(function(resolve, reject){
		client.query(sqlStr, (err, res) => {
			  if ( typeof(res) !== "undefined" ) {
				var ds = res.rows;				
                var jr = makeMDJson2(ds, 0, 'o');
			  	resolve(jr);
			  } else {
				reject("error noodle");	  	
			  }
		});     
	});
}

async function fetchCollections(ctype) {
	var sqlStr = 'select set_id, set_name, create_date, set_description from collections where set_type = \'' + ctype + '\''
				+ ' and status in ( \'active\',\'complete\' ) order by create_date desc'; 

    console.log(' sql ' + sqlStr);
    return new Promise(function(resolve, reject){
		client.query(sqlStr, (err, res) => {
				if ( typeof(res) !== "undefined" ) {
					resolve(res);
				} else {
					console.log(' fetchcollections err ' + err);
					reject("error in collection query");	  	
				}
		});	     
	});

}

async function fetchValidation(guid, fid,sid,mdv) {

	function getValidation(fid,sid,mdv) {
		var sqlStr = 'select * from mdv_validate(10,'+sid+','+mdv+')';
		console.log('fetch validation sql '+ sqlStr);
		return new Promise(function(resolve, reject){
			client.query(sqlStr, (err, res) => {
				if ( typeof(res) !== "undefined" ) {
					resolve(res);
				} else {
					reject("schemas error");	  	
				}
			});     
		});
	}

	function getGuidValidataion(guid) {
		var sqlStr = 'select v.mdv_id as mdv_id, v.source_schema_id as sid, v.version_id as version_id' 
             + ' from md_record r, md_version v where v.md_id = r.md_id and '
			 + ' r.guid = \'' + guid +'\'  and v.end_date is null';
		console.log('fetch guid validation sql '+ sqlStr);
		return new Promise(function(resolve, reject){
			client.query(sqlStr, (err, res) => {
				if ( typeof(res) !== "undefined" ) {
					var trx = res.rows;
					var sid = trx[0].sid;
					var mdv = trx[0].mdv_id;
					var vid = trx[0].version_id;
					var fid = 10;
					resolve(getValidation(fid,sid,mdv));
				} else {
					reject("guid validation error");	  	
				}
			});     
		});	 

	}

	console.log(' xxx ' + guid + fid + sid + mdv)
	if ( guid == 'x') {
		return(getValidation(fid,sid,mdv));
	} else {
		return(getGuidValidataion(guid));
	}

}

async function fetchGuidValidation(guid) {

	var sqlStr = 'select v.mdv_id as mdvid, v.source_schema_id as sid, v.version_id as version_id' 
             + ' from md_record r, md_version v where v.md_id = r.md_id and '
			 + ' r.guid = \'' + guid +'\'  and v.end_date is null';
		return new Promise(function(resolve, reject){
			client.query(sqlStr, (err, res) => {
				if ( typeof(res) !== "undefined" ) {
					var trx = res.rows;
					var sid = trx[0].sid;
					var mdv = trx[0].mdv_id;
					var vid = trx[0].version_id;
					var fid = 10;
					resolve(fetchValidation(fid,sid,mdv));
					//var vr = fetchValidation(fid,sid,mdv);
					//vr.schema_id = sid;
					//vr.mdv_id = mdv;
					//vr.version_id = vid;
					//resolve(vr);

				} else {
					reject("guid validation error");	  	
				}
			});     
		});


}

async function fetchSchemas(sid) {

	if (sid == 0 || typeof(sid) == "undefined" ) {
		var sqlStr = 'select * from schemaCount';
	} else {
		var sqlStr = 'select * from schemapv(' + sid + ')';
	}

	return new Promise(function(resolve, reject){
		client.query(sqlStr, (err, res) => {
			  if ( typeof(res) !== "undefined" ) {
			  	resolve(res);
			  } else {
				reject("schemas error");	  	
			  }
		});     
	});

}

async function saveSchemaElem(sid, qt, fe, type, varule, mpath) {
	console.log('Save Schema new elem '+ sid + ' ' + qt );

	var sqlStr = 'select * from scmap_insert ('
		+ sid +',\''+qt+'\',\''+fe+'\',\''+type+'\','+varule+',\''+mpath+'\')';

	console.log('Save Schema sql '+ sqlStr);

	return new Promise(function(resolve, reject){
		client.query(sqlStr, (err, res) => {
			  if ( typeof(res) !== "undefined" ) {
			  	resolve(res);
			  } else {
				reject("schemas error");	  	
			  }
		});     
	});

}

async function updateSchemaElem(sid, map_id, moid, varule, mpath) {

	var sqlStr = 'select * from scmap_update ('
		+ sid +','+map_id+','+moid+','+varule+',\''+mpath+'\')';

	console.log('update schema element '+ sqlStr);

	return new Promise(function(resolve, reject){
		client.query(sqlStr, (err, res) => {
			  if ( typeof(res) !== "undefined" ) {
			  	resolve(res);
			  } else {
				reject("schemas error");	  	
			  }
		});     
	});
}

async function delSchemaElem(sid, map_id, moid) {

	if ( moid == 0 ) {
		sqlStr = 'delete from schema_map where map_id = '+map_id;
	} else {
		if ( moid > 0 ) {
			sqlStr = 'delete from schema_object_map where moid = '+moid;
		}
	}
	console.log('delete schema element '+ sqlStr);
	return new Promise(function(resolve, reject){
		client.query(sqlStr, (err, res) => {
			  if ( typeof(res) !== "undefined" ) {
			  	resolve(res);
			  } else {
				reject("schemas error");	  	
			  }
		});     
	});
}

async function makeNewSchema(sname,authsource) {

	sqlStr = 'insert into schemas (schema_id, schema_name, format, version, ' 
			+ 'auth_source,create_date,federated_id, status )'
			+ 'values ( nextval(\'schema_seq\'),\''+ sname + '\',\'user-interface\','
			+ '1,\''+ authsource + '\',current_timestamp,10,\'active\') returning schema_id';

	console.log('create new  '+ sqlStr);

	return new Promise(function(resolve, reject){
		client.query(sqlStr, (err, res) => {
			  if ( typeof(res) !== "undefined" ) {
			  	resolve(res);
			  } else {
				reject("schemas error");	  	
			  }
		});     
	});
}


function makeMDJson2(r, p, t) {
	// return type o - object, a - array
	var lj = {};
	var la = [];
   
	for (var k in r) {	
		if ( r[k].parent_id == p ) {
			var np = r[k].node_id;
			if ( r[k].node_prefix ) {
				var propname = r[k].node_prefix + ':' + r[k].node_name; 
			} else {
				var propname = r[k].node_name; 
			}
			if ( r[k].node_value == '{}' ) {
				lj[propname] = makeMDJson2(r,np,'o');
	
			} else if ( r[k].node_value == '[]' ) {
				// children of arrays - skip the layer that has the number index -
				lj[propname] = [];
				for (var v in r) {
					if ( r[v].parent_id == np ) {
						var subp = r[v].node_id;
						var z = {}; 
						if ( r[v].node_value == '{}' ) {
							z = makeMDJson2(r,subp,'o');													
						} else {
							z = r[v].node_value.replace(/(^")|("$)/g, '');
						}
						lj[propname].push(z);	
					}
				}				
			} else {
				// end point
				lj[propname] = r[k].node_value.replace(/(^")|("$)/g, '');	
			}
		}			
	}
	return lj;
}

function fetchRecEdJson(guid,ed) {
	
	function frj(guid, ed) {
		console.error(' FREJ ');
		if ( ed.version ) {
			var sqlStr = 'with cv as (select v.mdv_id from md_record r, md_version v where v.md_id = r.md_id and' 
				 + ' r.guid = \'' + guid +'\' and v.version_id = ' + ed.version + ')'
				 + ' select * from mdvnode where version_id = (select mdv_id from cv) order by parent_id';
		} else {
			var sqlStr = 'with cv as (select v.mdv_id from md_record r, md_version v where v.md_id = r.md_id and' 
				 + ' r.guid = \'' + guid +'\' and v.end_date is null)'
				 + ' select * from mdvnode where version_id = (select mdv_id from cv) order by parent_id';
		}	 
		//console.log('fje sql ' + sqlStr);
		var jr = {};
		
		return new Promise(function(resolve, reject){
			client.query(sqlStr, (err, res) => {
				  if ( typeof(res) !== "undefined" ) {
					var ds = res.rows;
					var elk = edById(ed);
					console.log('edit stack ' + JSON.stringify(elk) );
					//var jr = f(ds, 0, elk);
					var jr = editMDJson(ds, 0, elk);
					//console.log('process '+JSON.stringify(jr));
					if ( jr ) {
						//console.log('fje json ' );
						resolve(mdeWrite(guid, jr));
					} else {
						resolve('Record not resolve');
					}
				  } else {
					reject("db error");	  	
				  }
			});     
		});
	}

	function mdeWrite(guid, j) {
		var mSetId = 8;
		var mCid = 'Citation ID - test';
		var mSchema= 11;
		var mTitle='Test Title';
		var sqlStr = 'select * from makemdrecord(\''+guid+'\','+mSetId+',\'' + mCid
							+ '\',\'' +  mTitle + '\',' 
							+ mSchema + ',\'' + JSON.stringify(j) + '\'::json)';
		
		return new Promise(function(resolve, reject){
			client.query(sqlStr, (err, res) => {
				  if ( typeof(res) !== "undefined" ) {
					var ds = res.rows;
					var cswj = wrapUpdateJson(j);
					//console.log(' mde write  ');
					var xml = jToXML(cswj);
					pyCswInsert(guid,xml);
					resolve(JSON.stringify(res));
				  } else {
					reject("edit record make record error " + err);	  	
				  }
			});     
		});
	}

	return frj(guid, ed);
}


async function pyCswInsert (mGuid, xmlBody) {

	return new Promise(function(resolve, reject) {
		//console.log('XML ' + xmlBody);
		var	hurl = pyUrl + '?service=CSW&version=2.0.2&request=Transaction&TransactionSchemas='
					+ 'http://www.isotc211.org/2005/gmi';
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
				//console.log('pycsy failed:' + mGuid + ' ' + err);				
				reject("pycsw error " + mGuid);  	
				
			} else {
				console.log('PYCSW update for :' + mGuid );
				//console.log(util.inspect(httpResponse, {showHidden: false, depth: null}))
				resolve(httpResponse);
				
			}
		}
		pyRequest.post(options, pyResponse);
	})
	.catch(err => { 
			console.log('pyCswInsert error caught ' 
						+ mGuid + ' ' + bl +' ' + JSON.stringify(err) );
		});

}

	
function edById(e) {
	var edo = {};
	var  x = {};
	var newX = {};
	var delX = {};
	var nk=0;
	var dk = 0;

	for (var k in e.eda) {
		var p = e.eda[k].path;
		var v = e.eda[k].value;
		var a = e.eda[k].action;
		var n = e.eda[k].nodeid;
		if ( a =='edit' ) {
			x[n] = v;
		} else if ( a == 'new' ) {
			newX[nk] = e.eda[k];
			nk++;
			
		} else if ( a == 'delete' ) {
			delX[n] = p;
		}
	}
	edo.edit = x;
	edo.new = newX;
	edo.del = delX;

	return edo;
}

function editMDJson(r, p, ed) {
	
	var lj = {};
	var eda = [];
	
	for (var k in r) {
		
		if ( r[k].parent_id == p ) {
			var np = r[k].node_id;		
			if ( r[k].node_prefix ) {
				var propname = r[k].node_prefix + ':' + r[k].node_name; 
			} else {
				var propname = r[k].node_name; 
			}
			if ( r[k].node_value == '{}' ) {
				lj[propname] = editMDJson(r,np, ed);
				
			} else if ( r[k].node_value == '[]' ) {
				// children of arrays - skip the layer that has the number index -
				lj[propname] = [];
				for (var v in r) {
					if ( r[v].parent_id == np ) {
						var subp = r[v].node_id;
						var z = {}; 
						if ( r[v].node_value == '{}' ) {
							z = editMDJson(r,subp,ed);													
						} else {
							var nx = r[v].node_id;
							if ( ed.edit[nx] ) {
								z = ed.edit[nx].replace(/(^")|("$)/g, '');
							} else {	
								z = r[v].node_value.replace(/(^")|("$)/g, '');
							}	
						}
						lj[propname].push(z);	
					}
				}				
			} else {
				// end point
				var nx = r[k].node_id;
				if ( ed.edit[nx] ) {
					//console.log('endpoint - found edit ' + nx + ' NEW ' + edStack[nx] + ' Old ' + r[k].node_value  );
					lj[propname] = ed.edit[nx].replace(/(^")|("$)/g, '');
				} else {
					lj[propname] = r[k].node_value.replace(/(^")|("$)/g, '');
				}		
			}
		}			
	}
	return lj;
}

function processCollection(cb) {

	var i = cb.col_id;
	var a = cb.action;
	var f = cb.field_name;
	var q = cb.query_text;
	var s = cb.search_text;
	var r = cb.replace_text;
	var c = cb.collection;

	var zed = {};
	zed.field_name = f;
	zed.search_text = s;
	zed.replace_text = r;
	zed.count = c.length;

	function collectionBld(o) {
		
		var zed = {};
		zed.field_name = o.field_name;
		zed.search_text = o.search_text;
		zed.replace_text = o.replace_text;
		zed.count = o.collection.length;

		if ( o.col_id == 'new') {
			var sqlStr = 'insert into collections(set_id,set_name,set_type,status,create_date,end_date,user_id,'
					+ 'activity_definition_id, source_url, set_description, schema_id, url_params)'
					+ 'values(nextval(\'collections_id_seq\'),\''+ o.field_name + '-'+ o.query_text 
					+ '\',\'batch-edit\',\'active\',current_timestamp,null, '
					+ '1,6,\'data.geothermaldata.org\',\'' + o.action + ':'+ o.search_text + ':-:' + o.replace_text + '\',11,\''
					+ JSON.stringify(zed)+'\'::json) returning set_id';

		} else {
			//update to existing collection
			caBld(o,s)
			
		}

        console.log('col edit '+sqlStr);
		return new Promise(function(resolve, reject){
			client.query(sqlStr, (err, res) => {
				console.log('col edit qry '+err + ' ' + res);
				  if ( typeof(res) !== "undefined" ) {
					var set_id = res.rows[0].set_id;
					console.log('col edit set id '+set_id );
					caBld(o,set_id);
					resolve(res);
				  } else if ( err ) {
					  reject( err );
				  } else {
					reject("collection insert error");	  	
				  }
			});     
		});	
		
	}

	function caBld(o,s) {
		var sqlStr = 'insert into collection_activity(ca_id,set_id,ca_type, create_date,end_date,activity_id, agent_id,'
					+ 'parent_caid, status, version_state,action_date )'
					+ ' values (nextval(\'collection_activity_id_seq\'),'+s+',\'collection\',current_timestamp,null,'
					+ '6,1,null,\'new\',\'new\',current_timestamp) returning ca_id';

		console.log('col activty '+sqlStr);
		return new Promise(function(resolve, reject){
			client.query(sqlStr, (err, res) => {
				  
				if ( typeof(res) !== "undefined" ) {
					var a = res.rows[0].ca_id;
					console.log('col act id'+ s + a);
					jqBld(o,s,a,9);
					resolve(res);
				} else if ( err ) {
					reject( err );
				} else {
				reject("col activity insert error");	  	
				}
			});     
		});	
	}

	function jqBld(o,s,a, p ) {
		// 2 jq - one for db,  one for pycsw
		//var pd = 9;

		var sqlStr = 'insert into cap_jobque (pjq_id,pd_id,ca_id,ad_id,jobtype,status,created,completed)'
					+ ' values (nextval(\'pjq_seq\'),'+p+','+a+', 6,\'node-client\',\'new\',current_timestamp, null )'
					+ 'returning pjq_id';
		console.log('jq bld  '+sqlStr);			
		return new Promise(function(resolve, reject){
			client.query(sqlStr, (err, res) => {	  
				  if ( typeof(res) !== "undefined" ) {
					var q = res.rows[0].pjq_id;
					console.log('new jq  ' + q);
					if ( p == 9 ) {
						//jqBld(o,s,a,10);
						process_rows(o,s,a,q);
					}

					if ( p == 10 ) {
						//process pycsw
						processs_pycsw(o,s,a,q);

					}
					
					resolve(res);
				  } else if ( err ) {
					  reject( err );
				  } else {
					reject("jobque insert error");	  	
				  }
			});     
		});	

	}

	function process_rows(o,s,a,q) {
		var c = o.collection;
		var sqlStr = 'select * from batch_edit_collect('+a+','+q+',\''+JSON.stringify(c) + '\'::json)';
		console.log('process rows ' + sqlStr);
		
		return new Promise(function(resolve, reject){
			client.query(sqlStr, (err, res) => {	
				console.log('process rows ' + err + ' ' + res);  
				  if ( typeof(res) !== "undefined" ) {
			        jqBld(o,s,a,10);
					resolve(res);
				  } else if ( err ) {
					  reject( err );
				  } else {
					reject("job process error");	  	
				  }
			});     
		});
	}

	async function processs_pycsw(o,s,a,q) {
		console.log('pycsw');
		
		var col = o.collection;
		var rpc = 0;

		for (k in col) {	
			var guid = col[k].guid;
			var cur = await fetchRecordJson(guid);
			if ( cur !== null) {
				var cw = wrapUpdateJson(cur);
				var xm = jToXML(cw);
				pyCswInsert (guid, xm);
				rpc++;
			} 
		}
        procCapStatus(o,s,a,q);
		return rpc;
	}

	function procCapStatus(o,s,a,q) {

		var c = o.collection;
		var sqlStr = 'select * from batch_edit_status('+s+','+a+','+q+',\'complete\')';
		console.log('process rows ' + sqlStr);
		
		return new Promise(function(resolve, reject){
			client.query(sqlStr, (err, res) => {	
				console.log('status update ' + err + ' ' + res);  
				  if ( typeof(res) !== "undefined" ) {
					resolve(res);
				  } else if ( err ) {
					  reject( err );
				  } else {
					reject("job process error");	  	
				  }
			});     
		});	
	}
	
	collectionBld(cb);
	return zed;
}

// * Logging functions with err
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
		console.error(ip + ' ' + nw + ' ' + rm  + ' ' + lp + qs + ' ' + ore);
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

/* *********** Start Routes *****************************************/

router.get('/', async function(req, res) {
  var testme = await noodle();	
  //console.log('returned '+testme)
  var lp = '/';
  routelog(req, lp);
  res.send(testme);
});

router.get('/dataset', async function(req, res) {
	var lp = '/dataset';
	routelog(req, lp);
	var rid = req.query.id;
	
    if ( rid.length ) {
		res.redirect('https://data.geothermaldata.org/?guid='+rid);
    } else {
		res.redirect('https://data.geothermaldata.org');
    }  	
});

router.get('/record_search', async function(req, res) {
	var qry = req.query.qry;
	var sortby = req.query.sortby;
	var guids = req.query.guids;
	var lp = '/record_search';
	routelog(req, lp);

	if ( typeof(req.query.start) !== "undefined")  { var offset = req.query.start; } else { var offset = 0;  } 
	if ( typeof(req.query.page) !== "undefined") {  var lim = req.query.page; } else { var lim = 25; } 
 
    if ( qry.length ) {
    	var rcd = await find_records(qry ,offset, lim,sortby,guids);

    	res.send(rcd);	
    } else {
    	res.send('Enter a query');	
    }  	
});

router.get('/record_show', async function(req, res) {
	
	var lp = '/record_show';
	routelog(req, lp);
	var rid = req.query.id;
	var vid = req.query.version;
	if ( !vid ) { vid =0; }
    if ( rid.length ) {
		var rcd = await record_show(rid, vid);
    	res.send(rcd);	
    } else {
    	res.send('Enter a record id');	
    }  	
});

router.get('/getCategories', async function(req, res) {
	var lp = '/getCategories';
	routelog(req, lp);
	var lid = req.query.lid;
	var qry = req.query.q;
	//console.log(' >>> categoruesrecord show '+lid)
    var cats = await categories(lid,qry)
    if ( cats ) {
    	
    	res.send(cats);	
    } else {
    	res.send('Not Categories');	
    }  	
});

router.get('/validateMDRecord', async function(req, res) {
	var lp = '/action/validateMDRecord';
	routelog(req, lp);
	var guid = req.query.guid;
	var fid = req.query.fid;
	var sid = req.query.sid;
	var mdv = req.query.mdv;
	if (typeof(guid) == 'undefined' ) { guid = 'x' }
	console.log('validate '+fid+sid+mdv+guid);
	var s = await fetchValidation(guid,fid,sid,mdv);

    if ( s ) {
    	res.send(s);	
    } else {
    	res.send('No validation returned');	
    }  	
});


router.get('/getSchemas', async function(req, res) {
	var lp = '/getSchemas';
	routelog(req, lp);
	
	var sid = req.query.sid;
	
	var s = await fetchSchemas(sid);
	
    if ( s ) {
    	res.send(s);	
    } else {
    	res.send('No Schemas');	
    }  	
});

router.get('/saveSchemaElem', async function(req, res) {
	var lp = 'action/saveSchemaElem';
	routelog(req, lp);
	// q='+q+'&sid='+eid+'&fe='+fd+'&type='+sty+'&vr='+vt+'&mp='+mp
	var action = req.query.action;
	var sid = req.query.sid;
	var qt = req.query.q;
	var fe = req.query.fe;
	var type = req.query.type;
	var varule = req.query.vr;
	var mpath = req.query.mp;
	var mapid = req.query.mapid;
	var moid = req.query.moid;
	console.log(' save '+ sid + qt + fe);
	if ( action == 'new' ) {
		var s = await saveSchemaElem(sid, qt, fe, type, varule, mpath);
	} else {
		var s = await updateSchemaElem(sid, mapid, moid, varule, mpath);
	}
	
	
    if ( s ) {
    	res.send(s);	
    } else {
    	res.send('No Schemas');	
    }  	
});


router.get('/deleteSchemaElem', async function(req, res) {
	var lp = '/action/deleteSchemaElem';
	routelog(req, lp);
	var mapid =  req.query.mapid;
	var moid =  req.query.moid;
	var sid = req.query.sid;


	console.log('delete '+ sid + mapid + moid);
	var s = await delSchemaElem(sid, mapid, moid);
	
    if ( s ) {
    	res.send(s);	
    } else {
    	res.send('No Schemas');	
    }  	
});

router.get('/createNewSchema', async function(req, res) {
	var lp = '/action/createNewSchema';
	routelog(req, lp);
	var sname =  decodeURIComponent(req.query.name);
	var authsource = decodeURIComponent(req.query.auth);

	var s = await makeNewSchema(sname, authsource);
	
    if ( s ) {
    	res.send(s);	
    } else {
    	res.send('No Schemas');	
    }  	
});


router.get('/getAuthors', async function(req, res) {
	var lp = '/getAuthors';
	routelog(req, lp);
	
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

router.get('/getCollections', async function(req, res) {
	var lp = '/action/getCollections';
	routelog(req, lp);
	
	var ctype = req.query.ctype;

    var cols = await fetchCollections(ctype);
    if ( cols ) {
    	res.send(cols);	
    } else {
    	res.send('No Collections');	
    }  	
});

router.get('/getToken', async function(req, res) {
	var lp = '/getToken';
	routelog(req, lp);
	var quark = req.query.q;
	var lib = req.query.p;
  console.log('GT - 1' + quark + lib);
  var pwh = saltHashPassword(lib);
  var pwh = sha512(lib,'5d097fe1065645c8');
  console.log(pwh.salt);
  var px = await fetchAuth(quark, pwh.passwordHash, pwh.salt);
  if ( px ) { 

	var dres = px.rows; 
	var kv = dres[0];
	var authtoken = 'A'+kv.apikey.substr(0,6) + 'E' + kv.password.substr(0,12); 
	gKeystack.push(authtoken);
	var cms = {};
	cms.authtoken  = authtoken;
	cms.kv = authtoken;
	cms.agentrole = kv.agent_id;
	res.send(cms);
  
  } else {
	  res.send('{"token": "Not authorized"');	
  } 
  
});

router.get('/createUser', async function(req, res ) {
	var lp = '/createUser';
	routelog(req, lp);

  var u = {};
  u.uname = req.query.u;
  u.pw = req.query.p;
  u.token = req.query.t;
  u.fn = req.query.fn;
  u.em = req.query.em;
  u.rp = req.query.a;
  
  if ( gKeystack.indexOf(u.token) > -1 ) {
	var cur = await createUser(u);
 
	if ( cur == null) {
		res.send('User Created ');	
	} else {
		res.send(cur);	
	}    
  }
  
});

router.get('/getUsers', async function(req, res ) {
	var lp = '/getUsers';
	routelog(req, lp);

	utoken = req.query.t;
	var vex = gKeystack.indexOf(utoken);
   
	if ( vex >= 0 ) {	
		var cur = await fetchUsers(utoken);
		if ( cur == null) {
			res.send('No response');	
		} else {
			res.send(cur);	
		}    
	}
  
});

router.get('/editRecord', async function(req, res ) {
	var lp = '/editRecord';
	routelog(req, lp);
    var guid = req.query.guid;
    
    var cur = await editRecordVersion(guid);
    if ( cur == null) {
      	res.send('ERROR ');	
    } else {
      	res.send(cur);	
    }    
});

router.get('/deleteMdVersion', async function(req, res ) {
	var lp = '/deleteMdVersion';
	routelog(req, lp);
    var guid = req.query.guid;
	var version = req.query.version;
    var cur = await delRecordVersion(guid,version);

    if ( cur == null) {
      	res.send('ERROR ');	
    } else {
      	res.send(cur);	
    }    
});

router.post('/updateMdRecord', async (request, response) => { 
	var lp = '/updateMdRecord';
	routelog(request, lp);
	var edStack = request.body;
	var guid = edStack.guid;
	var cur = await fetchRecEdJson(guid,edStack);
	response.json(cur);
	
  });

router.post('/batchUpdateCollection', async (request, response) => { 
	var lp = '/batchUpdateCollection';
	routelog(request, lp);
	var colBody = request.body;
	//var guid = edStack.guid;
	var cur = await processCollection(colBody);
	response.json(cur);
	
  });


router.get('/getRecordXML', async function(req, res ) {
	var lp = '/getRecordXML';
	routelog(req, lp);
    var guid = req.query.guid;
	if ( guid ) {
		var cur = await fetchRecordJson(guid);
		if ( cur == null) {
			res.send('ERROR ');	
		} else {
			var cw = wrapUpdateJson(cur);
			var xm = jToXML(cw);
			res.set('Content-Type', 'text/xml; charset=utf-8');
			res.send(xm);
		} 
    } else {
		res.send('MISSING GUID Indentifier');
	}  	  
});
  
router.get('/getRecordJson', async function(req, res ) {
	var lp = '/getRecordJson';
	routelog(req, lp);
    var guid = req.query.guid;
	var vid = req.query.version;
	if ( !vid ) { vid =0; }
    if ( guid ) {
		var cur = await fetchRecordJson(guid, vid);
		if ( cur == null) {
			res.send('ERROR ');	
		} else {
			res.json(cur);	
		} 
    } else {
		res.send('MISSING GUID Indentifier');
	}  
});

router.get('/getMdVJson', async function(req, res ) {
	var lp = '/getMdVJson';
	routelog(req, lp);
    var guid = req.query.guid;
	var vid = req.query.version;
	
    //console.log('edit record ' + guid );
    if ( guid ) {
		var cur = await fetchRecordJson(guid);
		if ( cur == null) {
			res.send('ERROR ');	
		} else {
			res.json(cur);	
		} 
    } else {
		res.send('MISSING GUID Indentifier');
	}  
});

router.get('/getRecordVersions', async function(req, res) {
	var lp = '/getRecordVersions';
	routelog(req, lp);
	var guid = req.query.guid;
    var mrv = await getVersions(guid);
    if ( mrv ) {
    	res.send(mrv);	
    } else {
    	res.send('No Versions');	
    }  	
});

router.get('/getBatchQuery', async function(req, res) {
	var lp = '/getBatchQuery';
	routelog(req, lp);

	var qry = req.query.q;
	var fld = req.query.fld;
	var guids = req.query.guids;

    var cms = await batchRecordQuery(fld, qry, guids);
    if ( cms ) {
    	res.send(cms);	
    } else {
    	res.send('No Data Types');	
    }  	
});


router.get('/getContentModels', async function(req, res) {
	var lp = '/getContentModels';
	routelog(req, lp);
	var qry = req.query.q;
	var lid = req.query.lid;
	var so = req.query.sortby;
	//console.log(' sort by ' + so );
	if ( !so ) { so = 1 }
    var cms = await contentModels(lid,qry, so);
    if ( cms ) {
    	res.send(cms);	
    } else {
    	res.send('No Content Models');	
    }  	
});

router.get('/getDataTypes', async function(req, res) {
	var lp = '/getDataTypes';
	routelog(req, lp);

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
	var lp = '/typeAhead';
	routelog(req, lp);
	var qry = req.query.q;
    var ta = await fetchTypeAhead(10,qry);
    if ( ta ) {
    	res.send(ta);	
    } else {
    	res.send('No TypeAhead data');	
    }  	
});

router.get('/getMapServers', async function(req, res) {
	var lp = '/getMapServers';
	routelog(req, lp);
    var fms = await fetchMapServers();
    if ( fms ) {
    	res.send(fms);	
    } else {
    	res.send('No Map Server data');	
    }  	
});


router.get('/testfind', async function(req, res) {
	var lp = '/testfind';
	routelog(req, lp);

	var qry = req.query.qry;

    var fms = await testfind(qry);
    if ( fms ) {
    	res.send(fms);	
    } else {
    	res.send('No test find ');	
	}  	
	
});


router.get('/ingestion', async function(req, res) {
	var lp = '/ingestion';
	routelog(req, lp);
	var lm = req.query.limit;
	var of = req.query.offset;
	if ( !lm ) { lm = -1 }
    if ( !of ) { of = -1 }
	var fms = await fetchInspection(lm,of);
    if ( fms ) {
    	res.send(fms);	
    } else {
    	res.send('Inspection results error');	
	}  	

});

router.get('/getUrlStatusCached', async function(req, res) {
	var lp = '/action/getUrlStatusCached';
	routelog(req, lp);
  	var exists = true;
	//res.send(exists);
	
	var guid = req.query.guid;
  	var urlToCheck = req.query.url;
	var urlVal = await fetchUrlCache(guid, urlToCheck);
	if ( urlVal ) {
		res.send(urlVal);
	} else {
		res.send('UrlCheck no response')
	}
	
});	

// generic debuggint tool
router.get('/getData', (request, response) => {
	var lp = '/getData';
	routelog(req, lp);
	var tbn = request.query.tbn;
	var qfld = request.query.qfld;
	var qv = request.query.qv;
	var sqlStr = 'Select * from ' + tbn + ' where ' + qfld + ' = ' + qv;
	console.log ( sqlStr );
	client.query(sqlStr, (err, res) => {
	  console.log(err, res);
	  if ( typeof(res) !== "unedfined" ) {
		 
		  console.log(err, res)
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

// OLD - Router harvest not currently active use the main one
router.get('/harvest', (request, response) => {
    var lp = '/harvest';
	routelog(req, lp);
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
         
           //console.log('Writing  ', mGuid, mTitle);

           var rcd = await create_record(mGuid, mCid, mTitle, mBody);
           var rbg = JSON.stringify(rcd);
           rsp.results.push(rbg);

           if ( (mxr - 1) == rc ) {
	  			response.json(rsp);
	  			return;
	  		}
	  		rc++;
           	 
       }

       //console.log( ' return json --> ', JSON.stringify(rsp) );

	}

	fw();


});

router.get('/harvestSourceInfo', (request, response) => {
	var lp = '/harvestSourceInfo';
	routelog(req, lp);
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

    //console.log('sql ' + sqlStr);

    client.query(sqlStr, (err, res) => {

	  if ( typeof(res) !== "undefined" ) {	 
	  	response.json(res);  
	  	
	  } else {
		response.json('Not Ready'); 
	  }

	})


 });

router.get('/harvestSourceList', (request, response) => {
	var lp = '/harvestSourceList';
	routelog(request, lp);
    // retrieve list of harvest sources
	var sqlStr = 'Select set_id, set_name, source_url from collections '
				+ ' where status = \'active\' and set_type = \'harvest\'';

	sqlStr = 'select * from harvest_source_hdr';

    client.query(sqlStr, (err, res) => {
    	if ( typeof(res) !== "undefined" ) {	
	  		response.json(res);  
	  	} else {
			response.json('Error'); 
	  	}
	})
 });


router.get('/newCollectionActivity', (request, response) => {
	var lp = '/newCollectionActivity';
	routelog(req, lp);
    var params = request.query;
	  //console.log(JSON.stringify(request.query));
	
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

	    	//console.log(res);
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
        		
	console.log('proces dispatch for CA ID ' + caid);
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

 