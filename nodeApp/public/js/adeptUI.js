/* Adept Search tools 
   dev on test.geothermaldata.org
   GH - 10/15/20
*/
  
  // search results
  var gSRA = [];
  // publisher results
  var gPub = [{ "publisher": "p", "journals": 0, "articles": 0 }];
  // dataset return
  var gSet = [];
  // journals return
  var gJrn = [];
  var gjPage = 0;
  var gJSearch = "";
    
  var gDictList = [];
  var gTestSets = [];
  var gCollections = [];

  var gSelCollection = {};
  var gProcLog = [];
  var gApps = [];

  var gDLType = "";
  var gDict = {};
  var gSetInit = true;
  var gSelDict = {k : "", dict_id : "", count: 0 };
  //var gdUrl='https://xdddev.chtc.io/api/v1' ;
  var gdUrl='https://xdd.wisc.edu/api/v1';
  // find records header info
  var gFRHdr = {};

  // Article search terms
  var gSE = { term : "", 
              pubname: "", pubname_like: "", publisher: "", 
              title: "", title_like: "",
              dataset : "", lastname : "", firstname : "", 
              min_acquired: "", max_acquired: "",
              min_published: "", max_published: "",
              recent: "",
              max : "",   
              docid: "", doi: ""
            }
  var gT;
     
  var gSavedGuids=[];
							 
  var gKey = {"a":"b"};
  var gAuth = { "loginBtn" : "userLogin" };
  var gMenuSel = 's';
  var gVersions = [];
  var gEdState = 'off';
  var gkwid=-1;
 
  var gUser = {};

  function showSeaHis() {

    $("#sHistoryItems").empty();
    var uflag = false;

    if ( gSelCollection && gSelCollection.col_k >= 0 ) {
      $("#shTitle").text("Saved Set Searches "+ gSelCollection.col_name);
      uflag = true;
      var k =gSelCollection.col_k;
      if ( gCollections[k].search_set ) { 
        for (z in  gCollections[k].search_set ) {
            var i = gCollections[k].search_set[z].cs_id;
            var u = gCollections[k].search_set[z].search_url;
            var c = gCollections[k].search_set[z].rec_count;

            var jst = JSON.parse(u);
            var pstr = '';
            var mStr = '';
            Object.keys(jst).forEach(key => {
              if ( key == 'term') {
                mStr = 'Search <b>'+jst[key]+'</b> ( '+c+' )';
              }
              pstr = pstr + key.toUpperCase() + ': ' + jst[key] + ' ';
            });
            var fa = $('<i class="fa fa-search" style="font-size:10px;"></i>')
            var st = $('<a id="sc-'+z+'" title="'+pstr+'" class="sh-item" onclick="selectHistoryItem(this);" >'+mStr+'</a>')
            .css("font-size","12px; ")
            .css("margin","4px 2px;")
            .css("background-color", "rgb(188, 204, 204)" );
            $("#sHistoryItems").append(fa);
            $("#sHistoryItems").append(st);
            $("#sHistoryItems").append('</br>');
        }
      }
      $("#SearchHistory").css("display","block");
    
    } 

    if ( gSelDict.count > 0 ) {
      if ( uflag ) {
        $("#sHistoryItems").append("<b>Dictionary "+ gSelDict.name + '</b></br>');
      } else {
        $("#shTitle").text("Dictionary "+ gSelDict.name);
        uflag = true;
      }
     
      var px = 0;
      Object.keys(gDict)
        .forEach(key => {
          var st = $('<a id="dl-'+key+'" class="sh-item" style="font-size:12px; margin: 2px 2px;" onclick="selectHistoryItem(this);" >'+key+'</a>'); 
          var rc = $('<span class="sh-item" style="font-size:12px; float: right; margin: 0px 80px;" " >( '+gDict[key]+' )</span></br>'); 
          if ( px < 300 ) { 
          $("#sHistoryItems").append(st);
          $("#sHistoryItems").append(rc);
          }    
          px++;
        });
        $("#SearchHistory").css("display","block");
    } else {
      if ( uflag ) {
        $("#sHistoryItems").append('<b>Search Term History</b></br>');
      } else {
        $("#shTitle").text('Search Term History');
      }
     
      //$("#shTitle").text("Search History");
      for (k in gSearchHistory) {
        var hs = gSearchHistory[k];
      if ( hs ) {
          var st = '<i class="fa fa-trash-alt" id="cl-'+k+'" onclick="selHisDel(this)" style="font-size:9px;"></i><a id="sh-'+k
                    +'" class="sh-item" style="font-size:12px; margin: 2px 2px;" onclick="selectHistoryItem(this);" >'+hs+'</a></br>';
          $("#sHistoryItems").append(st);
      }
      }
      $("#SearchHistory").css("display","block");

    }
    
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
		//	$("#leftMDRecord").hide();
		} else if ( gMenuSel == 'r' ) {
			$("#widget-view").empty();
			//$("#leftMDRecord").show();
			recordTemplate(gT, gKey);
		} else if ( gMenuSel == 'm' ) {
			console.log('logged in whlie viewing map');
		//	$("#leftMDRecord").hide();
			
		}
		
	} else if ( kmu(gKey) && gKey.agentRole == "4"  ) {
		if ( gMenuSel == 's' ) {
			$("#Cex").hide();
			//$("#leftMDRecord").hide();
		} else if ( gMenuSel == 'r' ) {
			$("#widget-view").empty();
			$("#leftMDRecord").show();
			recordTemplate(gT, gKey);
		} else if ( gMenuSel == 'm' ) {
		//	$("#leftMDRecord").hide();
			console.log('logged in while viewing map');
			
		}
	} else {
		// logging out
		if ( gMenuSel == 's' ) {
			$("#Cex").hide();
		//	$("#leftMDRecord").hide();
		} else if ( gMenuSel == 'r' ) {
			 $("#widget-view").empty();
			// $("#leftMDRecord").show();
			recordTemplate(gT, gKey);
		} else if ( gMenuSel == 'm' ) {
		//	$("#leftMDRecord").hide();
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
    } else if ( o.id.substr(0,2) == 'dl' ) {
      var tbx = o.id.substr(3);
      $("#gSearchBox").val(tbx);
    } else if ( o.id.substr(0,2) == 'sc' ) {
      var ix = o.id.substr(3);
      var u = gCollections[gSelCollection.col_k].search_set[ix].search_url;
      applySearch(u);



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
    localStorage.setItem("adSearchHistory",shs);
    showSeaHis();
  }

  function clearHistory() {
    $("#gSearchBox").val('');
    gSearchHistory=[];
    localStorage.setItem("adSearchHistory","");
    $("#sHistoryItems").empty();

  }

  function showSearchUrl(o) {
    
    var srch=searchSettings();  
    var sUrl = gdUrl + '/articles?full_results';
    if ( srch.length )  {
      sUrl = sUrl + srch;
    }

    var zw = sUrl.length*7;
    if ( zw < 400 ) { zw = 400; }
    var zs = zw+'px';
    var h = $('<h5>Search Url</h5>')
                    .css("margin-top", "8px")
                    .css("margin-bottom", "10px")
                    .css("text-align", "center");
                    //.css("padding","2px 2px");

    var p = $('<a href="'+sUrl+'" target="blank_" >'+sUrl+'</a>')
              .css("margin-left", "10px")
              .css("margin-bottom", "8px");

    var sBtn =   $('<a id="surlbtn" class="res-tag" >Close</a>')
                    .css("font-size", "12px")
                    .css("margin-top", "10px")
                    .css("margin-left", "160px")
                    .css("padding","2px 2px")
                    .css("background-color", "#0971B2" )
                    .attr('onclick','closeUrl(this);');

    var uriDiv = $('<div class="dijitTitlePaneTextNode" id="sdinx"></div>')
                  .css('background-color','#ffffff') 
                  .css('margin','auto')
                  .css("width", "98%")
                  .css("height", "96%")
                  .css('border-style','solid')
                  .css('border-color','#aaaaaa')
                  .css('position','relative');

    var urlDiv = $('<div class="dijitTitlePaneTextNode" id="showUrl"></div>')
                  .css('background-color','#cccccc')
                  .css('position','absolute')
                  .css('top','120px')
                  .css('margin','0')
                  .css('left','100px')
                  .css('width',zs)
                  .css('height','100px');
                

    uriDiv.append(h);             
    uriDiv.append(p);
    uriDiv.append('</br>');
    uriDiv.append(sBtn);
    urlDiv.append(uriDiv);
    urlDiv.appendTo(document.body);
    //$("#cb").prepend(urlDiv);

  }


  function closeUrl(o) {
    $("#showUrl").remove();
  }

  function saveSearch(o) {

    if ( kmu(gKey) ) {
      if ( gSelCollection.col_id ) {
        var srch=searchSettings();
        var srch=JSON.stringify(gSE);

        var sUrl = gdUrl + '/articles?full_results';
        if ( srch.length )  {
          sUrl = sUrl + srch;
        }
        sUrl = encodeURIComponent(sUrl);
        saveSearchToCollection(sUrl); 

      } else {
        alert('Please select a set to save the search ');
      }
      
    } else {
      alert('Please log in to save search');
    }
  }

  function saveMD(o){
    // save individual record to collection

    if ( o.text == 'Save' ) {
      if ( kmu(gKey) ) {
        if ( gSelCollection.col_id ) {
          var mdv = gSRA[o.id];
          var doi = mdv.identifier[0].id;
          var id = mdv._gddid;
          var zx = saveRecordToCollection(id);
          o.text = 'Clear';
          o.style.backgroundColor= "#21b229";
        } else {
          alert('Please select a collection in My Data to save the record ');
        }
      } else {
        alert('Please log in to save record');
      }
    } else {
      // need to delete records here

      o.text = 'Save';
      o.style.backgroundColor="#0971b2";
    }

    

  
  }

  function getTA() {
    var tUrl = '/action/typeAhead?q='+gTApre;
    var jqxhr = $.get(tUrl, function() {
      console.log( "typeahead success ..." );
    })
    .done(function(data) { 
      //console.log( "typeahead data ..." + JSON.stringify(data) );
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
  
    $("#leftSearch").show();
    $("#cb").show();
    $("#cb-title").html("Search Results");

    $("#leftUserData").hide();
    $("#rightUserData").hide();

    $( "#datepicker" ).datepicker();
    if ( !yorn ) {
      $("#rec-results").empty();
      findRecords(0);
    }
}

function savedData(o) {
  // after user login the My Data
  $("#leftSearch").hide();
  $("#cb").hide();
  $("#widget-box").hide();

  $("#leftUserData").show();
  $("#rightUserData").show();

}

function recentClk(o) {
  console.log(o.id);

  if ( gSE.recent == 'true' ) {
    o.text = "Recent - Off";
    gSE.recent = "";
  } else {
    o.text = 'Recent - Active';
    gSE.recent = "true";
  }


}

var searchSettings = function() {

  var searchStr = "";
  if ( init ) {
    gSE.dataset='geothermal';
  }
 
  gSE.term = $("#gSearchBox").val();

  if ( $("#pubWildBtn").css("background-color") == "rgb(9, 113, 178)" ) { 
    gSE.pubname = $("#gPubName").val();  
    gSE.pubname_like = "";
  } else {
    gSE.pubname = "";
    gSE.pubname_like = $("#gPubName").val();
  }

  if ( $("#titleWildBtn").css("background-color") == "rgb(9, 113, 178)" ) {
    gSE.title = $("#gSearchTitle").val();  
    gSE.title_like = "";
  } else {
    gSE.title_like = $("#gSearchTitle").val();
    gSE.max = "500";
    gSE.title = "";
  }
 
  gSE.doi = $("#gSearchDOI").val();
  gSE.docid = $("#gSearchDocid").val();
  gSE.firstname = $("#gAFName").val();
  gSE.lastname = $("#gALName").val();

  gSE.min_acquired =  $("#mindA-datepicker").val() ;
  gSE.max_acquired =  $("#maxdA-datepicker").val() ;
  gSE.min_published = $("#mindP-datepicker").val() ;
  gSE.max_published =  $("#maxdP-datepicker").val();
 
  Object.keys(gSE).forEach(key => {
    if ( gSE[key] ) {
      if ( key == 'recent' && gSE[key] == 'true' ) {
        searchStr = searchStr+'&max=500&'+key;
      } else {
        searchStr = searchStr+'&'+key+'='+ gSE[key];
      }
    }
  });

  return searchStr;
}

var applySearch = function(o) {

  if ( o ) {
    clearSearch();
    var jst = JSON.parse(o);
    Object.keys(jst).forEach(key => {
      gSE[key] = jst[key];
    });

  }

  if ( gSE.term ) { $("#gSearchBox").val( gSE.term ); }
  if ( gSE.title ) { $("#gSearchTitle").val( gSE.title ); }
  if ( gSE.pubname ) { $("#gPubName").val( gSE.pubname ); }

  if ( gSE.firstname )  { $("#gAFName").val(gSE.firstname); }
  if ( gSE.lastname )  { $("#gALName").val(gSE.lastname); }

 

}
var clearSearch = function(o) {
  $("#gSearchBox").val("");
  $("#gPubName").val("");
  $("#gSearchTitle").val("");
  $("#mindA-datepicker").val("");
  $("#maxdA-datepicker").val("");
  $("#mindP-datepicker").val("");
  $("#maxdP-datepicker").val("");
  $("#gSearchDOI").val("");
  $("#gSearchDocid").val("");
  $("#gAFName").val("");
  $("#gALName").val("");
  $(".npv").css("background-color","#ffffff");
  $(".nsv").css("background-color","#ffffff");
  $(".ndv").css("background-color","#ffffff");
  $("#recBtn").text("Recent - Off");

  Object.keys(gSE).forEach(key => {
    gSE[key] = "";
  });

}

var dtm =function(o) {
  if ( o.length ) {
    var k = o.split('-');
    return k[0]+'-'+k[2];
  } else {
    return o;
  }

}

function findRecords(page,g) {

  if (  init == true) {
    gSE.dict = gDefaultDict;
  }

  if ( !page ) { page = 0 }
  if ( page == 0 ) {
    var srch=searchSettings();
    gSearchType = 'text';
    
    if (  gSearchHistory.indexOf(gSE.term.trim()) == -1 ){
      gSearchHistory.push( gSE.term.trim() );
      var shs = gSearchHistory.sort().join('|');
      localStorage.setItem("adSearchHistory",shs);
    }
    var sUrl = gdUrl + '/articles?full_results';
    if ( srch.length )  {
      sUrl = sUrl + srch;
    }
    var dx =  new Date();
    console.log(sUrl + dx.getTime());
    $("#cb-title").html('Search Results for ( ' + spF(gSE.term) + ' ) ');
    $("#rec-results").css("background-color", "#ffffff").empty(); 
    var jqxhr = $.get(sUrl, function() {
      var ssu = 'success findrecords'; 
    })
    .done(function(data) { 
        //spinner.stop();
        //$("#rec-results").css("background-color", "white");
        console.log('-->> '+dx.getTime());
        if (typeof(data) == "object" ) {
          var dres = data;
        } else {
          var dres = JSON.parse(data);
        }
        
        gSRA = dres.success.data;
        gFRHdr.resCount = dres.success.hits;
        gFRHdr.recRtn = gSRA.length;
        gFRHdr.nextPage = dres.success.next_page;

        if ( gSRA.length > 0 ) {
          findTemplate(page);
        } else {
          $("#cb-title").append(' - No records found </br>');
          $("#cb").show();
          $("#widget-box").hide();

        }
      
    });

  } else {
    findTemplate(page);
  }

  if ( init == true) {
    facetPub();
    facetSet();
    facetDict();
    init = false;
  }

}

function spF(x) {

  var fi = '<span class="spf">'+x+'</span>';
  return fi;

}

function findTemplate(page) {

  var gSp = page*pgSize;
  var displaying = gSp + pgSize;

  $("#cb").show();
  $("#widget-box").hide();
  var srx = '';
  if ( gSE.term ) { srx = 'Term '+ spF(gSE.term) }
  if ( gSE.pubname ) { srx = srx + ' Journal '+spF(gSE.pubname) }
  if ( gSE.pubname_like  ) { srx = srx + ' Journal* '+spF(gSE.pubname_like) }
  if ( gSE.title ) { srx = srx + ' Title '+spF(gSE.title) }
  if ( gSE.title_like  ) { srx = srx + ' Title* '+spF(gSE.title_like) }
  if ( gSE.lastname ) { srx = srx + ' Author '+ spF(gSE.firstname + ' ' +gSE.lastname) }

  $("#cb-title").html("Search Results for ( " + srx + " )</br>Displaying "+gSp+'-'+displaying +" of records: "+ gFRHdr.resCount)
    .css("height", "16px" )
    .css("padding","4px 4px")
    .css("color", "#222222")
    .css("margin", "4px")
    .css("font-size", "14px")
    .css("font-weight", "bold");

  var prv = $('<button class="arrow-button" id="pgPrev" onclick="pager(this)"> &lt; </button>');
  var pcnt = $('<span class="dijitTitlePaneTextNode" style="margin:5px" id="pgCnt">Page ' + sPage + '</span>');
  var pnxt = $('<button class="arrow-button" id="pgNext" onclick="pager(this)"> &gt; </button></br>');

  $("#cb-page").empty().css("margin-left","40px");
  $("#cb-page").append(prv);
  $("#cb-page").append(pcnt);
  $("#cb-page").append(pnxt);
  $("#cb-page").show();
  
  $("#rec-results").css("background-color", "#ffffff").empty(); 
  if ( gSRA.length > gSp ) {
    if ( gSRA.length > gSp+pgSize ) { 
      var mr = gSp+pgSize 
    } else {
      var mr = gSRA.length;
    }
    for (var i = gSp; i < mr; i++) {
      var xtm = gSRA[i];
      var gs = xtm._gddid;           
      var ct = xRClean(xtm.title);
    
      if ( xtm.link ) {
        var linkz =  xtm.link;
      }

      var savd = localStorage.getItem('sr-'+gs);
      var bt = 'Save';
      var bc =  "#2191c2";

      if ( savd ) {
        bt = 'Clear';
        bc =  "#21b229";
      }
      var sBtn =   $('<a id="sr-'+i+'" class="res-tag" >'+bt+'</a>')
                    .css("font-size", "11px")
                    .css("margin", "2px")
                    .css("padding","2px 2px")
                    .css("background-color", bc)
                    .attr('onclick','saveMD(this);');

      var cInfo = $('<a id="'+i+'" >'+ct+'</a>')
                  .css("height", "16px" )
                  .css("margin", "2px")
                  .css("padding","2px 2px")
                  .css("font-size", "16px")
                  .css("font-weight", "bold")           
                  .css("cursor","pointer")
                  .attr('onclick','javascript:mdView(this);');
                  
      var gLinks = $('<div>').css("margin", "10px" )
              .css("width", "700px");
      if ( linkz ) {
      
        if ( linkz.length == 1 ) {
          var ltype =linkz[0].type;
          var lurl = linkz[0].url;
        
          var rlab = $('<span>Link: </span>')
                .css("padding","2px")
                .css("margin","2px")
                .css("font-size", "12px");
          var rLL = $('<a href="'+ lurl + '" class="resource-item" target="_blank">' + ltype + '  ' + lurl + '</a></br>');

          gLinks.append(rlab);
          gLinks.append(rLL);
        } else {
          var rlab = $('<span>Links: </span>')
                      .css("padding","2px")
                      .css("margin","2px")
                      .css("font-size", "12px");
          var drl = $('<select id="rld-'+i+'">')
                      .attr("onchange","window.open(this.options[this.selectedIndex].value);")
                      .attr("onfocus","this.selectedIndex= -1;")
                      .css("width","440px");
                    
          for (i in linkz ) {
        
            var ltype = linkz[i].type;
            var lurl =  linkz[i].url;

            var rldo = $('<option title="'+lurl+'" value="'+lurl+'">'+ltype+' '+ lurl+ '</option>');
            drl.append(rldo);

          }
          gLinks.append(rlab);
          gLinks.append(drl);
          
        }
      }

      var cJ = $('<span>Publisher ' + xtm.publisher+' Journal '+xRClean(xtm.journal)+' Vol: '+xtm.volume+' Pages: '+xtm.pages+'</span>')
                  .css("padding","5px 2px")
                  .css("margin","5px 5px")
                  .css("font-size", "12px");
    
      var idS = "";
      if ( xtm.identifier && xtm.identifier.length ) {
        for ( var k in xtm.identifier) {
          var rit =xtm.identifier[k].type;
          var rid =xtm.identifier[k].id;
          idS=idS+' '+rit+' : '+rid;
        }
      } else {
        console.log('missing id at '+i);
        idS = " Not Found";
      }
      var cGuid = $('</br><span>Identifier: '+idS+'</span>')
                  .css("padding","2px 2px")
                  .css("margin","5px 5px")
                  .css("font-size", "12px");

      var gCard = $('<div id ="gCard-' + i + '" class="g-item-card" />')
          .css("margin", "5px" )
          .css("padding","2px 2px")
          //.css("border","solid")
          .css("background-color", "white" )
          .hover(function() { 
              $(this).css("background-color", "powderblue"); 
              var mic =  'mid-'+$(this).attr("id").substr(6);              
            
            }, function() { 
                $(this).css("background-color", "white"); 
                var mic =  'mid-'+$(this).attr("id").substr(6);  
            });                    
      $(gCard).append(sBtn);        
      $(gCard).append(cInfo);
      $(gCard).append('</br>');
      $(gCard).append(cJ);

      $(gCard).append(cGuid);
      $(gCard).append(gLinks);
      $("#rec-results").append(gCard);           
    }
  } else {
    console.log('empty');
  }

}

function preview(o) {
    window.open(o.value);
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

  }

  function bactoSearch() {
    // add back btn event capture
    gMenuSel = 's'; 

    if ( $( "#pgjPrev" ).length ) {
      $( "#pgjPrev" ).remove();
      $( "#pgjPrev" ).remove();
      $( "#pgjCnt" ).remove();
    }

    $("#leftSearch").show();
    $("#cb").show();
    
    $("#widget-box").hide();
    $("#leftUserData").hide();
    $("#rightUserData").hide();

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

  function mdView(obj) {
    // view a single record
	  gMenuSel = 'r'; 
  	var guid = obj.id;
	
    $("#cb").hide();
  	$("#widget-box").show();
    $("#widget-view").empty();

    $("#leftUserData").hide();
    $("#rightUserData").hide();

    var mdv = gSRA[guid];
    
    if ( mdv ) {
      $("#widget-title").text('/ Dataset');
      recordTemplate(mdv);
    }
    
  }

  function topper() {
    window.scroll({
      top: 0, 
      left: 0, 
      behavior: 'smooth'
    });
  }

  // display detail record
  function recordTemplate(ro, gKey) {

    var gTitle = $('<div id="tidiv">')
          .css("margin", "4px" )
          .css("font-size", "16px" )
          .css("background-color", "slate" );
      
    gTitle.append('<h2 id="mdt" style="font-size: 16px; display: inline;" >'+ ro.title + '</h2>');

    var gResources =  $('<div id="resdiv">')
                  .css("margin", "2px" )
                  .css("background-color", "slate" );

    gResources.append('<h2 style="font-size: 14px; display: inline;">Resource Links</h2></br>');
    for ( var k in ro.link) {
        var rlink = ro.link[k].url;
        var rtype = ro.link[k].type;
        var rLL = $('<label class="md-label">'+rtype+'</label><a id="rn-'+k+'" href="'+rlink+'" class="resource-item" target="_blank">'+rlink+'</a>');
        gResources.append(rLL);
    }

    var gAuthor = $('<div id="mdAuthor" >')
                  .css("margin", "2px" )
                  .css("background-color", "slate" );

    gAuthor.append('<h2  style="font-size:14px; display: inline;" >Author</h2></br>');

    for ( var k in ro.author) {
        var rAuth = ro.author[k].name;
        var rAN = $('<a id="'+rAuth+'" onclick="authFind(this)" class="tag">' + rAuth + '</a>');
        gAuthor.append(rAN);
    }

    var gPubInfo = $('<div id="mdPub" >')
                  .css("margin", "2px" )
                  .css("background-color", "slate" );

    gPubInfo.append('<h2 style="font-size:14px; display: inline;" >Publication</h2></br>');
   
    gPubInfo.append('<label class="md-label">Publisher: </label><span id="pubname" class="md-value" >'+ ro.publisher + '</span></br>');
    var publink = $('<label class="md-label">Journal: </label><a id="'
    +ro.journal+'" onclick="pubFind(this)" class="tag">'+ro.journal+'</a></br>');
    gPubInfo.append(publink);
   
    gPubInfo.append('<label class="md-label">Type: </label><span id="mdtype" class="md-value" >'+ ro.type + '</span></br>');
    gPubInfo.append('<label class="md-label">Volume: </label><span id="mdvol" class="md-value" >'+ ro.volume + ' Number: ' + ro.number+'</span></br>');
    gPubInfo.append('<label class="md-label">Year: </label><span id="mdyear" class="md-value" >'+ ro.year + '</span></br>');
    gPubInfo.append('<label class="md-label">Pages: </label><span id="mdpages" class="md-value" >'+ ro.pages + '</span></br>');

    for ( var k in ro.identifier) {
      var rit = ro.identifier[k].type;
      var rid = ro.identifier[k].id;
      gPubInfo.append('<span id="ident-'+k+'" class="md-value" >'+ rit + ' : ' + rid +'</span></br>');
      if ( rit == 'doi') {
        var doix = rid;
      }
      if ( rit == 'docid') {
        var docid = rid;
      }

    }

    $("#widget-view").append('</br>');
    $("#widget-view").append(gTitle);
    $("#widget-view").append('</br>');
    $("#widget-view").append(gPubInfo);
    $("#widget-view").append('</br>');
    $("#widget-view").append(gAuthor);
    $("#widget-view").append('</br>');
    $("#widget-view").append(gResources);

    if ( gSE.term.length ) {
      var hla = getSnippets(doix);
    }

    if ( gSE.dict ) {
      if ( gSE.dict.length ) {
        var dta = getDictTerms(doix);
      }
    }
}

var getSnippets = function(doi) {

  var z = [];
  var sUrl = gdUrl+'/snippets?term='+gSE.term+'&doi='+doi;

  var jqxhr = $.get(sUrl, function() {
    var ssu = 'success snippet'; 
  })
  .done(function(data) { 

        if (typeof(data) == "object" ) {
          var dres = data;
        } else {
          var dres = JSON.parse(data);
        }
        
        var saz = dres.success.data[0];
        if ( saz.highlight ) {
          var hla = saz.highlight;
          var snipDiv = $('<div id="mdSnippet" >')
                  .css("margin", "2px" )
                  .css("padding", "5px")
                  .css("background", "slate" );

          snipDiv.append('<h2 style="font-size:14px; margin-bottom: 10px" >Text Highlights</h2>');
          //snipDiv.append('</br>');

          for (k in hla) {
            var hls = $('<span>[ '+ hla[k] +' ]</span>').css("margin-top", "10px");
            snipDiv.append(hls);
            snipDiv.append('</br>');
          }
          $("#widget-view").append('</br>');
          $("#widget-view").append(snipDiv);

        }
        
  });

}

var getDictTerms = function(doi) {

  var z = [];
  var sUrl = gdUrl+'/articles?dict='+gSE.dict+'&doi='+doi;

  var jqxhr = $.get(sUrl, function() {
    var ssu = 'success known terms'; 
  })
  .done(function(data) { 

        if (typeof(data) == "object" ) {
          var dres = data;
        } else {
          var dres = JSON.parse(data);
        }
        
        var ktr = dres.success.data[0];

        if ( ktr.known_terms ) {
          var kto = ktr.known_terms[0];
          var kta = kto[gSE.dict];
          if ( kta.length > 0 ) {
            var ktDiv = $('<div id="mdKnownTerms" >')
                  .css("margin", "2px" )
                  .css("padding", "5px")
                  .css("background", "slate" );
          
            ktDiv.append('<h2 style="font-size:14px; margin-bottom: 10px" >Known terms in <i>'+gSE.dict+'</i> dictionary</h2>');

            for (k in kta) {
              var kts = $('<a id="'+ kta[k]+'" onclick="ktFind(this)" class="tag">' +  kta[k] + '</a>');
            //var kts = $('<span>[ '+ kta[k] +' ]</span>').css("margin-top", "10px");
              ktDiv.append(kts);
  
            }
            $("#widget-view").append('</br>');
            $("#widget-view").append(ktDiv);

          }
          

        }
        
  });

}

var ktFind = function(o) {

  if (o.id) {
    $("#gSearchBox").val(o.id);

  }

}
  // In record view, parse the author name and add to search 
  var authFind = function(o) {
    if ( o.id ) {
      var pn = o.id.split(',');
      var ln = pn[0];
      var fn = pn[1].trim();
      if ( fn.indexOf('.') > 1 ) {
        fn = fn.slice(0,-3);
      }

      $("#gAFName").val(fn);
      $("#gALName").val(ln);
      $("#search-tool-div").show();

    }
  }

  var pubFind = function(o) {
    if ( o.id ) {
      $("#gPubName").val(o.id);
      $("#search-tool-div").show();
    }
  }


var showSpinner = function(o)  {
    var target = $("#rec-results");
    var spinner = new Spinner(opts).spin(target);
}


var wildcard = function(o) {

    console.log($(o).css("background") + ' A  -' + $(o).css("background-color") + '- B ' + $(o).html() );

    if ( $(o).css("background-color") == "rgb(9, 113, 178)" ) {
      $(o).css("background-color", "green");
      $(o).html('<i class="fa fa-star-of-life"></i>');
    } else {
      $(o).css("background-color", "#0971B2");
      $(o).html('<i class="fa fa-equals"></i>');

    }
}

// acquires the list of publishers
var facetPub = function(o) {
  var pUrl = gdUrl+'/publishers?all';

  var jqxhr = $.get(pUrl, function() {
    var ssu = 'success pubrecords'; 
  })
  .done(function(data) { 

        $("#rec-results").css("background-color", "white");
        if (typeof(data) == "object" ) {
          var dres = data;
        } else {
          var dres = JSON.parse(data);
        }
        gPub = dres.success.data;
        facetPubView();
        $("#PubList").hide();
  });

}

var optionView = function(o) {

  if ( o.id == 'opt-search-field') {
    $("#search-tool-div").toggle();
  } else if (  o.id == 'date-tool-div' ) {
    $("#date-select-div").toggle();
  } else if (  o.id == 'pubview' ) {
    $("#PubList").toggle();
  }  else if (  o.id == 'jrnView' ) {
     // not used currently
  } else if ( o.id =='setview') {
    $("#SetList").toggle();
  } else if ( o.id == 'dictview') {
    $("#DictList").toggle();
  }

}

// Publisher list functions
var facetPubView = function() {

  $(".npv-category").each(function() {
    $( this ).remove();
  })

  for (k in gPub) {
    var p = gPub[k].publisher;
    var j = gPub[k].journals;
    var a = gPub[k].articles;
    
    var pl = $('<a class="npv" id="'+p+'-'+j+'-'+a+'" style="cursor: pointer;" onclick="selectPub(this);" >' + p + '</a>')
        .css("font-size", "12px")
        .css("color", "#222222")
        .css("font-weight", "bold")
        .hover(function() { 
          var z = $( this ).attr('id').split('-');
          $( this ).text(z[0] + " Journals "+ z[1] + " Articles " + z[2]);  
          
        }, function() { 
          var z = $( this ).attr('id').split('-');
          $( this ).text(z[0]);  
        });

    var cax = $('<div class="npv-category" />')
    .css("margin-left", "11px")
    .css("display", "block")
    .css("height", "14px");
    cax.append(pl);
    $("#PubList").append(cax);
  }
  
}

var selectPub = function(o) {
  var otf = o.text;
  if ( otf.indexOf('Journal') > 0 ) {
      otf = otf.substr(0,otf.indexOf('Journal')-1)
  }
  if ( otf == gSE.publisher) {
    $(".npv").css("background-color","#ffffff");
    gSE.publisher = "";
  } else {
    var z = o.id.split('-');
    $(".npv").css("background-color","#ffffff");
    $(o).css("background-color", "yellow");
    gSE.publisher = z[0];
  }

  if ( gMenuSel == 'j' ) {
    journalView();
  }

}

var journalDict = function(o) {
  // not currently used - intended as journal typeahead 
  var pUrl = gdUrl+'/journals?all';
  var jqxhr = $.get(pUrl, function() {
    var ssu = 'success  journal records'; 
  })
  .done(function(data) { 
        if (typeof(data) == "object" ) {
          var dres = data;
        } else {
          var dres = JSON.parse(data);
        }
        gJrn = dres.success.data;       
  });
}

var jSort = function(o) {
  if ( o.text == 'Journal' ) {
    o.text = 'Articles';
  } else {
    o.text = 'Journal';
  }
  gjPage = 0;
  journalTemplate();
}

var searchJrn = function() {
  gJSearch = $("#jstext").val();
  gjPage = 0;
  journalTemplate();
  /*
  if ( jsx ) {
    gJSearch = jsx;
    gjPage = 0;
    journalTemplate();
  } else {
    gJSearch = "";
  }*/

}
// Journal functions that build that right panel catalog
var journalView = function(o) {

  $("#cb").hide();
  $("#widget-box").show();
  $("#widget-view").empty();
  $("#widget-title").text('/ Publication Catalog');
  gMenuSel = 'j';
  gjPage = 0;
  gJSearch = "";

  $("#search-tool-div").hide();
  $("#date-select-div").hide();
  $("#PubList").show();
  $("#SetList").hide();
  $("#DictList").hide();
  
  if ( !$( "#jsBtn" ).length ) {
    var sby = $('<span>Sort By </span>')
          .css("margin", "3px 5px");
    var sortBtn =  $('<a id="jsBtn" class="arrow-button" >Journal</a>')
          .css("font-size", "11px")
          .css("margin", "2px 4px")
          .css("padding","2px 2px")
          .attr('onclick','jSort(this);');

    var selb = $('<span>Journal Search </span>')
          .css("margin", "2px 5px");
    var selc = $('<span id="sjrc"></span>')
          .css("margin", "2px 2px");
    var sbi = $('<input class="form-control" placeholder="Text" size=20 id="jstext">')
              .css("margin", "2px 0px");
    var sbx = $('<button id="searchBtn" class="arrow-button"></button>')
              .css("height","20px" )  
              .css("margin", "0px 5px")
              .attr("onclick", "searchJrn()")
              .html('<i class="fa fa-search"></i>');
   
    $("#widget-view").append(selb);
    $("#widget-view").append(sbi);
    $("#widget-view").append(sbx);
    $("#widget-view").append(selc);
    $("#widget-view").append(sby);
    $("#widget-view").append(sortBtn);
  }

  if ( !$( "#pgjPrev" ).length ) {
    var prv = $('<button class="arrow-button" id="pgjPrev" onclick="jpager(this)"> &lt; </button>')
              .css("margin", "30px 2px");
    var pcnt = $('<span class="dijitTitlePaneTextNode" style="margin:5px" id="pgjCnt">Page ' + gjPage + '</span>');
    var pnxt = $('<button class="arrow-button" id="pgjNext" onclick="jpager(this)"> &gt; </button></br>');

    $("#widget-view").append(prv);
    $("#widget-view").append(pcnt);
    $("#widget-view").append(pnxt);
  }

  if ( gJrn.length > 0 ) {
    journalTemplate();
  } else {
    var pUrl = gdUrl+'/journals?all';
    var jqxhr = $.get(pUrl, function() {
      var ssu = 'success  journal records'; 
    })
    .done(function(data) { 
  
          if (typeof(data) == "object" ) {
            var dres = data;
          } else {
            var dres = JSON.parse(data);
          }

          gJrn = dres.success.data;
          journalTemplate();
         
    });

  }

}

function jpager(o) {
  if ( o.id == 'pgjPrev') {
    if ( gjPage > 0 ) {
      gjPage--;
      journalTemplate();
   
    }
  }
  if ( o.id == 'pgjNext') {
    gjPage++;
    journalTemplate();
 
  }

}

var journalTemplate = function() {

  $( "#pgjCnt").text('Page '+ gjPage);
  if ( $( "#JournalList" ).length ) {
    $( "#JournalList" ).remove();
  }

  var jldiv = $('<div class="dijitTitlePaneTextNode" id="JournalList"></div>');
  var jT = $('<table id="jptab"></table>');
  var jth = $('<tr><th style="text-align:left">Journal</th><th style="text-align:left">Publisher</th><th>Articles</th><th>Years Covered</th></tr>');
  jT.append(jth);

  jldiv.append(jT);
  $("#widget-view").append(jldiv);

  var sortby = $("#jsBtn").text();

  if ( gJrn.length ) {
    gJrn.sort(function(a, b){

      if ( sortby == 'Journal' ) {
        if(a.journal < b.journal ) { return -1; }
        if(a.journal > b.journal ) { return 1; }
      }
      if ( sortby == 'Articles' ) {
        if(a.articles < b.articles) { return 1; }
        if(a.articles > b.articles ) { return -1; }
      }
      return 0;
    })
  }
  
  //var jpstart = gjPage*50;
  //var jpd = 0;
  var jpStart = gjPage*25;
  var jpEnd = jpStart+25;
  var jpd = 0;
  var tc = 0;
  for (k in gJrn) {
    if ( gSE.publisher ) {
      if ( gSE.publisher == gJrn[k].publisher ) {
        if ( gJSearch ) { 
          if ( gJrn[k].journal.toUpperCase().indexOf(gJSearch.toUpperCase()) > -1 ) {
            var df = true;
          } else {
            var df = false;   
          }
        } else {
          var df = true;
        }
      } else { df = false; }
    } else {
      if ( gJSearch ) { 
        if ( gJrn[k].journal.toUpperCase().indexOf(gJSearch.toUpperCase()) > -1 ) {
          var df = true;
        } else {
          var df = false;   
        }
      } else {
        var df = true;
      }
      
    }

    //if ( df == true && jpd < 50 && k > jpstart ) {
    if ( df ) {
      jpd++;
      tc++;
      if ( jpd >= jpStart && jpd < jpEnd ) {
          var tr = $('<tr></tr>');
          var pl = $('<a class="jrnv" id="'+k+'" style="cursor: pointer;" onclick="selectJrn(this);" >' + gJrn[k].journal + '</a>')
              .css("font-size", "12px")
              .css("color", "#222222")
              .css("font-weight", "bold");

          var j = $('<td id="jj-'+k+'" class="jtd"></td>')
                  .css("width","240px");
          j.append(pl);

          var p = $('<td id="jp-'+k+'" class="jtd">'+gJrn[k].publisher+'</td>')
                  .css("width","160px");
          var a = $('<td id="ja-'+k+'" class="jtd">'+gJrn[k].articles+'</td>')
                  .css("width","60px");
          
          var e = gJrn[k].eissn;

          //var i = $('<td id="ji-'+k+'" class="jtd">'+gJrn[k].issn+'</td>').css("width","80px");
          var y = gJrn[k].years_covered;
          var ys = y[0] + '-'+ y[y.length-1] + ' '+ y.length;
          var yx = $('<td id="jy-'+k+'" class="jtd">'+ys+'</td>').css("width","80px");

          tr.append(j);
          tr.append(p);
          tr.append(a);
          tr.append(yx);
         // tr.append(i);
          jT.append(tr);
        }
    }

  }

  $("#sjrc").text(tc);

  jldiv.append(jT);
  $("#widget-view").append(jldiv);
  
}

var selectJrn = function(o) {
  var jo = gJrn[o.id];

  if ( jo.journal == gSE.pubname) {
    $(o).css("background-color","#ffffff");
    $("#gPubName").val("");
    gSE.pubname = "";
  } else {
    $(".jrnv").css("background-color","#ffffff");
    $(o).css("background-color", "yellow");
    $("#gPubName").val(jo.journal);
    $("#search-tool-div").show();
    gSE.pubname = jo.journal;
  }

}

// Dataset functions
var facetSet = function(o) {
  var pUrl = gdUrl+'/sets?all';

  var jqxhr = $.get(pUrl, function() {
    var ssu = 'success set records'; 
  })
  .done(function(data) { 

        //$("#rec-results").css("background-color", "white");
        if (typeof(data) == "object" ) {
          var dres = data;
        } else {
          var dres = JSON.parse(data);
        }
        gSet = dres.success.data;
        facetSetView();
        $("#SetList").hide();
  });

}

var facetSetView = function() {

  $(".nsv-category").each(function() {
    $( this ).remove();
  })

  if ( gSetInit ) {
    var pl = $('<a class="nsv" id="geothermal" style="cursor: pointer;" onclick="selectSet(this);" >geothermal</a>')
        .css("font-size", "12px")
        .css("color", "#222222")
        .css("background-color", "yellow")
        .css("font-weight", "bold");
    var cax = $('<div class="nsv-category" />')
        .css("margin-left", "11px")
        .css("display", "block")
        .css("height", "14px");
        cax.append(pl);
        $("#SetList").append(cax);
    gSetInit = false;
  }

  for (k in gSet) {
    var n = gSet[k].name;
    var j = gSet[k].description;
    var a = gSet[k].details;
    
    var pl = $('<a class="nsv" id="'+n+'" style="cursor: pointer;" onclick="selectSet(this);" >' + n + '</a>')
        .css("font-size", "12px")
        .css("color", "#222222")
        .css("font-weight", "bold");
    var cax = $('<div class="nsv-category" />')
        .css("margin-left", "11px")
        .css("display", "block")
        .css("height", "14px");
        cax.append(pl);
        $("#SetList").append(cax);
  }
}

function selectSet(o) {
  $(".nsv").css("background-color","#ffffff");
  if ( o.id == gSE.dataset) {
    gSE.dataset = "";
  } else {
    $(o).css("background-color", "yellow");
    gSE.dataset = o.id;
  }
}

// Dictionary facet functions
function facetDict() {

  var pUrl = gdUrl+'/dictionaries?all';
  pUrl = '/adept/getFilteredDictionaries';
  gDLType = 'Filtered';

  var jqxhr = $.get(pUrl, function() {
    var ssu = 'success dict records'; 
  })
  .done(function(data) { 

        if (typeof(data) == "object" ) {
          var dres = data;
        } else {
          var dres = JSON.parse(data);
        }
        gDictList = dres.success.data;
        gDictList.sort(function(a, b){
          if(a.name < b.name) { return -1; }
          if(a.name > b.name) { return 1; }
          return 0;
        })
        facetDictView();
        if ( !init ) {
          $("#DictList").hide();
        }
  });

}

function facetDictView() {
  $(".ndv-category").each(function() {
    $( this ).remove();
  })

  for (k in gDictList) {
    var i =  gDictList[k].dict_id;
    var n =  gDictList[k].name;
    var s =  gDictList[k].source;
    //var a = gSet[k].details;
    
    var pl = $('<a class="ndv" id="'+k+'-'+i+'" style="cursor: pointer;" onclick="selectDict(this);" >' + n + '</a>')
        .css("font-size", "12px")
        .css("color", "#222222")
        .css("font-weight", "bold");
    if ( init == true && n == gDefaultDict) {
      pl.css("background-color", "yellow");
      gSelDict.k = k;
      gSelDict.name = n;
      gSelDict.dict_id = i;
      var defd = pl;
    }
    var cax = $('<div class="ndv-category" />')
        .css("margin-left", "12px")
        .css("display", "block")
        .css("height", "14px");
        cax.append(pl);
        $("#DictList").append(cax);
  }

  if ( init == true && defd) {
    getDicTerms(defd);
  }

}

function selectDict(o) {
  // key, dict_id
  var da = o.id.split('-');
 
  $(".ndx-dm").css("background-color","#ffffff");
  $(".ndv").css("background-color","#ffffff");

  if ( da[0] == gSelDict.k ) {
    gSelDict.k = "";
    gSelDict.name = "";
    gSelDict.dict_id = "";
    gSelDict.count = 0;
    gDict = {};
    gSE.dict = "";
   
  } else {
    $(o).css("background-color", "yellow");
    gSelDict.k = da[0];
    gSelDict.name = gDictList[da[0]].name;
    gSelDict.dict_id = da[1];
    getDicTerms(o);
    gSE.dict = gDictList[da[0]].name;
  }    

}

function getDicTerms(o, cb) {

  gDict = {};
  var pUrl = gdUrl+'/dictionaries?dict_id='+gSelDict.dict_id+'&show_terms';
  var jqxhr = $.get(pUrl, function() {
    var ssu = 'success dict terms'; 
  })
  .done(function(data) { 
        if (typeof(data) == "object" ) {
          var dres = data;
        } else {
          var dres = JSON.parse(data);
        }
        if ( dres.success.data[0].term_hits) {
          gDict = dres.success.data[0].term_hits
          //gDict = Object.keys(gDict).sort();
          gSelDict.count = Object.keys(gDict).length;
          if ( cb ) {
            cb();
          }
          
        }
  });

}

function divToggle(o) {
    if ( $(o).css("display") == "none") { 
      $(o).css("display","block");
    } else {
      $(o).css("display","none");
    }
 }


function logmein(o, cb) {

  var un = $("#luser").val();
  var pw =  $("#lpass").val();

  var xUrl = '/adept/getToken?q='+un+'&p='+pw;

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
        gKey.agentRole = dres.role_id;
        $("#laname").text(un).css("font-size","12px")
            .css("font-family","Arial, Lucida Grande, sans-serif");
        $("#loginBtn").text("Logout");
        //$("#Cex").css("display","block");
        $("#loginDiv").hide();
        $("#myDataTab").show();
        $("#saveSetGrp").show();
        $("#saveSearchBtn").show();
        gUser.id = dres.user_id;
        gUser.role_id = dres.role_id;
        getCollections('login');
        cb();
        return;
    } else {
        gKey = {"x":"z","agentRole":"99"};
        cb();
    }
  });
  

}

function loginSelCol(o) {
  $("#selSavedSets").empty();

  if ( gCollections ) {
    for (k in gCollections) {
      var i =  gCollections[k].col_id;
      var n =  gCollections[k].col_name;
      var so = $('<option value="'+k+'-'+i+'">'+n+'</option>')
        .css("font-family", "calibri");
      if ( k == 0 ) {
        so.attr("selected","selected");
  
        gSelCollection.col_id = i;
        gSelCollection.col_k = parseInt(k);
        gSelCollection.col_name = n;
      }
      $("#selSavedSets").append(so);

    }
  } else {
    var so = $('<option value="default">Default</option>').css("font-family", "calibri");
    $("#selSavedSets").append(so);
  }
}

function getSavedSetOpt(o) {
  var ov = o.value.split('-');
  var k = ov[0];
  var t = ov[1];
  gSelCollection.col_id = t;
  gSelCollection.col_k = parseInt(k);
  gSelCollection.col_name = gCollections[k].col_name;

}

function logmeinx(o, cb) {
  var un = $("#luser").val();
  var pw =  $("#lpass").val();
  //var fcp = o.id;

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
      
        //for (var k in dres) {
        if ( dres.authtoken == dres.kv ) {
            gKey = {};
            gKey[dres.authtoken] = dres.kv;
			      gKey.agentRole = dres.agentrole;
            $("#laname").text(un).css("font-size","12px")
				.css("font-family","Arial, Lucida Grande, sans-serif");
            $("#loginBtn").text("Logout");
            //$("#Cex").css("display","block");
            $("#loginDiv").hide();
            cb();
            return;
        } else {
          gKey = {"x":"z","agentRole":"99"};
          cb();
        }
      });
}

