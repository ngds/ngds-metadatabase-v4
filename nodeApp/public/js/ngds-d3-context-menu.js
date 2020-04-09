/* D3-content-menu provides edit handling in the right click pop up for various data types
   and saves them back to the d3 tree structure 
   G. Hudman April 8, 2016
   Production update - Nov 21 - bbox improvements

*/

var rexedit,
    dJson = {},
    trail,
    found,
    CM = [],
    tmpIdx,
    cEdObj = [],
    CMloaded = false,
    taPick = false,
    map,
    gll = [{'lat' : 0, 'lng': 0}, {'lat' : 0, 'lng' : 0}, {'lat' : 0, 'lng' : 0}], 
    gLG,
    gRect,
    gExt = [],
    gPre ="",
    gBBMagicKey;

// Load a Data Dictionary for select lists

var dictJson = d3.json("../jsonSchemas/jsonDictionary.json", function(error, json) {
    if (error) {
        console.log(" error" + error);
        return; }
    dJson = json;
});

function travObj(obj, fp, upPath, upState, uLevel  ) {
// assuming trav is for new objects only

  if (!uLevel) { uLevel = 0 }

  var result = "";
  if( typeof(obj) == "object" ) {

      var kState;
	  var kS = true;
	  var uRev = false;
      $.each(obj, function(k, v) {
        	
        var isNum = /^\d+$/.test(k);       
        if ( isNum ) {	
		    if ( kS ) {
				uLevel++;
				kS = false;
			}
			
			( kState ) ? kState = k : kState = -1; 
			if ( uLevel == 1 ) { 
				
				kState = -1;
			}
        } else {
			kState = k;		
		}

		var pK = fp + '.' + kState ;
		var uk = upPath + '.' + kState;
		
        travObj(v, pK, uk, upState, uLevel);
		upState = true;
		
    
      });
	  if ( !kS ) {
		uLevel--;  
	  }
	  
  } else { 
     // If its new item in array, use -1 index 
     // Once an object has been inserted, then set the updstate flag 
     // so all other leafs in the object use the actual index

      if ( upState ) {
         var resPath = upPath;
      } else {
         resPath = fp;
 
      }
      var cev = { 'path' : resPath, 'value' : obj };
      cEdObj.push(cev);
      
      console.log(' endpoint ' + resPath + ' value ' + obj);    
  
  }
  return result;
  
}

var cin_editObjBld = function(ejo, newVal, action,sibs) {
    // Modified 3/21 new diff object matches USGIN lineage
    
    if ( ejo ) {

        var amINew = true;
        if (  gCinEditSession.item ) {
          var EdA = gCinEditSession.item.metadataUpdates;
        } else {
          EdA = gCinEditSession.metadataUpdates;
        }
        
        if ( !EdA ) { 
            var initMU = { "UpdateSequenceNo" : 0 }
            console.log(' init MU ');
        }
        
        if ( ejo.datatype == 'validateonly' && ejo.newValidation == "true" ) {
           // New validation - override action
           gCinEditIdx++;
           var ej = { "UpdateSequenceNo" : gCinEditIdx };
           ej.updatePath = ejo.RefSaveTo + '.validation';
           // ej.type = 'insert'; -- per burak 2/14
           ej.type = 'update';
           ej.name = ejo.name;
           ej.oldValue = "";
           ej.newValue = newVal;
           EdA.push(ej);
           action = "no action";
        }
         
        if ( action == 'insertPath' ) {
            
                for (var k = 0; k < cEdObj.length; k++) {
                  gCinEditIdx++;
                  var cEP = cEdObj[k];
                  var ej = { "UpdateSequenceNo" : gCinEditIdx }; 
                  ej.type = 'insert';
                  ej.name = ejo.name; 
                  ej.newValue = cEP.value;
                  ej.insertPath = cEP.path;
                  ej.oldValue = "";
                  EdA.push(ej);
                }
                cEdObj = [];        
        }
            
        if ( action == 'updatePath' || action == "deletePath" ) {
            gCinEditIdx++;
            var ej = { "UpdateSequenceNo" : gCinEditIdx };
            
            // ej.jsonPath = ejo.ref;
            ej.oldValue = ejo.value;
            ej.newValue = newVal;
            ej.name = ejo.name;
            if ( ejo.RefSaveTo ) {
                var refer = ejo.RefSaveTo;
            } else { 
                if ( Array.isArray(ejo.ref) ) {        //fix this need to ensure refSaveTo is always filled out for array refs
                    refer = ejo.ref[0];
                } else {
                    refer = ejo.ref;  
                }
            }
               
            if ( action == 'updatePath') {          
               
                if ( ejo.datatype == 'validateonly' && ejo.newValidation != "true") {
                    ej.updatePath = refer + '.validation';
                } else { 
                  ej.updatePath = refer;
                }
                
                ej.type = 'update';
                ej.newValue = newVal;   
                ej.originalValue = ejo.oldValue;
                
            }
            
            if ( action == 'deletePath') {
                ej.type = 'delete';
                ej.deletePath = refer;
                ej.originalValue = ejo.oldValue;
            }
            EdA.push(ej);
        }
        listEditStack();
    }

} 



// works for Arrays only 
// call from menus

function newSrc3 (dob, copyKey, action) {

    var lob = gCKAN_package;
    cEdObj = [];
    
    if ( dob.SourceRef ) {
        var mPath = dob.SourceRef;
        var saPath = dob.ref;
    
    } else if ( dob.RefSaveTo ) {
        var mPath = dob.RefSaveTo;
        var saPath = dob.ref;
    
     } else if ( dob.baseRef ) {
        var mPath = dob.baseRef;
        
    
    } else if ( (Array.isArray( dob.ref) ) ) {
        for (v =0;  v < dob.ref.length; v++ ) {
            var tk = dob.ref[v];
            if ( jPathValidate(lob, tk) ) {
                mPath = tk;
            }
        }

        // doesnt exist so find the valid parent path 

        if ( typeof(mPath) == "undefined" ) {
            for (v =0;  v < dob.ref.length; v++ ) {
                var tk = dob.ref[v];
                var tak = tk.split('.');
                var tkey = tak[tak.length - 1];

                tak.pop();
                var ntk = tak.join();

                if ( jPathValidate(lob, ntk) ) {
                    mPath = tak;
                    var newObj = { tkey : ""};
                }
            }            

        }
        
        if ( typeof(mPath) == "undefined" ) {
            mPath = dob.ref[0];
        }

    } else {
        mPath = dob.ref;
    }
    var kPath = mPath;
    mPath = mPath.split('.');
    var mPlen = mPath.length;
    var lzPath = mPath.slice(0);
    
    if ( saPath ) { 
      saPath = saPath.split('.');
    }

    // drill down to the copy point

    for (z=0; z < mPlen; z++) {
        var top = mPath.shift();
        if (lob.hasOwnProperty(top) ) {

            if ( z == (mPlen - 1)  ) {            
                lob = lob[top];

                if ( lob[copyKey] ) {
                   
                    var lObj = jQuery.extend({}, lob[copyKey]);
                    var cloneObj = clone(lObj,action);
                    
                    if ( Array.isArray(lob) ) {             
                        lob.push(cloneObj); 
                        var newItem = lob[lob.length-1];
                        var upPath = kPath + '.' + (lob.length-1).toString();
                        kPath = kPath + '.-1';
                        var rI = travObj(newItem, kPath, upPath, false);
                                              
                    } else {
                        lob[copyKey+'cc'] = cloneObj;
                       
                    }
                 } else if ( copyKey == '0' ) {
                    //it mite be lazy !
                    
                    var lObj = jQuery.extend({}, lob );
                    var cloneObj = clone(lObj,"preserve");
                    var clone2 = clone(lObj,action);
                    // Create a new array, make a duplicate since existing object will be replaced with array
                    var tc = [];
                    tc.push(cloneObj);
                    tc.push(clone2);
              
                    var gC = gCKAN_package;

                    for (lx=0; lx < mPlen; lx++) {
                        var t = lzPath.shift();
                         if ( lx == (mPlen - 1)  ) { 
                            gC[t] = tc;
                            var newI = gC[t];
                            var upPath = kPath + '.1';  // For a lazy array conversion new element is always 1
                            kPath = kPath + '.-1';

                            var rI = travObj(newI[1], kPath, upPath, false);
                        } else {
                            gC = gC[t];
                        }

                   }
                 } 
            } else if ( top == copyKey ) {
               // in a sub array object - might not be an endpoint but need to copy object
               
               var satob = lob;
               lob = lob[top];
               var tsp = saPath[0];
               
               if ( lob.hasOwnProperty(tsp) ) { 
                    var lObj = jQuery.extend({}, lob );
                    var cloneObj = clone(lObj,action);
                    
                    satob.push(cloneObj);
                    
                    var kA = kPath.split('.');
                    
                    while ( kA.length > z ) {
                      kA.pop();
                    }
                    var newI = satob[satob.length-1];
                    var upPath = kA.join('.') + '.' + (satob.length-1).toString();
                    kPath = kA.join('.') + '.-1';
                    var rI = travObj(newI, kPath, upPath, false);
                    break;        
               
               }
                   
            } else {
                 lob = lob[top];
            }
        } else if ( top == '0' ) {
            // this had mPath shifting - but that breaks sometimes !!
            var lazyArray = mPath; 
        } else {
            // its missing - add it  
            console.log('New Object Error ' + copyKey); 
            var newBob = { copyKey : "" };
            if ( newObj  ) {
                 lob[top] = newObj;     

            } else {
                lob[top] = { };
            }
        }
    }

    if ( action == 'new' ) {
        console.log('new doc needs some cleaning');
    }

}

