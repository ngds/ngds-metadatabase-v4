/* G. Hudman - Search and MD record view UI tools
   dev on data.geothermaldata.org
*/
  var gTemplate = { "title": { "value": "Title", "path" : "", "nodeid": "" }, 
                    "abstract" : { "value": "", "path" : "", "nodeid": "" }, 
                    "resource" : [],
                    "keywords" : [],
                    "contact" : { "name" : { "value": "", "path" : "", "nodeid": "" }, 
					                        "position" : { "value": "", "path" : "", "nodeid": ""}, 
								                  "org" : { "value": "", "path" : "", "nodeid": "" },
								                  "datestamp" : { "value": "", "path" : "", "nodeid": "" },
								                  "email" : { "value": "", "path" : "", "nodeid": "" } 
								                },
                    "extent" : {"north" : { "value": "", "path" : "", "nodeid": "" }, 
                              "south" : { "value": "", "path" : "", "nodeid": "" }, 
                              "east" : { "value": "", "path" : "", "nodeid": "" }, 
                              "west" : { "value": "", "path" : "", "nodeid": "" } 
                                },
                    "guid" : "0000",
					          "mdversion" : "",
                    "datestamp" : { "value": "01/01/1999", "path" : "", "nodeid": "" },
                    "format" : "ISO-USGIN",
                    "source" : "USGIN",
                    "version" : "1.2" };
					
	var gResource = { "resourceUrl" : { "value": "", "path" : "", "nodeid": "" }, 
	                  "resourceName" : { "value": "", "path" : "", "nodeid": "" }, 
                    "resourceType" : { "value": "", "path" : "", "nodeid": "" },
                    "resourceDesc" : { "value": "", "path" : "", "nodeid": "" } };
					
  var gMD, 
      gMP,
      gT,
      gVr,
	    gMDEdStack={ "guid" : "", "eda" : [] },
      gCWR={},
	    gCMP={};

  var gMarkers = [];
  var gSortOrder = 0;
  var gSavedGuids=[];
  var gDt = [{val : 'CSV', text: 'CSV'},
			{val : 'DOC', text: 'DOC'},
			{val : 'GIF', text: 'GIF'},
			{val : 'HTM', text: 'HTM'},
			{val : 'JPG', text: 'JPG'},
			{val : 'MAPSERVER', text: 'MAPSERVER'},
			{val : 'MAT', text: 'MAT'},
			{val : 'PDF', text: 'PDF'},
			{val : 'PPT', text: 'PPT'},
			{val : 'RTF', text: 'RTF'},
			{val : 'SHP', text: 'SHP'},
			{val : 'TIF', text: 'TIF'},
      {val : 'WFS', text: 'WFS'},
      {val : 'WMS', text: 'WMS'},
			{val : 'XLS', text: 'XLS'},
			{val : 'ZIP', text: 'ZIP'}];
			
  var  gPos = [{val: 'resourceProvider',text: 'resourceProvider'},
				 {val: 'custodian',text: 'custodian'},
				 {val: 'owner',text: 'owner'},
				 {val: 'user',text: 'user'},
				 {val: 'distributor',text: 'distributor'},
				 {val: 'originator',text: 'originator'},
				 {val: 'pointOfContact',text: 'pointOfContact'},
				 {val: 'principalInvestigator',text: 'principalInvestigator'},
				 {val: 'processor',text: 'processor'},
				 {val: 'publisher',text: 'publisher'},
				 {val: 'author',text: 'author'} ];
				 
  var gSortTypes = ["Modified Date","Name Ascending","Name Descending","Relevance"];
  var gKey = {"a":"b"};
  var gAuth = { "loginBtn" : "userLogin" };
  var gMenuSel = 's';
  var gVersions = [];
  var gEdState = 'off';
  var gkwid=-1;
  var gHttpValid = ["200", "201", "202", "300", "301", "302", "303", "304", "305" ];

  
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
 
  function kmu(o) {
	   for (var k in o) {
        if (o[k] == k) {
          return k;
        }
	   }
	   return null;
	}

  function userMenu() {
	
	if ( kmu(gKey) && gKey.agentRole == "1"  ) {
		$("#Cex").show();
		if ( gMenuSel == 's' ) {
			$("#Cex").show();
			$("#leftMDRecord").hide();
		} else if ( gMenuSel == 'r' ) {
			$("#widget-view").empty();
			$("#leftMDRecord").show();
			recordTemplate(gT, gKey);
		} else if ( gMenuSel == 'm' ) {
			console.log('logged in whlie viewing map');
			$("#leftMDRecord").hide();
			
		}
		
	} else if ( kmu(gKey) && gKey.agentRole == "4"  ) {
		if ( gMenuSel == 's' ) {
			$("#Cex").hide();
			$("#leftMDRecord").hide();
		} else if ( gMenuSel == 'r' ) {
			$("#widget-view").empty();
			$("#leftMDRecord").show();
			recordTemplate(gT, gKey);
		} else if ( gMenuSel == 'm' ) {
			$("#leftMDRecord").hide();
			console.log('logged in while viewing map');
			
		}
	} else {
		// logging out
		if ( gMenuSel == 's' ) {
			$("#Cex").hide();
			$("#leftMDRecord").hide();
		} else if ( gMenuSel == 'r' ) {
			 $("#widget-view").empty();
			 $("#leftMDRecord").show();
			recordTemplate(gT, gKey);
		} else if ( gMenuSel == 'm' ) {
			$("#leftMDRecord").hide();
			console.log('logged in whie viewing map');	
		}
	}
	
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
    showSeaHis();
  }

  function clearHistory() {
    $("#gSearchBox").val('');
    gSearchHistory=[];
    localStorage.setItem("SearchHistory","");
    $("#sHistoryItems").empty();

  }

  function saveMD(o){
    //show the bookmarks 
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

  }

  function getTA() {
    var tUrl = '/action/typeAhead?q='+gTApre;
    var jqxhr = $.get(tUrl, function() {
      console.log( "typeahead success ..." );
    })
    .done(function(data) { 
    
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
    var keez = Object.keys(localStorage);
    if ( showState == 'Saved' ) {
      $("#shoSavBtn").text('All');
      if ( sTerm ) {
        // this doesnt really work, search terms wont show up in saved record values!
        // just bring then all back
        for (k in keez) {
          var key = keez[k];
          if (key != "SearchHistory" && key != "gDataMapBounds") {
              guid = key.substr(3);
              guidA.push(guid);  
          }
        }      
        
      } else {
        for (k in keez) {
            var key = keez[k];
            if (key != "SearchHistory" && key != "gDataMapBounds") {
                guid = key.substr(3);
                guidA.push(guid);  
            }
        }
      
      }
      if (guidA) {
        var guidStr = guidA.join(',');
        findRecords(0,guidStr);
      } else {
        alert ('No locally bookmarked records found !');
      }
    } else {
      $("#shoSavBtn").text('Saved');
      findRecords(0);
    } 
   
 }

function searchData(yorn) {
    // Setup function
    
	  gMenuSel = 's';
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
	    $("#leftMDRecord").hide();
      if ( !page ) { page = 0 }
      sPage = page;

      var gSp = page*pgSize;
      //var sTerms = $("#gSearchBox").val();
      // search term bug fix 5/5/22 -GH
      var sTerm = $("#gSearchBox").val();
      var sTerms = sTerm.replace(/&/g," ").trim();
	  
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
        var ssu = 'success findrecords'; 
      })
      .done(function(data) { 
            spinner.stop();
            $("#rec-results").css("background-color", "white");

            if (typeof(data) == "object" ) {
              var dres = data;
            } else {
              var dres = JSON.parse(data);
            }

            $("#gSearchBox").val(sTerms);
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
              
              if ( xtm.links ) {
                var linkz =  xtm.links.split('^');
              }
              
              var TotalFound = xtm.foundrec;

              if ( i == 0 && TotalFound !== 0 ) {
                $("#cb-title").html("Search Results for (" + sTerms + ") Records: " + resCount + " of " 
                      + TotalFound + " found ( " + gSp + '-' + displaying + " )</br>");
                     
                var prv = $('<button class="arrow-button" id="pgPrev" onclick="pager(this)"> &lt; </button>');
                var pcnt = $('<span class="dijitTitlePaneTextNode" style="margin:5px" id="pgCnt">Page ' + sPage + '</span>');
                var pnxt = $('<button class="arrow-button" id="pgNext" onclick="pager(this)"> &gt; </button></br>');
              
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
                  var rlab = $('<span>Link: </span>')
                        .css("padding","2px")
                        .css("margin","2px")
                        .css("font-size", "12px");
                  var rLL = $('<a href="'+ lurl + '" class="resource-item" target="_blank">' + lnam + '</a></br>');

                  gLinks.append(rlab);
                  gLinks.append(rLL);
                } else {
                  var rlab = $('<span>Links: </span>')
                              .css("padding","2px")
                              .css("margin","2px")
                              .css("font-size", "12px");
                  var drl = $('<select id="rld-'+gs+'">')
                              .attr("onchange","window.open(this.options[this.selectedIndex].value);")
                              .attr("onfocus","this.selectedIndex= -1;")
                              .css("width","440px");
                             
                  for (i in linkz ) {
                    var lnk = linkz[i].split(',');
                    var lnam = lnk[0];
                    var lurl = lnk[lnk.length-1];
                   
                    console.log('links ' + lnam + ' ' + lurl);
                    var lnk = linkColors(lnam, lurl);
                    var rldo = $('<option title="'+lurl+'" value="'+lurl+'">'+lnam+ ' '+ lnk.text + '</option>');
                    drl.append(rldo);
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

                    gLinks.append(rlab);
                    gLinks.append(drl);


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
                           
                            }   
                          });
                    });                    
              $(gCard).append(sBtn);        
              $(gCard).append(cInfo);
              $(gCard).append(cAb);
              $(gCard).append(gLinks);
              $("#rec-results").append(gCard);           

            }

            if ( gMarkers ) {
              console.log(' guid ' + gs + ' bounds at 571 ' + JSON.stringify(gBounds));
              gFeatureGroup = L.featureGroup( gMarkers ).addTo(map);
              map.fitBounds(gFeatureGroup.getBounds());
              gBounds = map.getBounds();
             
            }
           
     
        showCategories(5);
        showDataTypes(15);
        showAuthors(5);
        showCM(5);
        $("#gSearchBox").val(sTerms);

      });

  }

  function preview(o) {
    
    window.open(o.value);
  }

  function facetRefresh() {
    facetClear(".nav-category");
    facetClear(".nav-author");
    facetClear(".nav-cm");
    facetClear(".nav-dt");
    facetClear(".nav-rc");
  }

  function clearMarkers() {

    if ( gFeatureGroup ) {
      map.removeLayer(gFeatureGroup);
    } 
    gMarkers.length = 0;
    gExtents.length = 0;
	
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
          
            return;
          }
          if ( dres['csw:GetRecordsResponse'] ) {
    
            var recResp =  dres['csw:GetRecordsResponse']['csw:SearchResults'];   
          } else {
            var recResp =  dres['csw30:GetRecordsResponse']['csw30:SearchResults'];   
          }
       
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

                    var lnam = linkz['gmd:CI_OnlineResource']['gmd:name']['gco:CharacterString']['#text'];
                    var lurl = linkz['gmd:CI_OnlineResource']['gmd:linkage']['gmd:URL']['#text'];
                    var lnk = linkColors(lnam, lurl);
                    var rlab = $('<span>Link: </span>')
                        .css("padding","2px")
                        .css("margin","2px")
                        .css("font-size", "12px");
                    var rLL = $('<a href="'+ lurl + '" class="resource-item" target="_blank">' + lnam + ' ' + lnk.text + '</a></br>');          
                    gLinks.append(rlab);
                    gLinks.append(rLL);

              } else {
                var rlab = $('<span>Links: </span>')
                            .css("padding","2px")
                            .css("margin","2px")
                            .css("font-size", "12px");
                var drl = $('<select id="rld-'+gs+'">')
                            .attr("onchange","window.open(this.options[this.selectedIndex].value);")
                            .css("width","440px");

                for (i in linkz) {
                  lntm = linkz[i];
                  var lnam = lntm['gmd:CI_OnlineResource']['gmd:name']['gco:CharacterString']['#text'];
                  var lurl = lntm['gmd:CI_OnlineResource']['gmd:linkage']['gmd:URL']['#text'];
                  var lnk = linkColors(lnam, lurl);
                  var rldo = $('<option title="'+lurl+'" value="'+lurl+'">'+lnam+ ' '+ lnk.text + '</option>');
                  drl.append(rldo);

                }
                gLinks.append(rlab);
                gLinks.append(drl);
              }
            }       
            var gCard = $('<div id ="gCard-' + gs + '" class="g-item-card" />')
            .css("margin", "5px" )
            .css("padding","2px 2px")
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
            $(gCard).append(gLinks);
            $("#rec-results").append(gCard);             


          }
          if ( gMarkers ) {
            gFeatureGroup = L.featureGroup( gMarkers ).addTo(map);
            gBounds = gFeatureGroup.getBounds();
            map.fitBounds(gBounds);
            console.log('findrecord getbound ' + JSON.stringify(gBounds));
          }

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

    if ( typeof(linkUrl) == "undefined" ) {
		lo.text = rt;
		lo.bgcolor = 'black';
		lo.txtcolor = 'lightgray';
		lo.width = '60px';
		return lo;
	}
	
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
    gMenuSel = 's'; 
	
    $("#CatList").show();
    $("#CMList").show();
    $("#AuthList").show();
    $("#dtList").show();
    $("#repoList").show();
    $("#leftMDRecord").hide();
      
    if ( gMdRecord ) {
      findRecords(0);
    }
	
    if ( typeof(gSearchType) == "undefined" || gSearchType == 'text') {
		
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
    

     var center = new L.LatLng(gS + (gN - gS)/2 ,gE + (gW - gE)/2);
     var rectExtent = L.latLngBounds([gS, gW], [gN, gE]);
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
	  gMenuSel = 'r'; 
  	var guid = obj.id;
    var vers = obj.version;
	
    $("#cb").hide();
    $("#CatList").hide();
    $("#CMList").hide();
    $("#AuthList").hide();
    $("#dtList").hide();
    $("#repoList").hide();
    $("#leftCollection").hide();
  	$("#widget-box").show();
	  $("#leftMDRecord").show();
    $("#widget-view").empty();

  	var sUrl = '/action/record_show?id='+guid;   
    if ( vers ) {
      sUrl = sUrl+'&version='+vers;
    }	
    gMDEdStack.guid = guid;
    gMDEdStack.eda.length=0;
	
    var jqxhr = $.get(sUrl, function() {
        console.log( "success record view " + guid );
      })
      .done(function(data) { 
        if (typeof(data) == "object" ) {
        	 var dres = data;
        } else {
        	 var dres = JSON.parse(data);
        }	
		    // clone template
		    var mg = JSON.stringify(gTemplate);
		    var lbf = JSON.parse(mg);
        var dx = dres.rows;
        for (var i in dx) {
          var xtm = dx[i];
          var ndnam = '';
          var ndval = '';
          var mpath = '';
          var nodeid =0;
          if ( xtm.hasOwnProperty('node_name')) { ndnam = xRClean(xtm.node_name); }
          if ( xtm.hasOwnProperty('node_value')) { ndval = xRClean(xtm.node_value); }
          if ( xtm.hasOwnProperty('map_path')) { mpath = xRClean(xtm.map_path); }
          if ( xtm.hasOwnProperty('node_id')) { nodeid = xRClean(xtm.node_id); }
      
          if ( ndnam == 'title') { 
            lbf.title.value= ndval;
            lbf.title.path = mpath;
            lbf.title.nodeid = nodeid;
          };
			
          if ( ndnam == 'mdversion') { 
            lbf.mdversion = ndval;
            gMDEdStack.version = ndval;
          }
			 
          if ( ndnam == 'abstract') {  
            lbf.abstract.value = ndval;
            lbf.abstract.path = mpath;
            lbf.abstract.nodeid = nodeid;
          }

          if ( ndnam == 'guid') { 
            lbf.guid = ndval;
          };

          if ( ndnam == 'keyword') { 
			      var kw = { "value": ndval, "path": mpath, "nodeid": nodeid };
				    lbf.keywords.push(kw);
			    };

          if ( ndnam == 'Url' ||  ndnam == 'name' ||  ndnam == 'function' || ndnam == 'linkdesc' ) {       
            var ri = 0;
            var ra = mpath.split('.');
            for ( i in ra ) {
              if ( !isNaN(ra[i]) ) {ri = ra[i] }
            }
                 
            if ( typeof(lbf.resource[ri]) === "undefined" ) {
              var mr = JSON.stringify(gResource);
              lbf.resource[ri] = JSON.parse(mr); 
            }
				
            if ( ndnam == 'Url') { 
              lbf.resource[ri].resourceUrl.value = ndval;
              lbf.resource[ri].resourceUrl.path = mpath;
              lbf.resource[ri].resourceUrl.nodeid = nodeid;
            }
            if ( ndnam == 'name') { 
              lbf.resource[ri].resourceName.value = ndval;
              lbf.resource[ri].resourceName.path = mpath;
              lbf.resource[ri].resourceName.nodeid = nodeid;
            }
            if ( ndnam == 'function') {			  
              lbf.resource[ri].resourceType.value = ndval;
              lbf.resource[ri].resourceType.path = mpath;
              lbf.resource[ri].resourceType.nodeid = nodeid; 
            }  
            if ( ndnam == 'linkdesc') { 
              ndval = ndval.replace(/\\/g, '');
              lbf.resource[ri].resourceDesc.value = ndval;
              lbf.resource[ri].resourceDesc.path = mpath;
              lbf.resource[ri].resourceDesc.nodeid = nodeid;
            }   
          }
             
          if ( ndnam == 'westBoundLongitude') {        
            lbf.extent.west.value = ndval;
            lbf.extent.west.path = mpath;
            lbf.extent.west.nodeid = nodeid;
          };
          if ( ndnam == 'eastBoundLongitude') { 		
            lbf.extent.east.value = ndval;
            lbf.extent.east.path = mpath;
            lbf.extent.east.nodeid = nodeid;
          };
          if ( ndnam == 'northBoundLatitude') { 		
            lbf.extent.north.value = ndval;
            lbf.extent.north.path = mpath;
            lbf.extent.north.nodeid = nodeid;
          };
          if ( ndnam == 'southBoundLatitude') { 	
            lbf.extent.south.value = ndval;
            lbf.extent.south.path = mpath;
            lbf.extent.south.nodeid = nodeid;
          };
          if ( ndnam == 'metadataStandardName') { 
            lbf.format = ndval;
          };
          if ( ndnam == 'metadataStandardVersion') { 
            lbf.version = ndval;
          };
          if ( ndnam == 'date') { 
            lbf.contact.datestamp.value = ndval;
            lbf.contact.datestamp.path = mpath;
            lbf.contact.datestamp.nodeid = nodeid;
          };
          if ( ndnam == 'citation_date') { 
            lbf.datestamp.value = ndval;
            lbf.datestamp.path = mpath;
            lbf.datestamp.nodeid = nodeid;
          };		 
          if ( ndnam == 'individualName') { 
            lbf.contact.name.value = ndval;
            lbf.contact.name.path = mpath;
            lbf.contact.name.nodeid = nodeid;
          };			
          if ( ndnam == 'contact.individualName') { 			
            lbf.contact.name.value = ndval;
            lbf.contact.name.path = mpath;
            lbf.contact.name.nodeid = nodeid;         
          };
          if ( ndnam == 'positionName') { 
            lbf.contact.position.value = ndval;
            lbf.contact.position.path = mpath;
            lbf.contact.position.nodeid = nodeid; 
          };			
          if ( ndnam == 'organisationName') { 
            lbf.contact.org.value = ndval;
            lbf.contact.org.path = mpath;
            lbf.contact.org.nodeid = nodeid;
          };         
          if ( ndnam == 'electronicMailAddress') { 
							lbf.contact.email.value = ndval;
              lbf.contact.email.path = mpath;
              lbf.contact.email.nodeid = nodeid;             
          };            
          gN =  parseFloat(lbf.extent.north.value);
          gS =  parseFloat(lbf.extent.south.value);
          gE =  parseFloat(lbf.extent.east.value);
          gW =  parseFloat(lbf.extent.west.value);        
        }

      gT = lbf;
      gMDEdStack.eda.length=0;
      recordTemplate(lbf, gKey);
      mdVersions(guid, vers);
      topper();
       
    });
  }

  function mdVersions(guid, vers) {
	  
	 if ( !vers ) {
		 vers = 0;
		 var sUrl = '/action/getRecordVersions?guid='+guid;         
		 $("#leftMDRecord").css({top: 520, left: 5, position:'absolute'});
		 $("#lr-widget").empty();
		 gVersions.length=0;
		  
		var jqxhr = $.get(sUrl, function() {
     
        var z = guid;
		  })
		  .done(function(data) { 
			 if (typeof(data) == "object" ) {
				 var dres = data;
			} else {
				 var dres = JSON.parse(data);
			}
	   
			for (var i in dres.versions) {
				var vo = { "mdv": dres.versions[i].mdv_id, "version_id": dres.versions[i].version_id };
				gVersions.push(vo);
				var d = new Date(dres.versions[i].create_date);
				var dm = d.getMonth()+1;
				var ds = dm+'-'+d.getDate()+'-'+d.getFullYear()+' '+d.getHours()+':'+d.getMinutes();
				var vid = $('<div id="vrlink-'+i+'" style="width: 200px; font-size: 12px; font-weight: normal; font-family:Helvetica Neue,Helvetica,Arial,sans-serif;" >' 
					+ dres.versions[i].version_id  + ' ' 
					+ dres.versions[i].status + ' ' 
					+ ds +'</div>');
						   
				var vv = $('<i id="verv-'+i+'" class="fas fa-eye" onclick="versionView(this)"></i>')
					   .css("color","#196fa6")
					   .css("font-size","12px")
					   .css("margin-left","10px");
				vid.append(vv);	 
				
				if ( i == vers ) {
					vid.css("background-color","#63d2eb")
					   .css("font-weight","bold");
					$(vv).hide();
				}
				
				var vdx = $('<i id="vdel-'+i+'" class="fas fa-trash-alt" onclick="versionDel(this)"></i>')
							.css("color","#196fa6")
							.css("font-size","12px")
							.css("margin-left","5px")
							.css("display","none");
				vid.append(vdx);
				$("#lr-widget").append(vid);
			}
		  });
	 } else {
		for ( k in gVersions ) {
			if ( gVersions[k].version_id == vers ) {
				$("#vrlink-"+k)
					.css("background-color","#63d2eb")
					.css("font-weight","bold");
				$("#verv-"+k).hide();
			} else {
				$("#vrlink-"+k)
					.css("background-color","white")
					.css("font-weight","normal");
				$("#verv-"+k).show();	
			}
		 }
	 }	  
  }
  
  function versionView(o) {
		var k = o.id.split('-')[1];
		var vers = gVersions[k].version_id;
		var o = { "id": gT.guid, "version": vers };
		$("#widget-view").empty();
		mdView(o);
		
  }
  
  function versionDel(o) {
		var k = o.id.split('-')[1];
		var vers = gVersions[k].version_id;
		var o = { "id": gT.guid, "version": vers };
		var sUrl = '/action/deleteMdVersion?guid='+gT.guid+'&version='+vers; 
		console.log( "delete view " + sUrl );
		var jqxhr = $.get(sUrl, function() {
			console.log( "success delete view " + gT.guid );
		  })
		  .done(function(data) { 
        for ( k in gVersions ) {
          if ( gVersions[k].version_id == vers ) {
            $("#vrlink-"+k)
              .css("background-color","#ed7f66")
              .css("font-weight","lighter");
            $("#verv-"+k).hide();
            $("#vdel-"+k).hide();
          }
        }
        console.log('delete ' + JSON.stringify(data) );
		  });
			
  }

  function topper() {
    window.scroll({
      top: 0, 
      left: 0, 
      behavior: 'smooth'
    });
  }

  function mdValidate(o) {
    var guid = gT.guid;
    var ver = gT.mdversion;

    var sUrl = '/action/validateMDRecord?guid='+guid;   
   
    gVr = {};

    var jqxhr = $.get(sUrl, function() {
        console.log( "success record view " + guid );
		  })
		  .done(function(data) { 
			 if (typeof(data) == "object" ) {
				 var dres = data;
        } else {
          var dres = JSON.parse(data);
        }
        gVr.rows = dres.rows;
        console.log('here');

        gVr.fda = [];  // index of elements
        gVr.res = [];  // summary table
        // res - needs - fd, fc, rs_id, state

        for (k in gVr.rows ) {
          var fd = gVr.rows[k].fd;
          var rs = gVr.rows[k].rsid;
          var rname = gVr.rows[k].ruleset_name;

          var mp =  gVr.rows[k].mpath;
          var nv = gVr.rows[k].node_value;
          if ( gVr.fda.includes(fd) ) {
               var iv = gVr.fda.indexOf(fd);
               if ( iv > -1 ) {
                 gVr.res[iv].count = gVr.res[iv].count+1;
                 if ( mp && gVr.res[iv].vstate !== 'found' ) {
                    gVr.res[iv].vstate = 'found';
                 }
               }
          } else {
            gVr.fda.push(fd);
            var vox = {};
            vox.fd = fd;
            vox.rs = rs;
            vox.rn = rname;
            if ( !mp ) {
              vox.count = 0;
              vox.vstate = 'missing';
            } else {
              vox.count = 1;
              vox.vstate = 'found';
            }
            gVr.res.push(vox);

          }

        }

        valResDisplay();
        
      });

      
  } 
  
  function vrClose(o){
    $("#valResults").empty();
    $("#valResults").remove();
    $("#mdValBtn").css("background","#0971B2");
  }

  function valResDisplay() {
   
    var c = $("#widget-box");
    var vtop = $("#mdValBtn").position().top +'px';
    var vl = $("#mdValBtn").position().left + 70 + 'px';
    $("#mdValBtn").css("background","#888888");
    if ( $('#valResults').length )  {
      return;
    }
    var vb = $('<div id="valResults">')
              .css("position","absolute")
              .css("display","block")
              .css("margin", "7px 7px 7px 7px;")
              .css("padding","5px 5px")
              .css("top",vtop)
              .css("left",vl)
              .css("opacity","1")
              .css("background-color","#ffffff")
              .css("border","2px solid #2191c2")
              .css("width","350px");

    var cBtn =  $('<a id="vrClose" class="res-tag" >Close</a>')
              .css("font-size", "12px")
              .css("margin", "1px 1px 1px 7px;")
              .css("padding","5px 5px")
              .css("display","inline:block")
              .css("width","100px")
              .css("background-color", "#2191c2")
              .attr('onclick','vrClose(this);');

    vh = $('<span >Metadata Validation</span>')
              .css("font-size", "14px")
              .css("font-weight", "bold")
              .css("font-family","Arial");
    vb.append(vh);         
    vb.append(cBtn);
    var vrtab = $('<table>');
    for (k in gVr.res ) {
      var vtr = $('<tr>');      
      var vel = $('<td>'+gVr.res[k].fd+'</td>').css("font-size", "12px");
      if ( gVr.res[k].rs == 12 && gVr.res[k].vstate == 'missing' ) {
        vtr.css('background-color', '#cc7777');
      }
      if ( gVr.res[k].rs == 13 && gVr.res[k].vstate == 'missing' ) {
        vtr.css('background-color', '#bb9977');
      }
      var vrl = $('<td>'+gVr.res[k].rn+'</td>').css("font-size", "12px");
      var vct  = $('<td>'+gVr.res[k].count+'</td>').css("font-size", "12px");
      var vst = $('<td>'+gVr.res[k].vstate+'</td>').css("font-size", "12px");
      vtr.append(vel);
      vtr.append(vrl);
      vtr.append(vct);
      vtr.append(vst);
      vrtab.append(vtr);

    }

    vb.append(vrtab);
    c.append(vb);

  }

  function edState() {

    if ( kmu(gKey) ) {
      if ( gEdState == 'ready') {
        // active edit 
        if ( gMDEdStack.eda.length ) {
          console.log('tracking edits');
        } else {
          gMDEdStack.eda.length = 0;
        }
        $("#titleE").show();
        $("#absE").show();
        $("#authE").show();
        $("#extentE").show();
        $("#resxE").show();
        $("#keyxE").show();
        for (k in gT.resource) {
          $("#resEdit-"+k).show();
          $("#resdel-"+k).show();
        }
        for (k in gVersions) {
          $("#vdel-"+k).show();
        }
		
        $("#mdEditBtn").text("Save");
        $("#mdValBtn").show(); 
        $("#mdCancelBtn").show();    
        gEdState = 'on';

    } else if ( gEdState == 'on') {
        // submit changes
		  saveEdits();
      $("#mdEditBtn").text("Edit");
      $("#mdValBtn").hide();
      $("#mdCancelBtn").hide();
      $("#titleE").hide();
      $("#absE").hide();
      $("#authE").hide();
      $("#keyxE").hide();	
      $("#keyxM").hide();	
      $("#extentE").hide();
      $("#resxE").hide();
      for (k in gT.resource) {
        $("#resEdit-"+k).hide();
        $("#resdel-"+k).hide();
      }
      for (k in gVersions) {
        $("#vdel-"+k).hide();
      }
      $(".fas fa-plus").hide();
      $(".fas fa-trash-alt").hide();
        gEdState = 'ready';
    }

    } else if ( gEdState == 'off' ) {
      $("#mdEditBtn").hide();
      $("#mdValBtn").hide();
      $("#mdCancelBtn").hide();
      $(".fas fa-edit").hide();
      $(".fas fa-plus").hide();	
      $(".fas fa-trash-alt").hide();
      for (k in gVersions) {
        $("#vdel-"+k).hide();
      }
		  gMDEdStack.eda.length = 0;
	  }

  }
  
  function edCancel(o) {
	  
	gMd = {};
	gMd = gCWR;
	gMP = {};
	
	gMDEdStack.eda.length = 0;
	$("#mdCancelBtn").hide();
	$("#widget-view").empty();
	
	for (k in gVersions) {
			$("#vdel-"+k).hide();
	}
	recordTemplate(gT, gKey);
	  
  }
  
  function saveEdits() {
	  
    if ( gMDEdStack ) {
      var sUrl = '/action/updateMdRecord'; 
      $.ajax({ 
        type: 'POST',
        url: sUrl,
        data: JSON.stringify(gMDEdStack),
        dataType: "json",
        contentType: "application/json",  
        success: function(data) {
          console.log( JSON.stringify(data) );
        
          var o = { "id" : gMDEdStack.guid  };
      
          var sname =  $("#gSearchBox").val();
          if ( !sname ) { sname = 'All' }
          localStorage.setItem("sr-"+gMDEdStack.guid,sname);
          mdView(o);
        },
        error: function (jqXHR, status, err) { 
          console.log('Save Error : ' + status + ' ' + err);
        }
		 });
	}
}
  
