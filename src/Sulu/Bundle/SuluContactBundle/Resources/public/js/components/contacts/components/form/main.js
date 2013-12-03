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

    return (function() {
        // FIXME move to this.*
        var form = '#contact-form',
            emailItem,
            phoneItem,
            addressItem,
            currentType,
            currentState,
            addressCounter;

        return {

            view: true,

            templates: ['/admin/contact/template/contact/form'],

            initialize: function() {
                currentType = currentState = '';
                addressCounter=1;
                this.formId='#contact-form';
                this.render();
                this.setHeaderBar(true);
                this.listenForChange();
            },

            render: function() {
                this.sandbox.once('sulu.contacts.set-defaults', this.setDefaults.bind(this));

                this.$el.html(this.renderTemplate('/admin/contact/template/contact/form'));

                emailItem = this.$el.find('#emails .emails-item:first');
                phoneItem = this.$el.find('#phones .phones-item:first');
                addressItem = this.$el.find('#addresses .addresses-item:first');

                this.sandbox.on('husky.dropdown.type.item.click', this.typeClick.bind(this));

                var data = this.initData();

                this.sandbox.start([
                    {
                        name: 'auto-complete@husky',
                        options: {
                            el: '#company',
                            url: '/admin/api/accounts?flat=true&searchFields=id,name',
                            value: data.account,
                            instanceName:'company-input'
                        }
                    }
                ]);

                this.createForm(data);

                this.bindDomEvents();
                this.bindCustomEvents();
            },

            setDefaults: function(defaultTypes) {
                this.defaultTypes = defaultTypes;
            },

            createForm: function(data) {
                var formObject = this.sandbox.form.create(form);
                formObject.initialized.then(function() {

                    this.sandbox.form.setData(form, data).then(function() {
                        this.sandbox.start(form);

                        this.sandbox.form.addConstraint(form, '#emails .emails-item:first input.email-value', 'required', {required: true});
                        this.sandbox.dom.find('#emails .emails-item:first .remove-email').remove();
                        this.sandbox.dom.addClass('#emails .emails-item:first label span:first', 'required');
                    }.bind(this));

                }.bind(this));

                this.sandbox.form.addCollectionFilter(form, 'emails', function(email) {
                    if (email.id === "") {
                        delete email.id;
                    }
                    return email.email !== "";
                });
                this.sandbox.form.addCollectionFilter(form, 'phones', function(phone) {
                    if (phone.id === "") {
                        delete phone.id;
                    }
                    return phone.phone !== "";
                });
                this.sandbox.form.addCollectionFilter(form, 'addresses', function(address) {
                    if (address.id === "") {
                        delete address.id;
                    }
                    return address.street !== "" ||
                        address.number !== "" ||
                        address.zip !== "" ||
                        address.city !== "" ||
                        address.state !== "";
                });
            },

            bindDomEvents: function() {
                this.sandbox.dom.on('#addEmail', 'click', this.addEmail.bind(this));
                this.sandbox.dom.on('#emails', 'click', this.removeEmail.bind(this), '.remove-email');

                this.sandbox.dom.on('#addPhone', 'click', this.addPhone.bind(this));
                this.sandbox.dom.on('#phones', 'click', this.removePhone.bind(this), '.remove-phone');

                this.sandbox.dom.on('#addAddress', 'click', this.addAddress.bind(this));
                this.sandbox.dom.on('#addresses', 'click', this.removeAddress.bind(this), '.remove-address');

                this.sandbox.dom.keypress(this.formId, function(event) {
                    if (event.which === 13) {
                        event.preventDefault();
                        this.submit();
                    }
                }.bind(this));
            },

            bindCustomEvents: function() {
                // delete contact
                this.sandbox.on('husky.button.delete.click', function() {
                    this.sandbox.emit('sulu.contacts.contact.delete', this.options.data.id);
                }, this);

                // contact saved
                this.sandbox.on('sulu.contacts.contacts.saved', function(id) {
                    this.options.data.id = id;
                    this.setHeaderBar(true);
                }, this);

                // contact saved
                this.sandbox.on('husky.button.save.click', function() {
                    this.submit();
                }, this);
            },

            initData: function() {
                var contactJson = this.options.data;
                this.fillFields(contactJson.emails, 2, {
                    id: null,
                    email: '',
                    emailType: this.defaultTypes.emailType
                });
                this.fillFields(contactJson.phones, 2, {
                    id: null,
                    phone: '',
                    phoneType: this.defaultTypes.phoneType
                });
                this.fillFields(contactJson.addresses, 1, {
                    id: null,
                    addressType: this.defaultTypes.addressType
                });
                return contactJson;
            },

            typeClick: function(event, $element) {
                this.sandbox.logger.log('email click', event);
                $element.find('*.type-value').data('element').setValue(event);
            },

            fillFields: function(field, minAmount, value) {
                while (field.length < minAmount) {
                    field.push(value);
                }
            },


            submit: function() {
                this.sandbox.logger.log('save Model');

                if (this.sandbox.form.validate(form)) {
                    var data = this.sandbox.form.getData(form);

                    if (data.id === '') {
                        delete data.id;
                    }

                    // FIXME auto complete in mapper
                    data.account = {
                        id: this.sandbox.dom.data('#company .name-value', 'id')
                    };

                    this.sandbox.logger.log('data', data);

                    this.sandbox.emit('sulu.contacts.contacts.save', data);
                }
            },

            addEmail: function() {
                var $item = emailItem.clone();
                this.sandbox.dom.append('#emails', $item);

                this.sandbox.form.addField(form, $item.find('.id-value'));
                this.sandbox.form.addField(form, $item.find('.type-value'));
                this.sandbox.form.addField(form, $item.find('.email-value'));

                this.sandbox.start($item);
            },

            removeEmail: function(event) {
                var $item = $(event.target).parent().parent().parent();

                this.sandbox.form.removeField(form, $item.find('.id-value'));
                this.sandbox.form.removeField(form, $item.find('.type-value'));
                this.sandbox.form.removeField(form, $item.find('.email-value'));

                $item.remove();
            },

            addPhone: function() {
                var $item = phoneItem.clone();
                this.sandbox.dom.append('#phones', $item);

                this.sandbox.form.addField(form, $item.find('.id-value'));
                this.sandbox.form.addField(form, $item.find('.type-value'));
                this.sandbox.form.addField(form, $item.find('.phone-value'));

                this.sandbox.start($item);
            },

            removePhone: function(event) {
                var $item = $(event.target).parent().parent().parent();

                this.sandbox.form.removeField(form, $item.find('.id-value'));
                this.sandbox.form.removeField(form, $item.find('.type-value'));
                this.sandbox.form.removeField(form, $item.find('.phone-value'));

                $item.remove();
            },

            addAddress: function() {
                var $item = addressItem.clone();

                $item = this.setLabelsAndIdsForAddressItem($item);
                addressCounter++;

                this.sandbox.dom.append('#addresses', $item);
                $(window).scrollTop($item.offset().top);

                this.sandbox.form.addField(form, $item.find('.id-value'));
                this.sandbox.form.addField(form, $item.find('.type-value'));
                this.sandbox.form.addField(form, $item.find('.street-value'));
                this.sandbox.form.addField(form, $item.find('.number-value'));
                this.sandbox.form.addField(form, $item.find('.addition-value'));
                this.sandbox.form.addField(form, $item.find('.zip-value'));
                this.sandbox.form.addField(form, $item.find('.city-value'));
                this.sandbox.form.addField(form, $item.find('.state-value'));
                this.sandbox.form.addField(form, $item.find('.country-value'));

                this.sandbox.start($item);
            },


            setLabelsAndIdsForAddressItem: function($item){

                var $labels = this.sandbox.dom.find('label[for]', $item),
                    $inputs = this.sandbox.dom.find('input[type=text],select', $item);

                this.sandbox.dom.each($inputs, function(index, value){

                    var elementName = this.sandbox.dom.data(value, 'mapper-property');

                    this.sandbox.logger.log(value, "value");

                    this.sandbox.dom.attr($labels[index], {for: elementName+addressCounter.toString()});
                    this.sandbox.dom.attr($inputs[index], {id: elementName+addressCounter.toString()});

                }.bind(this));

                return $item;
            },

            removeAddress: function(event) {
                var $item = $(event.target).parent().parent().parent();

                this.sandbox.form.removeField(form, $item.find('.id-value'));
                this.sandbox.form.removeField(form, $item.find('.type-value'));
                this.sandbox.form.removeField(form, $item.find('.street-value'));
                this.sandbox.form.removeField(form, $item.find('.number-value'));
                this.sandbox.form.removeField(form, $item.find('.addition-value'));
                this.sandbox.form.removeField(form, $item.find('.zip-value'));
                this.sandbox.form.removeField(form, $item.find('.city-value'));
                this.sandbox.form.removeField(form, $item.find('.state-value'));
                this.sandbox.form.removeField(form, $item.find('.country-value'));

                $item.remove();
            },

            // @var Bool saved - defines if saved state should be shown
            setHeaderBar: function(saved) {

                var changeType, changeState,
                    ending = (!!this.options.data && !!this.options.data.id) ? 'Delete' : '';

                changeType = 'save' + ending;

                if (saved) {
                    if (ending === '') {
                        changeState = 'hide';
                    } else {
                        changeState = 'standard';
                    }
                } else {
                    changeState = 'dirty';
                }

                if (currentType !== changeType) {
                    this.sandbox.emit('husky.header.button-type', changeType);
                    currentType = changeType;
                }
                if (currentState !== changeState) {
                    this.sandbox.emit('husky.header.button-state', changeState);
                    currentState = changeState;
                }
            },


            listenForChange: function() {
                this.sandbox.dom.on('#contact-form', 'change', function() {
                    this.setHeaderBar(false);
                }.bind(this), "select, input");
                this.sandbox.dom.on('#contact-form', 'keyup', function() {
                    this.setHeaderBar(false);
                }.bind(this), "input");
            }

        };
    })();
});
