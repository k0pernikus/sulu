/*
 * This file is part of the Sulu CMS.
 *
 * (c) MASSIVE ART WebServices GmbH
 *
 * This source file is subject to the MIT license that is bundled
 * with this source code in the file LICENSE.
 */

/**
 * handles media selection
 *
 * @class MediaSelection
 * @constructor
 */
define([], function() {

    'use strict';

    var defaults = {
            visibleItems: 999,
            instanceName: null,
            url: '',
            idsParameter: 'ids',
            preselected: {ids: []},
            idKey: 'id',
            titleKey: 'title',
            resultKey: '_embedded',
            columnNavigationUrl: '',
            translations: {
                noLinksSelected: 'internal-links.nolinks-selected',
                addLinks: 'internal-links.add',
                visible: 'internal-links.visible',
                of: 'internal-links.of'
            }
        },

        dataDefaults = {
            ids: [],
            displayOption: 'top',
            config: {}
        },

        /**
         * namespace for events
         * @type {string}
         */
        eventNamespace = 'sulu.internal-links.',

        /**
         * raised when all overlay components returned their value
         * @event sulu.internal-links.input-retrieved
         */
        INPUT_RETRIEVED = function() {
            return createEventName.call(this, 'input-retrieved');
        },

        /**
         * raised when the overlay data has been changed
         * @event sulu.internal-links.data-changed
         */
        DATA_CHANGED = function() {
            return createEventName.call(this, 'data-changed');
        },

        /**
         * raised before data is requested with AJAX
         * @event sulu.internal-links.data-request
         */
        DATA_REQUEST = function() {
            return createEventName.call(this, 'data-request');
        },

        /**
         * raised when data has returned from the ajax request
         * @event sulu.internal-links.data-retrieved
         */
        DATA_RETRIEVED = function() {
            return createEventName.call(this, 'data-retrieved');
        },

        /**
         * returns normalized event names
         */
        createEventName = function(postFix) {
            return eventNamespace + (this.options.instanceName ? this.options.instanceName + '.' : '') + postFix;
        },

        templates = {
            skeleton: function(options) {
                return [
                    '<div class="smart-content-container form-element" id="', options.ids.container, '">',
                    '   <div class="smart-header">',
                    '       <a href="#" class="fa-plus-circle add" id="', options.ids.addButton, '"></a>',
                    '       <a href="#" class="fa-cog config" id="', options.ids.configButton, '" style="display: none;"></a>',
                    '   </div>',
                    '   <div class="smart-content" id="', options.ids.content, '"></div>',
                    '</div>'
                ].join('');
            },

            noContent: function(noContentString) {
                return [
                    '<div class="no-content">',
                    '   <span class="fa-file icon"></span>',
                    '   <div class="text">', noContentString, '</div>',
                    '</div>'
                ].join('');
            },

            data: function(options) {
                return[
                    '<div id="', options.ids.columnNavigation, '"/>',
                ].join('');
            },

            contentItem: function(id, num, value) {
                return [
                    '<li data-id="', id, '">',
                    '   <span class="num">', num, '</span>',
                    '   <span class="value">', value, '</span>',
                    '</li>'
                ].join('');
            }
        },

        /**
         * returns id for given type
         */
        getId = function(type) {
            return '#' + this.options.ids[type];
        },

        /**
         * render component
         */
        render = function() {
            // init ids
            this.options.ids = {
                container: 'internal-links-' + this.options.instanceName + '-container',
                addButton: 'internal-links-' + this.options.instanceName + '-add',
                configButton: 'internal-links-' + this.options.instanceName + '-config',
                displayOption: 'internal-links-' + this.options.instanceName + '-display-option',
                content: 'internal-links-' + this.options.instanceName + '-content',
                chooseTab: 'internal-links-' + this.options.instanceName + '-choose-tab',
                columnNavigation: 'internal-links-' + this.options.instanceName + '-column-navigation'
            };
            this.sandbox.dom.html(this.$el, templates.skeleton(this.options));

            // init container
            this.$container = this.sandbox.dom.find(getId.call(this, 'container'), this.$el);
            this.$content = this.sandbox.dom.find(getId.call(this, 'content'), this.$el);
            this.$addButton = this.sandbox.dom.find(getId.call(this, 'addButton'), this.$el);
            this.$configButton = this.sandbox.dom.find(getId.call(this, 'configButton'), this.$el);
            // TODO footer this.$footer

            // set preselected values
            if (!!this.sandbox.dom.data(this.$el, 'internal-links')) {
                var data = this.sandbox.util.extend(true, {}, dataDefaults, this.sandbox.dom.data(this.$el, 'internal-links'));
                setData.call(this, data);
            } else {
                setData.call(this, this.options.preselected);
            }

            // render no images selected
            renderStartContent.call(this);

            // sandbox event handling
            bindCustomEvents.call(this);

            // init vars
            this.itemsVisible = this.options.visibleItems;
            this.URI = {
                str: '',
                hasChanged: false
            };

            // generate URI for data
            setURI.call(this);

            // set display-option value
            setDisplayOption.call(this);

            // init overlays
            // TODO config overlay
            startAddOverlay.call(this);

            // load preselected items
            loadContent.call(this);

            // handle dom events
            bindDomEvents.call(this);
        },

        /**
         * Renders the content at the beginning
         * (with no items and before any request)
         */
        renderStartContent = function() {
            var label = this.sandbox.translate(this.options.translations.noLinksSelected);
            this.sandbox.dom.html(this.$content, templates.noContent(label));
        },

        /**
         * custom event handling
         */
        bindCustomEvents = function() {
            this.sandbox.on('husky.overlay.internal-links.' + this.options.instanceName + '.add.initialized', initColumnNavigation.bind(this));

            this.sandbox.on('husky.column-navigation.edit', function(item) {
                if (this.data.ids.indexOf(item.id) === -1) {
                    this.data.ids.push(item.id);
                } else {
                    this.data.ids = this.data.ids.filter(function(el) {
                        return el !== item.id;
                    });
                }

                setData.call(this, this.data);
                this.sandbox.logger.log('selected items', this.data.ids);
            }.bind(this));

            // data from overlay retrieved
            this.sandbox.on(INPUT_RETRIEVED.call(this), function() {
                setURI.call(this);
                loadContent.call(this);
            }.bind(this));

            // data from ajax request retrieved
            this.sandbox.on(DATA_RETRIEVED.call(this), function() {
                renderContent.call(this);
            }.bind(this));
        },

        /**
         * initialize column navigation
         */
        initColumnNavigation = function() {
            this.sandbox.start(
                [
                    {
                        name: 'column-navigation@husky',
                        options: {
                            el: getId.call(this, 'columnNavigation'),
                            url: this.options.columnNavigationUrl,
                            instanceName: this.options.instanceName,
                            noPageDescription: 'No Pages',
                            sizeRelativeTo: '.smart-content-overlay .slide-0 .overlay-content',
                            wrapper: {height: 100},
                            editIcon: 'fa-check',
                            showEdit: false,
                            showStatus: false
                        }
                    }
                ]
            );
        },

        /**
         * handle dom events
         */
        bindDomEvents = function() {
            this.sandbox.dom.on(getId.call(this, 'displayOption'), 'change', function() {
                setData.call(this, {displayOption: this.sandbox.dom.val(getId.call(this, 'displayOption'))});
                this.sandbox.emit(DATA_CHANGED.call(this), this.data, this.$el);
            }.bind(this));
        },

        /**
         * renders the content decides whether the footer is rendered or not
         */
        renderContent = function() {
            if (this.items.length !== 0) {
                var ul = this.sandbox.dom.createElement('<ul class="items-list"/>'),
                    i = -1, length = this.items.length;

                //loop stops if no more items are left or if number of rendered items matches itemsVisible
                for (; ++i < length && i < this.itemsVisible;) {
                    this.sandbox.dom.append(ul, templates.contentItem(this.items[i][this.options.idKey], i + 1, this.items[i][this.options.titleKey]));
                }

                this.sandbox.dom.html(this.$content, ul);
                renderFooter.call(this);
            } else {
                renderStartContent.call(this);
                detachFooter.call(this);
            }
        },

        /**
         * renders the footer and calls a method to bind the events for itself
         */
        renderFooter = function() {
            this.itemsVisible = (this.items.length < this.itemsVisible) ? this.items.length : this.itemsVisible;

            if (this.$footer === null || this.$footer === undefined) {
                this.$footer = this.sandbox.dom.createElement('<div class="smart-footer"/>');
            }

            this.sandbox.dom.html(this.$footer, [
                '<span>',
                    '<strong>' + this.itemsVisible + ' </strong>', this.sandbox.translate(this.options.translations.of) , ' ',
                    '<strong>' + this.items.length + ' </strong>', this.sandbox.translate(this.options.translations.visible),
                '</span>'
            ].join(''));

            this.sandbox.dom.append(this.$container, this.$footer);
        },

        /**
         * starts the overlay component
         */
        startAddOverlay = function() {
            var $element = this.sandbox.dom.createElement('<div/>');

            this.sandbox.dom.append(this.$el, $element);
            this.sandbox.start([
                {
                    name: 'overlay@husky',
                    options: {
                        triggerEl: this.$addButton,
                        cssClass: 'internal-links-overlay',
                        el: $element,
                        container: this.$el,
                        instanceName: 'internal-links.' + this.options.instanceName + '.add',
                        skin: 'wide',
                        slides: [
                            {
                                title: this.sandbox.translate(this.options.translations.addLinks),
                                okCallback: getAddOverlayData.bind(this),
                                cssClass: 'internal-links-overlay-add',
                                data: templates.data(this.options)
                            }
                        ]
                    }
                }
            ]);
        },

        /**
         * extract data from overlay
         */
        getAddOverlayData = function() {
            // TODO data will be retrieved with events
            this.sandbox.emit(INPUT_RETRIEVED.call(this));
        },

        /**
         * starts the loader component
         */
        startLoader = function() {
            detachFooter.call(this);

            var $loaderContainer = this.sandbox.dom.createElement('<div class="loader"/>');
            this.sandbox.dom.html(this.$content, $loaderContainer);

            this.sandbox.start([
                {
                    name: 'loader@husky',
                    options: {
                        el: $loaderContainer,
                        size: '100px',
                        color: '#e4e4e4'
                    }
                }
            ]);
        },

        /**
         * removes the footer
         */
        detachFooter = function() {
            if (this.$footer !== null) {
                this.sandbox.dom.remove(this.$footer);
            }
        },

        /**
         * load content from generated uri
         */
        loadContent = function() {
            //only request if URI has changed
            if (this.URI.hasChanged === true) {
                var thenFunction = function(data) {
                    this.items = data[this.options.resultKey] || [];

                    this.sandbox.emit(DATA_RETRIEVED.call(this));
                }.bind(this);

                this.sandbox.emit(DATA_REQUEST.call(this));
                startLoader.call(this);

                // reset item visible
                this.itemsVisible = this.options.visibleItems;

                if (!!this.data.ids && this.data.ids.length > 0) {
                    this.sandbox.util.load(this.URI.str)
                        .then(thenFunction.bind(this))
                        .then(function(error) {
                            this.sandbox.logger.log(error);
                        }.bind(this));
                } else {
                    thenFunction.call(this, {});
                }
            }
        },

        /**
         * set data of internal-links
         */
        setData = function(data) {
            for (var propertyName in data) {
                if (data.hasOwnProperty(propertyName)) {
                    this.data[propertyName] = data[propertyName];
                }
            }
            this.sandbox.dom.data(this.$el, 'internal-links', this.data);
        },

        /**
         * generates the URI for the request
         */
        setURI = function() {
            var delimiter = (this.options.url.indexOf('?') === -1) ? '?' : '&',
                newURI = [
                    this.options.url,
                    delimiter, this.options.idsParameter, '=', (this.data.ids || []).join(',')
                ].join('');
            // min source must be selected
            if (newURI !== this.URI.str) {
                if (this.URI.str !== '') {
                    this.sandbox.emit(DATA_CHANGED.call(this), this.data, this.$el);
                }
                this.URI.str = newURI;
                this.URI.hasChanged = true;
            } else {
                this.URI.hasChanged = false;
            }
        },
        /**
         * set display option to element
         */
        setDisplayOption = function() {
            this.sandbox.dom.val(getId.call(this, 'displayOption'), this.data.displayOption);
        };

    return {
        historyClosed: true,

        initialize: function() {
            // extend default options
            this.options = this.sandbox.util.extend({}, defaults, this.options);
            this.data = {};

            render.call(this);
        }
    };
});
