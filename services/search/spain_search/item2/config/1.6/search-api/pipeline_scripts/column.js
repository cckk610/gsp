// logger
if ( this["logger"] == undefined && this["importClass"] != undefined ) {
    importClass(org.slf4j.LoggerFactory);
    var logger = org.slf4j.LoggerFactory.getLogger("fillColumnPlugin");
}

// column= will be populated in custom sort when sortby= is supplied.
// So, this stage fill column= only when sortby= is not specified.
// It's probably for debug purpose or healthcheck, not a real query from users.
// So, fixed field list should be fine for this.
//TODO: This list has to be reviewed when schema is updated. However, the risk for real queries should be low because of the above reason.

var DEFAULT_FILL_COLUMNS = "search_id,shop_id,item_id,update_time,base_sku,skus,mall_id,shop_url,shop_name,item_name,price_min,price_max,item_image_url1,image_description1,rakuten_product_category_id1,rakuten_product_category_id2,rakuten_product_category_id3,shop_category_ids,is_base,is_free_shipping,is_inventory_exist,live_start_time,live_end_time,searchable_start_time,searchable_end_time,shop_status,is_test,sort_score,is_representative,item_point_rate,is_private,merchant_id,gtin,sqip_id,description,short_description";

logger.info("DEFAULT_FILL_COLUMNS = {}", DEFAULT_FILL_COLUMNS);

var fillColumnPlugin = new QueryPlugin {
    prepare : function (pipeline) {
        return true;
    },
    processQuery: function(request, context) {
        var column = request.getLastValueInOtherParams("fl");
        if ( column == null ) {
            request.replaceOtherParams("fl", DEFAULT_FILL_COLUMNS);
            logger.info("fill in 'fl'");
        }
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
