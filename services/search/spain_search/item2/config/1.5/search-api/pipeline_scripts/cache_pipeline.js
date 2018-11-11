// Cache plugin for spain search

function LRUCache(capacity, expireWithinByMinutes) {

    this.queue = [];
    if (capacity == null){
        capacity = 10;
    }
    this.capacity = capacity;
    if (expireWithinByMinutes == null) {
       expireWithinByMinutes = 5;
    }
    this.expire = expireWithinByMinutes;
    this.cache = com.google.common.cache.CacheBuilder.newBuilder()
        .maximumSize(capacity).expireAfterWrite(this.expire, java.util.concurrent.TimeUnit.MINUTES ).recordStats().build();
}

LRUCache.prototype.getEntry = function (key) {
    return this.cache.getIfPresent(key);
}

LRUCache.prototype.setEntry = function(key, value) {
    this.cache.put(key, value);
}

LRUCache.prototype.printStats = function () {
    return this.cache.stats().toString();
}

/////////////////////////////////////////////////////

var relevancyPlugin = QTDefaults.getRelevancyStage();
var solrPlugin = QTDefaults.getSearcherStage();
var jsonwriterPlugin = new JsonResponseWriterPlugin();

// logger
if ( this["logger"] == undefined && this["importClass"] != undefined ) {
    importClass(org.slf4j.LoggerFactory);
    var logger = org.slf4j.LoggerFactory.getLogger("spain_search");
}

var queryCache = new LRUCache(100, 5);


var skipSolrIfCachedQueryPlugin =  new QueryPlugin {

    prepare: function(pipeline) {
        relevancyPlugin.prepare(pipeline);
        solrPlugin.prepare(pipeline);
        return true;
    },

    processQuery : function(request, context) {
        var isLogCache = request.getLastValueInOtherParams("logcache");
        if (isLogCache != null) {
            logger.info("cache stats (capacity:" + queryCache.capacity + ", expireIn=" + queryCache.expire + ", '{}'", queryCache.printStats());
            context.setPluginOutput("cache stats", "capacity:" + queryCache.capacity + ", expireIn=" + queryCache.expire + ", '" + queryCache.printStats() + "'")
            context.getRequest().removeOtherParams("logcache");
        }
        var entry = queryCache.getEntry(request.toString());
        if (entry != null) {
            return true
        } else {

            relevancyPlugin.processQuery(request, context);
            return solrPlugin.processQuery(request, context);
        }
    },

    close: function() {
        relevancyPlugin.close();
        solrPlugin.close();
        return true;
    }
}

var skipSolrIfCachedResultPlugin = new ResultPlugin{

    prepare: function(pipeline) {

        jsonwriterPlugin.prepare(pipeline);
        return true;
    },

    processResult: function(context) {

        if (context.getResponse().isError() != true) {

            var entry = queryCache.getEntry(context.getRequest().toString());
            if (entry != null) {
                // use cache
                context.setOkResult(entry);
            } else {

                jsonwriterPlugin.processResult(context);
                queryCache.setEntry(context.getRequest().toString(), context.getResponse().getResponse());
            }
        }
        return true;
    },

    close: function() {

        jsonwriterPlugin.close();
        return true;
    }
}

//
var qspain = QTMgr.createPipeline("spain");
qspain.addStage("ExtraHeader", new ExtraHeaderQueryPlugin());
//qspain.addStage("Relevancy", QTDefaults.getRelevancyStage());
qspain.addStage("SkipSolrIfCached", skipSolrIfCachedQueryPlugin);
qspain.endAddingStages();
QTMgr.replacePipeline("default", qspain);

var wspain = WTMgr.createPipeline("spain");
wspain.addStage("ZeroHitLog", new ZeroHitLogPlugin());
wspain.addStage("SkipSolrIfCached", skipSolrIfCachedResultPlugin);
wspain.endAddingStages();
WTMgr.replacePipeline("default", wspain);
