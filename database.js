var mysql = require('mysql2');

const pool = mysql.createPool({
    connectionLimit: 10,
    host: 'localhost',
    user: 'root',
    password: 'Pa..w0rd',
    database: 'festivalmanager'
});

/**
 * Merges two sessions from source to target and deletes source
 * Moves all orders to target session
 * @param  {Number} sourceId This session is merged to target and deleted
 * @param  {Number} targetId This session is the target of the merge
 * @return {Promise} Returns a promise with the result
 */
const mergeSession = function (sourceId, targetId) {
    return new Promise((resolve, reject) => {
        pool.execute(
            'UPDATE Bestellung SET id_sitzung = ? WHERE id_sitzung = ?;', [targetId, sourceId],
            (err) => {
                if (err) {
                    return reject("db/mergeSession: Update session id failed"+ err);
                }
                return pool.execute(
                    'DELETE FROM Account_Sitzung WHERE id_sitzung = ?', [sourceId],
                    (err) => {
                        if (err) {
                            return reject("db/mergeSession: Account Session mapping delete failed"+ err);
                        }
                        return pool.execute(
                            'DELETE FROM Sitzung WHERE id = ?', [sourceId],
                            (err) => {
                                if (err) {
                                    return reject("db/mergeSession: Session delete failed"+ err);
                                }
                                return resolve()
                            });
                    });

            });
    }
    );
};

/**
 * Changes the table id of a session
 * @param  {Number} sessionId The session where the change happens
 * @param  {Number} newTableId The new table id of the session
 * @return {Promise} Returns a promise with the result
 */
const changeSessionTable = function (sessionId, newTableId) {
    return new Promise((resolve, reject) => {
        pool.execute(
            'UPDATE Sitzung SET id_tisch = ? WHERE Sitzung.id = ?', [newTableId, sessionId],
            (err) => {
                if (err) {
                    return reject("db/changeSessionTable: Update table id failed"+ err);
                }
                return resolve()
            });
    }
    );
};

/**
 * Get all orders from a session where billing is possible
 * @param  {Number} sessionId The session where to search
 * @return {Promise} Returns all billable orders
 */
const getBillableOrders = function (sessionId) {
    return new Promise((resolve, reject) => {
        console.log(sessionId)
        pool.execute(
            'SELECT SUM(bestellung.anzahl- bestellung.bezahlt) AS uebrig, gericht.name, gericht.id, gericht.preis\
                FROM bestellung\
                INNER JOIN gericht ON bestellung.id_gericht = gericht.id\
                WHERE bestellung.id_sitzung = ? AND bestellung.stoniert=false AND (anzahl-bezahlt)>0\
                GROUP BY name', [sessionId],
            (err, result) => {
                if (err) {
                    return reject("db/changeSessionTable: Update table id failed"+ err);
                }
                return resolve(result);
            });
    }
    );
};



/**
 * Get order for orderentry 
 * @param  {Number} orderId
 * @return {Promise} Returns order for orderentry
 */
const getOrderentry = function (orderId) {
    return new Promise((resolve, reject) => {
        pool.execute(
            "SELECT bestellung.id AS b_id, gericht.name AS g_name, TIMESTAMPDIFF(MINUTE,bestellung.erstellt,NOW()) AS wartezeit,\
            bestellung.anzahl AS b_anz, TIME_FORMAT(bestellung.erstellt, '%H:%i') as erstellt,\
            bestellung.in_zubereitung, tisch.nummer AS t_nr, bestellung.notiz as notiz,  TIME_FORMAT(bestellung.erledigt, '%H:%i') as erledigt,\
            TIMESTAMPDIFF(MINUTE,bestellung.erstellt,bestellung.erledigt) AS lieferzeit, bestellung.stoniert\
            FROM bestellung\
            INNER JOIN gericht ON gericht.id = bestellung.id_gericht\
            INNER JOIN stand ON stand.id = gericht.id_stand\
            INNER JOIN sitzung ON sitzung.id = bestellung.id_sitzung\
            INNER JOIN tisch ON tisch.id = sitzung.id_tisch\
            WHERE bestellung.id = ? \
            ORDER BY wartezeit DESC", [orderId],
            (err, result) => {
                if (err) {
                    return reject("db/getOrderentry: Get failed" + err);
                }
                return resolve(result);
            });
    }
    );
};


