// Admin Navigation
let afMap = new Map();

class autoFunction {
  constructor(n) {
    this.name =  n;
    afMap.set(n,this);
    
  }
  exec(o) { return this.name;}
}

var autoFn = function(n){
  for (let [key, value] of afMap.entries()) {
    if ( key == n) {
      return value;
    }
  }
  return null;
}

// Sample lib functions
var kr = new autoFunction('tyrex');
kr.exec = function(o) {
  return this.name + ' kr instance ' + o;
}

var kn = new autoFunction('rando');
kn.exec = function(o) {
  return this.name + 'kn is ' + o;
}


function menuSelect(t) {

	console.log('tbd');
}


/* Harvest Module Functions */

  function harvestView() {

  	$("#leftHarvest").show();
  	$("#cp").show();

  	$("#leftSearch").hide();
  	$("#leftProcess").hide();
  	$("#proc").hide();

    $("#widget-box").hide();
    $("#cb").show();
  	$("#cb-title").html("<h2>Harvest Administration</h2>");
    $("#rec-results").empty();
    harvestSourceList();

  }


  var gSrcTemplate = {"set_id" :  "0", 
  		"set_name" : "", 
  		"status" : "", 
  		"source_url" : "", 
  		"user_id" : "1", 
  		"user_name" : "",
  		"create_date" : "",
  		"end_date" : "",
  		"activity_definition_id" : "0", 
  		"activity_name" : "",
  		"schema_id" : "0",
  		"schema_name" : "",
  		"set_description" : "" };
   
  var gSrcInfo = {};

  var lC = function(o) {
  	var aCL = JSON.stringify(o);
  	var co = JSON.parse(aCL);
  	return co;
  }

  var harvestSourceInfo = function (o) {

    $("#rec-results").empty();
    if ( typeof(o.selectedIndex) !== "undefined" ) {
      var hsid = o.options[o.selectedIndex].value;
    }
   // var so = o.options[o.selectedIndex];
  
    //var hurl = $(so).attr('tag');


  	if ( typeof(hsid) !== "undefined") {
  		var hUrl = '/action/harvestSourceInfo?hsid='+hsid;
  		var jqxhr = $.get(hUrl, function() {
        		console.log( "harvest source info" );
      	})
      	.done(function(data) { 
          console.log(data);
          $("#cb-title").html("<h2>Harvest Source Info</h2>");

      		var gHS = $('<div>')
              .css("margin", "2px" )
              .css("background-color", "#dddddd" );
            //  .append('<h2>Harvest Source Info</h2>');

      		if ( typeof(data.rows) !== "undefined") {
      			
      			var d = data.rows;
	            for ( var i in data.rows) {
	            	var d = data.rows[i];
	            	gSrcInfo = d;
	            	Object.keys(d).forEach(function (item) {
	            		console.log('a'+ item.slice(-2));

	            		if ( item.slice(-2) !== 'id') {
      						gHS.append('<label class="md-label">'+item+':</label><span>'+ d[item] + '</span></br>');
      					}
						    console.log(item); // key
	          		});
	            }	


      		}

      		gHS.append('<button id="editHBtn" class="action-button" onclick="editH(this)">Edit</button>');
      		gHS.append('<button id="rmvHBtn" class="action-button" onclick="deleteHarvest(this)">Remove</button>');
      		$("#rec-results").append(gHS);
      		//$("#rec-results").append(JSON.stringify(data));

      	})

  	}

  }

 
 var editH = function(o) {

 	$("#rec-results").empty();
 	var gEditSource = hsTemplate('Edit', 'updateHS');
 	$("#rec-results").append(gEditSource);
 	//populateSchema($("#srcSchema"));

 }

 var deleteHarvest = function(o) {
 	console.log('nuthin yet');

 	//$("#rec-results").empty();
 	//var gEditSource = hsTemplate('Edit', 'updateHS');
 	//$("#rec-results").append(gEditSource);
 	

 }

var updateHS = function(o) {
       //post a form
       


}

