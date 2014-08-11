importPackage(java.io);
importPackage(java.util.zip);
importPackage(org.apache.commons.io);

exports = {
    compress: function(str) {

        var out = new ByteArrayOutputStream();
        var gzip = new GZIPOutputStream(out);
        gzip.write(str.getBytes('UTF-8'));
        gzip.close();

        return out.toByteArray();

    },
    decompress: function(arrOfBytes) {
        var gis = new GZIPInputStream(new ByteArrayInputStream(arrOfBytes));
        var writer = new StringWriter();
        IOUtils.copy(gis, writer, "UTF-8");

        return writer.toString();
    }

}
