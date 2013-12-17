/*
 * This file is part of the Sulu CMS.
 *
 * (c) MASSIVE ART Webservices GmbH
 *
 * This source file is subject to the MIT license that is bundled
 * with this source code in the file LICENSE.
 */


define([
    'sulusecurity/models/role',
    'text!/admin/security/navigation/roles'
], function(Role, ContentNavigation) {

    'use strict';

    return {
        name: 'Sulu Security Role',

        initialize: function() {
            this.role = null;
            this.idDelete = null;
            this.loading = 'delete';

            if (this.options.display === 'list') {
                this.renderList();
            } else if (this.options.display === 'form') {
                this.renderForm();
            }

            this.bindCustomEvents();
        },

        bindCustomEvents: function() {
            this.sandbox.on('sulu.roles.new', function() {
                this.add();
            }.bind(this));

            this.sandbox.on('sulu.roles.load', function(id) {
                this.load(id);
            }.bind(this));

            this.sandbox.on('sulu.roles.save', function(data) {
                this.save(data);
            }.bind(this));

            this.sandbox.on('sulu.role.delete', function(id) {
                this.loading = 'delete';
                this.del(id);
            }.bind(this));

            this.sandbox.on('sulu.roles.list', function() {
                this.sandbox.emit('sulu.router.navigate', 'settings/roles');
            }.bind(this));

            this.sandbox.on('sulu.roles.delete', function(ids) {
                this.loading = 'add';
                this.del(ids);
            }.bind(this));
        },

        // redirects to a new form, when the sulu.roles.new event is thrown
        add: function() {
            this.sandbox.emit('sulu.router.navigate', 'settings/roles/new');
        },

        // redirects to the form with the role data, when the sulu.roles.load event with an id is thrown
        load: function(id) {
            this.sandbox.emit('sulu.router.navigate', 'settings/roles/edit:' + id + '/details');
        },

        // saves the data, which is thrown together with a sulu.roles.save event
        save: function(data) {
            this.role.set(data);
            this.role.save(null, {
                success: function(data) {
                    this.sandbox.emit('sulu.role.saved', data.id);
                }.bind(this),
                error: function() {
                    this.sandbox.emit('sulu.dialog.error.show', 'An error occured during saving the role!');
                }.bind(this)
            });
        },

        // deletes the role with the id thrown with the sulu.role.delete event
        // id can be an array of ids or one id
        del: function(id) {
            this.idDelete = id;

            this.confirmDeleteDialog(function(wasConfirmed) {
                if (wasConfirmed) {

                    if (typeof this.idDelete === 'number' || typeof this.idDelete === 'string') {
                        this.delSubmitOnce(this.idDelete, true);
                    } else {
                        this.sandbox.util.each(this.idDelete, function(index,value) {
                            this.delSubmitOnce(value, false);
                        }.bind(this));
                    }

                }
            }.bind(this));
        },

        delSubmitOnce: function(id, navigate) {
            if(this.role === null) {
                this.role = new Role();
            }

            this.role.set({id: id});
            this.role.destroy({
                success: function() {
                    if (!!navigate) {
                        this.sandbox.emit('sulu.router.navigate', 'settings/roles');
                    } else {
                        this.sandbox.emit('husky.datagrid.row.remove', id);
                    }
                }.bind(this),
                error: function() {
                    // TODO Output error message
                    this.sandbox.emit('husky.header.button-state', 'standard');
                }.bind(this)
            });
        },

        renderList: function() {
            this.sandbox.start([
                {
                    name: 'roles/components/list@sulusecurity',
                    options: {
                        el: this.options.el
                    }
                }
            ]);
        },

        renderForm: function() {
            this.role = new Role();

            var component = {
                name: 'roles/components/form@sulusecurity',
                options: {
                    el: this.options.el,
                    data: this.role.defaults()
                }
            };

            if (!!this.options.id) {
                this.role.set({id: this.options.id});
                this.role.fetch({
                    success: function(model) {
                        component.options.data = model.toJSON();
                        this.sandbox.start([component]);
                    }.bind(this)
                });
            } else {
                this.sandbox.start([component]);
            }
        },

        // dialog

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
