// JavaScript source code
var loadMap;
var center;
var polygon;
var pushpin;
var queryOptions, numResults;
var pageIdx = 0;



//init map 
function LoadMap() {
    //Loads the map
    loadMap = new Microsoft.Maps.Map(document.getElementById('myMap'), {
        navigationBarMode: Microsoft.Maps.NavigationBarMode.minified,
        supportedMapTypes: [Microsoft.Maps.MapTypeId.road, Microsoft.Maps.MapTypeId.aerial, Microsoft.Maps.MapTypeId.grayscale, Microsoft.Maps.MapTypeId.canvasLight]
    });

    pushpin = new Microsoft.Maps.Pushpin(loadMap.getCenter(), {
        icon: 'https://www.bingmapsportal.com/Content/images/poi_custom.png',
        anchor: new Microsoft.Maps.Point(12, 39)
    });
    loadMap.entities.push(pushpin);

//Load the Bing Spatial Data Services module.
Microsoft.Maps.loadModule('Microsoft.Maps.SpatialDataService', function () {
    //Create a query to get nearby data.
    queryOptions = {
        queryUrl: `https://spatial.virtualearth.net/REST/v1/data/Microsoft/PointsOfInterest?spatialFilter=nearby(40.83274904439099,-74.3163299560546935,5)&$filter=EntityTypeID%20eq%20'6000'&$select=EntityID,DisplayName,Latitude,Longitude,__Distance&$top=3&key=AgK1Pq8GNiNukYdk4HlGmik2p4TTD_6CtMBbybKu_gUWM3f5RrpmKgKtSqxacSAc`,
        top: 10,
        inlineCount: true,
        spatialFilter: {
            spatialFilterType: 'nearby',
            location: loadMap.getCenter(),
            radius: 10
        }
    };
    //Trigger an initial search.
    getNearByLocations();
});

}//end load map function

//CREATE POLYGON BASED ON CENTER 
function Polygon() {
    center = loadMap.getCenter();
    polygon = new Microsoft.Maps.Polygon([
        new Microsoft.Maps.Location(center.latitude - 0.02, center.longitude - 0.02),
        new Microsoft.Maps.Location(center.latitude + 0.01, center.longitude - 0.02),
        new Microsoft.Maps.Location(center.latitude + 0.01, center.longitude + 0.02)], null
    );
        
    loadMap.entities.push(polygon);
}//end function 

function getNearByLocations() {
    //Remove any existing data from the map.
    loadMap.entities.clear();

    //Update the query options to skip results based on the page index.
    queryOptions.skip = pageIdx * 10;
    Microsoft.Maps.SpatialDataService.QueryAPIManager.search(queryOptions, loadMap, function (data, inlineCount) {

        //Store the number of results available.
        numResults = inlineCount;
        if (data.length > 0) {
            //Calculate the start and end result index.
            var start = pageIdx * 10 + 1;
            var end = start + data.length - 1;
            document.getElementById('pageInfo').innerText = 'Results: ' + start + ' - ' + end + ' of ' + inlineCount + ' results';

            //Create a list of the results.
            var listHTML = ['<table>'], locations = [];
            for (var i = 0; i < data.length; i++) {

                //Create HTML for each line item in the list.
                //Add a column of index numbers.
                listHTML.push('<tr><td>', (start + i), ') </td>');

                //Create a link that calls a function, pass in the EntityID of a result.
                listHTML.push('<td><a href="javascript: void (0);" ', 'onclick="listItemClicked(\'', data[i].metadata.EntityID, '\');">', data[i].metadata.DisplayName, '</a></td>');

                //Create a column to display the distance to the location.
                listHTML.push('<td>', data[i].metadata.__Distance.toFixed(2), ' km(s)</td></tr>');

                //Add the result number to the pushpin.
                data[i].setOptions({ text: start + i + '' });
                locations.push(data[i].getLocation());
            }//end for

            listHTML.push('</table>');
            document.getElementById('printoutPanel').innerHTML = listHTML.join('');

            //Add results to the map.
            loadMap.entities.push(data);

            //Set the map view to show all the locations.
            //Add apadding to account for the pushpins pixel size.
            loadMap.setView({
                bounds: Microsoft.Maps.LocationRect.fromLocations(locations),
                padding: 30
            });
        }//end if
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

function pageBackwards() {
    if (pageIdx > 0) {
        pageIdx--;
        getNearByLocations();
    }//end if
}//end function

function pageForward() {
    //Ensure that paging does not exceed the number of results.
    if ((pageIdx + 1) * 10 < numResults) {
        pageIdx++;
        getNearByLocations();
    }//end if
}//end function