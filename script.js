// JavaScript source code

var myMap   = undefined;

function LoadMap() {

    //Loads the map
    var myMap = new Microsoft.Maps.Map(document.getElementById('myMap'), {
        center: new Microsoft.Maps.Location(30.392834, -88.887085),
        zoom: 12
    });

    //Enables the search bar and sets up the zoom features
    map.setOptions({
        maxZoom: 15,
        minZoom: 5,
        showSearchBar: true
    });

}//end load map function
