// JavaScript source code
var loadMap;
var center;
var polygon;
var pushpin;
var pushpins = [];
var queryOptions, numResults;
var pageIdx = 0;
var searchManager;
var drawingManager;
var directionsManager;
var locationInfo = [];
var tools, searchArea, pinLayer;
var watchId, userPin, routePath;
const displayDiv = document.querySelector('#display-search-results');

//Query URL to the NAVTEQ POI data source
var sdsDataSourceUrl = 'http://spatial.virtualearth.net/REST/v1/data/Microsoft/PointsOfInterest';


//init map 
function LoadMap() {
    //Loads the map
    loadMap = new Microsoft.Maps.Map(document.getElementById('myMap'), {
        center: new Microsoft.Maps.Location(30.3960, -88.8853),
        navigationBarMode: Microsoft.Maps.NavigationBarMode.minified,
        supportedMapTypes: [Microsoft.Maps.MapTypeId.road, Microsoft.Maps.MapTypeId.aerial, Microsoft.Maps.MapTypeId.grayscale, Microsoft.Maps.MapTypeId.canvasLight],
        zoom: 12
    });

    pushpin = new Microsoft.Maps.Pushpin(loadMap.getCenter(), {
        icon: 'https://www.bingmapsportal.com/Content/images/poi_custom.png',
        anchor: new Microsoft.Maps.Point(12, 39)
    });
    loadMap.entities.push(pushpin);

    //Load the DrawingTools module
    Microsoft.Maps.loadModule('Microsoft.Maps.DrawingTools', function () {
        //Create an instance of the DrawingTools class and bind it to the map.
        var tools = new Microsoft.Maps.DrawingTools(loadMap);

        //When the user presses 'esc', take the polygon out of edit mode and re-add to base map.
        document.getElementById('myMap').onkeypress = function (e) {
            if (e.charCode === 27) {
                tools.finish(searchArea);
            }
        };
        //Show the drawing toolbar and enable editting on the map.
        tools.showDrawingManager(function (manager) {
            //Store a reference to the drawing manager as it will be useful later.
            drawingManager = manager;
        });
        //When ever the polygon search area has changed, a new Location added, or is editted, do a search.
        Microsoft.Maps.Events.addHandler(tools, 'drawingChanged', findIntersectingData);
    });

    //Load the Bing Spatial Data Services module.
    Microsoft.Maps.loadModule('Microsoft.Maps.SpatialDataService', function () {
        //Add an event handler for when the map moves.
        Microsoft.Maps.Events.addHandler(loadMap, 'viewchangeend', returnQueryOptions);

        //Trigger an initial search.
        //getNearByLocations();
    });

    //Load the directions module.
    Microsoft.Maps.loadModule('Microsoft.Maps.Directions', function () {
        //Create an instance of the directions manager.
        directionsManager = new Microsoft.Maps.Directions.DirectionsManager(loadMap);

        //Specify where to display the route instructions.
        directionsManager.setRenderOptions({ itineraryContainer: '#directionsItinerary' });

        //Specify the where to display the input panel
        directionsManager.showInputPanel('directionsPanel');

        Microsoft.Maps.Events.addHandler(directionsManager, 'directionsUpdated', directionsUpdated);
    });

}//end load map function

function startTracking() {
    //Add a pushpin to show the user's location.
    userPin = new Microsoft.Maps.Pushpin(loadMap.getCenter(), { visible: false });
    loadMap.entities.push(userPin);

    //Watch the users location.
    watchId = navigator.geolocation.watchPosition(usersLocationUpdated);
}//end function
function usersLocationUpdated(position) {
    var loc = new Microsoft.Maps.Location(
        position.coords.latitude,
        position.coords.longitude);

    //Update the user pushpin.
    userPin.setLocation(loc);
    userPin.setOptions({ visible: true });

    //Center the map on the user's location.
    loadMap.setView({ center: loc });

    //Calculate a new route if one hasn't been calculated or if the users current location is further than 50 meters from the current route.
    if (!routePath || Microsoft.Maps.SpatialMath.distance(loc, routePath) > 50) {
        calculateRoute(loc, document.getElementById('detinationTbx').value);
    }
}//end function

function stopTracking() {
    // Cancel the geolocation updates.
    navigator.geolocation.clearWatch(watchId);

    //Remove the user pushpin.
    loadMap.entities.clear();
    clearDirections();
}//end function

