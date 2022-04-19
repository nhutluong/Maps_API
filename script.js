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

function Polygon() {
    //Loads the map
    var myMap = new Microsoft.Maps.Map(document.getElementById('myMap'), {
        center: new Microsoft.Maps.Location(30.392834, -88.887085),
        zoom: 12
    });
    var center = map.getCenter();

    var polygon = new Microsoft.Maps.Polygon([

        new Microsoft.Maps.Location(center.latitude - 0.05, center.longitude - 0.05),
        new Microsoft.Maps.Location(center.latitude + 0.01, center.longitude - 0.05),
        new Microsoft.Maps.Location(center.latitude + 0.01, center.longitude + 0.05)], null);

    map.entities.push(polygon);
}//end draw polygon function


