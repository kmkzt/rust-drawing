(window.webpackJsonp=window.webpackJsonp||[]).push([[2],{1:function(t,r,n){"use strict";(function(t){n.d(r,"a",(function(){return f})),n.d(r,"b",(function(){return l})),n.d(r,"c",(function(){return w})),n.d(r,"d",(function(){return h})),n.d(r,"e",(function(){return d}));var e=n(2);let i=new(void 0===t?n(6).TextDecoder:t)("utf-8",{ignoreBOM:!0,fatal:!0});i.decode();let c=null;function s(t,r){return i.decode((null!==c&&c.buffer===e.f.buffer||(c=new Uint8Array(e.f.buffer)),c).subarray(t,t+r))}function u(t,r){if(!(t instanceof r))throw new Error("expected instance of "+r.name);return t.ptr}function o(t){return null==t}let a=null;function p(){return null!==a&&a.buffer===e.f.buffer||(a=new Int32Array(e.f.buffer)),a}class f{static __wrap(t){const r=Object.create(f.prototype);return r.ptr=t,r}free(){const t=this.ptr;this.ptr=0,e.a(t)}static new(t,r){var n=e.h(t,r);return f.__wrap(n)}vector(t){u(t,f);var r=e.j(this.ptr,t.ptr);return h.__wrap(r)}scale(t){var r=e.i(this.ptr,t);return f.__wrap(r)}control(t){u(t,h);var r=e.g(this.ptr,t.ptr);return f.__wrap(r)}}class l{static __wrap(t){const r=Object.create(l.prototype);return r.ptr=t,r}free(){const t=this.ptr;this.ptr=0,e.b(t)}static new(t,r){var n=e.m(t,r);return l.__wrap(n)}clear(){e.l(this.ptr)}add(t){u(t,w);var r=t.ptr;t.ptr=0,e.k(this.ptr,r)}update(t){u(t,w);var r=t.ptr;t.ptr=0,e.o(this.ptr,r)}to_string(){try{e.n(8,this.ptr);var t=p()[2],r=p()[3];return s(t,r)}finally{e.e(t,r)}}}class w{static __wrap(t){const r=Object.create(w.prototype);return r.ptr=t,r}free(){const t=this.ptr;this.ptr=0,e.c(t)}static new(t,r){var n=e.u(o(t)?16777215:t?1:0,o(r)?16777215:r?1:0);return w.__wrap(n)}isCircul(){return 0!==e.s(this.ptr)}toggleCircul(){e.w(this.ptr)}isClose(){return 0!==e.t(this.ptr)}toggleClose(){e.x(this.ptr)}clear(){e.q(this.ptr)}add(t){u(t,f);var r=t.ptr;t.ptr=0,e.p(this.ptr,r)}copy(){var t=e.r(this.ptr);return w.__wrap(t)}to_string(){try{e.v(8,this.ptr);var t=p()[2],r=p()[3];return s(t,r)}finally{e.e(t,r)}}}class h{static __wrap(t){const r=Object.create(h.prototype);return r.ptr=t,r}free(){const t=this.ptr;this.ptr=0,e.d(t)}}const d=function(t,r){throw new Error(s(t,r))}}).call(this,n(3).TextDecoder)},10:function(t,r,n){"use strict";n.r(r);var e=n(1);n.d(r,"Point",(function(){return e.a})),n.d(r,"SvgDrawing",(function(){return e.b})),n.d(r,"SvgPath",(function(){return e.c})),n.d(r,"Vector",(function(){return e.d})),n.d(r,"__wbindgen_throw",(function(){return e.e}))},2:function(t,r,n){"use strict";var e=n.w[t.i];t.exports=e;n(1);e.y()}}]);