function applyEdits(j) {	
  // not used
		for (x in gMDEdStack.eda) {
			var x = gMDEdStack.eda[x];
			console.log(x.field + ' ' + x.action + ' ' + x.path + ' ' + x.value);
			if ( x.path ) {
				x.path.split('.');		
			}
		}
	}
  
function makeMDJson(r, p, t) {
	// test dont use -  record(json), parent_id, t - return type o - object, a - array
		var lj = {};
		var la = [];
		var sp = {};
		for (var k in r) {	
			if ( r[k].parent_id == p ) {
				var np = r[k].node_id;
				if ( r[k].node_prefix ) {
					var propname = r[k].node_prefix + ':' + r[k].node_name; 
				} else {
					var propname = r[k].node_name; 
				}
				if (r[k].node_name == '$' ) {
					if ( p == 0 ) {
						// special case - capture root attribute children
						sp[propname] = makeMDJson(r,np,'o');
					} else {
						lj[propname] = makeMDJson(r,np,'o');
					}
				} else if ( r[k].node_value == '{}' ) {
					if ( p == 0 && sp ) {
						lj[propname] = Object.assign(sp, makeMDJson(r,np,'o') );
					} else {
						lj[propname] = makeMDJson(r,np,'o');
					}
				} else if ( r[k].node_value == '[]' ) {
					// children of arrays - skip the layer that has the number index -
					lj[propname] = [];
					for (var v in r) {
						if ( r[v].parent_id == np ) {
							var subp = r[v].node_id;
							var z = {}; 
							if ( r[v].node_value == '{}' ) {
								z = makeMDJson(r,subp,'o');													
							} else {
								z = r[v].node_value.replace(/(^")|("$)/g, '');
							}
							lj[propname].push(z);
						}
					}					
				} else {
					// end point
					lj[propname] = r[k].node_value.replace(/(^")|("$)/g, '');
				}
			}			
		}
		return lj;
	}
  
