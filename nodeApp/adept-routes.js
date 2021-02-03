/* Adept */

var express = require('express');
var router = express.Router();
var crypto = require('crypto');
var  Path = process.env.NODE_PATH;
const pg = require('pg');
const connectionString = '@'
const client = new pg.Client(connectionString);
client.connect();

var request = require('request');

var qbUrl = 'http://127.0.0.1:8082/query?q=';
var gdUrl = 'https://xdddev.chtc.io/api/v1';

// Authentication

var gAdeptKey = [];
var gNACL = '@';

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


async function testpool(q) {
	// this example uses pg-pool service
	var sqlStr = 'Select * from mdview2 where version_id=1000';

	console.log('test '+ encodeURI(sqlStr) );
	var z = await dbCall(sqlStr);
    return z;

}

async function createUser(uo) {
  
	console.log('a');

	var tdate = Date.now();
	var pwh = sha512(uo.pw,gNACL);
	console.log('b');
	var sqlStr = 'insert into adept.users (user_id, first_name, last_name, email,'
				+ 'org_name, purpose, apikey, role_id,'
				+ 'auth_app, created, password, user_name, state) values '
				+ ' (nextval(\'adept.adept_user_id\')'
				+ ',\'' + uo.fname + '\''
				+ ',\'' + uo.lname + '\''
				+ ',\'' + uo.em + '\''
				+ ',\'' + uo.org + '\''
				+ ',\'' + uo.purp + '\''
				+ ',\'' + gNACL + '\''
				+ ',1'
				+ ',\'adept\''
				+ ',current_timestamp'
				+ ',\'' + pwh.passwordHash + '\''
				+ ',\'' + uo.uname + '\''
				+ ',\'active\')';

	console.log(' sql ' + sqlStr);
	var z = await dbCall(sqlStr);
	return z;

  }

async function dbCall(s) {
	//using pgPool
	var qUrl =  qbUrl + s; //encodeURI(s);
	

	var qr = require('request');
	var body = '';
	return new Promise(function(resolve, reject){
		
		try {
			qr.get(qUrl)
			.on ('response',function(response) {         		
			})
			.on ('data', function(chunk) {
				body += chunk;
			}).on ('end', function() {
				
				resolve(body);
			}).on ('error', function(err) {

				reject('db call error '+err);
			});	
		} catch(e) {
			reject('db error '+e);
		}
	});

}

async function fetchAuth(u,p,s ) {

	var sqlStr = 'select user_id, first_name, last_name, user_name, apikey, role_id, password '
				+ ' from adept.users where email = \'' 
				+ u + '\' and password = \'' + p + '\' order by 1'; 
	
	try {
		var z = await dbCall(sqlStr);
		
		return z;
	} catch(e) {
		return e;
	}
	


}

async function getDict(type) {
	
	console.log('here');

	var s = 'select dict_id, dict_name as name, base_class as base_classification, dict_source as source, '
			+'case_sensitive, last_updated from adept.dictionaries where filter_flag = \'true\'';
	
	var z = await dbCall(s);
	
	if (typeof(z) == "object" ) {
		var b = z;
	} else {
		var b = JSON.parse(z);
	}
	var dx = {};
	dx.success = {};
	
	if ( b.rows ) {
		dx.success.data =  b.rows;
		return dx;
	} else {
		return b;
	}


}

async function getLocalDict(u) {

	var s = 'select * from adept.user_dictionaries where user_id ='+u;
	try {
		var z = await dbCall(s);
		
		if (typeof(z) == "object" ) {
			var b = z;
		} else {
			var b = JSON.parse(z);
		}
		var dx = {};
		dx.success = {};
		
		if ( b.rows ) {
			dx.success.data =  b.rows;
			return dx;
		} else {
			return b;
		}
		//return z;
	} catch(e) {
		return e;
	}
}

async function fetchProcessLog(u) {

	var s = 'select * from adept.process_activity where user_id ='+u;
	try {
		var z = await dbCall(s);
		if (typeof(z) == "object" ) {
			var b = z;
		} else {
			var b = JSON.parse(z);
		}
		var dx = {};
		dx.success = {};
		
		if ( b.rows ) {
			dx.success.data =  b.rows;
			return dx;
		} else {
			return b;
		}
	} catch(e) {
		return e;
	}
}

async function fetchUserApps(u) {

	var s = 'select * from adept.user_applications where user_id ='+u;
	console.log(s);
	try {
		var z = await dbCall(s);
		if (typeof(z) == "object" ) {
			var b = z;
		} else {
			var b = JSON.parse(z);
		}
		var dx = {};
		dx.success = {};
		
		if ( b.rows ) {
			dx.success.data =  b.rows;
			return dx;
		} else {
			return b;
		}
	} catch(e) {
		return e;
	}
}

