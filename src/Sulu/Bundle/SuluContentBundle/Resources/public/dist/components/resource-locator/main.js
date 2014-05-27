define([],function(){"use strict";var a={instanceName:null,url:null,historyApi:null,deleteApi:null,restoreApi:null},b=function(a){return['<div class="resource-locator">','   <span id="'+a.ids.url+'" class="grey-font">',a.url?a.url:"","</span>",'   <span id="'+a.ids.tree+'" class="grey-font"></span>','   <input type="text" id="'+a.ids.input+'" class="form-element"/>','   <span class="show pointer small-font" id="',a.ids.toggle,'">','       <span class="fa-history icon"></span>',"       <span>",a.showHistoryText,"</span>","   </span>",'   <div class="loader" id="',a.ids.loader,'"></div>',"</div>"].join("")},c=function(a){return"#"+this.options.ids[a]},d=function(){this.options.ids={url:"resource-locator-"+this.options.instanceName+"-url",input:"resource-locator-"+this.options.instanceName+"-input",tree:"resource-locator-"+this.options.instanceName+"-tree",toggle:"resource-locator-"+this.options.instanceName+"-toggle",loader:"resource-locator-"+this.options.instanceName+"-loader"},this.options.showHistoryText=this.sandbox.translate("public.show-history"),this.sandbox.dom.html(this.$el,b(this.options)),l.call(this),i.call(this)},e=function(a){a=a.parents(".overlay-content"),this.sandbox.dom.append(a,this.sandbox.dom.createElement('<div class="loader"/>')),this.sandbox.dom.css(a.find(".resource-locator-history"),"display","none"),this.sandbox.start([{name:"loader@husky",options:{el:this.sandbox.dom.find(".loader",a),size:"16px",color:"#666666"}}])},f=function(a){a=a.parents(".overlay-content"),this.sandbox.dom.css(a.find(".resource-locator-history"),"display","block"),this.sandbox.stop(this.sandbox.dom.find(".loader",a))},g=function(){var a=this.sandbox.dom.createElement("<div/>");this.sandbox.dom.html(c.call(this,"loader"),a),this.sandbox.start([{name:"loader@husky",options:{el:a,size:"16px",color:"#666666"}}])},h=function(){this.sandbox.stop(c.call(this,"loader")+" > div")},i=function(){this.sandbox.dom.on(this.$el,"data-changed",function(a,b){l.call(this,b)}.bind(this)),this.sandbox.dom.on(c.call(this,"toggle"),"click",p.bind(this)),this.sandbox.dom.on(c.call(this,"input"),"change",m.bind(this)),this.sandbox.dom.on(c.call(this,"input"),"change",function(){this.sandbox.emit("sulu.content.changed")}.bind(this)),this.sandbox.dom.on(c.call(this,"input"),"focusout",function(){this.$el.trigger("focusout")}.bind(this)),this.sandbox.dom.on(this.$el,"click",j.bind(this),".options-delete"),this.sandbox.dom.on(this.$el,"click",k.bind(this),".options-restore")},j=function(a){var b=this.sandbox.dom.$(a.currentTarget),c=this.sandbox.dom.parent(b),d=this.sandbox.dom.data(c,"id");e.call(this,c),this.sandbox.util.save(this.items[d]._links.delete,"DELETE",{}).then(function(){f.call(this,c),this.sandbox.dom.remove(c)}.bind(this)).fail(function(){f.call(this,c)})},k=function(a){var b=this.sandbox.dom.$(a.currentTarget),c=this.sandbox.dom.parent(b),d=this.sandbox.dom.data(c,"id");e.call(this,c),this.sandbox.util.save(this.items[d]._links.restore,"PUT",{}).then(function(a){l.call(this,a.resourceLocator),this.sandbox.emit("husky.overlay.url-history.close"),f.call(this,c)}.bind(this)).fail(function(){f.call(this,c)})},l=function(a){a||(a=this.sandbox.dom.data(this.$el,"value"),a||(a=""));var b=a.split("/");this.sandbox.dom.val(c.call(this,"input"),b.pop()),this.sandbox.dom.html(c.call(this,"tree"),b.join("/")+"/")},m=function(){var a=this.sandbox.dom.val(c.call(this,"input")),b=this.sandbox.dom.html(c.call(this,"tree"));this.sandbox.dom.data(this.$el,"value",b+a)},n=function(a){if(this.items=[],a.length>0){var b=['<ul class="resource-locator-history">'];return this.sandbox.util.foreach(a,function(a){this.items[a.id]=a,b.push('<li data-id="'+a.id+'" data-path="'+a.resourceLocator+'">   <span class="options-restore"><i class="fa fa-refresh pointer"></i></span>   <span class="url">'+this.sandbox.util.cropMiddle(a.resourceLocator,35)+'</span>   <span class="date">'+this.sandbox.date.format(a.created)+'</span>   <span class="options-delete"><i class="fa fa-trash-o pointer"></i></span></li>')}.bind(this)),b.push("</ul>"),b.join("")}return"<p>"+this.sandbox.translate("public.url-history.none")+"</p>"},o=function(a){var b=this.sandbox.dom.createElement("<div/>");this.sandbox.dom.append(this.$el,b),this.sandbox.start([{name:"overlay@husky",options:{el:b,container:b,title:this.sandbox.translate("public.url-history"),openOnStart:!0,removeOnClose:!0,instanceName:"url-history",skin:"wide",data:a}}])},p=function(){g.call(this),this.sandbox.util.load(this.options.historyApi).then(function(a){h.call(this);var b=n.call(this,a._embedded);o.call(this,b)}.bind(this))};return{historyClosed:!0,initialize:function(){this.options=this.sandbox.util.extend({},a,this.options),d.call(this)}}});