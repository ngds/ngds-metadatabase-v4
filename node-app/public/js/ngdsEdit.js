/*
UI module for md Editing, new Contributions and Collections
Added inspection module 2/4/2021

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
var gHJ = {};

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

    var lBtn =  $('<a id="hbtn" class="res-tag" >Inspector</a>')
        .css("font-size", "12px")
        .css("margin", "1px 1px 1px 7px;")
        .css("padding","5px 5px")
        .css("display","inline:block")
        .css("width","100px")
        .css("background-color", "#2191c2")
        .attr('onclick','inspectMan(this);');

    $("#ed-l-admin").append(hBtn);
    $("#ed-l-admin").append('</br>');
    $("#ed-l-admin").append(uBtn);
    $("#ed-l-admin").append('</br>');
    $("#ed-l-admin").append(noBtn);
    $("#ed-l-admin").append('</br>');
    $("#ed-l-admin").append(lBtn);

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

    //$(selCol).selectmenu();
    //var selColD = $('<datalist id="selCol" >');
    var scl = $('<p>Previous Edit Collections</p>')
        .css("font-family","Arial")
        .css("font-size","12px")
        .css("font-color","12px");

    var co = $('<option value="Midx">Collection Text</option>');
    //var selCol = $('<input list="selCol" name="Col" onchange="pickEdit(this)" placeholder="Previous Edits ...">');
    var selCol = $('<select id="selCol" name="selCol" onchange="pickEdit(this)"></select>')
                        .css("font-family","Arial")
                        .css("font-size","12px")
                        .css("font-color","12px")
                        .css("border-color","#888888")
                        .css("width","150px");
    selCol.append(co);

    //selColD.append(co);
    
    $("#ed-l-widget").append(nBtn);

    $("#ed-l-widget").append('<div id="newOpts"></div>');
    $("#ed-l-widget").append(eBtn);
    $("#ed-l-widget").append('</br>');
    $("#ed-l-widget").append(vBtn);
    $("#ed-l-widget").append('</br>');
    $("#ed-l-widget").append(bBtn);
    $("#ed-l-widget").append('</br>');
    //$("#ed-l-widget").append(scl);
    //$("#ed-l-widget").append(selCol);
    //getCollectionList('selCol','batch-edit');
   // $("#ed-l-widget").append(selColD);

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
/* INGESTOR Inspection system to find and test endpoints */
var gSelRuleId = 0;
var gInspectMap = [];
var gInspectLinks = [];
var gInspectResults = [];
var gStaleInspectLinks = [];

var inspectMan = function(o) {

    var htxt = 'Resource Link Inspection Tools';
    $("#editFrame").empty();
    var hb = $('<h4>' + htxt+ '</h4>');
    $("#editFrame").append(hb);
    var dig = $('<div id="inspSrc"></div>');
    
    var xBtn =  $('<a id="vrb" class="adm-tag" >View Rules</a>')
                            .css("width","100px")
                            .css("font-size","14px")
                            .css("background-color", "#2191c2")
                            .attr('onclick','inspectMap(this);');
    
    var hBtn =  $('<a id="vhb" class="adm-tag" >View History</a>')
                            .css("width","100px")
                            .css("font-size","14px")
                            .css("background-color", "#2191c2")
                            .attr('onclick','showHistory(this);');

    var iBtn =  $('<a id="execCrawler" class="adm-tag" >Run Crawler</a>')
                            .css("width","80px")
                            .css("background-color", "#2191c2")
                            .attr('onclick','runCrawler(this);');

    var sBtn =  $('<a id="" class="adm-tag" >Rule Info</a>')
                            .css("width","80px")
                            .css("background-color", "#2191c2")
                            .attr('onclick','ruleMetrics(this);');

    var zBtn =  $('<a id="execInspector" class="adm-tag" >Run Inspection</a>')
                            .css("width","80px")
                            .css("background-color", "#2191c2")
                            .attr('onclick','runInspector(this);');

    var uBtn =  $('<a id="updateInspection" class="adm-tag" >Update Results</a>')
                            .css("width","80px")
                            .css("background-color", "#2191c2")
                            .attr('onclick','refreshInspectResults(this);');

    var cBtn =  $('<a id="clearInspection" class="adm-tag" >Clear Results</a>')
                            .css("width","80px")
                            .css("background-color", "#2191c2")
                            .attr('onclick','delInspectionResults(this);');

    var pBtn =  $('<a id="refreshCache" class="adm-tag" >Refresh Cache</a>')
                            .css("width","80px")
                            .css("background-color", "#2191c2")
                            .attr('onclick','refreshCache(this);');

    dig.append(xBtn);                       
    dig.append(hBtn);
    dig.append('</br><span><b>Actions</b></span>');
    dig.append(sBtn);
    dig.append(iBtn);
    dig.append(zBtn);
    dig.append(uBtn);
    dig.append(cBtn);
    dig.append(pBtn);

    $("#editFrame").append(dig);
    //showInspectLog();
 
}

var runInspector = function(o) {
    // Inspector runs a html head validation for specified records
    var pt = '';
    gInspectMap.forEach(function(im) {
        if ( im.rimid == gSelRuleId ) {
            pt = im.proctype;
        }
    });

    if ( gSelRuleId ) {
        var hUrl = '/action/runInspection?rid='+gSelRuleId+'&ctype='+pt;
    } else {
        var hUrl = '/action/runInspection?rid=0';
    }

    var jqxhr = $.get(hUrl, function() {
        console.log( "inspection Map List" );
    })
    .done(function(data) { 
        console.log('exec inspect '+data);
        if ( gSelRuleId ) {
            alert('Resource Link Inspection Started for Rule Id '+gSelRuleId);
        } else {
            alert('Resource Link Inspection Started for all links');
        }
    }); 
}

