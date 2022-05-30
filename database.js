var mysql = require('mysql2');

var conn = mysql.createConnection({
    host: 'localhost', // Replace with your host name
    user: 'root',      // Replace with your database username
    password: 'Pa..w0rd',      // Replace with your database password
    database: 'festivalmanager' // // Replace with your database Name
});

conn.connect(function (err) {
    if (err){
        console.log(err)
    };
    console.log('Database is connected successfully !');
});




module.exports = conn;


