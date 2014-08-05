define([],function(){"use strict";var a=function(){this.sandbox.emit("sulu.header.set-toolbar",{template:"default"})},b=function(a){var b=this.sandbox.translate("contact.contacts.title"),c=[{title:"navigation.contacts"},{title:"contact.contacts.title",event:"sulu.contacts.contacts.list"}];a&&a.id&&(b=a.fullName,c.push({title:"#"+a.id})),this.sandbox.emit("sulu.header.set-title",b),this.sandbox.emit("sulu.header.set-breadcrumb",c)};return{view:!0,layout:{sidebar:{width:"fixed",cssClasses:"sidebar-padding-50"}},templates:["/admin/contact/template/basic/documents"],initialize:function(){this.form="#documents-form","contact"===this.options.params.type&&(b.call(this,this.options.data),a.call(this)),this.setHeaderBar(!0),this.render(),this.options.data&&this.options.data.id&&this.initSidebar("/admin/widget-groups/account-detail?account=",this.options.data.id)},initSidebar:function(a,b){this.sandbox.emit("sulu.sidebar.set-widget",a+b)},render:function(){var a=this.options.data;this.html(this.renderTemplate(this.templates[0])),this.initForm(a),this.bindCustomEvents()},initForm:function(a){var b=this.sandbox.form.create(this.form);b.initialized.then(function(){this.setForm(a)}.bind(this))},setForm:function(a){this.sandbox.form.setData(this.form,a).fail(function(a){this.sandbox.logger.error("An error occured when setting data!",a)}.bind(this))},bindCustomEvents:function(){this.sandbox.on("sulu.header.toolbar.save",function(){this.submit()},this),this.sandbox.on("sulu.header.back",function(){this.sandbox.emit("sulu.contacts.accounts.list")},this),this.sandbox.on("sulu.media-selection.document-selection.data-changed",function(){this.setHeaderBar(!1)},this),this.sandbox.on("sulu.contacts.accounts.medias.saved",function(a){this.setHeaderBar(!0),this.setForm(a)},this),this.sandbox.on("sulu.contacts.contacts.medias.saved",function(a){this.setHeaderBar(!0),this.setForm(a)},this)},submit:function(){if(this.sandbox.form.validate(this.form)){var a=this.sandbox.form.getData(this.form);"account"===this.options.params.type?this.sandbox.emit("sulu.contacts.accounts.medias.save",this.options.data.id,a.medias.ids):"contact"===this.options.params.type?this.sandbox.emit("sulu.contacts.contacts.medias.save",this.options.data.id,a.medias.ids):this.sandbox.logger.error("Undefined type for documents component!")}},setHeaderBar:function(a){if(a!==this.saved){var b=this.options.data&&this.options.data.id?"edit":"add";this.sandbox.emit("sulu.header.toolbar.state.change",b,a,!0)}this.saved=a}}});