function calculateRoute(userLocation, destination) {
    clearDirections();

    //Create waypoints to route between.
    directionsManager.addWaypoint(new Microsoft.Maps.Directions.Waypoint({ location: userLocation }));
    directionsManager.addWaypoint(new Microsoft.Maps.Directions.Waypoint({ address: destination }));

    //Calculate directions.
    directionsManager.calculateDirections();
}//end function

function directionsUpdated(e) {
    //When the directions are updated, get a polyline for the route path to perform calculations against in the future.
    var route = directionsManager.getCurrentRoute();

    if (route && route.routePath && route.routePath.length > 0) {
        routePath = new Microsoft.Maps.Polyline(route.routePath);
    }
}//end function

function clearDirections() {
    //Clear directions waypoints and display without clearing it's options.
    directionsManager.clearDisplay();

    var wp = directionsManager.getAllWaypoints();
    if (wp && wp.length > 0) {
        for (var i = wp.length - 1; i >= 0; i--) {
            this.directionsManager.removeWaypoint(wp[i]);
        }
    }

    routePath = null;
}//end function


function drawSearchArea() {
    //Complete any current drawing and complete a search for it.
    if (searchArea) {
        tools.finish(searchArea);
        findIntersectingData(searchArea);
        searchArea = null;
    }

    //Create a new polygon.
    tools.create(Microsoft.Maps.DrawingTools.ShapeType.polygon, function (s) {
        searchArea = s;
    });
}//end function

//Find all pushpins on the map that intersect with the drawn search area.
function findIntersectingData(searchArea) {
    //Ensure that the search area is a valid polygon, should have 4 Locations in it's ring as it automatically closes.
    if (searchArea && searchArea.getLocations().length >= 4) {
        //Get all the pushpins from the pinLayer.
        var pins = pinLayer.getPrimitives();

        //Clear any previously selected data.
        for (var i = 0; i < pins.length; i++) {
            pins[i].setOptions({ color: 'purple' });
        }

        //Using spatial math find all pushpins that intersect with the drawn search area.
        //The returned data is a copy of the intersecting data and not a reference to the original shapes, 
        //so making edits to them will not cause any updates on the map.
        var intersectingPins = Microsoft.Maps.SpatialMath.Geometry.intersection(pins, searchArea);

        //The data returned by the intersection function can be null, a single shape, or an array of shapes. 
        if (intersectingPins) {
            //For ease of usem wrap individudal shapes in an array.
            if (intersectingPins && !(intersectingPins instanceof Array)) {
                intersectingPins = [intersectingPins];
            }

            var selectedPins = [];

            //Loop through and map the intersecting pushpins back to their original pushpins by comparing their coordinates.
            for (var j = 0; j < intersectingPins.length; j++) {
                for (var i = 0; i < pins.length; i++) {
                    if (Microsoft.Maps.Location.areEqual(pins[i].getLocation(), intersectingPins[j].getLocation())) {
                        //Set the selected pin color to red.
                        pins[i].setOptions({ color: 'red' });

                        selectedPins.push(pins[i]);
                        break;
                    }
                }
            }

            //Return the pushpins that were selected.
            return selectedPins;
        }
    }

    return null;
}//end function

function returnQueryOptions() {
    var select = document.getElementById('menu').value;
    if (select == "gasstations") {
        getNearByGas();
    } else if (select == "restaurants") {
        getNearByRestaurant();
    } else if (select == "casinos") {
        getNearByCasino();
    } else if (select == "hospitals") {
        getNearByHospital
    } else if (select == "hotels") {
        getNearByHotel();
    } else if (select == "airport") {
        getNearByAirport();
    } else if (select == "banks") {
        getNearByBank();
    } else if (select == "transit") {
        getNearByTransit();
    } else if (select == "coffee") {
        getNearByCoffee();
    } else if (select == "grocerystores") {
        getNearByGrocery();
    } else {
        loadMap.entities.clear();
    }
}//end function

function getNearByGas() {
    //Remove any existing data from the map.
    loadMap.entities.clear();

    //Create a query to get nearby data.
    queryOptions = {
        queryUrl: sdsDataSourceUrl,
        spatialFilter: {
            spatialFilterType: 'nearby',
            location: loadMap.getCenter(),
            radius: 25
        },
        //Filter to retrieve Gas Stations.
        filter: new Microsoft.Maps.SpatialDataService.Filter('EntityTypeID', 'eq', 5540)
    };

    //Process the query.
    Microsoft.Maps.SpatialDataService.QueryAPIManager.search(queryOptions, loadMap, function (data) {
        //Add results to the map.
        loadMap.entities.push(data);
    });
}//end function