var runCrawler = function(o) {
    // Crawler walks thru the specified pages in rule using critieria to find
    // additional links.
    if ( gSelRuleId ) { 
        for (k in gInspectMap) {
            var im = gInspectMap[k];
            if ( im.rimid == gSelRuleId ) {
                if ( im.proctype == 'crawl' ) {
                    var hUrl = '/action/runCrawler?rid='+gSelRuleId;
                    var jqxhr = $.get(hUrl, function() {
                        console.log( "Crawler Activivated" );
                    })
                    .done(function(data) { 
                        if (typeof(data) == "object" ) {
                            var dres = data;
                        } else {
                            var dres = JSON.parse(data);
                        }
                        if ( dres.rows ) {
                            alert ('Crawler Running ');
                        } else {
                            alert ('Crawler Error Indicated');
                        }
                    });

                } else {
                    alert ('Only Rules of Type "Crawl" should use the crawler, just use Inspect for other rule types.'); 
                }
            }
        }   
    } else {
        alert ('Select an Inspection Rule first. ');
    }
    

}

var refreshCache = function(o) {

    var hUrl = '/action/runCacheRefresh';
    var jqxhr = $.get(hUrl, function() {
        console.log( "refresh materialized view" );
    })
    .done(function(data) { 
        if (typeof(data) == "object" ) {
            var dres = data;
        } else {
            var dres = JSON.parse(data);
        }
        alert('Inspection Results Cache Refresh Status '+dres.rows[0].refresh_resource_link_cache)
        console.log(JSON.stringify(dres));
    });

}

var delInspectionResults = function(o) {
    
    var ctype = '';
    if ( gSelRuleId ) { 
        for (k in gInspectMap) {
            var im = gInspectMap[k];
            if ( im.rimid == gSelRuleId ) {
                ctype = im.proctype;
            }
        }
    }

    var hUrl = '/action/delInspectionResults?rid='+gSelRuleId+'&ctype='+ctype;
    var jqxhr = $.get(hUrl, function() {
        console.log( "inspection results clear" );
    })
    .done(function(data) { 
        if (typeof(data) == "object" ) {
            var dres = data;
        } else {
            var dres = JSON.parse(data);
        }
        console.log(JSON.stringify(dres));
    });

}

var refreshInspectResults = function(o) {

    var ctype = '';
    if ( gSelRuleId ) { 
        for (k in gInspectMap) {
            var im = gInspectMap[k];
            if ( im.rimid == gSelRuleId ) {
                ctype = im.proctype;
            }
        }
    }

    var hUrl = '/action/runInspectionUpdate?rid='+gSelRuleId+'&ctype='+ctype;
    var jqxhr = $.get(hUrl, function() {
        console.log( "inspection update" );
    })
    .done(function(data) { 
        if (typeof(data) == "object" ) {
            var dres = data;
        } else {
            var dres = JSON.parse(data);
        }
        console.log(JSON.stringify(dres));
    });
}

var ruleMetrics = function(o) {

    $("#metDiv").remove();
    var md = $('<div id="metDiv"></div>');
    var hb = $('<h4>Rule Status </h4>');
    var jts = $('<span id="jts">Job Status : </span>');
    var spr = $('<span id="mil">Links found in Database :</span>');
    var spl = $('<span id="lir">Endpoint Inspection Results: Working - 0, Error - 0</span></br>');
    var stal = $('<span id="stal">Inspection Links Out of Date: 0 </span>');

    md.append(hb);
    
    var jBtn =  $('<a id="jtStat" class="res-tag" >Job Status</a>')
                        .css("font-size", "12px")
                        .css("margin", "1px 1px 1px 1px;")
                        .css("padding","5px 5px")
                        //.css("display","inline:block")
                        .css("background-color", "#2191c2")
                        .attr('onclick','jobState(this);');

    var vBtn =  $('<a id="vwLinks" class="res-tag" >View Links</a>')
                            .css("font-size", "12px")
                            .css("margin", "1px 1px 1px 1px;")
                            .css("padding","5px 5px")
                            //.css("display","inline:block")
                            .css("background-color", "#2191c2")
                            .attr('onclick','showLinks(this);');

    var rBtn =  $('<a id="vwLinks" class="res-tag" >View Inspection</a>')
                            .css("font-size", "12px")
                            .css("margin", "1px 1px 1px 1px;")
                            .css("padding","5px 5px")
                            //.css("display","inline:block")
                            .css("background-color", "#2191c2")
                            .attr('onclick','showResults(this);');

    md.append(jBtn);
    md.append(jts); 
    md.append('</br>');

    md.append(vBtn);
    md.append(spr); 
    md.append('</br>');
    md.append(rBtn);
    md.append(spl);
    md.append('</br>');
    md.append(stal);
    $("#editFrame").append(md);

    var ctype = '';
    if ( gSelRuleId ) { 
        for (k in gInspectMap) {
            var im = gInspectMap[k];
            if ( im.rimid == gSelRuleId ) {
                ctype = im.proctype;
            }
        }
    }

    var hUrl = '/action/getInspectionLinks?rid='+gSelRuleId+'&ctype='+ctype;
    var jqxhr = $.get(hUrl, function() {
        console.log( "inspection Map List" );
    })
    .done(function(data) { 
        if (typeof(data) == "object" ) {
            var dres = data;
        } else {
            var dres = JSON.parse(data);
        }
        gInspectLinks = dres.rows;
        $("#mil").text('Links in Database : '+ gInspectLinks.length);
        
    });

    var hUrl = '/action/getInspectionResults?rid='+gSelRuleId+'&ctype='+ctype;
    var jqxhr = $.get(hUrl, function() {
        console.log( "inspection results" );
    })
    .done(function(data) { 
        if (typeof(data) == "object" ) {
            var dres = data;
        } else {
            var dres = JSON.parse(data);
        }
        gInspectResults = dres.rows;  
        var gl = 0;
        for (k in gInspectResults) {
            var r = gInspectResults[k];
            if ( r.url_status == '200' ) {
                gl++;
            }
        }
        $("#lir").text('Endpoint Inspection - Total: '+gInspectResults.length+' Good: '+gl);
    });

    var hUrl = '/action/getStaleInspectionLinks?rid='+gSelRuleId+'&ctype='+ctype+'&retype=count';
    var jqxhr = $.get(hUrl, function() {
        console.log( "stale inspection Map List" );
    })
    .done(function(data) { 
        if (typeof(data) == "object" ) {
            var dres = data;
        } else {
            var dres = JSON.parse(data);
        }
        gInspectStaleLinks = dres.rows;
        $("#stal").text('Inspection Links Out of Date: '+ gInspectStaleLinks[0].count);
        
    });


}

