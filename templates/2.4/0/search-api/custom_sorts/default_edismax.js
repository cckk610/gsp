// ------------------------------------------------------------
//
// Default sort function in Javascript for GSP
// $Id: default_edismax.js 5198 2012-08-16 08:30:45Z kamioshotaro01 $
//
// ------------------------------------------------------------

// Examples?
//
//   query=cf_text:wii+AND+cf_text:console&sortby=relevancy
//   query=cf_text:v1&sortby=relevancy
//   query=cf_text:v1&sortby=%2Brecall
//   query=cf_text:v1&filter=min_price:[100%3B500]&sortby=%2Brecall
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
    req.addToOtherParams("defType", "edismax");
    req.addToOtherParams("qf", qf);
}

//
// Use extra fields to improve relevancy.
//
// context is GSPQueryTreeContext.
function relevancy_func(t, context){
    
    var expr = t.transform(edismax_func, context);
    
    if ( context.data != null && context.data["edismax"] == true ) {
        
        var req = context.request;
        expand_qf_parameter(req);

        //
        // add paramters to other param list of SearchRequest.
        //
        
        //If we want to tune the search relevancy, qf and other paramteres should be specified.
        //var qf = "f1^0.3 f2^1.2 f3^0.02"

        var pf = "";
        var boost = "max(_doc_boost,1)";
        var tie = "0.0";
        
        req.addToOtherParams("pf", pf);
        req.addToOtherParams("boost", boost);
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
    }
    
    return expr;
}


// ------------------------------------------------------------
//
// Register functions to query transformer.
//
// ------------------------------------------------------------

QT.addSort("relevancy", relevancy_func, "-score");


// The following query transformations works transparently (without changing score type).
// sort type can have '+', '-'

//var fieldname;
//fieldname = "prch_item_num";
//QT.addSort('-' + fieldname, relevancy_func, '-' + fieldname);
//QT.addSort('+' + fieldname, relevancy_func, '+' + fieldname);
//
//fieldname = "published_date";
//QT.addSort('-' + fieldname, recall_func, '-' + fieldname);
//QT.addSort('+' + fieldname, recall_func, '+' + fieldname);


// apply recall_func to any other sortby types.
QT.addSort(QT.SORTBY_NAME_ANY, recall_func, QT.SORTBY_RESULT_NOCHANGE);

