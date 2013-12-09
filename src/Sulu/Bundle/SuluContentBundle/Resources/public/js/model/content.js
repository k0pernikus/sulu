/*
 * This file is part of the Sulu CMS.
 *
 * (c) MASSIVE ART WebServices GmbH
 *
 * This source file is subject to the MIT license that is bundled
 * with this source code in the file LICENSE.
 */

define([
    'mvc/relationalmodel'
], function(RelationalModel) {

    'use strict';

    return new RelationalModel({
        urlRoot: '/admin/api/nodes',

        saveTemplate: function(attributes, template, options) {
            options = _.defaults((options || {}), {url: this.urlRoot + (this.get('id') !== undefined ? '/' + this.get('id') : '') + '?template=' + template});

            return this.save.call(this, attributes, options);
        },

        defaults: function() {
            return {
            };
        }
    });
});