var jobState = function(o) {

    if ( gSelRuleId ) { 
        var hUrl = '/action/getRuleJobStatus?rid='+gSelRuleId;
        var jqxhr = $.get(hUrl, function() {
            console.log( "Rule job status results" );
        })
        .done(function(data) { 
            if (typeof(data) == "object" ) {
                var dres = data;
            } else {
                var dres = JSON.parse(data);
            }
            var jobResults = dres.jobs;  
            var gl = 0;
            if ( jobResults.length > 0 ) {
                var cj = jobResults[jobResults.length-1];
                if ( cj.current ) {
                    var cjc = cj.current;
                } else {
                    var cjc = cj.curent;
                }
                $("#jts").text('Job Status: '+cj.status +' Count: '+cjc+'/'+cj.rows );

            } else {

                $("#jts").text('Job Status: No Jobs Runs');
            }
            
            
        });


    }

}

var showResults = function(o) {
    $("#slTab").remove();
    $("#ilTab").remove();

    if (gInspectResults ) {
        var tbx =  $('<table id="ilTab" style="bgcolor:light-gray; width: 80%"></table>');
        var tho = $('<tr>');
        var td1 = $('<th >Guid</th>');
        var td2 = $('<th style="width"300px;">Url</th>');
        var td3 = $('<th style="width"300px;">Endpoint URL</th>');
        var td4 = $('<th >Status</th>');
        var td5 = $('<th >Date</th>');
        tho.append(td1);
        tho.append(td2);
        tho.append(td3);
        tho.append(td4);
        tho.append(td5);
        tbx.append(tho);

        for (k in gInspectResults) {
            var im = gInspectResults[k];
            var tro = $('<tr>');
            var td1 = $('<td style="font-size:11px;">'+im.guid+'</td>');
            var lu = '<a style="font-size:10px;" href="'+im.orig_url+'" target="_blank">'+im.orig_url+'</a>';
            var td2 = $('<td>'+lu+'</td>');

            var ide = $('<i id="ie'+k+'" class="fas fa-edit" onclick="editInspLink(this)"></i>')
                .css('font-size','10px')
                .css('margin','1px 1px')
                .css('color','#0971b2');
            var ilu = '<a id="ib'+k+'" style="font-size:10px;" href="'+im.ident_url+'" target="_blank">'+im.ident_url+'</a>';

            var td3 = $('<td id="tx'+k+'"></td>');
            td3.append(ide);
            td3.append(ilu);
            var td4 = $('<td style="font-size:11px;">'+im.url_status+'</td>');
            var td5 = $('<td style="font-size:11px;">'+im.v_date+'</td>');
            tro.append(td1);
            tro.append(td2);
            tro.append(td3);
            tro.append(td4);
            tro.append(td5);
            tbx.append(tro);

        }
        $("#metDiv").append(tbx);
    }
}

var editInspLink = function(o) {
    var k = o.id.substr(2);
    var guid = gInspectResults[k].guid;
    var glx = '#ib'+k;
    var xlx = $(glx);
    var xl = xlx.text();
    if ( xl.length > 50 ) {
        var ibw = '50';
    } else {
        var ibw = xl.length.toString().trim();
    }
    
    xlx.hide();
    var nb = $('<input id="ix'+k+'" type="text" size="'+ibw+'" value="'+xl+'">');
    var zx = '#tx'+k;
    $(zx).append(nb);
    $(o).attr('onclick','edLConfirm(this)'); 
    $(o).attr('class','fas fa-save'); 
}

function edLConfirm(o) {
    var k = o.id.substr(2);
    var guid = gInspectResults[k].guid;
    var elix = '#ix'+k;
    var evl = $(elix).val();
    var glx = '#ib'+k;
    var edl = '#ie'+k;

    if (confirm('Do you want to save link edit ' + evl + ' ?'))  {
        edLSave(o);
    } else {
        // cancel
        $(elix).remove();
        $(glx).show();
        $(edl).attr('onclick','editInspLink(this)'); 
        $(edl).attr('class','fas fa-edit'); 
        console.log('Dont save')
    } 
}

function edLSave(o) {
    var k = o.id.substr(2);
    var guid = gInspectResults[k].guid;
    var rid = gInspectResults[k].rid;

    var guid = o.id.substr(2);

    var elix =  '#ix'+k;
    var newl = $(elix);
    console.log('this '+newl.id);
    var newlt = newl.val();
    var uNewlLt = encodeURIComponent(newlt);
   
    console.log('saving edit '+rid + ' ' + newlt);

    var hUrl = '/action/saveInspectionLinkEdit?r='+rid+'&uri='+uNewlLt;
    var jqxhr = $.get(hUrl, function() {
        console.log( "Save insp link edit" );
    })
    .done(function(data) { 
        if (typeof(data) == "object" ) {
            var dres = data;
        } else {
            var dres = JSON.parse(data);
        }
        var glx = '#ib'+k;
        var edl = '#ie'+k;
        if ( data ) {
            $(glx).text(newl.val());
        } else {
            $(glx).text('Link edit Save error');
        }
        $(glx).show();
        newl.remove();
        $(edl).attr('onclick','editInspLink(this)'); 
        $(edl).attr('class','fas fa-edit');    
    });
}

