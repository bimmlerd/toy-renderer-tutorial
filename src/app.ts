/// <reference path="./SoftEngine.ts" />
import { SoftEngine } from './SoftEngine.ts';

var canvas: HTMLCanvasElement;
var device: SoftEngine.Device;
var mesh: SoftEngine.Mesh;
var meshes: SoftEngine.Mesh[] = [];
var camera: SoftEngine.Camera;

document.addEventListener("DOMContentLoaded", init, false);

function init(): void {
    canvas = <HTMLCanvasElement>document.getElementById("frontbuffer");
    mesh = new SoftEngine.Mesh("Cube", 8, 12);
    meshes.push(mesh);
    camera = new SoftEngine.Camera();
    device = new SoftEngine.Device(canvas);

    camera.Position = new BABYLON.Vector3(0, 0, 10);
    camera.Target = new BABYLON.Vector3(0, 0, 0);

    device.LoadJSONFileAsync("data/monkey.babylon", loadJSONCompleted);
}

function loadJSONCompleted(meshesLoaded: SoftEngine.Mesh[]) {
    meshes = meshesLoaded;
    requestAnimationFrame(drawingLoop);
}

function drawingLoop(): void {
    device.clear();

    for (var i = 0; i < meshes.length; i++) {
        meshes[i].Rotation.x += 0.01;
        meshes[i].Rotation.y += 0.01;
    }

    device.render(camera, meshes);
    device.present();

    requestAnimationFrame(drawingLoop);
}