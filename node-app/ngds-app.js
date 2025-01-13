/* NGDS Front End  App V1.6
   G. Hudman
   Sept 2024
*/  

var  Path = '/opt/ngds/node-app';
const port = 80;

// var https = require("http");

var express = require('express'),
    app = express(),
	  fs = require("fs"),
    xmldoc = require('xmldoc'),
    request = require('request'),
    urlExists = require('url-exists'),
    //urlExists = require('url-exists-async-await'),
    bodyParser = require('body-parser');

var j2h = require('node-json2html');
//const pg = require('pg');
//const connectionString = 'postgres://ngdsdb:geonewton@localhost:5432/geothermal';

var csw = require('csw-client');
var options = { "outputSchema" :"http://www.isotc211.org/2005/gmd" };
options.typeName = 'gmd:MD_Metadata';
options.outputSchema = 'http://www.isotc211.org/2005/gmd';
options.outputFormat = 'application/xml';
options.maxRecords = 10;
options.startPosition = 21;
options.elementSetName = 'full';
var cswClient = csw('http://catalog.usgin.org/geothermal/csw', options);

var mdapi = require("./ngds-routes-db.js");
var schemapi = require("./ngds-schema-api.js");
var cswapi = require("./ngds-routes-csw.js");
var mapapi =  require("./ngds-routes-map.js");

var j2h = require('node-json2html');

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
// app.use('/css/images', express.static(__dirname + '/public/css/images', { maxAge: '1d' } ));
app.use(express.static(__dirname + '/public/css/images', { maxAge: '1d'  }));
app.use('/jsonSchemas', express.static(__dirname + '/public/jsonSchemas'));
app.use('/action',mdapi);
app.use('/csw',cswapi);
app.use('/spatial',mapapi);
//const client = new pg.Client(connectionString);

const results = [];
//client.connect();

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


app.get('/help' , function(req,res) {
	var lp = '/public/ngds-help.htm';
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

/*
app.get('/' , function(req,res) {
  var idx = 0;
	console.log('ngds test - path '+Path+' '+port);
  res.send('NGDS TEST!' + idx);
  idx++;
} );
*/

app.listen(port, () => {
  console.log('xxx App running on port '+port)
 
});

app.on('error',(err) => {
  console.log('log error : ', err);
  console.error('error : ', err);

});