var showLinks = function(o) {
    $("#slTab").remove();
    $("#ilTab").remove();
    if (gInspectLinks ) {
        var tbx =  $('<table id="slTab" style="bgcolor:light-gray; width: 80%"></table>');
        var tho = $('<tr>');
        var td1 = $('<th style="width"80px;">Guid</th>');
        var td2 = $('<th>Url</th>');
        var td3 = $('<th style="width"300px;">Endpoint URL</th>');
        tho.append(td1);
        tho.append(td2);
        tho.append(td3);
        tbx.append(tho);

        for (k in gInspectLinks) {
            var im = gInspectLinks[k];
            var tro = $('<tr>');
            var td1 = $('<td style="font-size:11px;">'+im.identifier+'</td>');
            var lu = '<a href="'+im.lurl+'" target="_blank">'+im.lurl+'</a>';
            var td2 = $('<td style="font-size:11px;">'+lu+'</td>');
            var slu = '<a href="'+im.sel_url+'" target="_blank">'+im.sel_url+'</a>';
            var td3 = $('<td style="font-size:11px;">'+slu+'</td>');
            tro.append(td1);
            tro.append(td2);
            tro.append(td3);
            tbx.append(tro);
        }
        $("#metDiv").append(tbx);
    }

}

var gInspLog = [];

var showInspectLog = function(o) { 

    var tbx =  $('<table id="ilTab" style="bgcolor:light-gray; width: 80%"></table>');
    var tho = $('<tr>');
    var td1 = $('<th>Date</th>');
    var td2 = $('<th>Total</th>');
    var td3 = $('<th>HTTP Good</th>');
    var td4 = $('<th>HTTP Error</th>');

    tho.append(td1);
    tho.append(td2);
    tho.append(td3);
    tho.append(td4);
    tbx.append(tho);
    $("#editFrame").append(tbx);

}

var inspectMap = function(o) {

    $("#ilTab").remove();
    $("#imTab").remove();

    var nBtn =  $('<i id="" class="fas fa-plus" ></i>')
                            .css("font-size", "12px")
                            .attr('onclick','newIM(this);');

    var tbx =  $('<table id="imTab" style="bgcolor:light-gray; width: 80%"></table>');
    var tho = $('<tr>');
    var td1a = $('<th style="width"40px;"></th>');
    var td1 = $('<th style="width"80px;"></th>');
   
    td1.append(nBtn);

    var td2 = $('<th>Type</th>');
    var td3 = $('<th style="width"300px;">URL</th>');
    //var td4 = $('<th>Lookup Url</th>');
    var td5 = $('<th style="width"100px;">HTML</th>');
    //var td6 = $('<th>Object</th>');

    tho.append(td1);
    
    tho.append(td2);
    tho.append(td3);
    //tho.append(td4);
    tho.append(td5);
    //tho.append(td6);
    tbx.append(tho);

    var hUrl = '/action/getInspectionMap';
    var jqxhr = $.get(hUrl, function() {
            console.log( "inspection Map List" );
    })
    .done(function(data) { 
    
        if (typeof(data) == "object" ) {
            var dres = data;
        } else {
            var dres = JSON.parse(data);
        }
        gInspectMap = dres.rows;
        for (k in gInspectMap) {
            var im = gInspectMap[k];

            var tro = $('<tr>');
            var td1a = $('<td id="im1a-'+im.rimid+'"></td>');
            var td1 = $('<td id="im1-'+im.rimid+'"></td>');

            var sBox = $('<input class="cbox" type="checkbox" id="cb-'+k+'" name="ruleBox" onclick="selCB(this)" value="'+im.rimid+'">')
                            .css('display',"inline-blick")
                            .css("background-color", "#0971b2");
            if ( im.proctype !== 'base' ) {
            var eBtn =  $('<i id="ed-'+k+'" class="fas fa-edit" ></i>')
                            .css("font-size", "11px")
                            .css("margin", "1px 3px")
                            .css("color", "#0971b2")
                            .attr('onclick','editIM(this);');

            var dBtn =  $('<i id="dl-'+im.rimid+'" class="fas fa-trash-alt" ></i>')
                            .css("font-size", "11px")
                            .css("margin", "3px 1px")
                            .css("color", "#0971b2")
                            .attr('onclick','deleteIM(this);');
            }

            var ustr =  '<b>Base</b>: <i>'+ im.bas_url + '</i></br><b>Endpoint</b>: <i>' +  im.sel_path+'</i>'; 
            var tstr = '<b>Find element</b>: <i>' + xs(im.elem_lookup,'ui') + '</i>'
                        + '</br><b>Return attribute</b>: <i>' +xs(im.elem_text,'ui') + '</i>';
            
            var td2 =  $('<td id="im2-'+im.rimid+'" style="font-size:11px;">'+ im.proctype + '</td>');
            var td3 =  $('<td id="im3-'+im.rimid+'" style="font-size:11px;">'+ustr+'</td>');
            //var td4 =  $('<td id="im4-'+im.rimid+'" style="font-size:11px;">'+ im.sel_path + '</td>');
            var td5 =  $('<td id="im5-'+im.rimid+'" style="font-size:11px;">'+ tstr + '</td>');
            //var td6 =  $('<td id="im6-'+im.rimid+'" style="font-size:11px;">'+ im.elem_lookup + '</td>');

            td1a.append(sBox);
            if ( im.proctype !== 'base' ) {
                td1.append(eBtn);
                td1.append(dBtn);
            }

            tro.append(td1a);
            tro.append(td1);
            tro.append(td2);
            tro.append(td3);
            //tro.append(td4);
            tro.append(td5);
            //tro.append(td6);
            tbx.append(tro);
        }
        $("#editFrame").append(tbx);
    });
}

var selCB = function(o) {

    $("#metDiv").remove();
    if ( $(o).prop("checked") == true ) {
        $.each($("input[name='ruleBox']:checked"), function(){
            $(this).prop("checked", false);
        });
        $(o).prop("checked",true);
        gSelRuleId = $(o).val();
    }

}

