define([],function(){"use strict";return{view:!0,layout:{changeNothing:!0},initialize:function(){this.sandbox.emit("sulu.app.ui.reset",{navigation:"small",content:"auto"}),this.sandbox.emit("husky.toolbar.header.item.disable","template",!1),this.formId="#content-form",this.load(),this.bindCustomEvents()},bindCustomEvents:function(){this.sandbox.on("sulu.header.toolbar.save",function(){this.submit()},this)},submit:function(){this.sandbox.logger.log("save Model"),this.sandbox.form.validate(this.formId)&&(this.data.ext.excerpt=this.sandbox.form.getData(this.formId),this.sandbox.emit("sulu.content.contents.save",this.data))},load:function(){this.sandbox.emit("sulu.content.contents.get-data",function(a){this.render(a)}.bind(this))},render:function(a){this.data=a,require(["text!/admin/content/template/form/excerpt.html?webspace="+this.options.webspace+"&language="+this.options.language],function(b){var c={translate:this.sandbox.translate,options:this.options},d=this.sandbox.util.template(b,c);this.sandbox.dom.html(this.$el,d),this.dfdListenForChange=this.sandbox.data.deferred(),this.createForm(this.initData(a)),this.listenForChange()}.bind(this))},initData:function(a){return a.ext.excerpt},createForm:function(a){this.sandbox.form.create(this.formId).initialized.then(function(){this.sandbox.form.setData(this.formId,a).then(function(){this.sandbox.start(this.$el,{reset:!0}),this.dfdListenForChange.resolve()}.bind(this))}.bind(this))},listenForChange:function(){this.dfdListenForChange.then(function(){this.sandbox.dom.on(this.formId,"keyup change",function(){this.setHeaderBar(!1)}.bind(this),".trigger-save-button"),this.sandbox.on("sulu.content.changed",function(){this.setHeaderBar(!1)}.bind(this))}.bind(this))},setHeaderBar:function(a){this.sandbox.emit("sulu.content.contents.set-header-bar",a)}}});