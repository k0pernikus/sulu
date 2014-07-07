define(["sulucontent/model/content"],function(a){"use strict";var b="contentLanguage";return{initialize:function(){this.saved=!0,this.contentChanged=!1,this.headerInitialized=this.sandbox.data.deferred(),"column"===this.options.display?this.renderColumn():this.loadData(),this.bindCustomEvents()},renderColumn:function(){var a=this.sandbox.dom.createElement('<div id="content-column-container"/>');this.html(a),this.sandbox.start([{name:"content/column@sulucontent",options:{el:a,webspace:this.options.webspace,language:this.options.language}}])},loadData:function(){this.content=new a({id:this.options.id}),this.loadDataDeferred=this.sandbox.data.deferred(),this.content.fullFetch(this.options.webspace,this.options.language,!0,{success:function(a){this.render(a.toJSON()),this.loadDataDeferred.resolve()}.bind(this)})},bindCustomEvents:function(){this.sandbox.on("sulu.header.back",function(){this.sandbox.emit("sulu.content.contents.list")}.bind(this)),this.sandbox.on("sulu.content.contents.list",function(a,b){this.sandbox.emit("sulu.app.ui.reset",{navigation:"auto",content:"auto"}),this.sandbox.emit("sulu.router.navigate","content/contents/"+(a?a:this.options.webspace)+"/"+(b?b:this.options.language))},this),this.sandbox.on("sulu.content.contents.get-data",function(a){this.loadDataDeferred.then(function(){a(this.data)}.bind(this))}.bind(this)),this.sandbox.on("sulu.content.contents.set-header-bar",function(a){this.setHeaderBar(a)}.bind(this)),this.sandbox.on("sulu.content.contents.set-state",function(a){this.setState(a)}.bind(this)),this.sandbox.on("sulu.header.toolbar.language-changed",function(a){this.sandbox.sulu.saveUserSetting(b,a.localization),this.sandbox.emit("sulu.content.contents.load",this.data.id,this.options.webspace,a.localization)},this),this.sandbox.on("sulu.dropdown.template.item-clicked",function(){this.setHeaderBar(!1)}.bind(this)),this.sandbox.on("sulu.header.toolbar.delete",function(){this.sandbox.emit("sulu.content.content.delete",this.data.id)},this),this.sandbox.on("sulu.content.contents.saved",function(a,b){this.highlightSaveButton=!0,this.data=b,this.setHeaderBar(!0),this.setTitle(this.data),this.sandbox.emit("sulu.labels.success.show","labels.success.content-save-desc","labels.success")},this),this.sandbox.on("sulu.content.contents.save-error",function(){this.sandbox.emit("sulu.labels.error.show","labels.error.content-save-desc","labels.error"),this.setHeaderBar(!1)},this),this.sandbox.on("sulu.preview.delete",function(){this.sandbox.emit("sulu.content.content.delete",this.data.id)},this),this.sandbox.on("sulu.content.contents.default-template",function(a){this.template=a,this.sandbox.emit("sulu.header.toolbar.item.change","template",a),this.hiddenTemplate&&(this.hiddenTemplate=!1,this.sandbox.emit("sulu.header.toolbar.item.show","template",a))},this),this.sandbox.on("husky.navigation.item.select",function(a){a.id!==this.options.id&&this.sandbox.emit("sulu.app.ui.reset",{navigation:"auto",content:"auto"})}.bind(this)),this.sandbox.on("sulu.dropdown.state.item-clicked",function(a){this.state!==a&&(this.state=a,this.setHeaderBar(!1))}.bind(this)),this.bindModelEvents()},bindModelEvents:function(){this.sandbox.on("sulu.content.content.delete",function(a){this.del(a)},this),this.sandbox.on("sulu.content.contents.save",function(a){this.save(a)},this),this.sandbox.on("sulu.content.contents.load",function(a,b,c){this.load(a,b,c)},this),this.sandbox.on("sulu.content.contents.new",function(a){this.add(a)},this),this.sandbox.on("sulu.content.contents.delete",function(a){this.delContents(a)},this),this.sandbox.once("sulu.content.contents.get-rl",function(a,b){this.getResourceLocator(a,this.template,b)},this),this.sandbox.on("sulu.content.contents.list",function(a,b){this.sandbox.emit("sulu.app.ui.reset",{navigation:"auto",content:"auto"}),this.sandbox.emit("sulu.router.navigate","content/contents/"+(a?a:this.options.webspace)+"/"+(b?b:this.options.language))},this)},getResourceLocator:function(a,b,c){var d="/admin/api/nodes/resourcelocators/generates?"+(this.options.parent?"parent="+this.options.parent+"&":"")+(this.options.id?"uuid="+this.options.id+"&":"")+"&webspace="+this.options.webspace+"&language="+this.options.language+"&template="+b;this.sandbox.util.save(d,"POST",{parts:a}).then(function(a){c(a.resourceLocator)})},del:function(b){this.showConfirmSingleDeleteDialog(function(c){if(c)if(this.sandbox.emit("sulu.header.toolbar.item.loading","options-button"),b!==this.content.get("id")){var d=new a({id:b});d.fullDestroy(this.options.webspace,this.options.language,{processData:!0,success:function(){this.sandbox.emit("sulu.router.navigate","content/contents/"+this.options.webspace+"/"+this.options.language),this.sandbox.emit("sulu.preview.deleted",b)}.bind(this)})}else this.content.fullDestroy(this.options.webspace,this.options.language,{processData:!0,success:function(){this.sandbox.emit("sulu.app.ui.reset",{navigation:"auto",content:"auto"}),this.sandbox.sulu.unlockDeleteSuccessLabel(),this.sandbox.emit("sulu.router.navigate","content/contents/"+this.options.webspace+"/"+this.options.language),this.sandbox.emit("sulu.preview.deleted",b)}.bind(this)})}.bind(this),this.options.id)},delContents:function(b){this.confirmDeleteDialog(function(c){c&&b.forEach(function(b){var c=new a({id:b});c.fullDestroy(this.options.webspace,this.options.language,{success:function(){this.sandbox.emit("husky.datagrid.record.remove",b)}.bind(this),error:function(){}})}.bind(this))}.bind(this))},showConfirmSingleDeleteDialog:function(a){if(a&&"function"!=typeof a)throw"callback is not a function";this.sandbox.emit("sulu.overlay.show-warning","sulu.overlay.be-careful","sulu.overlay.delete-desc",function(){a(!1)}.bind(this),function(){a(!0)}.bind(this))},changeState:function(a){this.sandbox.emit("sulu.content.contents.state.change"),this.content.stateSave(this.options.webspace,this.options.language,a,null,{success:function(){this.sandbox.emit("sulu.content.contents.state.changed",a),this.sandbox.emit("sulu.labels.success.show","labels.state-changed.success-desc","labels.success","sulu.content.contents.state.label")}.bind(this),error:function(){this.sandbox.emit("sulu.content.contents.state.changeFailed"),this.sandbox.emit("sulu.labels.error.show","labels.state-changed.error-desc","labels.error","sulu.content.contents.state.label"),this.sandbox.logger.log("error while saving profile")}.bind(this)})},save:function(b){this.sandbox.emit("sulu.header.toolbar.item.loading","save-button"),this.content=new a(b),this.options.id&&this.content.set({id:this.options.id}),this.content.fullSave(this.template,this.options.webspace,this.options.language,this.options.parent,this.state,null,{success:function(a){var b=a.toJSON();this.options.id?this.sandbox.emit("sulu.content.contents.saved",b.id,b):(this.sandbox.sulu.viewStates.justSaved=!0,this.sandbox.emit("sulu.router.navigate","content/contents/"+this.options.webspace+"/"+this.options.language+"/edit:"+b.id+"/content"))}.bind(this),error:function(){this.sandbox.logger.log("error while saving profile"),this.sandbox.emit("sulu.content.contents.save-error")}.bind(this)})},load:function(a,b,c){this.sandbox.emit("sulu.router.navigate","content/contents/"+(b?b:this.options.webspace)+"/"+(c?c:this.options.language)+"/edit:"+a+"/content")},add:function(a){a?this.sandbox.emit("sulu.router.navigate","content/contents/"+this.options.webspace+"/"+this.options.language+"/add:"+a.id+"/content"):this.sandbox.emit("sulu.router.navigate","content/contents/"+this.options.webspace+"/"+this.options.language+"/add/content")},render:function(a){this.data=a,this.headerInitialized.then(function(){this.setTitle(a),this.setBreadcrumb(a),this.setTemplate(a),this.setState(a),this.options.preview&&this.renderPreview(a),this.setHeaderBar(!0)}.bind(this))},renderPreview:function(a){var b=this.sandbox.dom.createElement('<div class="sulu-content-preview"/>');this.sandbox.dom.html(b,'<iframe src="/admin/content/preview/'+a.id+"?webspace="+this.options.webspace+"&language=en&template="+a.template+'"></iframe>'),this.sandbox.emit("sulu.sidebar.set-widget",null,b)},setTemplate:function(a){this.template=a.template,""!==this.template&&(this.sandbox.emit("sulu.header.toolbar.item.change","template",this.template),this.sandbox.emit("sulu.header.toolbar.item.show","template"))},setState:function(a){this.state=a.nodeState,this.sandbox.emit("sulu.header.toolbar.item.change","state",a.nodeState)},setTitle:function(a){this.options.id&&""!==a["sulu.node.name"]?this.sandbox.emit("sulu.header.set-title",a["sulu.node.name"]):this.sandbox.emit("sulu.header.set-title",this.sandbox.translate("content.contents.title"))},setBreadcrumb:function(a){if(a.breadcrumb){var b,c,d=[{title:this.options.webspace.replace(/_/g,"."),event:"sulu.content.contents.list"}];for(c=0,b=a.breadcrumb.length;++c<b;)d.push({title:a.breadcrumb[c].title,link:this.getBreadcrumbRoute(a.breadcrumb[c].uuid)});this.sandbox.emit("sulu.header.set-breadcrumb",d)}},getBreadcrumbRoute:function(a){return this.sandbox.mvc.history.fragment.replace(this.options.id,a)},setHeaderBar:function(a){if(a!==this.saved){var b=this.data&&this.data.id?"edit":"add";this.sandbox.emit("sulu.header.toolbar.state.change",b,a,this.highlightSaveButton),this.sandbox.emit("sulu.preview.state.change",a)}this.saved=a,this.saved&&(this.contentChanged=!1)},header:function(){this.sandbox.once("sulu.header.initialized",function(){this.headerInitialized.resolve()}.bind(this));var a="index"===this.options.id;return"column"===this.options.display?(this.fullSize={width:!0,height:!0},{title:this.options.webspace.replace(/_/g,"."),noBack:!0,breadcrumb:[{title:this.options.webspace.replace(/_/g,".")}],toolbar:{template:[],languageChanger:{url:"/admin/content/languages/"+this.options.webspace,preSelected:this.options.language}}}):{noBack:a,tabs:{url:"/admin/content/navigation/content"},toolbar:{parentTemplate:"default",languageChanger:{url:"/admin/content/languages/"+this.options.webspace,preSelected:this.options.language},template:[{id:"state",group:"left",position:100,type:"select",items:[{id:1,title:this.sandbox.translate("toolbar.state-test"),icon:"husky-test",callback:function(){this.sandbox.emit("sulu.dropdown.state.item-clicked",1)}.bind(this)},{id:2,title:this.sandbox.translate("toolbar.state-publish"),icon:"husky-publish",callback:function(){this.sandbox.emit("sulu.dropdown.state.item-clicked",2)}.bind(this)}]},{id:"template",icon:"pencil",iconSize:"large",group:"left",position:10,type:"select",title:"",hidden:!1,itemsOption:{url:"/admin/content/template",titleAttribute:"template",idAttribute:"template",translate:!0,languageNamespace:"template.",callback:function(a){this.template=a.template,this.sandbox.emit("sulu.dropdown.template.item-clicked",a)}.bind(this)}}]}}}}});