function getNearByRestaurant() {
    //Remove any existing data from the map.
    loadMap.entities.clear();

    //Create a query to get nearby data.
    queryOptions = {
        queryUrl: sdsDataSourceUrl,
        spatialFilter: {
            spatialFilterType: 'nearby',
            location: loadMap.getCenter(),
            radius: 25
        },
        //Filter to retrieve Gas Stations.
        filter: new Microsoft.Maps.SpatialDataService.Filter('EntityTypeID', 'eq', 5800)
    };

    //Process the query.
    Microsoft.Maps.SpatialDataService.QueryAPIManager.search(queryOptions, loadMap, function (data) {
        //Add results to the map.
        loadMap.entities.push(data);
    });
}//end function

function getNearByCasino() {
    //Remove any existing data from the map.
    loadMap.entities.clear();

    //Create a query to get nearby data.
    queryOptions = {
        queryUrl: sdsDataSourceUrl,
        spatialFilter: {
            spatialFilterType: 'nearby',
            location: loadMap.getCenter(),
            radius: 25
        },
        //Filter to retrieve Gas Stations.
        filter: new Microsoft.Maps.SpatialDataService.Filter('EntityTypeID', 'eq', 7985)
    };

    //Process the query.
    Microsoft.Maps.SpatialDataService.QueryAPIManager.search(queryOptions, loadMap, function (data) {
        //Add results to the map.
        loadMap.entities.push(data);
    });
}//end function

function getNearByHospital() {
    //Remove any existing data from the map.
    loadMap.entities.clear();

    //Create a query to get nearby data.
    queryOptions = {
        queryUrl: sdsDataSourceUrl,
        spatialFilter: {
            spatialFilterType: 'nearby',
            location: loadMap.getCenter(),
            radius: 25
        },
        //Filter to retrieve Gas Stations.
        filter: new Microsoft.Maps.SpatialDataService.Filter('EntityTypeID', 'eq', 8060)
    };

    //Process the query.
    Microsoft.Maps.SpatialDataService.QueryAPIManager.search(queryOptions, loadMap, function (data) {
        //Add results to the map.
        loadMap.entities.push(data);
    });
}//end function

function getNearByHotel() {
    //Remove any existing data from the map.
    loadMap.entities.clear();

    //Create a query to get nearby data.
    queryOptions = {
        queryUrl: sdsDataSourceUrl,
        spatialFilter: {
            spatialFilterType: 'nearby',
            location: loadMap.getCenter(),
            radius: 25
        },
        //Filter to retrieve Gas Stations.
        filter: new Microsoft.Maps.SpatialDataService.Filter('EntityTypeID', 'eq', 7011)
    };

    //Process the query.
    Microsoft.Maps.SpatialDataService.QueryAPIManager.search(queryOptions, loadMap, function (data) {
        //Add results to the map.
        loadMap.entities.push(data);
    });
}//end function

function getNearByAirport() {
    //Remove any existing data from the map.
    loadMap.entities.clear();

    //Create a query to get nearby data.
    queryOptions = {
        queryUrl: sdsDataSourceUrl,
        spatialFilter: {
            spatialFilterType: 'nearby',
            location: loadMap.getCenter(),
            radius: 25
        },
        //Filter to retrieve Gas Stations.
        filter: new Microsoft.Maps.SpatialDataService.Filter('EntityTypeID', 'eq', 6)
    };

    //Process the query.
    Microsoft.Maps.SpatialDataService.QueryAPIManager.search(queryOptions, loadMap, function (data) {
        //Add results to the map.
        loadMap.entities.push(data);
    });
}//end function

function getNearByBank() {
    //Remove any existing data from the map.
    loadMap.entities.clear();

    //Create a query to get nearby data.
    queryOptions = {
        queryUrl: sdsDataSourceUrl,
        spatialFilter: {
            spatialFilterType: 'nearby',
            location: loadMap.getCenter(),
            radius: 25
        },
        //Filter to retrieve Gas Stations.
        filter: new Microsoft.Maps.SpatialDataService.Filter('EntityTypeID', 'eq', 6000)
    };

    //Process the query.
    Microsoft.Maps.SpatialDataService.QueryAPIManager.search(queryOptions, loadMap, function (data) {
        //Add results to the map.
        loadMap.entities.push(data);
    });
}//end function

