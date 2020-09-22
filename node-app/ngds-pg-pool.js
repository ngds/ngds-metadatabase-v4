/* Search engine optimization using pooling directly
   G. Hudman
   Aug 19, 2020
*/

const  {Pool} = require('pg');
const pool = new Pool({
	user: 'ngdsdb',
	host: 'localhost',
	database: 'geothermal',
	password: '',
	port: 5432,
	max: 25
  });

const  connectionString = 'xxx';

pool.on('error', (err, client) => {
	console.error('Unexpected error on idle client', err)
	process.exit(-1)
  })

require('dotenv').config();
const port = 8082;
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

async function getQuery(q) {
	console.log('f ' + q);

	return new Promise(function(resolve, reject) {
		pool.connect()
			.then(client => {
				return client
				.query(q)
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

app.get('/query', function(req, res){
	var q = req.query.q;
	var f = async function(q) {
		var cur = await getQuery(q);
		if ( cur == null ) {
			res.send('ERROR ');	
		} else {
			res.send(cur);	
		}
	}
	f(q);
});

app.listen(port, () => {
  console.log('Startup  ' + Path + ':' + port);
});
