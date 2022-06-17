// Database Connector
var mysql = require('mysql2');
var mysqlawait = require("mysql2/promise")

// For file importing
const fs = require('fs');
const readline = require('readline');
const events = require('events');
require('iconv-lite').encodingExists('utf-8')


// Legacy db pool
const pool = mysql.createPool({
    connectionLimit: 10,
    host: 'localhost',
    user: 'root',
    password: 'Pa..w0rd',
    database: 'festivalmanager'
    //database: 'fmtest',
    //charset: "utf8_general_ci"
});

// New db pool
const poolawait = mysqlawait.createPool({
    connectionLimit: 10,
    host: 'localhost',
    user: 'root',
    password: 'Pa..w0rd',
    database: 'festivalmanager'
    //database: 'fmtest',
    //charset: "utf8_general_ci"
});



/**
 * Merges two sessions from source to target and deletes source
 * Moves all orders to target session
 * @param  {Number} sourceId This session is merged to target and deleted
 * @param  {Number} targetId This session is the target of the merge
 * @return {Promise} Returns a promise with the result
 */
const mergeSession = function (sourceId, targetId) {
    return new Promise(async (resolve, reject) => {
        var con;
        try {
            con = await poolawait.getConnection();
        } catch (e) {
            return reject("db/mergeSession: Creating connection failed" + err);
        }
        var result;
        try {
            await pool.execute('UPDATE Bestellung SET id_sitzung = ? WHERE id_sitzung = ?;', [targetId, sourceId]);
            await pool.execute('DELETE FROM Account_Sitzung WHERE id_sitzung = ?', [sourceId]);
            await pool.execute('DELETE FROM Sitzung WHERE id = ?', [sourceId]);
            await con.commit();
        } catch (e) {
            await con.rollback();
            return reject("db/MergeSession: Creating session failed" + err);
        } finally {
            await con.release();
        }
        return resolve();
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
        pool.execute(
            'SELECT SUM(bestellung.anzahl- bestellung.bezahlt) AS uebrig, gericht.name, gericht.id, gericht.preis\
                FROM bestellung\
                INNER JOIN gericht ON bestellung.id_gericht = gericht.id\
                WHERE bestellung.id_sitzung = ? AND bestellung.stoniert=false AND (anzahl-bezahlt)>0\
                GROUP BY name', [sessionId],
            (err, result) => {
                if (err) {
                    return reject("db/getBillableOrders: Query failed" + err);
                }
                return resolve(result);
            });
    });
};

/**
 * Get all orders from a session which are in active and not finished
 * @param  {Number} sessionId The session where to search
 * @return {Promise} Returns Promise with all active orders
 */