function stackApply(ero ) {
	
    var edType = 'new';  
    if ( gMDEdStack.eda ) {
      for ( k in gMDEdStack.eda ) {
        if (  gMDEdStack.eda[k].nodeid == ero.nodeid )  {
          gMDEdStack.eda[k].value = ero.value;
          gMDEdStack.eda[k].path = ero.path;
         
          gMDEdStack.eda[k].action = ero.action;
          edType = 'edit';
        }
      }
    }
    if ( edType == 'new' ) {
      gMDEdStack.eda.push(ero);
    }

}	  

function titleEdt(o) {
	   
	  if ( $("#mdt").is(":hidden") ) {
		  
        if ( gT.title.value != $("#titlebox").val() ) {
            gT.title.value = $("#titlebox").val();
            var ero = { 'field' : 'title', 
                        'value': gT.title.value, 
                        'path' :  gT.title.path, 
                        "nodeid" : gT.title.nodeid,  
                        'action' : 'edit' };
            stackApply(ero);
            $("#mdt").css("color","#916e27");
            $("#mdt").text(gT.title.value);
        }

        $("#mdt").show();
        $("#titlebox").remove();
	  } else {
          mdReset(o);
          $("#tidiv").css({position: 'relative'});
            var w = $("#mdt").position();
            var tbw = Math.floor($("#mdt").width()/8);
            var tb = $('<input id="titlebox" type="text" size="'+ tbw+'" value="'+gT.title.value+'">')
                .css({top: w.top+20, left: w.left, position:'absolute'})
                .on("keyup", function(e) {
                  if (e.keyCode == 13) { titleEdt(this); }
                    });
            $("#tidiv").append(tb);
            $("#tidiv").css("height", $("#mdt").height()+30 );
            $("#mdt").hide();  
	  }  
}

  function absEdt(o) {
	 
	if ( $("#pabs").is(":hidden") ) {
		  if ( gT.abstract.value != $("#absbox").val() ) {
        gT.abstract.value = $("#absbox").val();
        var ero = { 'field' : 'abstract', 
          'value': gT.abstract.value, 
          'path' : gT.abstract.path,  
          "nodeid" : gT.abstract.nodeid, 
          'action' : 'edit' };
        stackApply(ero);
       
        $("#pabs").css("color","#916e27");
        $("#pabs").text(gT.abstract.value);
		  }
      $("#pabs").show();
		  $("#absbox").remove();
	} else {
		 mdReset(o);
		 $("#abdiv").css({position: 'relative'});
		  var w = $("#pabs").position();
		  var abw = Math.floor($("#pabs").width()/8);
		  var abh = Math.floor($("#pabs").height()/8);
		  var tb = $('<textarea id="absbox"  rows="'+abh+'" cols="'+ abw+'" > '+gT.abstract.value+'</textarea>')
					.css({top: w.top, left: w.left+40, position:'absolute'});
		  $("#abdiv").append(tb);
		  $("#abdiv").css("height", $("#pabs").height()+60 );
		  $("#pabs").hide();
		  
	 }
	  
}
  
