var express = require('express');
var router = express.Router();

var  Path = process.env.NODE_PATH;
const pg = require('pg');

const connectionString = '';
//var pgapi = require("./ngds-pg-api.js");

const client = new pg.Client(connectionString);

const results = [];
client.connect();


exports.schemaDef = (function(srjson) { 
	var kp;

	//moa = mdjson;

	var newJson = transverse(srjson);

	//return newJson;
});


	var bldNode= { "name":"root",
   				  	"root" : "root",
   					"datatype" : "object",
   					"display": "Root", 
   					"ref" : "/",
   					"children" : [] };


/*
function transverse(jsn) {
	if ( Array.isArray(jsn) ) {

		forEach( k in jsn ) {
			var nk = jsn[k];

		}

	} 


}

*/
