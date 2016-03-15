/// <reference path="./decls/babylon.d.ts" />

export module SoftEngine {
    export class Device {
        // the back buffer size is equal to the number of pixes to draw
        // on screen (width * height) * 4 (R,G,B & A values)
        private backbuffer: ImageData;
        private workingCanvas: HTMLCanvasElement;
        private workingContext: CanvasRenderingContext2D;
        private workingWidth: number;
        private workingHeight: number;
        // corresponds to backbuffer.data
        private backbufferdata;
        
        constructor(canvas: HTMLCanvasElement) {
            this.workingCanvas = canvas;
            this.workingWidth = canvas.width;
            this.workingHeight = canvas.height;
            this.workingContext = this.workingCanvas.getContext("2d");
        }
        
        // this function is called to clear the backbuffer with a specific color
        public clear(): void {
            this.workingContext.clearRect(0, 0, this.workingWidth, this.workingHeight);
            this.backbuffer = this.workingContext.getImageData(0, 0, this.workingWidth, this.workingHeight);
        }
        
        // once everything is ready, we flush the back buffer into the front buffer
        public present(): void {
            this.workingContext.putImageData(this.backbuffer, 0, 0);
        }
        
        public putPixel(x: number, y: number, color: BABYLON.Color4): void {
            this.backbufferdata = this.backbuffer.data;
            var index: number = ((x >> 0) + (y >> 0) * this.workingWidth) * 4; // why the shifts?
            
            // RGBA
            this.backbufferdata[index + 0] = color.r * 255;
            this.backbufferdata[index + 1] = color.g * 255;
            this.backbufferdata[index + 2] = color.b * 255;
            this.backbufferdata[index + 3] = color.a * 255;
        }
        
        public project(coord: BABYLON.Vector3, transMat: BABYLON.Matrix): BABYLON.Vector2 {
            // let babylon do the transformation
            var point: BABYLON.Vector3 = BABYLON.Vector3.TransformCoordinates(coord, transMat);
            // the transformed coordinates will be based on the coordinate system
            // originating in the center of the screen. But drawing on screeen usually starts 
            // from top left, and we thus need to transform them again.
            var x: number = point.x * this.workingWidth + this.workingWidth / 2.0 >> 0;
            var y: number = -point.y * this.workingHeight + this.workingHeight / 2.0 >> 0;
            return (new BABYLON.Vector2(x, y));
        }
        
        public drawPoint(point: BABYLON.Vector2): void {
            // Clipping what's visible on screen
            if (point.x >= 0 && point.y >= 0 && point.x < this.workingWidth
                                             && point.y < this.workingHeight) {
                this.putPixel(point.x, point.y, new BABYLON.Color4(1, 1, 0, 1));
            }
        }
        
        public drawLine(point0: BABYLON.Vector2, point1: BABYLON.Vector2): void {
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
        }
        
        public render(camera: Camera, meshes: Mesh[]): void {
            var viewMatrix = BABYLON.Matrix.LookAtLH(camera.Position, camera.Target, BABYLON.Vector3.Up());
            var projectionMatrix = BABYLON.Matrix.PerspectiveFovLH(0.78,
                this.workingWidth / this.workingHeight, 0.01, 1.0);
            
            // draw each mesh
            for (var index = 0; index < meshes.length; index++) {
                var cMesh = meshes[index];
                var worldMatrix = BABYLON.Matrix.RotationYawPitchRoll(
                    cMesh.Rotation.y, cMesh.Rotation.x, cMesh.Rotation.z)
                    .multiply(BABYLON.Matrix.Translation(
                        cMesh.Position.x, cMesh.Position.y, cMesh.Position.z));
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
        }
    }
    
    export class Mesh {
        Position: BABYLON.Vector3;
        Rotation: BABYLON.Vector3;
        Vertices: BABYLON.Vector3[];
        Faces: Face[];
        
        constructor(public name: string, facesCount: number, verticesCount: number) {
            this.Vertices = new Array(verticesCount);
            this.Faces = new Array(facesCount);
            this.Rotation = BABYLON.Vector3.Zero();
            this.Position = BABYLON.Vector3.Zero();
        }
    }
    
    export class Camera {
        Position: BABYLON.Vector3;
        Target: BABYLON.Vector3;
        
        constructor() {
            this.Position = BABYLON.Vector3.Zero();
            this.Target = BABYLON.Vector3.Zero();
        }
    }
    
    export interface Face {
        A: number;
        B: number;
        C: number;
    }
}