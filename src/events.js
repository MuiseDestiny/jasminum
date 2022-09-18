export default {
    init: function () {
        // https://udn.realityripple.com/docs/Mozilla/JavaScript_code_modules/OSFile.jsm
        // 文件操作模块，文件判断，文件路径等
        // Components.utils.import("resource://gre/modules/osfile.jsm");

        // Register the callback in Zotero as an item observer
        var notifierID = Zotero.Notifier.registerObserver(
            Zotero.Jasminum.notifierCallback,
            ["item"]
        );
        // Unregister callback when the window closes (important to avoid a memory leak)
        window.addEventListener(
            "unload",
            function (e) {
                Zotero.Notifier.unregisterObserver(notifierID);
            },
            false
        );
        // 等待数据维护更新完毕
        // await Zotero.Schema.schemaUpdatePromise;

        Zotero.Jasminum.initPref();

        Zotero.debug("Init Jasminum ...");
    },

    initPref: function () {
        if (Zotero.Prefs.get("jasminum.pdftkpath") === undefined) {
            var pdftkpath = "C:\\Program Files (x86)\\PDFtk Server\\bin";
            if (Zotero.isLinux) {
                pdftkpath = "/usr/bin";
            } else if (Zotero.isMac) {
                pdftkpath = "/opt/pdflabs/pdftk/bin";
            }
            Zotero.Prefs.set("jasminum.pdftkpath", pdftkpath);
        }
        // Default preference value
        let defaultPrefs = {
            "autoupdate": false,
            "namepatent": "{%t}_{%g}",
            "zhnamesplit": true,
            "rename": true,
            "autobookmark": true,
            "autolanguage": true,
            "language": "zh-CN", // issues/112
            "languagelist": "zh,en",
            "ennamesplit": true,
            "attachment": "pdf",
            "citefield": "extra",
            "dateformatter": "ISO",
            "dateformatterfill": false
        };
        for (let [key, value] of Object.entries(defaultPrefs)) {
            if (Zotero.Prefs.get(`jasminum.${key}`) === undefined) {
                Zotero.Prefs.set(`jasminum.${key}`, value);
            }
        }
    },

    // Notification when new item is added
    notifierCallback: {
        // Check new added item, and adds meta data.
        notify: async function (event, type, ids, extraData) {
            // var automatic_pdf_download_bool = Zotero.Prefs.get('zoteroscihub.automatic_pdf_download');
            if (event == "add") {
                // Auto update meta data
                var addedItems = Zotero.Items.get(ids);
                if (Zotero.Prefs.get("jasminum.autoupdate")) {
                    Zotero.debug("** Jasminum new items added.");
                    var items = [];
                    for (let item of addedItems) {
                        if (Zotero.Jasminum.UI.isCNKIFile(item)) {
                            items.push(item);
                        }
                    }
                    Zotero.debug(`** Jasminum add ${items.length} items`);
                    Zotero.Jasminum.searchItems(items);
                }
                // Split or merge name
                if (!Zotero.Prefs.get("jasminum.zhnamesplit")) {
                    Zotero.debug("** Jasminum merge CN name");
                    var items = [];
                    for (let item of addedItems) {
                        if (
                            Zotero.Jasminum.CNDB.includes(
                                item.getField("libraryCatalog")
                            )
                        ) {
                            items.push(item);
                        }
                    }
                    Zotero.Jasminum.mergeName(items);
                }
                // Add bookmark after new PDF is attached.
                if (Zotero.Prefs.get("jasminum.autobookmark")) {
                    for (let item of addedItems) {
                        if (
                            item.parentID &&
                            Zotero.ItemTypes.getName(
                                item.parentItem.itemTypeID
                            ) == "thesis" &&
                            item.parentItem.getField("libraryCatalog") ==
                            "CNKI" &&
                            item.attachmentContentType == "application/pdf"
                        ) {
                            Zotero.debug("***** New PDF item is added");
                            await Zotero.Jasminum.addBookmarkItem(item);
                        }
                    }
                }
                // Set default language field
                if (Zotero.Prefs.get("jasminum.autolanguage")) {
                    for (let item of addedItems) {
                        if (
                            item.getField("language").match(/中文|cn|zh/)
                        ) {
                            Zotero.debug("***** Set default language");
                            await Zotero.Jasminum.setLanguage(item);
                        }
                    }
                }
            }
        },
    }

}