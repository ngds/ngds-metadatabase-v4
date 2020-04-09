/* G. Hudman - Search and MD record view UI tools

*/

// Need to make this template structure data driven by schema ....

var gUItemplate = { "title": "Title", 
                    "abstract" : "", 
                    "resource" : [ ],
                    "resourceUrl" : [  ],
                    "resourceType" : [  ],
                    "resourceName" : [  ],
                    "keywords" : [],
                    "contact" : { "name" :"", "position" : "", "org" : "", "email" : ""},
                    "extent" : {"north" : "0", "south" : "0" , "east" : "0" , "west" : "0"},
                    "guid" : "0000",
                    "datestamp" : "01/01/1999",
                    "format" : "ISO-USGIN",
                    "source" : "USGIN",
                    "version" : "1.2" };

  var gMarkers = [];
  var gSortOrder = 0;
  var gSavedGuids=[];
  
  var gSortTypes = ["Modified Date","Name Ascending","Name Descending","Relevance"];
  var gKey = {"a":"b"};
  var gAuth = { "uid" : "token"};


  function showSeaHis() {

    $("#sHistoryItems").empty();
    $("#shTitle").text("Search History");
    for (k in gSearchHistory) {
      var hs = gSearchHistory[k];
     if ( hs ) {
        var st = '<i class="fa fa-close" id="cl-'+k+'" onclick="selHisDel(this)" style="font-size:9px;"></i><a id="sh-'+k+'" class="sh-item" style="font-size:12px; margin: 2px 2px;" onclick="selectHistoryItem(this);" >'+hs+'</a></br>';
        $("#sHistoryItems").append(st);
     }
    
    }
    $("#SearchHistory").css("display","block");
  }
 
  function selectHistoryItem(o) {
   
    // if its typeahead append, if its search history replace
    if (o.id.substr(0,2) == 'ta') {
      var tbx = o.text;
      var ng =  $("#gSearchBox").val(); //.substr(gTApre.length-1);

      $("#gSearchBox").val(ng.slice(0,-gTApre.length)+tbx);
    } else {
      var tbx = o.text;
      $("#gSearchBox").val(tbx);
    }
    
    findRecords(0);
    $("#SearchHistory").css("display","none");
  }

  function selHisDel(o) {
    var k = o.id.substr(3);
    gSearchHistory.splice(k,1);
    var shs = gSearchHistory.sort().join('|');
    localStorage.setItem("SearchHistory",shs);
    //var shg = 'sh-'+guid;
    //localStorage.removeItem(shg);
    showSeaHis();

  }

  function clearHistory() {

    $("#gSearchBox").val('');
    gSearchHistory=[];
    localStorage.setItem("SearchHistory","");
    $("#sHistoryItems").empty();

  }

  function saveMD(o){
    //var mdguid = "SR-"+o.id.substr(3);
    var sname =  $("#gSearchBox").val();
    if ( !sname ) { sname = 'All' }
    if ( o.text == 'Save' ) {
      localStorage.setItem(o.id,sname);
      o.text = 'Clear';
      o.style.backgroundColor= "#21b229";
    } else {
      localStorage.removeItem(o.id);
      o.text = 'Save';
      o.style.backgroundColor="#0971b2";
    }
    

  }

  function sortPick(o) {
    if ( gSortOrder == 3 ) {
      gSortOrder = 0;
    } else {
      gSortOrder++;
    }
    $("#sortBtn").text(gSortTypes[gSortOrder]);
    // keep the current saved button state with temp toggle
    if ( $("#shoSavBtn").text() == 'All') { $("#shoSavBtn").text('Saved')}
    else { $("#shoSavBtn").text('All')  }
    showSaved(0);
    //findRecords(0);

  }

  function getTA() {
    var tUrl = '/action/typeAhead?q='+gTApre;
    var jqxhr = $.get(tUrl, function() {
      console.log( "typeahead success ..." );
    })
    .done(function(data) { 
      console.log( "typeahead data ..." + JSON.stringify(data) );
      if (typeof(data) == "object" ) {
        var dres = data;
      } else {
        var dres = JSON.parse(data);
      }
       var dx = dres.rows; 
       $("#shTitle").text("Keywords");
       $(".ta-item").each(function() { $(this).remove() })
       gTA = [];
       for (var i in dx) {
          var xtm = dx[i];
          var k = gSearchHistory.length + i;
          gTA.push(xtm.rex);

          var st = '<a id="ta-'+i+'" class="ta-item" style="font-size:12px;" onclick="selectHistoryItem(this);" >'+xtm.rex+'</a></br>';
          $("#sHistoryItems").append(st);
       }
       $("#SearchHistory").css("display","block");
    });

  }

