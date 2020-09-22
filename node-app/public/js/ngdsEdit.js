/*
UI module for md Editing, new Contributions and Collections
*/

var gCoLst = [];
var gCvLst = [];
var gBD = {};
var gPkEd = {};
var gBforUndo = {};
var gSchemas = [];
var gCSD = {}; // current schema detail
var gFSD = {};
var gEdBuf = {};
var gGuid = [];

var edView = function (o) {

    var gMemuSel = 'e';
    
    if ( o ) {
        $("#leftSearch").hide();
        $("#widget-box").hide();
        $("#leftMDRecord").hide();
        $("#cb").hide();

        $("#leftEdit").show();
        $("#rightEdit").show();

        $("#leftCollection").hide();
        $("#rightCollection").hide();

        if ( kmu(gKey) ) {
          lpTemplate();
        }            
    }


}

var lpTemplate = function(o) {

    $("#ed-l-admin").empty();
    $("#ed-l-widget").empty();

    var uBtn =   $('<a id="uBtn" class="res-tag" >Manager Users</a>')
        .css("font-size", "12px")
        .css("margin", "7px 1px 1px 7px;")
        .css("padding","5px 5px")
        .css("display","inline:block")
        .css("width","100px")
        .css("background-color", "#2191c2")
        .attr('onclick','userMan(this);');

    var noBtn =  $('<a id="nBtn" class="res-tag" >Notifications</a>')
        .css("font-size", "12px")
        .css("margin", "1px 1px 1px 7px;")
        .css("padding","5px 5px")
        .css("display","inline:block")
        .css("width","100px")
        .css("background-color", "#2191c2")
        .attr('onclick','notifyMan(this);');

    var hBtn =  $('<a id="hbtn" class="res-tag" >Harvest</a>')
        .css("font-size", "12px")
        .css("margin", "1px 1px 1px 7px;")
        .css("padding","5px 5px")
        .css("display","inline:block")
        .css("width","100px")
        .css("background-color", "#2191c2")
        .attr('onclick','harvestMan(this);');

    $("#ed-l-admin").append(hBtn);
    $("#ed-l-admin").append('</br>');
    $("#ed-l-admin").append(uBtn);
    $("#ed-l-admin").append('</br>');
    $("#ed-l-admin").append(noBtn);

    var nBtn =   $('<a id="" class="res-tag" >Add New Record</a>')
                            .css("font-size", "12px")
                            .css("margin", "7px 1px 1px 7px;")
                            .css("padding","5px 5px")
                            .css("display","inline:block")
                            .css("width","100px")
                            .css("background-color", "#2191c2")
                            .attr('onclick','newMD(this);');

    var eBtn =   $('<a id="" class="res-tag" >Schema Editor</a>')
                            .css("font-size", "12px")
                            .css("margin", "1px 1px 1px 7px;")
                            .css("padding","5px 5px")
                            .css("display","inline:block")
                            .css("width","100px")
                            .css("background-color", "#2191c2")
                            .attr('onclick','schemaMap(this);');

    var bBtn =   $('<a id="" class="res-tag" >Batch Editor</a>')
                            .css("font-size", "12px")
                            .css("margin","1px 1px 1px 7px;")
                            .css("padding","5px 5px")
                            .css("display","inline:block")
                            .css("width","100px")
                            .css("background-color", "#2191c2")
                            .attr('onclick','batchMD(this);');

    var vBtn =  $('<a id="" class="res-tag" >Validate</a>')
                            .css("font-size", "12px")
                            .css("margin", "1px 1px 1px 7px;")
                            .css("padding","5px 5px")
                            .css("display","inline:block")
                            .css("width","100px")
                            .css("background-color", "#2191c2")
                            .attr('onclick','validate(this);');

  
    var scl = $('<p>Previous Edit Collections</p>')
        .css("font-family","Arial")
        .css("font-size","12px")
        .css("font-color","12px");

    var co = $('<option value="Midx">Collection Text</option>');

    var selCol = $('<select id="selCol" name="selCol" onchange="pickEdit(this)"></select>')
                        .css("font-family","Arial")
                        .css("font-size","12px")
                        .css("font-color","12px")
                        .css("border-color","#888888")
                        .css("width","150px");
    selCol.append(co);

  
    
    $("#ed-l-widget").append(nBtn);

    $("#ed-l-widget").append('<div id="newOpts"></div>');
    $("#ed-l-widget").append(eBtn);
    $("#ed-l-widget").append('</br>');
    $("#ed-l-widget").append(vBtn);
    $("#ed-l-widget").append('</br>');
    $("#ed-l-widget").append(bBtn);
    $("#ed-l-widget").append('</br>');


   $("#editFrame").empty();
   var hb = $('<h4>Recent Admin Activities</h4>');
   $("#editFrame").append(hb);
   $("#editFrame").append('<div id="intro-activity"></div>');


}

var batEdHistory = function() {

}

