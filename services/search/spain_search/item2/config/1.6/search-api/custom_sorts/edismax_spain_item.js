// ------------------------------------------------------------
//
// Javascript implementation that is used by custom sort funtion
// for Singapore Rakuten Ichiba -
//
// ------------------------------------------------------------

// logger
if ( this["logger"] == undefined && this["importClass"] != undefined ) {
    importClass(org.slf4j.LoggerFactory);
    var logger = org.slf4j.LoggerFactory.getLogger("CUSTOM_SORT");
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

//TODO exclude non-stored fields. but it is not returned anyway.
var DEFAULT_VISIBLE_FIELDS = filter_main_fields(QT.getDefaultSearchableFields());
var DEFAULT_VISIBLE_FIELDS_STR = DEFAULT_VISIBLE_FIELDS.join(",");
logger.info("DEFAULT_VISIBLE_FIELDS = {}", DEFAULT_VISIBLE_FIELDS_STR);
logger.info("number of fields in DEFAULT_VISIBLE_FIELDS = {}", DEFAULT_VISIBLE_FIELDS.length);

function fill_column(request) {
    var column = request.getLastValueInOtherParams("column");
    if ( column == null ) {
        request.replaceOtherParams("column", DEFAULT_VISIBLE_FIELDS_STR);
        logger.debug("fill in column");
    }
}

// Transform query with edismax
//    This should with GSPQueryTreeTransformFunc interface.
//    This function is applied for each ATOM.
function edismax_func(atom, context) {
    
    var DEFAULT_FIELD_NAME = "cf_text";

    if ( context.data == null ) {
        // to store field names.
        context.data = new Object();
    }
    
    // values used for cf_text into edismax.
    if ( atom.field == DEFAULT_FIELD_NAME ) {
        
        // set flag
        context.data["edismax"] = true;
        
        // make field name empty.
        atom.field = "";
    }
    
    return atom;
}

//
// Get the field list to expand qf paramter
// for edismax.
//
function expand_qf_parameter(req) {
    //
    // expand paramters to use edismax query parser
    //
    //var qf = QT.getDefaultSearchableFields();
    //qf = qf.join(" ");
    var qf = "base_sku sku shop_name item_name description size color variant_names variant_values brand skus tag_line _query_boost_terms_exact";

    req.addToOtherParams("qf", qf);
}

//
// Expand qf parameter for the specific service
//
function expand_qf_service(req) {

    var qf = "base_sku^0.08 sku^0.08 shop_name^0.9 item_name^1.3 description^0.06 size^0.1 color^0.1 variant_names^0.1 variant_values^0.1 brand^0.2 skus^0.09 tag_line^0.09 _query_boost_terms_exact^0.1";

    req.addToOtherParams("qf", qf);
}

//
// Expand qf parameter for the specific service
//
function expand_qf_service_nosqip(req) {

    var qf = "base_sku^0.08 sku^0.08 shop_name^0.9 item_name^1.3 description^0.06 size^0.1 color^0.1 variant_names^0.1 variant_values^0.1 brand^0.2 skus^0.09 tag_line^0.09";

    req.addToOtherParams("qf", qf);
}

//
// Expand pf parameter for the specific service
//
function expand_pf_service(req) {

    var pf = "item_name^1.6 shop_name^0.7 _query_boost_terms_exact^0.03";

    req.addToOtherParams("pf", pf);
}

//
// Expand pf parameter for the specific service
//
function expand_pf_service_nosqip(req) {

    var pf = "item_name^1.6 shop_name^0.7";

    req.addToOtherParams("pf", pf);
}

//
// Use extra fields to improve relevancy.
//
// context is GSPQueryTreeContext.
function relevancy_func(t, context){
    
    var expr = t.transform(edismax_func, context);
    
    if ( context.data != null && context.data["edismax"] == true ) {
        
        var req = context.request;
        expand_qf_service(req);
        //expand_pf_service(req);

        //
        // add paramters to other param list of SearchRequest.
        //

        req.addToOtherParams("defType", "edismax");

        //var boost = "log(sort_score)";
        var mm = "100%";
        var tie = "0.08";

        //req.addToOtherParams("boost", boost);
        req.addToOtherParams("mm", mm);
        req.addToOtherParams("tie", tie);

    }
    
    // in order to fill "column="
    fill_column(context.request);
    
    return expr;
}

//
// Use extra fields to improve relevancy.
//
// context is GSPQueryTreeContext.
function relevancy_func_nosqip(t, context){
    
    var expr = t.transform(edismax_func, context);
    
    if ( context.data != null && context.data["edismax"] == true ) {
        
        var req = context.request;
        expand_qf_service_nosqip(req);
        //expand_pf_service_nosqip(req);

        //
        // add paramters to other param list of SearchRequest.
        //

        req.addToOtherParams("defType", "edismax");

        //var boost = "log(sort_score)";
        var mm = "100%";
        var tie = "0.08";

        //req.addToOtherParams("boost", boost);
        req.addToOtherParams("mm", mm);
        req.addToOtherParams("tie", tie);
    }

    // in order to fill "column="
    fill_column(context.request);
    
    return expr;
}

//
// Use extra fields to improve recall by using edismax.
//
// context is GSPQueryTreeContext.
function recall_func(t, context){
    
    var expr = t.transform(edismax_func, context);
    
    if ( context.data != null && context.data["edismax"] == true ) {
        var req = context.request;

        expand_qf_parameter(req);        

        req.addToOtherParams("defType", "edismax");

        var mm = "100%";
        var tie = "0.08";

        req.addToOtherParams("mm", mm);
        req.addToOtherParams("tie", tie);
    }
    
    // in order to fill "column="
    fill_column(context.request);
    
    return expr;
}

// ------------------------------------------------------------
//
// Register functions to query transformer.
//
// ------------------------------------------------------------

QT.addSort("-score", relevancy_func_nosqip, "-score");
QT.addSort("relevancy", relevancy_func, "-score");        // With SQIP

// apply recall_func to any other sortby types.
QT.addSort(QT.SORTBY_NAME_ANY, recall_func, QT.SORTBY_RESULT_NOCHANGE);
