(function(){var e={}.hasOwnProperty,t=function(t,n){function i(){this.constructor=t}for(var r in n)e.call(n,r)&&(t[r]=n[r]);return i.prototype=n.prototype,t.prototype=new i,t.__super__=n.prototype,t};define(["EventDispatcher","Deferred"],function(e,n){var r,i;return i=function(){function e(e){this.obj=e,this.num_tweens=0,this.to_wait=0,this.tween_chain=[],this.animating=!1}return e.prototype.tween=function(e){var t,n=this;return this.num_tweens++,this.to_wait>0?(this.tween_chain.push(e),this):(this.animating=!0,t=Hal.tween(this.obj,e.attr,e.duration,e.from,e.to,e.repeat),t.then(function(){n.num_tweens--,n.num_tweens===0&&n.done_clb!=null&&n.done_clb.call(n.obj),n.to_wait>0&&(n.to_wait--,n.tween(n.tween_chain.pop()),n.num_tweens--);if(n.num_tweens===0&&n.to_wait===0)return n.animating=!1}),this)},e.prototype.wait=function(e){return this.wait_clb=e,this.to_wait++,this},e.prototype.done=function(e){this.done_clb=e},e}(),r=function(e){function n(){n.__super__.constructor.call(this),this.animating=!1}return t(n,e),n.prototype.attr=function(e,t){return arguments.length===1?typeof e=="string"?this[e]:(this.extend(e),this.trigger("CHANGE",e)):(this[e]=t,this.trigger("CHANGE",[e,t]))},n.prototype.extend=function(e){var t,n;if(e==null)return this;for(t in e){n=e[t];if(this===n)continue;this[t]=n}return this},n.prototype.tween=function(e){return(new i(this)).tween(e)},n}(e)})}).call(this);