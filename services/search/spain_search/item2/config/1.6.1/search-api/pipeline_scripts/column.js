// logger
if ( this["logger"] == undefined && this["importClass"] != undefined ) {
    importClass(org.slf4j.LoggerFactory);
    var logger = org.slf4j.LoggerFactory.getLogger("fillColumnPlugin");
}


// global variables and functions
var EXT_FIELD_REGEX = new RegExp("\\-ext[0-9]$");
var INTERNAL_ONLY_FIELDS_REGEX = new RegExp("^_.*$");

function filter_main_fields(arr) {
    var lst = [];
    for (var i = 0; i < arr.length; i++) {
        if ( ! EXT_FIELD_REGEX.exec(arr[i]) &&
             ! INTERNAL_ONLY_FIELDS_REGEX.exec(arr[i]) ) {
            lst.push(arr[i]);
        }
    }
    return lst;
}

// hack internal access..
var relevancyTransformer = QTDefaults.getRelevancyStage().getTransformer();
logger.debug("relevancyTransformer = {}", relevancyTransformer);
//TODO  Exclude non-stored fields. but they are not returned anyway.
var DEFAULT_VISIBLE_FIELDS = filter_main_fields(relevancyTransformer.getDefaultSearchableFields());
DEFAULT_VISIBLE_FIELDS.push("_update_date"); // This internal field might be used in RMSG.
var DEFAULT_VISIBLE_FIELDS_STR = DEFAULT_VISIBLE_FIELDS.join(",");
logger.info("DEFAULT_VISIBLE_FIELDS = {}", DEFAULT_VISIBLE_FIELDS_STR);
logger.info("Number of fields in DEFAULT_VISIBLE_FIELDS = {}", DEFAULT_VISIBLE_FIELDS.length);
relevancyTransformer=null;


function fill_column(request) {
    var FL_PARAM = "fl";
    var column = request.getLastValueInOtherParams(FL_PARAM);
    if ( column == null ) {
        request.replaceOtherParams(FL_PARAM, DEFAULT_VISIBLE_FIELDS_STR);
        // we don't need this log all the time
        if ( request.getLastValueInOtherParams("sid") == "ngs_test" ) {
            logger.info("fill in 'fl'");
        }
        else {
            logger.debug("fill in 'fl'");
        }
    }
}

var fillColumnPlugin = new QueryPlugin {
    prepare : function (pipeline) {
        return true;
    },
    processQuery: function(request, context) {
        fill_column(request);
        return true;
    },
    close: function() {
        return true;
    }
};

var fillColumn = QTMgr.createPipeline("fillColumn"); // setup new pipeline with name "fillColumn"
fillColumn.addStage("Relevancy", QTDefaults.getRelevancyStage());
fillColumn.addStage("fillColumn", fillColumnPlugin);
fillColumn.addStage("SolrSearcher", QTDefaults.getSearcherStage());
fillColumn.endAddingStages();

QTMgr.replacePipeline("default", fillColumn);
