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
        document.getElementById("errorSource").innerHTML = request;
        document.getElementById("errorReason").innerHTML = error;
        var errorModal = new bootstrap.Modal(document.getElementById('errorModal'))
        errorModal.show()
    },



}

