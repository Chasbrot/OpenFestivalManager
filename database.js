var mysql = require('mysql2');

var mysqlpromise = require('mysql2/promise');

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

const pool = mysql.createPool({
    connectionLimit: 10,
    host: 'localhost',
    user: 'root',
    password:'Pa..w0rd',
    database: 'festivalmanager'
});

const mergeSession= function(sourceId, targetId){
    return new Promise((resolve, reject) => {
            pool.execute(
                'UPDATE Bestellung SET id_sitzung = ? WHERE id_sitzung = ?;', [targetId, sourceId],
                (err) => {
                    if (err) {
                        return reject("db/mergeSession: Update session id failed");
                    }
                    return pool.execute(
                        'DELETE FROM Account_Sitzung WHERE id_sitzung = ?', [sourceId],
                        (err) => {
                            if (err) {
                                return reject("db/mergeSession: Account Session mapping delete failed");
                            }
                            return pool.execute(
                                'DELETE FROM Sitzung WHERE id = ?', [sourceId],
                                (err) => {
                                    if (err) {
                                        return reject("db/mergeSession: Session delete failed");
                                    }
                                    return resolve()
                            });
                    });

                });
        }
    );
};

query = conn.query;



module.exports = {conn,pool,mergeSession,query};


