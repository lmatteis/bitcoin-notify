var apejs = require("apejs.js");
var select = require('select.js');

var httpget = require('./httpget.js');
var emailsend = require('./email.js');
var gzip = require('./gzip.js');

apejs.urls = {
    "/": {
        get: function(request, response, query) {
            var clientHtml = render("skins/index.html");
            return print(request, response).html(clientHtml);

        }
    },
    "/notify-changes": {
        get: function(request, response, query) {
            notifyChanges(request, response);
        }
    },
    "/subscribe" : {
        get: function(request, response) {
            
            var email = request.getParameter("email");
            var lat = request.getParameter("lat");
            var lon = request.getParameter("lon");
            var radius = request.getParameter("radius");

            if(email.equals("") || lat.equals("") ||  lon.equals("") || radius.equals("")) {
                return print(request, response).json({error: "Must fill in all parameters"});
            }

            // store user
            var user = { 
                type: 'user',
                email: ''+email, 
                lat: parseFloat(lat), 
                lon: parseFloat(lon), 
                radius: parseFloat(radius),
                firstNotification: true,
                date: new java.util.Date(),
                token: tokenGenerator()
            };

            // store user
            select("user")
                .add(user);

            return print(request, response).json({"msg": "You were successfully subscribed"});
        }
    },
    "/unsubscribe" : {
        get: function(request, response) {
            var email = request.getParameter('email');
            var token = request.getParameter('token');

            select('user')
                .find({ email: email, token: token })
                .del();
              
            return print(request, response).json({msg: "You were successfully unsuscribed"});
        }
    }
            
};


function notifyChanges(request, response) {
  
  var live = getLiveBitcoinObjAndString();
  var liveBitcoinObj = live[0];
  var liveBitcoinStr = live[1];
  
  var storedObj = getStoredObj();
  
  if(!storedObj.elements) { 
    storedObj.elements = [];
  }
  
  var diff = arrDiff(storedObj.elements, liveBitcoinObj.elements);
  
  // get users from db
  select("user")
    .find()
    .each(function() {
        
        // loop through all our users
        var user = this;
        var foundPoints = [];
        var localDiff = diff;
        
        if(user.firstNotification) { // send all the points in his radius
          localDiff = liveBitcoinObj.elements;
          
        }
        
        // loop through all our differences
        for(var x=0; x<localDiff.length; x++) {
          var point = localDiff[x];
          
          if(!point.tags || (point.tags && !point.tags['payment:bitcoin']) || !point.lat || !point.lon)
            continue; // ignoring relations and ways
          
          var distance = getDistanceFromLatLonInKm(user.lat, user.lon, point.lat, point.lon);
          
          if(distance <= user.radius) {
            // this point falls within the user's preferences
            foundPoints.push(point);          
          }
        }
        // send email with foundPoints to this user!
        if(user.email && foundPoints.length) {
          if(user.firstNotification) {
            sendEmail(user.email, "Bitcoin Around Me", emailContent(user, foundPoints, true), { htmlBody: emailContent(user, foundPoints, true) });

            // store!
            select("user")
                .find()
                .attr({ firstNotification: false });

          } else {
            sendEmail(user.email, "Bitcoin Around Me", emailContent(user, foundPoints, false), { htmlBody: emailContent(user, foundPoints, false) });
          }
        }
  
    });



    if(diff.length) { // there are differences!

        // store the new data
        var bytes = gzip.compress(liveBitcoinStr);

        var blob = new com.google.appengine.api.datastore.Blob(bytes);


        select("obj").add({
            content: blob,
            date: new java.util.Date()
        });
    }
  
}

function sendEmail(email, subject, content) {
    var from = {
        address: "guidobartu@gmail.com",
        personal: "Bitcoin Around Me"
    };
    var to = {
        address: email,
        personal: email
    };

    emailsend.send(from, to, subject, content); 

}

function getLiveBitcoinObjAndString() {
  var url = 'http://overpass.osm.rambler.ru/cgi/interpreter?data=[out:json];(node[%22payment:bitcoin%22=yes];%3E;way[%22payment:bitcoin%22=yes];%3E;relation[%22payment:bitcoin%22=yes];%3E;);out;';

  var response = httpget(url);
  
  // parse the JSON
  if(response) {
    var obj = JSON.parse(response);
    return [obj, response];
  } else {
    return [{}, ''];
  }
}

