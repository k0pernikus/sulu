define(["mvc/relationalmodel","sulucontact/model/account","mvc/hasone","sulucontact/model/contact","sulucontact/model/activityPriority","sulucontact/model/activityType","sulucontact/model/activityStatus"],function(a,b,c,d,e,f,g){"use strict";return a({urlRoot:"/admin/api/activities",defaults:function(){return{id:null,subject:"",note:"",dueDate:"",startDate:"",activityStatus:null,activityType:null,activityPriority:null,account:null,contact:null,assignedContact:null}},relations:[{type:c,key:"account",relatedModel:b},{type:c,key:"contact",relatedModel:d},{type:c,key:"assignedContact",relatedModel:d},{type:c,key:"activityType",relatedModel:g},{type:c,key:"activityPriority",relatedModel:e},{type:c,key:"activityStatus",relatedModel:f}]})});