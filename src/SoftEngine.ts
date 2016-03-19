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

        

        public project(coord: BABYLON.Vector3, transMat: BABYLON.Matrix): BABYLON.Vector3 {
            // let babylon do the transformation
            var point: BABYLON.Vector3 = BABYLON.Vector3.TransformCoordinates(coord, transMat);
            // the transformed coordinates will be based on the coordinate system
            // originating in the center of the screen. But drawing on screeen usually starts 
            // from top left, and we thus need to transform them again.
            var x: number = point.x * this.workingWidth + this.workingWidth / 2.0;
            var y: number = -point.y * this.workingHeight + this.workingHeight / 2.0;
            return (new BABYLON.Vector3(x, y, point.z));
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

                // draw faces of current mesh
                for (var indexFaces = 0; indexFaces < cMesh.Faces.length; indexFaces++) {
                    var cFace = cMesh.Faces[indexFaces];

                    var vertexA = cMesh.Vertices[cFace.A];
                    var vertexB = cMesh.Vertices[cFace.B];
                    var vertexC = cMesh.Vertices[cFace.C];

                    var pixelA = this.project(vertexA, transformMatrix);
                    var pixelB = this.project(vertexB, transformMatrix);
                    var pixelC = this.project(vertexC, transformMatrix);

                    var color: number = 0.25 + ((indexFaces % cMesh.Faces.length) / cMesh.Faces.length) * 0.75;
                    this.drawTriangle(pixelA, pixelB, pixelC, new BABYLON.Color4(color, color, color, 1));
                }
            }
        }

        public LoadJSONFileAsync(fileName: string, callback: (result: Mesh[]) => any): void {
            var jsonObject = {};
            var xmlhttp = new XMLHttpRequest();
            xmlhttp.open("GET", fileName, true);
            var context = this;
            xmlhttp.onreadystatechange = function() {
                if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
                    jsonObject = JSON.parse(xmlhttp.responseText);
                    callback(context.CreateMeshesFromJSON(jsonObject))
                }
            };
            xmlhttp.send(null);
        }
        
        private putPixel(x: number, y: number, color: BABYLON.Color4): void {
            this.backbufferdata = this.backbuffer.data;
            var index: number = ((x >> 0) + (y >> 0) * this.workingWidth) * 4; // why the shifts?

            // RGBA
            this.backbufferdata[index + 0] = color.r * 255;
            this.backbufferdata[index + 1] = color.g * 255;
            this.backbufferdata[index + 2] = color.b * 255;
            this.backbufferdata[index + 3] = color.a * 255;
        }

        private drawPoint(point: BABYLON.Vector2, color: BABYLON.Color4): void {
            // Clipping what's visible on screen
            if (point.x >= 0 && point.y >= 0 && point.x < this.workingWidth
                && point.y < this.workingHeight) {
                this.putPixel(point.x, point.y, color);
            }
        }
        
        private clamp(value: number, min: number = 0, max: number = 1): number {
            return Math.max(min, Math.min(value, max));
        }

        private interpolate(min: number, max: number, gradient: number): number {
            return min + (max - min) * this.clamp(gradient);
        }

        // pa, pb, pc and pd are expected to be sorted
        private processScanLine(y: number, pa: BABYLON.Vector3, pb: BABYLON.Vector3,
            pc: BABYLON.Vector3, pd: BABYLON.Vector3, color: BABYLON.Color4): void {
            var gradient1 = pa.y != pb.y ? (y - pa.y) / (pb.y - pa.y) : 1;
            var gradient2 = pc.y != pd.y ? (y - pc.y) / (pd.y - pc.y) : 1;

            var sx = this.interpolate(pa.x, pb.x, gradient1);
            var ex = this.interpolate(pc.x, pd.x, gradient2);

            // draw the line
            for (var x = sx; x < ex; x++) {
                this.drawPoint(new BABYLON.Vector2(x, y), color);
            }
        }

        private drawTriangle(p1: BABYLON.Vector3, p2: BABYLON.Vector3, p3: BABYLON.Vector3, color: BABYLON.Color4) {
            // sort points
            var s = [p1, p2, p3].sort(function(a, b): number { return a.y - b.y; });
            p1 = s[0]; p2 = s[1]; p3 = s[2];

            // computing slopes
            var dP1P2: number = p2.y > p1.y ? (p2.x - p1.x) / (p2.y - p1.y) : 0;
            var dP1P3: number = p3.y > p1.y ? (p3.x - p1.x) / (p3.y - p1.y) : 0;

            if (dP1P2 > dP1P3) {
                // Case 1: P2 is right of P1 and P3
                for (var y = p1.y >> 0; y <= p3.y; y++) {
                    if (y < p2.y) {
                        this.processScanLine(y, p1, p3, p1, p3, color);
                    } else {
                        this.processScanLine(y, p1, p3, p2, p3, color);
                    }
                }
            } else {
                // Case 2: P2 is left of P1 and P3
                for (var y = p1.y >> 0; y <= p3.y >> 0; y++) {
                    if (y < p2.y) {
                        this.processScanLine(y, p1, p2, p1, p3, color);
                    }
                    else {
                        this.processScanLine(y, p2, p3, p1, p3, color);
                    }
                }
            }
        }

        private CreateMeshesFromJSON(jsonObject): Mesh[] {
            var meshes: Mesh[] = [];
            for (var meshIndex = 0; meshIndex < jsonObject.meshes.length; meshIndex++) {
                var verticesArray: number[] = jsonObject.meshes[meshIndex].vertices;
                var indicesArray: number[] = jsonObject.meshes[meshIndex].indices;

                var uvCount: number = jsonObject.meshes[meshIndex].uvCount;
                var verticesStep = 1;

                switch (uvCount) {
                    case 0:
                        verticesStep = 6;
                        break;
                    case 1:
                        verticesStep = 8;
                        break;
                    case 2:
                        verticesStep = 10;
                        break;
                }

                var verticesCount = verticesArray.length / verticesStep;
                var facesCount = indicesArray.length / 3;
                var mesh = new SoftEngine.Mesh(jsonObject.meshes[meshIndex].name, verticesCount, facesCount);

                for (var index = 0; index < verticesCount; index++) {
                    var x = verticesArray[index * verticesStep];
                    var y = verticesArray[index * verticesStep + 1];
                    var z = verticesArray[index * verticesStep + 2];

                    mesh.Vertices[index] = new BABYLON.Vector3(x, y, z);
                }

                for (var index = 0; index < facesCount; index++) {
                    var a = indicesArray[index * 3];
                    var b = indicesArray[index * 3 + 1]
                    var c = indicesArray[index * 3 + 2]
                    mesh.Faces[index] = { A: a, B: b, C: c };
                }

                var position = jsonObject.meshes[meshIndex].position;
                mesh.Position = new BABYLON.Vector3(position[0], position[1], position[2])

                meshes.push(mesh);
            }
            return meshes;
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