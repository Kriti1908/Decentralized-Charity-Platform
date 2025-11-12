"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "vendor-chunks/typed-array-buffer";
exports.ids = ["vendor-chunks/typed-array-buffer"];
exports.modules = {

/***/ "(ssr)/./node_modules/typed-array-buffer/index.js":
/*!**************************************************!*\
  !*** ./node_modules/typed-array-buffer/index.js ***!
  \**************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

eval("\nvar $TypeError = __webpack_require__(/*! es-errors/type */ \"(ssr)/./node_modules/es-errors/type.js\");\nvar callBound = __webpack_require__(/*! call-bound */ \"(ssr)/./node_modules/call-bound/index.js\");\n/** @type {undefined | ((thisArg: import('.').TypedArray) => Buffer<ArrayBufferLike>)} */ var $typedArrayBuffer = callBound(\"TypedArray.prototype.buffer\", true);\nvar isTypedArray = __webpack_require__(/*! is-typed-array */ \"(ssr)/./node_modules/is-typed-array/index.js\");\n/** @type {import('.')} */ // node <= 0.10, < 0.11.4 has a nonconfigurable own property instead of a prototype getter\nmodule.exports = $typedArrayBuffer || function typedArrayBuffer(x) {\n    if (!isTypedArray(x)) {\n        throw new $TypeError(\"Not a Typed Array\");\n    }\n    return x.buffer;\n};\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHNzcikvLi9ub2RlX21vZHVsZXMvdHlwZWQtYXJyYXktYnVmZmVyL2luZGV4LmpzIiwibWFwcGluZ3MiOiJBQUFBO0FBRUEsSUFBSUEsYUFBYUMsbUJBQU9BLENBQUM7QUFFekIsSUFBSUMsWUFBWUQsbUJBQU9BLENBQUM7QUFFeEIsdUZBQXVGLEdBQ3ZGLElBQUlFLG9CQUFvQkQsVUFBVSwrQkFBK0I7QUFFakUsSUFBSUUsZUFBZUgsbUJBQU9BLENBQUM7QUFFM0Isd0JBQXdCLEdBQ3hCLDBGQUEwRjtBQUMxRkksT0FBT0MsT0FBTyxHQUFHSCxxQkFBcUIsU0FBU0ksaUJBQWlCQyxDQUFDO0lBQ2hFLElBQUksQ0FBQ0osYUFBYUksSUFBSTtRQUNyQixNQUFNLElBQUlSLFdBQVc7SUFDdEI7SUFDQSxPQUFPUSxFQUFFQyxNQUFNO0FBQ2hCIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vY2hhcml0eS1wbGF0Zm9ybS1mcm9udGVuZC8uL25vZGVfbW9kdWxlcy90eXBlZC1hcnJheS1idWZmZXIvaW5kZXguanM/OWU5YSJdLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cbnZhciAkVHlwZUVycm9yID0gcmVxdWlyZSgnZXMtZXJyb3JzL3R5cGUnKTtcblxudmFyIGNhbGxCb3VuZCA9IHJlcXVpcmUoJ2NhbGwtYm91bmQnKTtcblxuLyoqIEB0eXBlIHt1bmRlZmluZWQgfCAoKHRoaXNBcmc6IGltcG9ydCgnLicpLlR5cGVkQXJyYXkpID0+IEJ1ZmZlcjxBcnJheUJ1ZmZlckxpa2U+KX0gKi9cbnZhciAkdHlwZWRBcnJheUJ1ZmZlciA9IGNhbGxCb3VuZCgnVHlwZWRBcnJheS5wcm90b3R5cGUuYnVmZmVyJywgdHJ1ZSk7XG5cbnZhciBpc1R5cGVkQXJyYXkgPSByZXF1aXJlKCdpcy10eXBlZC1hcnJheScpO1xuXG4vKiogQHR5cGUge2ltcG9ydCgnLicpfSAqL1xuLy8gbm9kZSA8PSAwLjEwLCA8IDAuMTEuNCBoYXMgYSBub25jb25maWd1cmFibGUgb3duIHByb3BlcnR5IGluc3RlYWQgb2YgYSBwcm90b3R5cGUgZ2V0dGVyXG5tb2R1bGUuZXhwb3J0cyA9ICR0eXBlZEFycmF5QnVmZmVyIHx8IGZ1bmN0aW9uIHR5cGVkQXJyYXlCdWZmZXIoeCkge1xuXHRpZiAoIWlzVHlwZWRBcnJheSh4KSkge1xuXHRcdHRocm93IG5ldyAkVHlwZUVycm9yKCdOb3QgYSBUeXBlZCBBcnJheScpO1xuXHR9XG5cdHJldHVybiB4LmJ1ZmZlcjtcbn07XG4iXSwibmFtZXMiOlsiJFR5cGVFcnJvciIsInJlcXVpcmUiLCJjYWxsQm91bmQiLCIkdHlwZWRBcnJheUJ1ZmZlciIsImlzVHlwZWRBcnJheSIsIm1vZHVsZSIsImV4cG9ydHMiLCJ0eXBlZEFycmF5QnVmZmVyIiwieCIsImJ1ZmZlciJdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(ssr)/./node_modules/typed-array-buffer/index.js\n");

/***/ })

};
;