function authEdt(o) {
	
	if ( $("#authname").is(":hidden") ) {
		
		if ( gT.contact.name.value != $("#anEdit").val() ) {
			gT.contact.name.value = $("#anEdit").val();
			
			var ero = { 'field' : 'contact.name', 
					'value': gT.contact.name.value, 
					'path' : gT.contact.name.path, 
					"nodeid" : gT.contact.name.nodeid, 
					'action' : 'edit' };
			stackApply(ero);
		
			$("#authname").css("color","#916e27");
			$("#authname").text(gT.contact.name.value);
		}
		
		if ( gT.contact.position.value != $("#apEdit").val() ) {
			gT.contact.position.value = $("#apEdit").val();
			var ero = { 'field' : 'contact.position', 
						'value': gT.contact.position.value, 
						'path' : gT.contact.position.path, 
						"nodeid" : gT.contact.position.nodeid, 
						'action' : 'edit' };
			stackApply(ero);
			$("#authpo").css("color","#916e27");
			$("#authpo").text(gT.contact.position,value);
		}
		
		if ( gT.contact.org.value != $("#aoEdit").val() ) {
			gT.contact.org.value = $("#aoEdit").val();
		
			var ero = { 'field' : 'contact.org', 
						'value': gT.contact.org.value, 
						'path' : gT.contact.org.path, 
						"nodeid" : gT.contact.org.nodeid, 
						'action' : 'edit' };
			stackApply(ero);

			$("#authorg").css("color","#916e27");
			$("#authorg").text(gT.contact.org.value);
		}
		
		if ( gT.contact.email.value != $("#aoEdit").val() ) {
			gT.contact.email.value = $("#aoEdit").val();
			
			var ero = { 'field' : 'contact.email', 
						'value': gT.contact.email.value, 
						'path' : gT.contact.email.path, 
						"nodeid" : gT.contact.email.nodeid, 
						'action' : 'edit' };
			stackApply(ero);
	
			$("#authorg").css("color","#916e27");
			$("#authorg").text(gT.contact.email.value);
		}
		
		$("#authname").show();
		$("#authpo").show();
		$("#authorg").show();
		$("#autheml").show();
		
		$("#anEdit").remove();
		$("#apSel").remove();
		$("#aoEdit").remove();
		$("#aeEdit").remove();
		
	} else {
        mdReset(o);
        $("#mdAuthor").css({position: 'relative'});
        var nw = $("#authname").position();
        var pw = $("#authpo").position();
        var ow = $("#authorg").position();
        var ew = $("#autheml").position();
          
        var nb = $('<input id="anEdit" type="text" size="'+ $("#authname").text().length +'" value="'+$("#authname").text()+'">')
              .css({top: nw.top, left: nw.left, position:'absolute'});
                  
        var ps = $('<select id="apSel"></select>')
            .css({top: pw.top, left: nw.left, position:'absolute'});
            
        $(gPos).each(function() {
          var pso =  $("<option>").attr('value',this.val).text(this.text);
          if ( $("#authpo").text() == this.text ) {
            pso.attr('selected','selected');
          }
          ps.append(pso);  
        });	
        
        var ob = $('<input id="aoEdit" type="text" size="'+ $("#authorg").text().length +'" value="'+$("#authorg").text()+'">')
              .css({top: ow.top, left: nw.left, position:'absolute'});
              
        var eb = $('<input id="aeEdit" type="text" size="'+ $("#autheml").text().length +'" value="'+$("#autheml").text()+'">')
              .css({top: ew.top, left: nw.left, position:'absolute'});
              
        $("#mdAuthor").append(nb);
        $("#mdAuthor").append(ps);
        $("#mdAuthor").append(ob);
        $("#mdAuthor").append(eb);

        $("#authname").hide();
        $("#authpo").hide();
        $("#authorg").hide();
        $("#autheml").hide(); 	  
	  }	    
}
  
