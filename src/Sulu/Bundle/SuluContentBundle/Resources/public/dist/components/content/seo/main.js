define([],function(){"use strict";return{view:!0,templates:["/admin/content/template/content/seo"],initialize:function(){this.sandbox.emit("sulu.app.ui.reset",{navigation:"small",content:"auto"}),this.sandbox.emit("husky.toolbar.header.item.disable","template",!1),this.formId="#seo-form",this.load(),this.bindCustomEvents()},bindCustomEvents:function(){this.sandbox.on("sulu.header.toolbar.save",function(){this.submit()},this)},submit:function(){this.sandbox.logger.log("save Model"),this.sandbox.form.validate(this.formId)&&(this.data.extensions.seo=this.sandbox.form.getData(this.formId),this.sandbox.emit("sulu.content.contents.save",this.data))},load:function(){this.sandbox.emit("sulu.content.contents.get-data",function(a){this.render(a)}.bind(this))},render:function(a){this.data=a,this.sandbox.dom.html(this.$el,this.renderTemplate("/admin/content/template/content/seo")),this.createForm(this.initData(a)),this.listenForChange()},initData:function(a){return a.extensions.seo},createForm:function(a){this.sandbox.form.create(this.formId).initialized.then(function(){this.sandbox.form.setData(this.formId,a),this.listenForChange()}.bind(this))},listenForChange:function(){this.sandbox.dom.on(this.formId,"keyup change",function(){this.setHeaderBar(!1),this.contentChanged=!0}.bind(this),".trigger-save-button")},setHeaderBar:function(a){this.sandbox.emit("sulu.content.contents.set-header-bar",a)}}});