/* Supports spatial operations 
    data.geothermaldata
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

const connectionString = 'xxxx';
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


	return new Promise(function(resolve, reject){
		client.query(sqlStr, (err, res) => {
				if ( typeof(res) !== "undefined" ) {
					resolve(JSON.stringify(res));
				} else {
				
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
				
				reject("error in query ");	  	
				}
		});	     
	});

}

function fetchResourceList(t, cm, repo, b, f) {
    var ba, bbox, dt, bbssql, rpsql, cmsql, mf;



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
   
    var r = require('request');
    var body;
    r.get(uri)
        .on ('response',function(response) {           		
        })
        .on ('data', function(chunk) {
        body += chunk;
        })
        .on ('end', function() {

            if ( body.indexOf('{') > 0 ) {
                body = body.substr(body.indexOf('{'))
            }
           
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
            
            var boy = body.substr(body.indexOf('?>')+2);
           
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
	    
        });
   
});

router.get('/previewMap',(req, res) => {
	// test route
    var lp = '/previewMap';
	routelog(req, lp);

	var offset = req.query.offset;
	var tn = req.query.typeName;
	var mf = req.query.maxFeature;
	var opf = req.query.outputFormat;
	var rq = req.query.request;
	var bb = req.query.bbox;
	var srs = req.query.srs;

	var smurl = 'http://geothermal.smu.edu:9000/geoserver/gtda/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=gtda:wells&maxFeatures=50&outputFormat=application%2Fjson';
	
	var murl = 'http://search.geothermaldata.org/geoserver-srv/WaterQuality-REWJ/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=WaterQuality-REWJ:WaterQuality&maxFeatures=50&outputFormat=application/json';
	
	var hurl = 'http://search.geothermaldata.org/geoserver-srv/WaterQuality-REWJ/ows?service=WFS&version=1.0.0&request=GetFeature';
	hurl= hurl + tn+mf+srs+bb+opf;

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
         
            res.send(body); 			    
     });
	
});

router.get('/')

module.exports = router;