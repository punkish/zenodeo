// creates a list of tags in the order they where created
var tags = []
{{#each hapiSwagger.tags}}
tags.push('{{name}}');
{{/each}}
$(function () {
    $('#input_apiKey').hide();
    var url = window.location.search.match(/url=([^&]+)/);
    if (url && url.length > 1) {
        url = decodeURIComponent(url[1]);
    } else {
        url = "{{{hapiSwagger.jsonPath}}}";
    }
    // Pre load translate...
    if(window.SwaggerTranslator) {
        window.SwaggerTranslator.translate();
    }
    // pull validatorUrl string or null form server
    var validatorUrl = null;
    {{#if hapiSwagger.validatorUrl}}
    validatorUrl: '{{hapiSwagger.validatorUrl}}';
    {{/if}}
    window.swaggerUi = new SwaggerUi({
        url: url,
        dom_id: "swagger-ui-container",
        supportedSubmitMethods: ['get', 'post', 'put', 'delete', 'patch'],
        onComplete: function (swaggerApi, swaggerUi) {
            if (typeof initOAuth == "function") {
                initOAuth({
                    clientId: "your-client-id",
                    clientSecret: "your-client-secret",
                    realm: "your-realms",
                    appName: "your-app-name",
                    scopeSeparator: ","
                });
            }
            if (window.SwaggerTranslator) {
                window.SwaggerTranslator.translate();
            }
            $('pre code').each(function (i, e) {
                hljs.highlightBlock(e)
            });
            if (Array.isArray(swaggerApi.auths) && swaggerApi.auths.length > 0 && swaggerApi.auths[0].type === "apiKey") {
                auth = swaggerApi.auths[0].value;
                $('#input_apiKey').show();
            }
            //addApiKeyAuthorization();
        },
        onFailure: function (data) {
            log("Unable to Load SwaggerUI");
        },
        docExpansion: "{{hapiSwagger.expanded}}",
        apisSorter: apisSorter.{{hapiSwagger.sortTags}},
        operationsSorter: operationsSorter.{{hapiSwagger.sortEndpoints}},
        showRequestHeaders: false,
        validatorUrl: '{{hapiSwagger.validatorUrl}}',
        jsonEditor: {{#if hapiSwagger.jsonEditor}}true{{else}}false{{/if}}
    });
    function addApiKeyAuthorization() {
        if($('#input_apiKey')){
            var key = $('#input_apiKey')[0].value;
            if (key && key.trim() != "") {
                if('{{{hapiSwagger.keyPrefix}}}' !== ''){
                   key = '{{{hapiSwagger.keyPrefix}}}' + key;
                }
                var apiKeyAuth = new SwaggerClient.ApiKeyAuthorization(auth.name, key, auth.in);
                window.swaggerUi.api.clientAuthorizations.add(auth.name, apiKeyAuth);
                log("added key " + key);
            }
        }
    }
    $('#input_apiKey').change(addApiKeyAuthorization);
    /*
    // if you have an apiKey you would like to pre-populate on the page for demonstration purposes...
    var apiKey = "Bearer 12345";
    $('#input_apiKey').val(apiKey);
    */
    window.swaggerUi.load();
    function log() {
        if ('console' in window) {
            console.log.apply(console, arguments);
        }
    }
});