var hsPost = function(o) {

	$.ajax({ 
		type: 'POST',
		url: '/createHarvestSource',
		processData: false,
		data: JSON.stringify(gSrcInfo),
		dataType: "json",
		contentType: "application/json",  
		success: function(data,jqXHR) {    
		  console.log(data);

		},
		error: function (jqXHR, status, err) { 
			console.log('new harvest source error : ' + status + ' ' + err)
		}
	});

}

  var harvestSourceList = function() {
    $("#srcCollection").empty(); 
    $("#rec-results").empty();
    
  	var hUrl = '/action/harvestSourceList';
  		var jqxhr = $.get(hUrl, function() {
        		console.log( "harvest source List" );
      	})
      	.done(function(data) { 
      		console.log( data + ' ' + typeof(data));
      		var z = {};
      		( typeof(data) !== "object") ? z = JSON.parse(data) : z = data;
      		if ( typeof(z.rows) !== "undefined") {
      			var rowz = z.rows;
	            for ( var i in rowz) {
	            	var d = rowz[i];
	            	var k, v, s;
	            	Object.keys(d).forEach(function (item) {
	            		if ( item == 'set_id') { k = d[item]}
	            		if ( item == 'set_name') { v = d[item]}
	            		if ( item == 'source_url') { s = d[item]}
	          		});
                if ( i == 0 ) {
                  gSrcInfo = lC(gSrcTemplate);
                  gSrcInfo.set_id = k;
                  gSrcInfo.set_name = v;
                  gSrcInfo.source_url = s;
                }
	          		$("#srcCollection").append('<option value="'+ k + '" tag="' + s + '">' + v + '</option>')
	            }	

      		}
      		//$("#rec-results").append(gHS);
      		//$("#rec-results").append(JSON.stringify(data));

      	})

  }	

  var harvestNewSource = function() {

  		$("#rec-results").empty();
		
  		gSrcInfo = lC(gSrcTemplate);
      var gNewSource = hsTemplate('Create', 'createNewHarvest');
        $("#rec-results").append(gNewSource);


  }

  var hsTemplate = function(act, script) {

  		var gFrm =  $('<div>')
              .css("margin", "2px" )
              .css("background-color", "slate" )
              .append('<h2>' + act + ' Harvest Source</h2>');

        gFrm.append('<label class="md-label">Name</label><input id ="set_name" type="text" size="60" value="' + gSrcInfo.set_name + '"></br>');
        gFrm.append('<label class="md-label">URL</label><input id = "source_url" type="text" size="60" value="' + gSrcInfo.source_url + '"></br>');
        
        var gSchem = $('<select id="srcSchema" style="padding=20px; width:300px;" ></select>');
        populateSchema(gSchem,gSrcInfo.schema_id);

        gFrm.append('<label class="md-label">Schema</label>');
        gFrm.append(gSchem);

        gFrm.append('<button id="vSBtn" class="action-button" onclick="gotoSchema(this)">View</button>');
        gFrm.append('<button id="uSBtn" class="action-button" onclick="gotoSchema(this)">Update</button>');
        gFrm.append('<button id="nSBtn" class="action-button" onclick="createSchema(this)">New</button></br>');

        gFrm.append('<label class="md-label">Process</label>');
        gProc = $('<select id="srcProcess" style="padding=20px; width:300px;" ></select>');
        populateActivity(gProc);
        gFrm.append(gProc);
        gFrm.append('<button id="vPBtn" class="action-button" onclick="gotoProcess(this)">View</button>');
        gFrm.append('<button id="uPBtn" class="action-button" onclick="gotoProcess(this)">Update</button>');
        gFrm.append('<button id="nPBtn" class="action-button" onclick="createProcess(this)">New</button></br>');
        gStatus = $('<select id="srcStatus" style="padding=20px; width:300px;" ></select>')
        		.append('<option value="active" >active</option>')
        		.append('<option value="inactive" >inactive</option>');
        gStatus.val(gSrcInfo.srcStatus);

        gFrm.append('<label class="md-label">Status</label>');
        gFrm.append(gStatus);
        gFrm.append('</br>');
        //gFrm.append('<label class="md-label">Process</label><input id="hsp" type="text" width="30"></br>');
        gFrm.append('<label class="md-label">Description</label></br><textarea id="hsd" rows="5" cols="80" >' + gSrcInfo.set_description + '</textarea></br>');
        gFrm.append('<button id="newHBtn" class="action-button" onclick="' + script + '(this)">' + act + '</button>');
       
       return gFrm;
  }

  var populateSchema = function(o,sid) {
      $(o).empty();
      var jqxhr = $.get("/get_schema", function() {
        console.log( "/get_schema success" );
      })
      .done(function(data) {          
            var schem = JSON.parse(data.schema);
	        schem.forEach(function(k) {
	          var mr = k;
	          $(o).append($('<option>', {
	                value: mr.schema_id,
	                text: mr.schema_name
	              }));
	        });
	        //$(o).filter('[value='+sid+']').attr('selected', true);
	        $(o).val(sid);

       });

  }

  var populateActivity = function(o,pid) {
  		 $(o).empty();
  	   // $("#srcProcess").empty();
  		$(o).append('<option value="1" >Default Validator</option>');
  }

  // this is actually a new harvest source

  var createNewHarvest = function(o) {
       //post a form
       console.log('cnw');
       gSrcInfo.schema_id = $('#srcSchema').find(":selected").val();
       gSrcInfo.set_name = $('#set_name').val();
       gSrcInfo.set_description = $('#hsd').val();
       gSrcInfo.source_url = $('#source_url').val();
       gSrcInfo.activity_definition_id =  $('#srcProcess').find(":selected").val();

       $.ajax({ 
			type: 'POST',
			url: '/createHarvestSource',
			processData: false,
			data: JSON.stringify(gSrcInfo),
			dataType: "json",
			contentType: "application/json",  
			success: function(data,jqXHR) {    
			  console.log(data);
			  $("#gsrcCollection").append('<option value="1" >' + gSrcInfo.set_name + '</option>');
			},
			error: function (jqXHR, status, err) { 
				console.log('new harvest source error : ' + status + ' ' + err)
			}
		});

  }

  // This will setup and start the backend process

  var execHarvest = function(hs) {
    
  	var hUrl = '/csw/harvestJob?setid='+hs+'&ad=1';
  	  var jqxhr = $.get(hUrl, function() {
        console.log( "success - 1" );
      })
      .done(function(data) { 
      	console.log( JSON.stringify(data) );	
      });

  }

  var harvestClear = function() {
    
    var og = $("#srcCollection");
    if ( og[0] ) { og = og[0] }
    var so = og.options[og.selectedIndex].value;

    var hUrl = '/collectionClear?setid='+so+'&action=1';
      var jqxhr = $.get(hUrl, function() {
        console.log( "success - 1" );
      })
      .done(function(data) { 
        console.log( JSON.stringify(data) );  
      });

  }

  // Phase this one out 
  function exec_harvest(sp) {
    // Runs harvest
    harvestAction='Harvest';

	$("#rec-results").empty();
	//$("#cb-title").html("Harvest Records");

      sOff++;
      var gUrl = '/harvest?offset='+sOff.toString();

      var jqxhr = $.get(gUrl, function() {
        console.log( "success - 1" );
      })
      .done(function(data) { 
            var dres = data.results;
           
            var gt = $('<div id ="gTitle-p' + '" />')
                   .css("margin", "2px" )
                   .css("background-color", "slate" )
                   .html('Harvest Show');
            $("#cb").append(gt);

            for (var i in dres) {
              var xtm = dres[i];
              var xtm2 = JSON.parse(xtm);
              var pvr = xtm2.rows;
              var cInfo = '<b>' + pvr.title + '</b>';
              var gCard = $('<div id ="gCard-' + pvr.body.fileIdentifier + '" class="g-item-card" />')
                   .css("margin", "5px" )
                   .css("background-color", "white" )
                   .html(cInfo);

              var mod = $('<div style="background-color: white;" />')
                  .html('Last Modified: ' + pvr.modified);

               var  fid = $('<div style="background-color: white;" />')
                  .html('GUID : ' + pvr.body.fileIdentifier);
               
              var abs = $('<div style="background-color: white;" />')
                  .html('Abstract: ' + pvr.body.identificationInfo.abstract.substring(0,240) + '...');
          
              gCard.append(mod);
              gCard.append(fid);
              gCard.append(abs);

              $("#rec-results").append(gCard);

           }
           // var pd = JSON.stringify(data);
           //  $("#cb").html(pd);

      })

  }

  function show_harvest_history() {

  		harvestAction='History';
  		$("#cb").show();
  		$("#widget-box").hide();
	  
      $("#rec-results").empty();  

      var hj = $('#srcCollection').find(":selected").text();

      //	$("#cb-title").html("Harvest Job History for "+ hj);
  }


