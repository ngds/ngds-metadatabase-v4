/* Search engine optimization using pycsw db directly
   G. Hudman
   Aug 17, 2020
*/

const  {Pool} = require('pg');
const pool = new Pool({
	user: 'ngdsdb',
	host: 'localhost',
	database: 'pycsw',
	password: '',
	port: 5432,
	max: 25
  });

  pool.on('error', (err, client) => {
	console.error('Unexpected error on idle client', err)
	process.exit(-1)
  })


require('dotenv').config();
const port = 8080;
const Path = process.env.NODE_PATH;

var express = require('express'),
	app = express(),
	url = require('url'),
	bodyParser = require('body-parser'),
	request = require('request');

app.use(function(req, res, next){
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
	res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
	next();
});
	
app.use( bodyParser.json({limit: '50mb'}) ); 	

async function qS(qry, so, lim, ofs) {

	var iSql = 'select * from findrec(\''+qry+'\',\''+so+'\','+lim+','+ofs+')';
	console.log('query ' + iSql);

	return new Promise(function(resolve, reject) {
		pool.connect()
			.then(client => {
				return client
				.query(iSql)
				.then(res => {
					client.release();
					resolve(res);
				})
				.catch(err => {
					client.release()
					console.log(err.stack)
					reject(err);
				})
			});
	});

}

async function getGuids(guids, so, lim, ofs) {

	var iSql = 'select * from findguids(\''+guids+'\',\''+so+'\','+lim+','+ofs+')';

	return new Promise(function(resolve, reject) {
		pool.connect()
			.then(client => {
				return client
				.query(iSql)
				.then(res => {
					client.release();
					resolve(res);
				})
				.catch(err => {
					client.release()
					console.log(err.stack)
					reject(err);
				})
			});
	});
}

async function getNew(lim, ofs) {

	var iSql = 'select * from findnewrec('+lim+','+ofs+')';

	return new Promise(function(resolve, reject) {
		pool.connect()
			.then(client => {
				return client
				.query(iSql)
				.then(res => {
					client.release();
					resolve(res);
				})
				.catch(err => {
					client.release()
					console.log(err.stack)
					reject(err);
				})
			});
	});
}


app.get('/qfind', function(req, res){
	var qry = req.query.q;
	var sort = req.query.s;
	var lim = req.query.l;
	var ofs = req.query.o;

	var f = async function(qry,so,l,ofs) {
		var cur = await qS(qry,so,l,ofs);
		if ( cur == null ) {
			res.send('ERROR ');	
		} else {
			res.send(cur);	
		}
	}
	f(qry,sort,lim,ofs);
});

app.get('/qGuids', function(req, res){
	var guids = req.query.guids;
	var sort = req.query.s;
	var lim = req.query.l;
	var ofs = req.query.o;

	var f = async function(guids,so,l,ofs) {
		var cur = await getGuids(guids,so,l,ofs);
		if ( cur == null ) {
			res.send('ERROR ');	
		} else {
			res.send(cur);	
		}
	}
	f(guids,sort,lim,ofs);
});

app.get('/qNew', function(req, res){

	var lim = req.query.l;
	var ofs = req.query.o;

	var f = async function(l,ofs) {
		var cur = await getNew(l,ofs);
		if ( cur == null ) {
			res.send('ERROR ');	
		} else {
			res.send(cur);	
		}
	}
	f(lim,ofs);
});


app.get('/qa', (request, response) => { 

	var qry = request.query.qry;
	var sort =  request.query.sortby;
	var lim =  request.query.limit;
	var ofs =  request.query.offset;

	console.log(qry + ' ' + sort + ' ' + lim + ' ' + ofs);
	console.log(JSON.stringify( request.query));
    response.send(qry);

});


app.listen(port, () => {
  console.log('Startup  ' + Path + ':' + port);
});
