import rest from "/vue/rest.js";

export default {

    /*
     * Tests if file is loaded correctly and framework is working
     */
    async testFunction(string) {
        return "Hello Test";
    },

    async loadTableGroups() {
        return await rest.fetchData(`/rest/tablegroup`);
    },

    async createTableGroup(newTableGroupName) {
        if (!newTableGroupName) {
            return;
        }
        await rest.putData("/rest/tablegroup",
            JSON.stringify({
                name: newTableGroupName,
            })
        );
    },

    async removeTableGroup(id) {
        await rest.deleteData(`/rest/tablegroup/${id}`, "");
    },

    async loadTablesFromTableGroup(selectedTableGroup) {
        if (!selectedTableGroup) {
            return null;
        }
        return await rest.fetchData(`/rest/tablegroup/${selectedTableGroup.id}/tables`);
    },

    async createTable(tablegroup, newTableNumber) {
        if (!TableGroup || !newTableNumber) {
            return;
        }
        await rest.putData("/rest/table",
            JSON.stringify({
                name: newTableNumber,
                tgid: tableGroup.id
            })
        );
    },

    async loadTables() {
        return await rest.fetchData("/rest/table");
    },

    async removeTable(id) {
        await rest.deleteData(`/rest/table/${id}`, "");
    },

    async createStation(newStationName) {
        if (!newStationName) {
            return;
        }
        await rest.putData("/rest/station",
            JSON.stringify({
                name: newStationName
            })
        );
    },

    async loadStations() {
        return await rest.fetchData("/rest/station");
    },

    async removeStation(id) {
        await rest.deleteData(`/rest/station/${id}`, "");
    },

    async loadAlertTypes() {
        return await rest.fetchData("/rest/alerttypes");
    },

    async createAlertType(newAlertTypeName) {
        if (!newAlertTypeName) {
            return;
        }
        await rest.putData("/rest/alerttypes",
            JSON.stringify({
                name: newAlertTypeName
            })
        );
    },

    async loadProductCategories() {
        return await rest.fetchData("/rest/category");
    },

    async createProductCategory(newPCName) {
        if (!newPCName) {
            return;
        }
        await rest.putData("/rest/category",
            JSON.stringify({
                name: newPCName
            })
        );
    },

    async loadPaymentMethods() {
        return await rest.fetchData("/rest/paymentmethod")
    },

    async createPaymentMethod(newPMName) {
        if (!newPMName) {
            return;
        }
        await rest.putData("/rest/paymentmethod",
            JSON.stringify({
                name: newPMName
            })
        );
    },

    async updateDefaultPM(defaultMethod) {
        if (!defaultMethod) {
            return;
        }
        await rest.putData("/rest/paymentmethod/default",
            JSON.stringify({
                pmid: defaultMethod
            })
        );
    },

    async removePM(id) {
        await rest.deleteData(`/rest/paymentmethod/${id}`, "");
    },

    async removePC(id) {
        await rest.deleteData(`/rest/category/${id}`, "");
    },

    async removeAT(id) {
        await rest.deleteData(`/rest/alerttypes/${id}`, "");
    },

    async loadIngredients() {
        return await rest.fetchData("/rest/ingredient");
    },

    async createIngredient(newIngredientName) {
        if (!newIngredientName) {
            return;
        }
        await rest.putData("/rest/ingredient",
            JSON.stringify({
                name: newIngredientName
            })
        );
    },

    async removeIngredient(id) {
        await rest.deleteData(`/rest/ingredient/${id}`, "");
    },

    async loadProducts() {
        return await rest.fetchData("/rest/product/full");
    },

    async showProductDetails(product) {
        this.productDetailModal = product
        var pdm = new bootstrap.Modal(document.getElementById('productDetailModal'))
        pdm.show()
    },

    async updateProduct(product) {
        if (!product) {
            return null;
        }
        if (product.id) {
            await rest.putData(`/rest/product/${product.id}`, JSON.stringify(product));
            return null
        } else {
            return await rest.putData(`/rest/product`, JSON.stringify(product));
        }
    },

    async removeProduct(id) {
        await rest.deleteData(`/rest/product/${id}`, "");
    },

    async createVariation(product, newVariation) {
        if (!newVariation || !product) {
            return;
        }
        await rest.putData(`/rest/product/${product.id}/variation`,
            JSON.stringify(pDnewVariation)
        );
    },

    async getVariationsFromProduct(product) {
        if (!product) {
            return null;
        }
        return await rest.fetchData(`/rest/product/${product.id}/variations`);
    },

    async removeVariation(v) {
        if (!v) {
            return null;
        }
        await rest.deleteData(`/rest/variation/${v.id}`);
    },


    async mapProductIngredient(product, newIngredient) {
        if (!newIngredient || !product) {
            return;
        }
        await rest.putData(`/rest/product/${product.id}/ingredients`,
            JSON.stringify(this.pDnewIngredient)
        );
    },

    async getIngredientsFromProduct(product) {
        if (!product || !product.id) {
            return null;
        }
        return await rest.fetchData(`/rest/product/${product.id}/ingredients`);
    },

    async removeProductIngredient(pi) {
        if (!pi) {
            return null;
        }
        await rest.deleteData(`/rest/product/ingredient/${pi.id}`);
    },

    async loadAccounts() {
        return await rest.fetchData("/rest/account");
    },

    async removeAccount(a) {
        await rest.deleteData(`/rest/account/${a.id}`);
    },

    async updateAccount(a) {
        await rest.putData(`/rest/account/${a.id}`, JSON.stringify(a));
    },

    async createAccount(newAccount) {
        await rest.putData(`/rest/account`, JSON.stringify(newAccount));
    },

    async loadRegActive() {
        return await rest.fetchData("/rest/registrationactive")
    },

    async updateRegActive(registrationActive) {
        await rest.putData("/rest/registrationactive", JSON.stringify({
            registrationActive: registrationActive
        }));
    },

    async loadDBConfig() {
        return await rest.fetchData("/rest/system/database/config")
    },

    async dbTestSettings(dbconfig) {
        let tmp = await this.postData("/rest/system/database/test", JSON.stringify(dbconfig));
        return tmp.test_result;
    },

    async loadSessionsFromTable(table) {
        if (!table) {
            return;
        }
        return await rest.fetchData(`/rest/table/${table.id}/sessions`);
    },

    async loadBillsFromSessionId(sessionid) {
        if (!sessionid) {
            return;
        }
        return await rest.fetchData(`/rest/billing/${sessionid}/closedbills`);
    },

}