var showRemoteXML = function() {

  //var xUrl = '/cswRBId?guid=98ddf901b9782a25982e01af3b0bda50&action=full&outputFormat=application/xml'

  var xUrl = '/csw/getRecordByID??guid=98ddf901b9782a25982e01af3b0bda50&action=full&outputFormat=application/xml'
  //var w = window.open(xUrl);

  var jqxhr = $.get(xUrl, function() {
        console.log( "success - 1" );
      })
      .done(function(data) { 
        var x = data.children[0];

        //var xAt = '<?xml version=\'1.0\' ?>' + new XMLSerializer().serializeToString(data);
         var xSt = new XMLSerializer().serializeToString(data);
         var xt = formatXml(xSt);

         //var xt = 'data:text/xml,'+ encodeURIComponent( xSt );
         //var xt = 'data:text/xml,'+ xSt ;
         
         //parser = new DOMParser()
         //xmlDoc = parser.parseFromString(x, "text/xml")

        //let blob = new Blob(['<yourxmlstringhere></yourxmlstringhere>'], {type: 'text/xml'});
        //let url = URL.createObjectURL(blob);
        //window.open(url);
        // var xDoc = $.parseXML(x);

         console.log(x);

        var w = window.open();
        w.document.open('text/xml');
        w.document.write('<?xml version=\'1.0\' ?>'+xt);
        //w.document.write('<?xml version=\'1.0\' ?><iframe src="' + xt + '" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>');
        // w.document.write('data:text/xml,' + xt);

        // w.document.body.innerHTML = xt;


      });

}



