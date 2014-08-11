importPackage(java.io);
importPackage(java.lang);
importPackage(java.net);


var httpget = function(u) {
    var connection = new URL(u).openConnection();
    connection.setConnectTimeout(0);

    var answer = new StringBuffer();
    var reader = new BufferedReader(new InputStreamReader(connection.getInputStream()));
    var line;
    while ((line = reader.readLine()) != null) {
        answer.append(line);
    }
    reader.close();

    return answer.toString("UTF-8");


};

exports = httpget;