function resNew(o) {
	  
	if ( $("#resdln").length == 0 ) { 
        mdReset(o);
        var rNB = $('<i id="rnbx" class="fas fa-plus" onclick="resNew(this)" style="color:#196fa6;font-size:12px; margin-right: 5px; "></i>');
        var rt = $('<select id="rtNewSel"></select>');		
        $(gDt).each(function() {
          var rto =  $("<option>").attr('value',this.val).text(this.text);
          rt.append(rto);  
        });
        var rn = $('<input id="rnedit" type="text" size="40" placeholder="Enter Resource Description">');
        var rl = $('<input id="rledit" type="text" size="40" placeholder="Enter Resource Link ">');
        var rDel = $('<i id="rnewdel" class="fas fa-trash-alt" onclick=" resNew(this)" style="color:#196fa6;font-size:12px; margin-left: 5px;"></i>');
        var rnewDiv = $('<div id="resdln">').css("margin", "10px" )
							  .css("width", "700px");
                  
        rnewDiv.append(rNB);
        rnewDiv.append(rt);
        rnewDiv.append(rn);
        rnewDiv.append(rl);
        rnewDiv.append(rDel);
        $("#resdiv").append(rnewDiv);
		
	} else {
		 if ( o.id == 'rnewdel' ) {
			  $("#resdln").remove();
		 } else {
          var rname = $("#rnedit").val();
          var rlink = $("#rledit").val();
          var rtype = $("#rtNewSel").val();
          
          var mr = JSON.parse(JSON.stringify(gResource));
          mr.resourceUrl.value = rlink;
          mr.resourceName.value = rname;
          mr.resourceType.value = rtype;
          gT.resource.push( mr );
              
          var newK = gT.resource.length-1;

          var lo = linkColors(rname, rlink); 
          var rLL = $('<a id="rn-'+newK+'" href="'+ rlink + '" class="resource-item" target="_blank">' + rname + '</a>');
          var rLP = $('<a id="rl-'+newK+'"  onclick="previewer(this);" class="res-tag" >' + lo.text +  '</a>')
                    .css("width",lo.width)
                    .css("color",lo.txtcolor)
                    .css("background-color",lo.bgcolor);
          var rEd = $('<i id="resEdit-'+newK+'" class="fas fa-edit" onclick="resEdt(this);" style="color:#196fa6;font-size:16px; "></i>');
          var rDel = $('<i id="resdel-'+newK+'" class="fas fa-trash-alt" onclick=" resDel(this)" style="color:#196fa6;font-size:12px; margin-left: 5px;"></i>');
          var rL = $('<div id="resdl-'+newK+'">').css("margin", "10px" )
                      .css("width", "700px");         
          $("#resdln").remove();
          $("#rnbx").remove();
          rL.append(rEd);
          rL.append(rLP);
          rL.append(rLL);
          rL.append(rDel);
          $("#resdiv").append(rL);
          // urlCheck(rLL);
		    }	
	}   
}
  
function resDel(o) {
	  
      var rid = o.id.split('-');
      var k  = rid[1];
      gT.resource[k].resourceName.value = 'DELETE-RESOURCE';
      gT.resource[k].resourceUrl.value = 'DELETE-URL';
      gT.resource[k].resourceType.value = 'DELETE-TYPE';
      
      var ero = { 'field' : 'resourceUrl', 
          'value': gT.resource[k].resourceUrl.value, 
          'path' : gT.resource[k].resourceUrl.path, 
          "nodeid" : gT.resource[k].resourceUrl.nodeid, 
          'action' : 'delete' };
      stackApply(ero);
      					
      $("#rn-"+k).remove();
      $("#rl-"+k).remove();
      $("#resEdit-"+k).remove();
      $("#resdel-"+k).remove();
	
}
  
function setResVersion(kindex, property, action) {
	  // not functional 
	  if ( !gMd.edits.resource ) { gMd.edits.resource = []; }
	  
	  for (x in gMd.edits.resource) {
		  var reds = gMd.edits.resource[x];

				 
	  }
			 
	  if ( action == 'new') {
		 var ro = {};
		 ro.index = kindex;
		 ro.resourceName = 'new';
		 ro.resourceUrl = 'new';
		 ro.resourceType = 'new';
		 gMd.edits.resource.push(ro);
	  }
	  
	  if ( action == 'delete') {
		 var ro = {};
		 ro.index = kindex;
		 ro.resourceName = 'delete';
		 ro.resourceUrl = 'delete';
		 ro.resourceType = 'delete';
		 gMd.edits.resource.push(ro);
	  }
	  
	   if ( action == 'edit') {
		    var ro = {};
	   }
	  
  }
  
