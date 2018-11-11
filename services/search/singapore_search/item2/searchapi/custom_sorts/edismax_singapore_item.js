// ------------------------------------------------------------
//
// Javascript implementation that is used by custom sort funtion
// for Singapore Rakuten Ichiba -
//
// $Id: edismax_singaporesearch_item.js 5558 2012-09-14 09:44:10Z hiragakazuak01 $
// ------------------------------------------------------------

// Examples?
//
//   query=cf_text:wii+AND+cf_text:console&sortby=rps_sort1
//   query=cf_text:v1&sortby=rps_sort1
//   query=cf_text:v1&sortby=%2Breview_ave
//
//   query=cf_text:v1&filter=min_price:[100%3B500]&sortby=%2Breview_ave
//   query=cf_text:v1&filter=ebook_item_exclude_min_price:[100%3B500]&sortby=%2Breview_ave
//
//


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
    // item_caption is not used anymore.
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
    var qf = QT.getDefaultSearchableFields();
    qf = qf.join(" ");       
    req.addToOtherParams("qf", qf);
}

//
// Expand qf parameter for the specific service
//
function expand_qf_service(req) {

    var qf = "base_sku^0.1 sku^0.1 shop_name^1.2 item_name^1.5 description^0.1 tag_line^0.4 size^0.1 color^0.1 variant_names^0.1 variant_values^0.1 brand^0.2 skus^0.2";

    req.addToOtherParams("qf", qf);
}

//
// Expand pf parameter for the specific service
//
function expand_pf_service(req) {

    var pf = "item_name^1.2 shop_name^1.0 tag_line^0.2";

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
        //expand_qf_parameter(req);
        expand_qf_service(req);
        expand_pf_service(req);

        //
        // add paramters to other param list of SearchRequest.
        //

        req.addToOtherParams("defType", "edismax");

        var boost = "log(sort_score)";
        var mm = "100%";
        var tie = "0.1";

        req.addToOtherParams("boost", boost);
        req.addToOtherParams("mm", mm);
        req.addToOtherParams("tie", tie);

    }
    
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
        req.addToOtherParams("mm", mm);
    }
    
    return expr;
}

// ------------------------------------------------------------
//
// Register functions to query transformer.
//
// ------------------------------------------------------------

QT.addSort("relevancy", relevancy_func, "-score,-update_time");

// The following query transformations works transparently (without changing score type).
// sort type can have '+', '-'

var score = "score";
QT.addSort('-' + score, relevancy_func, '-' + score);

var update_time = "update_time";
QT.addSort('-' + update_time, relevancy_func, '-' + update_time);
QT.addSort('+' + update_time, relevancy_func, '+' + update_time);

var price_max = "price_max";
QT.addSort('-' + price_max, relevancy_func, '-' + price_max);
QT.addSort('+' + price_max, relevancy_func, '+' + price_max);

var price_min = "price_min";
QT.addSort('-' + price_min, relevancy_func, '-' + price_min);
QT.addSort('+' + price_min, relevancy_func, '+' + price_min);



// apply recall_func to any other sortby types.
//QT.addSort(QT.SORTBY_NAME_ANY, recall_func, QT.SORTBY_RESULT_NOCHANGE);
QT.addSort(QT.SORTBY_NAME_ANY, relevancy_func, QT.SORTBY_RESULT_NOCHANGE);
