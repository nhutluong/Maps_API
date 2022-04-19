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

const directionsButton = document.querySelector('#get-directions');
directionsButton.addEventListener('click', function () { GetDirections(); })

function GetDirections() {
    var myMap = new Microsoft.Maps.Map(document.getElementById('myMap'), {

        /* No need to set credentials if already passed in URL */
        center: new Microsoft.Maps.Location(30.392834, -88.887085),
        zoom: 12
    });

    Microsoft.Maps.loadModule('Microsoft.Maps.Directions', function () {
        var directionsManager = new Microsoft.Maps.Directions.DirectionsManager(map);

        // Set Route Mode to driving
        directionsManager.setRequestOptions({ routeMode: Microsoft.Maps.Directions.RouteMode.driving });
        var waypoint1 = new Microsoft.Maps.Directions.Waypoint({ address: 'Gulfport', location: new Microsoft.Maps.Location(30.369768, -88.887085) });
        var waypoint2 = new Microsoft.Maps.Directions.Waypoint({ address: 'Biloxi', location: new Microsoft.Maps.Location(30.392834, -89.09154) });
        directionsManager.addWaypoint(waypoint1);
        directionsManager.addWaypoint(waypoint2);

        // Set the element in which the itinerary will be rendered
        directionsManager.setRenderOptions({ itineraryContainer: document.getElementById('printoutPanel') });
        directionsManager.calculateDirections();
    });

}//end get directions function


