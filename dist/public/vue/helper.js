import rest from "/vue/rest.js";

export default {

    /*
     * Tests if file is loaded correctly and framework is working
     */
    async testFunction(string) {
        return "Hello Test";
    },

    async showProductDetails(product) {
        this.productDetailModal = product
        var pdm = new bootstrap.Modal(document.getElementById('productDetailModal'))
        pdm.show()
    },

    async loadOrderDates() {
        return await rest.fetchData(`/rest/order/dates`);
    },

    async loadOpenOrders() {
        return await rest.fetchData(`/rest/order/open`);
    },

    async loadActiveSessions() {
        return await rest.fetchData(`/rest/session/active`);
    },

    async loadDailyOrdersFromStation(day, station_id) {
        return await rest.postData(`/rest/statistics/dailyordersfromstation`, JSON.stringify({
            date: day,
            sid: station_id
        }));
    },

    getRandColor() {
        var col = [0, 0, 0]; // RGB Color values
        // ?
        var ff = Math.floor(Math.random() * 3);
        var oo = Math.floor(Math.random() * 3);
        var color = Math.floor(Math.random() * 6) * 51;
        // magic? idk
        col[ff] = 255;
        if (ff == oo) {
            col[++oo % 3] = 0;
            oo = ++oo % 3;
        } else {
            col[oo] = 0
        }
        var t = [0, 1, 2];
        t.forEach((x) => {
            if (x != oo && x != ff) {
                col[x] = color;
            }
        });
        // Generate hex string
        var hex = "#";
        col.forEach((x) => {
            if (x == 0) {
                hex += "00";
            } else {
                hex += x.toString(16);
            }

        })
        // Error if not valid hex format
        if (hex.length != 7) {
            console.log(ff + " " + oo + " " + color);
            console.log(col);
        }
        return hex;
    },

    /*
    * Show error modal with relevant informations
    */
    async makeError(message, request, error) {
        document.getElementById("errorMessage").innerHTML = message;
        if(!request || !error){
            // Hide detail info
            document.getElementById("errorDebugInfo").style.visibility="hidden"
        }else{
            document.getElementById("errorDebugInfo").style.visibility="visible"
        }
        document.getElementById("errorSource").innerHTML = request;
        document.getElementById("errorReason").innerHTML = error;
        var errorModal = new bootstrap.Modal(document.getElementById('errorModal'))
        errorModal.show()
    },

    /*
    * Finds and delivers the current state of an object with states
    */
    async getCurrentState(session) {
        if (!session) {
            return;
        }
        let state = null;
        session.states.forEach((s) => {
            if (!s.history) {
                state = s;
            }

        });
        return state;
    },

    getFirstState(session) {
        if (!session) {
            return;
        }
        return session.states[0];
    },

    getLastState(session) {
        if (!session) {
            return;
        }
        return session.states[session.states.length - 1];
    },

    async closeOffcanvas(id) {
        let myOffCanvas = document.getElementById(id);
        if (!myOffCanvas) {
            return;
        }
        let openedCanvas = bootstrap.Offcanvas.getInstance(myOffCanvas);
        openedCanvas.hide();
    },

    async openOffcanvas(id) {
        let myOffCanvas = document.getElementById(id);
        if (!myOffCanvas) {
            return;
        }
        let closedCanvas = bootstrap.Offcanvas.getInstance(myOffCanvas);
        closedCanvas.show();
    },

    async groupOrders(orders) {
        // Group orders to map
        let orderMap = new Map();
        // For each order try to sort into the map
        await orders.forEach((oe) => {
            //console.log("New order")
            //console.log(oe)
            // Check if the same product/variation combination exists already in the map
            let inserted = false;

            orderMap.forEach((value, key) => {
                //console.log(value)
                //console.log(oe.product.id + " - " + key.product.id)
                //console.log(( oe.variation != null).valueOf() + " - " + (oe.variation != null).valueOf());
                // Check if same product
                if (key.product.id == oe.product.id) {
                    // Check if either no variations or both the same
                    if ((oe.variation == null && key.variation == null)) {
                        // no variations, same product ++
                        //console.log(value)
                        value.push(oe.id)
                        orderMap.set(key, value);
                        inserted = true;
                    } else if (oe.variation != null && key.variation != null && oe.variation.id == key.variation.id) {
                        // same variations, same product ++
                        //console.log(value)
                        value.push(oe.id)
                        orderMap.set(key, value);
                        inserted = true;
                    }
                }
            });
            //console.log(orderMap)
            if (!inserted) {
                orderMap.set(oe, [oe.id]);
            }
            //console.log(orderMap)
        })
        
        return orderMap;
    }



}

