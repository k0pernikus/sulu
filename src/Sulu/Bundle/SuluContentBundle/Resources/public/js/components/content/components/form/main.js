/*
 * This file is part of the Sulu CMS.
 *
 * (c) MASSIVE ART WebServices GmbH
 *
 * This source file is subject to the MIT license that is bundled
 * with this source code in the file LICENSE.
 */

define([], function() {

    'use strict';

    return {

        view: true,

        templates: ['/admin/content/template/form/overview'],

        initialize: function() {
            this.saved = true;

            this.formId = '#content-form';
            this.render();

            this.setHeaderBar(true);
            this.listenForChange();
        },

        render: function() {
            this.html(this.renderTemplate('/admin/content/template/form/overview'));

            var data = this.initData();
            this.createForm(data);

            this.bindDomEvents();
            this.bindCustomEvents();
        },

        createForm: function(data) {
            var formObject = this.sandbox.form.create(this.formId);
            formObject.initialized.then(function() {
                this.sandbox.form.setData(this.formId, data);
                this.initPreview();
            }.bind(this));
        },

        bindDomEvents: function() {
            this.sandbox.dom.keypress(this.formId, function(event) {
                if (event.which === 13) {
                    event.preventDefault();
                    this.submit();
                }
            }.bind(this));

            if (!this.options.data.id) {
                this.sandbox.dom.one('#title', 'focusout', this.setResourceLocator.bind(this));
            }
        },

        setResourceLocator: function() {
            var title = this.sandbox.dom.val('#title'),
                url = '#url';

            this.sandbox.dom.addClass(url, 'is-loading');
            this.sandbox.dom.css(url, 'background-position', '99%');

            this.sandbox.emit('sulu.content.contents.getRL', title, function(rl) {
                this.sandbox.dom.removeClass(url, 'is-loading');
                this.sandbox.dom.val(url, rl);
            }.bind(this));
        },

        bindCustomEvents: function() {
            // content saved
            this.sandbox.on('sulu.content.contents.saved', function(id) {
                this.setHeaderBar(true);
            }, this);

            // content saved
            this.sandbox.on('sulu.edit-toolbar.save', function() {
                this.submit();
            }, this);

            // content delete
            this.sandbox.on('sulu.edit-toolbar.delete', function() {
                this.sandbox.emit('sulu.content.content.delete', this.options.data.id);
            }.bind(this));

            // back to list
            this.sandbox.on('sulu.edit-toolbar.back', function() {
                this.sandbox.emit('sulu.content.contents.list');
            }, this);

            this.sandbox.on('sulu.edit-toolbar.preview.new-window', function() {
                this.openPreviewWindow();
            }, this);
        },

        initData: function() {
            return this.options.data;
        },

        submit: function() {
            this.sandbox.logger.log('save Model');

            if (this.sandbox.form.validate(this.formId)) {
                var data = this.sandbox.form.getData(this.formId);

                this.sandbox.logger.log('data', data);

                this.sandbox.emit('sulu.content.contents.save', data);
            }
        },

        // @var Bool saved - defines if saved state should be shown
        setHeaderBar: function(saved) {
            if (saved !== this.saved) {
                var type = (!!this.options.data && !!this.options.data.id) ? 'edit' : 'add';
                this.sandbox.emit('sulu.edit-toolbar.content.state.change', type, saved);
            }
            this.saved = saved;
        },


        listenForChange: function() {
            this.sandbox.dom.on(this.formId, 'change', function() {
                this.setHeaderBar(false);
            }.bind(this), "select, input");
            this.sandbox.dom.on(this.formId, 'keyup', function() {
                this.setHeaderBar(false);
            }.bind(this), "input,textarea");

            this.sandbox.on('husky.ckeditor.changed', function() {
                this.setHeaderBar(false);
            }.bind(this));
        },

        openPreviewWindow: function() {
            window.open('/admin/content/preview/' + this.options.data.id);
        },

        initPreview: function() {
            var updateUrl = '/admin/content/preview/' + this.options.data.id,
                data = this.sandbox.form.getData(this.formId);

            this.sandbox.util.ajax({
                url: updateUrl,
                type: 'POST',

                data: {
                    changes: data
                }
            });

            this.sandbox.dom.on(this.formId, 'focusout', function(e) {
                var $element = $(e.currentTarget);
                this.updatePreview.call(this, $element.data('mapperProperty'), $element.data('element').getValue());
            }.bind(this), "select, input, textarea");

            this.sandbox.on('husky.ckeditor.changed', function(data, $el) {
                this.updatePreview.call(this, $el.data('mapperProperty'), data);
            }.bind(this));
        },

        updatePreview: function(property, value) {
            var updateUrl = '/admin/content/preview/' + this.options.data.id,
                changes = {};
            changes[property] = value;


            this.sandbox.util.ajax({
                url: updateUrl,
                type: 'POST',

                data: {
                    changes: changes
                }
            });
        }

    };
});
