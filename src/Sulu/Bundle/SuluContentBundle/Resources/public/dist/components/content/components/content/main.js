define(function(){"use strict";return{content:function(){return{url:"/admin/content/navigation/content",title:"content.contents.title",parentTemplate:"default",template:function(){var a={icon:"eye-open",iconSize:"large",group:"left",position:20,items:[{title:this.sandbox.translate("sulu.edit-toolbar.new-window"),callback:function(){this.sandbox.emit("sulu.edit-toolbar.preview.new-window")}.bind(this)},{title:this.sandbox.translate("sulu.edit-toolbar.split-screen"),callback:function(){this.sandbox.emit("sulu.edit-toolbar.preview.split-screen")}.bind(this)}]},b={id:"state",group:"right","class":"highlight-gray",position:2,type:"select"},c={id:"template",icon:"tag",iconSize:"large",group:"right",position:1,type:"select",title:"",hidden:!0,itemsOption:{url:"/admin/content/template",titleAttribute:"template",idAttribute:"template",translate:!0,languageNamespace:"template.",callback:function(a){this.sandbox.emit("sulu.edit-toolbar.dropdown.template.item-clicked",a)}.bind(this)}};return this.options.id?[c,a,b]:[c,b]}.bind(this)}}}});