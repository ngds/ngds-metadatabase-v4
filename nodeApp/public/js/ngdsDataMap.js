/* Data Map Tab UI  
  9/30/20 - Fixed Clear button for tile layers - added TGroup
  9/30/20 - code Cleanup
  GH
*/

var gLayer = {}; 
var gDxMap,
    gDxFGroup,
    gDxTGroup,
    gWmsLayer,
    gLayerExtents = [],
    gFGExtents,
    gTx,
    gMapLayerCount=0,
    gMapLayerList = {},
    gSubLayer=[],
    gResourceList =[],
    gLyrAttrTab,
    gLyrExtents={},
    gUseMapExtent = 'contains';

    gMarkerIcon = [ "marker-icon.png", "marker-icon-green.png", "marker-icon-grey.png",
                    "marker-icon-orange.png", "marker-icon-black.png", "marker-icon-yellow.png" ];

var dataMapView = function (o) {
    gMenuSel = 'm';
    $("#leftSearch").hide();
    $("#widget-box").hide();
    $("#leftMDRecord").hide();
    $("#cb").hide();

    $("#leftEdit").hide();
    $("#rightEdit").hide();

    $("#leftCollection").show();
    $("#rightCollection").show();

    mapLeftTemplate();
    dmInit();
                
    if (o) {
        showQryParams(o);
        console.log('MD GUID ' + o.id + ' ' + o.attributes[0].value );

    }

}

var  mapLeftTemplate = function() {

    $("#map-l-widget").empty();

    // Web Service Type
    var lbS  = $('<label class="lablX" for="mapDataType">Service Type</label>')
    var lMT = $('<datalist id="mapType">');
    var dF = $('<option class="map-selopt"  value="WFS">');
    var dM = $('<option class="map-selopt" value="WMS">');
    var dE = $('<option class="map-selopt" value="ESRI WFS">');
    var dC = $('<option class="map-selopt" value="ESRI WMS">');

    lMT.append(dF);
    lMT.append(dM);
    lMT.append(dE);
    lMT.append(dC);

    var selMT = $('<input class="map-select" list="mapType" size="35" name="mapDataType">');

     // Content Model
     var lbCM  = $('<label class="lablX" for="ContentModType">Content Model</label>')
     var lCM = $('<datalist id="cmType">');
     

     var selCM = $('<input class="map-select" list="cmType"  size="35"  name="ContentModType">');

     //Repositories

     var lbDom  = $('<label class="lablX" for="RepoList">Repositories</label>')
     var lRepo = $('<datalist id="dlRepo">');

     var selRepo = $('<input class="map-select" list="dlRepo" size="35"  placeholder="" name="RepoList">');

     // BookMarked
     var lbBM  = $('<label class="lablX" for="selBM">Saved Maps<label>')

     var dlBM = $('<datalist id="dlBM">');
     var dbA = $('<option value="SMU Geothermal Wells">');
     var dbb = $('<option value="BBBB">');
     var dbc = $('<option value="CCCC">');
     var dbd = $('<option value="DDDDD">');
 
     dlBM.append(dbA);

 
     var selBM = $('<input class="map-select" list="dlBM"  size="35"  name="selBM">');

     var qBtn =   $('<a id="mData" class="res-tag" >Query</a>')
                            .css("font-size", "12px")
                            .css("margin", "5px 5px")
                            .css("padding","2px 2px")
                            .css("background-color",  "#2191c2" )
                            .attr('onclick','showQryParams(this);');

    var pDiv = $('<div id="dmServList"></div>')
                    .css("background-color", "#bbcccc")
                    .css("border-width", "1px");

    var nBtn =   $('<a id="mExtent" class="res-tag" >Map Extent Contains</a>')
                            .css("font-size", "12px")
                            .css("margin", "5px 5px")
                            .css("padding","2px 2px")
                            .css("background-color", "#2191c2")
                            .attr('onclick','setExtent(this);');
    
    var rBtn =   $('<a id="mExtView" class="res-tag" >Hide</a>')
                            .css("font-size", "12px")
                            .css("margin", "5px 5px")
                            .css("padding","2px 2px")
                            .css("background-color", "#2191c2")
                            .attr('onclick','toggleExtentsView(this);');

    $("#map-l-widget").append(lbBM);
    $("#map-l-widget").append('</br>');
    $("#map-l-widget").append(dlBM);
    $("#map-l-widget").append(selBM);
   
    $("#map-l-widget").append('</br>');
    $("#map-l-widget").append(lbS);
    $("#map-l-widget").append('</br>');
    $("#map-l-widget").append(lMT);
    $("#map-l-widget").append(selMT);
    $("#map-l-widget").append('</br>');
    $("#map-l-widget").append(lbCM);
    $("#map-l-widget").append('</br>');
    $("#map-l-widget").append(lCM);
    $("#map-l-widget").append(selCM);
    $("#map-l-widget").append('</br>');
    $("#map-l-widget").append(lbDom);
    $("#map-l-widget").append('</br>');
    $("#map-l-widget").append(lRepo);
    $("#map-l-widget").append(selRepo);
    $("#map-l-widget").append('</br>');
  
    $("#map-l-widget").append(qBtn);
    $("#map-l-widget").append(nBtn);
    $("#map-l-widget").append(rBtn);
    $("#map-l-widget").append('</br>');
    $("#map-l-widget").append(pDiv);

    showCMList();
    showMapServers();

    $("input[name=selBM]").on("dblclick",function() {
        $("input[name=selBM]").val("");
    });
    $("input[name=ContentModType]").on("dblclick",function() {
        $("input[name=ContentModType]").val("");
    });

    $("input[name=mapDataType]").on("dblclick",function() {
        $("input[name=mapDataType]").val("");
    });
    
    $("input[name=RepoList]").on("dblclick",function() {
        $("input[name=RepoList]").val("");
    });
    

}

var setExtent = function(o) {
    if ( $("#mExtent").text() == "Map Extent Contains" ) {
        $("#mExtent").text("Map Extent Intersects");
        gUseMapExtent = 'intersects';
    } else if (  $("#mExtent").text() == "Map Extent Intersects"  ) {
        $("#mExtent").text("All ");
        gUseMapExtent = '';
    } else {
        $("#mExtent").text("Map Extent Contains");
        gUseMapExtent = 'contains';

    }
}

var dmInit = function() {

    // $("#dataMap").empty();
    var savdBound;
    var sBound = localStorage.getItem('gDataMapBounds');
    if ( sBound ) {
        sBound =  JSON.parse(sBound);
        savdBound = L.latLngBounds(sBound._southWest, sBound._northEast);
        //savdBound = gDxMap.wrapLatLngBounds(sb);
    }

    if ( !gDxMap ) {

        gDxMap = L.map('dataMap', {minZoom: 1 }).setView([41, -100.09], 6);   
        L.esri.basemapLayer('Streets').addTo(gDxMap);


        gDxMap.on('ready',function() { 
            setTimeout(function(){ 
                gDxMap.invalidateSize();
                //map.fitBounds(initExtent);
            }, 200);
            console.log('ready map')
        }).on('zoomend', function() {
            var uwb = gDxMap.getBounds();
            savdBound = gDxMap.wrapLatLngBounds(uwb);

            console.log(' data map zoom '+ JSON.stringify(savdBound));
            localStorage.setItem("gDataMapBounds", JSON.stringify(savdBound));  
        }).on('moveend', function() {
             var uwb = gDxMap.getBounds();
            savdBound = gDxMap.wrapLatLngBounds(uwb);
            console.log(' data map move '+ JSON.stringify(savdBound));
            localStorage.setItem("gDataMapBounds", JSON.stringify(savdBound));    
        }).on('click', function(ev) {
            var latlng =  gDxMap.mouseEventToLatLng(ev.originalEvent);
            console.log(latlng.lat + ', ' + latlng.lng);
            //console.log('map click ');
        });

        if ( savdBound ) {
            savdBound = gDxMap.wrapLatLngBounds(savdBound);
            gDxMap.fitBounds([ [ savdBound._southWest.lat, savdBound._southWest.lng ],
                               [ savdBound._northEast.lat, savdBound._northEast.lng ] ], 
                            { padding:[ 2, 2 ] } );
        }

        if ( !gDxFGroup ) {
            gDxFGroup = new L.FeatureGroup();
            gDxFGroup.addTo(gDxMap);
        } 
        // new tile group
        if ( !gDxTGroup ) {
            gDxTGroup = new L.layerGroup();
            gDxTGroup.addTo(gDxMap);
        }      
    }    
}