function show_preview(o) {

  	  harvestAction='Preview';
  	 
  	  if ( typeof(o.selectedIndex) !== "undefined" ) {
    	var so = o.options[o.selectedIndex];
  		var hsid = $(so).val();
      var hurl = $(so).attr('tag');
      var hj = $(so).text();    
     
  	  //var hj = $('#srcCollection').find(":selected").text();

  	  	// var hsid = o.options[o.selectedIndex].value;
      
       }

  	  $("#cb").show();
  	  $("#cb-title").html('<h2>Harvest Preview from ' + hj + '</h2>');
  	  $("#rec-results").empty();
  	  $("#widget-box").hide();

      //sOff++;
      var gUrl = '/preview?hurl='+hurl+'&offset='+sOff.toString()+'&hid='+hsid.toString();
      var jqxhr = $.get(gUrl, function() {
        console.log( "success - 1" );
      })
      .done(function(data) { 
          var dres = data.results;
          var dx = {};
          if ( data.hasOwnProperty('lv')  ) {
          	// Some records have already been saved
          		var locRex = data.lv;
          		for (var k in locRex) {
          			var lr = locRex[k];
          			var lg = lr.guid;
          			var ld = lr.create_date;
          			dx[lg] = ld;
          		}

          }
         
           var gt = $('<div id ="gTitle-p' + '" />')
                   .css("margin", "2px" )
                   .css("background-color", "slate" );
                   //.html('Harvest Preview');
            $("#cb").append(gt);

           for (var i in dres) {
              console.log(' type '+typeof(dres[i]));
              if ( typeof dres[i]  !== "object" ) {
                var pvr = JSON.parse(dres[i]);
              } else {
                pvr = dres[i];
              }

              if ( pvr.body ) {
                pvr = pvr.body;
              }
              var cInfo = '<b>' + pvr.title + '</b>';
              var rGuid = pvr.fileIdentifier;
              if  ( dx.hasOwnProperty(rGuid) ) {
              	  var sColr = '#dddddd';
              	  var dcs = 'Metadata Date - Remote: ' + pvr.modified + '   Local: ' + dx[rGuid];
              } else {
              	  var sColr = 'white';
              	  var dcs = 'MD Date Remote: ' + pvr.modified;
              }

              var gCard = $('<div id ="gCard-' + rGuid + '" class="g-item-card" style="margin:5px;" />')
                  .css('background-color',sColr);
                 //.html(cInfo);

             var gTitle = $('<span id="gt-'+ pvr.fileIdentifier + '" >' + cInfo + '</span>');

              var mod = $('<div  />')
              	   .css('background-color',sColr)
                  .html(dcs);
               var  fid = $('<div  />')
                   .css('background-color',sColr)
                  .html('GUID : ' + rGuid);
              
              var abx = 'Abstract missing '; 
              if ( typeof(pvr.identificationInfo.abstract) !== "undefined" ) {
                abx = pvr.identificationInfo.abstract.substring(0,240);
              }
              var abs = $('<div  id ="ga-' + rGuid + '"/>')
                   .css('background-color',sColr)
                  .html('Abstract: ' + abx + '...');

            var xUrl = '/csw/getRecordById?guid='+ pvr.fileIdentifier+'&action=full&outputFormat=application/xml&hurl='+hurl;
			     //var voBtn = $('<button id="vo-'+ pvr.body.fileIdentifier + '" class="action-button" onclick="mdviewXML(this)">View XML</button>');
            var v2Btn = $('<a id="vo-'+ pvr.fileIdentifier + '" class="action-button" href="'+xUrl+'" target="_blank" >View XML</button>');
            var vlBtn = $('<button id="vb-'+ pvr.fileIdentifier + '" class="action-button" onclick="md_validate(this)">Validate</button>');
            var scBtn = $('<button id="sv-'+ pvr.fileIdentifier + '" class="action-button" onclick="schema_view(this)">Schema View</button>');
            var hBtn = $('<button id="ho-'+ pvr.fileIdentifier + '" class="action-button" onclick="harvest_one(this)">Harvest</button>');
            var provBtn = $('<button id="sh-'+ pvr.fileIdentifier + '" class="action-button" onclick="show_prov(this)">History</button>');
            
            gCard.append(gTitle) ;
            gCard.append(mod);
            gCard.append(fid);

            gCard.append(abs);
              //gCard.append(voBtn);
            gCard.append(v2Btn);
            gCard.append(vlBtn);
            gCard.append(scBtn);
            gCard.append(hBtn);
            gCard.append(provBtn);
            $("#rec-results").append(gCard);

           }

      })

  }

