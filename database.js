var mysql = require('mysql2');

var mysqlawait = require("mysql2/promise")

const pool = mysql.createPool({
    connectionLimit: 10,
    host: 'localhost',
    user: 'root',
    password: 'Pa..w0rd',
    database: 'festivalmanager'
});

const poolawait = mysqlawait.createPool({
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
                    return reject("db/mergeSession: Update session id failed" + err);
                }
                return pool.execute(
                    'DELETE FROM Account_Sitzung WHERE id_sitzung = ?', [sourceId],
                    (err) => {
                        if (err) {
                            return reject("db/mergeSession: Account Session mapping delete failed" + err);
                        }
                        return pool.execute(
                            'DELETE FROM Sitzung WHERE id = ?', [sourceId],
                            (err) => {
                                if (err) {
                                    return reject("db/mergeSession: Session delete failed" + err);
                                }
                                return resolve()
                            });
                    });

            });
    });
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
                    return reject("db/changeSessionTable: Update table id failed" + err);
                }
                return resolve()
            });
    });
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
                    return reject("db/changeSessionTable: Update table id failed" + err);
                }
                return resolve(result);
            });
    });
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
    });
};


/**
 * Get selected options for a order with difference to standard options
 * @param  {Number} orderId
 * @return {Promise} Returns options for order
 */
const getSelectedOptions = function (orderId) {
    return new Promise(async (resolve, reject) => {
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
        var result;
        try {
            result = await poolawait.execute(sql, [orderId]);
        } catch (e) {
            return reject("db/getSelectedOptions: Get failed" + err);
        }
        return resolve(result[0]);
    });
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
                    return reject("db/mapSessionToAccount: Mapping session to account failed" + err);
                }
                return resolve()
            });
    });
};


/**
 * Creates a new session on table and map it to account
 * @param  {Number} sessionId The session which is added to the account
 * @param  {Number} accountId The account
 * @return {Promise} Returns a promise newly create session id
 */
const createSession = function (tableId, accountId) {
    return new Promise( async (resolve, reject) => {
        var con;
        try {
            con = await poolawait.getConnection();
        } catch (e) {
            return reject("db/createSession: Creating connection failed" + err);
        }
        var result;
        try {
            await con.beginTransaction();
            await con.execute('INSERT INTO Sitzung VALUES (0,NOW(),NULL,?,NULL,?)', [tableId, accountId]);
            result = await con.query('SELECT LAST_INSERT_ID() AS id');
            await con.execute('INSERT INTO Account_Sitzung VALUES(0, ? , ? )', [accountId, result[0][0].id]);
            await con.commit();
        } catch (e) {
            await con.rollback();
            return reject("db/createSession: Creating session failed" + err);
        } finally {
            await con.release();
        }
        return resolve(result[0][0].id);
    });
};

/**
 * Creates a new order from a product on a session. Links all options to this order
 * @param  {Number} sessionId The session where the order is created
 * @param  {Number} accountId The account which creates the order
 * @param  {Number} productId The product which is ordered
 * @param  {Number} productNumber The amount of product ordered
 * @param  {Number} orderNote Any note for the order
 * @param  {Number} options A list of optionIds which are ordered
 * @return {Promise} Returns a promise newly create session id
 */
const createOrder = function (accountId, sessionId, productId, amount, orderNote, options) {
    return new Promise(async (resolve, reject) => {
        var con;
        try {
            con = await poolawait.getConnection();
        } catch (e) {
            return reject("db/createOrder: Creating connection failed" + err);
        }
        var sql = 'INSERT INTO bestellung VALUES (0, ?, ?, ?, NOW(),NULL,false,?,0,?,false)';
        try {
            await con.execute(sql, [productId, accountId, sessionId, amount, orderNote]);
            // CHeck if options need to be linked
            if (options.length > 0) {
                var result = await con.query("SELECT LAST_INSERT_ID() AS id")
                // Check if select has delivered an id
                if (result[0].length > 0) {
                    for (var i = 0; i < options.length; i++) {
                        await con.execute("INSERT INTO Zutat_Bestellung VALUES (0,?,?)", [options[i], result[0][0].id])
                    }
                }
            }
            await con.commit()
        } catch (e) {
            await con.rollback()
            return reject("db/createOrder: Create order failed" + e);
        } finally {
            await con.release();
        }
        return resolve();
    });
};

/**
 * Get current active session from a table
 * @param  {Number} tableId Get active session from this table id
 * @return {Promise} Returns a promise with the session id; -1 if not found
 */
const getActiveSessionFromTable = function (tableId) {
    return new Promise(async (resolve, reject) => {
        var result;
        try {
            result = await poolawait.query(`SELECT id FROM Sitzung WHERE end IS NULL AND id_tisch = ?`, [tableId])
        } catch (e) {
            return reject("db/getActiveSessionsFromTable: Failed to query"+e)
        }
        if (result[0].length == 0) {
            return resolve(-1);
        } else {
            return resolve(result[0][0].id);
        }
        
    });
};



/**
 * Updates the password hash entry of a account
 * @param  {Number} hash The new password hash
 * @param  {Number} accountId The account where the change happens
 * @return {Promise} Returns a promise
 */
 const updateAccountPW = function (hash, accountId) {
    return new Promise(async (resolve, reject) => {
        try {
            await poolawait.query(`UPDATE account SET pw = ? WHERE id = ?`, [hash, accountId])
        } catch (e) {
            return reject("db/updateAccountPW: Failed to query"+e)
        }
        return resolve
    });
};


const query = function (sql, callback) {
    pool.query(sql, callback);
}


module.exports = {
    pool,
    mergeSession,
    query,
    changeSessionTable,
    getBillableOrders,
    mapSessionToAccount,
    createSession,
    getOrderentry,
    getSelectedOptions,
    createOrder,getActiveSessionFromTable,updateAccountPW
};