var showQryParams = function(z) {
    /* create link list based on various queries  */

    $("#dmServList").empty();
    $(".subLayerDiv").remove();

    gSubLayer.length = 0;
    
    $("#dmServList").css("overflow-x","hidden")
                    .css("overflow-y","auto")
                    .css("height","440px")
                    .css("width","280px");
    
    var bmi =  $("input[name=selBM]").val();
    var cmi =  $("input[name=ContentModType]").val();
    if ( cmi ) { cmi = cmi.slice(0,cmi.indexOf('(')-1);  }
    var rpi =  $("input[name=RepoList]").val();
    if ( rpi ) { rpi = rpi.slice(0,rpi.indexOf('(')-1);  }
    var dti =  $("input[name=mapDataType]").val();

    // this is for receiving selected guids from search page !
    if ( z &&  typeof(z.id) !== "undefined" && z.id !== "mData" )  {

        for (var i in gExtents) {
            var m = gExtents[i];
            if ( m.guid == z.id ) {
                vz = m.extent;
            }
        }
    } else if ( bmi ) {
        // for saved maps bypass other params
        //showTile();
        var smutile =  $('<a id="exampleWMS" >SMU Well Log WMS</a>')
        .css("font-size", "11px")
        .css("font-weight", "bold")
        .css("margin", "5px 5px")
        .css("padding","2px 2px")
        .attr('onclick','showTile(this);');

        var smuwfs  =  $('<a id="exampleWFS" >SMU Well Log WFS</a>')
        .css("font-size", "11px")
        .css("font-weight", "bold")
        .css("margin", "5px 5px")
        .css("padding","2px 2px")
        .attr('onclick','showLayer(this);');

        $("#dmServList").append(smutile);
        $("#dmServList").append('</br>');
        $("#dmServList").append(smuwfs);

   
    } else if ( dti == 'ESRI WFS') {
       
        var rUrl = '/spatial/getResourceList?type=ESRI-F';
        
    } else if ( dti == 'ESRI WMS') {

        var rUrl = '/spatial/getResourceList?type=ESRI-M';

    } else  if ( dti == 'WFS') {   
        //geoserver

        var rUrl = '/spatial/getResourceList?type=WFS';

    } else if ( dti == 'WMS' ) {
        //geoserver
        var rUrl = '/spatial/getResourceList?type=WMS'; 

    }

    if ( rUrl ) {
        if ( cmi ) { 
            rUrl = rUrl + '&cm='+cmi;   
            //rUrl = rUrl + '&cm='+encodeURIComponent(cmi);    
        }

        if ( rpi ) { 
            rUrl = rUrl + '&r='+rpi;
            //rUrl = rUrl + '&r='+encodeURIComponent(rpi);     
        }
    }

    if ( gUseMapExtent ) {
        var bounds = gDxMap.getBounds();
        var northEast = bounds.getNorthEast().wrap(),
            southWest = bounds.getSouthWest().wrap();
        var be = southWest.lng + ',' + southWest.lat + ',' + northEast.lng + ',' + northEast.lat;
        //var b = '&bbox='+ southWest.lng + ',' + southWest.lat + ',' + northEast.lng + ',' + northEast.lat;
        var b = '&bbox='+ be;
        rUrl = rUrl + b + '&filter='+gUseMapExtent;
    }

    console.log(' Rurl ' + rUrl);

    gResourceList.length = 0;

    if (rUrl) {  
        //var rC = encodeURIComponent(rUrl);

        var jqxhr = $.get(rUrl, 
            {dataType : "jsonp",
                crossDomain: true,
                xhrFields: { withCredentials: true }, 
            }, function() {
                console.log( "success - data layer" );
            }).done( function(data) {
                if (typeof(data) == "object" ) {  var dres = data;} 
                else {   var dres = JSON.parse(data); }
               // console.log(data);

                var dx = dres.rows;
                var lid = '';
                for (var i in dx) {

                    var rlo = {};

                    rlo.id = i;
                    rlo.identifier =  dx[i].identifier;
                    rlo.title = dx[i].title;
                    rlo.link = dx[i].lurl;
                    rlo.ldesc =  dx[i].ldesc;
                    rlo.lparams = dx[i].lparams;
                    rlo.stype = dti;
                    rlo.geom = dx[i].wkt_geometry;
                    gResourceList.push(rlo);

                    if ( rlo.lparams.startsWith("parameter") ) {
                      
                        //console.log(' params  ' + rlo.lparams );

                        if ( dti.substr(0,4) == 'ESRI' ) {
                            bldEsriSubLayers(rlo);

                        } else {
                            bldGeoServerSubLayers(rlo)
                        }

                    }
                       
                    if ( lid == rlo.id ) {
                        var tholder = '>>>  ' + ' ' + rlo.link.substring(0,40);
                    } else {
                        lid = rlo.id;
                        var tholder = rlo.title;
                    }

                    var mf = 'showTile(this)';
                    if ( rlo.link.toLowerCase().indexOf("geoserver") > 4 ) {
                        if ( rlo.link.toLowerCase().indexOf("wfs") > 4 ) {
                            var idType = 'GFS';
                            var mf = 'showGeoserverLayer(this);';
                        } else {
                            var idType = 'GMS';
                        }
                        
                    } else {
                        if ( rlo.link.toLowerCase().indexOf("wfs") > 4 ) {
                            var idType = 'EFS';
                            var mf = 'showEsri(this)';
                        } else {
                            var idType = 'EMS';
                        }
                    }

                    if ( rlo.link.toLowerCase().indexOf("wms") > 4 ) {
                        var wmstile =  $('<a id="rli-' + idType + '-' + rlo.id + '" >' + tholder + '.. (WMS)</a>')
                        .css("font-size", "11px")
                        .css("font-weight", "normal")
                        .css("margin", "5px 5px")
                        .css("padding","2px 2px")
                     
                        .attr('onclick',mf)
                        .attr('onmouseover','preLax(this);')
                        .attr('onmouseout','postLax(this);');
                                        
                        $("#dmServList").append(wmstile);
                        $("#dmServList").append('</br>');

                    
                    } else if ( rlo.link.toLowerCase().indexOf("wfs") > 4 ) {

                        var wfsl  =  $('<a id="rli-'  + idType + '-'+ rlo.id + '" >' + tholder + '.. (WFS)</a>')
                        .css("font-size", "11px")
                        .css("font-weight", "normal")
                        .css("margin", "5px 5px")
                        .css("padding","2px 2px")
                        .attr('onclick',mf)
                       
                        .attr('onmouseover','preLax(this);')
                        .attr('onmouseout','postLax(this);');

                        $("#dmServList").append(wfsl);
                        $("#dmServList").append('</br>');
                    } 
                } 
                rlExtentView(); 
        });
    }
    
}