var editIM = function(o) {
    var k = o.id.split('-')[1];
    var rid = gInspectMap[k].rimid;

    var td1 = $("#im1-"+rid);
    var td2 = $("#im2-"+rid);
    var td3 = $("#im3-"+rid);
    //var td4 = $("#im4-"+rid);
    var td5 = $("#im5-"+rid);
    //var td6 = $("#im6-"+rid);

    var sBtn =  $('<i id="savebtn-'+rid+'" class="fas fa-save" ></i>')
                    .css("font-size", "11px")
                    .css("margin", "1px 3px")
                    .css("color", "#9933ff")
                    .attr('onclick','saveUpdateIM(this);');

    var cBtn =  $('<i id="cancelbtn-'+rid+'" class="fas fa-trash-alt" ></i>')
                    .css("font-size", "11px")
                    .css("margin", "3px 1px")
                    .css("color", "#9933ff")
                    .attr('onclick','cancelUpdateIM(this);');
    td1.empty();
    td1.append(sBtn);
    td1.append(cBtn);

    var sType = $('<select id="updateImType">');
    if ( td2.text() == 'catalog' ) {
        var stC = $('<option value="catalog" selected>catalog</option>');
        var stL = $('<option value="link">link</option>');
        var stW = $('<option value="crawl">crawl</option>');
    } else if( td2.text() == 'link' ) {
        var stC = $('<option value="catalog">catalog</option>');
        var stL = $('<option value="link" selected>link</option>');
        var stW = $('<option value="crawl">crawl</option>');
    } else {
        var stC = $('<option value="catalog">catalog</option>');
        var stL = $('<option value="link">link</option>');
        var stW = $('<option value="crawl" selected>crawl</option>');
    }
    sType.append(stC);
    sType.append(stL);
    sType.append(stW);
    td2.empty();
    td2.append(sType);

    var bu =  $('<input id="updateBurl" type="text" size="35" value="'+gInspectMap[k].bas_url+'">');
    td3.empty();

    td3.append('<label for="updateBurl">Base </label>');
    td3.append(bu);
    td3.append('</br>');
    var sp =  $('<input id="updateSelPath" type="text" size="35" value="'+gInspectMap[k].sel_path+'">');
    //td4.empty();
    td3.append('<label for="updateSelPath">End </label>');
    td3.append(sp);

    var el =  $('<input id="updateEL" type="text" size="15" value="'
                + xs(gInspectMap[k].elem_lookup,'ui')+'">');

    var te =  $('<input id="updateTE" type="text" size="15" value="'
                +xs(gInspectMap[k].elem_text,'ui')+'">');
    td5.empty();
    td5.append('<label for="updateEL">Find Element </label>');
    td5.append(el);
    td5.append('<label for="updateTE">Return Attribute</label>');
    td5.append(te);
    td5.append('</br>');

   // td6.empty();
   
    

}

var saveUpdateIM = function(o) {
    var rid = o.id.split('-')[1];
    var t = $("#updateImType").val();
    var b = encodeURIComponent($("#updateBurl").val());
    var s = encodeURIComponent($("#updateSelPath").val());
    var e =  encodeURIComponent(xs($("#updateTE").val(),'db'));
    var l =  encodeURIComponent(xs($("#updateEL").val(),'db'));

    if ( rid ) {

        var hUrl = '/action/updateInspectionMapItem?r='+rid+'&t='+t+'&b='+b+'&s='+s+'&e='+e+'&l='+l;
        var jqxhr = $.get(hUrl, function() {
            console.log( "update inspection " );
        })
        .done(function(data) { 
            if (typeof(data) == "object" ) {
                var dres = data;
            } else {
                var dres = JSON.parse(data);
            }
            if ( dres ) {
                inspectMap();
            }
        });
    }
}

var cancelUpdateIM = function(o) {
    inspectMap();
}

var newIM = function(o) {

    var tro = $('<tr id="newIMForm">');
    var td1a = $('<td></td>');
    var td1 = $('<td></td>');

    var sBtn =  $('<i id="save-btn" class="fas fa-save" ></i>')
                    .css("font-size", "11px")
                    .css("margin", "1px 3px")
                    .css("color", "#9933ff")
                    .attr('onclick','saveIM(this);');

    var cBtn =  $('<i id="cancel-btn" class="fas fa-trash-alt" ></i>')
                    .css("font-size", "11px")
                    .css("margin", "3px 1px")
                    .css("color", "#9933ff")
                    .attr('onclick','cancelNewIM(this);');

    td1.append(sBtn);
    td1.append(cBtn);
    
    var td2 =  $('<td id="newIMType" ></td>');
    var sType = $('<select id="newImType">');
    var stC = $('<option value="catalog" selected>catalog</option>');
    var stL = $('<option value="link">link</option>');
    var stW = $('<option value="crawl">crawl</option>');

    sType.append(stC);
    sType.append(stL);
    sType.append(stW);
    td2.append(sType);
   
    var td3 =  $('<td id="newBU"></td>');
    var bu =  $('<input id="newBurl" type="text" size="35" placeholder="Base Url...">');
    //td3.append('<label for="newBurl">Base</label>');
    td3.append(bu);
    td3.append('</br>');
    //var td4 =  $('<td id="newIM-sp" ></td>');
    var sp =  $('<input id="newSelPath" type="text" size="35" placeholder="Endpoint Url...">');
    //td3.append('<label for="newSelPath">Endpoint</label>');
    td3.append(sp);

    var td5 =  $('<td id="newTL" ></td>');
    var el =  $('<input id="newEL" type="text" size="15" placeholder="Find Element">');
    var te =  $('<input id="newTE" type="text" size="15" placeholder="Return Attribute">');
    
    //td5.append('<label for="newTE">Text</label>');
    td5.append(el);
    td5.append('</br>');
    //var td6 =  $('<td id="new-el" ></td>');
   
    //td5.append('<label for="newEL">Type</label>');
    td5.append(te)
    
    tro.append(td1a);
    tro.append(td1);
    tro.append(td2);
    tro.append(td3);
    //tro.append(td4);
    tro.append(td5);
    //tro.append(td6);
    $("#imTab").append(tro);

}