function getNearByTransit() {
    //Remove any existing data from the map.
    loadMap.entities.clear();

    //Create a query to get nearby data.
    queryOptions = {
        queryUrl: sdsDataSourceUrl,
        spatialFilter: {
            spatialFilterType: 'nearby',
            location: loadMap.getCenter(),
            radius: 25
        },
        //Filter to retrieve Gas Stations.
        filter: new Microsoft.Maps.SpatialDataService.Filter('EntityTypeID', 'eq', 4170)
    };

    //Process the query.
    Microsoft.Maps.SpatialDataService.QueryAPIManager.search(queryOptions, loadMap, function (data) {
        //Add results to the map.
        loadMap.entities.push(data);
    });
}//end function

function getNearByCoffee() {
    //Remove any existing data from the map.
    loadMap.entities.clear();

    //Create a query to get nearby data.
    queryOptions = {
        queryUrl: sdsDataSourceUrl,
        spatialFilter: {
            spatialFilterType: 'nearby',
            location: loadMap.getCenter(),
            radius: 25
        },
        //Filter to retrieve Gas Stations.
        filter: new Microsoft.Maps.SpatialDataService.Filter('EntityTypeID', 'eq', 9996)
    };

    //Process the query.
    Microsoft.Maps.SpatialDataService.QueryAPIManager.search(queryOptions, loadMap, function (data) {
        //Add results to the map.
        loadMap.entities.push(data);
    });
}//end function

function getNearByGrocery() {
    //Remove any existing data from the map.
    loadMap.entities.clear();

    //Create a query to get nearby data.
    queryOptions = {
        queryUrl: sdsDataSourceUrl,
        spatialFilter: {
            spatialFilterType: 'nearby',
            location: loadMap.getCenter(),
            radius: 25
        },
        //Filter to retrieve Gas Stations.
        filter: new Microsoft.Maps.SpatialDataService.Filter('EntityTypeID', 'eq', 5400)
    };

    //Process the query.
    Microsoft.Maps.SpatialDataService.QueryAPIManager.search(queryOptions, loadMap, function (data) {
        //Add results to the map.
        loadMap.entities.push(data);
    });
}//end function

function listItemClicked(entityId) {
    //When an item in the list is clicked, look up its pushpin by entitiyId.
    var shape, len = loadMap.entities.getLength();

    for (var i = 0; i < len; i++) {
        shape = loadMap.entities.get(i);
        if (shape.entity.EntityID == entityId) {
            //Center the map over the pushpin and zoom in.
            loadMap.setView({ center: shape.getLocation(), zoom: 15 });
            break;
        }//end if
    }//end for
}//end function

function storeLocationInfo(responseData) {
    //store the data from the api into an array
    locationInfo = [];
    for (var index = 0; index < responseData.resourceSets[0].resources.length; index++) {
        var name = responseData.resourceSets[0].resources[index].name;
        var address = responseData.resourceSets[0].resources[index].Address.formattedAddress;
        var phoneNumber = responseData.resourceSets[0].resources[index].PhoneNumber;
        var latitude = responseData.resourceSets[0].resources[index].geocodePoints[0].coordinates[0];
        var longitude = responseData.resourceSets[0].resources[index].geocodePoints[0].coordinates[1];
        locationInfo[index] = { name, address, phoneNumber, latitude, longitude };
    }//end for   
    printLocationInfo();
}//end function
function printLocationInfo() {
    //print the most prevalent to a text box above the map
    var infoString = "";
    displayDiv.innerHTML = "";
    for (var index = 0; index < locationInfo.length; index++) {
        infoString += index + 1 + ": ";
        infoString += "NAME: " + locationInfo[index].name + ", ";
        infoString += "ADDRESS: " + locationInfo[index].address + ", ";
        infoString += "PHONE NUMBER: " + locationInfo[index].phoneNumber + "<br/>";
        //infoString += "LATITUDE: " +locationInfo[index].latitude+", ";
        //infoString += "LONGITUDE: " + locationInfo[index].longitude+"<br/>";                 
    }//end for
    displayDiv.innerHTML = infoString;
    addPushpins();
}//end function