var resetPw = function(o) {

  if ( $("#regDiv").is(":visible") ) {
    $("#regDiv").hide();
  } else {
    $("#regDiv").show();
    $("#loginDiv").hide();

    var rf = $("#regForm");

    var h = $('<h5>Have you forgotten your password ?</h5>')
                    .css("margin-top", "12px")
                    .css("color", "#0971B2")
                    .css("font-size", "18px")
                    .css("font-family","calibri")
                    .css("margin-bottom", "12px")
                    .css("text-align", "center");

    var labn = $('<span>Enter your email address below and press send to receive a password reset security code</span></br>')
        .css("font-family","calibri")
        .css("font-size", "16px");                
   var rfn = $('<input class="form-control" placeholder="First Name" id="rFname">').css("display","none");
   var rln = $('<input class="form-control" placeholder="Last Name" size="30" id="rLname">').css("display","none");

    var labc = $('<span >Contact Info </span></br>')
        .css("display","none")
        .css("font-family","calibri")
        .css("font-size", "12px");  
    var em = $('<input class="form-control" placeholder="Email" size="30" id="rEmail">');
    var org = $('<input class="form-control" placeholder="Institution" size="40" id="rOrg">')
        .css("display","none");
    var rdesc = $('<input class="form-control" placeholder="Purpose" size="40" id="rDesc">')
        .css("display","none");

    var labl = $('<span id="lofi">Enter the reset code</span></br>')
        .css("display","none")
        .css("font-family","calibri")
        .css("font-size", "14px");  
    var unx = $('<input class="form-control" placeholder="Enter reset code" id="resetCode">')
        .css("display","none");
    var pw = $('<input id="upass" class="form-control" placeholder="Create new password" type="password">')
        .css("display","none");
    var cpw = $('<input  id="cupass" class="form-control" placeholder="Confirm password" type="password">')
        .css("display","none");
    
    var pwi = $('<span id="pwcl">Password must contain minimum of 8 characters with a number & special character</span>')
              .css("display","none")
              .css("font-family","calibri")
              .css("font-size","12px");
              
    var dbtn = $('<input id="disCB" type="checkbox" value="true">')
          .css("display","none");
    var dsclm = $('<span>I have read and understand the Terms and Conditions of Use</span></br>')
          .css("display","none")
          .css("font-family","calibri")
          .css("font-size","11px");

    var regBtn = $('<a id="regBtn" class="tag" type="submit" onclick="forgotPW();" style="margin:4px;">Send</a>');
    var cancelBtn = $('<a id="cancelBtn" class="tag" type="submit" onclick="cancelReg();" style="margin:4px;">Cancel</a>');

    var bsp = $('<h5></h5>')
                    .css("margin-top", "8px")
                    .css("color", "#21b229")
                    .css("font-size", "16px")
                    .css("font-family","calibri")
                    .css("margin-bottom", "8px")
                    .css("text-align", "center");
    bsp.append(regBtn)
    bsp.append(cancelBtn);

    rf.append(h);
    rf.append(labn);
    rf.append(rfn);
    rf.append('</br>');
    rf.append(rln);
    rf.append('</br>');
    rf.append(labc);
    rf.append(em);
    rf.append('</br><span>You will receive an email with a security code valid for 60 minutes. </span></br>')
          .css("font-family","calibri")
          .css("font-size","14px");

    rf.append(org);
    rf.append('</br>');
    rf.append(rdesc);
    rf.append('</br>');
    rf.append(labl);
    rf.append(unx);
    rf.append('</br><span></span></br>')
          .css("font-family","calibri")
          .css("font-size","11px");
    rf.append(pw);
    rf.append('</br>');
    rf.append(cpw);

    rf.append(pwi);
    rf.append(dbtn);
    rf.append(dsclm);
    rf.append('</br>');
    rf.append(bsp);
    //rf.append(cancelBtn);
    
  }



}
var register = function(o) {

  if ( $("#regDiv").is(":visible") ) {
    $("#regDiv").hide();
  } else {
    $("#regDiv").show();
    $("#loginDiv").hide();

    var rf = $("#regForm");

    var h = $('<h5>NEW USER REGISTRATION</h5>')
                    .css("margin-top", "12px")
                    .css("color", "#0971B2")
                    .css("font-size", "16px")
                    .css("font-family","calibri")
                    .css("margin-bottom", "12px")
                    .css("text-align", "center");

    var labn = $('<span>Full Name </span></br>')
        .css("font-family","calibri")
        .css("font-size", "14px");                
    var rfn = $('<input class="form-control" placeholder="First Name" id="rFname">');
    var rln = $('<input class="form-control" placeholder="Last Name" size="30" id="rLname">');

    var labc = $('<span >Contact Info </span></br>')
        .css("font-family","calibri")
        .css("font-size", "14px");  
    var em = $('<input class="form-control" placeholder="Email" size="30" id="rEmail">');
    var org = $('<input class="form-control" placeholder="Institution" size="40" id="rOrg">');
    var rdesc = $('<input class="form-control" placeholder="Purpose" size="40" id="rDesc">');

    var labl = $('<span>Login Info</span></br>')
        .css("font-family","calibri")
        .css("font-size", "14px");  
    var unx = $('<input class="form-control" placeholder="User name" id="rUname">');
    var pw = $('<input id="upass" class="form-control" placeholder="Enter password" type="password">');
    var cpw = $('<input  id="cupass" class="form-control" placeholder="Confirm password" type="password">');
    
    var dbtn = $('<input id="disCB" type="checkbox">');
    var dsclm = $('<span id="stac">I have read and understand the Terms and Conditions of Use</span></br>')
          .css("font-family","calibri")
          .css("font-size","11px");

    var regBtn = $('<a id="regBtn" class="tag" type="submit" onclick="submitReg();" style="margin:4px;">Register</a>');
    var cancelBtn = $('<a id="cancelBtn" class="tag" type="submit" onclick="cancelReg();" style="margin:4px;">Cancel</a>');

    var bsp = $('<h5></h5>')
                    .css("margin-top", "8px")
                    .css("color", "#21b229")
                    .css("font-size", "16px")
                    .css("font-family","calibri")
                    .css("margin-bottom", "8px")
                    .css("text-align", "center");
    bsp.append(regBtn)
    bsp.append(cancelBtn);

    rf.append(h);
    rf.append(labn);
    rf.append(rfn);
    rf.append('</br>');
    rf.append(rln);
    rf.append('</br>');
    rf.append(labc);
    rf.append(em);
    rf.append('</br><span id="emsp">A one-time email confirmation will be sent to this address</span></br>')
          .css("font-family","calibri")
          .css("font-size","11px");

    rf.append(org);
    rf.append('</br>');
    rf.append(rdesc);
    rf.append('</br>');
    rf.append(labl);
    rf.append(unx);
    rf.append('</br><span>NOTE - Leave blank to use email for login id.</span></br>')
          .css("font-family","calibri")
          .css("font-size","11px");
    rf.append(pw);
    rf.append('<span id="cpe" style="display:none; color: red">Password does not match</span></br>');
    rf.append(cpw);
    rf.append('</br><span>Password must contain minimum of 8 characters with a number & special character</span></br>')
      .css("font-family","calibri")
      .css("font-size","11px");
    rf.append(dbtn);
    rf.append(dsclm);
    rf.append('</br>');
    rf.append(bsp);
    //rf.append(cancelBtn);
    
  }


}

