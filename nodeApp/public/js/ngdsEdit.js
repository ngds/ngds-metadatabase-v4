/*
UI module for md Editing, new Contributions and Collections
*/

var edView = function (o) {

    if ( o ) {
        $("#leftSearch").hide();
        $("#cb").hide();

        $("#leftEdit").show();
        $("#rightEdit").show();

        $("#leftCollection").hide();
        $("#rightCollection").hide();

        lpTemplate();
                
    }

}

var lpTemplate = function(o) {

    $("#ed-l-widget").empty();

    var nBtn =   $('<a id="" class="res-tag" >New Record</a>')
                            .css("font-size", "11px")
                            .css("margin", "5px 5px")
                            .css("padding","2px 2px")
                            .css("background-color", "#2191c2")
                            .attr('onclick','newMD(this);');

    var eBtn =   $('<a id="" class="res-tag" >Edit</a>')
                            .css("font-size", "11px")
                            .css("margin", "5px 5px")
                            .css("padding","2px 2px")
                            .css("background-color", "#2191c2")
                            .attr('onclick','editMD(this);');

    
    var bBtn =   $('<a id="" class="res-tag" >Collection</a>')
                            .css("font-size", "11px")
                            .css("margin", "5px")
                            .css("padding","2px 2px")
                            .css("background-color", "#2191c2")
                            .attr('onclick','batchMD(this);');

   
    //$(selCol).selectmenu();
    var selColD = $('<datalist id="selCol">');
    var co = $('<option value="Midget">');
    var selCol = $('<input list="selCol" name="Col">');

    selColD.append(co);

    $("#ed-l-widget").append(nBtn);
    $("#ed-l-widget").append('<div id="newOpts"></div>');
    $("#ed-l-widget").append(eBtn);
    $("#ed-l-widget").append('</br>');
    $("#ed-l-widget").append(bBtn);
    $("#ed-l-widget").append('</br>');
    $("#ed-l-widget").append(selCol);
    $("#ed-l-widget").append(selColD);

}

var newMD = function() {

    // setup options
    var dlFormat = $('<datalist id="mdFormat">');
    var fO = $('<option value="ISO-19115">');
    dlFormat.append(fO);
    var selFor = $('<input list="mdFormat" name="selF">');

    var dlFtype = $('<datalist id="fType">');
    var ft0 = $('<option value="Short">');
    var ft1 = $('<option value="Full">');

    dlFtype.append(ft0);
    dlFtype.append(ft1);
    var selFtype = $('<input list="fType" name="selType">');
   
    var oBtn =  $('<a id="" class="res-tag" > EDIT > </a>')
                            .css("font-size", "11px")
                            .css("margin", "5px")
                            .css("padding","2px 2px")
                            .css("background-color", "#2191c2")
                            .attr('onclick','newEditConstructor(this);');
    
    $("#newOpts").append(selFor);
    $("#newOpts").append(dlFormat);
    $("#newOpts").append('</br>');
    $("#newOpts").append(selFtype);
    $("#newOpts").append(dlFtype);
    $("#newOpts").append('</br>');
    $("#newOpts").append(oBtn);

}

var newEditConstructor = function(o) {
    // this will allow db driven schemas' - static for now
    var p = $('<p>JUST TEST </p>');
    $("#editFrame").append(p);

}

var rpNewTemplate = function(o) {

}