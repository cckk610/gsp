/**
 * --------------------------------------------------------------
 *
 * Javascript implementation that is used by custom sort function
 *
 * --------------------------------------------------------------
 */

// init_custom_sort() has to be defined when you use 00_custom_sort_lib.js
function init_custom_sort() {

    // Per service definition

    //==================================================
    // qf fields
    //==================================================
    
    // SQIP
    var qf_fields_sqip = [
        { field: "item_name",                   weight: 2.0  },
        { field: "description",                 weight: 1.0  },
        { field: "tag_line",                    weight: 1.2  },
        { field: "brand",                       weight: 1.4  },

        { field: "shop_name",                   weight: 0.8  },
        { field: "base_sku",                    weight: 0.2  },
        { field: "variant_names",               weight: 0.2  },
        { field: "variant_values",              weight: 0.2  },

        { field: "gtin",                        weight: 0    },
        { field: "exact_match",                 weight: 0    },
        { field: "partial_match",               weight: 0    },
        { field: "_query_boost_terms_payloads", weight: 0    },
    ];
    
    // noSQIP
    var qf_fields_nosqip = [
        { field: "item_name",                   weight: 2.0  },
        { field: "description",                 weight: 1.0  },
        { field: "tag_line",                    weight: 1.2  },
        { field: "brand",                       weight: 1.4  },

        { field: "shop_name",                   weight: 0.8  },
        { field: "base_sku",                    weight: 0.2  },
        { field: "variant_names",               weight: 0.2  },
        { field: "variant_values",              weight: 0.2  },
        
        { field: "gtin",                        weight: 0    },
        { field: "exact_match",                 weight: 0    },
        { field: "partial_match",               weight: 0    },
        { field: "_query_boost_terms_payloads", weight: 0    },
    ];
  
    
    //==================================================
    // pf fields
    //==================================================

    // SQIP
    var pf_fields_sqip = [
        { field: "item_name",           weight: 1.0 },
        { field: "shop_name",           weight: 0.2 },
    ];
    
    // noSQIP
    var pf_fields_nosqip = [
        { field: "item_name",           weight: 1.0 },
        { field: "shop_name",           weight: 0.2 },
    ];
    

    //==================================================
    // rewrite fields
    //==================================================
    var rewrite_fields = [];
    
    
    
    //==================================================
    // spec
    //==================================================

    // default parameters for spec
    var DEFAULT_DOCBOOST = "max(_doc_boost,0.001)";
    var DEFAULT_TIE = "0.1";
    var DEFAULT_MM = "100%";

    // SQIP
    var relevancy_sqip_spec = {

        // <cf_text_field_name> : <relevancy_function> or <action := dictionary of parameter and value> { <param> : <value>, ... }

        "cf_text" : {
            "qf"    : new FieldsWithWeights(qf_fields_sqip),
            "pf"    : new FieldsWithWeights(pf_fields_sqip),
            "boost" : DEFAULT_DOCBOOST,
            "tie"   : DEFAULT_TIE,
            "mm"    : DEFAULT_MM,
        },
        
        // For relevancy tuning
        "cf_text_ab" : {
//            "tie"   : DEFAULT_TIE,
            "mm"    : DEFAULT_MM,
        },
        
        "_rewrite" : new RewriteFields(rewrite_fields),

    };


    // noSQIP
    var relevancy_nosqip_spec = {

        // <cf_text_field_name> : <relevancy_function> or <action := dictionary of parameter and value> { <param> : <value>, ... }

        "cf_text" : {
            "qf"    : new FieldsWithWeights(qf_fields_nosqip),
            "pf"    : new FieldsWithWeights(pf_fields_nosqip),
            "boost" : DEFAULT_DOCBOOST,
            "tie"   : DEFAULT_TIE,
            "mm"    : DEFAULT_MM,
        },
        
        "_rewrite" : new RewriteFields(rewrite_fields),

    };

 
    // recall spec
    var recall_spec = {
    
        "cf_text" : {
            "qf"    : new FieldsWithoutWeights(qf_fields_sqip),
            "boost" : DEFAULT_DOCBOOST,
            "tie"   : DEFAULT_TIE,
            "mm"    : DEFAULT_MM,
        },   

        "_rewrite" : new RewriteFields(rewrite_fields),

    };

    /** 
     * ------------------------------------------------------------
     *
     * Register functions to query transformer.
     *
     * ------------------------------------------------------------
     */

    
    //SQIP
    QT.addSort("relevancy", relevancy_func_with_spec(relevancy_sqip_spec), "-score,-_category_boost,-update_time");
    
    //noSQIP
    QT.addSort("-score", relevancy_func_with_spec(relevancy_nosqip_spec), "-score,-_category_boost,-update_time");

    // apply recall_func to any other sortby types.
    QT.addSort(QT.SORTBY_NAME_ANY, recall_func_with_spec(recall_spec), QT.SORTBY_RESULT_NOCHANGE);

}

// Execute if library is loaded prior to this script. Otherwise, library will call it.
if ( this["custom_sort_lib_loaded"] == true ) {
    init_custom_sort();
}