function jPathCount(jsonObj,lookup) {
// returns true if the path is found, correctly maps partial paths from the top
 
    var mPath = lookup.split('.');
    var mPlen = mPath.length;

    for (z=0; z < mPlen; z++) {
        var top = mPath.shift();
       
        if (jsonObj.hasOwnProperty(top) ) {
            if ( z == (mPlen - 1)  ) {
               
                return true;
            } else {
                jsonObj = jsonObj[top];
            }
        }
    }  
    return false;
}

function jPathValidate(jsonObj,lookup) {
// returns true if the path is found, correctly maps partial paths from the top
 
    var mPath = lookup.split('.');
    var mPlen = mPath.length;

    for (z=0; z < mPlen; z++) {
        var top = mPath.shift();
       
        if (jsonObj.hasOwnProperty(top) ) {
            if ( z == (mPlen - 1)  ) {
               
                return true;
            } else {
                jsonObj = jsonObj[top];
            }
        }
    }  
    return false;
}


// this does a true deep clone
function clone(obj,action) {
    var copy;

    // Handle the 3 simple types, and null or undefined
    if (null == obj || "object" != typeof obj) return obj;

    // Handle Date
    if (obj instanceof Date) {
        copy = new Date();
        copy.setTime(obj.getTime());
        return copy;
    }

    // Handle Array
    if (obj instanceof Array) {
        copy = [];
        for (var i = 0, len = obj.length; i < len; i++) {
            copy[i] = clone(obj[i],action);
        }
        return copy;
    }

    // Handle Object
    if (obj instanceof Object) {
        copy = {};
        for (var attr in obj) {
            if (obj.hasOwnProperty(attr)) {
              if ( action == "new" && attr == "_$" ) {
                  copy[attr] = "";
              } else { 
                  copy[attr] = clone(obj[attr],action);
              }
            }
        }
        return copy;
    }

    throw new Error("Unable to copy obj! Its type isn't supported.");
}


function delSrc ( dob ) {

    var delKey = dob.array_index;
    
    if ( dob.name == "term" ) {
        // it mite be nested
        var chkNest = true;
        var subRef = dob.ref.split('.');
        var mx = subRef[0];
    }
    
    var lob = gCKAN_package;
    if ( dob.RefSaveTo ) {
            var mPath = dob.RefSaveTo;
            
    } else if ( (Array.isArray( dob.ref) ) ) {
        for (v =0;  v < dob.ref.length; v++ ) {
            var tk = dob.ref[v];
            if ( jPathValidate(lob, tk) ) {
                mPath = tk;
            }
        }

    } else {
        mPath = dob.ref;
    }

    console.log( ' d path save to ' + mPath);

    var mPath = mPath.split('.');
    var mPlen = mPath.length;

    var tStr = '';
    for (z=0; z < mPlen; z++) {
        var top = mPath.shift();
        tStr = tStr + top;
        console.log(' dpath '  + tStr);
        
        if (lob.hasOwnProperty(top) ) {
            // nested
            
            if ( chkNest && top == delKey ) {
              var delCand = lob[top];
              
              if ( delCand.hasOwnProperty(mx) ) {
                  lob.splice(delKey,1);
                  break;
              }
            }
            
            // normal
            if ( z == (mPlen - 1)  ) {
                lob = lob[top];
                if ( lob.hasOwnProperty(delKey) ) {

                    if ( Array.isArray(lob) ) {
                       lob.splice(delKey,1); 
                    } else {
                      delete lob[delKey];
                    }
                    
                    console.log(' delete true ' + delKey);
                    return true;
                }
                
            } else {
                lob = lob[top];
            }
        }         
    }
    return false;

}


function fpath(lookup,name) {
  var tk = lookup;
  var tko = lookup.split('.');
  var repair = "";
  
  for (a =0;  a < tko.length; a++ ) {
    
    for (var i in gFlat) {
        var pn = gFlat[i].Path;
        var pla = pn.split('.');
        var pln = pla.pop();
        var pc = 'OriginalDoc.' + gFlat[i].Path;
        if ( pln.indexOf(name) != -1 && pc.indexOf(tk) != -1 ) {
        //if ( gFlat[i].type == "endpoint" && pc.indexOf(tk) != -1 ) {
        // Found
          if ( repair.length ) {
            fixPath = pc + '.' + repair;
          } else {
            fixPath = pc;
          }  
          return fixPath;
        }
    }
    if ( repair.length ) {
      repair = tko.pop() + '.' + repair;
    } else { 
      repair = tko.pop();
    }
    tk = tko.join('.');
  }
   return "";

}

function insertSchema(paths, otype) {

    var OrigDoc = gCKAN_package;

     if ( gSchemaStack[otype] ) {
        if ( (Array.isArray( paths ) ) ) {

             for (zd =0;  zd < paths.length; zd++ ) {
                var path = paths[zd];
                var elemA = path.split('.');
                var eLen = elemA.length;
                for (v =0;  v < eLen; v++ ) {

                    var elem = elemA[v];
                    if (OrigDoc.hasOwnProperty(elem) ) {
                      if ( v == ( eLen - 1 )  ) {
                        // We found the end  -- attach it
                        OrigDoc[elem] = gSchemaStack[otype];
                        return path;
                      } else {
                        OrigDoc = OrigDoc[elem];
                      }

                    } else {
                      // Not correct path
                      break;
                    }
                  }
              }
              return "";

        } else {
          // single path
          var path = paths[zd];
          var elemA = path.split('.');
          var eLen = elemA.length;
          for (v =0;  v < eLen; v++ ) {

              var elem = elemA[v];
              if (OrigDoc.hasOwnProperty(elem) ) {
                if ( v == ( eLen - 1 )  ) {
                  // We found the end  -- attach it
                  OrigDoc[elem] = gSchemaStack[otype];
                  gFlat = JSON.flatten(gCKAN_package.OriginalDoc);
                  return path;
                } else { 
                  // Keep descending
                  OrigDoc = OrigDoc[elem];
                }

              } else {
                // Not correct path
               return "";
              }
          }
          return "";

        }


     } else {
      // couldnt find schemaobject
      return "";
     }

}
// XXX - to be called directly from menus
// can be used by any object type
function upSrc2( dob, value ) {

    var lob = gSchemaObject;
    var voStatus = false;
    var vo;

    if ( dob.RefSaveTo ) {
        var mPath = dob.RefSaveTo;
   
    } else if ( (Array.isArray( dob.ref) ) ) {
         // This reconstructs the path up to the object name 
         for (v =0;  v < dob.ref.length; v++ ) {
            var tk = dob.ref[v];
            
            var fixpath = fpath(tk,dob.name);
            if ( fixpath.length ) {
              dob.RefSaveTo = fixpath;
              mPath = fixpath;
              break;
            }
          }  
          
          // Build a missing schema object from template
          if ( typeof(mPath) == "undefined" ) {

            if ( typeof(dob.pathInsert) != "undefined")  {
                var pip = dob.pathInsert;
                var otype = dob.insertType;
                var sces = insertSchema(pip, otype);

                if ( sces.length ) {
                  for (v =0;  v < dob.ref.length; v++ ) {
                      var tk = dob.ref[v];
                      var fixpath = fpath(tk,dob.name);
                      if ( fixpath.length ) {
                        dob.RefSaveTo = fixpath;
                        mPath = fixpath;
                        reak;
                      }
                  }
                }
            }
          }

            /*
            var tko = tk.split('.');
            var gf = gFlat;
            
             for (var i in gFlat) {
                jView = gFlat[i];
                if ( jflat[i].type == "endpoint" &&  jflat[i].type  
          
             }
            
            if ( lob.hasOwnProperty(tko) ) {
              if ( jPathValidate(lob, tk) ) {
                  mPath = tk;
              }
              
            } else { // A relative path - upwalk
               var dontknowwhatodo;
         
            }
            */
        

        // doesnt exist so find the valid parent path 
/*
        if ( typeof(mPath) == "undefined" ) {
            for (v =0;  v < dob.ref.length; v++ ) {
                var tk = dob.ref[v];
                var tak = tk.split('.');
                var tkey = tak[tak.length - 1];

                tak.pop();
                var ntk = tak.join('.');

                if ( jPathValidate(lob, ntk) ) {
                    mPath = tak;
                    var newObj = { tkey : ""};
                }
            }            

        }
        
            if ( typeof(mPath) == "undefined" ) {
                mPath = dob.ref[0];
            }
*/

    } else {
    
          var fixpath = fpath(dob.ref);
          if ( fixpath.length ) {
              dob.RefSaveTo = fixpath;
              mPath = fixpath;

          }
            
        //mPath = dob.ref;
        // think about validating this

    }

    if ( dob.datatype == 'validateonly') {
        voStatus = true;
        if ( dob.validateonly == 'true' ) {
            vo = true;
        } else {
            vo = false;
        }
    }
    var kPath = mPath;
    var upPath = kPath;
    mPath = mPath.split('.');
    
    var mPlen = mPath.length;
    for (z = 0; z < mPlen; z++) {
        var top = mPath.shift();
        if (lob.hasOwnProperty(top) ) {
            // end point logic
            if ( z == (mPlen - 1)  ) {
                if ( voStatus ) {
                    if ( lob[top].validation ) {
                      dob.newValidation = "false";
                    } else {
                      dob.newValidation = "true";
                    }
                    lob[top].validation = vo;
                } else {
                      
                    if ( typeof(lob[top]) == "object" ) {
                        lob = lob[top];
                        if ( Array.isArray(lob) ) {
                             var lbn = lob.length -1;
                             lob[lbn].description = value;   
                        } else {
                            lob['description'] = value;
                        }
                    } else {
                      lob[top] = value;
                    }    
                }
            } else {
                lob = lob[top];
            }
        } else if ( top == '0' ) {
            var zip = 'zed';
        } else if ( Array.isArray(lob) ) {
            // If the source array exists but not in the path
             var lbn = lob.length -1;
             lob = lob[lbn];
            
        } else {
            // This part builds the json if it doesnt exist
            lob[top] = {};
			
			var isNum = /^\d+$/.test(top);       
			if ( isNum ) {	
				var kA = kPath.split('.');
				kA[z] = '-1';
				kPath = kA.join('.');
			} 
					
            if ( z == (mPlen - 1)  ) {
            
                if ( voStatus ) {
                    if ( lob[top].validation ) {
                      dob.newValidation = "false";
                    } else {
                      dob.newValidation = "true";
                    }
                    
                    lob[top].validation = vo;
                } else {
                    lob[top] = value; 
					dob.RefSaveTo = upPath;
					var rI = travObj(lob[top], kPath, upPath, true);
                }
            } else {
                lob = lob[top];
            }
        }
    }

}