async function fetchTestSets(u) {

	var s = 'select * from adept.test_sets where user_id ='+u;
	try {
		var z = await dbCall(s);
	
		if (typeof(z) == "object" ) {
			var b = z;
		} else {
			var b = JSON.parse(z);
		}
		var dx = {};
		dx.success = {};
		if ( b.rows ) {
			dx.success.data =  b.rows;
			return dx;
		} else {
			return b;
		}
		//return z;
	} catch(e) {
		return e;
	}
}

async function fetchCollections(u) {

	var s = 'select * from adept.collectionset('+u+')';
	try {
		var z = await dbCall(s);
	
		if (typeof(z) == "object" ) {
			var b = z;
		} else {
			var b = JSON.parse(z);
		}
		var dx = {};
		dx.success = {};
		if ( b.rows ) {
			dx.success.data =  b.rows;
			return dx;
		} else {
			return b;
		}

	} catch(e) {
		return e;
	}
}


async function newCollection(u,c) {

	var s = 'insert into adept.collections (col_name, col_type, user_id, proc_state, share_state, state, created) '
			+ ' values (\'' + c + '\',\'user\','+u+',\'new\',\'none\',\'active\',current_timestamp)';
	console.log(s);

	try {
		var z = await dbCall(s);
	
		if (typeof(z) == "object" ) {
			var b = z;
		} else {
			var b = JSON.parse(z);
		}
		var dx = {};
		dx.success = {};
		if ( b.rows ) {
			dx.success.data =  b.rows;
			return dx;
		} else {
			return b;
		}

	} catch(e) {
		return e;
	}
}

async function createNewLocalDict(user_id,dn) {
	var s = 'INSERT INTO adept.user_dictionaries (did, dict_id, user_id, proc_state, source, filter_flag, state, name)'
			+ ' VALUES (nextval(\'adept.dict_seq_id\'), 0,'+user_id+', \'new\', \'local\',\'true\', \'active\',\''+dn+'\')';

	console.log(s);

	try {
		var z = await dbCall(s);
	
		if (typeof(z) == "object" ) {
			var b = z;
		} else {
			var b = JSON.parse(z);
		}
		var dx = {};
		dx.success = {};
		if ( b.rows ) {
			dx.success.data =  b.rows;
			return dx;
		} else {
			return b;
		}

	} catch(e) {
		return e;
	}

}

async function addSearchToCollection(i, t, u, c) {
    // col_id, terms, url, count
	var s = 'insert into adept.collection_search (col_id, col_desc, search_url, state, rec_count) '
			+ ' values ('+i+',\''+t+'\',\''+u+'\',\'active\','+c+')';
	console.log(s);

	return new Promise(function(resolve, reject){
		client.query(s, (err, res) => {
			  if ( typeof(res) !== "undefined" ) {
			  	resolve(JSON.stringify(res));
			  } else {
				console.log('err '+err);
				reject("error noodle");	  	
			  }
		});
		     
	});

}

async function delCollection(c) {
	if ( c ) {
		var s = 'select * from adept.deleteCollection ('+c+')';
		console.log(s);
		try {
			var z = await dbCall(s);
			if (typeof(z) == "object" ) {
				var b = z;
			} else {
				var b = JSON.parse(z);
			}
			var dx = {};
			dx.success = {};
			if ( b.rows ) {
				dx.success.data =  b.rows;
				return dx;
			} else {
				return b;
			}
	
		} catch(e) {
			return e;
		}
	}
	
	
}
async function addRecordToCollection(i, d) {
    // col_id, doi
	var s = 'insert into adept.collection_records (col_id, ident, itype, state) '
			+ ' values ('+i+',\''+d+'\',\'doi\',\'active\')';
	console.log(s);

	try {
		var z = await dbCall(s);
	
		if (typeof(z) == "object" ) {
			var b = z;
		} else {
			var b = JSON.parse(z);
		}
		var dx = {};
		dx.success = {};
		if ( b.rows ) {
			dx.success.data =  b.rows;
			return dx;
		} else {
			return b;
		}

	} catch(e) {
		return e;
	}
}