function resEdt(o) {
	    
	  var rid = o.id.split('-');
	  var k  = rid[1];
	  var lt = $("#rl-"+k).text();
	  
	  if ( $("#rn-"+k).is(":hidden") ) {
		  
        if ( gT.resource[k].resourceUrl.value !== $("#rledit").val() ) {
            gT.resource[k].resourceUrl.value = $("#rledit").val();
          
            var ero = { 'field' : 'resourceUrl', 
                  'value': gT.resource[k].resourceUrl.value, 
                  'path' : gT.resource[k].resourceUrl.path, 
                  "nodeid" : gT.resource[k].resourceUrl.nodeid, 
                  'action' : 'edit' };
            stackApply(ero);			

            $("#rn-"+k).attr("href",$("#rledit").val());
            $("#rn-"+k).css("color","#916e27");
        }
		 
        if ( gT.resource[k].resourceName.value !== $("#rnedit").val() ) {
            gT.resource[k].resourceName.value = $("#rnedit").val();
            var ero = { 'field' : 'resourceName', 
                  'value': gT.resource[k].resourceName.value, 
                  'path' : gT.resource[k].resourceName.path, 
                  "nodeid" : gT.resource[k].resourceName.nodeid, 
                  'action' : 'edit' };
            stackApply(ero);			
            $("#rn-"+k).text($("#rnedit").val());
            $("#rn-"+k).css("color","#916e27");
        }
        
        if ( gT.resource[k].resourceType.value !== $("#rtSel").val() ) {
            gT.resource[k].resourceType.value = $("#rtSel").val();
            var ero = { 'field' : 'resourceType', 
                  'value': gT.resource[k].resourceType.value, 
                  'path' : gT.resource[k].resourceType.path, 
                  "nodeid" : gT.resource[k].resourceType.nodeid, 
                  'action' : 'edit' };
            stackApply(ero);			
            $("#rl-"+k).text($("#rtSel").val());
        }

        if ( gT.resource[k].resourceDesc.value !== $("#rdedit").val() ) {
          gT.resource[k].resourceDesc.value = $("#rdedit").val();
          var ero = { 'field' : 'resourceDesc', 
                'value': gT.resource[k].resourceDesc.value, 
                'path' : gT.resource[k].resourceDesc.path, 
                "nodeid" : gT.resource[k].resourceDesc.nodeid, 
                'action' : 'edit' };
          stackApply(ero);			
      
        }
        
        $("#rn-"+k).show();
        $("#rl-"+k).show();   
        
        $("#rtSel").remove();
        $("#rnedit").remove();
        $("#rledit").remove();
        $("#rdedit").remove();

        $("#lte").remove();
        $("#lne").remove();
        $("#lue").remove();
        $("#lpe").remove();
        
        for ( var z in gT.resource) {
          $("#resdl-"+z).css("height","20px")
                        .css("background-color","white")
                        .show();
        }
	  } else {
        mdReset(o);

        var rlink = gT.resource[k].resourceUrl.value;
        var rtype = gT.resource[k].resourceType.value;
        var rname = gT.resource[k].resourceName.value;
        var rdesc = gT.resource[k].resourceDesc.value;
        var w = $(o).position();
        var rw = rlink.length;
        var rnw = rname.length;
        var rdw = rdesc.length;

        for ( var z in gT.resource) {
          if ( z == k ) {
            $("#resdl-"+k).css("position","relative")
                          .css("background-color","#e8e8e8")
                          .css("height","80px")
                          .css("width","960px");
          } else {
            $("#resdl-"+z).hide();
          }
        }
 
        var rt = $('<select id="rtSel"></select>')
            .css({top: 5, left: 80, position:'absolute'});

        if ( rtype.length > 1 && gDt.indexOf(rtype) == -1 ) {
          gDt.push({"val": rtype, "text": rtype });
        }

        $(gDt).each(function() {
          var rto =  $("<option>").attr('value',this.val).text(this.text);
          if ( rtype == this.text ) {
            rto.attr('selected','selected');
          }
          rt.append(rto);  
        });	
        
        var rn = $('<input id="rnedit" type="text" size="'+ rnw+'" value="'+rname+'">')
            .css({top: 5, left: 280, position:'absolute'});		
      
        var rl = $('<input id="rledit" type="text" size="'+ rw+'" value="'+rlink+'">')
            .css({top: 30, left: 70, position:'absolute'});

        var rd = $('<input id="rdedit" type="text" size="'+ rdw+'" value="'+ rdesc.replace(/"/g, '&quot;') + '">')
              .css({top: 55, left: 70, position:'absolute'});

        var lt = $('<label id="lte" class="md-label" for="rtSel">Type</label>')
                    .css({top: 5, left: 50, position:'absolute'});
        var ln = $('<label  id="lne" class="md-label" for="rnedit">Name</label>')
                    .css({top: 5, left: 240, position:'absolute'});
        var lu =  $('<label  id="lue" class="md-label" for="rledit">Url</label>')
                    .css({top: 30, left: 20, position:'absolute'});
        var lp = $('<label  id="lpe" class="md-label" for="rdedit">Params</label>')
                    .css({top: 55, left: 20, position:'absolute'});

        $("#resdl-"+k).append(lt);             
        $("#resdl-"+k).append(rt);
        $("#resdl-"+k).append(ln);
        $("#resdl-"+k).append(rn);
        $("#resdl-"+k).append(lu);
        $("#resdl-"+k).append(rl);
        $("#resdl-"+k).append(lp);
        $("#resdl-"+k).append(rd);

        $("#rn-"+k).hide();
        $("#rl-"+k).hide();
	  }
	   
}
	
  function extEdt(o) {
	  
	if ( $("#extN").is(":hidden") ) {
		
        if ( gT.extent.north.value != $("#extNEdit").val() ) {
            gT.extent.north.value = $("#extNEdit").val();
            var ero = { 'field' : 'extent.north', 
                  'value': gT.extent.north.value, 
                  'path' : gT.extent.north.path, 
                  "nodeid" : gT.extent.north.nodeid, 
                  'action' : 'edit' };                
            stackApply(ero);			      
            $("#extN").css("color","#916e27");
            $("#extN").text(gT.extent.north.value);
        }
        
        if ( gT.extent.south.value != $("#extSEdit").val() ) {
            gT.extent.south.value = $("#extSEdit").val();
            var ero = { 'field' : 'extent.south', 
                  'value': gT.extent.south.value, 
                  'path' : gT.extent.south.path, 
                  "nodeid" : gT.extent.south.nodeid, 
                  'action' : 'edit' };
            stackApply(ero);			
            $("#extS").css("color","#916e27");
            $("#extS").text(gT.extent.south.value);
        }
		
        if ( gT.extent.east.value != $("#extEEdit").val() ) {
            gT.extent.east.value = $("#extEEdit").val();
            var ero = { 'field' : 'extent.east', 
                  'value': gT.extent.east.value, 
                  'path' : gT.extent.east.path, 
                  "nodeid" : gT.extent.east.nodeid, 
                  'action' : 'edit' };
          stackApply(ero);
          $("#extE").css("color","#916e27");
          $("#extE").text(gT.extent.east.value);
        }

        if ( gT.extent.west.value != $("#extWEdit").val() ) {
          gT.extent.west.value = $("#extWEdit").val();
          var ero = { 'field' : 'extent.west', 
                'value': gT.extent.west.value, 
                'path' : gT.extent.west.path, 
                "nodeid" : gT.extent.west.nodeid, 
                'action' : 'edit' };
          stackApply(ero);			
          $("#extW").css("color","#916e27");
          $("#extW").text(gT.extent.west.value);
        }
		
        $("#extN").show();
        $("#extS").show();
        $("#extE").show();
        $("#extW").show(); 
        $("#extNEdit").remove();
        $("#extSEdit").remove();
        $("#extEEdit").remove();
        $("#extWEdit").remove();
		
	} else {
        mdReset(o);
        $("#mdExtent").css({position: 'relative'});
        var nw = $("#extN").position();
        var sw = $("#extS").position();
        var ew = $("#extE").position();
        var ww = $("#extW").position();
          
        var nb = $('<input id="extNEdit" type="text" size="'+ $("#extN").text().length +'" value="'+$("#extN").text()+'">')
              .css({top: nw.top, left: nw.left, position:'absolute'});
              
        var sb = $('<input id="extSEdit" type="text" size="'+ $("#extS").text().length +'" value="'+$("#extS").text()+'">')
              .css({top: sw.top, left: sw.left, position:'absolute'});	
        
        var eb = $('<input id="extEEdit" type="text" size="'+ $("#extE").text().length +'" value="'+$("#extE").text()+'">')
              .css({top: ew.top, left: ew.left, position:'absolute'});
              
        var wb = $('<input id="extWEdit" type="text" size="'+ $("#extW").text().length +'" value="'+$("#extW").text()+'">')
              .css({top: ww.top, left: ww.left, position:'absolute'});
              
        $("#mdExtent").append(nb);
        $("#mdExtent").append(sb);
        $("#mdExtent").append(eb);
        $("#mdExtent").append(wb);

        $("#extN").hide();
        $("#extS").hide();
        $("#extE").hide();
		    $("#extW").hide();		
	  } 
  }
  
  function kwEdt(o) {
	  
	//mdReset(o);
	if ( o.id == 'keyxE' || o.id == 'kwedit' ) {
		if ( $("#kwedit").is(":hidden") ) {	
			// Setup to add new kw
			gkwid = -1;
			$("#kwedit").show();
			$("#keyxM").hide();
		} else {
			// Save a keyword
			var nkw = $("#kwedit").val();
			if ( gkwid == -1 ) {
				// new kw
				 var kw = { "value": nkw, "path": "", "nodeid": -1 };
				gT.keywords.push(kw);
				gkwid = gT.keywords.length-1;
				
				var ero = { 'field' : 'keywords', 
						'value': gT.keywords[gkwid].value, 
						'path' : gT.keywords[gkwid].path, 
						'index': gkwid,
						"nodeid" : gT.keywords[gkwid].nodeid, 
						'action' : 'new' };
       
        stackApply(ero);
				var kwL = $('<a id="kw-'+gkwid+'" onclick="kwEdt(this)" class="tag" >' + nkw + '</a>')
                  .css("margin","5px");  
				$("#mdKeywords").append(kwL);
			} else {
				// edit existing
				if ( gT.keywords[gkwid].value != nkw ) {
					gT.keywords[gkwid].value = nkw;		
					var ero = { 'field' : 'keywords', 
								'index': gkwid, 
								'value': gT.keywords[gkwid].value, 
								'path' : gT.keywords[gkwid].path,
								"nodeid" : gT.keywords[gkwid].nodeid, 
								'action' : 'edit' };
			    stackApply(ero);			   
					$('#kw-'+gkwid).text(nkw);
					$('#kw-'+gkwid).css("color","#916e27");
				} else {
					// it didnt change
				}	
			}
			$("#kwedit").val("");
			$("#kwedit").hide();
			$("#keyxM").hide();
		}
	} else if ( o.id == "keyxM") {
		// clicked delete
		if ( gkwid > -1 ) {
			// this allows deletes without having to re-index all the kw a elements
			gT.keywords[gkwid].value = 'DELETE-KEYWORD';	
			var ero = { 'field' : 'keywords', 
						'index': gkwid, 
						'value': gT.keywords[gkwid].value, 
						'path' : gT.keywords[gkwid].path, 
						"nodeid" : gT.keywords[gkwid].nodeid, 
						'action' : 'delete' };
			stackApply(ero);			
			$('#kw-'+gkwid).remove();
			$("#kwedit").val("");
			$("#kwedit").hide();
			$("#keyxM").hide();
		}
	} else {
		// clicked on a kw - just show it
		mdReset(o);
		gkwid = parseInt(o.id.substr(3));
		$("#kwedit").val(o.text);
		$("#kwedit").show();
		$("#keyxM").show();
	
	}
}
  
  function mdReset(o) {
	// clears the edit state elements
	
	$('input, select, textarea').each(function() { 
	    var nx = $(this);
		
		if ( nx[0].id == 'gSearchBox' || nx[0].id == 'map-lyr-select' || nx[0].id == 'luser' || nx[0].id == 'lpass' ) {
			console.log('>>> spaghetti-Os '+nx[0].id);
		} else if ( nx[0].id == 'kwedit' ) {
			$("#kwedit").hide();
			console.log('>>> this page '+nx[0].id);
		} else {
			console.log(' removed '+nx[0].id);
			nx[0].remove();
			
		}
	});
	
	if ( o.id != 'titleE') {
		$("#mdt").show();
	}
	
	if ( o.id != 'absE') {
		$("#pabs").show();
	}

  if ( o.id.substr(0,8) != 'resEdit-' && $("#lte").length  ) {
   
    $("#rtSel").remove();
    $("#rnedit").remove();
    $("#rledit").remove();
    $("#rdedit").remove();

    $("#lte").remove();
    $("#lne").remove();
    $("#lue").remove();
    $("#lpe").remove();
    
    for ( var z in gT.resource) {
      $("#resdl-"+z).css("height","20px")
                    .css("background-color","white")
                    .show();
      $("#rn-"+z).show();
      $("#rl-"+z).show();   
    }

  }
	
	$('.md-value').each( function() { 
		$( this ).show(); 
	});
	
	$('.tag').each( function() { 
		$( this ).show(); 
	});
	
	$('.resource-item').each( function() { 
		$( this ).show(); 
	});
	
	$('.res-tag').each( function() { 
		$( this ).show(); 
	});
	
	$('.a-ref-valid').each( function() { 
		$( this ).show(); 
	});

  }
  
  function kwSave(o) {
	// NOT USED anymore
      var kwi = o.id.substr(4);
      var okv = gMd.keywords[kwi];
      var kwid = 'kw-'+kwi;
      var nkv = $("#kwedit").val();
      if ( okv != nkv ) {
        $('#'+kwid).text(nkv);
        $('#'+kwid).css("color","#916e27");
        gMd.keywords[kwi] = nkv;
      }
      
      $('#'+kwid).show();
      $(o).remove();
      $("#kwedit").remove();
	
	  
  }
	
  function recordTemplate(ro, gKey) {
	// first snapshot for edit cancels
	
      gCWR = JSON.parse(JSON.stringify(ro));
    
      var ed = false;
      if ( kmu(gKey) ) {
            ed = true;
            $("#mdEditBtn").text("Edit");
            $("#mdEditBtn").show();
            $("#mdValBtn").show();
            gEdState = 'ready';
      } else {
          $("#mdEditBtn").hide();
          $("#mdValBtn").hide();
          $("#mdCancelBtn").hide();
          $(".fas fa-edit").remove();
          $(".fas fa-plus").remove();	
          gEdState = 'off';
      }

      var titleEdit = $('<i id="titleE" class="fas fa-edit" onclick="titleEdt(this)" style="color:#196fa6;font-size:12px; margin-right: 5px; display:none;"></i>');
      var AbsEdit = $('<i id="absE" class="fas fa-edit" onclick="absEdt(this)" style="color:#196fa6;font-size:12px;  margin-right: 5px;display:none;"></i>');
      var authEdit = $('<i id="authE" class="fas fa-edit" onclick=" authEdt(this)" style="color:#196fa6;font-size:12px; margin-right: 5px; display:none;"></i>');
      var extEdit = $('<i id="extentE" class="fas fa-edit" onclick=" extEdt(this)" style="color:#196fa6;font-size:12px; margin-right: 5px; display:none;"></i>');
      var kxPlus = $('<i id="keyxE" class="fas fa-plus" onclick=" kwEdt(this)" style="color:#196fa6;font-size:12px; margin-right: 5px; display:none;"></i>');
      var kxMinus = $('<i id="keyxM" class="fas fa-trash-alt" onclick=" kwEdt(this)" style="color:#196fa6;font-size:12px; margin-left: 5px; display:none;"></i>');
      var rxPlus = $('<i id="resxE" class="fas fa-plus" onclick="resNew(this)" style="color:#196fa6;font-size:12px; margin-right: 5px; display:none;"></i>');
        
      var gTitle = $('<div id="tidiv">')
          .css("margin", "4px" )
          .css("font-size", "16px" )
          .css("background-color", "slate" );
      gTitle.append(titleEdit);
      
      gTitle.append('<h2 id="mdt" style="font-size: 14px; display: inline;" >'+ ro.title.value + '</h2><br />');
      gTitle.append('<span id="mdver" style="font-size: 11px; display: inline;" >Version: '+ ro.mdversion + '</span><br />');
        var abfix = ro.abstract.value.replace(/\\n/g, "<br />");
        var gAbstract = $('<div id="abdiv">')
                  .css("margin", "2px" );
      gAbstract.prepend(AbsEdit);
      
      gAbstract.append('<span id="pabs" style="font-size: 12px">'+ abfix + '</span>');
      
      var gResources =  $('<div id="resdiv">')
                  .css("margin", "2px" )
                  .css("background-color", "slate" );
      gResources.append(rxPlus);
      gResources.append('<h2 style="font-size: 12px; display: inline;">Data & Resources</h2></br>');
      for ( var k in ro.resource) {
          var rlink = ro.resource[k].resourceUrl.value;
          var rtype = ro.resource[k].resourceType.value;
          var rname = ro.resource[k].resourceName.value;
          if ( rname != 'DELETE-RESOURCE' ) {
              var lo = linkColors(rname, rlink);
              if ( !rtype ) {
                ro.resource[k].resourceType.value = lo.text;
                rtype = lo.text;
              }

              var rLL = $('<a id="rn-'+k+'" href="'+ rlink + '" class="resource-item" target="_blank">' + rname + '</a>');
              var rLP = $('<a id="rl-'+k+'"  onclick="previewer(this);" class="res-tag" >' + lo.text +  '</a>')
                      .css("width",lo.width)
                      .css("color",lo.txtcolor)
                      .css("background-color",lo.bgcolor);
              var rEd = $('<i id="resEdit-'+k+'" class="fas fa-edit" onclick="resEdt(this);" style="color:#196fa6;font-size:16px; display: none;"></i>');
              var rDel = $('<i id="resdel-'+k+'" class="fas fa-trash-alt" onclick=" resDel(this)" style="color:#196fa6;font-size:12px; margin-left: 5px; display:none;"></i>');
              var rL = $('<div id="resdl-'+k+'">').css("margin", "10px" )
                        .css("width", "700px");
              rL.append(rEd);
              rL.append(rLP);
              rL.append(rLL);
              rL.append(rDel);
              gResources.append(rL);
              urlCheckCached(rLL);
          }
      }
	
      var xUrl='/csw?service=CSW&version=2.0.2&request=GetRecordById&id='+ro.guid+'&elementsetname=full&outputschema=http://www.isotc211.org/2005/gmd';
	    var jUrl='/action/getRecordJson?guid='+ro.guid;
	 
      var gViewXML =  $('<div id="mdXML" >')
              .css("margin", "2px" )
              .css("background-color", "slate" )
              .append('<a href="'+xUrl+ '" style="font-size: 14px;" target="_blank" class="tag">View XML</a>')
			        .append('<a href="'+jUrl+ '" style="font-size: 14px;" target="_blank" class="tag">View JSON</a>');

      var gKeyDiv =  $('<div id="mdKeywords" >')
              .css("margin", "2px" )
              .css("background-color", "slate" );
	    gKeyDiv.append(kxPlus);

      gKeyDiv.append('<h2 style="font-size: 14px; display: inline">Keywords</h2>');
	    var kbox = $('<input id="kwedit" type="text" style="display: none;">')
                .on("keyup", function(e) {
                  if (e.keyCode == 13) {
                    kwEdt(this);
                  }
                });
      gKeyDiv.append(kbox);
      gKeyDiv.append(kxMinus);
      gKeyDiv.append('</br>');
	
      for ( var k in ro.keywords) {
          var kw = ro.keywords[k].value;
          // BUG - findRecords wants a PAGE 
          if ( kw != 'DELETE-KEYWORD' ) {
            if ( ed ) {
              var kwL = $('<a id="kw-'+k+'" onclick="kwEdt(this)" class="tag" >' + kw + '</a>')
                  .css("margin","5px");  
            } else {
              var kwL = $('<a  id="'+kw+'" onclick="findKW(this)" class="tag" >' + kw + '</a>')
                  .css("margin","5px");  
            }
            gKeyDiv.append(kwL);
          }
      }

      var gAuthor = $('<div id="mdAuthor" >')
              .css("margin", "2px" )
              .css("background-color", "slate" );
	    gAuthor.append(authEdit); 
      gAuthor.append('<h2  style="font-size:12px; display: inline;" >Author</h2></br>');
      gAuthor.append('<label class="md-label">Name:</label><span id="authname" class="md-value" >'+ ro.contact.name.value + '</span></br>');
      gAuthor.append('<label class="md-label">Position:</label><span id="authpo" class="md-value">'+ ro.contact.position.value + '</span></br>');
      gAuthor.append('<label class="md-label">Organization:</label><span id="authorg" class="md-value" >'+ ro.contact.org.value + '</span></br>');
      gAuthor.append('<label class="md-label">Email:</label><span id="autheml" class="md-value">'+ ro.contact.email.value + '</span></br>');
      var gExtent = $('<div id="mdExtent" >')
                .css("margin", "2px" )
                .css("background-color", "slate" );
	    gExtent.append(extEdit);		  
      gExtent.append('<h2 style="font-size: 12px; display: inline"  >Geographic Extent</h2></br>');

      ro.extent.exists = true;
      if ( ro.extent.north.value == "" && ro.extent.west.value == "" ) {
          ro.extent.exists = false;
      }

      if ( ro.extent.north.value == 0 && ro.extent.west.value == 0 ) {
        ro.extent.exists = false;
      }
      if ( ro.extent.north.value == 0 && ro.extent.west.value == 0 ) {
        gExtent.append('<label class="md-label">Coordinates:</label><span class="md-value"> Not Provided</span></br>');
      } else {
        gExtent.append('<label class="md-label">North Bound:</label><span id="extN" class="md-value">'+ ro.extent.north.value +  '</span></br>');
        gExtent.append('<label class="md-label">South Bound:</label><span id="extS" class="md-value">'+ ro.extent.south.value + '</span></br>');
        gExtent.append('<label class="md-label">East Bound:</label><span id="extE" class="md-value">'+ ro.extent.east.value +  '</span></br>');
        gExtent.append('<label class="md-label">West Bound:</label><span id="extW" class="md-value">'+ ro.extent.west.value +  '</span></br>');
      }
      updateExtent(ro.extent);
      var gMd = $('<div id="mdMetaInfo" >')
                .css("margin", "2px" )
                .css("background-color", "slate" )
                .append('<h2 style="font-size: 12px;"  >Metadata</h2>');

      gMd.append('<label class="md-label">Original ID:</label><span class="md-value">'+ ro.guid + '</span></br>');
      gMd.append('<label class="md-label">Index Date:</label><span class="md-value">'+ ro.datestamp.value + '</span></br>');
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
      $("#widget-view").append(gKeyDiv);
    
      $("#widget-view").append(gAuthor);
      
      $("#widget-view").append(gExtent);
      $("#widget-view").append(gMd);
      $("#widget-view").append(gDP);

}

  var findKW  = function(o) {
    if ( o.id ) {
      var ms = $("#gSearchBox").val()
      if ( ms.length > 1 ) {
        $("#gSearchBox").val( ms + ' ' + o.id);
      } else {
        $("#gSearchBox").val(o.id);
      }
      findRecords(0);
    }
  }

  var urlCheck = function(urlink) {
  // Readl time asynchronous check
   
    var urlString =  $(urlink).attr("href");
    var hurl = '/url_status?' + 'url='+urlString;
   
      $.ajax({
          type: 'GET',
          url: hurl,
          dataType: 'json',
          contentType: "application/json",
          success: function(data, status) {
            
            if ( data ) {      
              $(urlink).attr("class","aref-valid");            
            } else {             
              $(urlink).attr("class","aref-not");
            }       
          }, 
          error: function (jqXHR, status, err) {  
            console.log('url check error');
          }
      });
  }

  var urlCheckCached = function(urlink) { 
    // for current record only 
    var guid = gT.guid;
    var urlString =  $(urlink).attr("href");

    function fl(url, lo) {
      if ( lo ) {
        for (k in lo) {
          if ( lo[k].url == url ) {
            if ( gHttpValid.includes(lo[k].url_status) ) {
              return "aref-valid";
            } else {
              return "aref-not";
            }
          }
        }
      } 
      return "resource-item";
    }

    if ( gT.linkCheck ) {
      $(urlink).attr("class",fl(urlString,gT.linkCheck)); 
    } else {
      var hurl = '/action/getUrlStatusCached?guid=' + guid + '&url='+urlString;
      $.ajax({
            type: 'GET',
            url: hurl,
            dataType: 'json',
            contentType: "application/json",
            success: function(data, status) {
              if (typeof(data) == "object" ) {
                var dres = data;
              } else {
                  var dres = JSON.parse(data);
              }
              gT.linkCheck = dres.rows;
              $(urlink).attr("class",fl(urlString,gT.linkCheck)); 
            }, 
            error: function (jqXHR, status, err) {  
              console.log('url check error');
            }
        });

    }

    
    

  }

  var updateExtent = function (o) {
    if ( drawnItems ) {
      map.removeLayer(drawnItems);
    }
    if ( rectangle ) {
      map.removeLayer(rectangle)
    }
    
    if ( gMdRecord ) {
      return;
    }
    var sa = [180, 90, 45, 22,5, 11.25, 5.625, 2.8, 1.4 ];
    
    if ( o.exists ) {
        var xs = gW -gE;
        var ys = gN - gS;
        var yl = gS + (ys)/2;
        var xl = gE + (xs)/2;
        if ( ys > xs ) { var scal = Math.abs(ys); } else { var scal = Math.abs(xs) }
        var z = 4;
        for ( k in sa ) {
          if ( scal > sa[k] ) {
            z = k;
            break;
          }
        }
       
        if ( z < 0 ) { z = 4 }
        var center = new L.LatLng(yl, xl);
        
        map.setView(center, z);
        var bounds = [[ gS, gW], [ gN, gE ]];
        rectangle = L.rectangle(bounds, {color: 'slateblue', weight: 1}).on('click', function (e) {
          console.info(e);
        }).addTo(map);
        map.fitBounds(bounds);
    }

}

var showSpinner = function(o)  {
    var target = $("#rec-results");
    var spinner = new Spinner(opts).spin(target);
}

var facetView = function(o) {
    if (o.id == 'Cat') {
    
      if (  $("#CatB").attr("class") == "fa fa-angle-right" ) {
        $("#CatB").attr("class","fa fa-angle-down");
      } else { $("#CatB").attr("class","fa fa-angle-right") }
      $(".nav-category").each(function() {
      
          if ( $(this).css("display") == "none") { 
            $(this).css("display","block");
          } else {
            $(this).css("display","none");
          }
      });
    }

    if (o.id == 'Auth') {
      //console.log('auth facet toggle');
      if (  $("#authB").attr("class") == "fa fa-angle-right" ) {
        $("#authB").attr("class","fa fa-angle-down");
      } else { $("#authB").attr("class","fa fa-angle-right") }
      $(".nav-author").each(function() {
        divToggle(this);
      });
    }

    if (o.id == 'ContModel') {
    
      if (  $("#cmB").attr("class") == "fa fa-angle-right" ) {
        $("#cmB").attr("class","fa fa-angle-down");
      } else { $("#cmB").attr("class","fa fa-angle-right") }
      $(".nav-cm").each(function() {
        divToggle(this);
      });
    }

    if (o.id == 'DataType') {
    
      if (  $("#dtB").attr("class") == "fa fa-angle-right" ) {
        $("#dtB").attr("class","fa fa-angle-down");
      } else { $("#dtB").attr("class","fa fa-angle-right") }
      $(".nav-dt").each(function() {
        divToggle(this);
      });
    }

    if (o.id == 'repoCatalog') {
      
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
        var ssu = 'success categories'; 
      })
      .done(function(data) { 

            if (typeof(data) == "object" ) {
               var dres = data;
            } else {
               var dres = JSON.parse(data);
            }

            $(".nav-category").each(function() {
             
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
        var ssu = 'success authgor'; 
      })
      .done(function(data) { 

            if (typeof(data) == "object" ) {
               var dres = data;
            } else {
               var dres = JSON.parse(data);
            }

            $(".nav-author").each(function() {
            
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
      var ssu = 'success cm'; 
     })
     .done(function(data) { 

           if (typeof(data) == "object" ) {
              var dres = data;
           } else {
              var dres = JSON.parse(data);
           }

           $(".nav-cm").each(function() {
          
            $( this ).remove();
          })

           var dx = dres.rows;
           for (var i in dx) {
             
             var cname = dx[i].cm;
             cname = cname.replace(/"/g,"");
             var cn = cname; 
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
    var ssu = 'success datatypes'; 
   })
   .done(function(data) { 

         if (typeof(data) == "object" ) {
            var dres = data;
         } else {
            var dres = JSON.parse(data);
         }

         $(".nav-dt").each(function() {
       
          $( this ).remove();
        })

        $(".nav-rc").each(function() {
         
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
            infoControl: false,
            legendControl: false,
            zoomControl: true, 
            trackResize: true,
            id: 'mapbox.streets'
        }).addTo(dpMap);
        
        dpMap.on('ready',function() { 
            setTimeout(function(){ 
                dpMap.invalidateSize();
               
            }, 200);
            console.log('ready map')
        });

        lx = '/previewMap';
        var jqxhr = $.get(lx, {dataType : "jsonp"}, function() {
          var ssu = 'success previewMap'; 
        }).done( function(data) {
          if (typeof(data) == "object" ) {
            var dres = data;
         } else {
            var dres = JSON.parse(data);
         }
     
          var tf = {  "type": "FeatureCollection",
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
       

        });


  } 


}

function logmein(o, cb) {
  var un = $("#luser").val();
  var pw =  $("#lpass").val();

  var xUrl = '/action/getToken?q='+un+'&p='+pw;

  var jqxhr = $.get(xUrl, function() {
    var ssu = 'success gt'; 
  })
  .done(function(data) { 

       if (typeof(data) == "object" ) {
          var dres = data;
       } else {
          var dres = JSON.parse(data);
       }
      
      
        if ( dres.authtoken == dres.kv ) {
            gKey = {};
            gKey[dres.authtoken] = dres.kv;
			      gKey.agentRole = dres.agentrole;
            $("#laname").text(un).css("font-size","12px")
				.css("font-family","Arial, Lucida Grande, sans-serif");
            $("#loginBtn").text("Logout");
          
            $("#loginDiv").hide();
            cb();
            return;
        } else {
			gKey = {"x":"z","agentRole":"99"};
			cb();
		}
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
   
  } 
}

var toggleLogin = function(o, cb) {
   
  if (  $(o).text() == "Logout" ) {
      gKey = { "a" : "b" };
      $("#laname").text("");
      $(o).text("Login");
	   $("#Cex").css("display","none");
      cb();
  } else {
    if ( $("#loginDiv").css("display") == "none") { 
      $("#loginDiv").css("display","block");
    
    } else {
      $("#loginDiv").css("display","none");
  
    }
  
  }

}