function getStoredObj() {
    var content = false;

    var query = new com.google.appengine.api.datastore.Query('obj');
    query = query.addSort("date", com.google.appengine.api.datastore.Query.SortDirection.DESCENDING);
    var datastoreService = DatastoreServiceFactory.getDatastoreService();
    var preparedQuery = datastoreService.prepare(query);

    var fetchOptions = FetchOptions.Builder.withDefaults();
    fetchOptions = fetchOptions.limit(1);


    var result = preparedQuery.asList(fetchOptions).toArray();
    for(var i=0; i<result.length; i++) {
        var decompressed = gzip.decompress(result[i].getProperty("content").getBytes());

        content = decompressed;
    }

  if(content) {
    try {
      return JSON.parse(content);
    } catch(e) { 
      return {}; 
    }
  } else {
    return {};
  }
}

function tokenGenerator() {
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

        for( var i=0; i < 8; i++ )
            text += possible.charAt(Math.floor(Math.random() * possible.length));

        return text;
}

function arrDiff(a1, a2) {
  var o1={}, o2={}, diff=[], i, len, k;

  for (i=0, len=a1.length; i<len; i++) { o1[a1[i].id] = a1[i]; }
  for (i=0, len=a2.length; i<len; i++) { o2[a2[i].id] = a2[i]; }
  
  // commented this because we only want new stuff
  //for (k in o1) { if (!(k in o2)) { diff.push(o1[k]); } }
  for (k in o2) { if (!(k in o1)) { diff.push(o2[k]); } }
  return diff;
}
function getDistanceFromLatLonInKm(lat1,lon1,lat2,lon2) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2-lat1);  // deg2rad below
  var dLon = deg2rad(lon2-lon1); 
  var a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ; 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  var d = R * c; // Distance in km
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI/180)
}

// simple syntax sugar
function print(request, response) {
    return {
        html: function(str) {
            if(str) {
                response.setContentType('text/html');
                response.getWriter().println(''+str);
            }
        },
        json: function(j) {
            if(j) {
                if(response == null) return;
                var jsonString = JSON.stringify(j);
                var callback = request.getParameter('callback');

                  jsonString = "" + callback + "(" + jsonString + ");";  

                response.setContentType("application/json");
                response.getWriter().println(jsonString);
                return jsonString;
            }
        }
    };
}

function emailContent(user, foundPoints, firstNotification) {
  var unsubscribeUrl = 'https://bitcoinaroundme.appspot.com/unsubscribe?email='+ user.email +'&token=' + user.token;

  if(firstNotification) {
    var emailStr = ['Grazie per esserti iscritto al servizio di Allerta BAM di Coin Capital.',
                    '',
                  'Siamo ancora in versione beta quindi segnalaci ogni anomalia che riscontri e provvederemo a migliorare il servizio.',
                  '',
                  'Con questa prima email ricevi la lista dei locali che accettano bitcoin come forma di pagamento nel raggio da te prescelto. Ogni nuovo locale che dovesse aggiungersi in Open Street Map verrà rilevato da BAM che ti invierà un allerta cosi rimarrai sempre aggiornato sui locali a te più vicini che accettano bitcoin.',
                  ''];
  } else {
    var emailStr = ['Ci sono nuovi locali che accettano bitcoin nelle tue vicinanze ecco i link per visualizzarli su OpenStreetMap:', 
                    ''];
  }
  var coordinateLink = 'http://www.openstreetmap.org/#map='+radiusToZoom(user.radius)+'/'+user.lat+'/'+user.lon;
  emailStr.push('Coordinate: <a href="'+coordinateLink+'">'+coordinateLink+'</a>');
  emailStr.push('Raggio: ' + user.radius +' km');
  emailStr.push('');

  for(var i=0; i<foundPoints.length; i++) {
    var point = foundPoints[i];
    var name = point.tags.name || point.id;
    emailStr.push('<a href="http://www.openstreetmap.org/node/'+point.id+'">'+name+'</a>');
  }
  
  emailStr.push('');

  emailStr.push('<a href="'+ unsubscribeUrl +'">unsubscribe</a>');
  
  return emailStr.join('<br>');
  
}

function radiusToZoom(radius){
    return Math.round(14-Math.log(radius)/Math.LN2);
}
