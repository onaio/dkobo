kobo.directive ('kobocatFormPublisher', ['$api', '$miscUtils', '$routeTo', function ($api, $miscUtils, $routeTo) {
    return {
        scope: {
            item: '='
        },
        templateUrl: staticFilesUri + 'templates/KobocatFormPublisher.Template.html',
        link: function (scope, element, attributes) {
            var dialog = element.find('.forms__kobocat__publisher');
            scope.publish = function () {
                var spinner = '<i class="fa fa-spin fa-spinner"></i> Deploying Project';
                $('button.save-button .ui-button-text').html(spinner);
                $('button.save-button').addClass('save-button--deploying');
                function success (results, headers) {
                    $('button.save-button .ui-button-text').html('Deploy and View New Project');
                    $('button.save-button').removeClass('save-button--deploying');
                    scope.close();
                    $miscUtils.alert('Survey Publishing succeeded');
                    // commented the line below to prevent redirecting after survey draft has been published
                    // $routeTo.external(results.published_form_url);
                }
                function fail (response) {
                    $('button.save-button .ui-button-text').html('Deploy and View New Project');
                    $('button.save-button').removeClass('save-button--deploying');
                    scope.show_form_name_exists_message = true;
                    scope.error_message = 'Survey Publishing failed: ' + (response.data.text || response.data.error || response.data.detail);
                }

                var id = scope.form_name ? dkobo_xlform.model.utils.sluggifyLabel(scope.form_name) : '';
                $api.surveys
                    .publish({id: scope.item.id,
                              title:scope.form_label,
                              id_string: id,
                              description: scope.form_description,
                              categories: scope.form_categories,
                              shared: scope.form_shared,
                              tags: scope.form_tags
                            })
                    .then(success, fail);
            };

            scope.form_label = scope.item.name;
            scope.categories = function () {
                $.getJSON( "/static/kobo/categories.json", function( data ) {
                  var options = '';
                  $.each( data, function( key, val ) {
                    if (key === 0) {
                        scope.defaultSelectVal = {"id": val.id, "name": val.name}
                    }
                    options += "<option value='" + val.id + ((key === 0) ? "' selected='selected'>" : "'>") + val.name + "</option>" ;
                  });
                  $( ".form-categories" ).empty().append(options)
                });
            };

            scope.open = function () {
                scope.categories()
                scope.show_publisher = true;
                dialog.dialog('open');
            };
            scope.close = function () {
                scope.show_publisher = false;
                dialog.dialog('close');
            };
            scope.show_publisher = false;

            scope.show_form_name_exists_message = false;
            scope.get_form_id = function (item) {
                return JSON.parse(item.summary).form_id;
            };
            scope.form_name = scope.get_form_id(scope.item);

            dialog.dialog({
                modal: true,
                height: 575,
                width: 580,
                autoOpen: false,
                title: 'Deploy survey draft as new map',
                draggable: false,
                resizable: false,
                position: { my: "top", at: "top"},
                buttons: [
                    {
                        text: "Deploy and View New Map",
                        "class": 'save-button',
                        click: scope.publish
                    },
                    {
                        text: "Cancel",
                        "class": 'cancel-button',
                        click: scope.close
                    }
                ],
                open: function(){
                    $('.ui-widget-overlay').bind('click',function(){
                        dialog.dialog('close');
                    });
                }

            });
        }
    }
}]);