define(["app-config"],function(a){"use strict";var b={headline:"contact.accounts.title"};return{view:!0,templates:["/admin/contact/template/account/form"],initialize:function(){this.options=this.sandbox.util.extend(!0,{},b,this.options),this.form="#contact-form",this.saved=!0,this.accountType=this.getAccountType(),this.setHeadlines(this.accountType),this.render(),this.initContactForm(),this.setHeaderBar(!0),this.listenForChange()},render:function(){var a,b;this.sandbox.once("sulu.contacts.set-defaults",this.setDefaults.bind(this)),this.html(this.renderTemplate("/admin/contact/template/account/form")),this.titleField=this.$find("#name"),a=this.options.data,b=[],this.options.data.id&&b.push({id:this.options.data.id}),this.sandbox.start([{name:"auto-complete@husky",options:{el:"#company",remoteUrl:"/admin/api/accounts?searchFields=id,name&flat=true",getParameter:"search",value:a.parent?a.parent:null,instanceName:"companyAccount"+a.id,valueName:"name",noNewValues:!0,excludes:[{id:a.id,name:a.name}]}}]),this.createForm(a),this.bindDomEvents(),this.bindCustomEvents()},setDefaults:function(a){this.defaultTypes=a},getAccountType:function(){var b,c,d=0,e=a.getSection("sulu-contact").accountTypes;return this.options.data.id?(b=this.options.data.type,c="id"):this.options.accountTypeName?(b=this.options.accountTypeName,c="name"):(b=0,c="id"),this.sandbox.util.foreach(e,function(a){return a[c]===b?(d=a,this.options.data.type=a.id,!1):void 0}.bind(this)),d},setHeadlines:function(a){var b=this.sandbox.translate(a.translation),c=this.sandbox.translate(this.options.headline);this.options.data.id&&(b+=" #"+this.options.data.id,c=this.options.data.name),this.sandbox.emit("sulu.content.set-title-addition",b),this.sandbox.emit("sulu.content.set-title",c)},fillFields:function(a,b,c){for(;a.length<b;)a.push(c)},initContactData:function(){var a=this.options.data;return this.fillFields(a.urls,1,{id:null,url:"",urlType:this.defaultTypes.urlType}),this.fillFields(a.emails,1,{id:null,email:"",emailType:this.defaultTypes.emailType}),this.fillFields(a.phones,1,{id:null,phone:"",phoneType:this.defaultTypes.phoneType}),this.fillFields(a.notes,1,{id:null,value:""}),a},initContactForm:function(){var a=["address","email","fax","phone","website"],b=[];this.sandbox.util.foreach(a,function(a,c){b.push({id:c,name:a})}),this.initContactData()},updateHeadline:function(){this.sandbox.emit("sulu.content.set-title",this.sandbox.dom.val(this.titleField))},createForm:function(a){var b=this.sandbox.form.create(this.form),c='#contact-fields *[data-mapper-property-tpl="email-tpl"]:first';b.initialized.then(function(){this.sandbox.form.setData(this.form,a).then(function(){this.sandbox.start(this.form),this.sandbox.form.addConstraint(this.form,c+" input.email-value","required",{required:!0}),this.sandbox.dom.addClass(c+" label span:first","required")}.bind(this))}.bind(this)),this.sandbox.form.addCollectionFilter(this.form,"emails",function(a){return""===a.id&&delete a.id,""!==a.email}),this.sandbox.form.addCollectionFilter(this.form,"phones",function(a){return""===a.id&&delete a.id,""!==a.phone})},bindDomEvents:function(){this.sandbox.dom.keypress(this.form,function(a){13===a.which&&(a.preventDefault(),this.submit())}.bind(this))},bindCustomEvents:function(){this.sandbox.on("sulu.edit-toolbar.delete",function(){this.sandbox.emit("sulu.contacts.account.delete",this.options.data.id)},this),this.sandbox.on("sulu.contacts.accounts.saved",function(a){this.options.data.id=a,this.setHeaderBar(!0)},this),this.sandbox.on("sulu.edit-toolbar.save",function(){this.submit()},this),this.sandbox.on("sulu.edit-toolbar.back",function(){this.sandbox.emit("sulu.contacts.accounts.list")},this)},submit:function(){if(this.sandbox.form.validate(this.form)){var a=this.sandbox.form.getData(this.form);a.urls=[{url:this.sandbox.dom.val("#url"),urlType:{id:this.defaultTypes.urlType.id}}],""===a.id&&delete a.id,this.updateHeadline(),a.parent={id:this.sandbox.dom.data("#company input","id")},this.sandbox.emit("sulu.contacts.accounts.save",a)}},setHeaderBar:function(a){if(a!==this.saved){var b=this.options.data&&this.options.data.id?"edit":"add";this.sandbox.emit("sulu.edit-toolbar.content.state.change",b,a)}this.saved=a},listenForChange:function(){this.sandbox.dom.on("#contact-form","change",function(){this.setHeaderBar(!1)}.bind(this),"select, input, textarea")}}});