var submitReg = function(o) {

  var f = $("#rFname").val();
  var l = $("#rLname").val();
  var e = $("#rEmail").val();
  var o = $("#rOrg").val();
  var d = $("#rDesc").val();
  var u = $("#rUname").val();
 
  var p = $("#upass").val();
  var cp = $("#cupass").val();
  var valid = true;

  if ( $("#disCB").is((":not(:checked)")) ) {
    $("#stac").text('REQUIRED - I have read the Terms and Conditions of Use').css("color","red");
    valid = false;
  } else {
    $("#stac").text('I have read the Terms and Conditions of Use').css("color","black");
  }

  if ( valid && p.length < 8 ) {
    $("#cpe").text("Invalid Password");
    $("#cpe").show();
    valid = false;
  } 

  if ( valid && p !== cp ) {
    $("#cpe").text("Password confirmation does not match");
    $("#cpe").show();
    valid = false;
  }

  if ( valid && e.indexOf('@') < 2 ) {
    $("#emsp").text("Valid email is required").css("color","red");
    valid = false;
  }

  if ( valid && !e ) {
   // $("#rEmail").css("color","red");
    $("#emsp").text("Valid email is required").css("color","red");
    valid = false;
  }

  //if ( valid && !e && !u ) {
  //  $("#rUname").css("color","red");
  //  valid = false;
  //}

  var rUrl = '/adept/createUser?em='+e+'&u='+u+'&p='+p+'&f='+f+'&l='+l+'&o='+o+'&d='+d;
  console.log(rUrl);

  if ( valid ) {
    var jqxhr = $.get(rUrl, function() {
      var ssu = 'success cu'; 
    })
    .done(function(data) { 
      console.log(data);

      $("#regForm").empty();
      $("#regDiv").hide();
    });
  }


}


