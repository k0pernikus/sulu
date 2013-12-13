/*
 * This file is part of the Sulu CMS.
 *
 * (c) MASSIVE ART WebServices GmbH
 *
 * This source file is subject to the MIT license that is bundled
 * with this source code in the file LICENSE.
 */

define([
    'sulucontact/model/contact',
    'text!/admin/contact/navigation/contact'
], function(Contact, ContentNavigation) {

    'use strict';

    return {

        initialize: function() {
            this.bindCustomEvents();

            if (this.options.display === 'list') {
                this.renderList();
            } else if (this.options.display === 'form') {
                this.renderForm();
            } else {
                throw 'display type wrong';
            }
        },

        bindCustomEvents: function() {
            // delete contact
            this.sandbox.on('sulu.contacts.contact.delete', function() {
                this.del();
            }, this);

            // save the current package
            this.sandbox.on('sulu.contacts.contacts.save', function(data) {
                this.save(data);
            }, this);

            // wait for navigation events
            this.sandbox.on('sulu.contacts.contacts.load', function(id) {
                this.load(id);
            }, this);

            // add new contact
            this.sandbox.on('sulu.contacts.contacts.new', function() {
                this.add();
            }, this);

            // delete selected contacts
            this.sandbox.on('sulu.contacts.contacts.delete', function(ids) {
                this.delContacts(ids);
            }, this);
        },

        del: function() {
            this.confirmDeleteDialog(function(wasConfirmed) {
                if (wasConfirmed) {
                    this.sandbox.emit('husky.header.button-state', 'loading-delete-button');
                    this.contact.destroy({
                        success: function() {
                            this.sandbox.emit('sulu.router.navigate', 'contacts/contacts');
                        }.bind(this)
                    });
                }
            }.bind(this));
        },

        save: function(data) {
            this.sandbox.emit('husky.header.button-state', 'loading-save-button');
            this.contact.set(data);
            this.contact.save(null, {
                // on success save contacts id
                success: function(response) {
                    var model = response.toJSON();
                    if (!!data.id) {
                        this.sandbox.emit('sulu.contacts.contacts.saved', model.id);
                    } else {
                        this.sandbox.emit('sulu.router.navigate', 'contacts/contacts/edit:' + model.id + '/details');
                    }
                }.bind(this),
                error: function() {
                    this.sandbox.logger.log("error while saving profile");
                }.bind(this)
            });
        },

        load: function(id) {
            this.sandbox.emit('husky.header.button-state', 'loading-add-button');
            this.sandbox.emit('sulu.router.navigate', 'contacts/contacts/edit:' + id + '/details');
        },

        add: function() {
            this.sandbox.emit('husky.header.button-state', 'loading-add-button');
            this.sandbox.emit('sulu.router.navigate', 'contacts/contacts/add');
        },

        delContacts: function(ids) {
            if (ids.length < 1) {
                this.sandbox.emit('sulu.dialog.error.show', 'No contacts selected for Deletion');
                return;
            }
            this.confirmDeleteDialog(function(wasConfirmed) {
                if (wasConfirmed) {
                    this.sandbox.emit('husky.header.button-state', 'loading-add-button');
                    ids.forEach(function(id) {
                        var contact = new Contact({id: id});
                        contact.destroy({
                            success: function() {
                                this.sandbox.emit('husky.datagrid.row.remove', id);
                            }.bind(this)
                        });
                    }.bind(this));
                    this.sandbox.emit('husky.header.button-state', 'standard');
                }
            }.bind(this));
        },

        renderList: function() {
            this.sandbox.start([
                {name: 'contacts/components/list@sulucontact', options: { el: this.$el}}
            ]);
        },

        renderForm: function() {
            // load data and show form
            this.contact = new Contact();
            if (!!this.options.id) {
                this.contact = new Contact({id: this.options.id});
                //contact = this.getModel(this.options.id);
                this.contact.fetch({
                    success: function(model) {
                        this.sandbox.start([
                            {name: 'contacts/components/form@sulucontact', options: { el: this.$el, data: model.toJSON()}}
                        ]);
                    }.bind(this),
                    error: function() {
                        this.sandbox.logger.log("error while fetching contact");
                    }.bind(this)
                });
            } else {
                this.sandbox.start([
                    {name: 'contacts/components/form@sulucontact', options: { el: this.$el, data: this.contact.toJSON()}}
                ]);
            }
        },

        /**
         * @var ids - array of ids to delete
         * @var callback - callback function returns true or false if data got deleted
         */
        confirmDeleteDialog: function(callbackFunction) {
            // check if callback is a function
            if (!!callbackFunction && typeof(callbackFunction) !== 'function') {
                throw 'callback is not a function';
            }

            // show dialog
            this.sandbox.emit('sulu.dialog.confirmation.show', {
                content: {
                    title: "Be careful!",
                    content: "<p>The operation you are about to do will delete data.<br/>This is not undoable!</p><p>Please think about it and accept or decline.</p>"
                },
                footer: {
                    buttonCancelText: "Don't do it",
                    buttonSubmitText: "Do it, I understand"
                },
                callback: {
                    submit: function() {
                        this.sandbox.emit('husky.dialog.hide');
                        if (!!callbackFunction) {
                            callbackFunction(true);
                        }
                    }.bind(this),
                    cancel: function() {
                        this.sandbox.emit('husky.dialog.hide');
                        if (!!callbackFunction) {
                            callbackFunction(false);
                        }
                    }.bind(this)
                }
            });
        }
    };
});