function showSaved(o) {
    var sTerm =  $("#gSearchBox").val();
    var guidA=[];
    var showState = $("#shoSavBtn").text();
    if ( showState == 'Saved' ) {
      $("#shoSavBtn").text('All');
      if ( sTerm ) {
        $.each(localStorage, function(key, value){
            if ( sTerm == value ) {
              guid = key.substr(3);
              guidA.push(guid);
            }
        })

      } else {
        $.each(localStorage, function(key, value){
            if  ( key != "SearchHistory" ) {
              guid = key.substr(3);
              guidA.push(guid); 
            }
        })
      }
      if (guidA) {
        var guidStr = guidA.join(',');
        findRecords(0,guidStr);
      }
    } else {
      $("#shoSavBtn").text('Saved');
      findRecords(0);
    } 
   
 }

  function searchData(yorn) {
    // Setup function
    
  	$("#leftHarvest").hide();
    $("#leftSearch").show();
    $("#cb").show();
    $("#cb-title").html("Search Results");
    

    $("#leftEdit").hide();
    $("#rightEdit").hide();

    $("#leftCollection").hide();
    $("#rightCollection").hide();

    if ( !yorn ) {
      $("#rec-results").empty();
      findRecords(0);
    }
    

  }


  function findRecords(page,g){

      $("#cb").show();
      $("#widget-box").hide();
      if ( !page ) { page = 0 }
      sPage = page;

      var gSp = page*pgSize;
      var sTerms = $("#gSearchBox").val();
      gSearchType = 'text';

      if (  gSearchHistory.indexOf(sTerms.trim()) == -1 ){
        gSearchHistory.push( sTerms.trim() );
        var shs = gSearchHistory.sort().join('|');
        localStorage.setItem("SearchHistory",shs);

      }

      clearMarkers();

      if ( sTerms ) {
        var sUrl = '/action/record_search?qry='+sTerms+'&start='+gSp+'&sortby='+gSortOrder+'&page='+pgSize;  
        facetRefresh(); 
      } else {
        sUrl = '/action/record_search?qry=%&start='+gSp+'&page='+pgSize+'&sortby='+gSortOrder;
      }

      if ( g ) {
        sUrl = sUrl+'&guids='+g;
      }

      $("#rec-results").css("background-color", "#888888").empty(); 
      var target = document.getElementById('rec-results');
      var spinner = new Spinner(opts).spin(target);

      var jqxhr = $.get(sUrl, function() {
        console.log( "findRecords success ..." );
      })
      .done(function(data) { 
            spinner.stop();
            $("#rec-results").css("background-color", "white");

            if (typeof(data) == "object" ) {
              var dres = data;
            } else {
              var dres = JSON.parse(data);
            }
             var dx = dres.rows; 
            var resCount = dx.length;
            var displaying = gSp + pgSize;
            $("#cb-title").html("Search Results for (" + sTerms + ") Records found: "+resCount)
              .css("height", "16px" )
              .css("padding","4px 4px")
              .css("color", "#222222")
              .css("margin", "4px")
              .css("font-size", "14px")
              .css("font-weight", "bold");
            
            for (var i in dx) {
              var xtm = dx[i];

              var gs = xtm.guid;           
              var ct = xRClean(xtm.citation_title);
              if ( xtm.wkt_geometry) {
                var geom = xtm.wkt_geometry.slice(9,xtm.wkt_geometry.length-2); 
                var geoPairs = geom.split(',');
                var sw = geoPairs[0].trim().split(' ');
                var ne = geoPairs[2].trim().split(' ');
                var n = parseFloat(ne[1]);
                var s = parseFloat(sw[1]);
                var e = parseFloat(ne[0]);
                var w = parseFloat(sw[0]);
                var bc = new L.LatLng(s + (n - s)/2 ,e + (w - e)/2);
                var ge= { guid: gs, extent : xtm.wkt_geometry };
                var ptl = '<a id="'+gs+'" style="font-size:12px; cursor: pointer;" onclick="mdView(this);" >'+ct+'</a>';
                
                var m = L.marker(bc)
                  .bindPopup(ptl)
                  .on('click',function() {
                    console.log('id is ' + m._leaflet_id);
                  })
                  .on('mouseout', function(){ 
                      setTimeout(function() { m.closePopup(); }, 3000); 
                  });
                m.setOpacity(.70);
                m._leaflet_id = 'mid-'+gs;
                gMarkers.push(m);
                gExtents.push(ge);

              }
              var linkz =  xtm.links.split('^');
              var TotalFound = xtm.foundrec;

              if ( i == 0 && TotalFound !== 0 ) {
                $("#cb-title").html("Search Results for (" + sTerms + ") Records: " + resCount + " of " 
                      + TotalFound + " found ( " + gSp + '-' + displaying + " )</br>");
                     
                var prv = $('<button class="arrow-button" id="pgPrev" onclick="pager(this)"> &lt; </button>');
                var pcnt = $('<span class="dijitTitlePaneTextNode" style="margin:5px" id="pgCnt">Page ' + sPage + '</span>');
                var pnxt = $('<button class="arrow-button" id="pgNext" onclick="pager(this)"> &gt; </button></br>');
                //var pSrtOrd = $('<button class="arrow-button" id="pgNext" onclick="pager(this)"> &gt; </button></br>');
                $("#cb-page").empty().css("margin-left","40px");
                $("#cb-page").append(prv);
                $("#cb-page").append(pcnt);
                $("#cb-page").append(pnxt);
                $("#cb-page").show();

              }
              
              var savd = localStorage.getItem('sr-'+gs);
              var bt = 'Save';
              var bc =  "#2191c2";

              if ( savd ) {
                 bt = 'Clear';
                 bc =  "#21b229";
              }
              var sBtn =   $('<a id="sr-'+gs+'" class="res-tag" >'+bt+'</a>')
                            .css("font-size", "11px")
                            .css("margin", "2px")
                            .css("padding","2px 2px")
                            .css("background-color", bc)
                            .attr('onclick','saveMD(this);');

              var cInfo = $('<a id="'+gs+'" >'+ct+'</a>')
                          .css("height", "16px" )
                           .css("margin", "2px")
              		        .css("padding","2px 2px")
              		        .css("font-size", "16px")
                          .css("font-weight", "bold")           
                          .css("cursor","pointer")
              		        .attr('onclick','javascript:mdView(this);');
              var ca = xRClean(xtm.abstract).substr(0,240)+' ...';
              var cAb = $('<p />')
                          .css("padding","2px")
                          .css("margin","2px")
                          .css("font-size", "11px")
                          .html(ca);

              var gLinks = $('<div>').css("margin", "10px" )
                      .css("width", "700px");
              if ( linkz ) {
              
                if ( linkz.length == 1 ) {
                  var lnk = linkz[0].split(',');
                  var lnam = lnk[0];
                  var lurl = lnk[lnk.length-1];
                  var lnk = linkColors(lnam, lurl);
                  var rLL = $('<a href="'+ lurl + '" class="resource-item" target="_blank">' + lnam + '</a></br>');
                  if ( lnk.text == 'MapServer' || lnk.text == 'WMS' || lnk.text == 'WFS') {
                    var rLP = $('<a id="'+ gs+'" data-link="'+ lurl + '" onclick="dataMapView(this);" class="res-tag" >' + lnk.text +  '</a>')
                    .css("width",lnk.width)
                    .css("color",lnk.txtcolor)
                    .css("background-color",lnk.bgcolor);

                  } else { 
                    
                    var rLP = $('<a href="'+ lurl + '" onclick="preview(this);" class="res-tag"  target="_blank">' + lnk.text +  '</a>')
                          .css("width",lnk.width)
                          .css("color",lnk.txtcolor)
                          .css("background-color",lnk.bgcolor);
                  
                  }
                 
            
                  gLinks.append(rLP);
                  gLinks.append(rLL);
                } else {
                  for (i in linkz ) {
                    var lnk = linkz[i].split(',');
                    var lnam = lnk[0];
                    var lurl = lnk[lnk.length-1];
                    console.log('links ' + lnam + ' ' + lurl);
                    var lnk = linkColors(lnam, lurl);
                    if ( lnk.text == 'MapServer' || lnk.text == 'WMS' || lnk.text == 'WFS') {
                      var rLP = $('<a  data-link="'+lurl+'" id="'+gs+'" onclick="dataMapView(this);" class="res-tag" >' + lnk.text +  '</a>')
                      .css("width",lnk.width)
                      .css("color",lnk.txtcolor)
                      .css("background-color",lnk.bgcolor);
                    } else { 
                      var rLP = $('<a href="'+ lurl + '" onclick="preview(this);" class="res-tag"  target="_blank">' + lnk.text +  '</a>')
                          .css("width",lnk.width)
                          .css("color",lnk.txtcolor)
                          .css("background-color",lnk.bgcolor);
                    }
                    //var rLL = $('<a href="'+ lurl + '" class="resource-item" target="_blank">' + lnam + '</a></br>');

                    gLinks.append(rLP);

                  }
                }

              }
              var cDate = $('<span>Record Date:'+xRClean(xtm.create_date)+'</span>')
                          .css("padding","5px 2px")
                          .css("margin","5px 5px")
                          .css("font-size", "11px");
            
              var cGuid = $('</br><span>File Identifier: '+gs+'</span>')
                          .css("padding","2px 2px")
                          .css("margin","5px 5px")
                          .css("font-size", "11px");

              var gCard = $('<div id ="gCard-' + xtm.guid + '" class="g-item-card" />')
                   .css("margin", "5px" )
                   .css("padding","2px 2px")
                   //.css("border","solid")
                   .css("background-color", "white" )

                   .hover(function() { 
                      $(this).css("background-color", "powderblue"); 
                      var mic =  'mid-'+$(this).attr("id").substr(6);              
                      jQuery.each(gMarkers, function(i, m){
                        var z = m._leaflet_id;
                        if ( z == mic ) {
                          var redeye = L.icon({
                              iconUrl: 'img/marker-icon-red.png'
                          });
                          m.setOpacity(.99);
                          m.setIcon(redeye);
                        console.log(' marker in '+ i + ' ' + z + ':' + mic);
                        }
                      });                       
                    }, function() { 
                          $(this).css("background-color", "white"); 
                          var mic =  'mid-'+$(this).attr("id").substr(6);
                          jQuery.each(gMarkers, function(i, m){
                            var z = m._leaflet_id;
                            if ( z == mic ) {
                              var norml = L.icon({
                                  iconUrl: 'img/marker-icon.png'
                              });
                             m.setOpacity(.75);
                             m.setIcon(norml);
                            console.log(' marker out'+ i + ' ' + z + ':' + mic);
                            }   
                          });
                    });                    
              $(gCard).append(sBtn);        
              $(gCard).append(cInfo);
              $(gCard).append(cAb);
              //$(gCard).append(cDate);
              //$(gCard).append(cGuid);
              $(gCard).append(gLinks);
              $("#rec-results").append(gCard);           

            }

            if ( gMarkers ) {
              gFeatureGroup = L.featureGroup( gMarkers ).addTo(map);
              map.fitBounds(gFeatureGroup.getBounds());
              gBounds = map.getBounds();
              console.log('bounds AFTER search ' + JSON.stringify(gBounds));
            }
           
        //if ( sTerms ) { facetClear(".nav-category"); }
        showCategories(5);
        showDataTypes(15);
        showAuthors(5);
        showCM(5);

      });

  }

  function facetRefresh() {
    facetClear(".nav-category");
    facetClear(".nav-author");
    facetClear(".nav-cm");
    facetClear(".nav-dt");
    facetClear(".nav-rc");
  }

  function clearMarkers(){

    if ( gFeatureGroup ) {
      map.removeLayer(gFeatureGroup);
    }
     

      //for ( z in gMarkers ){
      //  var mx = gMarkers[z];
      //  map.removeLayer(mx);
      //}
      gMarkers.length = 0;
      gExtents.length = 0;

      //$.each(map._layers, function (ml) {
      //  var mx = map._layers[ml];

        //if (map._layers[ml].feature) {
        //    map.removeLayer(ml);  
        //}
    //});
  }
  function findSpatial() {

    $("#cb").show();
    $("#widget-box").hide();
    if ( !sPage ) { sPage = 0 }
    var sp = sPage*pgSize;
    var displaying = sp+10;
    if ( sp == 0 ) { sp = 1 }

    clearMarkers();

    var sTerms = $("#gSearchBox").val();

    gSearchType='map';
    var bh = map.getBounds();
    //localStorage.SetItem("lastMap",)
    //gBounds = map.getBounds();

    if ( sPage == 0 ) {
      var bounds = map.getBounds();
      gBounds = map.getBounds();
    } else {
      var bounds = gBounds;
    }
    var northEast = bounds.getNorthEast(),
        southWest = bounds.getSouthWest();
    var boundsErr;
    if (  southWest.lng < -180 || southWest.lng > 180 ||  southWest.lat < -90 || southWest.lat > 90 ) {
      boundsErr='Extent Error -  outside valid coordinates - zoom in ';
    }
    
    if (  northEast.lng < -180 || northEast.lng > 180 ||  northEast.lat < -90 || northEast.lat > 90 ) {
      boundsErr='Extent Error -  outside valid coordinates - zoom in ';
    }

    if ( boundsErr) {
      alert(boundsErr);
      return;
    }

    var bndText ='BBOX [W:' + southWest.lng.toFixed(2) + ' S:' + southWest.lat.toFixed(2)  
                  + ' E:' + northEast.lng.toFixed(2)  + ' N:' + northEast.lat.toFixed(2)  + ' ]';
    var zUrl = '/csw?service=CSW&version=3.0.0&request=GetRecords&elementSetName=summary';
    var zterms = '&q='+sTerms;
    var zbox = '&bbox='+ southWest.lng + ',' + southWest.lat + ',' + northEast.lng + ',' + northEast.lat;
    var ztime = '&time=2018/2019';
    var zPage = '&startPosition='+sp;
    var zParams = '&typeNames=csw:Record&resultType=results&outputFormat=application/xml&maxRecords=15&outputSchema=http://www.isotc211.org/2005/gmd';

    if ( sTerms ) {
      bndText = sTerms + ' ' + bndText;
      var sUrl = zUrl+zterms+zbox+zPage+zParams; 
    } else {
      sUrl = zUrl+zbox+zPage+zParams; 
    }
    console.log(sUrl);

    $("#rec-results").css("background-color", "#888888").empty(); 
    var target = document.getElementById('rec-results');
    //var spinner = new Spinner(opts).spin(target);

    var jqxhr = $.get(sUrl, function() {
      console.log( "findRecords success ..." );
    })
    .done(function(data) { 
          //spinner.stop();
          $("#rec-results").css("background-color", "white");
          if (typeof(data) == "object" ) {
            var dres = xmlToJson(data);
          } else {
            var dres = JSON.parse(data);
          }
          if ( dres['ows20:ExceptionReport'] ) {
            var errtext = dres['ows20:ExceptionReport']['ows20:Exception']['ows20:ExceptionText']['#text'];
            $("#rec-results").append('<p>Spatial search error: '+ errtext + '</p></br><p>URL: '+ sUrl + '</p>'); 
           // $("#rec-results").append(dres['ows20:ExceptionReport']); 
            return;
          }
          if ( dres['csw:GetRecordsResponse'] ) {
    
            var recResp =  dres['csw:GetRecordsResponse']['csw:SearchResults'];   
          } else {
            var recResp =  dres['csw30:GetRecordsResponse']['csw30:SearchResults'];   
          }
          //var recResp =  dres['csw:GetRecordsResponse']['csw:SearchResults']; 
          var recMatch =  recResp['@attributes']['numberOfRecordsMatched'];      
          var recRtn =  recResp['@attributes']['numberOfRecordsReturned'];  

          $("#cb-title").html("Search Results for " + bndText + " Records: " + recRtn + " of " 
                  + recMatch + " found ( " + sp + '-' + displaying + " )</br>")
          .css("height", "16px" )
            .css("padding","4px 4px")
            .css("color", "#222222")
            .css("margin", "4px")
            .css("font-size", "14px")
            .css("font-weight", "bold");
        
            var prv = $('<button class="arrow-button" id="pgPrevS" onclick="pager(this)"> &lt; </button>');
            var pcnt = $('<span class="dijitTitlePaneTextNode" style="margin:5px" id="pgCnt">Page ' + sPage + '</span>');
            var pnxt = $('<button class="arrow-button" id="pgNextS" onclick="pager(this)"> &gt; </button></br>');
            $("#cb-page").empty().css("margin-left","40px");
            $("#cb-page").append(prv);
            $("#cb-page").append(pcnt);
            $("#cb-page").append(pnxt);
            $("#cb-page").show();
          
          for (z in recResp['gmd:MD_Metadata'] ){
            var md = recResp['gmd:MD_Metadata'][z];
            
            var gs = md["gmd:fileIdentifier"]["gco:CharacterString"]["#text"];  
            var cet = md["gmd:identificationInfo"]["gmd:MD_DataIdentification"]["gmd:citation"]["gmd:CI_Citation"]["gmd:title"]["gco:CharacterString"]["#text"];
            //var ct = xRClean(cet);
            var abs = md["gmd:identificationInfo"]["gmd:MD_DataIdentification"]["gmd:abstract"]["gco:CharacterString"]["#text"];
            var linkz =  md["gmd:distributionInfo"]["gmd:MD_Distribution"]["gmd:transferOptions"]['gmd:MD_DigitalTransferOptions']['gmd:onLine'];

            var extnt = md["gmd:identificationInfo"]["gmd:MD_DataIdentification"]["gmd:extent"];
            if ( extnt ) {
              var n = extnt["gmd:EX_Extent"]["gmd:geographicElement"]["gmd:EX_GeographicBoundingBox"]["gmd:northBoundLatitude"]["gco:Decimal"]["#text"];
              var s = extnt["gmd:EX_Extent"]["gmd:geographicElement"]["gmd:EX_GeographicBoundingBox"]["gmd:southBoundLatitude"]["gco:Decimal"]["#text"];
              var e = extnt["gmd:EX_Extent"]["gmd:geographicElement"]["gmd:EX_GeographicBoundingBox"]["gmd:eastBoundLongitude"]["gco:Decimal"]["#text"];
              var w = extnt["gmd:EX_Extent"]["gmd:geographicElement"]["gmd:EX_GeographicBoundingBox"]["gmd:westBoundLongitude"]["gco:Decimal"]["#text"];
              n = parseFloat(n);
              s = parseFloat(s);
              e = parseFloat(e);
              w = parseFloat(w);

              //var bx = [[s,w],[n,e]];
              var bc = new L.LatLng(s + (n - s)/2 ,e + (w - e)/2);

              var ptl = '<a id="'+gs+'" style="font-size:12px; cursor: pointer;" onclick="javascript:mdView(this);" >'+cet+'</a>';
              var m = L.marker(bc)
                .bindPopup(ptl)
                .on('click', function(ev) {
                  console.log('id is ' + m._leaflet_id);
                })
                .on('mouseout', function(){ 
                    setTimeout(function() { m.closePopup(); }, 3000); 
                })
              m.setOpacity(.80);
              m._leaflet_id = 'mid-'+gs;
              gMarkers.push(m);

            }
            var sBtn =  $('<a id="sr-'+gs+'" class="res-tag" >Save</a>')
                    .css("font-size", "12px")
                    .css("margin", "2px")
                    .css("padding","2px 2px")
                    .css("background-color", "#0971b2")
                    .attr('onclick','javascript:saveMD(this);');

            var cInfo = $('<a id="'+gs+'" >'+ cet+'</a>')
                        .css("height", "16px" )
                        .css("padding","2px 2px")
                        .css("margin", "2px")
                        .css("font-size", "16px")
                        .css("font-weight", "bold")
                        .css("cursor","pointer")
                        .attr('onclick','javascript:mdView(this);');

            var ca = abs.substr(0,240)+' ...';
            var cAb = $('<p />')
                        .css("padding","2px")
                        .css("margin","2px")
                        .css("font-size", "11px")
                        .html(ca);
            
            var gLinks = $('<div>').css("margin", "10px" )
                        .css("width", "700px");
            if ( linkz ) {             
              if ( linkz['gmd:CI_OnlineResource'] ) { 
                    //var lnk = linkz['gmd:MD_DigitalTransferOptions']['gmd:onLine']['gmd:CI_OnlineResource']['gmd:linkage']['gmd:URL'];
                    var lnam = linkz['gmd:CI_OnlineResource']['gmd:name']['gco:CharacterString']['#text'];
                    var lurl = linkz['gmd:CI_OnlineResource']['gmd:linkage']['gmd:URL']['#text'];
                    var lnk = linkColors(lnam, lurl);
                    var rLL = $('<a href="'+ lurl + '" class="resource-item" target="_blank">' + lnam + '</a></br>');
                    var rLP = $('<a href="'+ lurl + '" onclick="preview(this);" class="res-tag"  target="_blank">' + lnk.text +  '</a>')
                                    .css("width",lnk.width)
                                    .css("color",lnk.txtcolor)
                                    .css("background-color",lnk.bgcolor);
              
                    gLinks.append(rLP);
                    gLinks.append(rLL);

              } else {
                for (i in linkz) {
                  lntm = linkz[i];
                  var lnam = lntm['gmd:CI_OnlineResource']['gmd:name']['gco:CharacterString']['#text'];
                  var lurl = lntm['gmd:CI_OnlineResource']['gmd:linkage']['gmd:URL']['#text'];
                  var lnk = linkColors(lnam, lurl);
                  var rLP = $('<a href="'+ lurl + '" onclick="preview(this);" class="res-tag"  target="_blank">' + lnk.text +  '</a>')
                        .css("width",lnk.width)
                        .css("margin","3px")
                        .css("color",lnk.txtcolor)
                        .css("background-color",lnk.bgcolor);
                  gLinks.append(rLP);
                }
              }
            }       
            var gCard = $('<div id ="gCard-' + gs + '" class="g-item-card" />')
            .css("margin", "5px" )
            .css("padding","2px 2px")
            //.css("border","solid")
            .css("background-color", "white" )
            .hover(function() { 
                    $(this).css("background-color", "powderblue"); 
                    var mic =  'mid-'+$(this).attr("id").substr(6);              
                      jQuery.each(gMarkers, function(i, m){
                        var z = m._leaflet_id;
                        if ( z == mic ) {
                          var redeye = L.icon({
                              iconUrl: 'img/marker-icon-red.png'
                          });
                          m.setOpacity(.99);
                          m.setIcon(redeye);
                        console.log(' marker in '+ i + ' ' + z + ':' + mic);
                        }
                      }); 
                }, function() { 
                    $(this).css("background-color", "white"); 
                    var mic =  'mid-'+$(this).attr("id").substr(6);
                    jQuery.each(gMarkers, function(i, m){
                      var z = m._leaflet_id;
                      if ( z == mic ) {
                        var norml = L.icon({
                            iconUrl: 'img/marker-icon.png'
                        });
                        m.setOpacity(.75);
                        m.setIcon(norml);
                      console.log(' marker out'+ i + ' ' + z + ':' + mic);
                      } 
                    });
                });
            $(gCard).append(sBtn);
            $(gCard).append(cInfo);
            $(gCard).append(cAb);
            //$(gCard).append(cDate);
            //$(gCard).append(cGuid);
            $(gCard).append(gLinks);
            $("#rec-results").append(gCard);             
            //$("#rec-results").append(z+'</br>');
            //var guid = md.children[0];
            //var title = md.children[7].children[0].children[0].children[0].children[0].textContent;
            //var abs = md.children[7].children[0].children[1].textContent;

            //var linkage = md.children[8].children[0].children[0].children[0].children[0].children[0].children[0].textContent;

          }
          if ( gMarkers ) {
            gFeatureGroup = L.featureGroup( gMarkers ).addTo(map);
            gBounds = gFeatureGroup.getBounds();
            map.fitBounds(gBounds);
            console.log('findrecord getbound ' + JSON.stringify(gBounds));
          }


          //$("#rec-results").append(recResp);

    });
  }

  function xmlToJson(xml) {
	
    // Create the return object
    var obj = {};
  
    if (xml.nodeType == 1) { // element
      // do attributes
      if (xml.attributes.length > 0) {
      obj["@attributes"] = {};
        for (var j = 0; j < xml.attributes.length; j++) {
          var attribute = xml.attributes.item(j);
          obj["@attributes"][attribute.nodeName] = attribute.nodeValue;
        }
      }
    } else if (xml.nodeType == 3) { // text
      obj = xml.nodeValue;
    }
  
    // do children
    if (xml.hasChildNodes()) {
      for(var i = 0; i < xml.childNodes.length; i++) {
        var item = xml.childNodes.item(i);
        var nodeName = item.nodeName;
        if (typeof(obj[nodeName]) == "undefined") {
          obj[nodeName] = xmlToJson(item);
        } else {
          if (typeof(obj[nodeName].push) == "undefined") {
            var old = obj[nodeName];
            obj[nodeName] = [];
            obj[nodeName].push(old);
          }
          obj[nodeName].push(xmlToJson(item));
        }
      }
    }
    return obj;
  };

  function pager(o) {
    if ( o.id == 'pgPrev') {
      if ( sPage > 0 ) {
        sPage--;
        findRecords(sPage);
      }
    }
    if ( o.id == 'pgNext') {
      sPage++;
      findRecords(sPage);
    }
    if ( o.id == 'pgPrevS') {
      if ( sPage > 0 ) {
        sPage--;
        findSpatial(sPage);
      }
    }
    if ( o.id == 'pgNextS') {
      sPage++;
      findSpatial(sPage);
    }

  }

  function linkColors(linkName, linkUrl) {
    var lo = {};

    var rt = linkUrl.substr(linkUrl.lastIndexOf('.')+1);
    var rts = linkUrl.substr(linkUrl.lastIndexOf('=')+1);
    var rtz = linkUrl.substr(linkUrl.lastIndexOf('/')+1);
    var laz = linkUrl[linkUrl.length-1];
    var rc = "#f6f6f6";
    var lc = 'black';
    var lw = '60px';

    if ( rt.toUpperCase() == 'XLS' ||  rt.toUpperCase() == 'CSV'  )  {
      rc = 'gold';
      rt = 'CSV';
      lw = '45px';
    } else if (  rt.toUpperCase() == 'XLSX' || rt.toUpperCase() == 'XLSM' ||  rt.toUpperCase() == 'XLSB' ) { 
      rc = 'goldenrod';
      rt = 'EXCEL';
      lw = '45px';
    } else if (  rt.toUpperCase() == 'HTM' || rt.toUpperCase() == 'PHP' ||  rt.toUpperCase() == 'HTML' ) {
      rc = 'seagreen';
      lc = 'lightgray';
      rt = 'html';
      lw = '45px';
    } else if (  rt.toUpperCase() == 'LPK' ||  rt.toUpperCase() == 'TGZ'  ||  rt.toUpperCase() == 'SGY'  ||  rt.toUpperCase() == 'DAT' ) {
      rc = 'lightblue';
      rt = 'data';
      lw = '45px';
    } else if (  rt.toUpperCase() == 'GRD' ||  rt.toUpperCase() == 'GDA'  ) {
      rc = 'tomato';
      rt = 'grid';
      lw = '45px';
    } else if (  rt.toUpperCase() == 'MAT'  ) {
      rc = 'tomato';
      rt = 'matlab';
      lw = '75px';
    } else if (  rt.toUpperCase() == 'SOL'  ) {
      rc = 'tomato';
      rt = 'sol';
      lw = '45px';
    } else if (  rt.toUpperCase() == 'SHP' ||  rt.toUpperCase() == 'MPK' ||  rt.toUpperCase() == 'KMZ' ) {
      rc = 'teal';
      lc = 'aliceblue';
      rt = 'map';
      lw = '45px';
    } else if (  rt.toUpperCase() == 'PDF') {
      rc = 'sienna';
      lc = 'aliceblue';
      rt = 'PDF';
      lw = '45px';
    } else if (  rt.toUpperCase() == 'DOCX') {
      rc = 'slateblue';
      lc = 'skyblue';
      rt = 'word';
      lw = '45px';
    } else if (  rt.toUpperCase() == 'RTF') {
      rc = 'skyblue';
      lc = 'black';
      rt = 'RTF';
      lw = '45px';
    } else if (  rt.toUpperCase() == 'PPTX') {
      rc = 'slateblue';
      lc = 'lightgrey';
      rt = 'powerpoint';
      lw = '75px';
    } else if (  rt.toUpperCase() == 'EPS') {
      rc = 'sienna';
      lc = 'aliceblue';
      rt = 'postscript';
      lw = '75px';
    } else if (  rt.toUpperCase() == 'XML') {
      rc = 'lightgrey';
      lw = '40px';
    } else if (  rt.toUpperCase() == 'ZIP') {
      rc = 'steelblue';
      lc = 'aliceblue';
      rt = 'ZIP';
      lw = '40px';
    } else if (  rt.toUpperCase() == 'TXT' ) {
      rc = 'slategray';
      lc = 'gainsboro';
      rt = 'text'
      lw = '45px';
    } else if (  rt.toUpperCase() == 'TIF' ||  rt.toUpperCase() == 'TIFF' || rt.toUpperCase() == 'PNG'|| rt.toUpperCase() == 'JPG' || rt.toUpperCase() == 'JPEG'   ) {
      rc = 'mediumaquamarine';
      rt = 'image';
      lw = '45px';
    } else {
      rt = 'data';
      var re = /[0-9A-Fa-f]{6}/g;
      if ( laz == '/' || !isNaN(rtz) || re.test(rtz) ) {
        rc = 'teal';
        rt = 'link';
        lw = '45px';
        lc = 'gainsboro';
      }
      re.lastIndex = 0;

      if ( rtz == 'MapServer') {
        rc = 'teal';
        rt = 'MapServer';
        lc = 'gainsboro';
        lw = '75px';

      }
    }

    var wfsTes = linkUrl.indexOf('service=wfs');
    var wmsTes = linkUrl.indexOf('service=wms');
    if (wfsTes > 0 ) {
      rc = 'darkorange';
      rt = 'wfs';
      lw = '45px';
    }

    if (wmsTes > 0 ) {
      rc = 'darkorange';
      rt = 'wms';
      lw = '45px';
    }

    if ( rts.toUpperCase() == 'WMS' || rts.toUpperCase() == 'WFS' ) {
      rc = 'orange';
      rt = rts.toUpperCase();
      lw = '45px';
    } 
    
    lo.text = rt;
    lo.bgcolor = rc;
    lo.txtcolor = lc;
    lo.width = lw;
    return lo;


  }


  function bactoSearch() {

    if ( gSearchType == 'text') {

    }

    if ( gSearchType == 'map') {

    }

    var northEast = gBounds.getNorthEast(),
      southWest = gBounds.getSouthWest();

    gN = parseFloat(northEast.lat); //Number(45);
    gS = parseFloat(southWest.lat); //Number(28);
    gE = parseFloat(northEast.lng); //Number(-80);
    gW = parseFloat(southWest.lng); //Number(-110);

    if ( drawnItems ) {
      map.removeLayer(drawnItems);
    }
    if ( rectangle ) {
      map.removeLayer(rectangle)
    }
    
    //map.removeLayer(drawnItems);

     var center = new L.LatLng(gS + (gN - gS)/2 ,gE + (gW - gE)/2);
    // var rectExtent = L.latLngBounds([gN, gW], [gW, gE]);
     var rectExtent = L.latLngBounds([gS, gW], [gN, gE]);

     console.log('bounds A bacto search ' + JSON.stringify(gBounds));
     map.fitBounds(gBounds);  
     map.panTo(center);

  	$("#cb").show();
  	$("#widget-box").hide();

  }

  function xRClean(ds) {

    while(ds.charAt(0) == '"') { 
      ds = ds.substr(1); 
    }
    var Z = ds.charAt(ds.length-1);
    while(ds.charAt(ds.length-1) == '"') { 
      ds = ds.slice(0,-1); 
    }
    return ds;
  }

  function viewCollections() {

    $("#leftSearch").hide();
    $("#cb").hide();

    $("#leftEdit").hide();
    $("#rightEdit").hide();

    $("#leftCollection").show();
    $("#rightCollection").show();

    //dToggle($("#leftCollection"));
    //dToggle($("#rightCollection"));

    //dToggle($("#leftSearch"));
    //dToggle($("#cb"));

    function dToggle(o) {
      if ( $(o).css("display") == "none") { 
        $(o).css("display","block");
      } else {
        $(o).css("display","none");
      }
    }
  }

  function mdView(obj) {
    // view a single record
  	var guid = obj.id;

    $("#cb").hide();
  	$("#widget-box").show();
    $("#widget-view").empty();

  	var sUrl = '/action/record_show?id='+guid;         

    var jqxhr = $.get(sUrl, function() {
        console.log( "success record view " + guid );
      })
      .done(function(data) { 
        if (typeof(data) == "object" ) {
        	 var dres = data;
        } else {
        	 var dres = JSON.parse(data);
        }
        var muf = JSON.stringify(gUItemplate);
        var ltemp = JSON.parse(muf);

        var dx = dres.rows;
        for (var i in dx) {
             var xtm = dx[i];
             var ndnam = '';
             var ndval = '';
             var mpath = '';
             if ( xtm.hasOwnProperty('node_name')) { ndnam = xRClean(xtm.node_name); }
             if ( xtm.hasOwnProperty('node_value')) { ndval = xRClean(xtm.node_value); }
             if ( xtm.hasOwnProperty('map_path')) { mpath = xRClean(xtm.map_path); }
             
             if ( ndnam == 'title') { ltemp.title = ndval };
             if ( ndnam == 'abstract') {  ltemp.abstract = ndval };
             if ( ndnam == 'guid') { ltemp.guid = ndval };

             if ( ndnam == 'title') { ltemp.title = ndval };
             if ( ndnam == 'keyword') { ltemp.keywords.push(ndval) };

             if ( ndnam == 'Url' ||  ndnam == 'name' ||  ndnam == 'function' ) {
                  //var ri = mpath.split('.')[4];
                  var ri = 0;
                  var ra = mpath.split('.');
                  for ( i in ra ) {
                    if ( !isNaN(ra[i]) ) {ri = ra[i] }
                  }
                  //if ( isNaN(ri) ) { ri = 0 }
                  if ( typeof(ltemp.resource[ri]) === "undefined" ) {
                     ltemp.resource[ri] = { "resourceUrl" : "", "resourceName" : "", "resourceType" : "" }
                  }
                  if ( ndnam == 'Url') { ltemp.resource[ri].resourceUrl = ndval;  }
                  if ( ndnam == 'name') {ltemp.resource[ri].resourceName = ndval;  }
                  if ( ndnam == 'function') {ltemp.resource[ri].resourceType = ndval;  }     
             }
             
             if ( ndnam == 'Url') { ltemp.resourceUrl.push(ndval) }
             if ( ndnam == 'name') { ltemp.resourceName.push(ndval) }
             if ( ndnam == 'function') { ltemp.resourceType.push(ndval) }  
             if ( ndnam == 'westBoundLongitude') { ltemp.extent.west = ndval };
             if ( ndnam == 'eastBoundLongitude') { ltemp.extent.east = ndval };
             if ( ndnam == 'northBoundLatitude') { ltemp.extent.north = ndval };
             if ( ndnam == 'southBoundLatitude') { ltemp.extent.south = ndval };
             if ( ndnam == 'metadataStandardName') { ltemp.format = ndval };
             if ( ndnam == 'metadataStandardVersion') { ltemp.version = ndval };
             if ( ndnam == 'individualName') { ltemp.contact.name = ndval };
             if ( ndnam == 'contact.individualName') { ltemp.contact.name = ndval };

             if ( ndnam == 'positionName') { ltemp.contact.position = ndval };
             if ( ndnam == 'organisationName') { ltemp.contact.org = ndval };
             if ( ndnam == 'electronicMailAddress') { ltemp.contact.email = ndval };
             if ( ndnam == 'date') { ltemp.contact.datestamp = ndval };
            
            gN =  parseFloat(ltemp.extent.north);
            gS =  parseFloat(ltemp.extent.south);
            gE =  parseFloat(ltemp.extent.east);
            gW =  parseFloat(ltemp.extent.west);
          

        }
        recordTemplate(ltemp);
       topper();
       
    });

  }


  function topper() {
    window.scroll({
      top: 0, 
      left: 0, 
      behavior: 'smooth'
    });
  }

  function recordTemplate(ro) {

    var gTitle = $('<div>')
              .css("margin", "4px" )
              .css("font-size", "16px" )
              .css("background-color", "slate" )
              .append('<h2 style="font-size: 14px;" >'+ ro.title + '</h2>');

    var abfix = ro.abstract.replace(/\\n/g, "<br />");

    var gAbstract = $('<div>')
              .css("margin", "2px" )
              .append('<p style="font-size: 12px">'+ abfix + '</p>');

    var gResources =  $('<div>')
              .css("margin", "2px" )
              .css("background-color", "slate" )
                .append('<h2 style="font-size: 12px;">Data & Resources</h2>');
     var xUrl='/csw?service=CSW&version=2.0.2&request=GetRecordById&id='+ro.guid+'&elementsetname=full&outputschema=http://www.isotc211.org/2005/gmd';
     var gViewXML =  $('<div id="mdXML" >')
              .css("margin", "2px" )
              .css("background-color", "slate" )
                //.append('<h2 style="font-size: 14px;">Metadata Source </h2>')
                .append('<a href="'+xUrl+ '" style="font-size: 14px;" target="_blank" class="tag">View XML</a>');

    var gKey =  $('<div  id="mdKeywords" >')
              .css("margin", "2px" )
              .css("background-color", "slate" )
              .append('<h2 style="font-size: 14px;">Keywords</h2>');

    for ( var k in ro.keywords) {
        var kw = ro.keywords[k];
        // BUG - findRecords wants a PAGE 
        var kwL = $('<a  id="'+kw+'" onclick="findKW(this)" class="tag" >' + kw + '</a>')
            .css("margin","5px");  
        gKey.append(kwL);

    }

    for ( var k in ro.resource) {

      var rlink = ro.resource[k].resourceUrl;
      var rtype = ro.resource[k].resourceType;
      var rname = ro.resource[k].resourceName;

      var lo = linkColors(rname, rlink);
      var rLL = $('<a href="'+ rlink + '" class="resource-item" target="_blank">' + rname + '</a>');
      
      //if ( lo.text == 'WMS' || lo.text == 'WFS' || lo.text == 'MapServer') {
      //}
      var rLP = $('<a id="'+rlink+'"  onclick="previewer(this);" class="res-tag" >' + lo.text +  '</a>')
                       .css("width",lo.width)
                       .css("color",lo.txtcolor)
                       .css("background-color",lo.bgcolor);

      var rL = $('<div>').css("margin", "10px" )
                          .css("width", "700px");
        rL.append(rLP);
        rL.append(rLL);
        
        gResources.append(rL);
        urlCheck(rLL);

    }

    var gAuthor = $('<div id="mdAuthor" >')
              .css("margin", "2px" )
              .css("background-color", "slate" )
              .append('<h2  style="font-size:12px;" >Author</h2>');

    gAuthor.append('<label class="md-label">Name:</label><span class="md-value" >'+ ro.contact.name + '</span></br>');
    gAuthor.append('<label class="md-label">Position:</label><span  class="md-value">'+ ro.contact.position + '</span></br>');
    gAuthor.append('<label class="md-label">Organization:</label><span class="md-value" >'+ ro.contact.org + '</span></br>');
    gAuthor.append('<label class="md-label">Email:</label><span class="md-value">'+ ro.contact.email + '</span></br>');
    
    var gExtent = $('<div id="mdExtent" >')
              .css("margin", "2px" )
              .css("background-color", "slate" )
               .append('<h2 style="font-size: 12px;"  >Geographic Extent</h2>');

    
    if ( ro.extent.north == 0 && ro.extent.west == 0 ) {
      gExtent.append('<label class="md-label">Coordinates:</label><span class="md-value"> Not Provided</span></br>');

    } else {
      gExtent.append('<label class="md-label">North Bound:</label><span class="md-value">'+ ro.extent.north +  '</span></br>');
      gExtent.append('<label class="md-label">South Bound:</label><span class="md-value">'+ ro.extent.south + '</span></br>');
      gExtent.append('<label class="md-label">East Bound:</label><span class="md-value">'+ ro.extent.east +  '</span></br>');
      gExtent.append('<label class="md-label">West Bound:</label><span class="md-value">'+ ro.extent.west +  '</span></br>');
    }

    updateExtent();

    var gMd = $('<div id="mdMetaInfo" >')
              .css("margin", "2px" )
              .css("background-color", "slate" )
              .append('<h2 style="font-size: 12px;"  >Metadata</h2>');

    gMd.append('<label class="md-label">Original ID:</label><span class="md-value">'+ ro.guid + '</span></br>');
    gMd.append('<label class="md-label">Index Date:</label><span class="md-value">'+ ro.datestamp + '</span></br>');
    gMd.append('<label class="md-label">Original Format:</label><span class="md-value"> '+ ro.format + '</span></br>');
    gMd.append('<label class="md-label">Source:</label><span class="md-value">'+ ro.source + '</span></br>');
    gMd.append('<label class="md-label">Version:</label><span class="md-value">'+ ro.version + '</span></br>');

    var gDP = $('<div id="mdPreview" >')
        .css("margin", "2px" )
        .css("background-color", "slate" )
        .css("display", "none" )
        .append('<h2 style="font-size: 12px;"  >Data Preview</h2>');

     $("#widget-view").append(gTitle);
     $("#widget-view").append(gAbstract);
     $("#widget-view").append(gResources);
     $("#widget-view").append(gViewXML);
     $("#widget-view").append(gKey);
     $("#widget-view").append(gAuthor);

     $("#widget-view").append(gExtent);
     $("#widget-view").append(gMd);
     $("#widget-view").append(gDP);
  }

  var findKW  = function(o) {
    if ( o.id ) {
      var ms = $("#gSearchBox").val()
      $("#gSearchBox").val( ms + ' ' + o.id);
      findRecords(0);
    }
  }

  var urlCheck = function( urlink) {
  // Readl time asynchronous check
    var urlString =  $(urlink).attr("href");

    var hurl = '/url_status?' + 'url='+urlString ;
    console.log('start url check');
      $.ajax({
          type: 'GET',
          url: hurl,
          dataType: 'json',
          contentType: "application/json",
          success: function(data, status) {
            if ( data ) {
              //console.log('url check - OK');
            
              $(urlink).attr("class","aref-valid");
           
              
            } else {
              //console.log('url check - BAD');
              $(urlink).attr("class","aref-not");
              
            }
        
          }, 
          error: function (jqXHR, status, err) {  
            console.log('url check error');
            //cb('Nope');
          }

      });
  }

  var updateExtent = function () {
    if ( drawnItems ) {
      map.removeLayer(drawnItems);
    }
    if ( rectangle ) {
      map.removeLayer(rectangle)
    }
     //var yl = parseFloat(gS) + (parseFloat(gN) - parseFloat(gS) )/2;
    // var xl = parseFloat(gE) + ( parseFloat(gW) - parseFloat(gE) )/2;
     var yl = gS + (gN - gS )/2;
     var xl = gE + ( gW -gE )/2;
     var center = new L.LatLng(yl, xl);
     //var center = new L.LatLng(gS + (gN - gS)/2 ,gE + (gW - gE)/2);
     map.panTo(center);
    var bounds = [[ gS, gW], [ gN, gE ]];
    //drawnItems = new L.featureGroup(bounds);

    rectangle = L.rectangle(bounds, {color: 'slateblue', weight: 1}).on('click', function (e) {
    // There event is event object
    // there e.type === 'click'
    // there e.lanlng === L.LatLng on map
    // there e.target.getLatLngs() - your rectangle coordinates
    // but e.target !== rect
      console.info(e);
    }).addTo(map);

    map.fitBounds(bounds);

  }

  var showSpinner = function(o)  {
    var target = $("#rec-results");
    var spinner = new Spinner(opts).spin(target);
   
  }

  var facetView = function(o) {
    if (o.id == 'Cat') {
      console.log('cat');
      if (  $("#CatB").attr("class") == "fa fa-angle-right" ) {
        $("#CatB").attr("class","fa fa-angle-down");
      } else { $("#CatB").attr("class","fa fa-angle-right") }
      $(".nav-category").each(function() {
        //console.log('cat' +  $(this).css("display") );
          if ( $(this).css("display") == "none") { 
            $(this).css("display","block");
          } else {
            $(this).css("display","none");
          }
      });
    }

    if (o.id == 'Auth') {
      console.log('auth facet toggle');
      if (  $("#authB").attr("class") == "fa fa-angle-right" ) {
        $("#authB").attr("class","fa fa-angle-down");
      } else { $("#authB").attr("class","fa fa-angle-right") }
      $(".nav-author").each(function() {
        divToggle(this);
      });
    }


    if (o.id == 'ContModel') {
      console.log('cm facet toggle');
      if (  $("#cmB").attr("class") == "fa fa-angle-right" ) {
        $("#cmB").attr("class","fa fa-angle-down");
      } else { $("#cmB").attr("class","fa fa-angle-right") }
      $(".nav-cm").each(function() {
        divToggle(this);
      });
    }

    if (o.id == 'DataType') {
      console.log('dt facet toggle');
      if (  $("#dtB").attr("class") == "fa fa-angle-right" ) {
        $("#dtB").attr("class","fa fa-angle-down");
      } else { $("#dtB").attr("class","fa fa-angle-right") }
      $(".nav-dt").each(function() {
        divToggle(this);
      });
    }

    if (o.id == 'repoCatalog') {
      console.log('dt facet toggle');
      if (  $("#repoB").attr("class") == "fa fa-angle-right" ) {
        $("#repoB").attr("class","fa fa-angle-down");
      } else { $("#repoB").attr("class","fa fa-angle-right") }
      $(".nav-rc").each(function() {
        divToggle(this);
      });
    }

   
    
  }

  function divToggle(o) {
    if ( $(o).css("display") == "none") { 
      $(o).css("display","block");
    } else {
      $(o).css("display","none");
    }
  }

  function facetClear(facet) {
    var f = $(facet);
    $(f).each(function() {
      $( this ).remove();
    })

    if ( $(f).css("display") == "none") { 
      $(f).css("display","block");
    } else {
      $(f).css("display","none");
    }
  }
  var showCategories = function(lim) {

    var sTerms = $("#gSearchBox").val();
    if ( sTerms ) {
      var gUrl = '/action/getCategories?q='+sTerms+'&lid='+lim.toString();
    } else {
      var gUrl = '/action/getCategories?lid='+lim.toString();
    }
    
      var jqxhr = $.get(gUrl, function() {
        console.log( "success - categories" );
      })
      .done(function(data) { 

            if (typeof(data) == "object" ) {
               var dres = data;
            } else {
               var dres = JSON.parse(data);
            }

            $(".nav-category").each(function() {
              console.log('remove ' + $(this).attr('id') );
              $( this ).remove();
            })
            var dx = dres.rows;
            for (var i in dx) {
              var cname = dx[i].node_value;
      
              var cnum = dx[i].count;
              if ( cname.length > 20 ) {
                var cn = cname.substr(0,20) + '..';
              } else {
                cn = cname;
              }
              var cax = $('<div class="nav-category" />')
                  .css("margin-left", "10px")
                  .css("display", "block")
                  .css("height", "20px")
                  .html('<a id="'+cname+'"  style="cursor: pointer;" onclick="selectCategory(this);" >' + cn + '(' + cnum + ')</a></br>')
                      .css("font-size", "12px")
                      .css("color", "#222222")
                      .css("font-weight", "bold");
  
              $("#CatList").append(cax);
            }
            
      });
          
  }

  var selectCategory = function(oCat) {
      if ( $("#gSearchBox").val() ) {
        var ss = $("#gSearchBox").val() + " " + oCat.id;
      } else {
        ss = oCat.id;
      }
      $("#gSearchBox").val(ss);
      $("#cb").show();
      sPage = 0;
     	$("#PageCnt").html("Page " + sPage);
      $("#widget-box").hide();
      if ( gSearchType == 'map' ) {
        findSpatial(0);
      } else {
        findRecords(0);
      }
      topper();

  }
  
  var showAuthors = function(l) {

     var gUrl = '/action/getAuthors';
    
     var sTerms = $("#gSearchBox").val();
     if ( !l ) { l = 5; }
     if ( sTerms ) {
       var gUrl = '/action/getAuthors?q='+sTerms+'&lid='+l;
     } else {
       var gUrl = '/action/getAuthors?lid='+l;
     }

      var jqxhr = $.get(gUrl, function() {
        console.log( "success - categories" );
      })
      .done(function(data) { 

            if (typeof(data) == "object" ) {
               var dres = data;
            } else {
               var dres = JSON.parse(data);
            }

            $(".nav-author").each(function() {
              console.log('remove ' + $(this).attr('id') );
              $( this ).remove();
            })

            var dx = dres.rows;
            for (var i in dx) {
              
              var cname = dx[i].node_value;
              cname = cname.replace(/"/g,"");
              var cn = cname;
              if ( cn.length > 22 ) { var cn = cn.substr(0,22) + '..' }
              var cnum = dx[i].count;
              if ( i > 0 ) {
                  var cax = $('<div id="'+cname+'" class="nav-author" />')
                  .css("display", "block")
                  .css("height", "20px")
                  .css("margin-left", "10px")
                  .html('<a id="'+cname+'" style="cursor: pointer;" onclick="selectAuthor(this);" >' + cn + '(' + cnum + ')</a></br>')
                      .css("font-size", "12px")
                      .css("color", "#222222")
                      .css("font-weight", "bold");
   
                  $("#AuthList").append(cax);
              }
            }
            
      });
          
  }

  var selectAuthor = function(oAuth) {
      if ( $("#gSearchBox").val() ) {
        var ss = $("#gSearchBox").val() + " " + oAuth.id;
      } else {
        ss = oAuth.id;
      }
      $("#gSearchBox").val(ss);
      $("#cb").show();
      sPage = 0;
     	$("#PageCnt").html("Page " + sPage);
      $("#widget-box").hide();
      if ( gSearchType == 'map' ) {
        findSpatial(0);
      } else {
        findRecords(0);
      }
      topper();
  }

  var showCM = function(l) {

    if ( !l ) { l = 5; }
    var gUrl = '/action/getContentModels';
    var sTerms = $("#gSearchBox").val();
    if ( sTerms ) {
      var gUrl = '/action/getContentModels?q='+sTerms+'&lid='+l+'&sortby=2%20desc';
    } else {
      var gUrl = '/action/getContentModels?lid='+l+'&sortby=2%20desc';
    }

     var jqxhr = $.get(gUrl, function() {
       console.log( "success - content models" );
     })
     .done(function(data) { 

           if (typeof(data) == "object" ) {
              var dres = data;
           } else {
              var dres = JSON.parse(data);
           }

           $(".nav-cm").each(function() {
            console.log('remove ' + $(this).attr('id') );
            $( this ).remove();
          })

           var dx = dres.rows;
           for (var i in dx) {
             
             var cname = dx[i].cm;
             cname = cname.replace(/"/g,"");
             var cn = cname; //cname.substring(8);
             if ( cn.length > 22 ) { var cn = cn.substr(0,22) + '..' }
             var cnum = dx[i].countx;
             if ( i > 0 ) {
                 var cax = $('<div id="'+cname+'" class="nav-cm" />')
                 .css("display", "block")
                 .css("height", "20px")
                 .css("margin-left", "10px")
                 .html('<a id="'+cname+'" style="cursor: pointer;" onclick="selectCM(this);" >' + cn + ' (' + cnum + ')</a></br>')
                     .css("font-size", "12px")
                     .css("color", "#222222")
                     .css("font-weight", "bold");
                 $("#CMList").append(cax);
             }
           }         
     });
       
 }

 // needs work to only select from keywords !
 var selectCM = function(oCM) {
  if ( $("#gSearchBox").val() ) {
    var ss = $("#gSearchBox").val() + " " + oCM.id;
  } else {
    ss = oCM.id;
  }
    $("#gSearchBox").val(ss);

    $("#cb").show();
    sPage = 0;
    $("#PageCnt").html("Page " + sPage);
    $("#widget-box").hide();
    if ( gSearchType == 'map' ) {
      findSpatial(0);
    } else {
      findRecords(0);
    }
    topper();
}

var showDataTypes = function(l) {

  if ( !l ) { l = 15; }
  var sTerms = $("#gSearchBox").val();
    if ( sTerms ) {
      var gUrl = '/action/getDataTypes?q='+sTerms+'&lid='+l;
    } else {
      var gUrl = '/action/getDataTypes?lid='+l;
    }

   var jqxhr = $.get(gUrl, function() {
     console.log( "success - data types " );
   })
   .done(function(data) { 

         if (typeof(data) == "object" ) {
            var dres = data;
         } else {
            var dres = JSON.parse(data);
         }

         $(".nav-dt").each(function() {
          console.log('remove ' + $(this).attr('id') );
          $( this ).remove();
        })

        $(".nav-rc").each(function() {
          console.log('remove ' + $(this).attr('id') );
          $( this ).remove();
        })

         var dx = dres.rows;
         for (var i in dx) {
           
           var cname = dx[i].node_value;
           cname = cname.replace(/"/g,"");

           var cnum = dx[i].count;
           if ( i > 0 ) {
               if ( cname.substr(0,8) == 'catalog:') { 
                 var cx = $('<div class="nav-rc" />');
                 var cn = cname.substr(8);
               } else {  
                cn = cname; 
                var cx = $('<div class="nav-dt" />')
              }
              if ( cn.length > 22 ) { var cn = cn.substr(0,22) + '..' }

              var cax = $(cx)
               .css("display", "block")
               .css("height", "20px")
               .css("margin-left", "10px")
               .html('<a id="'+cname+'"  style="cursor: pointer;"  onclick="selectDT(this);" >' + cn + '(' + cnum + ')</a></br>')
                   .css("font-size", "12px")
                   .css("color", "#222222")
                   .css("font-weight", "bold");

            if ( cname.substr(0,8) == 'catalog:') { 
              $("#repoList").append(cax);
            } else {
               $("#dtList").append(cax);
            }
           }
         }         
   });
}

var selectDT = function(oDT) {
  
  var ox = oDT.id;
  if ( oDT.id.includes("catalog:") ) {
    ox = oDT.id.substr(8);
  }
  if ( $("#gSearchBox").val() ) {
    var ss = $("#gSearchBox").val() + " " + ox;
  } else {
    ss = ox;
  }

  $("#gSearchBox").val(ss.trim());

  $("#cb").show();
  sPage = 0;
  $("#PageCnt").html("Page " + sPage);
  $("#widget-box").hide();
  if ( gSearchType == 'map' ) {
    findSpatial(0);
  } else {
    findRecords(0);
  }
  topper();
}

var previewer = function(o) {

  var dtype = $(o).text();

  if ( dtype == 'wfs' || dtype == 'WFS' ||  dtype == 'wns' || dtype == 'WMS' ) {

      divToggle($("#mdXML"));
      divToggle($("#mdKeywords"));
      divToggle($("#mdAuthor"));
      divToggle($("#mdExtent"));
      divToggle($("#mdMetaInfo"));
      divToggle($("#mdPreview"));
      $("#mdPreview")
        .css("height","300px")
        .css("width","800px");

      var dpMap = L.map('mdPreview').setView([41, -100.09], 6);
      L.mapbox.accessToken = 'pk.eyJ1IjoiZ2FyeWh1ZG1hbiIsImEiOiJjaW14dnV2ZzAwM2s5dXJrazlka2Q2djhjIn0.NOrl8g_NpUG0TEa6SD-MhQ';
      var Lurl = 'https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token='+L.mapbox.accessToken;
        L.tileLayer(Lurl, {
           // maxZoom: 18,
            infoControl: false,
            legendControl: false,
            zoomControl: true, 
            trackResize: true,
            id: 'mapbox.streets'
        }).addTo(dpMap);
        
        dpMap.on('ready',function() { 
            setTimeout(function(){ 
                dpMap.invalidateSize();
                //map.fitBounds(initExtent);
            }, 200);
            console.log('ready map')
        });

        var lx = 'http://geothermal.smu.edu:9000/geoserver/gtda/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=gtda:wells&maxFeatures=50&outputFormat=application%2Fjson';

        lx = '/previewMap';
        var jqxhr = $.get(lx, {dataType : "jsonp"}, function() {
          console.log( "success - data layer" );
        }).done( function(data) {
          if (typeof(data) == "object" ) {
            var dres = data;
         } else {
            var dres = JSON.parse(data);
         }
          console.log(data);
         // if ( dres.crs ) {
         //   delete data["crs"];
         // }

          var tf = {   "type": "FeatureCollection",
                      "features": [
                        {   "type": "Feature",
                            "properties": {},
                            "geometry": {
                              "type": "Point",
                              "coordinates": [-96.0829037,29.1506589] }
                        }]    
                  };

          var kcTracts = {
            "type": "FeatureCollection",
            "features": [
              {
                "type": "Feature",
                "properties": {},
                "geometry": {
                  "type": "Polygon",
                  "coordinates": [
                    [
                      [
                        -109.3359375,
                        42.032974332441405
                      ],
                      [
                        -110.390625,
                        38.272688535980976
                      ],
                      [
                        -97.734375,
                        31.05293398570514
                      ],
                      [
                        -87.5390625,
                        38.8225909761771
                      ],
                      [
                        -109.3359375,
                        42.032974332441405
                      ]
                    ]
                  ]
                }
              }
            ]
          };

          var gLayer = new L.GeoJSON();
          gLayer.addData(dres);
          dpMap.addLayer(gLayer);
          
          //var geojsonLayer = new L.GeoJSON();
          //geojsonLayer.addData(data); 
          //dpMap.addLayer(geojsonLayer);

        });


  } 
  console.log('previewer: ' + dtype);


}

function logmein(o) {
  var un = $("#luser").val();
  var pw =  $("#lpass").val();

  var xUrl = '/action/getToken?q='+un+'&p='+pw;

  var jqxhr = $.get(xUrl, function() {
    console.log( "success - data types " );
  })
  .done(function(data) { 

       if (typeof(data) == "object" ) {
          var dres = data;
       } else {
          var dres = JSON.parse(data);
       }
      
        for (var k in dres) {
          var ak = dres[k];

          if ( ak ) {
            gKey = { k : ak };
            $("#laname").text(un);
            $("#loginBtn").text("Logout");
            $("#Cex").css("display","block");

          }
        }

        toggleLogin();   
      });
}


var showLogin = function() {

  if (  $("#loginBtn").text() == "Logout" ) {
       gKey = { "a" : "b" };
       $("#loginBtn").text("Login");
       $("#laname").text("");
       $("#Cex").css("display","none");
  } else {
    $("#Cex").css("display","block");
    //TEMP FOR DEV - use toggle !!
    //toggleLogin();
  } 
}

var toggleLogin = function() {
  if ( $("#loginDiv").css("display") == "none") { 
    $("#loginDiv").css("display","block");
  } else {
    $("#loginDiv").css("display","none");
    
  }

}