var cancelReg = function(o) {
  $("#regForm").empty();
  $("#regDiv").hide();

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

var toggleLogin = function(o, cb) {
   
  if (  $(o).text() == "Logout" ) {
      gKey = { "a" : "b" };
      $("#laname").text("");
      $(o).text("Login");
     $("#Cex").css("display","none");
     $("#myDataTab").hide();
     $("#saveSetGrp").hide();
     $("#saveSearchBtn").hide();
      cb();
  } else {
    if ( $("#loginDiv").css("display") == "none") { 
      $("#loginDiv").css("display","block");
    
    } else {
      $("#loginDiv").css("display","none");
  
    }
  
  }

}


// My Data Functions

var dictionaryMan = function(o) {

  $("#rud-results").empty();

  var dmdiv = $('<div id="dmdiv"></div>') 
            .css('width','600px')
            .css('float','left')
            .css('display','block');

  var dmTx = $('<h4>Dictionary Manager</h4>').css('margin', '4px');
  dmdiv.append(dmTx);
  $("#rud-results").append(dmdiv);
  
  dictManTemplate()
  
}

function getDictList(o) {

  if ( o.id == 'adBtn' ) {
    gDLType = 'All';
    var pUrl = gdUrl+'/dictionaries?all';
    $("#ndBtn").hide();
    $("#edBtn").hide();
    $("#updBtn").hide();
  }

  if ( o.id == 'fdBtn' ) {
    gDLType = 'Filtered';
    var pUrl = '/adept/getFilteredDictionaries';
    $("#ndBtn").hide();
    $("#edBtn").hide();
    $("#updBtn").hide();
  }

  if ( o.id == 'sdBtn' ) {
    pUrl = '/adept/getLocalDictionaries?t='+ kmu(gKey)+'&u='+gUser.id;
    gDLType = 'Local Saved';
    $("#ndBtn").show();
    $("#edBtn").show();
    $("#updBtn").show();
  }
 
  var jqxhr = $.get(pUrl, function() {
    var ssu = 'success dict records'; 
  })
  .done(function(data) { 

        if (typeof(data) == "object" ) {
          var dres = data;
        } else {
          var dres = JSON.parse(data);
        }
        gDictList = dres.success.data;
        gDictList.sort(function(a, b){
          if(a.name < b.name) { return -1; }
          if(a.name > b.name) { return 1; }
          return 0;
        });
        showDictList();


  });
  
}

var dictManTemplate = function(o) {
 
  var adBtn = $('<a id="adBtn" class="res-tag" type="submit" onclick="getDictList(this);">All</a>')
        .css('font-size','12px')
        .css('background-color','rgb(33,145,194)')
        .css('margin','5px')
        .css('width','80px');
  var fdBtn = $('<a id="fdBtn" class="res-tag" type="submit" onclick="getDictList(this);" >Filtered</a>')
        .css('font-size','12px')
        .css('background-color','rgb(33,145,194)')
        .css('margin','5px')
        .css('width','80px');

  var sdBtn = $('<a id="sdBtn" class="res-tag" type="submit" onclick="getDictList(this);">Local</a>')
        .css('font-size','12px')
        .css('background-color','rgb(33,145,194)')
        .css('margin','5px')
        .css('width','80px');

  var ndBtn = $('<a id="ndBtn" class="res-tag" type="submit" onclick="newDict();" >New</a>')
        .css('font-size','12px')
        .css('display','none')
        .css('background-color','rgb(33,145,194)')
        .css('margin','5px')
        .css('width','80px');

  var udBtn = $('<a id="edBtn" class="res-tag" type="submit" onclick="uploadDict();" >Upload</a>')
        .css('font-size','12px')
        .css('display','none')
        .css('background-color','rgb(33,145,194)')
        .css('margin','5px')
        .css('width','80px');

  var rtBtn = $('<a id="updBtn" class="res-tag" type="submit" onclick="dicRequestTS();" >Request Test Set</a>')
        .css('font-size','12px')
        .css('display','none')
        .css('background-color','rgb(33,145,194)')
        .css('margin','5px')
        .css('width','120px');

  $("#dmdiv").append(adBtn);
  $("#dmdiv").append(fdBtn);
  $("#dmdiv").append(sdBtn);
  $("#dmdiv").append(ndBtn);
  $("#dmdiv").append(udBtn);
  $("#dmdiv").append(rtBtn);
  $("#dmdiv").append('</br>');

  var dldiv = $('<div id="dm-dl-div">'+gDLType+'</br></div>')
  //$("#dmdiv").append('<div id="dm-dl-div">'+gDLType+'</br></div>')
        .css('width','180px')
        .css('height','420px')
        .css("overflow-x","hidden")
        .css("overflow-y", "scroll")
        .css('float','left')
        .css('display','block');
  $("#dmdiv").append(dldiv);
  
  var dthead = $('<div id="dm-th-div">Terms</div>')
        .css('width','400px')
        .css('height','20px')
        .css('background-color','rgb(230, 230, 230)')
        //.css("overflow-x","hidden")
        //.css("overflow-y", "scroll")
        .css('float','right')
        .css('display','block');

  var dtdiv = $('<div id="dm-term-div"></div>')
        .css('width','400px')
        .css('height','400px')
        //.css('background-color','rgb(238, 238, 238)')
        .css('border','solid 1px')
        .css("overflow-x","hidden")
        .css("overflow-y", "scroll")
        .css('float','right')
        .css('display','block');

  $("#dmdiv").append(dthead);
  $("#dmdiv").append(dtdiv);

  if ( gDictList.length ) {
    showDictList();
  }

  //$("#rud-results").append(dmdiv);

}

function showDictList() {
 
  $(".ndx-dm").each(function() {
    $( this ).remove();
  })

  $("#dm-dl-div").text(gDLType);

  for (k in gDictList) {
    var i =  gDictList[k].dict_id;
    var n =  gDictList[k].name;
    var s =  gDictList[k].source;
    //var a = gSet[k].details;
    
    var pl = $('<a class="ndx-dm" id="'+k+'-'+i+'" onclick="selectDmDict(this);" >' + n + '</a>')
        .css("font-size", "12px")
        .css("color", "#222222")
        .css("cursor", "pointer")
        .css("font-weight", "bold");
    var cax = $('<div class="ndx-dm" />')
        .css("margin-left", "12px")
        .css("display", "block")
        .css("height", "14px");
        cax.append(pl);
        $("#dm-dl-div").append(cax);
  }
}

function selectDmDict(o) {
  // key, dict_id
  var da = o.id.split('-');
 
  $(".ndx-dm").css("background-color","#ffffff");
  $("#dm-term-div").empty();
  $("#dm-th-div").empty();
  //$("#dm-term-div").append('<h5>Terms</h5>');

  if ( da[0] == gSelDict.k ) {
    gSelDict.k = "";
    gSelDict.name = "";
    gSelDict.dict_id = "";
    gSelDict.count = 0;
    gDict = {};
    gSE.dict = "";
   
  } else {
    $(o).css("background-color", "yellow");
    gSelDict.k = da[0];
    gSelDict.name = gDictList[da[0]].name;
    gSelDict.dict_id = da[1];
    dmDicTerms(o);
  }
}

var dmDicTerms = function() {

  gDict = {};
  if ( gDLType == 'Local Saved') {
    var pUrl ='/adept/getLocalDicTerms?dict_id='+gSelDict.dict_id+'&show_terms';
  } else if ( gDLType == 'Filtered') {
    var pUrl = gdUrl+'/dictionaries?dict_id='+gSelDict.dict_id+'&show_terms';
  } else {
    var pUrl = gdUrl+'/dictionaries?dict_id='+gSelDict.dict_id+'&show_terms';
  }
  
  var jqxhr = $.get(pUrl, function() {
    var ssu = 'success dict terms'; 
  })
  .done(function(data) { 
        if (typeof(data) == "object" ) {
          var dres = data;
        } else {
          var dres = JSON.parse(data);
        }

        if ( dres.error ) {
          alert( 'Data Retrieval error ' + dres.error.message );
        } else if ( dres.success.data[0].term_hits) {
          gDict = dres.success.data[0].term_hits
          gSelDict.count = Object.keys(gDict).length;
          dmTermView();
        }
  });

}
var dmTermView = function() {

  $("#dm-term-div").empty();
  $("#dm-th-div").empty();
  var dmhdr = $('<span>'+gSelDict.name+' ( '+ gSelDict.count + ' )</span>').css("margin","4px");
  var nb = $('<a class="tag" id="ntBtn" onclick="newDictTerm(this);" >+</a>')
          .css("font-size", "12px")
          .css("color", "#222222")
          .css("font-weight", "bold");
  $("#dm-th-div").append(dmhdr);
  $("#dm-th-div").append(nb);

  var kt = $('<table id="kdt" style="border: none; background-color: white;"></table>');

  $("#dm-term-div").append(kt);
  var px = 0;
  if ( gSelDict.count > 500 ) {

  }
  Object.keys(gDict)
    .forEach(key => {
      var kr = $('<tr></tr>');
      var dxt = '<a id="kdel-'+key+'" class="sh-item" style="font-size:12px; font-family: calibri; margin: 2px 2px;" onclick="dmt-del(this);" > x </a>';
      var tx = $('<td></td>');
      tx.append(dxt);
      var tkt = $('<td width="50%" style="border: none; background-color: white;"></td>');
      var st = '<a id="dml-'+key+'" class="sh-item" style="font-size:12px; margin: 2px 2px;" onclick="dmt-Edit(this);" >'+key+'</a>'; 
      tkt.append(st);

      var tc = $('<td style="border: none; background-color: white;"><span style="font-size:12px; font-family: calibri">'+ gDict[key] +'</span></td>');

      if ( px < 500 ) {
        kr.append(tx);
        kr.append(tkt);
        kr.append(tc);
        kt.append(kr);
      } else {
        return
      }
      //if ( px < 500 ) { 
        //$("#dm-term-div").append(st);
      //}//    
      px++;
    });
    $("#dm-term-div").append(kt);
}

var newDict = function(o) {

  $("#dm-term-div").empty();
  var cni = $('<input class="form-control" placeholder="Dictionary Name" size=25 id="dictname">')
              .css("margin", "2px 0px");

  var csBtn = $('<a id="csBtn" class="res-tag" type="submit" onclick="createNewDict(this);">Save</a>')
              .css('font-size','12px')
              .css('background-color','rgb(33,145,194)')
              .css('margin','5px')
              .css('width','80px');
  
  $("#dm-term-div").append(cni);
  $("#dm-term-div").append('</br>');
  $("#dm-term-div").append(csBtn);

}

var createNewDict = function(o) {
  var dn = $("#dictname").val();
  var pUrl = '/adept/newLocalDictionary?t='+ kmu(gKey)+'&u='+gUser.id+'&d='+dn;

  var jqxhr = $.get(pUrl, function() {
    var ssu = 'success dict terms'; 
  })
  .done(function(data) { 
        if (typeof(data) == "object" ) {
          var dres = data;
        } else {
          var dres = JSON.parse(data);
        }
        var k = gDictList.length;
        var i = 0;
        var pl = $('<a class="ndx-dm" id="'+k+'-'+i+'" onclick="selectDmDict(this);" >' + dn + '</a>')
              .css("font-size", "12px")
              .css("color", "#222222")
              .css("cursor", "pointer")
              .css("font-weight", "bold");
        var cax = $('<div class="ndx-dm" />')
              .css("margin-left", "12px")
              .css("display", "block")
              .css("height", "14px");
        cax.append(pl);
        $("#dm-dl-div").append(cax);

        $("#dictname").remove();
        $("#csBtn").remove();
        if ( dres.success.data ) {
          gTestSets = dres.success.data;
          if ( gTestSets.length ) {
            showTestSetList();
          } else {
            // empty it out
          }
        }
  });
}

var testSetMan = function(o) {

  $("#rud-results").empty();

  var tsdiv = $('<div id="tsdiv"></div>');
  var tsTx = $('<h3>Test Set Manager</h3>');
  tsdiv.append(tsTx);
  $("#rud-results").append(tsdiv);
  tsTemplate();

}

var tsTemplate = function() {

  var tsnBtn = $('<a id="tsnBtn" class="res-tag" type="submit" onclick="tsNew(this);">New</a>')
    .css('font-size','12px')
    .css('background-color','rgb(33,145,194)')
    .css('margin','5px')
    .css('width','80px');

  var tsrBtn = $('<a id="tsrBtn" class="res-tag" type="submit" onclick="tsSync(this);">Sync Cyverse</a>')
      .css('font-size','12px')
      .css('background-color','rgb(33,145,194)')
      .css('margin','5px')
      .css('width','100px');

  var tldiv = $('<div id="tslist-div">Test Sets</br></div>')
            .css('width','180px')
            .css('height','420px')
            .css("overflow-x","hidden")
            .css("overflow-y", "scroll")
            .css('float','left')
            .css('display','block');
  
  var tsdv = $('<div id="ts-detail-div"></div>')
            .css('width','400px')
            .css('height','400px')
            //.css('background-color','rgb(238, 238, 238)')
            .css("border","solid 1px")
            .css("overflow-x","hidden")
            .css("overflow-y", "scroll")
            .css('float','left')
            .css('display','block');

  $("#tsdiv").append(tsnBtn);
  $("#tsdiv").append(tsrBtn);
  $("#tsdiv").append('</br>');
  $("#tsdiv").append(tldiv);
  $("#tsdiv").append(tsdv);

  getTestSets();
  
}

var getTestSets = function() {
 
  var pUrl ='/adept/getTestSets?t='+ kmu(gKey) +'&u='+gUser.id;

  var jqxhr = $.get(pUrl, function() {
    var ssu = 'success dict terms'; 
  })
  .done(function(data) { 
        if (typeof(data) == "object" ) {
          var dres = data;
        } else {
          var dres = JSON.parse(data);
        }

        if ( dres.success.data ) {
          gTestSets = dres.success.data;
          if ( gTestSets.length ) {
            showTestSetList();
          } else {
            // empty it out
          }
        }

  });

}

var showTestSetList = function() {

  $(".tsx-dm").each(function() {
    $( this ).remove();
  })

  $("#tslist-div").text(gDLType);

  for (k in gTestSets) {
    var t =  gTestSets[k].ts_id;
    var c =  gTestSets[k].col_id;
    var n =  gTestSets[k].ts_name;
    //var s =  gDictList[k].source;
    //var a = gSet[k].details;
    
    var pl = $('<a class="tsx-dm" id="'+k+'-'+t+'" onclick="selectTestSet(this);" >' + n + '</a>')
        .css("font-size", "12px")
        .css("color", "#222222")
        .css("cursor", "pointer")
        .css("font-weight", "bold");
    var cax = $('<div class="tsx-dm" />')
        .css("margin-left", "12px")
        .css("display", "block")
        .css("height", "14px");
        cax.append(pl);
        $("#tslist-div").append(cax);
  }

}

var selectTestSet = function(o) {

  var tid = o.id.split('-');
  var k = tid[0];
  var t = tid[1];

  $("#ts-detail-div").empty();

  var tsn = $('<span>Name: '+gTestSets[k].ts_name+'</span>');
  var tsu = $('<span>Url: '+gTestSets[k].ts_url+'</span>');

  $("#ts-detail-div").append(tsn);
  $("#ts-detail-div").append('</br>');
  $("#ts-detail-div").append(tsu);

}

var tsCyverseSync = function(o) {

}

var appMan = function(o) {

  $("#rud-results").empty();

  var aphdr = $('<div id="app-hdr-div"></div>');
  var apdiv = $('<div id="app-man-div"></div>');

  var apTx = $('<h5>Application Manager</h5>');
  var naBtn = $('<a id="naBtn" class="res-tag" type="submit" onclick="newApplication();" >New</a>')
        .css('font-size','12px')
        .css('background-color','rgb(33,145,194)')
        .css('margin','5px')
        .css('width','80px');

  var eaBtn = $('<a id="naBtn" class="res-tag" type="submit" onclick="editApplication();" >Edit</a>')
        .css('font-size','12px')
        .css('background-color','rgb(33,145,194)')
        .css('margin','5px')
        .css('width','80px');

  var raBtn = $('<a id="naBtn" class="res-tag" type="submit" onclick="regApplication();" >Register</a>')
        .css('font-size','12px')
        .css('background-color','rgb(33,145,194)')
        .css('margin','5px')
        .css('width','80px');

  aphdr.append(apTx);
  aphdr.append(naBtn);
  aphdr.append(eaBtn);
  aphdr.append(raBtn);

  $("#rud-results").append(aphdr);
  $("#rud-results").append(apdiv);
  getApps();

}

var getApps = function(o) {

  var pUrl ='/adept/getUserApps?t='+ kmu(gKey) +'&u='+gUser.id;

  var jqxhr = $.get(pUrl, function() {
    var ssu = 'success dict terms'; 
  })
  .done(function(data) { 
        if (typeof(data) == "object" ) {
          var dres = data;
        } else {
          var dres = JSON.parse(data);
        }

        if ( dres.success.data ) {
          gApps = dres.success.data;
          if ( gApps.length ) {
            showAppTemplate();
          } else {
            // empty it out
          }
        }

  });
}

var showAppTemplate = function() {

  $("#app-man-div").empty();
  
    var pt = $('<table id="apptab"></table>')
    var tr = $('<tr></tr>')
    var tab = $('<th width="10px"></th>');
    var ta = $('<th width="100px">Application</th>');
    var tb = $('<th width="70px">Type</th>');
    var tc = $('<th width="110px">Source</th>');
    var td = $('<th width="160px">Timestamp</th>');
    var te = $('<th width="70px">Status</th>');

    tr.append(tab);
    tr.append(ta);
    tr.append(tb);
    tr.append(tc);
    tr.append(td);
    tr.append(te);
    pt.append(tr);
  
    for (k in gApps) {
      var i =  gApps[k].ua_id;
      var n =  gApps[k].app_name;
      var t =  gApps[k].app_type;
      var l =  gApps[k].source_url;
      var c =  gApps[k].created;
      var s = gApps[k].state;
  
      var ak = gApps[k].app_key;
  
      var tr = $('<tr></tr>')
      var tab = $('<td id="ab-'+i+'"><input type="checkbox" id="cb='+i+'"></td>');
      var ta = $('<td id="a-'+i+'">'+n+'</td>');
      var tb = $('<td id="b-'+i+'">'+t+'</td>');
      var tc = $('<td id="c-'+i+'">'+l+'</td>');
      var td = $('<td id="d-'+i+'">'+c+'</td>');
      var te = $('<td id="d-'+i+'">'+s+'</td>');
      tr.append(tab);
      tr.append(ta);
      tr.append(tb);
      tr.append(tc);
      tr.append(td);
      tr.append(te);
      pt.append(tr);
  
    }
  
    $("#app-man-div").append(pt);


}


var collectionMan = function(o) {

  $("#rud-results").empty();

  var codiv = $('<div id="coldiv"></div>');
  var coTx = $('<h3>User Sets Data Management</h3>');
  codiv.append(coTx);
  $("#rud-results").append(codiv);
  colTemplate();
}

var colTemplate = function(o) {

  var cnBtn = $('<a id="cnBtn" class="res-tag" type="submit" onclick="colNew(this);">New</a>')
    .css('font-size','12px')
    .css('background-color','rgb(33,145,194)')
    .css('margin','5px')
    .css('width','80px');

  var dcBtn = $('<a id="dcBtn" class="res-tag" type="submit" onclick="deleteCollection(this);">Delete</a>')
    .css('font-size','12px')
    .css('background-color','rgb(33,145,194)')
    .css('margin','5px')
    .css('width','80px');

  var rtBtn = $('<a id="rtBtn" class="res-tag" type="submit" onclick="colrequestTS(this);">Request Test Set</a>')
    .css('font-size','12px')
    .css('display', 'none')
    .css('background-color','rgb(33,145,194)')
    .css('margin','5px')
    .css('width','120px');

  var clldiv = $('<div id="colist-div"></div>')
            .css('width','180px')
            .css('height','420px')
            .css("overflow-x","hidden")
            .css("overflow-y", "scroll")
            .css('float','left')
            .css('display','block');

  var clsdiv = $('<div id="col-search-div"></div>')
            .css('width','520px')
            .css('height','400px')
            //.css('background-color','rgb(238, 238, 238)')
            .css('border','solid 1px')
            .css("overflow-x","hidden")
            .css("overflow-y", "scroll")
            .css('float','left')
            .css('display','block');

  $("#coldiv").append(cnBtn);
  $("#coldiv").append(dcBtn);
  $("#coldiv").append(rtBtn);
  $("#coldiv").append('</br>');
  $("#coldiv").append(clldiv);
 
  $("#coldiv").append(clsdiv);

  getCollections('template');

}

var colrequestTS = function(o) {
  // send to Geo Deep Dive

}

var colNew = function() {
  // create new collection
  $("#col-search-div").empty();
  var cni = $('<input class="form-control" placeholder="Set Name" size=25 id="colname">')
              .css("margin", "2px 0px");

  var csBtn = $('<a id="csBtn" class="res-tag" type="submit" onclick="createNewCollection(this);">Save</a>')
              .css('font-size','12px')
              .css('background-color','rgb(33,145,194)')
              .css('margin','5px')
              .css('width','80px');
  
  $("#col-search-div").append(cni);
  $("#col-search-div").append('</br>');
  $("#col-search-div").append(csBtn);

}

var createNewCollection = function(o) {
  var cn = $("#colname").val();
  var pUrl = '/adept/newCollection?t='+kmu(gKey)+'&u='+gUser.id+'&c='+cn;

  var jqxhr = $.get(pUrl, function() {
    var ssu = 'success add collection'; 
  })
  .done(function(data) { 
        if (typeof(data) == "object" ) {
          var dres = data;
        } else {
          var dres = JSON.parse(data);
        }

        if ( dres.success ) {
          //gCollections = dres.success;
          //if ( gCollections.length ) {
          getCollections('template');
        } else {
            // empty it out
          
        }

  });

}

var getCollections = function(o) {

  var pUrl ='/adept/getCollections?t='+ kmu(gKey) +'&u='+gUser.id;

  var jqxhr = $.get(pUrl, function() {
    var ssu = 'success collections'; 
  })
  .done(function(data) { 
        if (typeof(data) == "object" ) {
          var dres = data;
        } else {
          var dres = JSON.parse(data);
        }

        if ( dres.success.data ) {
          gCollections = dres.success.data;
          if ( gCollections.length ) {
            if ( o == 'template') {
              showCollectionList();
              loginSelCol();
            } else if ( o == 'login' ) {
              loginSelCol();
            }
           
          } else {
            // empty it out
          }
        }

  });
}

var showCollectionList = function() {

  $(".clx-dm").each(function() {
    $( this ).remove();
  })

  //$("#colist-div").text('Sets');
  $("#col-search-div").empty();

  for (k in gCollections) {
    var i =  gCollections[k].col_id;
    var n =  gCollections[k].col_name;
 
    var pl = $('<a class="clx-dm" id="'+k+'-'+i+'" onclick="selectCollection(this);" >' + n + '</a>')
        .css("font-size", "14px")
        .css("color", "#222222")
        .css("cursor", "pointer")
        .css("font-weight", "bold");

    var cax = $('<div class="clx-dm" />')
        .css("margin-left", "14px")
        .css("display", "block")
        .css("height", "14px");
       
        cax.append(pl);
        $("#colist-div").append(cax);
  }

}

var deleteCollection = function(o) {

  if ( gSelCollection.col_id ) {
    var pUrl ='/adept/deleteCollection?t='+ kmu(gKey) +'&u='+gUser.id+'&c='+gSelCollection.col_id;
    var jqxhr = $.get(pUrl, function() {
      var ssu = 'success collections'; 
    })
    .done(function(data) { 
      if (typeof(data) == "object" ) {
        var dres = data;
      } else {
        var dres = JSON.parse(data);
      }
      getCollections('template');
    });

  } else {
    alert('You have selected a Collection Set to delete ');
  }


}

var selectCollection = function(o) {

  var cid = o.id.split('-');
  var k = cid[0];
  var t = cid[1];

  $(".clx-dm").each(function() {
    $( this ).css("background-color", "#ffffff");
  });

  if ( t == gSelCollection.col_id ) {
    gSelCollection.col_id = '';
    $(o).css("background-color", "#ffffff");
    $("#col-search-div").empty();
    $("#rtBtn").hide();
  } else {
    $(o).css("background-color", "yellow");
    $("#col-search-div").empty();
    gSelCollection.col_id = t;
    gSelCollection.col_k = parseInt(k);
    gSelCollection.col_name = gCollections[k].col_name;
    $("#rtBtn").show();
    if ( gCollections[k].search_set ) {
      $("#col-search-div").append('<b>Searches</b></br>');
      for (z in  gCollections[k].search_set ) {
        var i = gCollections[k].search_set[z].cs_id;
        var n = gCollections[k].search_set[z].col_desc;
        var u = gCollections[k].search_set[z].search_url;
        var c = gCollections[k].search_set[z].rec_count;
        var jst = JSON.parse(u);
        var pstr = '';
        var mStr = '';
        Object.keys(jst).forEach(key => {
          //if ( key != 'term' ) {
          //  mStr = + 'Search <b>' + jst[key] + '</b> ( ' + c + ' )';
         // }
          pstr = pstr + ' <b>' + key + '</b> ' + jst[key];
        });

        //var csx = $('<a onclick="delSetSearch(this)" id="ds-'+i+'">x</a>');
        var csx = $('<i class="fa fa-trash-alt" id="ds-'+i+'" onclick="delSetSearch(this)"></i>')
          .css("margin","3px;")
          .css("font-size", "12px;")
          .css('color','rgb(33,145,194)');
        var csn = $('<span  id="sid-'+i+'">'+pstr+' ( '+c+' )</span>');
        $("#col-search-div").append(csx);
        $("#col-search-div").append(csn);
        $("#col-search-div").append('</br>');
      }
    }

    if ( gCollections[k].record_set ) {
      $("#col-search-div").append('<b>Records</b></br>');
      for (z in gCollections[k].record_set ) {
        //var i = gCollections[k].record_set[z].cr_id;
        var n = gCollections[k].record_set[z];
        var rsn = $('<span id="rid-'+z+'">DOI: '+n+'</span>');
        $("#col-search-div").append(rsn);
        $("#col-search-div").append('</br>');
      }
    }
  }
}

var saveSearchToCollection = function(u) {


  var z = {};
  Object.keys(gSE).forEach(key => {
    if ( gSE[key] ) {
      z[key] = gSE[key];
    }
  });

  var zu = JSON.stringify(z);
  var so = {};
  so.cs_id = 999;
  so.col_desc = z.term;
  so.search_url = zu;

  if ( gCollections[gSelCollection.col_k].search_set ) {
    gCollections[gSelCollection.col_k].search_set.push(so);
  } else {
    gCollections[gSelCollection.col_k].search_set = [];
    gCollections[gSelCollection.col_k].search_set.push(so);
  }
  
  var d = gSE.term;
  var i = gSelCollection.col_id;
  var c = gFRHdr.resCount;

  var pUrl ='/adept/newSearchInCollection?t='+ kmu(gKey) +'&i='+i+'&d='+d+'&c='+c+'&u='+zu;

  var jqxhr = $.get(pUrl, function() {
    var ssu = 'success collections'; 
  })
  .done(function(data) { 
        if (typeof(data) == "object" ) {
          var dres = data;
        } else {
          var dres = JSON.parse(data);
        }
        alert('Saved Search ' + d + ' in ' +gSelCollection.col_name);
      });

}

var saveRecordToCollection = function(d) {

  var i = gSelCollection.col_id;

  var pUrl ='/adept/newItemInCollection?t='+ kmu(gKey) +'&i='+i+'&d='+d;

  var jqxhr = $.get(pUrl, function() {
    var ssu = 'success collections'; 
  })
  .done(function(data) { 
        if (typeof(data) == "object" ) {
          var dres = data;
        } else {
          var dres = JSON.parse(data);
        }
        //alert('Saved Search ' + d + ' in ' +gSelCollection.col_name);
      });

}

var uploadMan = function(o) {

  $("#rud-results").empty();

  var updiv = $('<div></div>');
  var upTx = $('<h5>Upload Document</h5>');
  updiv.append(upTx);
  $("#rud-results").append(updiv);
  
}

var statusMan = function(o) {

  $("#rud-results").empty();

  var sthdr = $('<div id="stat-hdr-div"></div>');
  var stdiv = $('<div id="stat-man-div"></div>');
  var stTx = $('<h5>Process Transaction Log</h5>');

  var rsBtn = $('<a id="rsBtn" class="res-tag" type="submit" onclick="getProcLog(this);">Refresh</a>')
            .css('font-size','12px')
            .css('background-color','rgb(33,145,194)')
            .css('margin','5px')
            .css('width','80px');

  sthdr.append(stTx);
  sthdr.append(rsBtn);
  $("#rud-results").append(sthdr);
  $("#rud-results").append(stdiv);
  getProcLog();
}

var getProcLog = function(o) {

  var pUrl ='/adept/getProcessLog?t='+ kmu(gKey) +'&u='+gUser.id;

  var jqxhr = $.get(pUrl, function() {
    var ssu = 'success collections'; 
  })
  .done(function(data) { 
        if (typeof(data) == "object" ) {
          var dres = data;
        } else {
          var dres = JSON.parse(data);
        }

        if ( dres.success.data ) {
          gProcLog = dres.success.data;
          if ( gProcLog.length ) {
            showProcessLog();
           
          } else {
            // empty it out
          }
        }

  });

}

var showProcessLog = function() {

  $("#stat-man-div").empty();
  $(".cpl-dm").each(function() {
    $( this ).remove();
  })

  var pt = $('<table id="proctab"></table>')
  var tr = $('<tr></tr>')
  var ta = $('<th width="100px">Process</th>');
  var tb = $('<th width="70px">Type</th>');
  var tc = $('<th width="110px">Source</th>');
  var td = $('<th width="160px">Timestamp</th>');
  var te = $('<th width="70px">Status</th>');
  tr.append(ta);
  tr.append(tb);
  tr.append(tc);
  tr.append(td);
  tr.append(te);
  pt.append(tr);

  for (k in gProcLog) {
    var i =  gProcLog[k].pa_id;
    var n =  gProcLog[k].proc_name;
    var t =  gProcLog[k].proc_type;
    var l =  gProcLog[k].source;
    var c =  gProcLog[k].created;
    var s = gProcLog[k].state;

    var sid = gProcLog[k].set_id;
    var tsid = gProcLog[k].ts_id;
    var did = gProcLog[k].dict_id;

    var tr = $('<tr></tr>')
    var ta = $('<td id="a-'+i+'">'+n+'</td>');
    var tb = $('<td id="b-'+i+'">'+t+'</td>');
    var tc = $('<td id="c-'+i+'">'+l+'</td>');
    var td = $('<td id="d-'+i+'">'+c+'</td>');
    var te = $('<td id="d-'+i+'">'+s+'</td>');

    tr.append(ta);
    tr.append(tb);
    tr.append(tc);
    tr.append(td);
    tr.append(te);
    pt.append(tr);

  }

  $("#stat-man-div").append(pt);

}

var cosmosMan = function(o) {

  if ( gSelDict.dict_id == 47 & gDict ) {
    cosmosTemplate();
  } else {
    gSelDict.dict_id = 47;
    var o = {};
    var rc = getDicTerms(o, cosmosTemplate );
    //comsosTemplate();
  }
 
}

var cosmosTemplate = function() {
  $("#rud-results").empty();

  var stdiv = $('<div></div>');
  var stTx = $('<h5>COSMOS Links</h5>');
  stdiv.append(stTx);

  var sQ = $('<select id="selCosQry"></select>')
            .css("font-family","calibri")
            .css("font-weight","bold")
            .css("border-style","solid 1px")
            .css("border-color","rgb(132, 155, 165)")
            .css("background-color","rgb(208, 230, 240)")
            .css("margin","4px 4px");
  var k = 0;
  Object.keys(gDict)
    .forEach(key => {
      if ( k == 0 ) {
        var to = $('<option value="'+key+'" selected>'+key+' ( '+gDict[key]+' )</option>');  
      } else  {
        var to = $('<option value="'+key+'">'+key+' ( '+gDict[key]+' )</option>');
      }
      sQ.append(to);
    });
  
  var sQT = $('<select id="selCType" ></select>')
            .css("font-family","calibri")
            .css("font-weight","bold")
            .css("border-style","solid 1px")
            .css("border-color","rgb(132, 155, 165)")
            .css("background-color","rgb(208, 230, 240)")
            .css("margin","4px 4px");

  var fo = $('<option value="Figure" selected>Figure</option>');
  var to = $('<option value="Table" selected>Table</option>');
  var eo = $('<option value="Equation" selected>Equation</option>');

  sQT.append(fo);
  sQT.append(to);
  sQT.append(eo);

  var csBtn = $('<a id="cxBtn" class="res-tag" type="submit" onclick="gotoCosmosLink(this);">View</a>')
            .css('font-size','12px')
            .css('background-color','rgb(33,145,194)')
            .css('margin','5px')
            .css('width','80px');
                
  stdiv.append(sQ);
  stdiv.append(sQT);
  stdiv.append('</br>');
  stdiv.append(csBtn);

  $("#rud-results").append(stdiv);

}


var gotoCosmosLink = function(o) {

  var dst = $("#selCosQry").val();
  var qt = $("#selCType").val();

  var dst = encodeURIComponent(dst);
  var sUrl = 'https://xdd.wisc.edu/set_visualizer/sets/geothermal?query='+dst+'&type='+qt;
  window.open(sUrl);

}