var harvest_one = function(o) {
  var guid = o.id.substring(3);
  var hs = gSrcInfo.set_id;
  var hurl  = gSrcInfo.source_url;
  var gt = $("#gt-"+guid).text();
  gt = encodeURIComponent(gt);

  var gUrl = '/csw/harvestRecord?guid='+guid+'&hurl='+hurl+'&outputFormat=application/xml&action=full&setid='+hs+'&title='+gt;

  var jqxhr = $.get(gUrl, function() {
        console.log( "success - 1" );
    })
    .done(function(data) { 
      console.log(data);
      if ( data.rows ) {
        $("#gCard-"+guid).css('background-color','#dddddd');
         $("#gt-"+guid).css('background-color','#dddddd');
          $("#ga-"+guid).css('background-color','#dddddd');
      }

    });



}

/* Process Module Functions */

  function processView() {

  	$("#leftProcess").show();
  	$("#proc").show();

  	$("#leftSearch").hide();
  	$("#leftHarvest").hide();
    $("#cb").hide();

    $("#widget-box").hide();

  	$("#proc-title").html("<h2>Process Automation</h2>");
    $("#proc-results").empty();
    //harvestSourceList();

  }

var mdviewXML = function(o) {

    $("#widget-box").show();
    $("#widget-view").empty();
    showRemoteXML();
  /*
	var og = $("#srcCollection");
    if ( og[0] ) { og = og[0] }
    var so = og.options[og.selectedIndex];
  	var hsid = $(so).value;
    var hurl = $(so).attr('tag');

  
	var guid = o.id.slice(3);
	
    var gUrl = '/cswRecordById?guid='+guid+'&hurl='+hurl+'&action=view';

	var jqxhr = $.get(gUrl, function() {
        		console.log( "remote viwer" );
      	})
      	.done(function(data) { 
      		var res = data;

      		console.log(JSON.stringify(data));

      	});
  
  */


}
