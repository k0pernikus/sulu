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
define(['sulumedia/collection/collections'], function(Collections) {

    'use strict';

    var defaults = {
            visibleItems: 999,
            instanceName: null,
            url: '',
            idsParameter: 'ids',
            preselected: {ids: [], displayOption: 'top', config: {}},
            idKey: 'id',
            titleKey: 'title',
            thumbnailKey: 'thumbnails',
            thumbnailSize: '50x50',
            resultKey: 'media',
            positionSelectedClass: 'selected',
            translations: {
                noMediaSelected: 'media-selection.nomedia-selected',
                addImages: 'media-selection.add-images',
                choose: 'public.choose',
                collections: 'media-selection.collections',
                visible: 'public.visible',
                of: 'public.of'
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
        eventNamespace = 'sulu.media-selection.',

        /**
         * raised when all overlay components returned their value
         * @event sulu.media-selection.input-retrieved
         */
        INPUT_RETRIEVED = function() {
            return createEventName.call(this, 'input-retrieved');
        },

        /**
         * raised when the overlay data has been changed
         * @event sulu.media-selection.data-changed
         */
        DATA_CHANGED = function() {
            return createEventName.call(this, 'data-changed');
        },

        /**
         * raised before data is requested with AJAX
         * @event sulu.media-selection.data-request
         */
        DATA_REQUEST = function() {
            return createEventName.call(this, 'data-request');
        },

        /**
         * raised when data has returned from the ajax request
         * @event sulu.media-selection.data-retrieved
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
                    '<div class="white-box form-element" id="', options.ids.container, '">',
                    '   <div class="header">',
                    '       <span class="fa-plus-circle icon left action" id="', options.ids.addButton, '"></span>',
                    '       <div class="position">',
                    '<div class="husky-position" id="', options.ids.displayOption ,'">',
                    '    <div class="top left" data-position="leftTop"></div>',
                    '    <div class="top middle" data-position="top"></div>',
                    '    <div class="top right" data-position="rightTop"></div>',
                    '    <div class="middle left" data-position="left"></div>',
                    '    <div class="middle middle inactive"></div>',
                    '    <div class="middle right" data-position="right"></div>',
                    '    <div class="bottom left" data-position="leftBottom"></div>',
                    '    <div class="bottom middle" data-position="bottom"></div>',
                    '    <div class="bottom right" data-position="rightBottom"></div>',
                    '</div>',
                    '       </div>',
                    '       <span class="fa-cog icon right border" id="', options.ids.configButton, '" style="display:none"></span>',
                    '   </div>',
                    '   <div class="content" id="', options.ids.content, '"></div>',
                    '</div>'
                ].join('');
            },

            noContent: function(noContentString) {
                return [
                    '<div class="no-content">',
                    '   <span class="fa-coffee icon"></span>',
                    '   <div class="text">', noContentString, '</div>',
                    '</div>'
                ].join('');
            },

            addTab: function(options, header) {
                return[
                    '<div id="', options.ids.chooseTab, '">',
                    '   <div class="heading">',
                    '       <h3>', header, '</h3>',
                    '   </div>',
                    '   <div id="', options.ids.gridGroup, '"/>',
                    '</div>'
                ].join('');
            },
            contentItem: function(id, num, value, imageUrl) {
                return [
                    '<li data-id="', id, '">',
                    '   <span class="num">', num, '</span>',
                    '   <img src="', imageUrl, '/>',
                    '   <span class="value">', value, '</span>',
                    '   <span class="fa-times remove"></span>',
                    '</li>'
                ].join('')
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
            // init collection
            this.collections = new Collections();

            this.options.ids = {
                container: 'media-selection-' + this.options.instanceName + '-container',
                addButton: 'media-selection-' + this.options.instanceName + '-add',
                configButton: 'media-selection-' + this.options.instanceName + '-config',
                displayOption: 'media-selection-' + this.options.instanceName + '-display-option',
                content: 'media-selection-' + this.options.instanceName + '-content',
                chooseTab: 'media-selection-' + this.options.instanceName + '-choose-tab',
                gridGroup: 'media-selection-' + this.options.instanceName + '-grid-group'
            };
            this.sandbox.dom.html(this.$el, templates.skeleton(this.options));

            // init container
            this.$container = this.sandbox.dom.find(getId.call(this, 'container'), this.$el);
            this.$content = this.sandbox.dom.find(getId.call(this, 'content'), this.$el);
            this.$addButton = this.sandbox.dom.find(getId.call(this, 'addButton'), this.$el);
            this.$configButton = this.sandbox.dom.find(getId.call(this, 'configButton'), this.$el);
            // TODO: footer this.$footer

            // set preselected values
            if (!!this.sandbox.dom.data(this.$el, 'media-selection')) {
                var data = this.sandbox.util.extend(true, {}, dataDefaults, this.sandbox.dom.data(this.$el, 'media-selection'));
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
            var noMedia = this.sandbox.translate(this.options.translations.noMediaSelected);
            this.sandbox.dom.html(this.$content, templates.noContent(noMedia));
        },

        /**
         * custom event handling
         */
        bindCustomEvents = function() {
            this.sandbox.on('husky.tabs.overlaymedia-selection.' + this.options.instanceName + '.add.initialized', function() {
                this.collections.fetch({
                    success: function(collections) {
                        this.sandbox.start([
                            {
                                name: 'grid-group@suluadmin',
                                options: {
                                    data: collections.toJSON(),
                                    el: this.sandbox.dom.find(getId.call(this, 'gridGroup')),
                                    instanceName: this.options.instanceName,
                                    gridUrl: '/admin/api/media?collection=',
                                    preselected: this.data.ids,
                                    resultKey: this.options.resultKey,
                                    dataGridOptions: {
                                        view: 'table',
                                        resizeListeners: false,
                                        viewOptions: {
                                            table: {
                                                excludeFields: ['id'],
                                                showHead: false,
                                                cssClass: 'minimal'
                                            }
                                        },
                                        pagination: false,
                                        matchings: [
                                            {
                                                name: 'id'
                                            },
                                            {
                                                name: 'thumbnails',
                                                translation: 'thumbnails',
                                                type: 'thumbnails'
                                            },
                                            {
                                                name: 'title',
                                                translation: 'title'
                                            }
                                        ]
                                    }
                                }
                            }
                        ]);
                    }.bind(this)
                });
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
         * handle dom events
         */
        bindDomEvents = function() {
            // chgange display options on click on a positon square
            this.sandbox.dom.on(getId.call(this, 'displayOption') + ' > div', 'click', changeDisplayOptions.bind(this));

            // click on remove icons
            this.sandbox.dom.on(getId.call(this, 'content'), 'click', removeHandler.bind(this), 'li .remove');
        },

        /**
         * Handles the click event on the remove icon
         * @param event
         */
        removeHandler = function(event) {
            console.log(event);
        },

        /**
         * renders the content decides whether the footer is rendered or not
         */
        renderContent = function() {
            if (this.items.length !== 0) {
                var ul = this.sandbox.dom.createElement('<ul class="items-list"/>'),
                    i = -1,
                    length = this.items.length,
                    url;

                //loop stops if no more items are left or if number of rendered items matches itemsVisible
                for (; ++i < length && i < this.itemsVisible;) {
                    url = this.items[i][this.options.thumbnailKey][this.options.thumbnailSize];
                    this.sandbox.dom.append(ul, templates.contentItem(this.items[i][this.options.idKey], i + 1, this.items[i][this.options.titleKey], url));
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
                this.$footer = this.sandbox.dom.createElement('<div class="footer"/>');
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
            var chooseTabData = templates.addTab(this.options, this.sandbox.translate(this.options.translations.collections));

            var $element = this.sandbox.dom.createElement('<div/>');
            this.sandbox.dom.append(this.$el, $element);

            this.sandbox.start([
                {
                    name: 'overlay@husky',
                    options: {
                        triggerEl: this.$addButton,
                        cssClass: 'media-selection-overlay',
                        el: $element,
                        container: this.$el,
                        instanceName: 'media-selection.' + this.options.instanceName + '.add',
                        skin: 'wide',
                        slides: [
                            {
                                title: this.sandbox.translate(this.options.translations.addImages),
                                okCallback: getAddOverlayData.bind(this),
                                cssClass: 'media-selection-overlay-add',
                                tabs: [
                                    {
                                        title: this.sandbox.translate(this.options.translations.choose),
                                        data: chooseTabData
                                    }
                                ]
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
            var idsDef = this.sandbox.data.deferred();

            this.sandbox.emit('sulu.grid-group.' + this.options.instanceName + '.get-selected-ids', function(ids) {
                setData.call(this, {ids: ids});
                idsDef.resolve();
            }.bind(this));

            idsDef.then(function() {
                this.sandbox.emit(INPUT_RETRIEVED.call(this));
            }.bind(this));
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
                this.sandbox.emit(DATA_REQUEST.call(this));
                startLoader.call(this);

                // reset item visible
                this.itemsVisible = this.options.visibleItems;

                this.sandbox.util.load(this.URI.str)
                    .then(function(data) {
                        this.items = data._embedded[this.options.resultKey];

                        this.sandbox.emit(DATA_RETRIEVED.call(this));
                    }.bind(this))
                    .then(function(error) {
                        this.sandbox.logger.log(error);
                    }.bind(this));
            }
        },

        /**
         * set data of media-selection
         */
        setData = function(data) {
            for (var propertyName in data) {
                if (data.hasOwnProperty(propertyName)) {
                    this.data[propertyName] = data[propertyName];
                }
            }
            this.sandbox.dom.data(this.$el, 'media-selection', this.data);
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
         * Changes the display option
         * @param event {Object} the click event
         */
        changeDisplayOptions = function(event) {
            // deselect the current positon element
            this.sandbox.dom.removeClass(
                this.sandbox.dom.find('.' + this.options.positionSelectedClass, getId.call(this, 'displayOption')),
                this.options.positionSelectedClass
            )

            // select clicked on
            this.sandbox.dom.addClass(event.currentTarget, this.options.positionSelectedClass);

            setData.call(this, {displayOption: this.sandbox.dom.data(event.currentTarget, 'position')});
            this.sandbox.emit(DATA_CHANGED.call(this), this.data, this.$el);
        },

        /**
         * set display option to element
         */
        setDisplayOption = function() {
            var $element = this.$find(getId.call(this, 'displayOption')),
                $position = this.sandbox.dom.find('[data-position="'+ this.data.displayOption +'"]', $element);
            if (!!$position.length) {
                this.sandbox.dom.addClass($position, this.options.positionSelectedClass);
            }
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
