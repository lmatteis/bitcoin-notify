(function() {
var $ = jQuery;
$(function() {
map = new OpenLayers.Map("demoMap");
map.addLayer(new OpenLayers.Layer.OSM());
var lonlat = new OpenLayers.LonLat(12.482520,41.892916).transform(new OpenLayers.Projection("EPSG:4326"),new OpenLayers.Projection("EPSG:900913"));


map.setCenter(lonlat);
map.zoomTo(8);


var circleLayer;

function createCircle() {
    var center = map.getCenter();

    var centerClone = center.clone();
    centerClone.transform(new OpenLayers.Projection("EPSG:900913"),new OpenLayers.Projection("EPSG:4326"));
    $('#lat_bitcoin').val(centerClone.lat);
    $('#lon_bitcoin').val(centerClone.lon);

    if(circleLayer) {
        map.removeLayer(circleLayer);
    }

    circleLayer = new OpenLayers.Layer.Vector("Overlay");
    var circle = OpenLayers.Geometry.Polygon.createRegularPolygon(
        new OpenLayers.Geometry.Point(center.lon, center.lat),
        $('#radius_bitcoin').val() * 1000, // meters
        40,
        0
    );
    var feature = new OpenLayers.Feature.Vector(circle);
    circleLayer.addFeatures([feature]);
    map.addLayer(circleLayer);
}
map.events.register("moveend", map, createCircle)

$('#radius_bitcoin').bind('input', function() {
    console.log(1);
    createCircle();
    
});

    var url = 'https://script.google.com/macros/s/AKfycbzhITVJkDLyAqXCvPPCnoHe8Wu-X74Z7GnXo3xveT-fFrCiiqPp/exec';

    $('#submit_bitcoin').submit(function(e) {
        e.preventDefault();
        e.stopPropagation();
        var $cont = $('#cont');
        $cont.text('Loading...');

        $.getJSON(url + '?callback=?', { 
            email: $('#email_bitcoin').val(), 
            lat: $('#lat_bitcoin').val(),
            lon: $('#lon_bitcoin').val(),
            radius: $('#radius_bitcoin').val()
        }, function(data) {
            $cont.html(data.msg || data.error);

        });
    });


});

})();
