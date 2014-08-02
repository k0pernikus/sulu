define(function(){"use strict";var a="column-navigation-show-ghost-pages",b=3,c=4,d=1,e=5,f={toggler:['<div id="show-ghost-pages"></div>','<label class="inline spacing-left" for="show-ghost-pages"><%= label %></label>'].join(""),columnNavigation:function(){return['<div id="child-column-navigation"/>','<div id="wait-container" style="margin-top: 50px; margin-bottom: 200px; display: none;"></div>'].join("")}};return{view:!0,layout:{changeNothing:!0},initialize:function(){this.render(),this.sandbox.sulu.triggerDeleteSuccessLabel(),this.showGhostPages=!0,this.setShowGhostPages()},setShowGhostPages:function(){var b=this.sandbox.sulu.getUserSetting(a);null!==b&&(this.showGhostPages=JSON.parse(b))},bindCustomEvents:function(){this.sandbox.on("husky.column-navigation.node.add",function(a){this.sandbox.emit("sulu.content.contents.new",a)},this),this.sandbox.on("husky.column-navigation.node.edit",function(a){this.sandbox.emit("sulu.content.contents.load",a.id)},this),this.sandbox.on("husky.column-navigation.node.selected",function(a){this.setLastSelected(a.id)},this),this.sandbox.on("sulu.content.localizations",function(a){this.localizations=a},this),this.sandbox.on("husky.toggler.show-ghost-pages.changed",function(b){this.showGhostPages=b,this.sandbox.sulu.saveUserSetting(a,this.showGhostPages),this.startColumnNavigation()},this),this.sandbox.on("husky.column-navigation.node.settings",function(a,f){a.id===b?this.moveSelected(f):a.id===c?this.copySelected(f):a.id===d?this.deleteSelected(f):a.id===e&&this.orderSelected(f)}.bind(this)),this.sandbox.on("husky.column-navigation.overlay.initialized",function(){this.sandbox.emit("husky.overlay.node.set-position")}.bind(this))},moveSelected:function(a){var b=function(b){this.showOverlayLoader(),this.sandbox.emit("sulu.content.contents.move",a.id,b.id,function(){this.restartColumnNavigation(),this.sandbox.emit("husky.overlay.node.close")}.bind(this),function(a){this.sandbox.logger.error(a),this.hideOverlayLoader()}.bind(this))}.bind(this);this.moveOrCopySelected(a,b,"move")},copySelected:function(a){var b=function(b){this.showOverlayLoader(),this.sandbox.emit("sulu.content.contents.copy",a.id,b.id,function(a){this.setLastSelected(a.id),this.restartColumnNavigation(),this.sandbox.emit("husky.overlay.node.close")}.bind(this),function(a){this.sandbox.logger.error(a),this.hideOverlayLoader()}.bind(this))}.bind(this);this.moveOrCopySelected(a,b,"copy")},moveOrCopySelected:function(a,b,c){this.sandbox.once("husky.overlay.node.initialized",function(){this.startOverlayColumnNavigation(a.id),this.startOverlayLoader()}.bind(this)),this.sandbox.once("husky.column-navigation.overlay.edit",b),this.sandbox.once("husky.overlay.node.closed",function(){this.sandbox.off("husky.column-navigation.overlay.edit",b)}.bind(this)),this.startOverlay("content.contents.settings."+c+".title",f.columnNavigation())},deleteSelected:function(a){this.sandbox.once("sulu.preview.deleted",function(){this.restartColumnNavigation()}.bind(this)),this.sandbox.emit("sulu.content.content.delete",a.id)},orderSelected:function(){(function(){}).bind(this);this.sandbox.once("husky.overlay.node.initialized",function(){}.bind(this)),this.startOverlay("content.contents.settings.order.title",f.columnNavigation())},startOverlay:function(a,b){var c=this.sandbox.dom.createElement('<div class="overlay-container"/>');this.sandbox.dom.append(this.$el,c),this.sandbox.start([{name:"overlay@husky",options:{openOnStart:!0,removeOnClose:!0,cssClass:"node",el:c,container:this.$el,instanceName:"node",skin:"wide",slides:[{title:this.sandbox.translate(a),data:b,buttons:[{type:"cancel"}]}]}}])},startOverlayColumnNavigation:function(a){var b="/admin/api/nodes{/id}?tree=true&webspace="+this.options.webspace+"&language="+this.options.language+"&webspace-node=true";this.sandbox.start([{name:"column-navigation@husky",options:{el:"#child-column-navigation",selected:a,url:b.replace("{/id}",a?"/"+a:""),instanceName:"overlay",editIcon:"fa-check-circle",resultKey:this.options.resultKey,showEdit:!1,showStatus:!1,responsive:!1,skin:"fixed-height-small"}}])},startOverlayLoader:function(){this.sandbox.start([{name:"loader@husky",options:{el:"#wait-container",size:"100px",color:"#e4e4e4"}}])},showOverlayLoader:function(){this.sandbox.dom.css("#child-column-navigation","display","none"),this.sandbox.dom.css("#wait-container","display","block")},hideOverlayLoader:function(){this.sandbox.dom.css("#child-column-navigation","display","block"),this.sandbox.dom.css("#wait-container","display","none")},restartColumnNavigation:function(){this.sandbox.stop("#content-column"),this.startColumnNavigation()},startColumnNavigation:function(){this.sandbox.stop(this.$find("#content-column")),this.sandbox.dom.append(this.$el,'<div id="content-column"></div>'),this.sandbox.start([{name:"column-navigation@husky",options:{el:this.$find("#content-column"),instanceName:"node",selected:this.getLastSelected(),resultKey:"nodes",url:this.getUrl(),data:[{id:d,name:this.sandbox.translate("content.contents.settings.delete")},{id:2,divider:!0},{id:b,name:this.sandbox.translate("content.contents.settings.move")},{id:c,name:this.sandbox.translate("content.contents.settings.copy")},{id:e,name:this.sandbox.translate("content.contents.settings.order")}]}}])},getLocalizationForId:function(a){a=parseInt(a,10);for(var b=-1,c=this.localizations.length;++b<c;)if(this.localizations[b].id===a)return this.localizations[b].localization;return null},getLastSelected:function(){return this.sandbox.sulu.getUserSetting(this.options.webspace+"ColumnNavigationSelected")},setLastSelected:function(a){this.sandbox.sulu.saveUserSetting(this.options.webspace+"ColumnNavigationSelected",a)},getUrl:function(){return null!==this.getLastSelected()?"/admin/api/nodes/"+this.getLastSelected()+"?tree=true&webspace="+this.options.webspace+"&language="+this.options.language+"&exclude-ghosts="+(this.showGhostPages?"false":"true"):"/admin/api/nodes?depth=1&webspace="+this.options.webspace+"&language="+this.options.language+"&exclude-ghosts="+(this.showGhostPages?"false":"true")},render:function(){this.bindCustomEvents(),require(["text!/admin/content/template/content/column/"+this.options.webspace+"/"+this.options.language+".html"],function(a){var b={translate:this.sandbox.translate},c=this.sandbox.util.extend({},b),d=this.sandbox.util.template(a,c);this.sandbox.dom.html(this.$el,d),this.addToggler(),this.startColumnNavigation()}.bind(this))},addToggler:function(){this.sandbox.emit("sulu.header.set-bottom-content",this.sandbox.util.template(f.toggler)({label:this.sandbox.translate("content.contents.show-ghost-pages")})),this.sandbox.start([{name:"toggler@husky",options:{el:"#show-ghost-pages",checked:this.showGhostPages,outline:!0}}])}}});