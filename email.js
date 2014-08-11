importPackage(javax.mail);
importPackage(javax.mail.internet);
var email = {
    send: function(from, to, subject, msgBody) {
        var props = new java.util.Properties();
        var session = Session.getDefaultInstance(props, null);

        var msg = new MimeMessage(session);
        msg.setFrom(new InternetAddress(from.address, from.personal));
        msg.addRecipient(Message.RecipientType.TO,
                         new InternetAddress(to.address, to.personal));
        msg.setSubject(subject);
        msg.setContent(msgBody, "text/html; charset=utf-8");
        Transport.send(msg);
    }
};
exports = email;
