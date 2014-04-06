/*
 * This file is part of the Husky Validation.
 *
 * (c) MASSIVE ART WebServices GmbH
 *
 * This source file is subject to the MIT license that is bundled
 * with this source code in the file LICENSE.
 *
 */

define([
    'type/default'
], function(Default) {

    'use strict';

    return function($el, options) {
        var defaults = {},

            subType = {
                initializeSub: function() {
                    App.off('husky.smart-content.' + options.instanceName + '.data-changed');
                    App.on('husky.smart-content.' + options.instanceName + '.data-changed', function() {
                        App.emit('sulu.preview.update', $el, App.dom.data($el, 'smart-content'));
                        App.emit('sulu.content.changed');
                    }.bind(this));
                },

                setValue: function(value) {
                    var config;
                    if (!!value.config) {
                        config = value.config;
                    } else {
                        config = value;
                    }

                    if (typeof(config.dataSource) !== 'undefined' && !!config.dataSource) {
                        App.dom.data($el, 'auraDataSource', config.dataSource);
                    }
                    if (typeof(config.includeSubFolders) !== 'undefined' && !!config.includeSubFolders) {
                        App.dom.data($el, 'auraIncludeSubFolders', config.includeSubFolders);
                    }
                    if (typeof(config.tags) !== 'undefined' && !!config.tags) {
                        App.dom.data($el, 'auraTags', config.tags);
                    }
                    if (typeof(config.sortMethod) !== 'undefined' && !!config.sortMethod) {
                        App.dom.data($el, 'auraPreSelectedSortMethod', config.sortMethod);
                    }
                    if ((typeof(config.sortBy) !== 'undefined') && !!config.sortBy && config.sortBy.length > 0) {
                        App.dom.data($el, 'auraPreSelectedSortBy', config.sortBy[0]);
                    }
                    if (typeof(config.limitResult) !== 'undefined' && !!config.limitResult) {
                        App.dom.data($el, 'auraLimitResult', config.limitResult);
                    }
                },

                getValue: function() {
                    return App.dom.data($el, 'smart-content');
                },

                needsValidation: function() {
                    return false;
                },

                validate: function() {
                    return true;
                }
            };

        return new Default($el, defaults, options, 'smartContent', subType);
    };
});
