/**
 * This file is part of Husky frontend development framework.
 *
 * (c) MASSIVE ART WebServices GmbH
 *
 * This source file is subject to the MIT license that is bundled
 * with this source code in the file LICENSE.
 *
 * @module husky/components/preview
 */

/**
 * @class Preview
 * @constructor
 *
 * @param {Object}  [options] Configuration object
 * @param {String}  [options.mainContentElementIdentifier] ID of the element which will be next to the preview (main content element)
 * @param {Number}  [options.mainContentMinWidth] minimal with of main content element
 * @param {Number}  [options.marginLeft] margin in pixles from the left for the wrapper
 * @param {Object}  [options.iframeSource] configuration object for the source of the iframe
 * @param {String}  [options.iframeSource.url] url used for the iframe
 * @param {String}  [options.iframeSource.webspace] webspace section of the url
 * @param {String}  [options.iframeSource.language] language section of the url
 * @param {String}  [options.id] id of the element
 * @param {Object}  [options.toolbar] options for the toolbar
 * @param {Array}   [options.toolbar.resolutions] options for the toolbar
 * @param {Boolean} [options.toolbar.showLeft] show the left part of the toolbar
 * @param {Boolean} [options.toolbar.showRight] show the right part of the toolbar
 *
 */
define([], function() {

        'use strict';

        /**
         * Default values for options
         */
        var defaults = {
                toolbar: {
                    resolutions: [
                        '1920x1080',
                        '1680x1050',
                        '1440x1050',
                        '1024x768',
                        '800x600',
                        '600x480',
                        '480x320'
                    ],
                    showLeft: true,
                    showRight: true
                },
                mainContentElementIdentifier: '',
                mainContentMinWidth: 480,
                marginLeft: 30,
                iframeSource: {
                    url: '',
                    webspace: '',
                    language: '',
                    id: ''
                }
            },

            constants = {
                toolbarLeft: 'preview-toolbar-left',
                toolbarRight: 'preview-toolbar-right',
                toolbarNewWindow: 'preview-toolbar-new-window',
                toolbarResolutions: 'preview-toolbar-resolutions'
            },

            eventNamespace = 'husky.preview.',

            /**
             * raised after initialization
             * @event husky.preview.initialized
             */
                INITIALIZED = eventNamespace + 'initialized',

            /**
             * raised after triggering of expand action
             * @event husky.preview.expending
             */
                EXPANDING = eventNamespace + 'expending',

            /**
             * raised after triggering of collapse action
             * @event husky.preview.collapsing
             */
                COLLAPSING = eventNamespace + 'collapsing',

            /**
             * raised when preview is opened in new window
             * @event husky.preview.collapsing
             */
                HIDE = eventNamespace + 'hide',


            /**
             * Returns an object with a height and width property from  a string in pixles
             * @param dimension {String} a string with dimensions e.g 1920x1080
             * @return {Object} object with width and height property
             */
                parseHeightAndWidthFromString = function(dimension) {
                var tmp = dimension.split('x');

                if (tmp.length == 2) {
                    return {width: tmp[0], height: tmp[1]}
                } else {
                    this.sandbox.logger.error('Dimension string has invalid format -> 1920x1080');
                    return '';
                }
            },

            /**
             * Concatenates the given strings to an url
             * @param {String} url
             * @param {String} webspace
             * @param {String} language
             * @param {String} id
             * @return {String} url string
             */
                getUrl = function(url, webspace, language, id) {

                if (!url || !id || !webspace || !language) {
                    this.sandbox.logger.error('not all url params for iframe definded!');
                    return '';
                }

                url = url[url.length - 1] === '/' ? url : url + '/';
                url += id + '?';
                url += 'webspace=' + webspace;
                url += '&language=' + language;

                return url;
            };

        return {

            initialize: function() {

                this.options = this.sandbox.util.extend({}, defaults, this.options);

                // component vars
                this.currentSize = parseHeightAndWidthFromString.call(this, this.options.toolbar.resolutions[0]);
                this.previewWidth = 0;
                this.url = '';
                this.isExpanded = false;

                // dom elements
                this.$wrapper = null;
                this.$iframe = null;
                this.$toolbar = null;
                this.$mainContent = this.sandbox.dom.$('#' + this.options.mainContentElementIdentifier)[0];

                // get original max width
                this.mainContentOriginalWidth = this.sandbox.dom.width(this.$mainContent);

                this.render();
                this.bindDomEvents.call(this);
                this.bindCustomEvents.call(this);

                this.sandbox.emit(INITIALIZED);
            },

            /*********************************************
             *   Rendering
             ********************************************/

            /**
             * Initializes the rendering process
             */
            render: function() {
                this.url = getUrl.call(this, this.options.iframeSource.url, this.options.iframeSource.webspace, this.options.iframeSource.language, this.options.iframeSource.id);

                this.renderWrapper();
                this.renderIframe(this.currentSize.width, this.currentSize.height, this.url);
                this.renderToolbar();
            },

            /**
             * Renders the div which contains the iframe
             * with the maximum available space
             */
            renderWrapper: function() {

                var mainWidth, mainMarginLeft, totalWidth;

                if (!this.$mainContent) {
                    this.sandbox.logger.error('main content element could not be found!');
                    return;
                }

                // calculate the available space next to the
                mainWidth = this.sandbox.dom.outerWidth(this.$mainContent);
                mainMarginLeft = this.$mainContent.offsetLeft;
                totalWidth = this.sandbox.dom.width(document);
                this.previewWidth = totalWidth - (mainWidth + this.options.marginLeft);

                this.$wrapper = this.sandbox.dom.$('<div class="preview-wrapper" id="preview-wrapper" style=""></div>');
                this.sandbox.dom.css(this.$wrapper, 'width', this.previewWidth + 'px');

                this.sandbox.dom.append(this.$el, this.$wrapper);
            },

            /**
             * Renders iframe
             * @param {Number} width of iframe
             * @param {Number} height of iframe
             * @param {String} url for iframe target
             */
            renderIframe: function(width, height, url) {
                this.$iframe = this.sandbox.dom.$('<iframe id="preview-iframe" class="preview-iframe" src="' + url + '" width="' + width + 'px" height="' + height + 'px"></iframe>');
                this.sandbox.dom.append(this.$wrapper, this.$iframe);
            },

            /**
             * Renders toolbar on top of the iframe
             */
            renderToolbar: function() {
                this.$toolbar = this.sandbox.dom.$([
                    '<div id="preview-toolbar" class="preview-toolbar">',
                    '<div id="', constants.toolbarLeft, '" class="left pointer collapsed"><span class="icon-step-backward"></span></div>',
                    '<div id="', constants.toolbarRight, '" class="right">',
                    '<div id="', constants.toolbarNewWindow, '" class="new-window pull-right pointer"><span class="icon-disk-export"></span></div>',
                    '<div id="', constants.toolbarResolutions, '" class="resolutions pull-right pointer">Resolutions</div>',
                    '</div>',
                    '</div>'
                ].join(''));

                this.sandbox.dom.css(this.$toolbar, 'width', this.previewWidth + 30 + 'px');
                this.sandbox.dom.append(this.$el, this.$toolbar);

                this.renderResolutionDropdown();
            },

            /**
             * Renders the dropdown for the resolution changes
             */
            renderResolutionDropdown: function() {
                // TODO render resolution dropdown
            },

            /*********************************************
             *   Event Handling
             ********************************************/

            /**
             * Binds dom events
             */
            bindDomEvents: function() {

                //expand and collapse
                this.sandbox.dom.on('#' + constants.toolbarLeft, 'click', function(event) {

                    var $target = event.currentTarget;

                    if (!this.isExpanded) {
                        this.expandPreview($target);
                    } else {
                        this.collapsePreview($target);
                    }

                }.bind(this));

                // show in new window
                this.sandbox.dom.on('#' + constants.toolbarNewWindow, 'click', function() {

                    window.open(this.url);
                    this.sandbox.dom.hide(this.$wrapper);
                    this.sandbox.dom.hide(this.$toolbar);
                    this.sandbox.dom.remove(this.$wrapper);
                    this.sandbox.dom.remove(this.$toolbar);

                    // when preview expanded then show navigation and adjust main content
                    if (!!this.isExpanded) {
                        this.sandbox.emit('husky.page-functions.show');
                        this.sandbox.emit('husky.navigation.show');
                        this.sandbox.emit('sulu.app.content.dimensions-change', {width: this.mainContentOriginalWidth, left: 100, expand: false});
                    }

                    this.sandbox.emit(HIDE);

                }.bind(this));

                // TODO: dropdown events

            },

            /**
             * binds custom events
             */
            bindCustomEvents: function() {

            },


            /*********************************************
             *   Collapse Expand Methods
             ********************************************/

            /**
             * Expands preview and minimizes the form
             */
            expandPreview: function($target) {

                // TODO get value for with via options

                var $span = this.sandbox.dom.find('span', $target),
                    width = 1400;

                this.sandbox.dom.removeClass($target, 'collapsed');
                this.sandbox.dom.addClass($target, 'expanded');

                this.sandbox.dom.addClass($span, 'icon-step-forward');
                this.sandbox.dom.removeClass($span, 'icon-step-backward');

                this.sandbox.emit(EXPANDING);
                this.isExpanded = true;

                this.animateCollapseAndExpand(true, width);

            },

            /**
             * Collapses preview and restores orginal size of the form
             */
            collapsePreview: function($target) {

                var $span = this.sandbox.dom.find('span', $target);

                this.sandbox.dom.removeClass($target, 'expanded');
                this.sandbox.dom.addClass($target, 'collapsed');

                this.sandbox.dom.removeClass($span, 'icon-step-forward');
                this.sandbox.dom.addClass($span, 'icon-step-backward');

                this.sandbox.emit(COLLAPSING);
                this.isExpanded = false;

                this.animateCollapseAndExpand(false, this.previewWidth);
            },

            /**
             * Animates the width change for preview
             * Concerns wrapper, preview-toolbar and maincontent
             * @param {Boolean} expand
             * @param {Integer} previewWidth of preview in pixels
             */
            animateCollapseAndExpand: function(expand, previewWidth) {

                // preview wrapper
                this.sandbox.dom.animate(this.$wrapper, {
                    width: previewWidth + 'px'
                }, {
                    duration: 500,
                    queue: false
                });

                // preview iframe
                this.sandbox.dom.animate(this.$iframe, {
                    width: previewWidth + 'px'
                }, {
                    duration: 500,
                    queue: false
                });

                // preview toolbar
                this.sandbox.dom.animate(this.$toolbar, {
                    width: previewWidth + 30 + 'px'
                }, {
                    duration: 500,
                    queue: false
                });

                if (!!expand) {
                    this.sandbox.emit('husky.page-functions.hide');
                    this.sandbox.emit('husky.navigation.hide');
                    this.sandbox.emit('sulu.app.content.dimensions-change', {width: this.options.mainContentMinWidth, left: 0, expand: true});
                } else {
                    this.sandbox.emit('husky.page-functions.show');
                    this.sandbox.emit('husky.navigation.show');
                    this.sandbox.emit('sulu.app.content.dimensions-change', {width: this.mainContentOriginalWidth, left: 100, expand: false});
                }

            }


        };
    }
);
