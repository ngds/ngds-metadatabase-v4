var tx = function () {
	return "Success";
}

var RefObj,
    rtnObj = {},
    reflag = true,
    lim = 0,
    rPath = "";

var schemaBuild = function (src) {
	var recIdx,
	    kx,
	    iB = {},
		BldObj = {},
		rB = {};

	if (typeof(src.definitions) != "undefined" ) {
		RefObj = $.extend(true, [], src.definitions );
		delete src.definitions;
	}
	//BldObj = altZ(src, recIdx, BldObj, rPath);
	BldObj = deRef(src, kx);
    rB = altZ(BldObj, recIdx, iB);
	return rB;

}


function altX (src, recIdx, BdO ) {

	recIdx = recIdx || [];
	if ( typeof(src.name) != "undefined" && src.name != "null" ) {
		BdO.name = src.name;
	} else {
		BdO.name = "root";
	}

	if (typeof(src.type) != "undefined" ) {
		BdO.datatype = src.type;
	}

    /* mite need
	for (var property in object) {
    if (object.hasOwnProperty(property)) {
        // do stuff
    	}
	}
	*/
    var cI = true;
	for (itm in src ) {
		var sub = src[itm];
		if ( cI )  {
			BdO.children = [];
			cI = false;
		}
		var bX = {};
		bX.name = itm;
		if (typeof(sub) == "object" ) {
			bx = altX(sub, recIdx, bX);
			bX.name = itm;
		} else {
			bX.datatype = sub.type;
			bX.ref = "";
		}
		
		BdO.children.push(bX);
	}
	return BdO;
}

function process(key,value) {
	if ( typeof(value) !== "object") {
		 console.log(key + " : is an object ");	
	} else {
 	   console.log(key + " : "+value);
	}
}

var deep_value = function(obj, path){
    for (var i=0, path=path.split('.'), len=path.length; i<len; i++){
        obj = obj[path[i]];
    };
    return obj;
};

function traverse(o,kx, rj) {
	kx = kx || [];

    for (var i in o) {
    	
    	if (i == "$ref" ) {
    		var mx = deep_value(rj, kx );
    		//var newX = mx.$ref;
			var sO = o[i];
        	if ( sO !== null & sO.length > 1 ) {
	        	var sRef = o[i].split('/');
				var nRef = sRef[sRef.length-1];
				console.log('flipped' + i + nRef);
				var zigbee = fRefObj(nRef, RefObj ); 
				mx[nRef] = zigbee;
				delete mx.$ref;
				reflag = true;
                //newX.put(nRef, newX.remove("$ref"));
               // newX = zigbee;
				//mx = zigbee;
				//i = nRef;
				lim++;
    	
    			console.log(i + ' count ' + lim + ' ' + kx);
	
        	}
				//$.extend(o, {nRef, zigbee });
    		

    	}
    	
    	//var myO = o[i];
    	//$.extend(rtnObj, {i : myO });
    	//rtnOb[i] = o[i];

        if (o[i] !== null && typeof(o[i])=="object") {
            //going on step down in the object tree!!
            if ( kx.length > 1 ) { var fullkey = kx.toString() + '.' + i } else { fullkey = i }
            o[i] = traverse(o[i],fullkey, rj);
        }
    }

}


function deRef( src, kx )
{
	var lx = 0;
	rtnObj = $.extend(true, {}, src );
    reflag = true;
    
	while ( reflag ) {
		lx++;
		reflag = false;
		var kx =[];
		if ( lx < 3 ) { 
			traverse(src, kx, rtnObj);
			src = {};
			src = $.extend(true, {}, rtnObj );
		} else {
		
		  reflag = false }
		
	}
	
	return rtnObj;
}

function deRef2(src, kx ) {
	lim++;
	//if ( lim % 1000 ) { console.log(' coint ' + lim) }
	kx = kx || [];
		if (typeof(src.$ref) != "undefined" ) {
			var sRef = src.$ref.split('/');
			var nRef = sRef[sRef.length-1];
			var newSub = fRefObj(nRef, RefObj );
			console.log(' source ref ' + nRef);
			src = newSub;

		}

		if (typeof(src.properties) != "undefined" && typeof(src.properties) == "object" ) {
			var props = src.properties;
			if (typeof(props.$ref) != "undefined" ) {
					var sRef = props.$ref.split('/');
					var nRef = sRef[sRef.length-1];
					src.properties = fRefObj(nRef, RefObj ); //
					//src.properties = deRef(src.properties, kx.concat(nRef) );

			}
			for (childprop in src.properties) {
				var tc = props[childprop];
				if (typeof(tc) != "undefined"  && typeof(tc.$ref) != "undefined" ) {
					var sRef = tc.$ref.split('/');
					var nRef = sRef[sRef.length-1];
					src.properties[childprop] = fRefObj(nRef, RefObj );
					//src.properties[childprop] = deRef(src.properties[childprop] , kx.concat(childprop) );
					
				} else {
					if ( typeof(tc) == "object" ) {
						console.log(' prop ' + childprop);
						src.properties[childprop] = deRef(tc, kx.concat(childprop) );
					}	
				}		
			}
		} else 
			if (typeof(src.items) != "undefined" && typeof(src.items) == "object" ) {
			var itms = src.items;
			if (typeof(itms.$ref) != "undefined" ) {
					var sRef = itms.$ref.split('/');
					var nRef = sRef[sRef.length-1];
					src.items = fRefObj(nRef, RefObj );
					//src.items = deRef(src.items, kx.concat(nRef) );
			}
			for (childitm in src.items) {
				var tc = itms[childitm];
				if (typeof(tc) != "undefined" &&  typeof(tc.$ref) != "undefined" ) {
					var sRef = tc.$ref.split('/');
					var nRef = sRef[sRef.length-1];
					src.items[childitm] = fRefObj(nRef, RefObj );
					//src.items[childitm] = deRef(src.items[childitm], kx.concat(childitm) );
				} else {
					if ( typeof(tc) == "object" ) {
						console.log(' item ' + childitm);
						src.items[childitm] = deRef(tc, kx.concat(childitm) );
					}
				}
			}
		} else 
			if (typeof(src) == "object" ) {
				for (childsrc in src) {
					var tc = src[childsrc];
					if (typeof(tc) == "object") {
						console.log(' obj ' + childsrc);
						src[childsrc] = deRef(tc, kx.concat(childsrc) );	
					}
					
				}
		}

	return src;

}


