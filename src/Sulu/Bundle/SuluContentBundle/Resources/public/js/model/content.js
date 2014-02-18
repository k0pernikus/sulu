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

        stateSave: function(webspace, language, state, attributes, options) {
            options = _.defaults((options || {}), {url: this.urlRoot + (this.get('id') !== undefined ? '/' + this.get('id') : '') + '?webspace=' + webspace + '&language=' + language + (!!state ? '&state=' + state : '')});

            return this.save.call(this, attributes, options);
        },

        fullSave: function(template, webspace, language, parent, state, navigation, attributes, options) {
            if(!!navigation){
                navigation = '1';
            }else{
                navigation = '0';
            }
            options = _.defaults((options || {}), {url: this.urlRoot + (this.get('id') !== undefined ? '/' + this.get('id') : '') + '?webspace=' + webspace + '&language=' + language + '&template=' + template + (!!parent ? '&parent=' + parent : '') + (!!state ? '&state=' + state : '')+(!!navigation? '&navigation=' + navigation:'')});

            return this.save.call(this, attributes, options);
        },

        fullFetch: function(webspace, language, options) {
            options = _.defaults((options || {}), {url: this.urlRoot + (this.get('id') !== undefined ? '/' + this.get('id') : '') + '?webspace=' + webspace + '&language=' + language});

            return this.fetch.call(this, options);
        },

        fullDestroy: function(webspace, language, options) {
            options = _.defaults((options || {}), {url: this.urlRoot + (this.get('id') !== undefined ? '/' + this.get('id') : '') + '?webspace=' + webspace + '&language=' + language});

            return this.destroy.call(this, options);
        },

        defaults: function() {
            return {
            };
        }
    });
});
