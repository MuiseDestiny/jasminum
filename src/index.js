import jasminum from "./jasminum"
import nlp from "./nlp"
import scrape from "./scrape"
import ui from "./ui";
import utils from "./utils";

import events from "./events"


// Import main module
jasminum.NLP = nlp
jasminum.Scrape = scrape
jasminum.Utils = utils
jasminum.UI = ui

Object.assign(jasminum, events);

Zotero.Jasminum = jasminum;

window.addEventListener(
    "load",
    function (e) {
        Zotero.Jasminum.init();
    },
    false
);