/**
 * Get selected options for a order with difference to standard options
 * @param  {Number} orderId
 * @return {Promise} Returns options for order
 */
 const getSelectedOptions = function (orderId) {
    return new Promise((resolve, reject) => {
        var sql = "SELECT Gericht_Zutaten.optional AS standard, Zutat.name, \
        (\
            SELECT COUNT(*) FROM Bestellung b\
            INNER JOIN Zutat_Bestellung ON zutat_bestellung.id_bestellung = bestellung.id\
            WHERE b.id = Bestellung.id AND zutat_bestellung.id_zutat=Zutat.id\
        ) as ordered\
        FROM Bestellung\
        INNER JOIN Gericht ON Gericht.id = Bestellung.id_gericht\
        INNER JOIN Gericht_Zutaten ON Gericht_Zutaten.id_gericht = Gericht.id\
        INNER JOIN Zutat ON Gericht_Zutaten.id_zutat = Zutat.id\
        WHERE Bestellung.id = ? AND Gericht_Zutaten.optional <> (\
            SELECT COUNT(*) FROM Bestellung b\
            INNER JOIN Zutat_Bestellung ON zutat_bestellung.id_bestellung = bestellung.id\
            WHERE b.id = Bestellung.id AND zutat_bestellung.id_zutat=Zutat.id\
        )";
        pool.execute(
            sql, [orderId],
            (err, result) => {
                if (err) {
                    return reject("db/getSelectedOptions: Get failed" + err);
                }
                return resolve(result);
            });
    }
    );
};


/**
 * Map a session to account 
 * @param  {Number} sessionId The session which is added to the account
 * @param  {Number} accountId The account
 * @return {Promise} Returns a promise with the result
 */
const mapSessionToAccount = function (sessionId, accountId) {
    return new Promise((resolve, reject) => {
        pool.execute(
            'INSERT INTO Account_Sitzung VALUES (0,?,?)', [accountId, sessionId],
            (err) => {
                if (err) {
                    return reject("db/mapSessionToAccount: Mapping session to account failed"+ err);
                }
                return resolve()
            });
    }
    );
};


/**
 * Creates a new session on table and map it to account
 * @param  {Number} sessionId The session which is added to the account
 * @param  {Number} accountId The account
 * @return {Promise} Returns a promise newly create session id
 */
const createSession = function (tableId, accountId) {
    return new Promise((resolve, reject) => {
        pool.execute(
            'INSERT INTO Sitzung VALUES (0,NOW(),NULL,?,NULL,?)', [tableId, accountId],
            (err) => {
                if (err) {
                    return reject("db/createSession: Creating session failed"+ err);
                }
                // Get ID from new Session
                return pool.execute(
                    'SELECT LAST_INSERT_ID() AS id',
                    (err, result) => {
                        if (err) {
                            return reject("db/createSession: Getting newly created session failed"+ err);
                        }
                        // Link Session to my account
                        return pool.execute(
                            'INSERT INTO Account_Sitzung VALUES(0, ? , ? )', [accountId, result[0].id],
                            (err) => {
                                if (err) {
                                    return reject("db/createSession: Map session to account failed"+ err);
                                }
                                return resolve(result[0].id)
                            });
                    });
            });
    }
    );
};




const query = function (sql, callback) {
    pool.query(sql, callback);
}


module.exports = { pool, mergeSession, query, changeSessionTable, getBillableOrders, mapSessionToAccount, createSession, getOrderentry,getSelectedOptions };


