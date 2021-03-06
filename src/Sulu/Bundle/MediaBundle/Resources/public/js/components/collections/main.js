/*
 * This file is part of the Sulu CMF.
 *
 * (c) MASSIVE ART WebServices GmbH
 *
 * This source file is subject to the MIT license that is bundled
 * with this source code in the file LICENSE.
 */

define([
    'sulumedia/collection/collections',
    'sulumedia/collection/medias',
    'sulumedia/model/collection',
    'sulumedia/model/media'
],
    function (Collections, Medias, Collection, Media) {

        'use strict';

        var collectionEditTabs = {
                FILES: 'files',
                SETTINGS: 'settings'
            },

            constants = {
                lastVisitedCollectionKey: 'last-visited-collection'
            },

            namespace = 'sulu.media.collections.',

            /**
             * listens on and changes the view to collections list
             * @event sulu.media.collections.list
             * @param noReload {Boolean} if false page reloads
             */
            ROUTE_TO_LIST = function () {
                return createEventName.call(this, 'list');
            },

            /**
             * listens on and deletes medias
             * @event sulu.media.collections.delete-media
             * @param ids {Array} array of ids of the media to delete
             * @param callback {Function} callback to execute after a media got deleted
             * @param noDialog {Boolean} if true no dialog will be shown
             */
            DELETE_MEDIA = function () {
                return createEventName.call(this, 'delete-media');
            },

            /**
             * listens on and reloads a media
             * @event sulu.media.collections.reload-single-media
             * @param id {String|Number} The id of the media
             * @param parameters {Object} parameters to add to the request
             * @param callback {Function} callback to pass the result to
             */
            RELOAD_SINGLE_MEDIA = function () {
                return createEventName.call(this, 'reload-single-media');
            },

            /**
             * listens on and reloads multiple media
             * @event sulu.media.collections.reload--media
             * @param media {Array} An array of media models
             * @param parameters {Object} parameters to add to the request
             * @param callback {Function} callback to pass the result to
             */
            RELOAD_MEDIA = function () {
                return createEventName.call(this, 'reload-media');
            },

            /**
             * listens on and deletes a collection
             * @event sulu.media.collections.delete-collection
             * @param id {Number|String} the id of the collection to delete
             * @param callback {Function} callback to execute after a media got deleted
             */
            DELETE_COLLECTION = function () {
                return createEventName.call(this, 'delete-collection');
            },

            /**
             * raised after a media got deleted
             * @event sulu.media.collections.media-deleted
             * @param id {Number|String} the id of the deleted media
             */
            SINGLE_MEDIA_DELETED = function () {
                return createEventName.call(this, 'media-deleted');
            },

            /**
             * raised after a collection got deleted
             * @event sulu.media.collections.collection-deleted
             * @param id {Number|String} the id of the deleted media
             */
            COLLECTION_DELETED = function () {
                return createEventName.call(this, 'collection-deleted');
            },

            /**
             * raised after a media model got saved
             * @event sulu.media.collections.media-saved
             * @param {Object} the changed media object
             */
            MEDIA_SAVED = function () {
                return createEventName.call(this, 'media-saved');
            },

            /**
             * listens on loads the media model for an id and forwards it to another component
             * @event sulu.media.collections.edit-media
             * @param id {Number|String} the id of the media to edit
             */
            EDIT_MEDIA = function () {
                return createEventName.call(this, 'edit-media');
            },

            /**
             * listens on saves a given media
             * @event sulu.media.collections.save-media
             * @param media {Object|Array} a media object with at least an id property. Can be an array of media objects
             * @param callback {Function} a callback-method to execute after all media got saved
             */
            SAVE_MEDIA = function () {
                return createEventName.call(this, 'save-media');
            },

            /**
             * listens on saves a given collection
             * @event sulu.media.collections.save-collection
             * @param collection {Object} a collection object with at least an id property
             * @param callback {Function} callback to call after collection has been saved
             */
            SAVE_COLLECTION = function () {
                return createEventName.call(this, 'save-collection');
            },

            /**
             * listens on and reloads a collection
             * @event sulu.media.collections.reload-media
             * @param id {String|Number} The id of the collection
             * @param parameters {Object} parameters to add to the request
             * @param callback {Function} callback to pass the result to
             */
            RELOAD_COLLECTION = function () {
                return createEventName.call(this, 'reload-collection');
            },

            /**
             * emited after a collection entity got changed
             * @event sulu.media.collections.collection-changed
             * @param {Object} the changed collection object
             */
            COLLECTION_CHANGED = function () {
                return createEventName.call(this, 'collection-changed');
            },

            /**
             * listens on and navigates to collection edit
             * @event sulu.media.collections.collection-edit
             * @param {Number|String} the id of the collection
             * @param {String} the tab to navigate to
             */
            NAVIGATE_COLLECTION_EDIT = function () {
                return createEventName.call(this, 'collection-edit');
            },

            /**
             * listens on and navigates to collection list
             * @event sulu.media.collections.collection-list
             */
            NAVIGATE_COLLECTION_LIST = function () {
                return createEventName.call(this, 'collection-list');
            },

            /**
             * listens on and downloads a single media
             * @event sulu.media.collections.download-media
             */
            DOWNLOAD_MEDIA = function () {
                return createEventName.call(this, 'download-media');
            },

            /** returns normalized event names */
            createEventName = function (postFix) {
                return namespace + postFix;
            };

        return {

            initialize: function () {
                // store backbone-models in global backbone-collections
                this.collections = new Collections();
                this.medias = new Medias();

                this.getLocale().then(function (locale) {
                    this.locale = locale;
                    this.bindCustomEvents();

                    if (this.options.display === 'list') {
                        this.renderList();
                    } else if (this.options.display === 'files') {
                        this.renderCollectionEdit({
                            activeTab: 'files'
                        });
                    } else if (this.options.display === 'settings') {
                        this.renderCollectionEdit({
                            activeTab: 'settings'
                        });
                    } else {
                        throw 'display type wrong';
                    }
                    this.startMediaEdit();

                }.bind(this));
            },

            /**
             * Gets the current locale for editing
             * @returns {*}
             */
            getLocale: function () {
                var dfd = this.sandbox.data.deferred();

                this.sandbox.emit('sulu.media.collections-edit.get-locale', function (locale) {
                    dfd.resolve(locale);
                }.bind(this));

                if (this.options.display === 'list') {
                    dfd.resolve(this.sandbox.sulu.user.locale);
                }

                return dfd.promise();
            },

            /**
             * Helper function to get a media model
             * @param id {String|Number} id of the model
             * @returns {Object} the backbone model
             */
            getMediaModel: function (id) {
                if (!!this.medias.get(id)) {
                    return this.medias.get(id);
                } else {
                    var model = new Media();
                    if (!!id) {
                        model.set({id: id});
                    }
                    this.medias.push(model);
                    return model;
                }
            },

            /**
             * Helper function to get a collection model
             * @param id {String|Number} id of the model
             * @returns {Object} the backbone model
             */
            getCollectionModel: function (id) {
                if (!!this.collections.get(id)) {
                    return this.collections.get(id);
                } else {
                    var model = new Collection();
                    if (!!id) {
                        model.set({id: id});
                    }
                    this.collections.push(model);
                    return model;
                }
            },

            /**
             * Bind custom events concerning collections
             */
            bindCustomEvents: function () {
                // navigate to list view
                this.sandbox.on(ROUTE_TO_LIST.call(this), function (noReload) {
                    this.sandbox.emit('sulu.router.navigate', 'media/collections', !noReload ? true : false, true);
                }, this);

                // delete media
                this.sandbox.on(DELETE_MEDIA.call(this), this.deleteMedia.bind(this));

                // delete collection
                this.sandbox.on(DELETE_COLLECTION.call(this), this.deleteCollection.bind(this));

                // edit a media
                this.sandbox.on(EDIT_MEDIA.call(this), this.editMedia.bind(this));

                // change/saves a media
                this.sandbox.on(SAVE_MEDIA.call(this), this.saveMedia.bind(this));

                // change/saves a collection
                this.sandbox.on(SAVE_COLLECTION.call(this), this.saveCollection.bind(this));

                // reload a collection
                this.sandbox.on(RELOAD_COLLECTION.call(this), this.reloadCollection.bind(this));

                // reload a media
                this.sandbox.on(RELOAD_SINGLE_MEDIA.call(this), this.reloadSingleMedia.bind(this));

                // reload multiple media
                this.sandbox.on(RELOAD_MEDIA.call(this), this.reloadMedia.bind(this));

                // reload multiple media
                this.sandbox.on(DOWNLOAD_MEDIA.call(this), this.downloadMedia.bind(this));

                // navigate to collection edit
                this.sandbox.on(NAVIGATE_COLLECTION_EDIT.call(this), function (collectionId, tab) {
                    // default tab is files
                    tab = (!!tab) ? tab : 'files';
                    this.sandbox.emit('sulu.router.navigate', 'media/collections/edit:' + collectionId + '/' + tab, true, true);
                }.bind(this));

                // navigate to collection list
                this.sandbox.on(NAVIGATE_COLLECTION_LIST.call(this), function () {
                    this.sandbox.emit('sulu.router.navigate', 'media/collections', true, true);
                }.bind(this));
            },

            /**
             * Downloads a single media
             * @param mediaId {Number|String} the id of the media
             */
            downloadMedia: function(mediaId) {
                var media;
                // if media exists there is no need to fetch the media again - the local one is up to date
                if (!this.medias.get(mediaId)) {
                    media = this.getMediaModel(mediaId);
                    media.fetch({
                        success: function (media) {
                            this.sandbox.dom.window.location.href = media.toJSON().url;
                        }.bind(this),
                        error: function () {
                            this.sandbox.logger.log('Error while fetching a single media');
                        }.bind(this)
                    });
                } else {
                    media = this.getMediaModel(mediaId);
                    this.sandbox.dom.window.location.href = media.toJSON().url;
                }
            },

            /**
             * Saves data for an existing collection
             * @param data {Object} object with the data to update
             * @param callback {Function} callback to call if collection has been saved
             */
            saveCollection: function (data, callback) {
                var collection = this.getCollectionModel(data.id);
                collection.set(data);
                collection.save(null, {
                    success: function (collection) {
                        this.sandbox.emit(COLLECTION_CHANGED.call(this), collection.toJSON());
                        if (typeof callback === 'function') {
                            callback(collection.toJSON());
                        }
                    }.bind(this),
                    error: function () {
                        this.sandbox.logger.log('Error while saving collection');
                    }.bind(this)
                });
            },

            /**
             * Reloads a collection and passes the result to a callback
             * @param id {String|Number} The id of the collection
             * @param parameters {Object} parameters to add to the request
             * @param callback {Function} callback to pass the result to
             */
            reloadCollection: function (id, parameters, callback) {
                var collection = this.getCollectionModel(id);
                collection.fetch({
                    data: parameters,
                    success: function (collection) {
                        if (typeof callback === 'function') {
                            callback(collection.toJSON());
                        }
                    }.bind(this),
                    error: function () {
                        this.sandbox.logger.log('Error while fetching a single collection');
                    }.bind(this)
                });
            },

            /**
             * Reloads a single media and passes the result to a callback
             * @param id {String|Number} The id of the media
             * @param parameters {Object} parameters to add to the request
             * @param callback {Function} callback to pass the result to
             */
            reloadSingleMedia: function (id, parameters, callback) {
                var media = this.getMediaModel(id);
                media.fetch({
                    data: parameters,
                    success: function (media) {
                        if (typeof callback === 'function') {
                            callback(media.toJSON());
                        }
                    }.bind(this),
                    error: function () {
                        this.sandbox.logger.log('Error while fetching a single media');
                    }.bind(this)
                });
            },

            /**
             * Reloads multiple media and passes the result to a callback
             * @param media {Array} An array of media modesl to reload
             * @param parameters {Object} parameters to add to the request
             * @param callback {Function} callback to pass the result to
             */
            reloadMedia: function(media, parameters, callback) {
                var mediaList = [];
                this.sandbox.util.foreach(media, function(singleMedia) {
                    this.reloadSingleMedia(singleMedia.id, parameters, function(updatedSingleMedia) {
                        mediaList.push(updatedSingleMedia);
                        if (mediaList.length === media.length) {
                            callback(mediaList);
                        }
                    }.bind(this));
                }.bind(this));
            },

            /**
             * Deletes an array of media
             * @param mediaIds {Array} array of media ids
             * @param callback {Function} callback to execute after deleting a media
             * @param noDialog {Boolean} if true no dialog box will be shown
             */
            deleteMedia: function (mediaIds, callback, noDialog) {
                var media,
                    action = function () {
                        this.sandbox.util.foreach(mediaIds, function (id) {
                            media = this.getMediaModel(id);
                            media.destroy({
                                success: function () {
                                    if (typeof callback === 'function') {
                                        callback(id);
                                    } else {
                                        this.sandbox.emit(SINGLE_MEDIA_DELETED.call(this), id);
                                    }
                                }.bind(this),
                                error: function () {
                                    this.sandbox.logger.log('Error while deleting a single media');
                                }.bind(this)
                            });
                        }.bind(this));
                    }.bind(this);

                if (noDialog === true) {
                    action();
                } else {
                    this.sandbox.sulu.showDeleteDialog(function (confirmed) {
                        if (confirmed === true) {
                            action();
                        }
                    }.bind(this));
                }
            },

            /**
             * Deletes a single collection
             * @param id {Number|String} the id of the collection to delete
             * @param callback {Function} callback to execute after deleting the collection
             */
            deleteCollection: function (id, callback) {
                this.sandbox.sulu.showDeleteDialog(function (confirmed) {
                    if (confirmed === true) {
                        var collection = this.getCollectionModel(id);
                        collection.destroy({
                            success: function () {
                                if (typeof callback === 'function') {
                                    callback(id);
                                } else {
                                    this.sandbox.emit(COLLECTION_DELETED.call(this), id);
                                }
                            }.bind(this),
                            error: function () {
                                this.sandbox.logger.log('Error while deleting a collection');
                            }.bind(this)
                        });
                    }
                }.bind(this));
            },

            /**
             * Edit media. A single one or more at once
             * @param data {Number|String|Array} the id of the media or an array of ids
             */
            editMedia: function (data) {
                if (this.sandbox.dom.isArray(data)) {
                    if (data.length === 1) {
                        this.editSingleMedia(data[0]);
                    } else {
                        this.editMultipleMedia(data);
                    }
                } else {
                    this.editSingleMedia(data);
                }
            },

            /**
             * Edits a single media - Takes the id of a media, loads the model and forwards it to
             * another component
             * @param record {Number|String} id of the media to edit
             */
            editSingleMedia: function (record) {
                var media;
                // if media exists there is no need to fetch the media again - the local one is up to date
                if (!this.medias.get(record)) {
                    media = this.getMediaModel(record);
                    media.fetch({
                        success: function (media) {
                            // forward media to media-edit component
                            this.sandbox.emit('sulu.media-edit.edit', media.toJSON());
                        }.bind(this),
                        error: function () {
                            this.sandbox.logger.log('Error while fetching a single media');
                        }.bind(this)
                    });
                } else {
                    media = this.getMediaModel(record);
                    this.sandbox.emit('sulu.media-edit.edit', media.toJSON());
                }
            },

            /**
             * Edits a multiple - Loads all the media and forwards it to another component
             * @param records {Array} array with ids of the media to edit
             */
            editMultipleMedia: function (records) {
                var mediaList = [],
                    media,
                    action = function () {
                        if (mediaList.length === records.length) {
                            this.sandbox.emit('sulu.media-edit.edit', mediaList);
                        }
                    }.bind(this);

                // loop through ids - if model is already loaded take it else load it
                this.sandbox.util.foreach(records, function (mediaId) {
                    if (!this.medias.get(mediaId)) {
                        media = this.getMediaModel(mediaId);
                        media.fetch({
                            success: function (media) {
                                mediaList.push(media.toJSON());
                                action();
                            }.bind(this),
                            error: function () {
                                this.sandbox.logger.log('Error while fetching a single media');
                            }.bind(this)
                        });
                    } else {
                        mediaList.push(this.getMediaModel(mediaId).toJSON());
                        action();
                    }
                }.bind(this));
            },

            /**
             * Takes a media or an array of media and saves it/them
             * @param media {Object|Array} the media object or an array of media objects
             * @param callback {Function} callback to execute after all media got saved
             * @param noSave {Boolean} true to not save the media. Can be used if you just want to use the event but don't actually save the media
             */
            saveMedia: function (media, callback, noSave) {
                if (noSave !== true) {
                    var model, length = 0;

                    // if passed argument is a single media object make an array with it
                    if (!this.sandbox.dom.isArray(media)) {
                        media = [media];
                    }

                    this.sandbox.util.foreach(media, function (mediaEntity) {
                        model = this.getMediaModel(mediaEntity.id);
                        model.set(mediaEntity);

                        model.save(null, {
                            success: function (savedMedia) {
                                this.sandbox.emit(MEDIA_SAVED.call(this), savedMedia.toJSON());
                                if (++length === media.length) {
                                    callback(savedMedia.toJSON());
                                }
                            }.bind(this),
                            error: function () {
                                this.sandbox.logger.log('Error while saving a single media');
                            }.bind(this)
                        });
                    }.bind(this));
                }
            },

            /**
             * Inserts a container and starts the collections list in it
             */
            renderList: function () {
                var $list = this.sandbox.dom.createElement('<div id="collections-list-container"/>');
                this.sandbox.dom.append(this.$el, $list);

                this.collections.fetch({
                    success: function (collections) {
                        this.sandbox.start([
                            {
                                name: 'collections/components/list@sulumedia',
                                options: {
                                    el: $list,
                                    data: collections.toJSON()
                                }
                            }
                        ]);
                    }.bind(this),
                    error: function () {
                        this.sandbox.logger.log('Error while fetching all collections');
                    }.bind(this)
                });
            },

            /**
             * Inserts a container and starts the files-view of a single
             * collection in it
             * @param options {Object} options to pass to the component
             */
            renderCollectionEdit: function (options) {
                var $edit = this.sandbox.dom.createElement('<div id="collection-edit-container"/>'),
                    collection = this.getCollectionModel(this.options.id);
                this.sandbox.dom.append(this.$el, $edit);

                this.sandbox.sulu.saveUserSetting(constants.lastVisitedCollectionKey, this.options.id);

                collection.fetch({
                    data: {locale: this.locale},
                    success: function (collection) {
                        if (options.activeTab === collectionEditTabs.FILES) {
                            this.sandbox.start([
                                {
                                    name: 'collections/components/files@sulumedia',
                                    options: this.sandbox.util.extend(true, {}, {
                                        el: $edit,
                                        data: collection.toJSON(),
                                        locale: this.locale
                                    }, options)
                                }
                            ]);
                        } else if (options.activeTab === collectionEditTabs.SETTINGS) {
                            this.sandbox.start([
                                {
                                    name: 'collections/components/settings@sulumedia',
                                    options: this.sandbox.util.extend(true, {}, {
                                        el: $edit,
                                        data: collection.toJSON(),
                                        locale: this.locale
                                    }, options)
                                }
                            ]);
                        } else {
                            this.sandbox.logger.log('Error. No valid tab ' + this.options.content);
                        }
                    }.bind(this),
                    error: function () {
                        this.sandbox.logger.log('Error while fetching a single collection');
                    }.bind(this)
                });
            },

            /**
             * Starts the media-edit-component
             */
            startMediaEdit: function () {
                var $container = this.sandbox.dom.createElement('<div/>');
                this.sandbox.dom.append(this.$el, $container);
                this.sandbox.start([
                    {
                        name: 'collections/components/media-edit@sulumedia',
                        options: {
                            el: $container
                        }
                    }
                ]);
            }
        };
    });