async function loadDict() {
	// tool for fetching dictionaries from gdd
	
	function dbProc(b) {
        console.log('dbproc ');
        if ( b.data ) {
			var da = b.data;
			console.log('dbproc loop ');
			for (k in da) {
				var dict = da[k];
				var s = 'insert into adept.dictionaries (dict_id,dict_name,base_class,case_sensitive,'
						+ 'last_updated,dict_source,filter_flag,state) values ('
						+ dict.dict_id + ',\'' + dict.name + '\',\'' + dict.base_classification + '\',\''
						+ dict.case_sensitive + '\',\'' + dict.last_updated + '\',\'' + dict.source
						+ '\',\'false\',\'active\')';
				if ( k == 0 ) { console.log('sql ' + s)}
				var drb = dbCall(s);
			}
		}
		return 'success';	
	}
    

	var dUrl = gdUrl + '/dictionaries?all';
	console.log(dUrl);
	var qd = require('request');
	var body = '';
	return new Promise(function(resolve, reject){
		qd.get(dUrl)
		.on ('response',function(response) {         		
		})
		.on ('data', function(chunk) {
			body += chunk;
		}).on ('end', function() {
			console.log('retrieved' + body);
			if (typeof(body) == "object" ) {
				console.log('typeo');
				var b = body;
			} else {
				var b = JSON.parse(body);
			}

			if ( b.success ) {
					console.log('success');
				try {
					resolve(dbProc(b.success));	
					//resolve(k);
				} catch {
					reject('error');
				}
			} else {
				reject('error');
			}		
		});		 
	});
}

router.get('/', async function(req, res) {
   var lp = '/adept';
   routelog(req, lp);
   res.sendFile(Path+'/public/adept-ssl.htm');
});

router.get('/test', async function(req, res) {
  
   var lp = '/adept/test';
   routelog(req, lp);
   var z = await testpool('x');
   if ( z == null) {
			res.send('No response');	
		} else {
			res.send(z);	
		} 
   
});

router.get('/getToken', async function(req, res) {

	var lp = '/adept/getToken';
	routelog(req, lp);
	var quark = req.query.q;
	var lib = req.query.p;

  	var pwh = sha512(lib,'***');
 
  
  var px = await fetchAuth(quark, pwh.passwordHash, pwh.salt);
  
  if ( typeof(px) !== "object" ) {
	px = JSON.parse(px);
  }

  if ( px ) { 

	if ( px.rows.length > 0 ) {
		var dres = px.rows; 
		var kv = dres[0];

		var authtoken = 'A'+kv.apikey.substr(0,6) + 'E' + kv.password.substr(0,12); 
		console.log(' atk ' + authtoken);
		gAdeptKey.push(authtoken);
		var cms = {};

		cms.authtoken  = authtoken;
		cms.kv = authtoken;
		cms.agentrole = kv.role_id;
		cms.user_id = kv.user_id;

		res.send(cms);
	} else {
		res.send('{"token": "Not authorized"}');	
	}
  
  } else {
	  res.send('{"token": "Not authorized"}');	
  } 

  
});

router.get('/getUsers', async function(req, res ) {
	var lp = '/getUsers';
	routelog(req, lp);

	utoken = req.query.t;
	var vex = gAdeptKey.indexOf(utoken);
   
	if ( vex >= 0 ) {	
		var cur = await fetchUsers(utoken);
		if ( cur == null) {
			res.send('No response');	
		} else {
			res.send(cur);	
		}    
	}
  
});

router.get('/createUser', async function( req, res ) {
	// registration
	var lp = '/adept/createUser';
	routelog(req, lp);

	var u = {};
	u.fname = req.query.f;
	u.lname = req.query.l;
	u.uname = req.query.u;
	u.pw = req.query.p;
	u.token = req.query.t;
	u.org = req.query.o;
	u.purp = req.query.d;
	u.em = req.query.em;
	u.rp = req.query.a;
  
	console.log('cu '+JSON.stringify(u));


	try {
		var cur = await createUser(u);
		res.send(cur);
	} catch(err) {
		res.send('User Created - not so much '+err);	
	}
	
});

router.get('/getFilteredDictionaries', async function( req, res) {
	var lp = '/adept/getFilteredDictionaries';
	routelog(req, lp);

	var type = req.query.t;
	if ( !type ) { type = 'all'; }
	console.log(' test ' + type);

	var cur = await getDict(type);
	if ( cur == null) {
		res.send('No response');	
	} else {
		res.send(cur);	
	} 

});

router.get('/getLocalDictionaries', async function( req, res) {
	var lp = '/adept/getLocalDictionaries';
	routelog(req, lp);

	var token = req.query.t;
	var user_id = req.query.u;

	
	if ( gAdeptKey.includes(token) ) {
		var cur = await getLocalDict(user_id);
		if ( cur == null) {
			res.send('No response');	
		} else {
			res.send(cur);	
		} 
	} else {
		res.send('Not authorized');	
	}	

});

router.get('/getProcessLog', async function( req, res) {
	var lp = '/adept/getProcessLog';
	routelog(req, lp);

	var token = req.query.t;
	var user_id = req.query.u;
	
	if ( gAdeptKey.includes(token) ) {
		var cur = await fetchProcessLog(user_id);
		if ( cur == null) {
			res.send('No response');	
		} else {
			res.send(cur);	
		} 
	} else {
		res.send('Not authorized');	
	}	

});

