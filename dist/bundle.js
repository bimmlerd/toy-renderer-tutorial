/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	/// <reference path="./SoftEngine.ts" />
	var SoftEngine_ts_1 = __webpack_require__(1);
	var canvas;
	var device;
	var mesh;
	var meshes = [];
	var mera;
	document.addEventListener("DOMContentLoaded", init, false);
	function init() {
	    canvas = document.getElementById("frontbuffer");
	    mesh = new SoftEngine_ts_1.SoftEngine.Mesh("Cube", 8, 12);
	    meshes.push(mesh);
	    mera = new SoftEngine_ts_1.SoftEngine.Camera();
	    device = new SoftEngine_ts_1.SoftEngine.Device(canvas);
	    mesh.Vertices[0] = new BABYLON.Vector3(-1, 1, 1);
	    mesh.Vertices[1] = new BABYLON.Vector3(1, 1, 1);
	    mesh.Vertices[2] = new BABYLON.Vector3(-1, -1, 1);
	    mesh.Vertices[3] = new BABYLON.Vector3(1, -1, 1);
	    mesh.Vertices[4] = new BABYLON.Vector3(-1, 1, -1);
	    mesh.Vertices[5] = new BABYLON.Vector3(1, 1, -1);
	    mesh.Vertices[6] = new BABYLON.Vector3(1, -1, -1);
	    mesh.Vertices[7] = new BABYLON.Vector3(-1, -1, -1);
	    mesh.Faces[0] = { A: 0, B: 1, C: 2 };
	    mesh.Faces[1] = { A: 1, B: 2, C: 3 };
	    mesh.Faces[2] = { A: 1, B: 3, C: 6 };
	    mesh.Faces[3] = { A: 1, B: 5, C: 6 };
	    mesh.Faces[4] = { A: 0, B: 1, C: 4 };
	    mesh.Faces[5] = { A: 1, B: 4, C: 5 };
	    mesh.Faces[6] = { A: 2, B: 3, C: 7 };
	    mesh.Faces[7] = { A: 3, B: 6, C: 7 };
	    mesh.Faces[8] = { A: 0, B: 2, C: 7 };
	    mesh.Faces[9] = { A: 0, B: 4, C: 7 };
	    mesh.Faces[10] = { A: 4, B: 5, C: 6 };
	    mesh.Faces[11] = { A: 4, B: 6, C: 7 };
	    mera.Position = new BABYLON.Vector3(0, 0, 10);
	    mera.Target = new BABYLON.Vector3(0, 0, 0);
	    requestAnimationFrame(drawingLoop);
	}
	function drawingLoop() {
	    device.clear();
	    mesh.Rotation.x += 0.01;
	    mesh.Rotation.y += 0.01;
	    device.render(mera, meshes);
	    device.present();
	    requestAnimationFrame(drawingLoop);
	}