function update_src(obj,access,value){
    if (typeof(access)=='string'){
        access = access.split('.');
    }
    if (access.length > 1){
        var top = access.shift();
        if ( obj.hasOwnProperty(top) ) {
            update_src(obj[top],access,value);    
        } else if ( top == '0' ) {
            var lazyArray = access.shift(); 
            if ( obj.hasOwnProperty(lazyArray) ) {
               update_src(obj[lazyArray],access,value )
            }
        }
             
    }else{
        obj[access[0]] = value;
    }

}

function menuLookup(jsonObj, trail, keylookup) {
    trail = trail || [];
    for (var key in jsonObj) {
        if (key == keylookup ) {
            return jsonObj[key];
        }
        if (jsonObj[key] !== null && typeof(jsonObj[key])=="object" ) {
            menuLookup(jsonObj[key], trail.concat(key), keylookup );
        } else {
            var fullkey = trail.join(".") + "." + key;
            if ( keylookup == fullkey ) {
                found = jsonObj[key];
                return found;
            }
        }
    }
    return found;
}

    
function clearChildren(dn) {
    // If data has dependent children and value changes clear children
        if (typeof(dn.dictChildren) !== "undefined" && typeof(dn.dictChildren) == "object" ) {
            var cO = getArrayItem(jsonSrc, "name", dn.dictChildren.name),
            //var cO = dn.dictChildren,
            didChild = false;
            cO.forEach(function(d) {   
               
                 var cName = d.name;
                 var chTxt = d3.selectAll("g.node")
                    .filter(function(d) { return d.name === cName }).datum();
                chTxt.value = "";
                didChild = true;
            });
          }  

    }

var pathResolve = function(lob, path, base, arr) {

    var newPath = "";
    if ( base ) { // If it has a base run down to the base
      var xp = base.split('.');
      var xl = base.split('.');
     
      var pO = [];

      if ( Array.isArray(path) ) {
        
        for (v =0;  v < path.length; v++ ) {
            var tk = path[v];
            var tko = tk.split('.');
            pO.push(tko[0]);
        } 
        
      } else {
           pO.push(path);
      } 
     
      
      for (z=0; z < xl.length; z++) {   
         var top = xp.shift();
    
         if ( lob.hasOwnProperty(top) ) {
             
             if ( pO.indexOf(top) == -1 ) {
                 ( z == 0 ) ? newPath = top : newPath = newPath + '.' + top; 
                 lob = lob[top];
             } else {
                 break;
             }     
         } else { // err condition - mapybe lazy
           
           var isNum = /^\d+$/.test(top);
           if (isNum) {
             var top = xp.shift();
             if (lob.hasOwnProperty(top) ) {
               if ( pO.indexOf(top) == -1 ) {   
                    newPath = newPath + '.' + top;             
                   lob = lob[top];
                   z++;
               } else {
                   break;
               } 
             }
           }
        }   
      }   
    }
    
    if  ( newPath.length > 1 ) { newPath = newPath + '.' + arr + '.'; }
    
    if ( Array.isArray(path) ) {
        for (v =0;  v < path.length; v++ ) {
            var tk = path[v];
            if ( jPathValidate(lob, tk) ) {
                return newPath + tk;
            }
        }
        // doesnt exist return the first matching element
        for (v =0;  v < path.length; v++ ) {
            var tk = path[v];
            var txk = tk.split('.');
            if ( jPathValidate(lob, txk[0]) ) {
                return newPath + tk;
            }
        }        
        
         
    } else {
        return newPath + path;
    }
    return "";
}

var pathfinder = function (lob, path) {

  if ( Array.isArray(path) ) {
        for (v =0;  v < path.length; v++ ) {
            var tk = path[v];
            if ( jPathValidate(lob, tk) ) {
                return tk;
            }
        } 
    } else {
        return path;
    }
    return "";
    
}


var pathIncludes = function(lpath, path) {
// for the search change all array elements to zero so that the refer paths can be found

   var xpath = lpath.split('.');
   var lp = lpath.split('.');
   var newPath = "";
   
   for (z=0; z < lp.length; z++) {   
       var top = xpath.shift();
       if ( z == 0 ) { newPath = top; }
       var isNum = /^\d+$/.test(top);    
       if (isNum) {
         newPath = newPath + '.0';     
       } else { 
         if ( z > 0 ) { newPath = newPath + '.' + top; } 
       } 
   }   
   
   if ( Array.isArray(path) ) {
        for (s=0; s < path.length; s++) {
             var ds = path[s];
             if ( newPath.includes(ds) ) {
                 return ds;
             }
        }
        
    } else {
        return path;
    }
    return "";
}

// Clones or create new d3 array item
// Whn an object is cloned, if the object Id's are not unique they do not show up.
// switch to cloneDid !

var cloneDbase = function(did,sibs,clr,newParent) {

    var newClone = {};
    var siboff = 80;
    
    if ( typeof(did.array_index) !== "undefined" ) {
        siboff = 10*(sibs - did.array_index);
    } else { 
        siboff = 10*sibs; 
    } 

    var cXoff = 0;
    if ( typeof(did.xoffset) !== "undefined"  ) {
        var xoffsize = did.xoffset;
    } else {
        var xoffsize = 0;
    }
    
    if ( newParent ) {
      newClone.xoffset = xoffsize + newParent.xoffset;
      newClone.array_index = newParent.array_index;
      newClone.parent = newParent;
    } else { 
      newClone.xoffset = xoffsize + siboff;
      newClone.array_index = sibs;
    }
    
    newClone.sourceID = did.id;
    newClone.id = ++maxId;
    newClone.siblings = sibs;
    
    if ( clr ) { 
      newClone.value = "";
    } else {
      newClone.value = did.value;
    }
    
    for (var elem in did) {
        if ( typeof(newClone[elem]) !== "undefined" ) {
           var Ithink;
        } else if ( elem != "value" && elem != "RefSaveTo" && elem != "_children" & elem != "children" ) {
          newClone[elem] = did[elem];
        }
    }
    return newClone
      
}