function altZ (src, recIdx, BdO ) {

	if (!recIdx) {
		BdO.name = "root";
		BdO.ref = "";
		BdO.display = "MetaData Editor";
		BdO.root = "";
		BdO.rootType = "object";
		BdO.titleref = "";
		BdO.xoffset = 300;
	} else {
		BdO.value = "";
		BdO.xoffset = 300;	
		BdO.ref = recIdx.join('.');
	}

	recIdx = recIdx || [];

	var nParent='';
	if (typeof(recIdx) != "undefined" & typeof(recIdx.length) != "undefined" & recIdx.length > 1 ) {
		nParent = recIdx[recIdx.length-1];
	} else {
		nParent = recIdx[0];
	}
	
	if (typeof(src.type) != "undefined" ) {
		BdO.datatype = src.type;
	}
	
	
	if (typeof(src.minItems) != "undefined" ) {
		if ( src.minItems > 0 )	{ BdO.required = "true" }
	}
    

	if (typeof(src.properties) != "undefined" && typeof(src.properties) == "object" ) {
		var childrens = src.properties;
		if (!BdO.children) { BdO.children = []; }

			for (child in childrens) {
				var sub = childrens[child];
				var bX = {};
				bX.name = child;

					if ( sub.type ) {
						bX.datatype = sub.type;
					}	
					bX = altZ(sub, recIdx.concat(child), bX);	
					
				BdO.children.push(bX);

			}

	}

	if (typeof(src.items) != "undefined" && typeof(src.items) == "object" ) {
		var childrens = src.items;
		if (!BdO.children) { BdO.children = []; }
	    // headless property node 
		if ( childrens.properties ) { 
			var bX = {};
			bX.name = 'properties';
			if ( childrens.type ) {
				bX.datatype = childrens.type;
			}	
			bX = altZ(childrens, recIdx.concat('properties'), bX);	
			BdO.children.push(bX);

		} else {

			var cx = Object.keys(childrens).length;
			var sObj = {};
			for (child in childrens) {
				if ( typeof(childrens[child]) != "object" ) {
					sObj.name = nParent;
					sObj.ref = recIdx.join('.');
					sObj.xoffset = 300;
					if ( child == 'type') { sObj.datatype = childrens[child]; }

				} else {
					var sub = childrens[child];
					var bX = {};
					bX.name = child;
						if ( sub.type ) {
							bX.datatype = sub.type;
						}	
						bX = altZ(sub, recIdx.concat(child), bX);	
						
					BdO.children.push(bX);
				}

			}

			if ( Object.keys(sObj).length > 0 ) {
				BdO.children.push(sObj);
			}
		}
		
	}

   /* not working
	if (typeof(src) == "object" ) {

		for ( itm in src ) {
			if (typeof(src[itm]) == "object" ) {
				var bX = {};
				bX.name = itm;
				if ( src[itm].type ) {
					bX.datatype =  src[itm].type;
				}
				bX = altZ(src[itm], recIdx.concat(itm), bX);	
				if (!BdO.children) { BdO.children = []; }
				BdO.children.push(bX);
				
			}
			
		}

	}
	*/

	return BdO;
}

function RefHandler(rLong, recIdx, RefObj) {
		var tip = rLong.split('/');
		var newSub = fRefObj(tip[tip.length-1], RefObj );
		var bRef = {};
		bRef.name = tip[tip.length-1];

		bRef = altZ(newSub, recIdx, bRef);
		return bRef;

		//if (!BdO.children) { BdO.children = []; }
		//BdO.children.push(bRef);

}

function fRefObj(rLookup, RefObj) {

	var rn = {};
	for (ref in RefObj) {
		if ( ref == rLookup ) {
			rn = RefObj[ref];
			return rn;
		}
	}
	return rn;

}
