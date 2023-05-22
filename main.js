const { app, BrowserWindow, ipcMain } = require('electron')
let fs = require('fs')
const path = require("path");

const createWindow = () => {
    const win = new BrowserWindow({
      width: 800,
      height: 600,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
    },
    autoHideMenuBar: true,
    })
  
    win.loadFile('index.html')
}

app.whenReady().then(() => {
    createWindow()
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
          createWindow()
        }
    })
    ipcMain.on('dataflow', (evt, payload) => {
        try {
            var output = parseConfigData(payload)
            fs.writeFileSync(path.join(app.getPath("exe"),
                'output.json'), JSON.stringify(output))
        } catch (error) {
        }
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit()
    }
})

function parseConfigData(data) {
    console.log()
    var node_map = data["drawflow"]["Home"]["data"]

    var node_map_keys = Object.keys(node_map)

    var start_nodex_key

    var categories = []
    var items = []
    var detailsCategories = []
    var details = []
    
    var node_to_index = {}

    for (var key in node_map) {
        var value = node_map[key]
        if (value["name"] == "startgroup") {
            start_nodex_key = key
        } else if (value["name"] == "category") {
            node_to_index[key] = categories.length
            categories.push(value)
        } else if (value["name"] == "item") {
            node_to_index[key] = items.length
            items.push(value)
        } else if (value["name"] == "detailcateory") {
            node_to_index[key] = detailsCategories.length
            detailsCategories.push(value)
        } else if (value["name"] == "detail") {
            node_to_index[key] = details.length
            details.push(value)
        }
    }

    var output = {
        "category": [],
        "detail_categories": [],
        "items": []
    }

    for (var i in node_map[start_nodex_key]["outputs"]["output_1"]["connections"]) {
        var node_key = node_map[start_nodex_key]["outputs"]["output_1"]["connections"][i]["node"]
        var cate_node = node_map[node_key]
        var items_ = []
        var details = []
        for (var k in cate_node["outputs"]["output_1"]["connections"]) {
            var item_node_key = cate_node["outputs"]["output_1"]["connections"][k]["node"]
            items_.push(node_to_index[item_node_key])

            var details_ = []

            detailCateNodes = node_map[item_node_key]["outputs"]["output_1"]["connections"]

            for (var n in detailCateNodes) {
                var detailCateNodeIndex = detailCateNodes[n]["node"]
                details_.push(node_to_index[detailCateNodeIndex])
            }
            details.push(details_)
        }
        output["category"].push({"title": cate_node["data"]["name"], "items": items_, "details": details})
        
    }

    for (var i in detailsCategories) {
        var detailCategory = detailsCategories[i]
        var detailCategoryOutpus = detailCategory["outputs"]["output_1"]["connections"]

        var details_ = []
        for (var k in detailCategoryOutpus) {
            var detail = node_map[detailCategoryOutpus[k]["node"]]
            details_.push({
                "name": detail["data"]["name"], "price": detail["data"]["price"]
            })
        }
        output["detail_categories"].push({"name": detailCategory["data"]["name"], "details": details_})
    }
    for (var i in items) {
        var d = items[i]["data"]
        output["items"].push({"name": d["name"], "price": d["price"], "image": d["image"], "description": d["description"]})
    }
    return output
}