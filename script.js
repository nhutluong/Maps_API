// JavaScript source code
var myMap;
var center;
var polygon;
//START UP MAP UPON INITIALIZATION 
function LoadMap() {

    //Loads the map
    myMap = new Microsoft.Maps.Map(document.getElementById('myMap'), {
        center: new Microsoft.Maps.Location(30.392834, -88.887085),
        zoom: 12
    });

    //Enables the search bar and sets up the zoom features
    myMap.setOptions({
        maxZoom: 15,
        minZoom: 5,
        showSearchBar: true
    });
}//end load map function

//CREATE POLYGON BASED ON CENTER 
function Polygon() {
    center = myMap.getCenter();
    polygon = new Microsoft.Maps.Polygon([
        new Microsoft.Maps.Location(center.latitude - 0.05, center.longitude - 0.05),
        new Microsoft.Maps.Location(center.latitude + 0.01, center.longitude - 0.05),
        new Microsoft.Maps.Location(center.latitude + 0.01, center.longitude + 0.05)], null
    );
        
    myMap.entities.push(polygon);
}//end function 

function Search() {

    Microsoft.Maps.loadModule('Microsoft.Maps.Search', function () {
        var searchManager = new Microsoft.Maps.Search.SearchManager(myMap);
        var input = document.getElementById("searchInput").value;

        var requestOptions = {
            bounds: map.getBounds(),
            where: input,
            callback: function (answer, userData) {
                map.setView({ bounds: answer.results[0].bestView });
                map.entities.push(new Microsoft.Maps.Pushpin(answer.results[0].location));
            }//end callback 
        };//end var 
        searchManager.geocode(requestOptions);
    });//end loadModule
}//end function

function GetDirections() {
    

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