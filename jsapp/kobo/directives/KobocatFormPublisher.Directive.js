kobo.directive ('kobocatFormPublisher', ['$api', '$miscUtils', '$routeTo', function ($api, $miscUtils, $routeTo) {
    return {
        scope: {
            item: '='
        },
        templateUrl: staticFilesUri + 'templates/KobocatFormPublisher.Template.html',
        link: function (scope, element, attributes) {
            var dialog = element.find('.forms__kobocat__publisher');
            scope.validate = function(input_fields) {
                for (i = 0; i < input_fields.length; i++) {
                    if (typeof input_fields[i] === "undefined") {
                        return false;
                    }
                }
                return true;
            };
            scope.publish = function () {
                var spinner = '<i class="fa fa-spin fa-spinner"></i> Deploying Map';
                $('button.save-button .ui-button-text').html(spinner);
                $('button.save-button').addClass('save-button--deploying');
                var id = scope.form_name ? dkobo_xlform.model.utils.sluggifyLabel(scope.form_name) : '';
                var form_categories = scope.form_categories || "category:Animal_Rights" ;
                var form_tags = $('.form-tags-class').val();
                var input_fields = [scope.form_label, id, scope.form_description, form_categories, scope.form_shared, form_tags];

                function success (results, headers) {
                    $('button.save-button .ui-button-text').html('Deploy and View New Map');
                    $('button.save-button').removeClass('save-button--deploying');
                    scope.close();
                    $miscUtils.alert('Survey publishing succeeded. Redirection to maps page in progress.');
                    window.top.location.href = "http://myw.ona.io/#/dashboard/maps"
                }
                function fail (response) {
                    $('button.save-button .ui-button-text').html('Deploy and View New Map');
                    $('button.save-button').removeClass('save-button--deploying');
                    scope.show_form_name_exists_message = true;
                    scope.error_message = 'Survey Publishing failed: ' + (response.data.text || response.data.error || response.data.detail);
                }

                if (scope.validate(input_fields)) {
                    scope.show_form_name_exists_message = false;
                    $api.surveys
                        .publish({id: scope.item.id,
                                  title: scope.form_label,
                                  id_string: id,
                                  description: scope.form_description,
                                  categories: form_categories,
                                  shared: scope.form_shared,
                                  tags: form_tags
                                })
                        .then(success, fail);
                } else {
                    $('button.save-button .ui-button-text').html('Deploy and View New Map');
                    $('button.save-button').removeClass('save-button--deploying');
                    scope.show_form_name_exists_message = true;
                    scope.error_message = 'Survey Publishing failed: All fields are required';
                }
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
                scope.show_form_name_exists_message = false;
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
                height: 630,
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

                    $(this).find('.form-tags-class').tagsInput({
                       'height':'66px',
                       'width':'100%'
                    });
                    /*
                    clears pre-existing tags on the tags input object so that
                    they don't appear on dialog load.
                    */
                    $('.tagsinput .tag').remove()
                },
                close: function() {
                    /*
                    removes the tags' container created when dialog is opened;
                    prevents creation of duplicate container tags.
                    */
                    $(this).find('.tagsinput').remove()
                }

            });
        }
    }
}]);