var bldEsriSubLayers = function(o) {
    // if its in the db as resource link
    
    if ( o.id ) {
       var baslink =  o.link.substr(0,o.link.indexOf("?"));

       if ( baslink.indexOf('/services/') > 1 && baslink.indexOf('/rest') < 1 ) {
            if ( o.stype == 'ESRI WFS' ) {
              baslink = baslink.replace('\/services\/','\/rest\/services\/');
            }

       }
       
       if ( baslink.indexOf('WFSServer') > 1 ) {
        baslink = baslink.replace('\/WFSServer','');
       }

       var subLayers = { id: o.id, viewstate: 'off',  subLayerA: [] };
       var paramsList = o.lparams.substr(12,o.lparams.length-2).split(',');
       for (var i in paramsList) {
            if ( o.stype == 'ESRI WFS' ) {
                var subLyrUrl = baslink + '/' + i;
            } else {
                var subLyrUrl = baslink;
            }
           var ps = paramsList[i].split(':');
           var pn = ps[1].replace(/"/g,"");
           pn = pn.replace('}','');
           var layerObj = { "subId" : i, "url": subLyrUrl, "ptype": ps[0], "name": pn };
           subLayers.subLayerA.push(layerObj);
       }
       gSubLayer[o.id] = subLayers;
    }
}	


var rlExtentView = function() {

    gLayerExtents.length = 0;
    if ( gFGExtents ) {
        gDxMap.removeLayer(gFGExtents);
    }

    /*
    if ( !gFGExtents ) {
        var mb = gDxMap.getBounds()
        gFGExtents = new L.featureGroup(mb);
    }
    */
    for ( o in gResourceList) {
        var rlo = gResourceList[o];
        var poly = rlo.geom.slice(9,-2);
        if ( poly ) {
            var geoPairs = poly.split(',');
            var sw = geoPairs[0].trim().split(' ');
            var ne = geoPairs[2].trim().split(' ');
            var n = parseFloat(ne[1]);
            var s = parseFloat(sw[1]);
            var e = parseFloat(ne[0]);
            var w = parseFloat(sw[0]);
            //var rectExtent = L.latLngBounds([s, w], [n, e]);

            var center = new L.LatLng(s + (n - s)/2 ,e + (w - e)/2);
            //gDxMap.panTo(center);
            var bounds = [[ s, w], [ n, e ]];
            //gFGExtents = new L.featureGroup(bounds);
            var rc = '#'+Math.floor(Math.random()*16777215).toString(16);

            var rect = L.rectangle(bounds, 
                {fillColor: rc, weight: 1, color: 'black', fillOpacity: .3, opacity: .3 }
                ).on('click', function (e) {
             console.info(e);
            }); //.addTo(gDxMap);
            rect._leaflet_id = 'lex-'+rlo.id;
            gLayerExtents.push(rect);

        }

    }

    if ( gLayerExtents ) {
        gFGExtents = L.featureGroup( gLayerExtents ).addTo(gDxMap);
    } 

    /*
    var gUrl = '/action/getContentModels?lid=50&sortby=1';
    var jqxhr = $.get(gUrl, function() {
      console.log( "success - content models" );
    })
    .done(function(data) { 

        if (typeof(data) == "object" ) {
            var dres = data;
        } else {
            var dres = JSON.parse(data);
        }

        var dx = dres.rows;
        for (var i in dx) {

        }         
    });
    */

}


var preLax = function(o) {

    var idArr = o.id.split('-')
    var lType = idArr[1];
    var zid = idArr[2];

    $(".subLayerItem").remove();
    $("#slDivList").remove();
    //var zid = o.id.substr(4);

    if (  $(o).css("color") !== "2222ff" ) {
        $(o).css("font-size", "12px")
        .css("font-weight", "bold")
        .css("color","#aaaa44");
    }

    if ( zid ) { 
        if ( gSubLayer[zid] ) { 
            // its cached
            subLayerListView(o);
            
        } else {
            // go get it
            if ( lType == 'EMS' ||  lType == 'EFS'  ) {
                getEsriLayerList(o);
            } else {
                getGeoserverLayerList(o);
            }
        }

        // Hilite Extent
        jQuery.each(gLayerExtents, function(i, rect){
            var rx = rect._leaflet_id;
            if ( rx == 'lex-'+zid ) {
                var gb = rect.getBounds();
                gTx = L.rectangle(gb, 
                    {fillColor: 'white', weight: 3, color: 'red', fillOpacity: .5}
                ).addTo(gDxMap);

            } else {
                rect.setStyle({fillOpacity: .1 });
            }
        });
    }

}

var OldpreLax = function(o) {
    console.log('mouse over ' + o.id);

    var zid = o.id.substr(4);

    if (  $(o).css("color") !== "2222ff" ) {
        $(o).css("font-size", "12px")
        .css("font-weight", "bold")
        .css("color","#aaaa44");

    
        var zid = o.id.substr(4);
        if ( zid ) { 
            var mob = gResourceList[zid];

            var bStr =  '</br>' + mob.lparams + '</br>' +  mob.ldesc + '</br>' + mob.link;
            var poly = mob.geom.slice(9,-2);
            $("#gMoBox").empty();
            var gX = $('<span class="g-item-card" />' + bStr + '</span>')
                    .css("margin", "2px" )
                    .css("border", "1px" )
                    .css("font-size", "10px")
                    .css("font-family", "calibri")
                    .css("display", "block")

                    .css("padding","2px 2px")
                    //.css("border","solid")
                    .css("background-color", "white" )
                    $("#gMoBox").append(gX);
                        //.css("left",  $(o).position().left + 30 )
                    // .css("top",  $(o).position().top );
                        $("#gMoBox").show();
                        showEsri(o);
                        
            console.log( 'poly ' + bStr + poly);

            jQuery.each(gLayerExtents, function(i, rect){
                var rx = rect._leaflet_id;
                if ( rx == 'lex-'+zid ) {
                    var gb = rect.getBounds();
                    gTx = L.rectangle(gb, 
                        {fillColor: 'white', weight: 3, color: 'red', fillOpacity: .5}
                    ).addTo(gDxMap);

                } else {
                    rect.setStyle({fillOpacity: .1 });
                }
            });
        }

    }
       
}

var postLax = function(o) {

    $("#gMoBox").hide();
    $("#gMoBox").empty();
   // $(".subLayerItem").remove();
   //  $("#slDivList").remove();

    if (  $(o).css("color") !== "2222ff" ) {
        $(o).css("font-size", "11px")
        .css("font-weight", "normal")
        .css("color","#444444");
    }
    //console.log('mouse over ' + o.id);
  
    var zid = o.id.substr(4);
    if ( gTx ) {
        gDxMap.removeLayer(gTx);

        jQuery.each(gLayerExtents, function(i, rect){ 
            rect.setStyle({fillOpacity: .3 });
        });
    }
}

var toggleExtentsView = function(o) {

    if  (  $("#mExtView").text() ==  "Hide") {
        $("#mExtView").text("Show");
        if ( gFGExtents ) {
            gDxMap.removeLayer(gFGExtents);
        }
    } else {

        rlExtentView();
        $("#mExtView").text("Hide");
        
    }

}

var showTile = function(o) {

    var idArr = o.id.split('-')
    var lType = idArr[1];
    var zid = idArr[2];

    if ( gResourceList[zid] ) {
        var tlx = gResourceList[zid].link;
    } else {
        var tlx = 'http://geothermal.smu.edu:9000/geoserver/gtda/wms?';
    }

    var bounds = gDxMap.getBounds();
    var northEast = bounds.getNorthEast(),
        southWest = bounds.getSouthWest();

    var zbox = '&bbox='+ southWest.lng + ',' + southWest.lat + ',' + northEast.lng + ',' + northEast.lat;
  
    var mo = { layers: 'gtda:wells',
               width: 800, height: 600, transparent: true, 
               srs: 'EPSG%3A4326', format: 'image/gif' };

    gWmsLayer = L.tileLayer.wms(tlx, mo ).addTo(gDxMap);

    var mlO = $('<option id="tlo-'+ zid + '" value="' + zid + '-' + $(o).text() + '" selected="selected">' + $(o).text() + '</option>');
    $("#map-lyr-select").append(mlO);

}

var subLayerListView = function(o) { 
    // Added parent service id as zid to a tag id
    var idArr = o.id.split('-')
    var lType = idArr[1];
    var zid = idArr[2];

    //var zid = o.id.substr(4);
    var gSL = gSubLayer[zid];
    var gRes = gResourceList[zid];

    $(".subLayerItem").remove();
    $("#slDivList").remove();

    if ( gRes.stype == 'ESRI WFS' ) {
        var sbf = "onclick=esriShowWFS(this)";
    } else if ( gRes.stype == 'ESRI WMS' ) {
        var sbf = "onclick=esriShowTile(this)";
    } else if ( gRes.stype == 'WFS' ) {
        var sbf = "onclick=geoserverShowWFS(this)";
    } else if ( gRes.stype == 'WMS' ) {  
        var sbf = "onclick=geoserverShowTile(this)";
    }

    if ( gSL.viewstate == 'off' ) {
        $(".subLayerDivList").remove();
        for (k in gSubLayer) {
            gSubLayer[k].viewstate = 'off';
        }

        var tp = $("#dmServList").position().top;
        var otp = $(o).position().top;

        var sldiv = $('<div class="subLayerDiv" id="slDivList"></div>')
            .css("margin", "2px" )
            .css("border", "1px" )
            .css("display", "block")
            .css("position","absolute")
            .css("opacity", .9)
            .css("background","white")
            .css("left",  $(o).position().left + 40 )
            .css("top",  tp + zid*20);

        for (i in gSL.subLayerA ) {    
            var sl = gSL.subLayerA[i];
            var bStr =  '<a class="subLayerItem" id="LID-' + zid +'-' + sl.url + '"' + sbf + '>' + sl.name + '</a></br>';        
            var gX = $(bStr)
                .css("margin", "2px" )
                .css("border", "1px" )
                .css("font-size", "10px")
                .css("font-family", "calibri")
                .css("padding","2px 2px")
                .css("background-color", "white" );

             $(sldiv).append(gX);
        }
        gSL.viewstate == 'on';
        $("#map-l-widget").append(sldiv);

    } 

}

var getGeoserverLayerList = function(o) {
    var idArr = o.id.split('-')
    var lType = idArr[1];
    var zid = idArr[2];

    if ( zid ) {
        var subLayers = { id: zid, viewstate: 'off',  subLayerA: [] };
        var mob = gResourceList[zid];
        var urlx =  mob.link ;

        if ( urlx.toLowerCase().indexOf("getfeature") > 4  ) {
            if ( urlx.toLowerCase().indexOf("typename") > 4  ) {
                var  tnStart = urlx.toLowerCase().indexOf("typename")+9;
                var tnEnd =  urlx.toLowerCase().indexOf("&",tnStart);
                var typeName = urlx.substr(tnStart,tnEnd);
                var layerObj = { "subId" : 1, "url": urlx, "name":  typeName };
                subLayers.subLayerA.push(layerObj);  
                gSubLayer[zid] = subLayers;
                subLayerListView(o);       
            }

            console.log('tex');
        
        } else {
            // its a get capabilities

            var uriCodx = encodeURIComponent(urlx);
            var lUrl = '/spatial/getGeoserverCapabilities?url='+uriCodx;

            var jqxhr = $.get(lUrl, function() {
                console.log( "success - content models" );
              })
              .done(function(data) { 
          
                if (typeof(data) == "object" ) {
                      var dres = data;
                } else {
                      var dres = JSON.parse(data);
                }

                if ( dres["FeatureType"]) {
                    var fta =  dres["FeatureType"]; 
                    var urlBase = urlx.substr(0,urlx.indexOf('?'));
                    var urlParams=urlx.substr(urlx.indexOf('?'));
                    var upA = urlParams.split('&');
                  
                    for (i in upA) {
                        var pr = upA[i];
                        var ps = pr.split('=');
                        if ( ps[0].toLowerCase() == 'request' ) {
                            ps[1] ='GetFeature';
                            upA[i] = ps.join('=');
                        }
                    }
                    upA.push('outputFormat=application/json');
                    upA.push('maxFeatures=25');

                    if ( Array.isArray(fta) ) {
                        for (k in fta) {
                            var urlDx = urlBase + upA.join('&') + '&typeName='+fta[k].Name;
                            var layerObj = { "subId" : k, "url": urlDx, "name":  fta[k].Title };
                            subLayers.subLayerA.push(layerObj); 
                        }
                    } else {
                        upA.push('typeName='+fta.Name);
                        var urlDx = urlBase + upA.join('&') ;
                        var layerObj = { "subId" : 0, "url": urlDx, "name":  fta.Title };
                        subLayers.subLayerA.push(layerObj); 
                    }
                    gSubLayer[zid] = subLayers;
                    subLayerListView(o); 
                    
                }

                if ( dres["Layer"]) {
                    var ml = dres["Layer"];
                    var urlBase = urlx.substr(0,urlx.indexOf('?'));
                    if ( Array.isArray(ml) ) {
                        for (k in ml) {
                            var layerObj = { "subId" : k, "url": urlBase, "name":  ml[k].Name };
                            subLayers.subLayerA.push(layerObj); 
                        }
                    } else {
                        var layerObj = { "subId" : 0, "url": urlBase, "name":  ml.Name };
                        subLayers.subLayerA.push(layerObj); 
                    }
                    gSubLayer[zid] = subLayers;
                    subLayerListView(o); 
                }

                  console.log(dres);
                      
              });
     
        }
    }

}

var getEsriLayerList = function(o) {
    var idArr = o.id.split('-')
    var lType = idArr[1];
    var zid = gSL.id; // idArr[2];
    //var zid = o.id.substr(4);
    if ( zid ) {
        var subLayers = { id: zid, viewstate: 'off',  subLayerA: [] };
        var mob = gResourceList[zid];
        var urlx =  mob.link;

        if ( lType == 'EFS' && mob.lparams.substr(0,10) == 'parameters' ) {
            var urlBase=urlx.substr(0,urlx.indexOf('?'));
			
			var lpStr = mob.lparams.substr(11, mob.lparams.length-1);
			var pA = lpStr.split(',');
			for (var i in pA) {
				var prx = pA[k].split(':');
				var ux = urlBase + '/' + i;
				var layerObj = { "subId" : i, "url": urlDx, "name": prx[1] };
				subLayers.subLayerA.push(layerObj);        
			}
		    gSubLayer[zid] = subLayers;
        
        }  else {
            var domA = urlx.split('/');
            var dom = domA[0]+'//'+ domA[2];

            var ssL = urlx.substr(0,5);
            if ( ssL !== 'https') {   
                var zProxy = 'https:'+ urlx.substring(5);
                urlx = zProxy;
            }
    
            var settings = {
                'cache': false,
                'dataType': "jsonp",
                "async": true,
                "crossOrigin": true,
                "crossDomain": true,
                "url": urlx,
                "method": "GET",
                "headers": {
                    "accept": "application/json",
                    "Access-Control-Allow-Origin":"*",
                    "Access-Control-Allow-Origin": dom,
                    "Access-Control-Allow-Headers": "*",
                    "Access-Control-Allow-Methods": "*",
                    "Access-Control-Request-Headers": "origin, content-type, accept"
                }, 
                xhrFields: { withCredentials: true },
                beforeSend: function(xhr) {
                    xhr.withCredentials = true;
                    xhr.overrideMimeType( "application/json; charset=x-user-defined" );
                }
            }

            var jx = $.ajax(settings)
                .always(function (data, status, err) {
                    //var q = data.getResponseHeader();
                    console.log('always '+ JSON.stringify(data) );
                    //console.log(' x ' + data + err + status);
                })
                .fail(function (x,s,e) {
                    console.log(' fail  ' + JSON.stringify(e));
                    //console.log(' done  ' + JSON.stringify(s));
                   // console.log(' done  ' + JSON.stringify(x));
                })
                .done(function (d,s,x) {
                    console.log(' done  ' + JSON.stringify(d));
                    console.log(' done  ' + JSON.stringify(s));
                    console.log(' done  ' + JSON.stringify(x));
                });
            /*
            $.ajax(settings).done(function (data) {
                if (typeof(data) == "object" ) {  var dres = data;} 
                else {   var dres = JSON.parse(data); }
                
                if ( data.error ) {
                    console.log('Map Service not accessible Error Code: ' + data.error.code + ' ' + data.error.message);
                    $(".subLayerItem").remove();
                    $("#slDivList").remove();
                    var tp = $("#dmServList").position().top;
                    var otp = $(o).position().top;
            
                    var sldiv = $('<div class="subLayerDiv" id="slDivList"></div>')
                        .css("margin", "2px" )
                        .css("border", "1px" )
                        .css("display", "block")
                        .css("position","absolute")
                        .css("opacity", .9)
                        .css("background","white")
                        .css("left",  $(o).position().left + 40 )
                        .css("top",  tp + zid*20);
                    var bStr =  '<p class="subLayerItem" >Error -' + data.error.code + ' :</br> ' + data.error.message + '</p>';        
                    var gX = $(bStr)
                        .css("margin", "2px" )
                        .css("border", "1px" )
                        .css("font-size", "10px")
                        .css("font-family", "calibri")
                        .css("padding","2px 2px")
                        .css("background-color", "white" );
                        $(sldiv).append(gX);
                        $("#map-l-widget").append(sldiv);

                } else {
                    var dx = dres.layers;
                    if ( dx && dx.length > 0 ) {  
                        for (var i in dx) {
                            var urlDx = urlx + '/' + dx[i].id;
                            var layerObj = { "subId" : i, "url": urlDx, "name":  dx[i].name };
                            subLayers.subLayerA.push(layerObj);        
                        }
                        gSubLayer[zid] = subLayers;
                    }
                    subLayerListView(o); 

                }
                
            });  
            */
        }

    }
}

var showEsri = function(o) {
    var zid = o.id.substr(4);
    if ( zid ) {
        var mob = gResourceList[zid];
        var urlx =  mob.link;
        var domA = urlx.split('/');
        var dom = domA[0]+'//'+ domA[2];

        var settings = {
            'cache': false,
            'dataType': "jsonp",
            "async": true,
            "crossOrigin": true,
            "crossDomain": true,
            "url": urlx  + '&f=pjson',
            "method": "GET",
            "headers": {
                "accept": "application/json",
                "Access-Control-Allow-Origin":"*",
                "Access-Control-Allow-Origin": dom
            }, 
            xhrFields: { withCredentials: true },
            beforeSend: function(xhr){
                xhr.withCredentials = true;
            }
        }

        $.ajax(settings).done(function (data) {

           
            if (typeof(data) == "object" ) {  var dres = data;} 
            else {   var dres = JSON.parse(data); }
         
           
            var dx = dres.layers;
            var lid = '';
            if ( dx.length > 0 ) {
           
                for (var i in dx) {
                    console.log(' Layers ' + dx[i].id + ' ' + dx[i].name);
                    var urlDx = urlx + '/' + dx[i].id;

                    var bStr =  '</br><a id=' + urlDx + ' onclick=esriSubLayer(this) >' + dx[i].name + '</a>';
                   
                    var gX = $(bStr)
                            .css("margin", "2px" )
                            .css("border", "1px" )
                            .css("font-size", "10px")
                            .css("font-family", "calibri")
                            .css("display", "block")
                            .css("left",  $(o).position().left + 40 )
                            .css("top",  $(o).position().top  + 20 + i*20 )
                            .css("position","absolute")
                            .css("padding","2px 2px")
                            .css("background-color", "white" );

                     $(o).append(gX);
                       
                }
              
            } else {

                $(o).css("font-size", "12px")
                .css("font-weight", "bold")
                .css("color","2222ff");

                var omy = $(o).text() +  dx[i].name + '(' + dx[i].id + ')';
                $(o).text(omy);

                urlx = urlx + '/0';
                
                var tl = L.esri.featureLayer({ url: urlx, useCors: false }).addTo(gDxMap);

                tl.on('load', function() {
                    tl.eachFeature(function(lyr){
                        var flx = lyr.feature;
                    });
                });

            }
            
           
  
        });
        
   
        
    }

}

var geoserverSubLayer = function(o) {
    var nk = o.id.split('-');
    var zid = nk[1];
    if ( nk.length > 3 ) {
        var zUrl = nk.slice(2,nk.length).join('-');
    } else { 
        var zUrl = nk[2];
    }

    var rlo = gResourceList[zid];

    if ( rlo.title ) {
        var kf = rlo.title  + '-' + $(o).text();
        var mf = '<strong>' + rlo.title  + ' ' + $(o).text() + '</strong></br>';
    } else {
        kf =  $(o).text();
        var mf = $(o).text() + '</br>';
    }

    //var mlO = $('<option id="tlo-'+ zid + '" value="' + zid + '-' + $(o).text() + '" selected="selected">' + kf +  ' ( 0 )</option>');
    $("#map-lyr-status").text("Loading");
    $("#map-lyr-status").css("background","#88bb88");
    //$("#map-lyr-select").append(mlO);

    if ( zUrl ) {
        var bounds = gDxMap.getBounds();
        var northEast = bounds.getNorthEast(),
            southWest = bounds.getSouthWest();
        
        if ( zUrl.indexOf('?') > 1 ) {
            var bbox = '&bbox='+southWest.lng+','+southWest.lat+','+northEast.lng+','+northEast.lat;
        } else {
            var bbox = '?bbox='+southWest.lng+','+southWest.lat+','+northEast.lng+','+northEast.lat;
        }
        zUrl = zUrl+bbox;

        //var proxyUrl = '/spatial/getGeoserverFeature?url='+encodeURIComponent(zUrl);
        var ssL = zUrl.substr(0,5);
        if ( ssL !== 'https') {   
            var zProxy = 'https:'+ zUrl.substring(5);
            zUrl = zProxy;
        }

        var jqxhr = $.get(zUrl,  {dataType : 'jsonp' }, function() {
                console.log( "success - data layer" );
            }).done( function(data) {
                if (typeof(data) == "object" ) {  var dres = data;} 
                else {   var dres = JSON.parse(data); }
                console.log(data);
                if ( dres.crs ) {
                    delete dres.crs;
                }
                var fc = 0;
                if ( dres.totalFeatures ) {
                    fc = dres.totalFeatures;
                }

                if ( fc > 0 ) {
                    if ( gMapLayerCount < 7) { gMapLayerCount++; }
                    else { gMapLayerCount = 0;}
                    var icnImg = '/img/'+gMarkerIcon[gMapLayerCount];
                    var layerIcon = L.icon({iconUrl: icnImg});

                    var geojsonLayer = new L.GeoJSON(dres,{ 
                            onEachFeature: function (f,l) {
                                l.setIcon(layerIcon);
                            }
                        })
                        .bindPopup(function (layer) {
                            var ptxt = "";
                            var shop = 0;
                            
                            for (k in layer.feature.properties ) {
                                if (k.toLowerCase().indexOf('name') > 1 && layer.feature.properties[k].length > 1 && shop < 4 ) {
                                    ptxt = ptxt + '<strong>' + k + '</strong>' + ' : ' + layer.feature.properties[k] + '</br>';
                                    shop++;
                                }
                            }
                            var cb = '<a class="popup-close-button" href="#close" style="color: white; outline: none;">X</a></br>'
                            if (ptxt.length == 0 ) { ptxt = '<strong></span>' + layer.feature.id + '</strong></br>'; }
                            ptxt = '<span style="color:#50c7c3;"><strong>'+kf+'</strong>'+ptxt;
                            var bbl = ptxt +'<a id="' +  layer.feature.id + '" onclick="showGeoAttr(this)">Show Attributes</a>'; 
                            return bbl;
                        }, { closeButton: false }).addTo(gDxFGroup);
                   $("#map-lyr-status").text("Loaded");
                   $("#map-lyr-status").css("background","white");
                   $("#map-lyr-status").text("Complete");
                   var mlO = $('<option id="tlo-'+ zid + '" value="' + zid + '-' + $(o).text() + '" selected="selected">' + kf +  ' ( ' + fc + ' )</option>');
                   $("#map-lyr-select").append(mlO);
                   setTimeout(function(){
                        $("#map-lyr-status").text("");
                        $("#map-lyr-status").css("background","white");
                    },3000);
                    gDxMap.fitBounds(geojsonLayer.getBounds());

                } else {
                    $("#map-lyr-status").css("background","white");
                    $("#map-lyr-status").text("Empty Data set");
                }
               
 
            });
    }
}

var esriShowTile = function(o) {

    var idArr = o.id.split('-')
    var zid = '0'; //idArr[1];
    var zUrl = idArr[2];
    var xUrl =  idArr[2];
    var slname = o.text;

    var domA = zUrl.split('/');
    var dom = domA[0]+'//'+ domA[2];

    if ( gResourceList[zid] ) {
        var rlo = gResourceList[zid];
        var subl  = gSubLayer[zid];
    }

    if ( rlo.title ) {
        var kf = rlo.title  + '-' + $(o).text();
        var mf = '<strong>' + rlo.title  + ' ' + $(o).text() + '</strong></br>';
    } else {
        kf =  $(o).text();
        var mf = $(o).text() + '</br>';
    }

    var mlO = $('<option id="tlo-'+ zid + '" value="' + zid + '-' + $(o).text() + '" selected="selected">' + kf +  ' ( WMS )</option>');
    $("#map-lyr-status").text("Loading");
    $("#map-lyr-status").css("background","#88bb88");
    $("#map-lyr-select").append(mlO);

    if ( zUrl ) {

        var ssL = zUrl.substr(0,5);
        if ( ssL !== 'https') {   
            var zProxy = 'https:'+ zUrl.substring(5);
            zUrl = zProxy;
        }

        var mo = {
            url: zUrl,
            layers: zid,
            version: 1.3,
            transparent: true,
            styles: 'default',
            format: 'image/png',
            height: 256,
            width: 256,
            attribution: "done",
            //crs: "EPSG%3A4326",
            "crossOrigin": true,
            "crossDomain": true,
            "method": "GET",
            "headers": {
                "accept": "application/json",
                "accept": "text/html",
                "accept": "image/jpeg",
                "accept": "image/png",
                "Access-Control-Allow-Origin":"*",
                "Access-Control-Allow-Origin": dom
            }, 
            xhrFields: { withCredentials: true },
              beforeSend: function(xhr){
                xhr.withCredentials = true;
              } 
          };

        gWmsLayer =  L.tileLayer.wms(zUrl, mo );
        var et = 0;
        gWmsLayer.addTo(gDxTGroup)
                .on('tileerror', function(error,tile){  
                    if ( et == 0 ) {
                        alert('Tile Load error ' + zUrl);
                        et = 1;
                    }
                    //console.log('tile load error ');
                })
                .on('load', function(evt) {
                    $("#map-lyr-status").text("Loaded");
                    $("#map-lyr-status").css("background","white");
                    $("#map-lyr-status").text("Complete");
                    $("#tlo-"+zid).attr("id","tlo-"+zid+"-"+gWmsLayer._leaflet_id);
                }).bindPopup(function(evt) {
                    var flx = evt.feature.properties;
                    console.log(' tile click ');
                });
         

    }

}

var esriShowTileOld = function(o) {

    var idArr = o.id.split('-')
    var zid = idArr[1];
    var zUrl = idArr[2];
    var xUrl =  idArr[2];
    var slname = o.text;

    var domA = zUrl.split('/');
    var dom = domA[0]+'//'+ domA[2];

    if ( gResourceList[zid] ) {
        var rlo = gResourceList[zid];
        var subl  = gSubLayer[zid];
    }

    if ( rlo.title ) {
        var kf = rlo.title  + '-' + $(o).text();
        var mf = '<strong>' + rlo.title  + ' ' + $(o).text() + '</strong></br>';
    } else {
        kf =  $(o).text();
        var mf = $(o).text() + '</br>';
    }

    var mlO = $('<option id="tlo-'+ zid + '" value="' + zid + '-' + $(o).text() + '" selected="selected">' + kf +  ' ( WMS )</option>');
    $("#map-lyr-status").text("Loading");
    $("#map-lyr-status").css("background","#88bb88");
    $("#map-lyr-select").append(mlO);

    if ( zUrl ) {
  
        var bounds = gDxMap.getBounds();
        var northEast = bounds.getNorthEast().wrap(),
            southWest = bounds.getSouthWest().wrap();

        var zbox = southWest.lng + ',' + southWest.lat + ',' + northEast.lng + ',' + northEast.lat;
        //use map extent by default didnt add
        //zUrl = zUrl + '?f=json';
    
        var mo = { 
            dataType: "jsonp",
            //width: 250,
             layers: slname,
             height: 250, 
             useCors: false,
             transparent: 0, 
             srs: 'EPSG%3A4326', 
             format: 'image/png' 
            };

        var ssL = zUrl.substr(0,5);
        if ( ssL !== 'https') {   
            var zProxy = 'https:'+ zUrl.substring(5);
            zUrl = zProxy;
        }
    
        mo  = { url: zUrl,
            width: 250,
            layers: slname,
            height: 250, 
           // useCors: false,
            transparent: false, 
            srs: 'EPSG%3A4326', 
            format: 'image/png',
          //  'cache': false,
          //  'dataType': "jsonp",
          //  "async": true,
            "crossOrigin": true,
            "crossDomain": true,
            "method": "GET",
            "headers": {
                "accept": "text/html",
                "Accept-Encoding": "gzip",
                "Access-Control-Allow-Origin":"*",
                "Access-Control-Allow-Origin": dom
            }, 
            xhrFields: { withCredentials: true },
            beforeSend: function(xhr){
                xhr.withCredentials = true;
            }
        }

        /*
        mo = { url: 'https://services.arcgisonline.com/ArcGIS/rest/services/USA_Topo_Maps/MapServer', 
            width: 250,
           // layers: slname,
            height: 250, 
            useCors: false }
        */


        gWmsLayer =  L.tileLayer.wms(zUrl, mo )
        //gWmsLayer = L.esri.tiledMapLayer( mo )
        //    url:  xUrl, 
         //   maxZoom: 15
        //  })
        //gWmsLayer = L.esri.tiledMapLayer( mo )
            .addTo(gDxMap)
            .on('tileerror', function(error,tile){
                var ec = error;
                var tx = tile;
                console.log(' error ');
               // gWmsLayer.removeFrom(gDxMap);
               // $("#map-lyr-select option:selected").remove();
               // alert('ERROR for ' + rlo.title + ' data request to server ');
               // $("#map-lyr-status").text("");
            })
            .on('load', function(evt) {
                var x = evt;
                $("#map-lyr-status").text("Loaded");
                $("#map-lyr-status").css("background","white");
                $("#map-lyr-status").text("Complete");
                $("#tlo-"+zid).attr("id","tlo-"+zid+"-"+gWmsLayer._leaflet_id);
            }).bindPopup(function(evt) {
                var flx = evt.feature.properties;
                console.log(' tile click ');
            });
        // gWmsLayer = L.esri.TiledMapLayer(zUrl, mo ).addTo(gDxMap);
      
       // var mlO = $('<option id="tlo-'+ zid + '" value="' + zid + '-' + $(o).text() + '" selected="selected">' + kf + ' WMS</option>');
        //$("#map-lyr-select").append(mlO);
    }

}

var esriShowWFS = function(o) {
//var esriSubLayer = function(o) {
// Retrieves actual data ..
    var nk = o.id.split('-');
    var zid = nk[1];
    var zUrl = nk[2];
    var rlo = gResourceList[zid];

    if ( rlo.title ) {
        var kf = rlo.title  + '-' + $(o).text();
        var mf = '<strong>' + rlo.title  + ' ' + $(o).text() + '</strong></br>';
    } else {
        kf =  $(o).text();
        var mf = $(o).text() + '</br>';
    }

    var mlO = $('<option id="tlo-'+ zid + '" value="' + zid + '-' + $(o).text() + '" selected="selected">' + kf +  ' ( 0 )</option>');
    $("#map-lyr-status").text("Loading");
    $("#map-lyr-status").css("background","#88bb88");
    $("#map-lyr-select").append(mlO);

    if ( zUrl ) {
        var bounds = gDxMap.getBounds();
        var northEast = bounds.getNorthEast().wrap(),
            southWest = bounds.getSouthWest().wrap();
        
        var zbox = '&bbox='+ southWest.lng + ',' + southWest.lat + ',' + northEast.lng + ',' + northEast.lat;
        if ( zUrl.indexOf('?') > 1 ) {
            var bbox = '&extent='+southWest.lng+','+southWest.lat+','+northEast.lng+','+northEast.lat;
        } else {
            var bbox = '?extent='+southWest.lng+','+southWest.lat+','+northEast.lng+','+northEast.lat;
        }
        zUrl = zUrl + bbox;
        var propx = true;
        
        if ( gMapLayerCount < 7) { gMapLayerCount++; }
        else { gMapLayerCount = 0;}
        var icnImg = gMarkerIcon[gMapLayerCount];
        var df, fc=0, 
            gt, pDesc, fldArray=[];

        var ssL = zUrl.substr(0,5);

        if ( ssL !== 'https') {
            //var zProxy = '/spatial/getMapProxy?url='+encodeURIComponent(zUrl);
            var zProxy = '/spatial/getMapProxy?url='+zUrl;
            zProxy = 'https:'+ zUrl.substring(5);
            console.log('zproxy ' + zProxy);
            zUrl = zProxy;
        }

        var tl = L.esri.featureLayer({ url: zUrl, useCors: false, cacheLayers: true,  simplifyFactor: 1,
                onEachFeature: function (feature, layer) {
                    var fx = feature;
                    fc++;
                    //console.log('F');
                } })
        .metadata(function(err,metadata) {
            var ix = metadata;
            if ( err ) {
                if ( err.error.code && err.error.code == 500 ) {
                    $("#map-lyr-select option:selected").remove();
                    alert('ERROR for ' + rlo.title + ' data request to server ');
                    $("#map-lyr-status").text("");
                }
                console.log('Metata data error ' + JSON.stringify(err) );
            } else if ( metadata ) {
                gt = metadata.geometryType;
                //pDesc = metadata.description;
                df = metadata.displayField;
                tl.bounds = metadata.extent;
                tl.displayField = df;
                fldArray = metadata.fields;
            }  
        }).on('error', function(evt) {
            console.log('ESRI Feature load error ' + evt.error.code + ' ' + evt.error.message);
            $("#map-lyr-status").text("Error" + evt.error.message);
            $("#map-lyr-status").css("background","#bb7777");

        }).on('load', function(evt) {
            var fo = Object.keys(tl._layers);
            fc = fo.length;

            $(".subLayerItem").remove();
            $("#slDivList").remove();

            $("#tlo-"+zid).text(kf + ' ( ' + fc + ' ) ');
            $("#tlo-"+zid).attr("id","tlo-"+zid+"-"+tl._leaflet_id);

            $("#map-lyr-status").text("Loaded");
            $("#map-lyr-status").css("background","white");
            $("#map-lyr-status").text("Complete");

            setTimeout(function(){
                $("#map-lyr-status").text("");
            },3000);

            /* USE THIS FOR MAP EVENTS
            tl.eachFeature(function(lyr){
                fc++;
                var flx = lyr.feature;
                if ( flx.properties && propx) {
                    for (key in flx.properties) {
                        console.log('Name ' + key + ' Value ' + flx.properties[key]);
                    }
                    propx = false;
                }
            });
            */
        }).addTo(gDxFGroup);

       
        tl.bindPopup(function(evt) {
            
            var flx = evt.feature.properties;
            var lnkId = 'lnkLF-' + tl._leaflet_id + '-' + evt.feature.id;
         
            var alnk = '<a id="' + lnkId + '" onclick="showAttr(this)">Show Attributes</a>'; 
            //if ( !df && !tl.displayField ) { df = evt.feature; }
            if ( !df && tl.displayField ) { df = tl.displayField; }
            
            return L.Util.template('<span >' + mf + '<i>{'+df+'}</i></br>' + alnk + '</span>',evt.feature.properties);
          
        });

        // Only zoom if you have more than 2 features

        //if ( fc > 2 ) {
        if ( tl.bounds ) {
            gDxMap.fitBounds(tl.bounds);
        }
          
            /*
            tl.query().bounds(function(err,latlngbounds) {
                if (err) { return; }   
                gDxMap.fitBounds(latlngbounds);
            });
            */
        //}

        $(o).css("font-size", "12px")
            .css("font-weight", "bold")
            .css("color","ff0000");

    }

}

var showGeoAttr = function(o) {
    var fid = o.id;

    gDxMap.eachLayer(function(layer) {
        if ( layer.feature ) {
            if ( layer.feature.id == fid ) {
                showAttrTemplate(layer);
            }
        }
    });
}

var showAttr = function(o) {

    var idA = o.id.split('-');
    var thisLayer, e;
    
    if ( idA[1] ) {
        gDxMap.eachLayer(function(layer) {
            if ( layer._leaflet_id == idA[1] ) {
                thisLayer = layer;
                e = thisLayer._layers[ idA[2] ];
                showAttrTemplate(e);
                return;
            }
        });
    }
}

var showAttrTemplate = function(e) {

    var flx = e.feature.properties;

    $(".layerAttrDiv").remove();
    gLyrAttrTab = $('<div class="layerAttrDiv" id="LayerAttrList"></div>')
    .css("overflow-x","auto")
    .css("overflow-y","auto")
    .css("padding","6px")
    .css("box-shadow","6px 6px #888888 blur 2px")
    .css("margin", "2px" )
    .css("border", "1px" )
    .css("display", "block")
    .css("position","absolute")
    .css("opacity", .9)
    .css("z-index",999)
    .css("background","#d4e8f4")
    .css("left",  1000 )
    .css("width",  380 )
    .css("top",  90);
    var hdrspan =  $('<span >Feature Attributes Table </span>')
    var nBtn =   $('<a id="attrTabBtn" class="res-tag" >Hide</a>')
    .css("font-size", "12px")
    .css("margin", "5px 5px")
    .css("padding","2px 2px")
    .css("background-color", "#2191c2")
    .attr('onclick','hideAttr(this);');
    hdrspan.append(nBtn);
    gLyrAttrTab.append(hdrspan);

    var lTab =  $('<table class="layerAttrTB" id="LayerAttrTb"></table>').css("border-collapse","collapse");
    var row = $('<tr></tr>');     
    
    var tk = $('<td>Field</td>')
        .css("border","1px solid black")
        .css("font-size", "12px")
        .css("font-family", "calibri");
    var tv = $('<td>Value</td>')
        .css("border","1px solid black")
        .css("font-size", "12px")
        .css("font-family", "calibri");

    row.append(tk);
    row.append(tv);
    lTab.append(row);            

    for (key in flx) {
        console.log('Name ' + key + ' Value ' + flx[key]);
        if ( flx[key] !== null & flx[key] !== '') {
            var row = $('<tr></tr>');   

            var tk = $('<td><a id="attrTabBtn-"'+key+' onclick="selAttr(this)" style="font-size:10px;font-family:calibri;"> ' + key + '</a></td>')
                .css("border","1px solid black")
                .css("font-size", "10px")
                .css("font-family", "calibri");
            var tv = $('<td>'+ flx[key] + '</td>')
                .css("border","1px solid black")
                .css("font-size", "10px")
                .css("font-family", "calibri");
            row.append(tk);
            row.append(tv);
            lTab.append(row);
        }
        
    }
    gLyrAttrTab.append(lTab);
    $("#rightCollection").append(gLyrAttrTab);

}

var hideAttr = function(o) {
    $("#LayerAttrList").hide();

}

var selAttr = function(o) {


}

var pickLayer = function(o) {
    // The layer select list


}

var zoomToLayer = function(o) {

    var lid = $("#map-lyr-select option:selected").attr("id");
    var lx = lid.split("-");

    if (lx[2]) {
        gDxFGroup.eachLayer(function(lyr){
            if ( lyr._leaflet_id == lx[2] ) {
                var b = lyr.bounds;
                gDxMap.fitBounds([[b.ymin,b.xmax],[b.ymax, b.xmin]]);
                return;
                /*
                lyr.query().bounds(function(err,latlngbounds) {
                    if (err) { 
                        gDxMap.fitBounds(lyr.getBounds());
                        return; 
                    }  else {
                        gDxMap.fitBounds(latlngbounds);
                        return;
                    }
                    
                });
                */
            }
        });
    } else {
        // layer did not complete ...
        console.log('zoom error ' + lid);
    }

}

var deleteLayer = function(o) {

    var lid = $("#map-lyr-select option:selected").attr("id");
    var lx = lid.split("-");

    var lt = $("#map-lyr-select option:selected").text();
   
    var lstate="";
    // lx[2] is leaflet id
    if (lx[2]) {

        if ( lt.indexOf('WMS') > 1 ) {
            gDxMap.eachLayer(function(layer) {
                if ( layer._leaflet_id == lx[2] ) {
                    gDxMap.removeLayer(layer);
                    $("#map-lyr-select option:selected").remove();
                    lstate = 'Status '+lx[2]+ ' removed';
                    return;
                }
            });

        } else {
            gDxFGroup.eachLayer(function(lyr){
                if ( lyr._leaflet_id == lx[2] ) {
                    gDxFGroup.removeLayer(lyr);
                    $("#map-lyr-select option:selected").remove();
                    lstate = 'Status '+lx[2]+ ' removed';
                    return;
                }
            });
        }

        if (lstate=="") {
            console.log("Layer not found "+lx[2]);
        }

    } else {
        $("#map-lyr-select option:selected").remove();
        console.log('Removed incomplete layer ' + lid);

    }


}

var showGeoserverLayer = function(o) {


}

var showLayer = function(o) {
    // wfs layers 
    var idArr = o.id.split('-')
    var lType = idArr[1];
    var zid = idArr[2]; //o.id.substr(4);
    if ( zid ) {
        var mob = gResourceList[zid];
        var urlx =  mob.link;
        var dom = urlx;
        
        var fl = mob.lparams;
        var xfl;

        if ( fl & fl.indexOf('typeName:') ) {
            xfl = fl.substr(fl.indexOf('typeName:'),-2);
        }

        if ( xfl && urlx ) {
            dom = dom.substr(0,dom.indexOf('?')) + 'request=GetFeature&service=WFS&typeNames'+xfl;
        }
        console.log(' wfs URL ' + dom);
    }
    var bounds = gDxMap.getBounds();
    var northEast = bounds.getNorthEast(),
        southWest = bounds.getSouthWest();
    //var dom = '';
    var zbox = '&bbox='+ southWest.lng + ',' + southWest.lat + ',' + northEast.lng + ',' + northEast.lat;
    var srs = '&srs=EPSG%3A4326';
    //var tn = '&typeName='+xfl;
    var mf = '&maxFeatures=50';
    var af = '&outputFormat=application%2Fjson';


    lx = '/spatial/previewMap?dom='+dom+mf+srs+zbox;

   
    console.log(lx);

    var testURL = 'http://services.azgs.az.gov/ArcGIS/services/aasggeothermal/TXActiveFaults/MapServer/WFSServer?request=GetFeature&service=WFS&typeNames=ActiveFault&maxFeatures=10';
    var testURL = 'http://services.azgs.az.gov/arcgis/rest/services/aasggeothermal/AZWellHeaders/MapServer/0';

    var tl = L.esri.featureLayer({ url: testURL, useCors: true }).addTo(gDxMap);

}

var clearMap = function(o) {

    gDxFGroup.eachLayer(function(lyr){
        if ( lyr ) {
            console.log(' layer remove ' + lyr._leaflet_id);
            gDxFGroup.removeLayer(lyr);
        }
    });

    gDxTGroup.eachLayer(function(lyr){
        if ( lyr ) {
            console.log(' layer remove ' + lyr._leaflet_id);
            gDxTGroup.removeLayer(lyr);
        }
    });

    if (gLayer) {
        gDxMap.removeLayer(gLayer);
    }

    if ( gFGExtents ) {
        gDxMap.removeLayer(gFGExtents);
    }

    $("#map-lyr-select").empty();
    gDxMap.invalidateSize();

}

var showCMList = function() {

    var gUrl = '/spatial/getContentModels';

     var jqxhr = $.get(gUrl, function() {
       console.log( "success - content models" );
     })
     .done(function(data) { 

           if (typeof(data) == "object" ) {
              var dres = data;
           } else {
              var dres = JSON.parse(data);
           }

           var dx = dres.rows;
           for (var i in dx) {
             var cname = dx[i].cmm;
             var cnum = dx[i].count;
             if ( i > 0 ) {
                 var cax = $('<div id="'+cname+'" class="nav-cm" />')
                 .css("display", "block")
                 .css("height", "20px")
                 .css("margin-left", "10px")
                 .html('<option value = "' + cname  + ' (' + cnum  + ')" >')
                     .css("font-size", "11px")
                     .css("color", "#222222")
                     .css("height", "14px")
                     .css("font-weight", "bold");
                 $("#cmType").append(cax);
             }
           }         
     });
       
 }

 var showMapServers = function() {

    var gUrl = '/spatial/getMapServers';

    var jqxhr = $.get(gUrl, function() {
       console.log( "success - map servers" );
    })
     .done(function(data) { 

           if (typeof(data) == "object" ) {
              var dres = data;
           } else {
              var dres = JSON.parse(data);
           }
     
           var dx = dres.rows;
           for (var i in dx) {
             
             var msname = dx[i].dmm;
            
             var msc = dx[i].count;
             if ( i > 0 ) {
                 var cax = $('<option value = "' + msname  + ' (' + msc  + ')" >')
                     .css("font-size", "11px")
                     .css("height", "14px")
                     .css("margin", "1px")
                     .css("color", "#222222")
                     .css("font-weight", "bold");
                 $("#dlRepo").append(cax);
             }
           }         
    });
       
 }