/***/ },
/* 1 */
/***/ function(module, exports) {

	/// <reference path="./decls/babylon.d.ts" />
	"use strict";
	var SoftEngine;
	(function (SoftEngine) {
	    var Device = (function () {
	        function Device(canvas) {
	            this.workingCanvas = canvas;
	            this.workingWidth = canvas.width;
	            this.workingHeight = canvas.height;
	            this.workingContext = this.workingCanvas.getContext("2d");
	        }
	        // this function is called to clear the backbuffer with a specific color
	        Device.prototype.clear = function () {
	            this.workingContext.clearRect(0, 0, this.workingWidth, this.workingHeight);
	            this.backbuffer = this.workingContext.getImageData(0, 0, this.workingWidth, this.workingHeight);
	        };
	        // once everything is ready, we flush the back buffer into the front buffer
	        Device.prototype.present = function () {
	            this.workingContext.putImageData(this.backbuffer, 0, 0);
	        };
	        Device.prototype.putPixel = function (x, y, color) {
	            this.backbufferdata = this.backbuffer.data;
	            var index = ((x >> 0) + (y >> 0) * this.workingWidth) * 4; // why the shifts?
	            // RGBA
	            this.backbufferdata[index + 0] = color.r * 255;
	            this.backbufferdata[index + 1] = color.g * 255;
	            this.backbufferdata[index + 2] = color.b * 255;
	            this.backbufferdata[index + 3] = color.a * 255;
	        };
	        Device.prototype.project = function (coord, transMat) {
	            // let babylon do the transformation
	            var point = BABYLON.Vector3.TransformCoordinates(coord, transMat);
	            // the transformed coordinates will be based on the coordinate system
	            // originating in the center of the screen. But drawing on screeen usually starts 
	            // from top left, and we thus need to transform them again.
	            var x = point.x * this.workingWidth + this.workingWidth / 2.0 >> 0;
	            var y = -point.y * this.workingHeight + this.workingHeight / 2.0 >> 0;
	            return (new BABYLON.Vector2(x, y));
	        };
	        Device.prototype.drawPoint = function (point) {
	            // Clipping what's visible on screen
	            if (point.x >= 0 && point.y >= 0 && point.x < this.workingWidth
	                && point.y < this.workingHeight) {
	                this.putPixel(point.x, point.y, new BABYLON.Color4(1, 1, 0, 1));
	            }
	        };
	        Device.prototype.drawLine = function (point0, point1) {
	            // Bresenham algorithm
	            var x0 = point0.x >> 0;
	            var y0 = point0.y >> 0;
	            var x1 = point1.x >> 0;
	            var y1 = point1.y >> 0;
	            var dx = Math.abs(x1 - x0);
	            var dy = Math.abs(y1 - y0);
	            var sx = (x0 < x1) ? 1 : -1;
	            var sy = (y0 < y1) ? 1 : -1;
	            var err = dx - dy;
	            while (true) {
	                this.drawPoint(new BABYLON.Vector2(x0, y0));
	                if ((x0 == x1) && (y0 == y1)) {
	                    break;
	                }
	                var e2 = 2 * err;
	                if (e2 > -dy) {
	                    err -= dy;
	                    x0 += sx;
	                }
	                if (e2 < dx) {
	                    err += dx;
	                    y0 += sy;
	                }
	            }
	        };
	        Device.prototype.render = function (camera, meshes) {
	            var viewMatrix = BABYLON.Matrix.LookAtLH(camera.Position, camera.Target, BABYLON.Vector3.Up());
	            var projectionMatrix = BABYLON.Matrix.PerspectiveFovLH(0.78, this.workingWidth / this.workingHeight, 0.01, 1.0);
	            // draw each mesh
	            for (var index = 0; index < meshes.length; index++) {
	                var cMesh = meshes[index];
	                var worldMatrix = BABYLON.Matrix.RotationYawPitchRoll(cMesh.Rotation.y, cMesh.Rotation.x, cMesh.Rotation.z)
	                    .multiply(BABYLON.Matrix.Translation(cMesh.Position.x, cMesh.Position.y, cMesh.Position.z));
	                var transformMatrix = worldMatrix.multiply(viewMatrix).multiply(projectionMatrix);
	                // draw vertices of current mesh
	                /*for (var indexVertices = 0; indexVertices < cMesh.Vertices.length; indexVertices++) {
	                    var projectedPoint = this.project(cMesh.Vertices[indexVertices], transformMatrix);
	                    this.drawPoint(projectedPoint);
	                }*/
	                // draw faces of current mesh
	                for (var indexFaces = 0; indexFaces < cMesh.Faces.length; indexFaces++) {
	                    var cFace = cMesh.Faces[indexFaces];
	                    var vertexA = cMesh.Vertices[cFace.A];
	                    var vertexB = cMesh.Vertices[cFace.B];
	                    var vertexC = cMesh.Vertices[cFace.C];
	                    var pixelA = this.project(vertexA, transformMatrix);
	                    var pixelB = this.project(vertexB, transformMatrix);
	                    var pixelC = this.project(vertexC, transformMatrix);
	                    this.drawLine(pixelA, pixelB);
	                    this.drawLine(pixelB, pixelC);
	                    this.drawLine(pixelC, pixelA);
	                }
	            }
	        };
	        return Device;
	    }());
	    SoftEngine.Device = Device;
	    var Mesh = (function () {
	        function Mesh(name, facesCount, verticesCount) {
	            this.name = name;
	            this.Vertices = new Array(verticesCount);
	            this.Faces = new Array(facesCount);
	            this.Rotation = BABYLON.Vector3.Zero();
	            this.Position = BABYLON.Vector3.Zero();
	        }
	        return Mesh;
	    }());
	    SoftEngine.Mesh = Mesh;
	    var Camera = (function () {
	        function Camera() {
	            this.Position = BABYLON.Vector3.Zero();
	            this.Target = BABYLON.Vector3.Zero();
	        }
	        return Camera;
	    }());
	    SoftEngine.Camera = Camera;
	})(SoftEngine = exports.SoftEngine || (exports.SoftEngine = {}));


/***/ }
/******/ ]);