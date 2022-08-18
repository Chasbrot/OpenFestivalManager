function listToSelectHTML(list) {
    var s = "";
    if (list.length == 0) {
        return '<option disabled selected>' + "Keine Daten vorhanden" + '</option>'
    }
    s += '<option disabled selected>' + "Auswählen ..." + '</option>'
    list.forEach((e) => {
        s += '<option value="' + e.id + '">' + e.name + '</option>'
    })
    return s;
}

function listToTableContent(list, keys) {
    var s = "";
    if (list.length == 0) {
        return "Keine Daten vorhanden";
    }
    list.forEach((e) => {
        s += "<tr>";
        keys.forEach((k) => {
            s += "<td>";
            s += e[k];
            s += "</td>";
        })
        s += "</tr>";
    })
    return s;
}

function listToSimpleListItems(list) {
    var s = "";
    if (list.length == 0) {
        return "Keine Daten vorhanden";
    }
    list.forEach((e) => {
        s += '<div class="list-group-item"><td>';
        s += e.name;
        s += '</td></div>';
    });
    return s;
}

function loadTablesFromTableGroup(source, target) {
    var value = source.value;
    console.log(target)
    document.getElementById(target).innerHTML = "";
    $.ajax({
        url: "/rest/tablegroup/" + value + "/tables",
        success: (result) => {
            console.log(result)
            document.getElementById(target).innerHTML = listToSimpleListItems(result);
        }
    });
}

function loadTablesFromTableGroupSelect(source, target) {
    var value = source.value;
    console.log(target)
    document.getElementById(target).innerHTML = "";
    $.ajax({
        url: "/rest/tablegroup/" + value + "/tables",
        success: (result) => {
            console.log(result)
            document.getElementById(target).innerHTML = listToSelectHTML(result);
        }
    });
}

function loadTableGroups(target) {
    $.ajax({
        url: "/rest/tablegroup/",
        success: (result) => {
            document.getElementById(target).innerHTML = listToSelectHTML(result);
        }
    });
}

function ordersToHTML(list) {
    var s = "";
    if (list.length != 0) {
        list.forEach((o) => {
            s += '<div class="list-group-item py-0">';
            //Status icons
            switch (o.getCurrentState().statetype) {
                case 0:
                    s += '<img src="/images/order.png" style="width:15px">';
                    break;
                case 1:
                    s += '<img src="/images/loading.gif" style="width:15px">';
                    break;
                case 2:
                    s += '<img src="/images/outbox.png" style="width:15px">';
                    break;
                case 3:
                    s += '<img src="/images/check.png" style="width:15px">';
                    break;
                case 4:
                    s += '<img src="/images/cancel.png" style="width:15px">';
                    break;
            }
            s += o.amount + 'x ' + o.product.name;

            if (o.variation != null) {
                s += ',' + o.variation.attrname;
            }
            s += "</div>";
        });
    } else {
        s += '<div class="list-group-item py-0"> Keine Bestellungen</div>';
    }
    return s;
}