var xs = function (str, dir ) {
    var rs = '';
    if (dir == 'db') {
        rs = str.replace(/'/g, "A39"); 
    } else if ( dir == 'ui') {
        if ( str ) {
            rs = str.replaceAll("A39", "\'");
        }
        
    }
    return rs;
}

var saveIM = function(o) {

    //var t = $("#newIMType").options[$("#newIMType").selectedIndex].value;
    var t = $("#newImType").val();
    var b = encodeURIComponent($("#newBurl").val());
    var s = encodeURIComponent($("#newSelPath").val());
    var e =  xs($("#newTE").val(),'db');
    var l =  xs($("#newEL").val(),'db');

    var hUrl = '/action/saveInspectionMapItem?t='+t+'&b='+b+'&s='+s+'&e='+e+'&l='+l;

    var jqxhr = $.get(hUrl, function() {
            console.log( "save inspection " );
    })
    .done(function(data) { 
    
        if (typeof(data) == "object" ) {
            var dres = data;
        } else {
            var dres = JSON.parse(data);
        }
        if ( dres ) {
            var nr = {};
            nr.rimid = dres.rows[0].rimid;
            nr.proctype = t;
            nr.bas_url = b;
            nr.sel_path = s;
            nr.elem_text = e;
            nr.elem_lookup = l;
            gInspectMap.push(nr);
            inspectMap();
        }
    });
}

var deleteIM = function(o) {
    var rid = o.id.split('-')[1];
    if ( rid ) {
        var hUrl = '/action/deleteInspectionMapItem?rid='+rid;
        var jqxhr = $.get(hUrl, function() {
            console.log( "delete im item" );
        })
        .done(function(data) { 
            if (typeof(data) == "object" ) {
                var dres = data;
            } else {
                var dres = JSON.parse(data);
            }
            if ( dres ) {
                inspectMap();
            }
        });
    }
}

var cancelNewIM = function(o) {
    $("#newIMForm").remove();
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

/* Harvester Functions */
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
                        //.css("display","inline:block")
                        //.css("width","100px")
                        .css("background-color", "#2191c2")
                        .attr('onclick','harvJobMan(this);');
            var eBtn =  $('<a id="hedt-' + hid + '" class="res-tag" >Edit</a>')
                        .css("font-size", "11px")
                        .css("margin", "3px 1px 1px 3px;")
                        .css("padding","3px 3px")
                        //.css("display","inline:block")
                        //.css("width","100px")
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

  var harvSrcEdit = function(o) {
    
    var hsid = o.id.split('-')[1];
    var vtop = $(o).position().top +'px';
    var vl = $(o).position().left + 70 + 'px';


}

  var harvJobMan = function(o) {
    var hsid = o.id.split('-')[1];
    var hUrl = '/action/harvestJobs?setid='+hsid;

    var jqxhr = $.get(hUrl, function() {
            console.log( "harvest jobs" );
        })
        .done(function(data) { 

            if (typeof(data) == "object" ) {
                var dres = data;
            } else {
                var dres = JSON.parse(data);
            }
            gHJ = dres.rows;
            hjTemplate(o,gHJ)
        });

  }

  var hjTemplate = function(o, d) {
    var hsid = o.id.split('-')[1];
    var vtop = $(o).position().top +'px';
    var vl = $(o).position().left + 70 + 'px';

    var c = $("#rightEdit");

    var hd = $('<div id="hjMan">')
            .css("position","absolute")
            .css("display","block")
            .css("margin", "7px 7px 7px 7px;")
            .css("padding","5px 5px")
            .css("top",vtop)
            .css("left",vl)
            .css("opacity","1")
            .css("background-color","#ffffff")
            .css("border","2px solid #2191c2")
            .css("height","350px")
            .css("width","350px");

    var cBtn =  $('<a id="hjClose" class="res-tag" >Close</a>')
            .css("font-size", "11px")
            .css("margin", "1px 1px 1px 1px;")
            .css("padding","2px 2px")
            .css("display","inline:block")
            .css("width","80px")
            .css("background-color", "#2191c2")
            .attr('onclick','hjClose(this);');

    var xBtn =  $('<a id="hx-'+hsid+'" class="res-tag" >Run</a>')
            .css("font-size", "11px")
            .css("margin", "1px 1px 1px 7px;")
            .css("padding","2px 2px")
            .css("display","inline:block")
            .css("width","80px")
            .css("background-color", "#2191c2")
            .attr('onclick','hjExec(this);');
    
    var dBtn =  $('<a id="hd-'+hsid+'" class="res-tag" >Clear</a>')
            .css("font-size", "11px")
            .css("margin", "1px 1px 1px 7px;")
            .css("padding","2px 2px")
            .css("display","inline:block")
            .css("width","80px")
            .css("background-color", "#2191c2")
            .attr('onclick','harvestClear(this);');

    var selHtype = $('<select id="selHType" name="selHtype"></select>')
            .css("font-family","Arial")
            .css("font-size","11px")
            .css("font-color","#888888")
            .css("border-color","#888888")
            .css("width","150px");
    var ca = $('<option value="full-harvest">Full</option>');
    var co = $('<option value="New">New Only</option>');
    var cl = $('<option value="local-saved">Local Selection Set</option>');

    selHtype.append(ca);
    selHtype.append(co);
    selHtype.append(cl);

    var selHPtype = $('<select id="selHPType" name="selHPtype"></select>')
        .css("font-family","Arial")
        .css("font-size","11px")
        .css("font-color","#888888")
        .css("border-color","#888888")
        .css("width","150px");
    var pa = $('<option value="full-harvest">Overwrite</option>');
    var po = $('<option value="New">Reconcile</option>');

    selHPtype.append(pa);
    selHPtype.append(po);

    vh = $('<span >Harvest Jobs</span>')
                .css("font-size", "14px")
                .css("font-weight", "bold")
                .css("font-family","Arial");

    hd.append(vh);  
    
    hd.append(cBtn);
    hd.append('</br>');
    var spt = $('<span>Harvest Type</span>').css("font-size", "11px")
                    .css("font-family","Arial")
                    .css("width","100px");
    hd.append(spt);                
    hd.append(selHtype);
    hd.append('</br>');
    var spa = $('<span>Harvest Action</span>').css("font-size", "11px")
                    .css("font-family","Arial")
                    .css("width","100px");
    
    hd.append(spa);                  
    hd.append(selHPtype);
    hd.append('</br>');
    hd.append(xBtn);
    hd.append(dBtn);
    hd.append('</br>');
    var sph = $('<span >History</span>')
        .css("font-size", "12px")
        .css("font-weight", "bold")
        .css("font-family","Arial");
    hd.append(sph); 
    hd.append('</br>');

    var vrtab = $('<table width="90%">');
    var vr = $('<tr>');   
    var va = $('<td> Action </td>').css("font-size", "12px").css("font-weight", "bold");
    var vb = $('<td> Date </td>').css("font-size", "12px").css("font-weight", "bold");
    var vc = $('<td> Status </td>').css("font-size", "12px").css("font-weight", "bold");
    var vd = $('<td> Records </td>').css("font-size", "12px").css("font-weight", "bold");
    vr.append(va);
    vr.append(vb);
    vr.append(vc);
    vr.append(vd);
    vrtab.append(vr);
    for (k in d ) {
      var vr = $('<tr>');   
      var va = $('<td>'+d[k].activity_name+'</td>').css("font-size", "11px");
      var vb = $('<td>'+d[k].action_date.substr(0,10)+'</td>').css("font-size", "11px");
      var vc = $('<td>'+d[k].status+'</td>').css("font-size", "11px");
      var vd = $('<td>'+d[k].count+'</td>').css("font-size", "11px");
      vr.append(va);
      vr.append(vb);
      vr.append(vc);
      vr.append(vd);
      vrtab.append(vr);

    }

    hd.append(vrtab);
    c.append(hd);
  }

  var hjExec = function(o) {
    var hsid = o.id.split('-')[1];
    var htype = $("#selHtype option:selected").val();
    var ptype = $("#selHPtype option:selected").val();

    var hUrl = '/csw/harvestJob?setid='+hs+'&ad=1&ht='+htype+'&pt='+ptype;
  	  var jqxhr = $.get(hUrl, function() {
        console.log( "success - 1" );
      })
      .done(function(data) { 
          alert('Harvest Job started');
        	//console.log( JSON.stringify(data) );	
      });
  }

  var harvestClear = function(o) {
    // delete all records in harvest source
    var hsid = o.id.split('-')[1];
    var hUrl = '/collectionClear?setid='+hsid+'&action=1';
      var jqxhr = $.get(hUrl, function() {
        console.log( "success - 1" );
      })
      .done(function(data) { 
        console.log( JSON.stringify(data) );  
      });
  }

  var hjClose = function(o) {

    if ( $("#hjMan").length ) {
        $("#hjMan").remove();
    }

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
        //console.log(JSON.stringify(dres.rows));
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

    //$("#editFrame").append('<span>Select Collection Type: </span>');
    //$("#editFrame").append(selCtype);
    //$("#editFrame").append('</br>');
    //$("#editFrame").append('<span>Select a specific collection: </span>');
    //$("#editFrame").append(selVCol);
    //$("#editFrame").append('</br>');
    //$("#editFrame").append('<span>Select a schema: </span>');
    //$("#editFrame").append(selVScm);
    //$("#editFrame").append('<span>How many ?</span>');
    //$("#editFrame").append(selVCnt);
    //$("#editFrame").append('</br>');
    $("#editFrame").append(tb);
    $("#editFrame").append(vBtn);
    getSchemaList(selVScm);

    //$("#editFrame").append('<h4>Metdata Quality Check</h4>');

    $("#editFrame").append('<div id="mdvalcol"></div>');
    //$("#editFrame").append('<h4>Resource Link Check</h4>');
    //$("#editFrame").append('<p>Check the quality of resource links found in the collection</p>');
    //$("#editFrame").append('<div id="rlvalcol"></div>');

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
            //var so = $('<option value="'+sid+'">' + stxt + '</option>');
            //fedSchema.append(so);
        } else {
            var so = $('<option value="'+sid+'">' + stxt + sc + '</option>');
            selSchema.append(so);
        }
    }
    //sDetFed(10);
    
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
    /*
    var p = $('<p>JUST TEST </p>');
    $("#editFrame").append(p);

    $("#editFrame").append('</br>');

    var rt = $('<label class="md-label">Select Field</label><select id="batchFld"></select>');
    var rto =  $("<option>").attr('value','Url').text('Url');
    rt.append(rto);

    var rta =  $("<option>").attr('value','abstract').text('abstract');
    rt.append(rta);

    var rd = $('<label class="md-label">Query String</label><input id="bfqry" type="text" size="40" placeholder="Search for">');

    $("#editFrame").append(rt);
    $("#editFrame").append(rd);
    $("#editFrame").append('</br>');
    */


}

