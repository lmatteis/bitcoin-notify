importPackage(java.io);
importPackage(java.lang);
importPackage(java.net);


var httpget = function(u) {
    var connection = new URL(u).openConnection();
    connection.setConnectTimeout(0);

    var inputStream = connection.getInputStream();

    var writer = new StringWriter();
    IOUtils.copy(inputStream, writer, "UTF-8");

    return writer.toString();

};

exports = httpget;
