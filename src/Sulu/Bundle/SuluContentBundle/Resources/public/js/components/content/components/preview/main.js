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
 * @param {Object}  [options.iframeSource] configuration object for the source of the iframe
 * @param {String}  [options.iframeSource.url] url used for the iframe
 * @param {String}  [options.iframeSource.webspace] webspace section of the url
 * @param {String}  [options.iframeSource.language] language section of the url
 * @param {String}  [options.id] id of the element
 * @param {Object}  [options.toolbar] options for the toolbar
 * @param {Array}   [options.toolbar.resolutions] available widths for dropdown
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
                        1920,
                        1680,
                        1440,
                        1024,
                        800,
                        600,
                        480
                    ],
                    showLeft: true,
                    showRight: true
                },

                mainContentElementIdentifier: '',

                iframeSource: {
                    url: '',
                    webspace: '',
                    language: '',
                    template: '',
                    id: ''
                }

            },

            constants = {
                breakPointBig: 980,

                // needed to hide preview and show only new-window-button
                // 460 + margin + padding
                breakPointSmall: 640,
                breakPointSmallExpanded: 600,


                minWidthForToolbarCollapsed: 240,
                minWidthForToolbarExpanded: 240,

                mainContentMaxWidthIncMarginLeft: 920,
                mainContentMaxWidth: 820,

                mainContentMinWidthIncMarginLeft: 510,
                mainContentMinWidth: 460,

                marginPreviewCollapsedLeft: 30,
                marginPreviewExpandedLeft: 10,

                previewMinWidth: 30,

                transitionDuration: 500,
                minMainContentMarginLeft: 10,
                maxMainContentMarginLeft: 50,
                maxMainContentPaddingLeft: 50,

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
                HIDE = eventNamespace + 'hide';

        return {

            initialize: function() {
                this.options = this.sandbox.util.extend({}, defaults, this.options);

                // component vars
                this.url = '';
                this.isExpanded = false;
                this.iframeExists = false;

                // dom elements
                this.$wrapper = null;
                this.$iframe = null;
                this.$toolbar = null;
                this.$mainContent = this.sandbox.dom.$('#' + this.options.mainContentElementIdentifier)[0];

                this.render();
                this.bindDomEvents();
                this.bindCustomEvents();
                this.adjustDisplayedComponents();

                this.sandbox.emit(INITIALIZED);
            },

            /*********************************************
             *   Rendering
             ********************************************/

            /**
             * Initializes the rendering process
             */
            render: function() {
                this.url = this.getUrl(this.options.iframeSource.url, this.options.iframeSource.webspace, this.options.iframeSource.language, this.options.iframeSource.id, this.options.iframeSource.template);

                var widths = this.calculateCurrentWidths(false, false);

                this.renderWrapper(widths);
                this.renderIframe(widths.preview, this.url);
                this.renderToolbar(widths);

                // adjust content width if needed
                this.sandbox.emit('sulu.app.content.dimensions-change', {
                    width: widths.content,
                    left: constants.maxMainContentMarginLeft,
                    paddingLeft: constants.maxMainContentPaddingLeft});
            },

            /**
             * Renders the div which contains the iframe
             * with the maximum available space
             * @param {Object} widths object with widths of preview and content
             */
            renderWrapper: function(widths) {

                if (!this.$mainContent) {
                    this.sandbox.logger.error('main content element could not be found!');
                    return;
                }

                this.$wrapper = this.sandbox.dom.$('<div class="preview-wrapper" id="preview-wrapper" style=""></div>');
                this.sandbox.dom.css(this.$wrapper, 'width', widths.preview + 'px');

                this.sandbox.dom.append(this.$el, this.$wrapper);
            },

            /**
             * Renders iframe
             * @param {Number} width of iframe
             * @param {String} url for iframe target
             */
            renderIframe: function(width, url) {
                this.$iframe = this.sandbox.dom.$('<iframe id="preview-iframe" class="preview-iframe" src="' + url + '" width="' + width + 'px" height="100%"></iframe>');
                this.sandbox.dom.append(this.$wrapper, this.$iframe);
                this.iframeExists = true;
            },

            /**
             * Renders toolbar on top of the iframe
             * @param {Object} widths object with widths of preview and content
             */
            renderToolbar: function(widths) {

                var resolutionsLabel = this.sandbox.translate('content.preview.resolutions');

                this.$toolbar = this.sandbox.dom.$([
                    '<div id="preview-toolbar" class="preview-toolbar">',
                    '<div id="', constants.toolbarLeft, '" class="left pointer collapsed"><span class="icon-step-backward"></span></div>',
                    '<div id="', constants.toolbarRight, '" class="right">',
                    '<div id="', constants.toolbarNewWindow, '" class="new-window pull-right pointer"><span class="icon-disk-export"></span></div>',
                    '<div id="', constants.toolbarResolutions, '" class="resolutions pull-right pointer">',
                    '<label class="drop-down-trigger">',
                    '<span class="dropdown-toggle"></span>',
                    '<span class="dropdown-label">', resolutionsLabel, '</span>',
                    '</label>',
                    '</div>',
                    '</div>',
                    '</div>'
                ].join(''));

                this.sandbox.dom.css(this.$toolbar, 'width', widths.preview + 30 + 'px');
                this.sandbox.dom.append(this.$el, this.$toolbar);

                this.$toolbarRight = this.sandbox.dom.find('#' + constants.toolbarRight, this.$toolbar);
                this.$toolbarResolutionsLabel = this.sandbox.dom.find('.dropdown-label', this.$toolbarRight);
                this.$toolbarResolutions = this.sandbox.dom.find('#' + constants.toolbarResolutions, this.$toolbarRight);
                this.$toolbarOpenNewWindow = this.sandbox.dom.find('#' + constants.toolbarNewWindow, this.$toolbarRight);
                this.$toolbarLeft = this.sandbox.dom.find('#' + constants.toolbarLeft, this.$toolbar);

                // hide right part of toolbar when window size is below constants.minWidthForToolbarCollapsed
                if (widths.preview < constants.minWidthForToolbarCollapsed) {
                    this.sandbox.dom.addClass(this.$toolbarRight, 'hidden');
                }

                this.renderResolutionDropdown();
            },

            /**
             * Renders the dropdown for the resolution changes
             */
            renderResolutionDropdown: function() {

                var data = this.getResolutions();

                if (data.length > 0) {

                    this.sandbox.start([
                        {
                            name: 'dropdown@husky',
                            options: {
                                el: '#' + constants.toolbarResolutions,
                                trigger: '.drop-down-trigger',
                                setParentDropDown: true,
                                instanceName: 'resolutionsDropdown',
                                alignment: 'left',
                                data: data
                            }
                        }
                    ]);
                }
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

                    // collapse everything
                    var $target = this.sandbox.dom.find('#' + constants.toolbarLeft, this.$el);
                    this.collapsePreview($target);

                    window.open(this.url);

                    this.sandbox.dom.hide(this.$wrapper);
                    this.sandbox.dom.hide(this.$toolbar);
                    this.sandbox.dom.remove(this.$iframe);
                    this.iframeExists = false;

                    this.sandbox.emit('husky.navigation.show');
                    this.sandbox.emit('husky.page-functions.show');
                    this.sandbox.emit('sulu.app.content.dimensions-change', {
                        width: '',
                        left: constants.maxMainContentMarginLeft,
                        paddingLeft: constants.maxMainContentPaddingLeft});

                    this.sandbox.dom.width(this.$mainContent, '');


                    this.sandbox.emit(HIDE);

                }.bind(this));

                // TODO: dropdown events handling

            },

            /**
             * Bind custom events
             */
            bindCustomEvents: function() {

                // adjust dropdown width
                this.sandbox.on('husky.dropdown.resolutionsDropdown.showing', function() {
                    var $resolutions = this.sandbox.dom.find('#' + constants.toolbarResolutions, this.$toolbarRight),
                        $dropdownMenu = this.sandbox.dom.find('.dropdown-menu', $resolutions);
                    this.sandbox.dom.width($dropdownMenu, $resolutions.outerWidth());
                    this.sandbox.dom.width($resolutions, $resolutions.outerWidth());
                }.bind(this));

                // change label of dropdown to selection
                this.sandbox.on('husky.dropdown.resolutionsDropdown.item.click', function(item) {
                    this.sandbox.dom.text(this.$toolbarResolutionsLabel, item.name);
                }.bind(this));

                // make preview responsive
                this.sandbox.on('sulu.app.viewport.dimensions-changed', this.adjustDisplayedComponents.bind(this));

                this.sandbox.on('sulu.content.preview.change-url', function(iframeSource) {
                    this.sandbox.dom.remove(this.$iframe);
                    this.iframeExists = false;

                    var widths = this.calculateCurrentWidths(this.isExpanded, true);
                    this.options.iframeSource = this.sandbox.util.extend({}, this.options.iframeSource, iframeSource);
                    this.restoreIframe(widths.preview);
                }.bind(this));

            },

            /*********************************************
             *   Collapse Expand Methods
             ********************************************/

            /**
             * Expands preview and minimizes the form
             */
            expandPreview: function($target) {

                var $span = this.sandbox.dom.find('span', $target),
                    widths = this.calculateCurrentWidths(true, false);

                // deactivate tabs
                this.sandbox.emit('sulu.content.tabs.deactivate');

                this.sandbox.dom.removeClass($target, 'collapsed');
                this.sandbox.dom.addClass($target, 'expanded');

                this.sandbox.dom.addClass($span, 'icon-step-forward');
                this.sandbox.dom.removeClass($span, 'icon-step-backward');

                this.sandbox.emit(EXPANDING);
                this.isExpanded = true;

                // hide right part of toolbar when window size is below constants.minWidthForToolbarCollapsed
                if (widths.preview < constants.minWidthForToolbarExpanded) {
                    this.sandbox.dom.hide(this.$toolbarResolutions);
                    this.sandbox.dom.show(this.$toolbarOpenNewWindow);
                    this.sandbox.dom.css(this.$toolbarRight, 'float', 'left');
                } else {
                    this.sandbox.dom.show(this.$toolbarRight);
                    this.sandbox.dom.show(this.$toolbarResolutions);
                    this.sandbox.dom.css(this.$toolbarRight, 'float', 'right');
                }

                this.animateCollapseAndExpand(true, widths);

            },

            /**
             * Collapses preview and restores orginal size of the form
             */
            collapsePreview: function($target) {

                // activate tabs
                this.sandbox.emit('sulu.content.tabs.activate');

                var $span = this.sandbox.dom.find('span', $target),
                    widths = this.calculateCurrentWidths(false, false),
                    widthViewport = this.sandbox.dom.width(window);

                this.sandbox.dom.removeClass($target, 'expanded');
                this.sandbox.dom.addClass($target, 'collapsed');

                this.sandbox.dom.removeClass($span, 'icon-step-forward');
                this.sandbox.dom.addClass($span, 'icon-step-backward');

                this.sandbox.emit(COLLAPSING);
                this.isExpanded = false;

                // special case for extreme resized expanded preview
                if(widthViewport < constants.breakPointSmall){
                    this.adjustDisplayedComponents();
                    this.sandbox.dom.css(this.$toolbarRight, 'float', 'right');
                }

                // hide right part of toolbar when window size is below constants.minWidthForToolbarCollapsed
                else if (widths.preview < constants.minWidthForToolbarCollapsed) {
                    this.sandbox.dom.hide(this.$toolbarResolutions);
                    this.sandbox.dom.show(this.$toolbarOpenNewWindow);
                    this.sandbox.dom.css(this.$toolbarRight, 'float', 'left');
                }

                this.animateCollapseAndExpand(false, widths);
            },

            /**
             * Animates the width change for preview
             * Concerns wrapper, preview-toolbar and maincontent
             * @param {Boolean} expand
             * @param {Object} widths of preview and content
             */
            animateCollapseAndExpand: function(expand, widths) {

                // preview wrapper
                this.sandbox.dom.animate(this.$wrapper, {
                    width: widths.preview + 'px'
                }, {
                    duration: constants.transitionDuration,
                    queue: false
                });

                // preview iframe
                this.sandbox.dom.animate(this.$iframe, {
                    width: widths.preview + 'px'
                }, {
                    duration: constants.transitionDuration,
                    queue: false
                });

                // preview toolbar
                this.sandbox.dom.animate(this.$toolbar, {
                    width: widths.preview + constants.marginPreviewCollapsedLeft + 'px'
                }, {
                    duration: constants.transitionDuration,
                    queue: false
                });

                if (!!expand) {
                    this.sandbox.emit('husky.navigation.hide');
                    this.sandbox.emit('husky.page-functions.hide');
                    this.sandbox.emit('sulu.app.content.dimensions-change', {
                        width: widths.content,
                        left: constants.minMainContentMarginLeft,
                        paddingLeft: 0});
                } else {

                    this.sandbox.emit('husky.navigation.show');
                    this.sandbox.emit('husky.page-functions.show');
                    this.sandbox.emit('sulu.app.content.dimensions-change', {
                        width: widths.content,
                        left: constants.maxMainContentMarginLeft,
                        paddingLeft: constants.maxMainContentPaddingLeft});
                }

            },


            /*********************************************
             *   Util Methods
             ********************************************/

            /**
             * Called when the sulu.app.viewport.dimensions-changed is emitted and before initialized
             */
            adjustDisplayedComponents: function() {

                var widths = this.calculateCurrentWidths(this.isExpanded, true);

                if (!this.isExpanded) {

                    // hide preview except for open in new window button
                    if (widths.content <= (constants.breakPointSmall + constants.previewMinWidth)) {

                        // remove iframe - disables unnecessary communication

                        this.sandbox.dom.hide(this.$iframe);
                        this.sandbox.dom.hide(this.$wrapper);

                        this.sandbox.dom.hide(this.$toolbarResolutions);
                        this.sandbox.dom.hide(this.$toolbarLeft);

                        this.sandbox.dom.show(this.$toolbar);
                        this.sandbox.dom.show(this.$toolbarRight);
                        this.sandbox.dom.show(this.$toolbarOpenNewWindow);

                        this.sandbox.dom.remove(this.$iframe);
                        this.iframeExists = false;

                        this.sandbox.dom.css(this.$toolbarRight, 'float', 'right');

                        widths.content = '';

                        // hide resolutions div in toolbar
                    } else if (widths.preview < constants.minWidthForToolbarCollapsed) {

                        this.restoreIframe(widths.preview);
                        this.showNecessaryDOMElements();
                        this.sandbox.dom.hide(this.$toolbarResolutions);
                        this.sandbox.dom.css(this.$toolbarRight, 'float', 'left');

                    } else {

                        this.restoreIframe(widths.preview);
                        this.showNecessaryDOMElements();
                        this.sandbox.dom.show(this.$toolbarResolutions);
                        this.sandbox.dom.css(this.$toolbarRight, 'float', 'right');

                    }

                } else if (!!this.isExpanded) {

                    // hide preview except for open in new window button
                   if (widths.preview < constants.previewMinWidth) {

                        this.sandbox.dom.hide(this.$toolbarResolutions);
                        this.sandbox.dom.hide(this.$toolbarOpenNewWindow);
                        this.sandbox.dom.css(this.$toolbarRight, 'float', 'right');

                    } else if (widths.preview < constants.minWidthForToolbarExpanded) {

                        this.sandbox.dom.hide(this.$toolbarResolutions);
                        this.sandbox.dom.show(this.$toolbarOpenNewWindow);
                        this.sandbox.dom.css(this.$toolbarRight, 'float', 'left');

                    } else {

                        this.sandbox.dom.show(this.$toolbarResolutions);
                        this.sandbox.dom.show(this.$toolbarOpenNewWindow);
                        this.sandbox.dom.css(this.$toolbarRight, 'float', 'right');

                    }

                }

                this.sandbox.dom.width(this.$wrapper, widths.preview);
                this.sandbox.dom.width(this.$iframe, widths.preview);
                this.sandbox.dom.width(this.$toolbar, widths.preview + constants.marginPreviewCollapsedLeft);
                this.sandbox.dom.width(this.$mainContent, widths.content);
            },

            /**
             * Restores the iframe
             * @param {Number} width of preview
             */
            restoreIframe: function(width) {
                if (!this.iframeExists) {
                    var url = this.getUrl(this.options.iframeSource.url, this.options.iframeSource.webspace, this.options.iframeSource.language, this.options.iframeSource.id, this.options.iframeSource.template);
                    this.renderIframe(width, url);
                    this.iframeExists = true;
                }
            },

            /**
             * Shows necessary DOM Elements
             */
            showNecessaryDOMElements: function() {
                this.sandbox.dom.show(this.$toolbar);
                this.sandbox.dom.show(this.$toolbarLeft);
                this.sandbox.dom.show(this.$toolbarRight);
                this.sandbox.dom.show(this.$wrapper);
                this.sandbox.dom.show(this.$iframe);
                this.sandbox.dom.show(this.$toolbarOpenNewWindow);

                this.sandbox.dom.css(this.$toolbarRight, 'float', 'right');
            },

            /**
             * Calculates the widths for preview and content for expanded/collapsed state for current viewport width
             * @param {Boolean} expanded state
             * @param {Boolean} resized triggered thourgh resize
             * @return {Object} widths for content and preview
             */
            calculateCurrentWidths: function(expanded, resized) {

                var widths = { preview: 0, content: 0},
                    tmpWidth,
                    viewportWidth = this.sandbox.dom.width(window),
                    margin = 0;

                if (!!expanded) {
                    widths.preview = viewportWidth - constants.mainContentMinWidth - constants.marginPreviewExpandedLeft - constants.minMainContentMarginLeft;

                    if (!!resized) { // animation needs outer width
                        widths.content = constants.mainContentMinWidth;
                    } else {
                        widths.content = constants.mainContentMinWidthIncMarginLeft;
                    }
                } else {
                    // when resized needed to have enough space for preview
                    // or rather for the content to have enough whitespace on the right
                    if (!!resized && viewportWidth < constants.breakPointBig) {
                        margin = constants.maxMainContentMarginLeft + constants.maxMainContentPaddingLeft;
                    }

                    tmpWidth = viewportWidth - constants.previewMinWidth - constants.marginPreviewCollapsedLeft - margin;

                    if (tmpWidth > constants.mainContentMaxWidthIncMarginLeft) {
                        widths.content = constants.mainContentMaxWidthIncMarginLeft;
                        widths.preview = viewportWidth - widths.content - constants.marginPreviewCollapsedLeft;
                    } else {
                        widths.content = tmpWidth;
                        widths.preview = constants.previewMinWidth;
                    }
                }

                return widths;
            },

            /**
             * Concatenates the given strings to an url
             * @param {String} url
             * @param {String} webspace
             * @param {String} language
             * @param {String} id
             * @param {String} template
             * @return {String} url string
             */
            getUrl: function(url, webspace, language, id, template) {

                if (!url || !id || !webspace || !language || !template) {
                    this.sandbox.logger.error('not all url params for iframe definded!');
                    return '';
                }

                url = url[url.length - 1] === '/' ? url : url + '/';
                url += id + '?';
                url += 'webspace=' + webspace;
                url += '&language=' + language;
                url += '&template=' + template;

                return url;
            },

            /**
             * Returns the resolutions in an appropriate format for the dropdown component
             * @return {Array} an array of objects with id and name property
             */
            getResolutions: function() {

                var data = [], i = 0;

                while (i < this.options.toolbar.resolutions.length) {
                    data.push({id: i, name: this.options.toolbar.resolutions[i] + ' px', value: this.options.toolbar.resolutions[i]});
                    ++i;
                }

                return data;
            }
        };
    }
);