const getOutstandingOrders = function (sessionId) {
    return new Promise((resolve, reject) => {
        pool.execute(
            'SELECT bestellung.id, gericht.name, gericht.id, gericht.preis\
                FROM bestellung\
                INNER JOIN gericht ON bestellung.id_gericht = gericht.id\
                WHERE bestellung.id_sitzung = ? AND bestellung.stoniert=false AND bestellung.erledigt IS NULL', [sessionId],
            (err, result) => {
                if (err) {
                    return reject("db/getOutstandingOrders: Query failed" + err);
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
    return new Promise(async (resolve, reject) => {
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
            if (options && options.length > 0) {
                var result = await con.query("SELECT LAST_INSERT_ID() AS id")
                // Check if select has delivered an id
                if (result[0].length > 0) {
                    for (var i = 0; i < options.length; i++) {
                        await con.execute("INSERT INTO Zutat_Bestellung VALUES (0,?,?)", [options[i], result[0][0].id])
                    }
                } else {
                    throw new Error("No last insert id found!");
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
            return reject("db/getActiveSessionsFromTable: Failed to query" + e)
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
            return reject("db/updateAccountPW: Failed to query" + e)
        }
        return resolve()
    });
};

/**
 * Closes a open session
 * @param  {Number} accountId The account which closes the session
 * @param  {Number} sessionId The session to be closed
 * @return {Promise} Returns a promise
 */
const closeSession = function (sessionId, accountId) {
    return new Promise(async (resolve, reject) => {
        try {
            await poolawait.query('UPDATE sitzung SET end=NOW(), id_abrechner = ? WHERE id = ?', [accountId, sessionId])
        } catch (e) {
            return reject("db/closeSession: Failed to query" + e)
        }
        return resolve()
    });
};

/**
 * Update order status sent
 * @param  {Number} orderId The order to be updated
 * @return {Promise} Returns a promise
 */
const setOrderStatusSent = function (orderId) {
    return new Promise(async (resolve, reject) => {
        try {
            await poolawait.query('UPDATE bestellung SET bestellung.erledigt = NOW() WHERE bestellung.id = ?', [orderId])
        } catch (e) {
            return reject("db/setOrderStatusSent: Failed to query" + e)
        }
        return resolve()
    });
};

/**
 * Update order status in production (processing)
 * @param  {Number} orderId The order to be updated
 * @return {Promise} Returns a promise
 */
const setOrderStatusProcessing = function (orderId) {
    return new Promise(async (resolve, reject) => {
        try {
            await poolawait.query('UPDATE bestellung SET bestellung.in_zubereitung = true WHERE bestellung.id = ?', [orderId])
        } catch (e) {
            return reject("db/setOrderStatusProcessing: Failed to query" + e)
        }
        return resolve()
    });
};

/**
 * Update order status canceled
 * @param  {Number} orderId The order to be updated
 * @return {Promise} Returns a promise
 */
const setOrderStatusCancled = function (orderId) {
    return new Promise(async (resolve, reject) => {
        try {
            await poolawait.query('UPDATE bestellung SET bestellung.stoniert = true WHERE bestellung.id = ?', [orderId])
        } catch (e) {
            return reject("db/setSessionStatusCanceled: Failed to query" + e)
        }
        return resolve()
    });
};

/**
 * Creates a new alert
 * @param  {Number} alerttypeId The type of alert made
 * @param  {Number} stationId The station which made the alert
 * @return {Promise} Returns a promise
 */
const createAlert = function (alertTypeId, stationId) {
    return new Promise(async (resolve, reject) => {
        try {
            await poolawait.query('INSERT INTO Alert VALUES (0,?,?,true,NOW())', [alertTypeId, stationId])
        } catch (e) {
            return reject("db/createAlert: Failed to query" + e)
        }
        return resolve()
    });
};



/**
 * Clear a new alert; Deactivates the alert
 * @param  {Number} alerttypeId The type of alert made
 * @param  {Number} stationId The station which made the alert
 * @return {Promise} Returns a promise
 */
const clearAlert = function (alertId) {
    return new Promise(async (resolve, reject) => {
        try {
            await poolawait.query('UPDATE Alert SET active=false WHERE id = ?', [alertId])
        } catch (e) {
            return reject("db/clearAlert: Failed to query" + e)
        }
        return resolve()
    });
};


/**
 * Creates a new alert type
 * @param  {String} alertTypeName
 * @return {Promise} Returns a promise
 */
const createAlertType = function (alertTypeName) {
    return new Promise(async (resolve, reject) => {
        try {
            await poolawait.query('INSERT INTO AlertType VALUES (0,?)', [alertTypeName])
        } catch (e) {
            return reject("db/createAlertType: Failed to query" + e)
        }
        return resolve()
    });
};

/**
 * Remove a alert type
 * @param  {Number} alertTypeId
 * @return {Promise} Returns a promise
 */
const removeAlertType = function (alertTypeId) {
    return new Promise(async (resolve, reject) => {
        try {
            await poolawait.query('DELETE FROM AlertType WHERE id = ?', [alertTypeId])
        } catch (e) {
            return reject("db/removeAlertType: Failed to query" + e)
        }
        return resolve()
    });
};



/**
 * Returns all active orders for a specifc station
 * @param  {Number} stationId The station for which the orders are searched
 * @return {Promise} Returns a promise with a list of all orders;
 * b_id, wartezeit
 */
const getActiveOrdersForStation = function (stationId) {
    return new Promise(async (resolve, reject) => {
        var sql = `SELECT bestellung.id AS b_id, TIMESTAMPDIFF(MINUTE,bestellung.erstellt,NOW()) AS wartezeit\
        FROM bestellung\
        INNER JOIN gericht\
        ON gericht.id = bestellung.id_gericht\
        INNER JOIN stand\
        ON stand.id = gericht.id_stand\
        WHERE stand.id = ? AND bestellung.erledigt IS NULL AND bestellung.stoniert = false AND gericht.lieferbar = true
        ORDER BY wartezeit DESC`;
        var result;
        try {
            result = await poolawait.query(sql, [stationId])
        } catch (e) {
            return reject("db/getActiveOrdersForStation: Failed to query" + e)
        }

        return resolve(result[0])
    });
};

/**
 * Returns all past orders for a specifc station
 * @param  {Number} stationId The station for which the orders are searched
 * @return {Promise} Returns a promise with a list of all orders;
 * b_id, g_name, bestellung.stoniert, b AS b_anz, dauer, lieferzeit, t_nr, bestellung.notiz,erstellt
 */
const getPastOrdersForStation = function (stationId) {
    return new Promise(async (resolve, reject) => {
        var sql = `SELECT bestellung.id AS b_id, gericht.name AS g_name, bestellung.stoniert, bestellung.anzahl AS b_anz, TIMESTAMPDIFF(MINUTE,bestellung.erstellt,bestellung.erledigt) AS dauer, TIME_FORMAT(bestellung.erledigt, '%H:%i') as lieferzeit, tisch.nummer AS t_nr, bestellung.notiz, TIME_FORMAT(bestellung.erstellt, '%H:%i') as erstellt\
        FROM bestellung\
        INNER JOIN gericht\
        ON gericht.id = bestellung.id_gericht\
        INNER JOIN stand\
        ON stand.id = gericht.id_stand\
        INNER JOIN sitzung\
        ON sitzung.id = bestellung.id_sitzung\
        INNER JOIN tisch\
        ON tisch.id = sitzung.id_tisch\
        WHERE stand.id = ? AND (bestellung.erledigt IS NOT NULL OR bestellung.stoniert = true) AND gericht.lieferbar = true \
        AND DATEDIFF(DATE(bestellung.erstellt),NOW())=0 AND TIMESTAMPDIFF(MINUTE,bestellung.erledigt,NOW()) <= 60 \
        ORDER BY lieferzeit DESC`;
        var result;
        try {
            result = await poolawait.query(sql, [stationId])
        } catch (e) {
            return reject("db/getPastOrdersForStation: Failed to query" + e)
        }

        return resolve(result[0])
    });
};

/**
 * Clears all dynamic data from the database and registered personal exept admins and station users. 
 * Includes: Orders, Sessions and mappings. Resets all autoincrements to 1;
 * @return {Promise} Returns a promise 
 */
const clearDynamicData = function () {
    return new Promise(async (resolve, reject) => {
        var con;
        try {
            con = await poolawait.getConnection();
        } catch (e) {
            return reject("db/clearDynamicData: Creating connection failed" + err);
        }
        try {
            await con.execute("DELETE FROM Zutat_Bestellung WHERE id <> -1");
            await con.execute("DELETE FROM Bestellung WHERE id <> -1");
            await con.execute("DELETE FROM Account_Sitzung WHERE id <> -1");
            await con.execute("DELETE FROM Sitzung WHERE id <> -1");
            await con.execute("DELETE FROM Account WHERE id_type == 3 ");
            await con.execute("DELETE FROM Alert WHERE id <> -1 ");
            await con.execute("ALTER TABLE Zutat_Bestellung AUTO_INCREMENT = 1");
            await con.execute("ALTER TABLE Bestellung AUTO_INCREMENT = 1");
            await con.execute("ALTER TABLE Account_Sitzung AUTO_INCREMENT = 1");
            await con.execute("ALTER TABLE Sitzung AUTO_INCREMENT = 1");
            await con.execute("ALTER TABLE Alert AUTO_INCREMENT = 1");
            await con.commit()
        } catch (e) {
            await con.rollback()
            return reject("db/clearDynamicData: Create order failed" + e);
        } finally {
            await con.release();
        }
        return resolve();
    });
};

/**
 * Create new table group
 * @param  {String} groupName New table group name
 * @return {Promise} Returns a promise
 */
const createTableGroup = function (groupName) {
    return new Promise(async (resolve, reject) => {
        try {
            await poolawait.query('INSERT INTO Tisch_Gruppe VALUES (0,?)', [groupName])
        } catch (e) {
            return reject("db/createTableGroup: Failed to query" + e)
        }
        return resolve()
    });
};

/**
 * Create new table 
 * @param  {String} tableName New table name
 * @param  {Number} tableGroupId Table Group of the new table
 * @return {Promise} Returns a promise
 */
const createTable = function (tableName, tableGroupId) {
    return new Promise(async (resolve, reject) => {
        try {
            await poolawait.query('INSERT INTO Tisch VALUES (0,?,?)', [tableName, tableGroupId])
        } catch (e) {
            return reject("db/createTable: Failed to query" + e)
        }
        return resolve()
    });
};

/**
 * Create new station
 * @param  {String} stationName New station name
 * @return {Promise} Returns a promise
 */
const createStation = function (stationName) {
    return new Promise(async (resolve, reject) => {
        try {
            await poolawait.query('INSERT INTO stand VALUES (0,?,NULL)', [stationName])
        } catch (e) {
            return reject("db/createStation: Failed to query" + e)
        }
        return resolve();
    });
};

/**
 * Create new option
 * @param  {String} optionName New option name
 * @return {Promise} Returns a promise
 */
const createOption = function (optionName) {
    return new Promise(async (resolve, reject) => {
        try {
            await poolawait.query('INSERT INTO Zutat VALUES (0,?)', [optionName])
        } catch (e) {
            return reject("db/createOption: Failed to query" + e)
        }
        return resolve()
    });
};

/**
 * Creates a new Product
 * @param  {Number} stationId The station where this product is made
 * @param  {String} productName The name of the product
 * @param  {Boolean} deliverable If the product gets delivered or need to be gathered
 * @param  {Number} cost Cost of a unit of product
 * @param  {Number} priority Priority of the order in the list
 * @param  {List} A list of option ids which available for this product
 * @param  {List} A list of option ids which are default for this product
 * @return {Promise} Returns a promise 
 */
const createProduct = function (stationId, productName, deliverable, cost,priority, options, defaults) {
    return new Promise(async (resolve, reject) => {
        var con;
        try {
            con = await poolawait.getConnection();
        } catch (e) {
            return reject("db/createProduct: Creating connection failed" + err);
        }
        try {
            await con.beginTransaction();
            await con.execute("INSERT INTO Gericht VALUES (0,?,?,?,?,?)", [stationId, productName, cost, deliverable, priority]);
            // CHeck if options need to be linked
            if (options && options.length > 0) {
                var result = await con.query("SELECT LAST_INSERT_ID() AS id")
                // Check if select has delivered an id
                if (result[0].length > 0) {
                    var id = result[0][0].id;
                    // Link all options
                    for (var i = 0; i < options.length; i++) {
                        var optional = defaults.includes(options[i]);
                        await con.execute("INSERT INTO Gericht_Zutaten VALUES (0,?,?,1,?)", [id, options[i], optional])
                    }
                } else {
                    throw new Error("No last insert id found!");
                }
            }
            await con.commit()
        } catch (e) {
            await con.rollback()
            return reject("db/createProduct: Create order failed" + e);
        } finally {
            await con.release();
        }
        return resolve();
    });
};

/**
 * Removes a Product
 * @param  {Number} productId The product to be removed
 * @return {Promise} Returns a promise 
 */
const removeProduct = function (productId) {
    return new Promise(async (resolve, reject) => {
        var con;
        try {
            con = await poolawait.getConnection();
        } catch (e) {
            return reject("db/createProduct: Creating connection failed" + err);
        }
        try {
            // Gericht_Zutaten entfernen
            await pool.execute("DELETE FROM Gericht_Zutaten WHERE id_gericht = ?", [productId]);
            // Gericht entfernen
            await pool.execute("DELETE FROM Gericht WHERE id =  ?", [productId]);
            await con.commit()
        } catch (e) {
            await con.rollback()
            return reject("db/removeProduct: Create order failed" + e);
        } finally {
            await con.release();
        }
        return resolve();
    });
};



/**
* Remove Table
* @param  {Number} tableId Removes this table
* @return {Promise} Returns a promise
*/
const removeTable = function (tableId) {
    return new Promise(async (resolve, reject) => {
        try {
            await poolawait.query('DELETE FROM Tisch WHERE id = ?', [tableId])
        } catch (e) {
            return reject("db/removeTable: Failed to query" + e)
        }
        return resolve();
    });
};

/**
* Remove Option
* @param  {Number} optionId
* @return {Promise} Returns a promise
*/
const removeOption = function (optionId) {
    return new Promise(async (resolve, reject) => {
        try {
            await poolawait.query('DELETE FROM Zutat WHERE id = ?', [optionId])
        } catch (e) {
            return reject("db/removeTable: Failed to query" + e)
        }
        return resolve();
    });
};




/**
 * Removes a Table Group
 * @param  {Number} tableGroupId
 * @return {Promise} Returns a promise 
 */
const removeTableGroup = function (tableGroupId) {
    return new Promise(async (resolve, reject) => {
        var con;
        try {
            con = await poolawait.getConnection();
        } catch (e) {
            return reject("db/removeTableGroup: Creating connection failed" + err);
        }
        try {
            // Gericht_Zutaten entfernen
            await pool.execute("DELETE FROM Tisch WHERE id_tischgruppe = ?", [tableGroupId]);
            // Gericht entfernen
            await pool.execute("DELETE FROM Tisch_Gruppe WHERE id = ?", [tableGroupId]);
            await con.commit()
        } catch (e) {
            await con.rollback()
            return reject("db/removeTableGroup: Create order failed" + e);
        } finally {
            await con.release();
        }
        return resolve();
    });
};

/**
* Get all products from a station
* @param  {Number} optionId
* @return {Promise} Returns a promise
*/
const getProductsByStation = function (stationId) {
    return new Promise(async (resolve, reject) => {
        var result;
        try {
            result = await poolawait.query('SELECT * FROM Gericht WHERE id_stand = ?', [stationId])
        } catch (e) {
            return reject("db/getProductsByStation: Failed to query" + e)
        }
        if (result[0].length == 0) {
            return resolve([]);
        } else {
            return resolve(result[0]);
        }

    });
};

/**
* Get only products from a station without a option
* @param  {Number} optionId
* @return {Promise} Returns a promise
*/
const getProductsByStationWithoutOptions = function (stationId) {
    return new Promise(async (resolve, reject) => {
        var result;
        try {
            var sql ="SELECT gericht.id, gericht.name FROM Gericht\
            WHERE id_stand= ? AND gericht.id NOT IN \
                (\
                SELECT gericht_zutaten.id_gericht \
                FROM gericht_zutaten \
                GROUP BY id_gericht\
                HAVING COUNT(*) > 0\
                )\
            ORDER BY list_priority DESC";
            result = await poolawait.query(sql, [stationId])
        } catch (e) {
            return reject("db/getProductsByStationWithoutOptions: Failed to query" + e)
        }
        if (result[0].length == 0) {
            return resolve([]);
        } else {
            return resolve(result[0]);
        }

    });
};

/**
* Get only products from a station with a option
* @param  {Number} optionId
* @return {Promise} Returns a promise
*/
const getProductsByStationWithOptions = function (stationId) {
    return new Promise(async (resolve, reject) => {
        var result;
        try {
            var sql ="SELECT gericht.id, gericht.name FROM Gericht\
            WHERE id_stand= ? AND gericht.id IN \
                (\
                SELECT gericht_zutaten.id_gericht \
                FROM gericht_zutaten \
                GROUP BY id_gericht\
                HAVING COUNT(*) > 0\
                )\
            ORDER BY list_priority DESC";
            result = await poolawait.query(sql, [stationId])
        } catch (e) {
            return reject("db/getProductsByStationWithOptions: Failed to query" + e)
        }
        if (result[0].length == 0) {
            return resolve([]);
        } else {
            return resolve(result[0]);
        }

    });
};




/**
* Get a product
* @param  {Number} productId
* @return {Promise} Returns a promise
*/
const getProduct = function (productId) {
    return new Promise(async (resolve, reject) => {
        var result;
        try {
            result = await poolawait.query('SELECT * FROM Gericht WHERE id = ?', [productId])
        } catch (e) {
            return reject("db/getProduct: Failed to query" + e)
        }
        if (result[0].length == 0) {
            return resolve([]);
        } else {
            return resolve(result[0]);
        }

    });
};

/**
* Pay products from a order
* @param  {Number} sessionId From which session to pay the orders
* @param  {Number} productId Which product type to pay
* @param  {Number} amount How much to is getting payed
* @return {Promise} Returns a promise
*/
const payProduct = function (sessionId, productId, amount) {
    return new Promise(async (resolve, reject) => {
        var con;
        try {
            con = await poolawait.getConnection();
        } catch (e) {
            return reject("db/payOrder: Creating connection failed" + err);
        }
        var remaining = amount;
        var maxtry = remaining + 1;
        try {
            console.log("Starting payment: " + remaining)
            while (remaining) {
                console.log("Payment: " + productId + "; remaining " + remaining);
                // Get a possible order from the db
                var sql = `SELECT bestellung.id, (anzahl - bezahlt) AS rem, anzahl, bezahlt from bestellung WHERE bestellung.id_sitzung = ? AND bestellung.id_gericht = ? AND (anzahl-bezahlt) > 0 AND stoniert=false LIMIT 1;`;
                var porder = await con.execute(sql, [sessionId, productId]);
                if (!sql[0].length) {
                    throw Error("No possible orders found!")
                }
                var possible = porder[0][0].rem;
                var orderAmount = porder[0][0].anzahl;
                var orderId = porder[0][0].id;
                var payed = porder[0][0].bezahlt;

                sql = `UPDATE bestellung SET bezahlt= ? WHERE id = ?;`;
                if (possible <= remaining) {
                    // Pay exactly the rest
                    console.log("payed: " + orderAmount + " from " + orderId)
                    await con.execute(sql, [orderAmount, orderId]); // Bezahlt = Anzahl
                    remaining -= possible;
                } else if (possible > remaining) {
                    // Pay only remaining
                    console.log("payed: " + (payed + remaining) + " from " + orderId)
                    await con.execute(sql, [payed + remaining, orderId]); // Bezahlt = bezahlt+remaining (bezahlt < anzahl)
                    remaining = 0;
                }
                // Endless loop detection
                maxtry -= 1;
                if (!maxtry) {
                    throw Error("Too many tries, endless detection aborted loop")
                }
            }
            await con.commit()
        } catch (e) {
            await con.rollback()
            return reject("db/payProduct: Create order failed" + e);
        } finally {
            await con.release();
        }
        return resolve();
    });
};


/**
* Wipe Database and import a sql backup file
* @param  {Number} sqlFilePath Path to the sql file for importing
* @return {Promise} Returns a promise
*/
const resetDBToSQLDump = function (sqlFilePath) {
    return new Promise(async (resolve, reject) => {
        var con;
        try {
            con = await poolawait.getConnection();
        } catch (e) {
            return reject("db/resetDBToSQLDump: Creating connection failed" + err);
        }

        try {

            // DROP ALL TABLES, YEEEEEE HAWWWWWWWWWW! 
            await con.execute("DROP TABLE IF EXISTS Alert");
            await con.execute("DROP TABLE IF EXISTS AlertType");
            await con.execute("DROP TABLE IF EXISTS Zutat_Bestellung");
            await con.execute("DROP TABLE IF EXISTS Gericht_Zutaten");
            await con.execute("DROP TABLE IF EXISTS Zutat");
            await con.execute("DROP TABLE IF EXISTS Account_Sitzung");
            await con.execute("DROP TABLE IF EXISTS Bestellung");
            await con.execute("DROP TABLE IF EXISTS Sitzung");
            await con.execute("DROP TABLE IF EXISTS Tisch");
            await con.execute("DROP TABLE IF EXISTS Tisch_Gruppe");
            await con.execute("DROP TABLE IF EXISTS Gericht");
            await con.execute("DROP TABLE IF EXISTS Stand");
            await con.execute("DROP TABLE IF EXISTS Account");
            await con.execute("DROP TABLE IF EXISTS AccountType");

            await con.beginTransaction();
            // Read in all lines
            /*const rl = readline.createInterface({
                input: fs.createReadStream(sqlFilePath),
                crlfDelay: Infinity,
                encoding: 'utf8',
                fd: null 
            });

            rl.on('line', (line) => {
                console.log(line)
                con.execute(line);
            });*/
            /*
            const allFileContents = fs.readFileSync(sqlFilePath, 'utf-8');
            allFileContents.split(/\r?\n/).forEach(line => {
                console.log(line);
                con.execute(line);
            });*/

            console.log("reading finished -> closing file")
            //await events.once(rl, 'close');
            console.log("commit")
            await con.commit();
            console.log("commit finished");
        } catch (e) {
            try {
                await con.rollback();
            } catch (err) {
                console.log("db/resetDBToSQLDump: ROLLBACK FAILED");
            }
            return reject("db/resetDBToSQLDump: reset failed" + e);
        } finally {
            await con.release();
        }
        return resolve();
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
    createOrder, getActiveSessionFromTable, updateAccountPW,
    closeSession, setOrderStatusSent, setOrderStatusProcessing,
    setOrderStatusCancled, createAlert, getActiveOrdersForStation,
    getPastOrdersForStation, clearAlert, clearDynamicData,
    createTableGroup, createTable, createStation, createOption, createProduct, removeProduct, removeTable, removeTableGroup,
    createAlertType, removeAlertType, removeOption, getProduct, getProductsByStation, payProduct, getOutstandingOrders, resetDBToSQLDump,
    getProductsByStationWithOptions, getProductsByStationWithoutOptions
};