function addPushpins() {
    //remove any previous search pushpins  
    for (var i = 0; i < pushpins.length; i++) {
        loadMap.entities.remove(pushpins[i]);
    }
    //add current search pushpins to map
    for (var index = 0; index < locationInfo.length; index++) {

        var pushpin = new Microsoft.Maps.Pushpin({ latitude: locationInfo[index].latitude, longitude: locationInfo[index].longitude }, { title: locationInfo[index].name, text: `${index + 1}`, id: `pushpin${index}` });
        pushpins[index] = pushpin;
        loadMap.entities.push(pushpins[index]);
    }//end for 

    //set up a click event for each pushpin
    Microsoft.Maps.Events.addHandler(pushpins[0], 'click', function () { storePushpinLocation(0); });
    Microsoft.Maps.Events.addHandler(pushpins[1], 'click', function () { storePushpinLocation(1); });
    Microsoft.Maps.Events.addHandler(pushpins[2], 'click', function () { storePushpinLocation(2); });
    Microsoft.Maps.Events.addHandler(pushpins[3], 'click', function () { storePushpinLocation(3); });
    Microsoft.Maps.Events.addHandler(pushpins[4], 'click', function () { storePushpinLocation(4); });
    Microsoft.Maps.Events.addHandler(pushpins[5], 'click', function () { storePushpinLocation(5); });
    Microsoft.Maps.Events.addHandler(pushpins[6], 'click', function () { storePushpinLocation(6); });
    Microsoft.Maps.Events.addHandler(pushpins[7], 'click', function () { storePushpinLocation(7); });
    Microsoft.Maps.Events.addHandler(pushpins[8], 'click', function () { storePushpinLocation(8); });
    Microsoft.Maps.Events.addHandler(pushpins[9], 'click', function () { storePushpinLocation(9); });
    //for each pushpin make a click event
    //for (var index = 0; index < pushpins.length-1; index++) {
    //    var events = Microsoft.Maps.Events.addHandler(pushpins[index], 'click', function () { storePushpinLocation(index); });
    //}
    //events;
}//end function


function Search() {
    if (!searchManager) {
        //Create an instance of the search manager and perform the search.
        Microsoft.Maps.loadModule('Microsoft.Maps.Search', function () {
            searchManager = new Microsoft.Maps.Search.SearchManager(loadMap);
            Search()
        });
    } else {
        //Remove any previous results from the map.
        loadMap.entities.clear();

        //Get the users query and geocode it.
        var query = document.getElementById('searchTbx').value;
        geocodeQuery(query);
    }//end if
}//end function

function geocodeQuery(query) {
    var searchRequest = {
        where: query,
        callback: function (r) {
            if (r && r.results && r.results.length > 0) {
                var pin, pins = [], locs = [], output = 'Results:<br/>';

                for (var i = 0; i < r.results.length; i++) {
                    //Create a pushpin for each result. 
                    pin = new Microsoft.Maps.Pushpin(r.results[i].location, {
                        text: i + ''
                    });
                    pins.push(pin);
                    locs.push(r.results[i].location);

                    output += i + ') ' + r.results[i].name + '<br/>';
                }//end for

                //Add the pins to the map
                loadMap.entities.push(pins);

                //Display list of results
                document.getElementById('output').innerHTML = output;

                //Determine a bounding box to best view the results.
                var bounds;

                if (r.results.length == 1) {
                    bounds = r.results[0].bestView;
                } else {
                    //Use the locations from the results to calculate a bounding box.
                    bounds = Microsoft.Maps.LocationRect.fromLocations(locs);
                }//end if

                loadMap.setView({ bounds: bounds });
            }//end if
        },
        errorCallback: function (e) {
            //If there is an error, alert the user about it.
            alert("No results found.");
        }
    };

    //Make the geocode request.
    searchManager.geocode(searchRequest);
}//end function

function clearLocalStroage() {
    localStorage.clear();

}//end function
function updateLocalStorage() {
    //displays previous entries in local storage to a text box on the map
    var previousVisit = "";
    var jsonParse = "";
    var values = [], keys = Object.keys(localStorage), i = keys.length;
    while (i--) {

        values.push(localStorage.getItem(keys[i]));
    }//end while
    for (var index = 0; index < values.length; index++) {
        if (values[index][0] == "{") {
            jsonParse = JSON.parse(values[index]);
            previousVisit += `NAME: ${jsonParse.name}, PHONENUMBER: ${jsonParse.phoneNumber}, ADDRESS: ${jsonParse.address}, LATITUDE: ${jsonParse.latitude}, LONGITUDE: ${jsonParse.longitude}` + "<br/>";
        }//end if
    }//end for
    storageDiv.innerHTML = previousVisit;
}//end function