var rpNewTemplate = function(o) {

}

var pickEdit = function(o) {

    var selCol = $(o).children("option:selected").text();
    var setid = $(o).children("option:selected").val();
    //var selCol = $("#selCol option:selected").text();
    //var setid = $("#selCol option:selected").val();

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
        //gFSD.map = dres.rows;
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
    //schemaTemplate(sid);
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
    // tbx.prepend(trx);

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
        /* get insert reults and add 
        var irx = zx[0].scmap_insert;
        var ne = {};
        gCSD.map
        OR JUST RELOAD SCHEMA details
        */
        $("#schemResult").empty();
        schemaDetail(gCSD.sid,'edit');
        //schemaTemplate()
        // swap out form elems for text here...
       // $("#anr-"+eid).remove();
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

                //var tdf = $("#fe-"+ sid).empty();
                //var tdty = $("#st-"+ sid).empty();
                var tdv = $("#rs-"+ sid).empty();
                var tdm = $("#mp-"+ sid).empty();

                //var zap = $('<select id="edFel" >');
                //var st = gCSD.map[k].moid;

               // if ( st == 0 ) {
                //    for (i in gFSD.smap ) {
                //        var aco =  $("<option>")
                //                .attr('value',gFSD.smap[i].fed_elem)
                //                .text(gFSD.smap[i].fed_elem);
                //            zap.append(aco);
                //    }
                //} else {
                //    for (i in gFSD.som ) {
                //        var aco =  $("<option>")
                //                .attr('value',gFSD.som[i].fed_elem)
                 //               .text(gFSD.som[i].fed_elem);
                //        zap.append(aco);
                //    }
                //}

                //var tsi = $('<select id="edType" >');
               // var to1 =  $("<option>").attr('value','end').text('end');
                //var to2 =  $("<option>").attr('value','object').text('object');
                //tsi.append(to1);
                //tsi.append(to2);

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

                //tdf.append(zap);
                //tdty.append(tsi);
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
                //htxt = htxt + ' Collection Created: ' + gCoLst[k].sdate;

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


    //var qd = $('<div id="batchRes"></div>');

    //$("#editFrame").append(qd);

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

        var shBtn =   $('<a id="rSelHBtn" class="res-tag" >+100</a>')
        .css("font-size", "11px")
        .css("margin", "5px 5px")
        .css("padding","2px 2px")
        .css("color", "#ffffff")
        .css("background-color", "#2191c2")
        .attr('onclick','selectH(this);');

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
        $("#resHdr").append(shBtn);
        $("#resHdr").append(caBtn);
        /*
        $("#editFrame").append(aBtn);
        $("#editFrame").append(sBtn);
        $("#editFrame").append(uBtn);
        $("#editFrame").append('</br >');
        $("#editFrame").append(saBtn);
        $("#editFrame").append(caBtn);
        */
        var qd = $('<div id="batchRes"></div>');
        $("#editFrame").append(qd);

        //var tbx =  $('<table id="brTab" style="bgcolor:light-gray; width: 100%"></table>');
        gBD = dres.rows;
        bldSelTab(gBD);
        
        /*
        for (k in dres.rows) {
            var ro = dres.rows[k];
            var to = $('<tr>');
            var tri = $('<td><input class="bqrsel" type="checkbox" id="'+ro.node_id+ '" name="'+ro.version_id+'" value="'+ ro.mpath+'" checked></td>');
            //var trg = $('<td ><span style="font-size:10px;">' + ro.guid + '</span></td>');
            var trt = $('<td ><span style="font-size:11px; bgcolor:light-gray;">' + ro.citation_title + '</span></td>');
            var trv = $('<td ><span style="font-size:11px; bgcolor:light-gray;">' + ro.node_value + '</span></td>');
            to.append(tri);
            //to.append(trg);
            to.append(trt);
            to.append(trv);
            tbx.append(to);
        }
        $("#batchRes").append(tbx);
        */

    });

}

