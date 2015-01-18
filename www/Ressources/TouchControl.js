// shim layer with setTimeout fallback
window.requestAnimFrame = (function () {
    return window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    function (callback) {
        window.setTimeout(callback, 1000 / 60);
    };
})();

var canvas,
c, // c is the canvas' context 2D
container,
halfWidth,
halfHeight,
leftPointerID = -1,
leftPointerPos = new Vector2(0, 0),
leftPointerStartPos = new Vector2(0, 0),
leftVector = new Vector2(0, 0);

var touches; // collections of pointers
var ship;
bullets = [],
spareBullets = [];

document.addEventListener("DOMContentLoaded", init);

window.onorientationchange = resetCanvas;
window.onresize = resetCanvas;

function init() {
    setupCanvas();
    touches = new Collection();
    ship = new ShipMoving(halfWidth, halfHeight);
    //document.body.appendChild(ship.canvas);
    canvas.addEventListener('pointerdown', onPointerDown, false);
    canvas.addEventListener('pointermove', onPointerMove, false);
    canvas.addEventListener('pointerup', onPointerUp, false);
    canvas.addEventListener('pointerout', onPointerUp, false);
    requestAnimFrame(draw);
}

function resetCanvas(e) {
    // resize the canvas - but remember - this clears the canvas too.
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    halfWidth = canvas.width / 2;
    halfHeight = canvas.height / 2;

    //make sure we scroll to the top left.
    window.scrollTo(0, 0);
}

function draw() {
    c.clearRect(0, 0, canvas.width, canvas.height);

    ship.targetVel.copyFrom(leftVector);
    ship.targetVel.multiplyEq(0.15);
    ship.update();

    with (ship.pos) {
        if (x < 0) x = canvas.width;
        else if (x > canvas.width) x = 0;
        if (y < 0) y = canvas.height;
        else if (y > canvas.height) y = 0;
    }

    ship.draw();

    for (var i = 0; i < bullets.length; i++) {
        var bullet = bullets[i];
        if (!bullet.enabled) continue;
        bullet.update();
        bullet.draw(c);
        if (!bullet.enabled) {
            spareBullets.push(bullet);

        }
    }

    touches.forEach(function (touch) {
        if (touch.identifier == leftPointerID) {
            c.beginPath();

            //c.fillText("type : " + touch.type + " id : " + touch.identifier + " x:" + leftPointerStartPos.x + " y:" + leftPointerStartPos.y, leftPointerStartPos.x + 30, leftPointerStartPos.y - 30);
            //c.fillText("type : " + touch.type + " id : " + touch.identifier + " x:" + leftPointerPos.x + " y:" + leftPointerPos.y, leftPointerPos.x + 30, leftPointerPos.y - 30);

            c.strokeStyle = "cyan";
            c.lineWidth = 6;
            c.arc(leftPointerStartPos.x, leftPointerStartPos.y, 40, 0, Math.PI * 2, true);
            c.stroke();
            c.beginPath();
            c.strokeStyle = "cyan";
            c.lineWidth = 2;
            c.arc(leftPointerStartPos.x, leftPointerStartPos.y, 60, 0, Math.PI * 2, true);
            c.stroke();
            c.beginPath();
            c.strokeStyle = "cyan";
            c.arc(leftPointerPos.x, leftPointerPos.y, 40, 0, Math.PI * 2, true);
            c.stroke();

            CalculOrigin(leftPointerPos.x, leftPointerStartPos.x, leftPointerPos.y, leftPointerStartPos.y);
        } else {

            c.beginPath();
            c.fillStyle = "white";
            //c.fillText("type : " + touch.type + " id : " + touch.identifier + " x:" + touch.x + " y:" + touch.y, touch.x + 30, touch.y - 30);

            c.beginPath();
            c.strokeStyle = "black";
            c.lineWidth = "6";
            c.arc(touch.x, touch.y, 40, 0, Math.PI * 2, true);
            c.stroke();
        }
    });

    requestAnimFrame(draw);
}

function makeBullet() {
    var bullet;

    if (spareBullets.length > 0) {

        bullet = spareBullets.pop();
        bullet.reset(ship.pos.x, ship.pos.y, ship.angle);

    } else {

        bullet = new Bullet(ship.pos.x, ship.pos.y, ship.angle);
        bullets.push(bullet);

    }

    bullet.vel.plusEq(ship.vel);
}

function givePointerType(event) {
    switch (event.pointerType) {
        case event.POINTER_TYPE_MOUSE:
            return "MOUSE";
            break;
        case event.POINTER_TYPE_PEN:
            return "PEN";
            break;
        case event.POINTER_TYPE_TOUCH:
            return "TOUCH";
            break;
    }
}

function onPointerDown(e) {
    var newPointer = { identifier: e.pointerId, x: e.clientX, y: e.clientY, type: givePointerType(e) };
    if ((leftPointerID < 0) && (e.clientX < halfWidth)) {
        leftPointerID = e.pointerId;
        leftPointerStartPos.reset(e.clientX, e.clientY);
        leftPointerPos.copyFrom(leftPointerStartPos);
        leftVector.reset(0, 0);
    }
    else {
        makeBullet();

    }
    touches.add(e.pointerId, newPointer);
}

function onPointerMove(e) {
    if (leftPointerID == e.pointerId) {
        leftPointerPos.reset(e.clientX, e.clientY);
        leftVector.copyFrom(leftPointerPos);
        leftVector.minusEq(leftPointerStartPos);
    }
    else {
        if (touches.item(e.pointerId)) {
            touches.item(e.pointerId).x = e.clientX;
            touches.item(e.pointerId).y = e.clientY;
        }
    }
}

function onPointerUp(e) {
    if (leftPointerID == e.pointerId) {
        leftPointerID = -1;
        leftVector.reset(0, 0);

    } else {
        ChangeMode();
    }
    leftVector.reset(0, 0);
    motors(0, 0); // Arret des moteurs lors du relachement du joystick
    touches.remove(e.pointerId);
}

function setupCanvas() {
    canvas = document.getElementById('canvasSurfaceGame');
    c = canvas.getContext('2d');
    resetCanvas();
    c.strokeStyle = "#ffffff";
    c.lineWidth = 2;
}
