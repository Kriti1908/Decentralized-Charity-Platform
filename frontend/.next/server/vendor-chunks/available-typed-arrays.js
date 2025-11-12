"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "vendor-chunks/available-typed-arrays";
exports.ids = ["vendor-chunks/available-typed-arrays"];
exports.modules = {

/***/ "(ssr)/./node_modules/available-typed-arrays/index.js":
/*!******************************************************!*\
  !*** ./node_modules/available-typed-arrays/index.js ***!
  \******************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

eval("\nvar possibleNames = __webpack_require__(/*! possible-typed-array-names */ \"(ssr)/./node_modules/possible-typed-array-names/index.js\");\nvar g = typeof globalThis === \"undefined\" ? global : globalThis;\n/** @type {import('.')} */ module.exports = function availableTypedArrays() {\n    var /** @type {ReturnType<typeof availableTypedArrays>} */ out = [];\n    for(var i = 0; i < possibleNames.length; i++){\n        if (typeof g[possibleNames[i]] === \"function\") {\n            // @ts-expect-error\n            out[out.length] = possibleNames[i];\n        }\n    }\n    return out;\n};\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHNzcikvLi9ub2RlX21vZHVsZXMvYXZhaWxhYmxlLXR5cGVkLWFycmF5cy9pbmRleC5qcyIsIm1hcHBpbmdzIjoiQUFBQTtBQUVBLElBQUlBLGdCQUFnQkMsbUJBQU9BLENBQUM7QUFFNUIsSUFBSUMsSUFBSSxPQUFPQyxlQUFlLGNBQWNDLFNBQVNEO0FBRXJELHdCQUF3QixHQUN4QkUsT0FBT0MsT0FBTyxHQUFHLFNBQVNDO0lBQ3pCLElBQUksb0RBQW9ELEdBQUdDLE1BQU0sRUFBRTtJQUNuRSxJQUFLLElBQUlDLElBQUksR0FBR0EsSUFBSVQsY0FBY1UsTUFBTSxFQUFFRCxJQUFLO1FBQzlDLElBQUksT0FBT1AsQ0FBQyxDQUFDRixhQUFhLENBQUNTLEVBQUUsQ0FBQyxLQUFLLFlBQVk7WUFDOUMsbUJBQW1CO1lBQ25CRCxHQUFHLENBQUNBLElBQUlFLE1BQU0sQ0FBQyxHQUFHVixhQUFhLENBQUNTLEVBQUU7UUFDbkM7SUFDRDtJQUNBLE9BQU9EO0FBQ1IiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9jaGFyaXR5LXBsYXRmb3JtLWZyb250ZW5kLy4vbm9kZV9tb2R1bGVzL2F2YWlsYWJsZS10eXBlZC1hcnJheXMvaW5kZXguanM/MTc1ZiJdLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cbnZhciBwb3NzaWJsZU5hbWVzID0gcmVxdWlyZSgncG9zc2libGUtdHlwZWQtYXJyYXktbmFtZXMnKTtcblxudmFyIGcgPSB0eXBlb2YgZ2xvYmFsVGhpcyA9PT0gJ3VuZGVmaW5lZCcgPyBnbG9iYWwgOiBnbG9iYWxUaGlzO1xuXG4vKiogQHR5cGUge2ltcG9ydCgnLicpfSAqL1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBhdmFpbGFibGVUeXBlZEFycmF5cygpIHtcblx0dmFyIC8qKiBAdHlwZSB7UmV0dXJuVHlwZTx0eXBlb2YgYXZhaWxhYmxlVHlwZWRBcnJheXM+fSAqLyBvdXQgPSBbXTtcblx0Zm9yICh2YXIgaSA9IDA7IGkgPCBwb3NzaWJsZU5hbWVzLmxlbmd0aDsgaSsrKSB7XG5cdFx0aWYgKHR5cGVvZiBnW3Bvc3NpYmxlTmFtZXNbaV1dID09PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHQvLyBAdHMtZXhwZWN0LWVycm9yXG5cdFx0XHRvdXRbb3V0Lmxlbmd0aF0gPSBwb3NzaWJsZU5hbWVzW2ldO1xuXHRcdH1cblx0fVxuXHRyZXR1cm4gb3V0O1xufTtcbiJdLCJuYW1lcyI6WyJwb3NzaWJsZU5hbWVzIiwicmVxdWlyZSIsImciLCJnbG9iYWxUaGlzIiwiZ2xvYmFsIiwibW9kdWxlIiwiZXhwb3J0cyIsImF2YWlsYWJsZVR5cGVkQXJyYXlzIiwib3V0IiwiaSIsImxlbmd0aCJdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(ssr)/./node_modules/available-typed-arrays/index.js\n");

/***/ })

};
;