router.get('/getUserApps', async function( req, res) {
	var lp = '/adept/getUserApps';
	routelog(req, lp);

	var token = req.query.t;
	var user_id = req.query.u;

	console.log(' t' + token + ' ' + JSON.stringify(gAdeptKey));
	
	if ( gAdeptKey.includes(token) ) {
		var cur = await fetchUserApps(user_id);
		if ( cur == null) {
			res.send('No response');	
		} else {
			res.send(cur);	
		} 
	} else {
		res.send('Not authorized');	
	}	

});

router.get('/getLocalDicTerms', async function( req, res) {
	var lp = '/adept/getLocalDicTerms';
	routelog(req, lp);

	var token = req.query.t;
	var user_id = req.query.u;
	var dict_id = req.query.dict_id;

	if ( gAdeptKey.includes(token) ) {
		var cur = await getLocalDicTerms(dict_id);
		if ( cur == null) {
			res.send('No response');	
		} else {
			res.send(cur);	
		} 
	} else {
		res.send('Not authorized');	
	}	

});


router.get('/getTestSets', async function( req, res) {
	var lp = '/adept/getTestSets';
	routelog(req, lp);

	var token = req.query.t;
	var user_id = req.query.u;

	if ( gAdeptKey.includes(token) ) {
		var cur = await fetchTestSets(user_id);
		if ( cur == null) {
			res.send('No response');	
		} else {
			res.send(cur);	
		} 
	} else {
		res.send('Not authorized');	
	}	
});


router.get('/getCollections', async function( req, res) {
	var lp = '/adept/getCollections';
	routelog(req, lp);

	var token = req.query.t;
	var user_id = req.query.u;

	if ( gAdeptKey.includes(token) ) {
		var cur = await fetchCollections(user_id);
		if ( cur == null) {
			res.send('No response');	
		} else {
			res.send(cur);	
		} 
	} else {
		res.send('Not authorized');	
	}	

});

router.get('/newCollection', async function( req, res) {
	var lp = '/adept/newCollection';
	routelog(req, lp);

	var token = req.query.t;
	var user_id = req.query.u;
	var cn = req.query.c;
	
	
	if ( gAdeptKey.includes(token) ) {
		var cur = await newCollection(user_id,cn);
		if ( cur == null) {
			res.send('No response');	
		} else {
			res.send(cur);	
		} 
	} else {
		res.send('Not authorized');	
	}	

});

router.get('/newLocalDictionary', async function( req, res) {
	var lp = '/adept/newLocalDictionary';
	routelog(req, lp);

	var token = req.query.t;
	var user_id = req.query.u;
	var dn = req.query.d;
	
	
	if ( gAdeptKey.includes(token) ) {
		var cur = await createNewLocalDict(user_id,dn);
		if ( cur == null) {
			res.send('No response');	
		} else {
			res.send(cur);	
		} 
	} else {
		res.send('Not authorized');	
	}	

});
router.get('/newSearchInCollection', async function( req, res) {
	var lp = '/adept/newSearchInCollection';
	routelog(req, lp);

	var token = req.query.t;
	var url = req.query.u;
	

	var term = req.query.d;
	var colid = req.query.i;
	var count = req.query.c;

	console.log('url '+url);
	
	if ( gAdeptKey.includes(token) ) {
		var cur = await addSearchToCollection(colid, term, url, count);
		if ( cur == null) {
			res.send('No response');	
		} else {
			res.send(cur);	
		} 
	} else {
		res.send('Not authorized');	
	}	

});

router.get('/deleteCollection', async function( req, res) {
	var lp = '/adept/deleteCollection';
	routelog(req, lp);

	var token = req.query.t;
	var uid = req.query.u;
	var cid = req.query.c;

	if ( gAdeptKey.includes(token) ) {
		var cur = await delCollection(cid);
		if ( cur == null) {
			res.send('No response');	
		} else {
			res.send(cur);	
		} 
	}


});

router.get('/newRecordInCollection', async function( req, res) {
	var lp = '/adept/newRecordInCollection';
	routelog(req, lp);

	var token = req.query.t;
	var doi = req.query.d;
	var colid = req.query.i;

	
	if ( gAdeptKey.includes(token) ) {
		var cur = await addRecordToCollection(colid, doi);
		if ( cur == null) {
			res.send('No response');	
		} else {
			res.send(cur);	
		} 
	} else {
		res.send('Not authorized');	
	}	

});
router.get('/loadDictionaries', async function( req, res) {
	var lp = '/adept/loadDictionaries';
	routelog(req, lp);
	var cur = await loadDict();
	res.send(cur);

});

module.exports = router;