var bldSelTab = function (gso) {

    $("#brTab tr").remove();
    var tbx =  $('<table id="brTab" style="bgcolor:light-gray; width: 100%"></table>');

    for (k in gso) {
        var z = gso[k].mpath.replace(/["']/g, "");
        gso[k].mpath = z; //.replace(/["']/g, ""); //replace(/'/g, "");
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

        //var tri = $('<td><input class="bqrsel" onclick="cbAction(this)" type="checkbox" id="'+ro.node_id+ '" name="'+ro.version_id+'" value="'+ ro.mpath+'" '+cbs+'></td>');
        //var trg = $('<td ><span style="font-size:10px;">' + ro.guid + '</span></td>');
       
        var trt = $('<td ><span style="font-size:11px; bgcolor:light-gray;">' + ro.citation_title + '</span></td>');
        var trv = $('<td ><span style="font-size:11px; bgcolor:light-gray;">' + ro.node_value + '</span></td>');
        to.append(tri);
        //to.append(trg);
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
          //gCoLst.push(c);
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

var selectH = function(o) {
    /*
    $(".bqrsel").prop("checked", true );
    $(".bqrsel").each(function(){
        $(this).closest('tr').find('td').css('background-color', '#ddeeff')
    });
    */
    var rk = 0;
    for (k in gBD) {
        if (rk < 100) {
            if ( gBD[k].checked == false ) {
                gBD[k].checked = true;
                var nid = '#'+gBD[k].node_id;
                var o = $(nid);
                $(o).prop("checked", true );
                $(o).closest('tr').find('td').css('background-color', '#ddeeff')
                rk++;
            }
        } else {
            break;
        } 
    }
    //bldSelTab(gBD);

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
        if ( gBD[k].checked ) {
            if ( bfn == 'text-replace') {
                
                var nv = gBD[k].node_value.toLowerCase();
                var onv = gBD[k].node_value;
                //var hazit = nv.search(fs);
                var hazit = nv.includes(fs);

                //var inset = gBD[k].checked;
                //if ( hazit > -1  && inset ) {
                if ( hazit ) {
                    var startpos = nv.indexOf(fs);
                    var ags = onv.substr(0,startpos) + rs + onv.substr(fs.length+startpos);
                    //var ags = onv.substr(0,hazit) + rs + onv.substr(fs.length+hazit);
                    if ( k < 10 ) { console.log('replaced ' + onv + ' with ' + ags); }
                    gBD[k].node_value = ags;
                }

            } else if ( bfn == 'field-replace') {
                gBD[k].node_value = rs;    
            }
        }
    }

    bldSelTab(gBD);
    //$(".bqrsel").prop("checked", true );

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

    //batObj.collection = JSON.parse(JSON.stringify(gBD));
    batObj.collection = [];
    for (k in gBD) {
        if ( gBD[k].checked == true ) {
            gBD[k].citation_title ="";
            batObj.collection.push(gBD[k]);
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

