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
    'type/default',
    'form/util'
], function(Default, Util) {

    'use strict';

    return function($el, options) {
        var defaults = {},

            subType = {
                validate: function() {
                    // TODO validate
                    return true;
                }
            };

        return new Default($el, defaults, options, 'resourceLocator', subType);
    };
});
