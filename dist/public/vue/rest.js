export default {

    /*
     * Tests if file is loaded correctly and framework is working
     */
    async testFunction(string) {
        return "Hello Test";
    },

    /*
    * Show error modal with relevant informations
    */
    async makeError(message, request, error) {
        this.errorModalMessage = message
        this.errorModalException = request
        this.errorModalRequest = error
        var errorModal = new bootstrap.Modal(document.getElementById('errorModal'))
        errorModal.show()
    },

    /*
     *  Fetch data from a defined url. If error returns null and displays a error
     */
    async fetchData(url) {
        var result = await fetch(url);
        if (result.status != 200) {
            this.makeError("Anfrage auf den Server fehlgeschlagen.", "GET " + url, result
                .statusText);
            console.log(result)
            return null;
        }
        return await (result.json());
    },

    async putData(url, data) {
        const requestOptions = {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: data
        };
        const response = await fetch(url,
            requestOptions);
        if (response.status != 200) {
            this.makeError("Anfrage fehlerhaft.", "PUT " + url + data, response.statusText);
            return false;
        }
        // Catch non json answer
        try {
            return await (response.json());
        } catch (error) {
            return null;
        }
    },

    async postData(url, data) {
        const requestOptions = {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: data
        };
        const response = await fetch(url,
            requestOptions);
        if (response.status != 200) {
            this.makeError("Anfrage fehlerhaft.", "POST " + url + data, response.statusText);
            return false;
        }
        // Catch non json answer
        try {
            return await (response.json());
        } catch (error) {
            return null;
        }
    },

    async deleteData(url, data) {
        const requestOptions = {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json"
            },
            body: data
        };
        const response = await fetch(url,
            requestOptions);
        if (response.status != 200) {
            this.makeError("Anfrage fehlerhaft.", "DELETE " + url + data, response.statusText);
            return false;
        }
        return true;
    },

}

