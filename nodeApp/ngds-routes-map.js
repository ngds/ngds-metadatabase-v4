/* Supports spatial operations 
    test.geothermaldata
    May 14 2020

*/

var express = require('express');
var  bodyParser = require('body-parser');
var router = express.Router();
const xml2js = require('xml2js');
var parseString = require('xml2js').parseString;
var xmldoc = require('xmldoc');
var  Path = process.env.NODE_PATH;
const pg = require('pg');

const connectionString = '';
const client = new pg.Client(connectionString);
client.connect();

router.use( bodyParser.json({limit: '50mb'}) ); 

// Logging 
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


function XMLtoJ(data) {
    var aj = {};
    
	 var parser = new xml2js.Parser({explicitArray: false, ignoreAttrs: false, mergeAttrs: false });
     //console.log(' xml Parser ' + data.length + ' XX ' + data.substr(0,30));
     var td = data.trim();

	 parser.parseString(data, function (err, result) {
        
        if (typeof(result) == "object" ) {
            aj = result;
        } else {
            aj = JSON.parse(result);
        }
        aj = result;

    });
    return aj;
    
}

function fetchContentModels() {
    var sqlStr = 'select distinct(cmm), count(cmm) from '
                 + '   ( select lower(substring(cm, position(\':\' in cm)+1, length(cm) - position(\':\' in cm)-1)) as cmm '
                 + '        from resource_links r, cm_register c where r.identifier = c.guid and  '
                 + '          (lurl ilike \'%wfs%\' or lurl ilike \'%wfs%\'  '
                 + '            or lurl ilike \'%getcapabilities%\' or lurl ilike \'%mapserver%\') ) z '
                 + '   group by cmm';

    return new Promise(function(resolve, reject){
        client.query(sqlStr, (err, res) => {
                if ( typeof(res) !== "undefined" ) {
                    resolve(JSON.stringify(res));
                } else {
                
                //console.log(' cml err ' + err);
                reject("cm list query error ");	  	
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
    //console.log('spatial map server ' + sqlStr);

	return new Promise(function(resolve, reject){
		client.query(sqlStr, (err, res) => {
				if ( typeof(res) !== "undefined" ) {
					resolve(JSON.stringify(res));
				} else {
				//console.log(' ms err ' + err);
				reject("error in map server query ");	  	
				}
		});	     
	});

}

function fetchServiceList(cm, repo) {

    var sqlStr = 'select * from resource_links limit 1';
    return new Promise(function(resolve, reject){
		client.query(sqlStr, (err, res) => {
				if ( typeof(res) !== "undefined" ) {
					resolve(JSON.stringify(res));
				} else {
				//console.log(' ms err ' + err);
				reject("error in query ");	  	
				}
		});	     
	});

}

function fetchResourceList(t, cm, repo, b, f) {
    var ba, bbox, dt, bbssql, rpsql, cmsql, mf;

    //console.log(' start resource fetch' + t + cm + repo + b + f);

    if ( f ) { mf= 'contains' }
    else { mf = 'intersects'}

    if ( b ) {
        ba = b.split(',');
        bbox = '\'POLYGON(('+ba[0] + ' ' + ba[1] + ',' 
               + ba[0] + ' ' + ba[3] + ',' 
               + ba[2] + ' ' + ba[3] + ','
               + ba[2] + ' ' + ba[1] + ','
               + ba[0] + ' ' + ba[1] + '))\'';

        bbsql = 'loca as ( select identifier, title, wkt_geometry from cmx ' 
                + ' where st_'+mf+'(ST_GeomFromText(' + bbox + '), ST_GeomFromText(wkt_geometry) ) ) ';
    } else {
        bbsql = 'loca as ( select identifier, title, wkt_geometry from cmx ) ';
    }

    if ( cm ) {
        cmsql = 'cmx as ( select identifier, title, wkt_geometry from public.records where keywords like \'%' + cm + '%\' ) ';

    } else {
        cmsql = 'cmx as ( select identifier, title, wkt_geometry from public.records ) '
    }

   
    if ( t && t == 'ESRI-F' ) {
        //dt = ' ( ltype = \'ESRI\' )';
        dt = ' ( lurl ilike \'%wfs%\')  AND (lurl iLIKE \'%mapserver%\')';
    } else if (  t && t == 'ESRI-M' ) { 
        dt = ' ( lurl ilike \'%wms%\')  AND (lurl iLIKE \'%mapserver%\')';
    } else if ( t && t !== 'ESRI' ) {
        dt = ' ( lurl ilike \'%' + t + '%\')  AND (lurl iLIKE \'%geoserver%\')';
    } else {
        dt = ' (lurl ilike \'%wfs%\' OR lurl ilike \'%wms%\' OR lurl ilike \'%getcapabilities%\')';
    }

    if ( repo ) {
        dt =  dt + ' AND ( lurl ilike \'%' + repo + '%\')';
    } 
    
    var sqlStr = 'with ' + cmsql + ',' + bbsql + ' select r.identifier, l.title, ldesc, lparams, lurl, wkt_geometry '
            + ' from resource_links r, loca l '
            + 'where r.identifier = l.identifier  '
            + ' AND ' + dt + ' order by title asc';
    
    //console.log(sqlStr);
    return new Promise(function(resolve, reject){
		client.query(sqlStr, (err, res) => {
				if ( typeof(res) !== "undefined" ) {
					resolve(JSON.stringify(res));
				} else {
				    reject("error in query ");	  	
				}
		});	     
	});
    
}

router.get('/',(req, res) => {
    var lp = '/';
	routelog(req, lp);
    var t = { test: 'test'};
    res.send(t); 
});

router.get('/getMapServers', async function(req, res) {
    var lp = '/getMapServers';
	routelog(req, lp);
    //console.log(' get map server ');
    
    var fms = await fetchMapServers();
    if ( fms ) {
    	res.send(fms);	
    } else {
        routelog(request,lp+' No map server data', 'err');
    	res.send('No Map Server data');	
    }  	
});

router.get('/getContentModels', async function(req, res) {
    var lp = '/getContentModels';
	routelog(req, lp);
	//var qry = req.query.q;
	//var lid = req.query.lid;
	//var so = req.query.sortby;
	//console.log(' sort by ' + so );
	//if ( !so ) { so = 1 }
    var cms = await fetchContentModels();
    if ( cms ) {
    	res.send(cms);	
    } else {
        routelog(request,lp+' No content model data', 'err');
    	res.send('No Content Models');	
    }  	
});

router.get('/getServiceList', async function(req, res) {
    var lp = '/getServiceList';
	routelog(req, lp);
    var cm = req.query.cm;
    var server = req.query.srv;

    var cms = await fetchServiceList();
    if ( cms ) {
    	res.send(cms);	
    } else {
        routelog(request,lp+' No map service list data', 'err');
    	res.send('No service list data');	
    }  	
});

router.get('/getResourceList', async function(req, res) {
    var lp = '/getResourceList';
    routelog(req, lp);
    
    var t = req.query.type;
    var cm = req.query.cm;
    var repo = req.query.r;
    var b = req.query.bbox;
    var f = req.query.filter;

    //console.log('get resource list ' + t + cm + repo + b + f);

    var rl = await fetchResourceList(t, cm, repo, b, f);
    if ( rl ) {
    	res.send(rl);	
    } else {
        routelog(request,lp+'  No resource list data', 'err');
    	res.send('No Resources');	
    }  	
});

router.get('/getGeoserverFeature', async function(req, res) {
    var lp = '/getGeoServerFeature';
	routelog(req, lp);
    var urlp = req.query.url;
    var uri = decodeURIComponent(urlp);
    //console.log('get Geoserver Feature WFS '+ uri);
    var r = require('request');
    var body;
    r.get(uri)
        .on ('response',function(response) {           		
        })
        .on ('data', function(chunk) {
        body += chunk;
        })
        .on ('end', function() {
            //console.log(body);

            //console.log('1 - JSON ' + body.indexOf('{') );
            if ( body.indexOf('{') > 0 ) {
                body = body.substr(body.indexOf('{'))
            }
            //console.log('JSON returned ' + body.indexOf('{') );
            res.json(body); 
        });
});

router.get('/getGeoserverCapabilities', async function(req, res) {
    var lp = '/getGeoserverCapabilities';
	routelog(req, lp);
    var urlp = req.query.url;
    var uri = decodeURIComponent(urlp);
    console.log(' geoserver url ' + uri);
    var r = require('request');
    var body;
    r.get(uri)
        .on ('response',function(response) {           		
        })
        .on ('data', function(chunk) {
        body += chunk;
        })
        .on ('end', function() {
            //var xd = new xmldoc.XmlDocument(body);
            //var boy = body.replace("<?xml version='1.0' encoding='UTF-8'?>", "");
            var boy = body.substr(body.indexOf('?>')+2);
            console.log('2 - Returns type length -  ' + typeof(boy) + ' ' + boy.substr(0,15));
            //var xd = new xmldoc.XmlDocument(body);
            var xmlToJson = XMLtoJ(boy);

            if ( typeof(xmlToJson["WFS_Capabilities"]) !== "undefined" &&  xmlToJson["WFS_Capabilities"]["FeatureTypeList"]  !== "undefined"  ) {
                var fList = xmlToJson["WFS_Capabilities"]["FeatureTypeList"]
                console.log(' WFS '); // + JSON.stringify(xmlToJson) );
                res.set('Content-Type', 'application/json');
                res.json(fList);
            } else 
                if ( typeof(xmlToJson["WMS_Capabilities"]) !== "undefined" &&  xmlToJson["WMS_Capabilities"]["Capability"]  !== "undefined"  ) {
                   
                    var fList = xmlToJson["WMS_Capabilities"]["Capability"]["Layer"];
                    console.log(' WMS ' + JSON.stringify(flist));
                    res.set('Content-Type', 'application/json');
                    res.json(fList);
            } else {
                var flist = {"Capabilities": "Error" };
                res.json(fList);
            }
           // var fList = xmlToJson["WFS_Capabilities"]["FeatureTypeList"]
            //console.log(' Json 260 '); // + JSON.stringify(xmlToJson) );
            //res.set('Content-Type', 'application/json');
            //res.json(fList);
            /*
            var parser = new xml2js.Parser({explicitArray: false, ignoreAttrs: false, mergeAttrs: false });
            parser.parseString(body, function (err, result) {
               aj = result;
               console.log(' xml Parser !!!!' + JSON.stringify(err) );
               res.send(aj); 
           });
          */		    
        });
   
});

router.get('/previewMap',(req, res) => {
    var lp = '/previewMap';
	routelog(req, lp);

	var offset = req.query.offset;
	var tn = req.query.typeName;
	var mf = req.query.maxFeature;
	var opf = req.query.outputFormat;
	var rq = req.query.request;
	var bb = req.query.bbox;
	var srs = req.query.srs;

	//var hurl = request.query.hurl;
	//var hurl = 'https://gdr.openei.org/csw?request=GetRecords&service=CSW&version=2.0.2&resultType=results&typeName=csw:Record&maxRecords=50&elementSetName=summary&outputFormat=json';
	var smurl = 'http://geothermal.smu.edu:9000/geoserver/gtda/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=gtda:wells&maxFeatures=50&outputFormat=application%2Fjson';
	
	var murl = 'http://search.geothermaldata.org/geoserver-srv/WaterQuality-REWJ/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=WaterQuality-REWJ:WaterQuality&maxFeatures=50&outputFormat=application/json';
	
	hurl = 'http://search.geothermaldata.org/geoserver-srv/WaterQuality-REWJ/ows?service=WFS&version=1.0.0&request=GetFeature';
	hurl= hurl + tn+mf+srs+bb+opf;

	//hurl=hurl+'&startPosition='+offset;

	var r = require('request');
    var body = '';
     
     r.get(smurl)
       .on ('response',function(response) {           		
      	})
        .on ('data', function(chunk) {
          body += chunk;
        })
        .on ('end', function() {
            var xlj = XMLtoJ(body);
            
			//var xlj = XMLtoJ(body);
			//var rb=xlj['csw:GetRecordsResponse'];
            res.send(body); 			    
     });
	
});

router.get('/')

module.exports = router;