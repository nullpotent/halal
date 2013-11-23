(function(){define(["Vec2"],function(e){var t,n;return n=12,t=function(){function e(e){this.bounds=e,this.pts=[],this.nw=null,this.sw=null,this.ne=null,this.se=null}return e.prototype.insert=function(e){return Hal.math.isPointInRect(e.worldPos(),this.bounds)?this.pts.length<n?(e.quadspace=this,this.pts.push(e),!0):(this.nw==null&&this.divide(),this.nw.insert(e)?!0:this.ne.insert(e)?!0:this.sw.insert(e)?!0:this.se.insert(e)?!0:!1):!1},e.prototype.remove=function(e){var t;return t=this.pts.indexOf(e),this.pts.splice(t,1)},e.prototype.searchInRange=function(e,t,n){var r,i,s,o,u,a,f;i=[],s=[e[0]-t,e[1]-t,2*t,2*t];if(!Hal.math.rectIntersectsRect(s,this.bounds))return i;f=this.pts;for(u=0,a=f.length;u<a;u++)o=f[u],r=o.worldToLocal(n.localToWorld(e)),Hal.math.rectIntersectsRect(o.bbox,[r[0]-t,r[1]-t,2*t,2*t])&&i.push(o);return this.nw==null?i:(i=i.concat(this.nw.searchInRange(e,t,n)),i=i.concat(this.ne.searchInRange(e,t,n)),i=i.concat(this.sw.searchInRange(e,t,n)),i=i.concat(this.se.searchInRange(e,t,n)),i)},e.prototype.divide=function(){var t,n;return n=this.bounds[2]*.5,t=this.bounds[3]*.5,this.nw=new e([this.bounds[0],this.bounds[1],n,t]),this.ne=new e([this.bounds[0]+n,this.bounds[1],n,t]),this.sw=new e([this.bounds[0],this.bounds[1]+t,n,t]),this.se=new e([this.bounds[0]+n,this.bounds[1]+t,n,t])},e}(),t})}).call(this);