var childBuilder = function (newClone, did, clr) {

    if ( typeof(did.children) != "undefined" && did.children != null ) {   
          newClone.children = []; 
          for (var i = 0; i < did.children.length; i++) {
              var dc = did.children[i];
              if ( did.datatype = "object" ) {
                var tClone = cloneDid(dc,newClone.siblings,clr,newClone);
              } else {
                var tClone = cloneDid(dc,did.children.length,clr,newClone);
              }
              newClone.children.push(tClone);
          }    
    } 
    
    if ( typeof(did._children) != "undefined" && did._children != null ) {
          newClone._children = [];
          for (var i = 0; i < did._children.length; i++) {
              var dc = did._children[i];
              if ( did.datatype = "object" ) {
                var tClone = cloneDid(dc,newClone.siblings,clr,newClone);
              } else {
                var tClone = cloneDid(dc,did._children.length,clr,newClone);
              } 
              newClone._children.push(tClone);
          }
    }
    return newClone;          

}

var cloneDid = function(did, sibs, clr, newParent) {

    var newClone = cloneDbase(did,sibs,clr, newParent);
    var Kids = function(did) {
        if ( did._children || did.children ) { return true }
        return false; 
    }
    
    var kids = Kids(did);
    
    // intial entry object - not a sub 
    if ( !newParent && !did.RefSaveTo  ) {
      var baseRef = pathResolve(gCKAN_package, did.ref);     
      
      if ( kids ) {      
          newClone.baseRef = baseRef;
          newClone = childBuilder(newClone, did, clr);
               
      } else { // its an endpoint - this probably wont happen, endpoints should have RefsaveTo
       
        newClone.RefSaveTo = baseRef;
        newClone.SourceRef = baseRef;
      
      }
    
    }
    
    if ( !newParent && did.RefSaveTo && !did.subArrCat && !kids ) {
    // Inital entry no children, may be sub array 
    
        var refPath = pathIncludes(did.RefSaveTo, did.ref);
        refPath = refPath.split('.');
        
        var tempPath = did.RefSaveTo.split('.');
        
        for ( z = tempPath.length - 1; z > 0; z-- ) {
            // Find the array point and reindex to new
            //
            if ( tempPath[z] == refPath[0] ) {
              var tbs =  newClone.array_index;
              if (  /^\d+$/.test(tempPath[z-1]) ) {
                  tempPath[z-1] = tbs;
                  break;
              } else {
                  tempPath.splice(z-1,0,tbs);
                  break;
              }
            } 
        }
        newClone.SourceRef = did.RefSaveTo;
        newClone.RefSaveTo = tempPath.join('.');          
    } 
    
    if ( newParent && did.RefSaveTo && kids ) {   
      
        var refPath = pathIncludes(did.RefSaveTo, did.ref); 
        var rp = refPath.split('.');
        
        if ( did.subArrCat ) {
           var sACpath = pathIncludes(did.RefSaveTo, did.subArrCat);
           var sp = sACpath.split('.');
           var cutlen = sp.length + 1;
           rp.splice(rp.length - cutlen,cutlen);
           newClone.baseRef = newParent.baseRef;
           newClone.RefSaveTo = newParent.baseRef + '.' + newParent.array_index + '.' + refPath;
           newClone.set_idx = true;
        } else { 
          newClone.RefSaveTo = newParent.baseRef + '.' + newParent.array_index + '.' + refPath;
        }
        newClone = childBuilder(newClone, did, clr);
   
    }  
    
    if ( newParent && did.RefSaveTo && !kids ) { // endpoint in tree
       
         // if ( !did.subArrCat ) {
            var parEnd;
            if ( newParent.baseRef ) {
                var parPath = newParent.baseRef.split('.');
                parEnd = parPath[parPath.length-1];
            }
            
            var refPath = pathIncludes(did.RefSaveTo, did.ref);
            var rp = refPath.split('.');
            var tempPath = did.RefSaveTo.split('.');
        
            for ( z=0; z < tempPath.length; z++ ) {
                // Find the array point and reindex to new
                // Top array
                if ( tempPath[z] == parEnd ) {
                    if  ( /^\d+$/.test(tempPath[z+1]) ) {
                    
                        tempPath[z+1] = newParent.array_index;
                        break;
                    } 
                }
                // bottom array
                if ( tempPath[z] == rp[0] ) {
                  var tbs =  newClone.array_index;
                  if (  /^\d+$/.test(tempPath[z-1]) ) {
                      tempPath[z-1] = tbs;
                      break;
                  } else {
                      tempPath.splice(z-1,0,tbs);
                      break;
                  }
                } 
            }
            newClone.SourceRef = did.RefSaveTo;
            newClone.RefSaveTo = tempPath.join('.');    
    }
    
     if ( newParent && !did.RefSaveTo && !kids ) { // endpoint in tree
          
          
           newClone.RefSaveTo = pathResolve(gCKAN_package, did.ref, newParent.baseRef, newParent.array_index);
          
           //var refPath = pathResolve(gCKAN_package, did.ref, newParent.baseRef); 
            //newClone.RefSaveTo = newParent.baseRef + '.' + newParent.array_index + '.' + refPath;
           
           //if ( !newParent.subArrCat ) {     
              
          // } else {
           
   
            /*
            var rp = refPath.split('.');
            var tempPath = did.RefSaveTo.split('.');
        
            for ( z = tempPath.length - 1; z > 0; z-- ) {
                // Find the array point and reindex to new
                //
                if ( tempPath[z] == rp[0] ) {
                  var tbs =  newClone.array_index;
                  if (  /^\d+$/.test(tempPath[z-1]) ) {
                      tempPath[z-1] = tbs;
                      break;
                  } else {
                      tempPath.splice(z-1,0,tbs);
                      break;
                  }
                } 
            }
            newClone.SourceRef = did.RefSaveTo;
            newClone.RefSaveTo = tempPath.join('.');
            */
                
    }
      
    
    return newClone;
}


// Lookup an item from json source - its all arrays

var getArrayItem = function (arrayItems, key, id) {

    if ( typeof(arrayItems.children) !== "undefined") {
        for (var i = 0; i < arrayItems.children.length; i++) {

            if (key=="id" && arrayItems.children[i].id == id) {
                return arrayItems.children[i];
            } else if (key=="name" && arrayItems.children[i].name == id) {
                return arrayItems.children[i];
            }
            var found = getArrayItem(arrayItems.children[i], key, id);
            if (found) return found;

        }
        
    }
};

var hasEdits = function(compVal1, compVal2 ) {

    if ( ( typeof(compVal1) == "undefined") && ( typeof(compVal1) == "undefined") ) {

    }
}

// Cut an item from the tree

var deleteItem = function (arrayItems, id) {
    if ( typeof(arrayItems.children) !== "undefined") {
        for (var i = 0; i < arrayItems.children.length; i++) {
            if (arrayItems.children[i].id == id) {
                arrayItems.children.splice(i,1);
                return true;
            }
            found = deleteItem(arrayItems.children[i], id);
            if (found) return found;
        }
    }
    return false;
};

function toggleChildren(d) {
    if (d.children) {
        d._children = d.children;
        d.children = null;
    } else if (d._children) {
        d.children = d._children;
        d._children = null;
    }
    return d;
}

function createUUID() {
    // From http://www.ietf.org/rfc/rfc4122.txt
    var s = [];
    var hexDigits = "0123456789abcdef";
    for (var i = 0; i < 36; i++) {
        s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
    }
    s[14] = "4";  // bits 12-15 of the time_hi_and_version field to 0010
    s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);  // bits 6-7 of the clock_seq_hi_and_reserved to 01
    s[8] = s[13] = s[18] = s[23] = "-";

    var uuid = s.join("");
    return uuid;
}

