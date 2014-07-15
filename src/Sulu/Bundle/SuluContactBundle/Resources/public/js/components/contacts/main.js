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
    'sulucontact/model/activity'
], function(Contact, Activity) {

    'use strict';

    return {

        initialize: function() {
            this.bindCustomEvents();

            if (this.options.display === 'list') {
                this.renderList();
            } else if (this.options.display === 'form') {
                this.renderForm();
            } else if (this.options.display === 'activities') {
                this.renderActivities();
            } else {
                throw 'display type wrong';
            }
        },

        bindCustomEvents: function() {

            // listen for defaults for types/statuses/prios
            this.sandbox.once('sulu.contacts.contact.activities.set.defaults', this.parseActivityDefaults.bind(this));

            // shares defaults with subcomponents
            this.sandbox.on('sulu.contacts.contact.activities.get.defaults', function() {
                this.sandbox.emit('sulu.contacts.contact.activities.set.defaults', this.activityDefaults);
            }, this);

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

            // load list view
            this.sandbox.on('sulu.contacts.contacts.list', function() {
                this.sandbox.emit('sulu.router.navigate', 'contacts/contacts');
            }, this);

            // activities remove / save / add
            this.sandbox.on('sulu.contacts.contact.activities.delete', this.removeActivities.bind(this));
            this.sandbox.on('sulu.contacts.contact.activity.save', this.saveActivity.bind(this));
            this.sandbox.on('sulu.contacts.contact.activity.load', this.loadActivity.bind(this));
        },

        /**
         * Parses and translates defaults for acitivties
         * @param defaults
         */
        parseActivityDefaults: function(defaults){
            var el, sub;
            for(el in defaults){
                if(defaults.hasOwnProperty(el)) {
                    for(sub in defaults[el]){
                        if(defaults[el].hasOwnProperty(sub)) {
                            defaults[el][sub].translation = this.sandbox.translate(defaults[el][sub].name);
                        }
                    }
                }
            }
            this.activityDefaults = defaults;
        },

        removeActivities: function(ids){

            // TODO loading
            this.confirmDeleteDialog(function(wasConfirmed) {
                if (wasConfirmed) {
//                    this.sandbox.emit('sulu.header.toolbar.item.loading', 'options-button');
                    var activity;
                    this.sandbox.util.foreach(ids, function(id) {
                        activity = Activity.findOrCreate({id: id});
                        activity.destroy({
                            success: function() {
                                this.sandbox.emit('sulu.contacts.contact.activity.removed', id);
                            }.bind(this),
                            error: function() {
                                this.sandbox.logger.log("error while deleting activity");
                            }.bind(this)
                        });
                    }.bind(this));
                }
            }.bind(this));

            // show warning
//            this.sandbox.emit('sulu.overlay.show-warning', 'sulu.overlay.be-careful', 'sulu.overlay.delete-desc', null, function() {
//                var activity;
//                this.sandbox.util.foreach(ids, function(id) {
//                    activity = Activity.findOrCreate({id: id});
//                    activity.destroy({
//                        success: function() {
//                            this.sandbox.emit('sulu.contacts.contact.activity.removed', id);
//                        }.bind(this),
//                        error: function() {
//                            this.sandbox.logger.log("error while deleting activity");
//                        }.bind(this)
//                    });
//                }.bind(this));
//            }.bind(this));
        },

        saveActivity: function(data){

            // TODO loading icon
            this.activity = Activity.findOrCreate({id: data.id});
            this.activity.set(data);
            this.activity.save(null, {
                // on success save contacts id
                success: function(response) {
                    this.activity = response;
                    this.sandbox.emit('sulu.contacts.contact.activity.saved', response.toJSON());
                }.bind(this),
                error: function() {
                    this.sandbox.logger.log("error while saving activity");
                }.bind(this)
            });
        },

        loadActivity: function(id) {
            // TODO loading icon
            if (!!id) {
                this.activity = Activity.findOrCreate({id: id});
                this.activity.fetch({
                    success: function(model) {
                        this.activity = model;
                        this.sandbox.emit('sulu.contacts.contact.activity.loaded', model.toJSON());
                    }.bind(this),
                    error: function(e1,e2) {
                        this.sandbox.logger.log('error while fetching activity', e1, e2);
                    }.bind(this)
                });
            } else {
                this.sandbox.logger.warn('no id given to load activity');
            }
        },

        del: function() {
            this.confirmDeleteDialog(function(wasConfirmed) {
                if (wasConfirmed) {
                    this.sandbox.emit('sulu.header.toolbar.item.loading', 'options-button');
                    this.contact.destroy({
                        success: function() {
                            this.sandbox.emit('sulu.router.navigate', 'contacts/contacts');
                        }.bind(this)
                    });
                }
            }.bind(this));
        },

        save: function(data) {
            this.sandbox.emit('sulu.header.toolbar.item.loading', 'save-button');
            this.contact.set(data);
            this.contact.save(null, {
                // on success save contacts id
                success: function(response) {
                    var model = response.toJSON();
                    if (!!data.id) {

                        // TODO update address lists
                        this.sandbox.emit('sulu.contacts.contacts.saved', model);
                    } else {
                        this.sandbox.emit('sulu.router.navigate', 'contacts/contacts/edit:' + model.id + '/details');
                    }
                }.bind(this),
                error: function() {
                    this.sandbox.logger.log('error while saving profile');
                }.bind(this)
            });
        },

        load: function(id) {
            // TODO: show loading icon
            this.sandbox.emit('sulu.router.navigate', 'contacts/contacts/edit:' + id + '/details');
        },

        add: function() {
            // TODO: show loading icon
            this.sandbox.emit('sulu.router.navigate', 'contacts/contacts/add');
        },

        delContacts: function(ids) {
            if (ids.length < 1) {
                this.sandbox.emit('sulu.dialog.error.show', 'No contacts selected for Deletion');
                return;
            }
            this.confirmDeleteDialog(function(wasConfirmed) {
                if (wasConfirmed) {
                    ids.forEach(function(id) {
                        var contact = new Contact({id: id});
                        contact.destroy({
                            success: function() {
                                this.sandbox.emit('husky.datagrid.record.remove', id);
                            }.bind(this)
                        });
                    }.bind(this));
                }
            }.bind(this));
        },

        renderList: function() {
            var $list = this.sandbox.dom.createElement('<div id="contacts-list-container"/>');
            this.html($list);
            this.sandbox.start([
                {name: 'contacts/components/list@sulucontact', options: { el: $list}}
            ]);
        },

        renderForm: function() {
            // load data and show form
            this.contact = new Contact();

            var $form = this.sandbox.dom.createElement('<div id="contacts-form-container"/>');
            this.html($form);

            if (!!this.options.id) {
                this.contact = new Contact({id: this.options.id});
                //contact = this.getModel(this.options.id);
                this.contact.fetch({
                    success: function(model) {
                        this.sandbox.start([
                            {name: 'contacts/components/form@sulucontact', options: { el: $form, data: model.toJSON()}}
                        ]);
                    }.bind(this),
                    error: function() {
                        this.sandbox.logger.log('error while fetching contact');
                    }.bind(this)
                });
            } else {
                this.sandbox.start([
                    {name: 'contacts/components/form@sulucontact', options: { el: $form, data: this.contact.toJSON()}}
                ]);
            }
        },

        renderActivities: function(){

            var $list;

            // load data and show form
            this.contact = new Contact();
            $list = this.sandbox.dom.createElement('<div id="activities-list-container"/>');
            this.html($list);

            this.dfdContact = this.sandbox.data.deferred();
            this.dfdSystemContacts = this.sandbox.data.deferred();

            if (!!this.options.id) {

                this.getContact(this.options.id);
                this.getSystemMembers();

                // start component when contact and system members are loaded
                this.sandbox.data.when(this.dfdContact,this.dfdSystemContacts).then(function(){
                    this.sandbox.start([
                        {name: 'contacts/components/activities@sulucontact', options: { el: $list, contact: this.contact.toJSON(), responsiblePersons: this.responsiblePersons}}
                    ]);
                }.bind(this));

            } else {
                this.sandbox.logger.error("activities are not available for unsaved contacts!");
            }
        },

        /**
         * loads contact by id
         */
        getContact: function(id){
            this.contact = new Contact({id: id});
            this.contact.fetch({
                success: function(model) {
                    this.contact = model;
                    this.dfdContact.resolve();
                }.bind(this),
                error: function() {
                    this.sandbox.logger.log('error while fetching contact');
                }.bind(this)
            });
        },

        /**
         * loads system members
         */
        getSystemMembers: function(){
            this.sandbox.util.load('api/contacts?bySystem=true')
                .then(function(response) {
                    this.responsiblePersons = response._embedded;
                    this.sandbox.util.foreach(this.responsiblePersons, function(el) {
                        var contact = Contact.findOrCreate(el);
                        el = contact.toJSON();
                    }.bind(this));
                    this.dfdSystemContacts.resolve();
                }.bind(this))
                .fail(function(textStatus, error) {
                    this.sandbox.logger.error(textStatus, error);
                }.bind(this));
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
            this.sandbox.emit('sulu.overlay.show-warning',
                'sulu.overlay.be-careful',
                'sulu.overlay.delete-desc',
                callbackFunction.bind(this, false),
                callbackFunction.bind(this, true)
            );
        }
    };
});