/* Harvest functions */
var harvestMan = function(o) {

    var htxt = 'Metadata Harvest Manager';
    $("#editFrame").empty();
    var hb = $('<h4>' + htxt+ '</h4>');
    $("#editFrame").append(hb);
    $("#editFrame").append('<div id="hrvSrc"></div>');
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

var gSrcInfo = [];

var lC = function(o) {
    var aCL = JSON.stringify(o);
    var co = JSON.parse(aCL);
return co;
}

var harvestSourceList = function() {
    $("#hrvSrc").empty(); 
    $("#hrvSrc").append('<span >Create New Harvest Source</span>');

    var nBtn =  $('<a id="newHarvSrc" class="res-tag" >New </a>')
            .css("font-size", "12px")
            .css("margin", "7px 1px 1px 7px;")
            .css("padding","5px 5px")
            .css("display","inline:block")
            //.css("width","100px")
            .css("background-color", "#2191c2")
            .attr('onclick','newHarvestSrc(this);');
    $("#hrvSrc").append(nBtn);

    var tbx =  $('<table id="hsTab" style="bgcolor:light-gray; width: 80%"></table>');
    var tho = $('<tr>');
    var td1 = $('<th></th>');
    var td2 = $('<th></th>');
    var td3 = $('<th style="width"300px;">Harvest Source</th>');
    var td4 = $('<th>Url</th>');
    var td5 = $('<th>Records</th>');
    var td6 = $('<th>Schema</th>');

    tho.append(td1);
    tho.append(td2);
    tho.append(td3);
    tho.append(td4);
    tho.append(td5);
    tho.append(td6);
    tbx.append(tho);

    $("#hrvSrc").append(tbx);
    gSrcInfo = [];
  	var hUrl = '/action/harvestSourceList';
    var jqxhr = $.get(hUrl, function() {
            console.log( "harvest source List" );
    })
    .done(function(data) { 
    
        if (typeof(data) == "object" ) {
            var dres = data;
        } else {
            var dres = JSON.parse(data);
        }
        gSrcInfo = dres.rows;

        for (k in gSrcInfo) {
            var ro = gSrcInfo[k];
            var hid = ro.set_id;
            var to = $('<tr>');
            var tda = $('<td id="hsa-'+hid+'">');
            var tdab = $('<td id="hsab-'+hid+'">');
            var jBtn =  $('<a id="hjob-' + hid + '" class="res-tag" >Jobs</a>')
                        .css("font-size", "11px")
                        .css("margin", "3px 1px 1px 3px;")
                        .css("padding","3px 3px")
                      
                        .css("background-color", "#2191c2")
                        .attr('onclick','harvJobMan(this);');
            var eBtn =  $('<a id="hedt-' + hid + '" class="res-tag" >Edit</a>')
                        .css("font-size", "11px")
                        .css("margin", "3px 1px 1px 3px;")
                        .css("padding","3px 3px")
                        
                        .css("background-color", "#2191c2")
                        .attr('onclick','harvSrcEdit(this);');
            tda.append(eBtn);
            tdab.append(jBtn);
            
            var tdb = $('<td id="hsb-'+hid+'"><span style="font-size:11px">'+ ro.set_name + '</span></td>');
            var tdc = $('<td id="hsc-'+hid+'"><span style="font-size:11px">'+ ro.source_url + '</span></td>');
            var tdd = $('<td id="hsd-'+hid+'"><span style="font-size:11px">'+ ro.rcount + '</span></td>');
            var tde = $('<td id="hse-'+hid+'"><span style="font-size:11px">'+ ro.schema_name + '</span></td>');

            to.append(tda);
            to.append(tdab);
            to.append(tdb);
            to.append(tdc);
            to.append(tdd);
            to.append(tde);
            tbx.append(to);
        }
    });

  }	

/* END -- Harvest functions */

/* User Admin  functions */
var userMan = function(o) {
    console.log('setup user form');
    var htxt = 'Manage Users';
    
    var t =  kmu(gKey);

    $("#uTab tr").remove();
    var tbx =  $('<table id="uTab" style="bgcolor:light-gray; width: 80%"></table>');

    $("#editFrame").empty();
    var hb = $('<h4>' + htxt+ '</h4>');
    $("#editFrame").append(hb);

    var oBtn =  $('<a id="addUser" class="res-tag" >Add New User</a>')
    .css("font-size", "11px")
    .css("margin", "5px")
    .css("padding","2px 2px")
    .css("background-color", "#2191c2")
    .attr('onclick','addUser(this);');
    $("#editFrame").append(oBtn);

    var bUrl = '/action/getUsers?t='+t;
    var jqxhr = $.get(bUrl, function() {
        console.log( "success get users " );
        })
    .done(function(data) { 
        if (typeof(data) == "object" ) {
            var dres = data;
        } else {
            var dres = JSON.parse(data);
        }
       
        if ( dres.rows.length > 0 ) {
            var to = $('<tr>');
            var tn = $('<td ><span style="font-size:12px; font-weight: bold; color:light-gray ;">Username</span></td>');
            var ty = $('<td ><span style="font-size:12px; font-weight: bold; color:light-gray;">Type</span></td>');
            var tf = $('<td "><span style="font-size:12px;font-weight: bold; color:light-gray;">Full name</span></td>');
            var te = $('<td><span style="font-size:12px; font-weight: bold;color:light-gray;">Email</span></td>');
            var tb = $('<td><span style="font-size:12px; font-weight: bold;color:light-gray;">Action</span></td>');

            to.append(tn);
            to.append(ty);
            to.append(tf);
            to.append(te);
            to.append(tb);
            tbx.append(to);

        }

        for(k in dres.rows) {

            var to = $('<tr>');
            var u = dres.rows[k];
            if ( u.agent_id == 1 ) {
                var utype = 'admin';
            } else {
                var utype = 'editor';
            }
            
            var tn = $('<td id="uname-'+u.user_id+'"><span style="font-size:11px; bgcolor:light-gray;">' + u.name + '</span></td>');
            var ty = $('<td id="u-type-'+u.user_id+'"><span style="font-size:11px; bgcolor:light-gray;">' +  utype + '</span></td>');
            var tf = $('<td id="u-fn-'+u.user_id+'"><span style="font-size:11px; bgcolor:light-gray;">' +  u.fullname + '</span></td>');
            var te = $('<td id="u-em-'+u.user_id+'"><span style="font-size:11px; bgcolor:light-gray;">' +  u.email + '</span></td>');

            var eBtn =  $('<a id="u-ed-'+u.user_id+'" class="res-tag" >Edit</a>')
                            .css("font-size", "11px")
                            .css("margin", "2px")
                            .css("padding","2px 2px")
                            .css("background-color", "#2191c2")
                            .attr('onclick','edUser(this);');

            var dBtn =  $('<a id="u-del-'+u.user_id+'" class="res-tag" > Remove </a>')
                            .css("font-size", "11px")
                            .css("margin", "2px")
                            .css("padding","2px 2px")
                            .css("background-color", "#2191c2")
                            .attr('onclick','delUser(this);');

            var tb = $('<td id="u-em-'+u.user_id+'">');
            tb.append(eBtn);
            tb.append(dBtn);

            to.append(tn);
            to.append(ty);
            to.append(tf);
            to.append(te);
            to.append(tb);
            tbx.append(to);
        }

        $("#editFrame").append(tbx);
       
    });

}

var addUser = function(o) {

}

var edUser = function(o) {

}

var delUser = function(o) {

}

var notifyMan = function(o) {
    console.log('notification form');
    var htxt = 'Metadata Notifications';
    
    $("#editFrame").empty();
    var hb = $('<h4>' + htxt+ '</h4>');
    $("#editFrame").append(hb);
}

var validate = function(o) {
    console.log('validation form');
    var htxt = 'Data Validate Tools';
    
    $("#editFrame").empty();
    var hb = $('<h4>' + htxt+ '</h4>');
    $("#editFrame").append(hb);
    $("#editFrame").append('<p id="pvalcomment">Validate a collection of metadata records against a schema.</p>');

    var tb = $('<table width="50%"></table>');
    var tr = $('<tr></tr>');
    var tdaa = $('<td><span>Select Collection Type: </span></td>');
    var selCtype = $('<select id="selCtype" onclick="pickValType(this)" name="selCtype"></select>')
                        .css("font-family","Arial")
                        .css("font-size","11px")
                        .css("font-color","#888888")
                        .css("border-color","#888888")
                        .css("width","150px");
    var ca = $('<option value="harvest">Harvests</option>');
    var co = $('<option value="batch-edit">Saved Batch Edits</option>');
    var cl = $('<option value="local-saved">Local Saved</option>');
    selCtype.append(ca);
    selCtype.append(co);
    selCtype.append(cl);
    var tdab = $('<td></td>');
    tdab.append(selCtype);
    tr.append(tdaa);
    tr.append(tdab);
    tb.append(tr);

    var trb = $('<tr></tr>');
    var td2a = $('<td><span>Select a specific collection:  </span></td>');

    var selVCol = $('<select id="selValCol" name="selValCol" onchange="valPick(this)"></select>')
                        .css("font-family","Arial")
                        .css("font-size","12px")
                        .css("font-color","12px")
                        .css("border-color","#888888")
                        .css("width","150px");

    var td2b = $('<td></td>');
    td2b.append(selVCol);
    trb.append(td2a);
    trb.append(td2b);
    tb.append(trb);

    var trc = $('<tr></tr>');
    var td3a = $('<td><span>Select a schema:  </span></td>');
    
    var selVScm = $('<select id="selValScma" name="selValScma"></select>')
                        .css("font-family","Arial")
                        .css("font-size","12px")
                        .css("font-color","12px")
                        .css("border-color","#888888")
                        .css("width","150px");
    
    var td3b = $('<td></td>');
    td3b.append(selVScm);
    trc.append(td3a);
    trc.append(td3b);
    tb.append(trc);

    var selVCnt = $('<select id="selVCount" name="selVCount"></select>')
                        .css("font-family","Arial")
                        .css("font-size","11px")
                        .css("font-color","#888888")
                        .css("border-color","#888888")
                        .css("width","20px");

    var vc1 = $('<option value="1">1</option>');
    var vc10 = $('<option value="10">10</option>');
    var vca = $('<option value="all">All</option>');
    selVCnt.append(vc1);
    selVCnt.append(vc10);
    selVCnt.append(vca);    

    var vBtn =  $('<a id="valPick" class="res-tag" >Select</a>')
        .css("font-size", "12px")
        .css("margin", "5px")
        .css("padding","5px 5px")
        .css("background-color", "#2191c2")
        .attr('onclick','processValidation(this);');

    $("#editFrame").append(tb);
    $("#editFrame").append(vBtn);
    getSchemaList(selVScm); 

    $("#editFrame").append('<div id="mdvalcol"></div>');


}

var getSchemaList = function(selSchema) {

    if ( gSchemas.length ) {
        applySchemaList(selSchema);
    } else {
        var bUrl = '/action/getSchemas';
        var jqxhr = $.get(bUrl, function() {
            console.log( "success getschemas " );
            })
        .done(function(data) { 
            if (typeof(data) == "object" ) {
                var dres = data;
            } else {
                var dres = JSON.parse(data);
            }
            gSchemas = dres.rows;
            applySchemaList(selSchema);
        });
    }
}

var applySchemaList = function(selSchema) {

    for (var i in gSchemas) {
        var sid = gSchemas[i].schema_id;
        var stxt = gSchemas[i].schema_name; 
        if ( gSchemas[i].scount ) {
            var sc = ' ( '+ gSchemas[i].scount + ' )'
        } else {
            var sc = ' ( 0 )';
        }
        var so = $('<option value="'+sid+'">' + stxt + '</option>');
        if ( gSchemas[i].auth_source == 'ngds') {
           
        } else {
            var so = $('<option value="'+sid+'">' + stxt + sc + '</option>');
            selSchema.append(so);
        }
    }

    
}

var pickValType = function(o) {

    var oid = o.id;
    var clist = $("#selValCol");
    var c = $("#selCtype option:selected").val();

    if ( c == 'harvest') {
        getCollectionList('selValCol','harvest');

    } else if ( c == 'batch-edit') {
        getCollectionList('selValCol','batch-edit');

    } else if ( c == 'local-saved') {
        guidA=[];
        var keez = Object.keys(localStorage);
        for (k in keez) {
            var key = keez[k];
            if (key != "SearchHistory" && key != "gDataMapBounds") {
                var guid = key.substr(3);
                guidA.push(guid);  
            }
        }

        var seo = $('<option val="local">local-saved (' + guidA.length + ') </option>');
        $("#selValCol").find('option')
                        .remove();
        $("#selValCol").append(seo);


    }

}

var valPick = function(o) {

    var c = $("#selCtype option:selected").val();
    var v = $("#selValCol option:selected").val();

    if ( o.id == 'selValCol') {
        getCollectionList('selValCol', c );
    } else {
        if ( v ) {
            bldValidationTemplate(c,v);
        } else {
            $("#pvalcomment").text("Select a collection to process");
        }
    }

}

var processValidation = function(o) {
    var c = $("#selCtype option:selected").val();
    var set_id = $("#selValCol option:selected").val();
    var sid =  $("#selValScma option:selected").val();

    if ( c == 'harvest') {
       

    } else if ( c == 'batch-edit') {
       

    } else if ( c == 'local-saved') {

    }



}
var bldValidationTemplate = function(c,v) {

}

var newMD = function() {

    var htxt = 'New Metadata Record';
    
    $("#editFrame").empty();
    var hb = $('<h4>' + htxt+ '</h4>');
    $("#editFrame").append(hb);

    var selFtype = $('<input list="fType" name="selType">');

    var selFmt = $('<select id="selFormat" name="selFormat"></select>')
                        .css("font-family","Arial")
                        .css("font-size","12px")
                        .css("font-color","12px")
                        .css("border-color","#888888")
                        .css("width","120px");
    var co = $('<option value="ISO-19115">ISO-91115</option>');
    selFmt.append(co);

    var selType = $('<select id="selType" name="selType"></select>')
                        .css("font-family","Arial")
                        .css("font-size","12px")
                        .css("font-color","12px")
                        .css("border-color","#888888")
                        .css("width","120px");
    var ot = $('<option value="Short">Short</option>');
    var otf = $('<option value="Full">Full</option>');
    selType.append(ot);
    selType.append(otf);

    var oBtn =  $('<a id="" class="res-tag" >Select</a>')
                            .css("font-size", "11px")
                            .css("margin", "5px")
                            .css("padding","2px 2px")
                            .css("background-color", "#2191c2")
                            .attr('onclick','newEditConstructor(this);');

    $("#editFrame").append('<span>Format: </span>');
    $("#editFrame").append(selFmt);
    $("#editFrame").append('<span>Form: </span>');
    $("#editFrame").append(selType);
    $("#editFrame").append(oBtn);
   

}

var newEditConstructor = function(o) {
    // this will allow db driven schemas' - static for now
    var sFmt = $("#selFormat option:selected").text();
    var sType = $("#selType option:selected").text();
    


}

var rpNewTemplate = function(o) {

}

var pickEdit = function(o) {

    var selCol = $(o).children("option:selected").text();
    var setid = $(o).children("option:selected").val();
  
    console.log(' selected ' + selCol + setid);
    batchMD(o,setid);
    
}

/* Start  schema functions */
var schemaMap = function(o) {

    $("#editFrame").empty();
    var hb = $('<h4>Metadata Schema  - Editor and Mapping Metadata</h4>');
    $("#editFrame").append(hb);

    var tbx =  $('<table id="smTab" style="bgcolor:light-gray; width: 50%"></table>');
    var tr1 = $('<tr>');
    var td1 = $('<td>');
    var td2 = $('<td>');
    var td3 = $('<td>');

    var fedSchema = $('<select id="selFedSchema" name="fedSchema"></select>')
            .css("font-family","Arial")
            .css("font-size","12px")
            .css("font-color","12px")
            .css("border-color","#888888")
            .css("width","200px");

    var fBtn =  $('<a id="pickFedSchem" class="res-tag" >Select Federated</a>')
            .css("font-size", "12px")
            .css("margin", "7px 1px 1px 7px;")
            .css("padding","5px 5px")
            .css("display","inline:block")
            .css("width","100px")
            .css("background-color", "#2191c2")
            .attr('onclick','pickSchema(this);');

    td1.append('<span >Internal Schema Viewer</span>');
    td2.append(fedSchema);
    td3.append(fBtn);
    tr1.append(td1);
    tr1.append(td2);
    tr1.append(td3);
    tbx.append(tr1);
    var tr2 = $('<tr>');
    var td21 = $('<td colspan=3>');
  
    td21.append('<span>The federated schema is view only.</span>');
    tr2.append(td21);
    tbx.append(tr2);

    var tr3 = $('<tr>');
    var td31 = $('<td>');
    var td32 = $('<td>');
    var td33 = $('<td>');
    var selSchema = $('<select id="selSchema" name="selSchema"></select>')
            .css("font-family","Arial")
            .css("font-size","12px")
            .css("font-color","12px")
            .css("border-color","#888888")
            .css("width","200px");

    var sBtn =  $('<a id="pickSchem" class="res-tag" >Select Schema </a>')
            .css("font-size", "12px")
            .css("margin", "7px 1px 1px 7px;")
            .css("padding","5px 5px")
            .css("display","inline:block")
            .css("width","100px")
            .css("background-color", "#2191c2")
            .attr('onclick','pickSchema(this);');

    td31.append('<span>Active Schemas</span>');
    td32.append(selSchema);
    td33.append(sBtn);
    tr3.append(td31);
    tr3.append(td32);
    tr3.append(td33);
    tbx.append(tr3);

    var tr4 = $('<tr>');
    var td41 = $('<td>');
    var td42 = $('<td>');
    var td43 = $('<td>');

    var nBtn =  $('<a id="newSchema" class="res-tag" >New</a>')
            .css("font-size", "12px")
            .css("margin", "7px 1px 1px 7px;")
            .css("padding","5px 5px")
            .css("display","inline:block")
            .css("width","100px")
            .css("background-color", "#2191c2")
            .attr('onclick','pickSchema(this);');

    td41.append('<span >Create New Schema</span>');
    td42.append('<span></span>');
    td43.append(nBtn);
    tr4.append(td41);
    tr4.append(td42);
    tr4.append(td43);
    tbx.append(tr4);

    $("#editFrame").append(tbx);
    $("#editFrame").append('<div id=schemResult></div>');
    
    var bUrl = '/action/getSchemas';
    var jqxhr = $.get(bUrl, function() {
        console.log( "success getschemas " );
        })
    .done(function(data) { 
            if (typeof(data) == "object" ) {
                var dres = data;
        } else {
                var dres = JSON.parse(data);
        }
        gSchemas = dres.rows;
         
        for (var i in gSchemas) {
            var sid = gSchemas[i].schema_id;
            var stxt = gSchemas[i].schema_name; 
            if ( gSchemas[i].scount ) {
                var sc = ' ( '+ gSchemas[i].scount + ' )'
            } else {
                var sc = ' ( 0 )';
            }
            var so = $('<option value="'+sid+'">' + stxt + '</option>');
            if ( gSchemas[i].auth_source == 'ngds') {
                var so = $('<option value="'+sid+'">' + stxt + '</option>');
                fedSchema.append(so);
            } else {
                var so = $('<option value="'+sid+'">' + stxt + sc + '</option>');
                selSchema.append(so);
            }
        }
        sDetFed(10);
    });

}

var pickSchema = function(o) {
    var sa = o.id;

    $("#schemResult").empty();

    if ( sa == 'newSchema') {
        var sid = $("#selFedSchema").val();
        schemaDetail(sid,'new');
    } else if ( sa == 'pickFedSchem') {
        var sid = $("#selFedSchema").val();
        schemaDetail(sid,'fed');
    } else {
        // pick schema
        var sid = $("#selSchema").val();
        schemaDetail(sid,'edit');
    }
}

var sDetFed = function(sid) {

    sid = 10;
    gFSD = {};
    gFSD.sid = 10;
    gFSD.smap = [];
    gFSD.som = [];
    var bUrl = '/action/getSchemas?sid='+sid;

    var jqxhr = $.get(bUrl, function() {
        console.log( "success getschemas " );
        })
    .done(function(data) { 
            if (typeof(data) == "object" ) {
                var dres = data;
        } else {
                var dres = JSON.parse(data);
        }
        var zx = dres.rows;
        for (i in zx) {
            if ( zx[i].moid == "0") {
                gFSD.smap.push(zx[i]);
            } else {
                gFSD.som.push(zx[i]);
            }
        }
      
    });
}

var schemaDetail = function(sid, action) {

    var bUrl = '/action/getSchemas?sid='+sid;
    gCSD = {};
    gCSD.sid = sid;
    gCSD.action = action;
    gCSD.map = [];

    var jqxhr = $.get(bUrl, function() {
        console.log( "success getschemas " );
        })
    .done(function(data) { 
            if (typeof(data) == "object" ) {
                var dres = data;
        } else {
                var dres = JSON.parse(data);
        }
        gCSD.map = dres.rows;
        if (gCSD.action == 'edit') {
            schemaTemplate(sid);
        }
        if (gCSD.action == 'fed') {
            schemaTemplate(sid);
        }
 
        if (gCSD.action == 'new') {
            newSchemaForm(sid);
        }

    });
}

var newSchemaForm = function(sid) {

    $("#newSchema").hide();
    $("#schemResult").append('<span>Create a New Schema</span>')
    .css("font-family","Arial")
    .css("font-weight","bold")
    .css("font-size","12px");
 
    $("#schemResult").append('</br>');

    var nsn = $('<input id="newSchemaName" type="text" size="40" placeholder="Enter Schema Name .. ">')
            .css("font-family","Arial")
            .css("font-size","12px")
            .css("border-width","1px")
            .css("border-color","#888888");

    var asn = $('<input id="authSource" type="text" size="40" placeholder="Source description.. ">')
            .css("font-family","Arial")
            .css("font-size","12px")
            .css("border-width","1px")
            .css("border-color","#888888");

    var sBtn =  $('<a id="saveNewSchema" class="res-tag" >Save</a>')
            .css("font-size", "12px")
            .css("margin", "7px 1px 1px 7px;")
            .css("padding","5px 5px")
            .css("display","inline:block")
            .css("width","100px")
            .css("background-color", "#2191c2")
            .attr('onclick','saveNewSchema(this);');

    $("#schemResult").append(nsn);
    $("#schemResult").append('</br>');     
    $("#schemResult").append(asn); 
    $("#schemResult").append('</br>');  
    $("#schemResult").append(sBtn);
    $("#schemResult").append('</br>');      
    
}

var saveNewSchema = function(o) {
    var sn = $("#newSchemaName").val();
    var as = $("#authSource").val();
    var snx = encodeURIComponent(sn);
    var asx = encodeURIComponent(as);

    var xUrl = '/action/createNewSchema?name='+snx+'&auth='+asx;

    var jqxhr = $.get(xUrl, function() {
        console.log( "add schema success " );
      })
    .done(function(data) { 
        if (typeof(data) == "object" ) {
             var dres = data;
        } else {
             var dres = JSON.parse(data);
        }
        var zx = dres.rows;

        $("#newSchema").show();
        var sid = zx[0].schema_id;
        var so = $('<option value="'+sid+'">' + sn + '</option>');
        $("#selSchema").append(so);
        $("#schemResult").empty();
 
    });


}

var schemaTemplate = function(o) {

    var tbx =  $('<table id="srTab" class="admin" style="bgcolor:light-gray; width: 80%"></table>');
    var trx = $('<tr>');
    var td1 = $('<th>Element Name</th>');
    var td2 = $('<th style="width"300px;">Path</th>');
    var td3 = $('<th>Type</th>');
    var td4 = $('<th>Validation Rule</th>');

    if ( gCSD.action == 'edit') {
        var td5 = $('<th>');
        var aBtn =  $('<a id="san-'+o+'" class="res-tag" >Add</a>')
                            .css("font-size", "11px")
                            .css("margin", "2px")
                            .css("padding","2px 2px")
                            .css("background-color", "#2191c2")
                            .attr('onclick','addNewElem(this);');
        td5.append(aBtn);
    } else {
        var td5 = $('<th>Action</th>');
    }
   
    trx.append(td5);
    trx.append(td1);
    trx.append(td3);
    trx.append(td4);
    trx.append(td2);
    tbx.append(trx);

    $("#schemResult").append(tbx);

    for (var i in gCSD.map) {
       
        var idx = gCSD.map[i].map_id + '-' + gCSD.map[i].moid;
        var rc = "#ffffff";
        if ( gCSD.map[i].stype == 'object' ) {
            rc = "#ddeeff";
        }

        if ( gCSD.map[i].moid !== "0" ) {
            rc = "#ddddff";
        }

        var trx = $('<tr id = "' + idx + '">')
                    .css("background-color", rc);
        
        var td1 = $('<td id = "fe-' + idx + '">'+ gCSD.map[i].fed_elem+'</td>');

        if ( gCSD.action == 'edit') {
            var mp = gCSD.map[i].map_path;
            if ( mp.length > 120 ) {
                var td2 = $('<td id = "mp-' + idx + '" title="'+mp+'">'+mp.substr(0,120)+' ...</td>');
            } else {
                var td2 = $('<td id = "mp-' + idx + '" font-size:10px">'+mp+'</td>');
            }
        } else {
            var td2 = $('<td id = "mp-' + idx + '" font-size:10px"></td>');
        }
        
        var td3 = $('<td id = "st-' + idx + '">'+gCSD.map[i].stype+'</td>');
       
        var rstxt ='none';
        switch(gCSD.map[i].valrule) {
            case "12": rstxt = 'required';  break;
            case "13": rstxt = 'recommended'; break;
            case "14": rstxt = 'complete';  break;
            default: rstxt ='none';
        }

        var td4 = $('<td id = "rs-' + idx + '">'+rstxt+'</td>');
        var td5 = $('<td id = "bd-' + idx + '">');
        if ( gCSD.action == 'edit') {
            var eBtn =  $('<a id="sed-'+idx+'" class="res-tag" >Edit</a>')
                            .css("font-size", "11px")
                            .css("margin", "2px")
                            .css("padding","2px 2px")
                            .css("background-color", "#2191c2")
                            .attr('onclick','editSI(this);');
            td5.append(eBtn);
        }
        trx.append(td5);
        trx.append(td1);
        trx.append(td3);
        trx.append(td4);
        trx.append(td2);
        tbx.append(trx);
    }
}

var addNewElem = function (o) {
    // ui constructor
    var tbx = $("#srTab");
    
    var sid = o.id.substr(4);
    var trx = $('<tr id ="anr-' + sid + '">');
    var td5 = $('<td id = "bd-new-' + sid + '">');
    var eBtn =  $('<a id="sed-new-'+sid+'" class="res-tag" >Save</a>')
        .css("font-size", "11px")
        .css("margin", "2px")
        .css("padding","2px 2px")
        .css("background-color", "#2191c2")
        .attr('onclick','saveNewElement(this);');
    var cBtn =  $('<a id="cancel-new-'+sid+'" class="res-tag" >Cancel</a>')
        .css("font-size", "11px")
        .css("margin", "2px")
        .css("padding","2px 2px")
        .css("background-color", "#D54B30")
        .attr('onclick','cancelSNE(this);');

    td5.append(eBtn);
    td5.append(cBtn);

    var td1 = $('<td id= "fe-' + sid + '"></td>');
    var zap = $('<select id="newFel" >');
    for (i in gFSD.smap ) {
        if ( gFSD.smap[i].stype == 'end') {
            var pref = 'map-';
        } else {
            var pref = 'obj-';
        }

        var aco =  $("<option>")
                .attr('value',pref+gFSD.smap[i].fed_elem)
                .text(pref+gFSD.smap[i].fed_elem);
        zap.append(aco);
    }
    for (i in gFSD.som ) {
        var aco =  $("<option>")
                .attr('value','sub-'+gFSD.som[i].fed_elem)
                .text('sub-'+gFSD.som[i].fed_elem);
        zap.append(aco);
    }
    td1.append(zap);

    var td2 = $('<td id= "st-' + sid + '"></td>');

    var tsi = $('<select id="newSelType" >');
    var to1 =  $("<option>").attr('value','end').text('end');
    var to2 =  $("<option>").attr('value','object').text('object');
    
    tsi.append(to1);
    tsi.append(to2);
    tsi.val('end').prop('selected',true);
    td2.append(tsi);

    var td3 = $('<td id= "rs-' + sid + '"></td>');
    var tsv = $('<select id="newValType" >');
    var tv1 =  $("<option>").attr('value','12').text('required');
    var tv2 =  $("<option>").attr('value','13').text('recommended');
    tsv.append(tv1);
    tsv.append(tv2);
    tsv.val('12').prop('selected',true);
    td3.append(tsv);

    var td4 = $('<td id= "mp-' + sid + '"></td>');
    var rd = $('<input id="newPath" type="text" size="80" placeholder="Element json path .. ">')
                    .css("font-family","Arial")
                    .css("font-size","11px")
                    .css("border-width","1px")
                    .css("border-color","#888888");
    td4.append(rd);

    trx.append(td5);
    trx.append(td1);
    trx.append(td2);
    trx.append(td3);
    trx.append(td4);
    $("#srTab tr:first").after(trx);
 

}

var saveNewElement = function(o) {
    var eid = o.id.substr(8);
    var nfe = $("#newFel option:selected").val();
    var sty = $("#newSelType option:selected").val();
    var vt = $("#newValType option:selected").val();
    var mp = $("#newPath").val();
    var fd = nfe.substr(4);

    if ( nfe.substr(0,3) == 'map' || nfe.substr(0,3) == 'obj' ) {
        var q = 'schema_map';
    } else {
        var q = 'schema_object_map';
    }
    var bUrl = '/action/saveSchemaElem?action=new&q='+q+'&sid='+eid
                +'&fe='+fd+'&type='+sty+'&vr='+vt+'&mp='+mp;
    var jqxhr = $.get(bUrl, function() {
        console.log( "add elem success " );
      })
    .done(function(data) { 
        if (typeof(data) == "object" ) {
             var dres = data;
        } else {
             var dres = JSON.parse(data);
        }

        var zx = dres.rows;
       
        $("#schemResult").empty();
        schemaDetail(gCSD.sid,'edit');
       
    });
    console.log(eid + nfe + sty + vt + mp);
   
}

var cancelSNE = function(o) {
    var eid = o.id.substr(11);
    $("#anr-"+eid).remove();
}

var editSI = function(o) {
    console.log('editSI - constructs edit line');
    var sid = o.id.substr(4);
    
    var mapid = sid.substr(0,sid.indexOf('-'));
    var moid = sid.substr(sid.indexOf('-'));
    if ( sid ) {
        
        for (k in gCSD.map) {
            var vx = gCSD.map[k].map_id + '-' + gCSD.map[k].moid;
            if ( vx == sid ) {
                var tb = $("#bd-"+ sid);
                var eBtn = $("#sed-"+ sid).text('Save')
                            .css("background-color", "#D54B30")
                            .attr('onclick','updateElem(this);');
                var xBtn =  $('<a id="delx-'+sid+'" class="res-tag" >Del</a>')
                            .css("font-size", "11px")
                            .css("margin", "2px")
                            .css("padding","2px 2px")
                            .css("background-color", "#D54B30")
                            .attr('onclick','deleteElem(this);');
                var cBtn =  $('<a id="cancelx-'+sid+'" class="res-tag" >Cancel</a>')
                            .css("font-size", "11px")
                            .css("margin", "2px")
                            .css("padding","2px 2px")
                            .css("background-color", "#D54B30")
                            .attr('onclick','cancelSed(this);');
                tb.append(xBtn);
                tb.append(cBtn);
                gEdBuf = {};
                gEdBuf.fedElem = $("#fe-"+ sid).text();
                gEdBuf.stype = $("#st-"+ sid).text();
                gEdBuf.valid = $("#rs-"+ sid).text();
                gEdBuf.mpath = $("#mp-"+ sid).text();

             
                var tdv = $("#rs-"+ sid).empty();
                var tdm = $("#mp-"+ sid).empty();
                var tsv = $('<select id="valType" >');
                var tv1 =  $("<option>").attr('value','12').text('required');
                var tv2 =  $("<option>").attr('value','13').text('recommended');
                tsv.append(tv1);
                tsv.append(tv2);

                var rd = $('<input id="pathEd" type="text" size="80" placeholder="Text with wildcards .. ">')
                    .css("font-family","Arial")
                    .css("font-size","12px")
                    .css("border-width","1px")
                    .css("border-color","#888888").val(gCSD.map[k].map_path);

                tdv.append(tsv);
                tdm.append(rd);    
            }
        }
    }

}

var deleteElem = function(o) {
    var ix = o.id.split('-');
    var mapid = ix[1];
    var moid = ix[2];
    var rid = mapid+'-'+moid;
   
    var xUrl = '/action/deleteSchemaElem?sid='+gCSD.sid+'&mapid='+mapid+'&moid='+moid;

    var jqxhr = $.get(xUrl, function() {
        console.log( "delete elem success " );
      })
    .done(function(data) { 
        if (typeof(data) == "object" ) {
             var dres = data;
        } else {
             var dres = JSON.parse(data);
        }
        $("#"+rid).remove();
    });

   


}

var cancelSed = function(o) {
    var sid = o.id.substr(8);
    $("#sed-"+sid).text('Edit')
                .css("background-color", "#2191c2")
                .attr('onclick','editSI(this);');
    $("#delx-"+sid).remove();
    $("#cancelx-"+sid).remove();
    
    var tdf = $("#fe-"+ sid).empty();
    var tdty = $("#st-"+ sid).empty();
    var tdv = $("#rs-"+ sid).empty();
    var tdm = $("#mp-"+ sid).empty();

    tdf.append(gEdBuf.fedElem);
    tdty.append(gEdBuf.stype);
    tdv.append(gEdBuf.valid);
    tdm.append(gEdBuf.mpath);

}

var updateElem = function(o) {
    var eid = o.id.split('-');
    var sid = gCSD.sid;
    var mapid = eid[1];
    var moid = eid[2];

    var nfe = $("#fe-"+mapid+'-'+moid).html();
    var sty = $("#st-"+mapid+'-'+moid).html();
    var vt = $("#valType option:selected").val();
    var mp = $("#pathEd").val();

    var bUrl = '/action/saveSchemaElem?action=update&mapid='+mapid+'&moid='+moid
                +'&sid='+sid+'&vr='+vt+'&mp='+mp;

    var jqxhr = $.get(bUrl, function() {
        console.log( "update elem success " );
      })
    .done(function(data) { 
        if (typeof(data) == "object" ) {
             var dres = data;
        } else {
             var dres = JSON.parse(data);
        }
        // keep local in sync
        for (k in gCSD.map) {
            if ( gCSD.map[k].map_id == mapid && gCSD.map[k].moid == moid ) {
                gCSD.map[k].map_path = mp;
                gCSD.map[k].valrule = vt;
            }
        }
        gEdBuf.fedElem = nfe;
        gEdBuf.stype = sty;
        gEdBuf.valid = vt;
        gEdBuf.mpath = mp;
        var o = { };
        o.id = 'cancelx-'+mapid+'-'+moid;
        cancelSed(o);
        
    });

}

/* End schema functions */

var batchMD = function(o,s) {

    var htxt = 'Batch Editor';
    var act = 'text-replace';
    var fld = 'Url';
    var qstr = '';

    if ( s ) {
        $("#resHdr").empty();
        $("#batchRes").empty();

        for(k in gCoLst) {
            if (gCoLst[k].sid == s ) {
                htxt = 'Batch Edit ' + gCoLst[k].sname + ' Date ' + gCoLst[k].sdate.substr(0,10);
                var sd = gCoLst[k].sdesc;
                var act = sd.substr(0,sd.indexOf(':'));
                var tz = sd.substr(act.length+1);

                var atz = tz.split(':-:');
                gPkEd.searchFld = atz[0];
                gPkEd.replFld = atz[1];
                fld = gCoLst[k].sname.split('-')[0]; 
                qstr  = gCoLst[k].sname.split('-')[1];           
              
                $("#beht").text(htxt);
                $("#batchAction").val(act).prop('selected',true);
                $("#batchFld").val(fld).prop('selected',true);
                $("#bfqry").val(qstr);
            }
        }
      
    } else {
        
        $("#editFrame").empty();
        var selCol = $('<select id="selBCol" name="selCol" onchange="pickEdit(this)"></select>')
                        .css("font-family","Arial")
                        .css("font-size","11px")
                        .css("margin","7px")
                        .css("font-color","11px")
                        .css("border-color","#888888")
                        .css("width","300px");

        var scl = $('<span>Edit History</span>')
            .css("font-family","Arial")
            .css("font-size","11px")
            .css("font-color","#444444");

        getCollectionList('selBCol','batch-edit');
        $("#editFrame").append('<h4 id="beht">'+htxt+'</h4>');
        $("#editFrame").append(scl);
        $("#editFrame").append(selCol);
        $("#editFrame").append('<br>');
        gPkEd = {};

        var sl1 = $('<span>Batch Action </span>')
            .css("font-family","Arial")
            .css("font-size","11px");

        var acx = $('<select id="batchAction" onchange="beActionChange(this)">')
            .css("font-family","Arial")
            .css("font-size","11px")
            .css("border-color","#888888");

        var aco =  $("<option>").attr('value','text-replace').text('Text Replace');
        var aco1 =  $("<option>").attr('value','field-replace').text('Field Replace');
        var aco2 =  $("<option>").attr('value','remove-element').text('Remove Element');
        var aco3 =  $("<option>").attr('value','add-element').text('Add Element');

        acx.append(aco);
        acx.append(aco1);
        acx.append(aco2);
        acx.append(aco3);
        acx.val(act).prop('selected',true);

        $("#editFrame").append(sl1);
        $("#editFrame").append(acx);

        var hx = $('<h4>Candidate Record Search Query</h4>');
        $("#editFrame").append(hx);
        var sl2 = $('<span style="margin:10px">  Metadata Field </span>');
        var rt = $('<select id="batchFld">')
            .css("font-family","Arial")
            .css("font-size","12px")
            .css("border-color","#888888");

        var rto =  $("<option>").attr('value','Url').text('Url');
        var rtod =  $("<option>").attr('value','linkdesc').text('Link Description');
        var rtk =  $("<option>").attr('value','keywords').text('keyword');
        var rtot =  $("<option>").attr('value','title').text('title');
        var rtoa =  $("<option>").attr('value','abstract').text('abstract');
        var rtoo =  $("<option>").attr('value','organisationName').text('organization');
        var rtob =  $("<option>").attr('value','individualName').text('author');
        var rtoe =  $("<option>").attr('value','electronicMailAddress').text('abstract');

        rt.append(rtot);
        rt.append(rtoa);
        rt.append(rto);
        rt.append(rtod);
        rt.append(rtk);
        rt.append(rtoo);
        rt.append(rtob);
        rt.append(rtoe);
        rt.val(fld).prop('selected',true);

        var sl3 = $('<span style="margin:10px">  Search for</span>');
        var rd = $('<input id="bfqry" type="text" size="40" placeholder="Text with wildcards .. ">')
                .css("font-family","Arial")
                .css("font-size","11px")
                .css("border-width","1px")
                .css("border-color","#888888").val(qstr);

        var qBtn =   $('<a id="qBtn" class="res-tag" >Query</a>')
                .css("font-size", "12px")
                .css("margin", "5px 5px")
                .css("padding","2px 2px")
                .css("color", "#ffffff")
                .css("background-color", "#2191c2")
                .attr('onclick','getBatchQry(this);');
        
        var sgBtn =   $('<a id="guidBtn" class="res-tag" >Saved Records Query</a>')
                        .css("font-size", "12px")
                        .css("margin", "5px 5px")
                        .css("padding","2px 2px")
                        .css("color", "#ffffff")
                        .css("background-color", "#2191c2")
                        .attr('onclick','getBatchQry(this);');

        var clrBtn =   $('<a id="qBtn" class="res-tag" >Clear</a>')
                        .css("font-size", "12px")
                        .css("margin", "5px 5px")
                        .css("padding","2px 2px")
                        .css("color", "#ffffff")
                        .css("background-color", "#2191c2")
                        .attr('onclick','clearBatchQry(this);');

        $("#editFrame").append(sl2);
        $("#editFrame").append(rt);
        $("#editFrame").append(sl3);
        $("#editFrame").append(rd);
        $("#editFrame").append('</br>');
        $("#editFrame").append(qBtn);
        $("#editFrame").append(sgBtn);
        $("#editFrame").append(clrBtn);
        $("#editFrame").append('<div id="resHdr"></div>');

    }



}

var beActionChange = function(o) {

    var sa = $("#batchAction option:selected").val();

    $("#batchFld option").remove();
    
    if ( sa == 'text-replace' || sa == 'field-replace' ) {
        var rto =  $("<option>").attr('value','Url').text('Url');
        var rtod =  $("<option>").attr('value','linkdesc').text('Link Description');
        var rtk =  $("<option>").attr('value','keywords').text('Keyword');
    
        var rtot =  $("<option>").attr('value','title').text('Title');
        var rtoa =  $("<option>").attr('value','abstract').text('Abstract');
    
        var rtoo =  $("<option>").attr('value','organisationName').text('Organization');
        var rtob =  $("<option>").attr('value','individualName').text('Author');
        var rtoe =  $("<option>").attr('value','electronicMailAddress').text('email Address');
        $("#batchFld").append(rto);
        $("#batchFld").append(rtod);
        $("#batchFld").append(rtk);
        $("#batchFld").append(rtot);
        $("#batchFld").append(rtoa);
        $("#batchFld").append(rtoo);
        $("#batchFld").append(rtob);
        $("#batchFld").append(rtoe);

    } else if ( sa == 'add-element' || sa == 'remove-element' ) {
        var rtko =  $("<option>").attr('value','keyword').text('keyword');
        var rtor =  $("<option>").attr('value','OnlineResource').text('Online Resource Link');
        $("#batchFld").append(rtko);
        $("#batchFld").append(rtor);
    }

}

var clearBatchQry = function(o) {

    $("#resHdr").empty();
    $("#batchRes").empty();
    $("#resHdr").append('<p >Start a new search</p>');


}

var getBatchQry = function(o) {

    var qt = o.id;
    var bfn = $("#batchAction").val();
    if ( !bfn ) { bfn = 'text-replace'; }
    var qStr = $("#bfqry").val();
    var qFld = $("#batchFld option:selected").text();

    if ( qt == 'guidBtn') {
        var guidA=[];
        var guid = "";

        var keez = Object.keys(localStorage);
        var kl = keez.length;
        for (k in keez) {
            var key = keez[k];
            if (key != "SearchHistory" && key != "gDataMapBounds") {
                guid = key.substr(3);
                guidA.push(guid);  
            }
        }
        if (guidA) {
            var guidStr = guidA.join(',');
            var bUrl = '/action/getBatchQuery?fld='+qFld+ '&q='+qStr+'&guids='+guidStr;
        } else {
            alert('No locally saved records found !');
            return;
        }      
    } else {
        var bUrl = '/action/getBatchQuery?fld='+qFld+ '&q='+qStr;
    }

    

    var jqxhr = $.get(bUrl, function() {
        console.log( "success record view " + qStr );
      })
    .done(function(data) { 
         if (typeof(data) == "object" ) {
             var dres = data;
        } else {
             var dres = JSON.parse(data);
        }

        $("#resHdr").empty();

        $("#resHdr").append('<p ><b>Text Search and Replace:</b> Found ' + dres.rowCount + ' records with ' + qFld + ' matching "<i>' + qStr + '</i>"</p>');
        $("#resHdr").append('<span >Find in Selection </span>');
        if ( bfn == 'text-replace') {
            var inpf = $('<input id="bfsfind" type="text" size="40" placeholder="Find String ">');
            if ( gPkEd.searchFld ) {
                inpf.val(gPkEd.searchFld);
            }
            $("#resHdr").append(inpf);
            $("#resHdr").append('</br >');
        }
        
        $("#resHdr").append('<span >Replace with </span>');
        var inpr = $('<input id="bfreplace" type="text" size="40" placeholder="Replace with" >');
        if ( gPkEd.replFld ) {
            inpr.val(gPkEd.replFld);
        }
        $("#resHdr").append(inpr);

        var aBtn =   $('<a id="applyBtn" class="res-tag" >Apply Locally</a>')
        .css("font-size", "11px")
        .css("margin", "5px 5px")
        .css("padding","2px 2px")
        .css("background-color", "#2191c2")
        .attr('onclick','batchApply(this);');

        var uBtn =  $('<a id="applyBtn" class="res-tag" >Undo</a>')
        .css("font-size", "11px")
        .css("margin", "5px 5px")
        .css("padding","2px 2px")
        .css("color", "#ffffff")
        .css("background-color", "#2191c2")
        .attr('onclick','batchUndo(this);');

        var sBtn =   $('<a id="rSaveBtn" class="res-tag" >Save</a>')
        .css("font-size", "11px")
        .css("margin", "5px 5px")
        .css("padding","2px 2px")
        .css("color", "#ffffff")
        .css("background-color", "#2191c2")
        .attr('onclick','batchSave(this);');

        var saBtn =   $('<a id="rSelAllBtn" class="res-tag" >Select All</a>')
        .css("font-size", "11px")
        .css("margin", "5px 5px")
        .css("padding","2px 2px")
        .css("color", "#ffffff")
        .css("background-color", "#2191c2")
        .attr('onclick','selectAll(this);');

        var caBtn =   $('<a id="rclrAllBtn" class="res-tag" >Clear All</a>')
        .css("font-size", "11px")
        .css("margin", "5px 5px")
        .css("padding","2px 2px")
        .css("color", "#ffffff")
        .css("background-color", "#2191c2")
        .attr('onclick','clearAll(this);');

        $("#resHdr").append(aBtn);
        $("#resHdr").append(sBtn);
        $("#resHdr").append(uBtn);
        $("#resHdr").append('</br >');
        $("#resHdr").append(saBtn);
        $("#resHdr").append(caBtn);
 
        var qd = $('<div id="batchRes"></div>');
        $("#editFrame").append(qd);

        gBD = dres.rows;
        bldSelTab(gBD);
        
       

    });

}

var bldSelTab = function (gso) {

    $("#brTab tr").remove();
    var tbx =  $('<table id="brTab" style="bgcolor:light-gray; width: 100%"></table>');

    for (k in gso) {
        var z = gso[k].mpath.replace(/["']/g, "");
        gso[k].mpath = z; 
        var ro = gso[k];

        var to = $('<tr>');
        var tri = $('<td>');
        var trcb = $('<input class="bqrsel" onclick="cbAction(this)" type="checkbox" id="'+ro.node_id+ '" name="'+ro.version_id+'" value="'+ ro.mpath+'">');

        if ( typeof(gso[k].checked) == "undefined") {
            gso[k].checked = true;
            to.css("background-color", "#ddeeff");
            trcb.prop("checked",true);
        } else {
            if ( ro.checked == true ) {
                to.css("background-color", "#ddeeff");
                  trcb.prop("checked",true);
            } else {
                to.css("background-color", "#ffffff");
                trcb.prop("checked",false);
            }
        }
        tri.append(trcb);

      
       
        var trt = $('<td ><span style="font-size:11px; bgcolor:light-gray;">' + ro.citation_title + '</span></td>');
        var trv = $('<td ><span style="font-size:11px; bgcolor:light-gray;">' + ro.node_value + '</span></td>');
        to.append(tri);
        to.append(trt);
        to.append(trv);
        tbx.append(to);
    }

    $("#batchRes").append(tbx);

}

var getCollectionList = function(selCol, cType ) {

    var bUrl = '/action/getCollections?ctype='+cType;

    var jqxhr = $.get(bUrl, function() {
        console.log( "success - data types " );
    })
    .done(function(data) { 
        if (typeof(data) == "object" ) {
            var dres = data;
        } else {
            var dres = JSON.parse(data);
        }
        var dx = dres.rows;
        $("#"+selCol).find('option').remove();
        if ( selCol == 'selBCol') {
            var colA = gCoLst;
        } else {
            var colA = gCvLst;
        }

        for (var i in dx) {
          var c = {}
          c.sid = dx[i].set_id;
          c.sname = dx[i].set_name;
          c.sdesc = dx[i].set_description;
          c.sdate = dx[i].create_date;
          var mo = c.sdesc + '<br>Create date :'+c.sdate;
        
          colA.push(c);
          var co = $('<option value="'+c.sid+'" title="'+mo+'">' + c.sname + '</option>');
          $("#"+selCol).append(co);
        }

    });


}

var cbAction = function(o) {

    for (k in gBD) {
        if ( gBD[k].node_id == o.id ) {
            if ( gBD[k].checked == true ) { 
                gBD[k].checked = false;
                $(o).closest('tr').find('td').css('background-color', '#ffffff')
            }
            else { 
                gBD[k].checked = true;
                $(o).closest('tr').find('td').css('background-color', '#ddeeff')
            }
        }
    }

}

var clearAll = function(o) {
    $(".bqrsel").prop("checked", false );
    $(".bqrsel").each(function(){
        $(this).closest('tr').find('td').css('background-color', '#ffffff')
    });
    for (k in gBD) {
        gBD[k].checked = false;
    }
}

var selectAll = function(o) {
    $(".bqrsel").prop("checked", true );
    $(".bqrsel").each(function(){
        $(this).closest('tr').find('td').css('background-color', '#ddeeff')
    });

    for (k in gBD) {
        gBD[k].checked = true;
    }
}

var batchApply = function(o) {
    var bfn = $("#batchAction").val();
    if ( !bfn ) { bfn = 'text-replace'; }
    if ( bfn == 'text-replace') {
        var fs = $("#bfsfind").val().toLowerCase();
    }
    var rs = $("#bfreplace").val();

    gBforUndo = JSON.stringify(gBD);
    
    for (k in gBD) {

        if ( bfn == 'text-replace') {
            var nv = gBD[k].node_value.toLowerCase();
            var onv = gBD[k].node_value;
           
            var hazit = nv.includes(fs);

            var inset = gBD[k].checked;
           
            if ( hazit && inset ) {
                var startpos = nv.indexOf(fs);
                var ags = onv.substr(0,startpos) + rs + onv.substr(fs.length+startpos);
               
                if ( k < 10 ) { console.log('replaced ' + onv + ' with ' + ags); }
                gBD[k].node_value = ags;
            }
        } else if ( bfn == 'field-replace') {
            if ( gBD[k].checked ) {
                gBD[k].node_value = rs;
            }
        }
    }

    bldSelTab(gBD);


}

var batchUndo = function(o) {

    if  ( gBforUndo.length > 0 ) {
        gBD = JSON.parse(gBforUndo);
        bldSelTab(gBD);
    }

}

var batchSave = function(o) {

    var bUrl = '/action/batchUpdateCollection';
    var batObj = {};
    batObj.action ='text-replace';
    batObj.col_id = 'new';   //put id here if 
    batObj.field_name = $("#batchFld option:selected").text();
    batObj.query_text = $("#bfqry").val();
    batObj.search_text =  $("#bfsfind").val();
    batObj.replace_text = $("#bfreplace").val();

    batObj.collection = JSON.parse(JSON.stringify(gBD));

    // send only the ones that will change
    for (k = batObj.collection.length-1; k >=0; k--) {
        if ( batObj.collection[k].checked == false ) {
            batObj.collection.splice(k,1);
        }
    }
 
    $.ajax({ 
        type: 'POST',
        url: bUrl,
        data: JSON.stringify(batObj),
        dataType: "json",
        contentType: "application/json",  
        success: function(data) {
          console.log( JSON.stringify(data) );
          $("#batchRes").empty();

          var xStr = 'Query: ' + batObj.query_text + '</br>Action: ' +  batObj.action + '</br>'
            + ' Field: ' + batObj.field_name  + '</br>Find:  ' + batObj.search_text + '</br>Replace with: ' + batObj.replace_text + '</br>'
            + 'Records Changed: ' + batObj.collection.length;
            
          $("#resHdr").append('<p>Saved changes ' + xStr + '</p></br >');

          getCollectionList();
          gBforUndo = {};
          gBD = {};

          // update collection dropdown
          
        },
        error: function (jqXHR, status, err) { 
          console.log('Save Error : ' + status + ' ' + err);
        }
	});
   
}