d3.contextMenu = function (d, menuSel, openCallback) {
    
    // create the div element that will hold the context menu

    if (typeof(data.readonly) !== "undefined" && data.readonly == "true") {
     
        d3.selectAll('.d3-read-only').data([1])
            .enter()
            .append('div')
            .text('read only')
            .attr('class', 'd3-readonly');
        d3.select('.d3-context-menu').style('display', 'none');
     } else {

        d3.selectAll('.d3-context-menu').data([1])
            .enter()
            .append('div')
            .attr('class', 'd3-context-menu');

        var yoffset = 0;
     
        d3.select('.d3-context-menu')
                .style('left', d3.event.pageX + 'px')
                .style('top', d3.event.pageY + 'px')
                .style('display', 'block');
    }

    // this gets executed when a contextmenu event occurs
    
    var rtnFn = function(data, index, openCallback) {  
        var elm = this;
        var showMenu = true;

        if (typeof(data.readonly) !== "undefined" && data.readonly == "true") {
            d3.select('.d3-context-menu').style('display', 'none');
           
        } else {

            d3.selectAll('.d3-context-menu').html('');
            var list = d3.selectAll('.d3-context-menu').append('ul');
            if (typeof(data.datatype) !== "undefined" && data.datatype == "array") {
                menuSel = arrayMenu;   
                var aList = getArrayItem(tData, "id", data.id);
                list.selectAll('li').data(menuSel).enter()
                    .append('li')
                    .html(function (d) {
                        if ( d.title == 'Array Menu' ) {
                            var selArrStr = d.title + '</br><select>';
                            // change from data.children so that it comes from the schema
                            if ( aList.children ) {
                                aList.children.forEach(function(d) {     
                                    var ns = "";
                                    (typeof(d.value) !=="undefined") ? ns = " [" + d.value + "]":ns = "";
                                    selArrStr = selArrStr + '<option value="'+ d.name + ns + '" >' + d.name + ns + "</option>";    
                                });
                            }
                        }
                        selArrStr = selArrStr + '</select>';
                        return ( d.title == 'Array Menu' ) ? selArrStr : d.title;
                    })
                    .on('click', function (d, i, openCallback) {
                        if ( i == 0 ) {
                            var e = this.parentNode.childNodes[0].childNodes[2];
                           
                    
                            rexedit = e.options[e.selectedIndex].value;
                            return d.title + " Array ";
                        } else {
                            if ( i != 2) { 
                                if ( isNaN(rexedit) ) { 
                                    var e = this.parentNode.childNodes[0].childNodes[2];
                                    (e.selectedIndex > -1 ) ? rexedit = e.options[e.selectedIndex].value: rexedit = e.options[0].value;
                                }
                            }
                            d.action(elm, data, index);
                            d3.select('.d3-context-menu').style('display', 'none');
                            update(root);
                        }
                    });

            } else if (typeof(data.datatype) !== "undefined" && data.datatype == "validateonly") {

                   menuSel = validateMenu; 

                    list.selectAll('li').data(menuSel).enter()
                        .append('li')
                        .html(function (d) {
                            var editStr = d.title + ' <b>' + data.value + '</b></br>'; 
                            return ( d.title == 'Cancel' ) ? d.title : editStr;    

                        }).on('click', function (d, i, openCallback) { 

                            if ( i == 0 ) {
                                console.log(' valid ');
                                d.action(elm, data, index);

                            } else if ( i == 1 ) {
                                console.log(' not valid ');
                                d.action(elm, data, index);
                            } else { // cancel
                                d.action(elm, data, index);
                
                            }

                            d3.select('.d3-context-menu').style('display', 'none');
                            update(root);
                            
                        });
                                  
            } else if (typeof(data.datatype) !== "undefined" && data.datatype == "dictlist") {
                
                var aList = menuLookup(dJson, trail, data.name);

                menuSel = listMenu;
                list.selectAll('li').data(menuSel).enter()
                    .append('li')
                    .html(function (d) {
                        var selStr = d.title + '</br><select>';
                        aList.forEach(function(itm) {
                            selStr = selStr + '<option value="'+ itm.value + '" >' + itm.name + '</option>';
                        })
                        var selStr = selStr + '</select>';
                        return ( d.title == 'Select' ) ? selStr : d.title;
                    })
                    .on('click', function (d, i, openCallback) {
                        if (i == 0) {
                            var e = this.parentNode.childNodes[0].childNodes[2];
                            console.log(e.selectedIndex);
                            rexedit = e.options[e.selectedIndex].value;
                            return d.title + " Dictionary ";
                        } else {
                            d.action(elm, data, index);
                            d3.select('.d3-context-menu').style('display', 'none');
                            update(root);
                            
                        }
                    });

            } else if (typeof(data.datatype) !== "undefined" && data.datatype == "bbox") {

                var eb = -80;
                var wb = -120;
                var nb = 30;
                var sb = 30;

                if ( data.children ) {
                data.children.forEach(function(d) {
                    if ( d.value ) {
                        if (d.name == "eastBoundLongitude") { eb = d.value }
                        if (d.name == "westBoundLongitude") { wb = d.value }
                        if (d.name == "northBoundLatitude") { nb = d.value }
                        if (d.name == "southBoundLatitude") { sb = d.value }       
                    }
                });
            }

            if ( data._children ) {
                data._children.forEach(function(d) {
                    if  (d.value ) {
                        if (d.name == "eastBoundLongitude") { eb = d.value }
                        if (d.name == "westBoundLongitude") { wb = d.value }
                        if (d.name == "northBoundLatitude") { nb = d.value }
                        if (d.name == "southBoundLatitude") { sb = d.value }       
                    }
                });
            }

                gExt[0] = nb;
                gExt[1] = wb;
                gExt[2] = eb;
                gExt[3] = sb;
                
                 menuSel = mapMenu;
                 list.selectAll('li').data(menuSel).enter()
                    .append('li')
                    .html(function (d) {
                        var selStr = d.title + '</br><div id="boxmap" class="map"></div>' +
                                        '<div><table><tr><td id="tdnb">N:'+nb+'</td><td id="tdwb">W:'+wb+'</td></tr>' +
                                        '<tr><td id="tdsb">S:'+sb+'</td><td id="tdeb">E:'+eb+'</td><tr></table></div>' + 
                                        '<div class="typeahead container"><div class="typeahead-wrapper">' +
                                        '<input class="typeahead-text" name="contentModel" type="text" placeholder="Place Typeahead" value="' + data.value + '">' + 
                                        '</div></div>';

                        return ( d.title == 'Bounding Box' ) ? selStr : d.title;
                    })
                    .call(function(d) { 
                        $('#boxmap').css({'display':'block','width': '300px'});
                       
                        var initExtent = L.latLngBounds([nb, wb], [sb , eb]);
                        var center = new L.LatLng(sb + (nb - sb)/2 ,eb + (wb - eb)/2);
                         
                        // load a tile layer

                        L.mapbox.accessToken = 'pk.eyJ1IjoiZ2FyeWh1ZG1hbiIsImEiOiJjaW14dnV2ZzAwM2s5dXJrazlka2Q2djhjIn0.NOrl8g_NpUG0TEa6SD-MhQ';
                        map = L.mapbox.map('boxmap', 'mapbox.outdoors', 
                                {  infoControl: false,
                                    legendControl: false,
                                    zoomControl: true, 
                                    trackResize: true,
                                    tileSize: 128,  
                                    animate: false })
                                .setView(center, 6)
                                .on('ready',function() { 
                                    setTimeout(function(){ 
                                        map.invalidateSize();
                                        map.fitBounds(initExtent);
                                    }, 200);
                                    console.log('ready map')})
                                .on('resize',function() { console.log('resize map')})
                                .on('dragend', function onDragEnd(){
                                      gExt[0] = map.getBounds().getNorth(); 
                                      gExt[1] = map.getBounds().getWest(); 
                                      gExt[2] = map.getBounds().getEast();
                                      gExt[3] = map.getBounds().getSouth();
                                    
                                  
                                })
                                .on('moveend', function onDragEnd(){
                                    gExt[0] = map.getBounds().getNorth(); 
                                    gExt[1] = map.getBounds().getWest(); 
                                    gExt[2] = map.getBounds().getEast();
                                    gExt[3] = map.getBounds().getSouth();
                                })
                                                  
                        
                        // create an orange rectangle
						if (  eb == -80 && wb == -120 ) {
							gRect = L.rectangle(initExtent, {color: "#ff7800", weight: 0}).addTo(map);
							var drawnItems = L.featureGroup().addTo(map);
							gLG = drawnItems;
							map.addLayer(drawnItems);
						} else {
							gRect = L.rectangle(initExtent, {color: "#ff7800", weight: 1}).addTo(map);
							var drawnItems = L.featureGroup().addTo(map);
							gLG = drawnItems;
							map.addLayer(drawnItems);
                         
						}
						
						var drawControl = new L.Control.Draw({
                                edit: {
                                    featureGroup: drawnItems
                                },
                                draw: {
                                    polygon: false,
                                    polyline: false,
                                    rectangle: true,
                                    circle: false,
                                    marker: false
                                  }
                            });
                        map.addControl(drawControl);
						
						map.on('draw:created', showRectArea);
						map.on('draw:edited', showRectEdited);
							
                        function showRectEdited(e) {
                          e.layers.eachLayer(function(layer) {
                            showRectArea({ layer: layer });
                          });
                        }
                        function showRectArea(e) {
                          drawnItems.clearLayers();
                          drawnItems.addLayer(e.layer);
                          gll = e.layer.getLatLngs();
                          $('#tdnb')[0].innerHTML = "N:"+ gll[1].lat;
                          $('#tdwb')[0].innerHTML = "W:"+ gll[0].lng;
                          $('#tdeb')[0].innerHTML = "E:"+ gll[2].lng;
                          $('#tdsb')[0].innerHTML = "S:"+ gll[0].lat;

                           /*
                          gExt[0] = g11[1].lat; 
                          gExt[1] = gll[0].lng;
                          gExt[2] = gll[2].lng;
                          gExt[3] = gll[0].lat;
                          */
                          gExt[0] = map.getBounds().getNorth(); 
                          gExt[1] = map.getBounds().getWest(); 
                          gExt[2] = map.getBounds().getEast();
                          gExt[3] = map.getBounds().getSouth();
                          
                        }

                    })
                    .on('click', function (d, i, openCallback) {
                        if (i == 0) {
                            return d.title + " Bounding box ";
                        } else if ( i == 1 || i == 3 ) {
                            d.action(elm, data, index);
                        } else {
                            d.action(elm, data, index);
                            d3.select('.d3-context-menu').style('display', 'none');
                            update(root);
                        }
                    })
                    .style('width','300px');
            } else if (typeof(data.datatype) !== "undefined" && data.datatype == "object") {
                // object - only allows specify set of children, if they already exist, cant add another
                menuSel = objMenu;
                    list.selectAll('li').data(menuSel).enter()
                    .append('li')
                    .html(function(d) {
                        return d.title;
                    })
                    .on('click', function (d, i, openCallback) {
                       
                            d.action(elm, data, index);
                            d3.select('.d3-context-menu').style('display', 'none');
                            update(root);
                      
                    });

                
            } else if (typeof(data.datatype) !== "undefined" && data.datatype == "guid") {
                var guidVal = data.value;

                d3.select('.d3-context-menu').style('display', 'none');
                if ( guidVal.length > 16 ) {
                    alert("The Metadata Identifer cannot be edited");
                } else {
                    data.value = createUUID();
                    update(root);
                }
                
                showMenu=false;

            } else if (typeof(data.datatype) !== "undefined" && data.datatype == "typeahead") {

                menuSel = menu;
                list.selectAll('li').data(menuSel).enter()
                .append('li')
                .html(function (d) {

                    if(!CMloaded) {
                        var editStr = d.title + ' <b>' + data.name + '</b></br><div class="typeahead container"><div class="typeahead-wrapper">' +
                            '<input class="typeahead-text" name="contentModel" type="text" placeholder="Term Typeahead" value="' + data.value + '">' + 
                            '</div></div>';

                        CMloaded = true;
                        }
                        return ( d.title == 'Edit' ) ? editStr : d.title;
                    })
                 .on('click', function (d, i, openCallback) {
                            // text and date type objects
                        if (i == 0) {

                        } else {
                            CMloaded = false;
            
                            if ( data.value != rexedit ) {
                                clearChildren(data);
                            }

                            d.action(elm, data, index);
                             if (i > 0) {   
                                d3.select('.d3-context-menu').style('display', 'none');
                                update(root);
                            }
                        }
                    }).on('change', function (d,i,openCallback) {

                            // if (!taPick) {
                               var manE = $('.typeahead-text')[1];    
                               rexedit = manE.innerHTML;
                               if ( rexedit == "" ) {
                                    rexedit = manE.value;
                               }
                               d.action(elm, data, index);
                                if (i > 0) {   
                                    d3.select('.d3-context-menu').style('display', 'none');
                                    update(root);
                                }
                     


                    });
                  
            } else if (typeof(data.datatype) !== "undefined" && data.datatype == "url") { 
                 menuSel = uMenu;
                  list.selectAll('li').data(menuSel).enter()
                        .append('li')
                        .html(function (d) {
                            (typeof(data.value) !== "undefined") ? valen = data.value.length : valen = 10;
                            if (valen < 15) {
                                valen = 15;
                            }
	
							if ( d.title == 'Go to ...' ) {
								var lStr = '<a  href="' + data.value + '" target="_blank">' + d.title + '</a>';
								return lStr;
							}
							
							data.value = data.value.replace(/"/g,""); 
                            var editStr = d.title + ' <b>' + data.name + '</b></br> <input class="d3str" type="text" '
                                    + 'size="' + valen + '" value="' + data.value + '"></input>';
                            return ( d.title == 'Edit' ) ? editStr : d.title;

                        })
                        .on('click', function (d, i, openCallback) {
                                // text and date type objects
                            if (i == 0) {
                                rexedit = this.parentNode.childNodes[0].childNodes[4].value;
                            } else {
                                rexedit = this.parentNode.childNodes[0].childNodes[4].value;
                                d.action(elm, data, index);
                                d3.select('.d3-context-menu').style('display', 'none');
                                // update(root);
                            }
                        });

            } else {
                // these are text and dates
                menuSel = menu;
                if (typeof(data.readonly) !== "undefined" && data.readonly == "true") {
                    console.log(data.name + "  read only");
                } else {

                    list.selectAll('li').data(menuSel).enter()
                        .append('li')
                        .html(function (d) {
                            var valen;
                            if (typeof(data.datatype) !== "undefined" && data.datatype == "date") {
                                var xdate = new Date(data.value);
            
                                var editStr = d.title + ' <b>' + data.name + '</b></br><div  id="jdpid" class="cm-datepicker" ><p id="ipg">' + data.value + '</p></div>';

                                return ( d.title == 'Edit' ) ? editStr : d.title;
                            } else if (typeof(data.datatype) !== "undefined" && data.datatype == "textarea") {
                                (typeof(data.value) !== "undefined") ? valen = 1 + Math.round(data.value.length / 80 ) : valen = 4;
                                
                                var editStr = d.title + ' <b>' + data.name + '</b></br><textarea class="d3txtArea" rows="' + valen + '" cols="80">'
                                    + data.value + '</textarea>';
                                return ( d.title == 'Edit' ) ? editStr : d.title;

                            } else {
                                (typeof(data.value) !== "undefined") ? valen = data.value.length : valen = 10;
                                if (valen < 15) {
                                    valen = 15;
                                }
                                if ( data.value ) { data.value = data.value.replace(/"/g,""); } 
                                else { data.value = ""; }
                             
								
								var editStr = d.title + ' <b>' + data.name + '</b></br> <input class="d3str" type="text" '
                                    + 'size="' + valen + '" value="' + data.value + '"></input>';
                                return ( d.title == 'Edit' ) ? editStr : d.title;
                            }
                        })
                        .on('click', function (d, i, openCallback) {
                                // text and date type objects
                            if (i == 0) {
                                if (typeof(data.datatype) !== "undefined" && data.datatype == "date") {
                                    rexedit = data.value;
                                    var dp = Date.parse(data.value);
                                    if (isNaN(Date.parse(data.value))) {
                                        var td = new Date();
                                        var xdate = td.getDate();
                                    } else {
                                        var xdate = new Date(data.value);
                                    }
                 
                                    $("#jdpid").datepicker({
                                        autoSize: true,
                                        dateFormat: 'mm/dd/yy',
                                        changeYear: true,
                                        changeMonth: true,
                                        inline: true,
                                        onClose: function (date) {
                                            if (date == "") {
                                                rexedit = data.value;
                                            }
                                        },
                                        onChangeMonthYear: function(y,m,o) {
                                            console.log(y + m);
                                            rexedit = y + '-' + m + '-' + o.currentDay;
                                            var nDate = new Date(y + '-' + m + '-' + o.currentDay);
                                           
                                            $("#jdpid").datepicker("setDate", nDate);
                                             $("#ipg").html(y + '-' + m + '-' + o.currentDay);
                                        },
                                        onSelect: function (date) {
                                           if (date) {
                                                rexedit = date;
                                           }
                                           $("#ipg").html(date);
                                        }
                                    });

                                    $("#jdpid").datepicker("setDate", xdate);
                                    $("#jdpid").datepicker("show");
                                  
                                } else if (typeof(data.datatype) !== "undefined" && data.datatype == "textarea") {
                                    rexedit = this.parentNode.childNodes[0].childNodes[3].value;
                                } else {
                                    rexedit = this.parentNode.childNodes[0].childNodes[4].value;
                                   
                                }
                            }
                            else {
                                if (typeof(data.datatype) !== "undefined" && data.datatype == "date") {
                                 
                                } else if (typeof(data.datatype) !== "undefined" && data.datatype == "textarea") {
                                    rexedit = this.parentNode.childNodes[0].childNodes[3].value;
                                }
                                else {
                                    rexedit = this.parentNode.childNodes[0].childNodes[4].value;
                                }

                                d.action(elm, data, index);
                               
                                if (i > 0) {
                                    
                                    d3.select('.d3-context-menu').style('display', 'none');
                                    update(root);
                                }
                            }
                        });
                }
            // >>> end else
            }
        }
       var cleft = (d3.event.pageX - 2);
       var ctop = (d3.event.pageY - 2);

       if ( typeof(data.datatype) !== "undefined" && data.datatype =="bbox") {
                cleft = cleft - 150;
                ctop = ctop - 300;
       } else if ( typeof(data.datatype) !== "undefined" && data.datatype =="textarea") {
                cleft = cleft - 400;
                ctop = ctop - 150;
       } else {
            cleft = cleft - 50;
            ctop = ctop - 50;
       }

       // event handler after render for type aheads
       if ( typeof(data.datatype) !== "undefined" ) {
         if ( data.datatype =="typeahead" || data.datatype =="bbox" ) {

            var params = data.dictparams;
            var bbext = "";
            if ( data.datatype =="bbox" ) {
                 var gDatatype = "bbox";
                 bbext = '&searchExtent=' +gExt[1] + ',' + gExt[0] + ',' + gExt[2] + ',' + gExt[3];
            }   
                   
            var taCol = new Bloodhound({
              datumTokenizer: function(datum) {
                return Bloodhound.tokenizers.whitespace(datum.value);
              },
              queryTokenizer: Bloodhound.tokenizers.whitespace,
              remote: {
                wildcard: params.query,
                url: data.dicturl,
                prepare: function(query, settings) {
                  gPre = query;
                  taPick = false;
                  var surl = settings.url.replace('%QUERY',query);
                  if ( gDatatype == "bbox" ) {
                     bbext = '&searchExtent=' +gExt[1] + ',' + gExt[0] + ',' + gExt[2] + ',' + gExt[3];
                  } 
                  settings.url = surl + bbext;
                  return settings;
                },
                transform: function(response) {
                   console.log(JSON.stringify(response));
                  // Map the remote source JSON array to a JavaScript object array
                  
                  if (response.suggestions ) {
                    var mr = response.suggestions;
                  } else  { 
                    mr = response;
                  }
                  
                  var zed = $.map(mr, function(taObj) {
                    console.log(JSON.stringify(taObj));
                    
                    if ( taObj.text ){
                            return {
                               value: taObj.text,
                               magicKey: taObj.magicKey
                            };
               
                    } else if ( typeof(taObj.concept) !== "undefined" && Array.isArray(taObj.concept.categories) ) {
                        
                        for (z = 0; z < taObj.concept.categories.length; z++) {
                             return {
                              uri: taObj.concept.uri,
                              categories: taObj.concept.categories[z],
                              value: taObj.completion
                             };
                         }
                         
              
                    } else {                 
                        return {
                          uri: taObj.concept.uri,
                          categories: '',
                          value: taObj.completion                
                        };
                    }
                });
                console.log('place');
                return zed;
                
               }
              }    
             });
         
           

            // Instantiate the Typeahead UI
            $('.typeahead-text').typeahead({ hint: true, highlight: true }, {
              displayKey: 'value',
              source: taCol,
              templates: { suggestion: function (data) {
                  var conCat = '';
                  //if ( data._query ) {
                  //  gPre = data._query;
                 // }
                  if ( data.categories ) {  
                    conCat = '<p><strong>' + data.value + '</strong></br>' + data.categories + '</br>' + data.uri + '</p>';
                  } else {
                     conCat = '<p><strong>' + data.value + '</strong></p>';
                  }
                  
                  console.log('ta ' + JSON.stringify(conCat)); 
                  return conCat;
              }}
            }).on('typeahead:selected', function (obj, datum) {
                    taPick = true;
                    rexedit = datum.value;
                    if ( datum.magicKey ) {
                      gBBMagicKey = datum.magicKey 
                    }
                  
               }).focus( function () {
                 console.log('typeahead focus');
               });
             
             
  
            }
          }

        // display context menu
        if ( showMenu ) {
            d3.select('.d3-context-menu')
                .style('left', cleft + 'px')
                .style('top', ctop + 'px')
                .style('display', 'block');
            
        }
        d3.event.preventDefault();
    };
    
    return rtnFn(d);
    
};

var mapMenu = [{ title: 'Bounding Box',
      action: function(elm, d, i) {
        console.log('Bounding box clicked!');     
      }
    },
    { title: 'Select Place',
      action: function(elm, d, i) {
      
        if ( d.dictExt ) {
            var hurl = d.dictExt.url + rexedit +  '---magicKey=' + gBBMagicKey +  d.dictExt.params;
      
        } else { 
          var hurl = '/place?urxl=http://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidatesQQQsingleLine=' + rexedit + 
                    '---magicKey=' + gBBMagicKey + 
                    '---maxLocations=10---category=Land+Features,Water+Features,Populated+Place---outFields=Match_addr,Place_addr,Type---f=pjson';
        }
        
        $.ajax({
          type: 'GET',
          url: hurl,
          crossDomain: true,
          dataType: 'json',
          contentType: "application/json",
          success: function(data, status) {
            if ( data ) {
              
              if ( data.candidates ) {
                 var nx = data.candidates[0];
                 var newExt = nx.extent;
                 var LX = L.latLngBounds([newExt.ymax, newExt.xmax], [newExt.ymin, newExt.xmin]);
                 
                 L.rectangle(LX, {color: "#22dd22", weight: 2}).addTo(map);
                 var drawnItems = new L.featureGroup(LX).addTo(map);
                 map.addLayer(drawnItems);
                 var gb = drawnItems.getBounds();
                 
                 gExt[0] = newExt.ymax; 
                 gExt[1] = newExt.xmin; 
                 gExt[2] = newExt.xmax;
                 gExt[3] = newExt.ymin;
                 
                 gll[1].lat = newExt.ymax;
                 gll[0].lng = newExt.xmin;
                 gll[2].lng = newExt.xmax;
                 gll[0].lat = newExt.ymin;
                 
                 map.fitBounds(LX);
                 
              }
              console.log('url check - OK');
              
              
            } else {
              console.log('url check - BAD');
              
            }
        
          }, 
          error: function (jqXHR, status, err) {  
            console.log('url check error');
           
          }
    
        });
        
        console.log('Place to BE ' + d.value + ' ' + rexedit + ' ' + gBBMagicKey);
        }
    },
    {title: 'Save',
      action: function(elm, d, i) {
        console.log('Save ');

        if ( !taPick ) {
             rexedit = gPre;
        }   
        
        if ( d.value != rexedit ) { dataEdits = true; }
        
		if ( d.RefSaveTo ) {
			upSrc2(d, rexedit);
			cin_editObjBld(d,rexedit, 'updatePath');
		}
       
        d.value = rexedit;

                    
        if ( d.children ) {
            d.children.forEach(function(d) {
                if (d.name == "term") { 
                   if ( d.value != rexedit ) { dataEdits = true; }
                   cin_editObjBld(d,rexedit, 'updatePath');
                   d.value = rexedit;
                }
                if (d.name == "eastBoundLongitude") { 
                    if ( d.value != gll[2].lng ) { dataEdits = true; }
                   
                    cin_editObjBld(d,gll[2].lng, 'updatePath');
                    d.value = gll[2].lng; }
                if (d.name == "westBoundLongitude") { 
                    if ( d.value != gll[0].lng ) { dataEdits = true; }
                   
                     cin_editObjBld(d,gll[0].lng, 'updatePath');
                    d.value = gll[0].lng; }
                if (d.name == "northBoundLatitude") { 
                    if ( d.value != gll[1].lat ) { dataEdits = true; }
                     
                     cin_editObjBld(d,gll[1].lat , 'updatePath');
                    d.value = gll[1].lat; }
                if (d.name == "southBoundLatitude") { 
                    if ( d.value != gll[2].lat ) { dataEdits = true; }
                    
                     cin_editObjBld(d,gll[2].lat, 'updatePath');
                    d.value = gll[0].lat; } 
            });
            MapReady = 0;
            if ( map ) {
                map.off();
                map.remove();
            }
        }

         if ( d._children ) {
            d._children.forEach(function(d) {
                if (d.name == "term") { 
                   if ( d.value != rexedit ) { dataEdits = true; }
                   cin_editObjBld(d,rexedit, 'updatePath');
                   d.value = rexedit;
                }
                if (d.name == "eastBoundLongitude") { 
                    if ( d.value != gll[2].lng ) { dataEdits = true; }
                     
                     upSrc2(d, gll[2].lng);
                     cin_editObjBld(d,gll[2].lng, 'updatePath')
                    d.value = gll[2].lng; }
                if (d.name == "westBoundLongitude") { 
                    if ( d.value != gll[0].lng ) { dataEdits = true; }
                   
                      upSrc2(d, gll[0].lng );
                     cin_editObjBld(d,gll[0].lng, 'updatePath');
                    d.value = gll[0].lng; }
                if (d.name == "northBoundLatitude") { 
                    if ( d.value !=  gll[1].lat ) { dataEdits = true; }
                    
                     upSrc2(d,  gll[1].lat );
                     cin_editObjBld(d, gll[1].lat, 'updatePath');
                    d.value = gll[1].lat; }
                if (d.name == "southBoundLatitude") { 
                    if ( d.value != gll[0].lat ) { dataEdits = true; }
                    
                     upSrc2(d, gll[0].lat );
                     cin_editObjBld(d,gll[0].lat, 'updatePath');
                    d.value = gll[0].lat; } 
            });
            MapReady = 0;
            if ( map ) {
                map.off();
                map.remove();
                map = null;
            }
             if ( bmap ) {
                bmap.off();
                bmap.remove();
                bmap = null;
            }
        }

      
      }
    },
    {title: 'Clear',
      action: function(elm, d, i) {
      
      if ( gLG ) {
        gLG.eachLayer(function (layer) {
            gLG.removeLayer(layer);
        });
      }
      if ( gRect ) {
        var gd = gRect._leaflet_id;
        map.eachLayer(function (layer) {
          if ( layer._leaflet_id == gd ) {
            map.removeLayer(layer);
          }
        });
       
      }
          console.log('Clear ');
      } 
    
    },
    {title: 'Cancel',
      action: function(elm, d, i) {
        console.log('Cancel ');
        
      } 
    }]


var arrayMenu = [{ title: 'Array Menu',
      action: function(elm, d, i) {
        console.log('Array - ' + i);     
      }
    },
    {
      title: 'Map Path',
      action: function(elm, d, i) {
        var isMapped = mPathItem(root,d.id);
        //var srcDeleted = delSrc( d );
        //cin_editObjBld(d,'',"deletePath");
        console.log("Mapped " + isMapped);
      }
    },
    {title: 'Copy',
      action: function(elm, d, i) {
       
        var aList = d;

        if (aList.children) {
             var children = aList.children;
             var isDone = false;
              var siblings = children.length;
              children.forEach(function(child, index) {
                if ( typeof(child.value) != "undefined" ) {
                    var lkey = child.name + " [" + child.value + "]";
                } else {
                    lkey = child.name;
                }
                if (lkey == rexedit && !isDone) {
                    tmpIdx = index;
                    var copyChild = cloneDid(child, siblings, false);
                    newSrc3(copyChild,index,'clone');
                    cin_editObjBld(copyChild,copyChild.value,"insertPath",siblings);
                    var zeb = getArrayItem(root,"id", d.id);
                    zeb.children.push(copyChild);
                    zeb.siblings = zeb.siblings+1;
                    isDone = true;
                }
             });
        }
      } 
    },
    {title: 'Delete',
      action: function(elm, d, i) {
        var aList = d;

        if (aList.children) {
             var children = aList.children;
             var isDone = false;
             var siblings = children.length;
             children.forEach(function(child, index) {
                if ( child.value ) {
                    var lkey = child.name + " [" + child.value + "]";
                } else {
                    lkey = child.name;
                }
                if (lkey == rexedit && !isDone) {
                    tmpIdx = index;
                    var isDeleted = deleteItem(root,child.id);
                    var srcDeleted = delSrc( child );
                    cin_editObjBld(child,'',"deletePath");
                   
                    isDone = true;
                }
             });
        }

       
      } 
    },
    {title: 'New',
      action: function(elm, d, i) {
        if (d.children) {
             var children = d.children;
             var isDone = false;
             var siblings = children.length;
             children.forEach(function(child, index) {
                    if ( child.value ) {
                        var lkey = child.name + " [" + child.value + "]";
                    } else {
                        lkey = child.name;
                    }
                    if (lkey == rexedit && !isDone) {
                        tmpIdx = index;
                        var copyChild = cloneDid(child, siblings, true); 
                        newSrc3(copyChild,index,'new');
                        cin_editObjBld(copyChild,copyChild.value,"insertPath",siblings);
                        var zeb = getArrayItem(root,"id", d.id);
                        zeb.children.push(copyChild);
                        zeb.siblings = zeb.siblings+1;
                        isDone = true;
                    }

             });
        }
      } 
    },{title: 'Cancel',
       action: function(elm, d, i) {
        console.log('Cancel ');
      } 
    }]

var objMenu = [
     /*
    { title: 'Edit Menu',
        action: function(elm, d, i) {
            console.log('Object select clicked!');
        }
    }, */
    {
      title: 'Map Path',
      action: function(elm, d, i) {
        var isMapped = mPathItem(root,d.id);
        //var srcDeleted = delSrc( d );
        //cin_editObjBld(d,'',"deletePath");
        console.log("Mapped " + isMapped);
      }
    },
    {
      title: 'Delete',
      action: function(elm, d, i) {
        var isDeleted = deleteItem(root,d.id);
        var srcDeleted = delSrc( d );
        cin_editObjBld(d,'',"deletePath");
        console.log("Deleted " + isDeleted);
      }
    }, 
    {
        title: 'Cancel',
        action: function(elm, d, i) {
            console.log('Cancel ');      
        }
}]


var listMenu = [{ title: 'Select',
    action: function(elm, d, i) {
        console.log('menu 1 clicked!');
        console.log('The data for this circle is: ' + d);
        }
    }, {
        title: 'Save',
        action: function (elm, d, i) {
            if ( d.value != rexedit ) { dataEdits = true; }
           
            upSrc2(d, rexedit);
            cin_editObjBld(d,rexedit, 'updatePath');
            d.value = rexedit;

        }
    }, {
        title: 'Cancel',
        action: function(elm, d, i) {
            console.log('Cancel ');
            
        }
}]

var validateMenu = [{ title: 'Valid',
    action: function(elm, d, i) {
        console.log('Picked Valid');
         d.validateonly = 'true';
         if ( typeof(d.array_index) != undefined ) {
                d.RefSaveTo = d.ref + '.' + d.array_index;
         }
         upSrc2(d, 'true');
         cin_editObjBld(d,'true', 'updatePath');
       
        }
    }, {
        title: 'Not Valid',
        action: function (elm, d, i) {
            console.log('Picked INVALID');
            d.validateonly = 'false';
            if ( typeof(d.array_index) != undefined ) {
                d.RefSaveTo = d.ref + '.' + d.array_index;
            }
            
            
            upSrc2(d, 'false');
            cin_editObjBld(d,'false', 'updatePath');


       }
    }, {
        title: 'Cancel',
        action: function(elm, d, i) {
            console.log('Cancel ');
            
        }
}]

var menu = [{
      title: 'Edit',
      action: function(elm, d, i) {
        console.log('Item #1 clicked!');
        console.log('The data for this circle is: ' + d);
      }
    },  {
      title: 'Save',
      action: function(elm, d, i) {
        if ( d.value != rexedit ) { 

            dataEdits = true; 
       
            upSrc2(d, rexedit);
            cin_editObjBld(d,rexedit, 'updatePath');
            d.value = rexedit;
        }
      
      }
    },  {
      title: 'Cancel',
      action: function(elm, d, i) {
        console.log('Item Cancel ');
    
      }
    }, 
    {
      title: 'Delete ',
      action: function(elm, d, i) {
         var isDeleted = deleteItem(root,d.id);
         delSrc(d);
         cin_editObjBld(d,rexedit, 'deletePath');
        

      }
    }]
    
    var uMenu = [{
      title: 'Edit',
      action: function(elm, d, i) {
        console.log('Item #1 clicked!');
        console.log('The data for this circle is: ' + d);
      }
    },
    {
      title: 'Save',
      action: function(elm, d, i) {
        if ( d.value != rexedit ) { 
            dataEdits = true; 
       
            upSrc2(d, rexedit);
            cin_editObjBld(d,rexedit, 'update');
            d.value = rexedit;
            update(root);
        }
      
      }
    },  
    {
      title: 'URL Check',
      action: function(elm, d, i) {
        //if ( d.value != rexedit ) { 
        //    d.value = rexedit;
        //}
        var z = urlCheck(d.value, function(isReal) {
            console.log('call me back');
            if ( isReal == 'OK') {
                d.urlvalid = 'true';
            } else {
                d.urlvalid = 'false';
            }

            console.log('inside cb Check the url ' + isReal);
            update(root);

        });

        console.log('outside cb Check the url ' + z);
        //console.log('Check the url ' + d.value);
      
      }
    },
	{
      title: 'Go to ...',
      action: function(elm, d, i) {
        //if ( d.value != rexedit ) { 
        //    d.value = rexedit;
        //}
		
        var z = urlCheck(d.value, function(isReal) {
            console.log('call me back');
            if ( isReal == 'OK') {
                d.urlvalid = 'true';
            } else {
                d.urlvalid = 'false';
            }

            console.log('inside cb Check the url ' + isReal);
            update(root);

        });

        console.log('outside cb Check the url ' + z);
        //console.log('Check the url ' + d.value);
      
      }
    },
    {
      title: 'Cancel',
      action: function(elm, d, i) {
        console.log('Item Cancel ');
    
      }
    }, 
    {
      title: 'Delete ',
      action: function(elm, d, i) {
        var isDeleted = deleteItem(root,d.id);
        console.log("Deleted " + isDeleted);

      }
    }]

    var data = [1, 2, 3];
