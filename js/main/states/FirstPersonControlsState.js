const Three = require('three');
const AppState = require('./AppState');
const DomHandler = require('../../dom/DomHandler');
const PointerLockHandler = require('../PointerLockHandler');
const StateManager = require('../StateManager');

const camera = new Three.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

module.exports = class FirstPersonControlsState extends AppState{
    constructor() {
        super();
        camera.rotation.set(0, 0, 0);
        
        this.moveForward = false;
        this.moveBackward = false; 
        this.moveLeft = false;
        this.moveRight = false;
        this.sprinting = false;
        this.jumping = false;
        this.inAir = false;

        this.speed = 50;
        this.xSpeed = 30;
        this.zSpeed = 40;
        this.speedMultiplier = 1.5;

        this.pitchObject = new Three.Object3D();
        this.pitchObject.add(camera);

        this.yawObject = new Three.Object3D();
        this.yawObject.position.y = 6;
        this.yawObject.add(this.pitchObject);

        let PI_2 = Math.PI / 2;

        this.velocity = new Three.Vector3();

        this.onMouseMove = function (event) {                  
            this.yawObject.rotation.y -= event.movementX * 0.002;
            this.pitchObject.rotation.x -= event.movementY * 0.002;
            this.pitchObject.rotation.x = Math.max(-PI_2, Math.min(PI_2, this.pitchObject.rotation.x));
        }.bind(this);

        this.onKeyDown = function(event){
            console.log(event.code);
            
            switch(event.code){
                case 'KeyW':
                    this.moveForward = true;
                    break;
                case 'KeyA':
                    this.moveLeft = true;
                    break;
                case 'KeyS':
                    this.moveBackward = true;
                    break;
                case 'KeyD':
                    this.moveRight = true;
                    break;
                case 'Space':
                    this.jumping = true;
                    break;
                case 'ShiftLeft':
                    this.sprinting = true;
                    break;    
            }
        }.bind(this);

        this.onKeyUp = function(event){
            switch(event.code){
                case 'KeyW':
                    this.moveForward = false;
                    break;
                case 'KeyA':
                    this.moveLeft = false;
                    break;
                case 'KeyS':
                    this.moveBackward = false;
                    break;
                case 'KeyD':
                    this.moveRight = false;
                    break;
                case 'Space':
                    this.jumping = false;
                    break;
                case 'ShiftLeft':
                    this.sprinting = false;
                    break;    
            }
        }.bind(this);

        this.enabled = false;
        this.enable();
        
    }
    enable(){
        super.enable();
        if(!this.enabled){
            DomHandler.addEventListener('mousemove', this.onMouseMove);
            DomHandler.addEventListener('keydown', this.onKeyDown);
            DomHandler.addEventListener('keyup', this.onKeyUp);

            DomHandler.addEventListener('resize', function handleResize(){
                let dimensions = DomHandler.getDisplayDimensions();
                camera.aspect = dimensions.width / dimensions.height;
                camera.updateProjectionMatrix();
            });
    
            DomHandler.addEventListener('click', function(){
                PointerLockHandler.requestLock();
            }.bind(this));
            
            PointerLockHandler.addChangeFunction(function(locked){
                if(!locked){
                    console.log('test');                    
                }
            });
            
            this.enabled = true;
        }
    }
    disable(){
        super.disable();
        if(this.enabled){
            DomHandler.removeEventListener('mousemove', this.onMouseMove);
            DomHandler.removeEventListener('keydown', this.onKeyDown);
            DomHandler.removeEventListener('keyup', this.onKeyUp);
            
            this.enabled = false;
        }
    }
    update(delta){
        super.update();
        let moving = false;

        this.velocity.x -= this.velocity.x * 10.0 * delta;
        this.velocity.z -= this.velocity.z * 10.0 * delta;
        this.velocity.y -= 9.8 * 10.0 * delta;

        if(!this.inAir && this.jumping){
            this.velocity.y += 35;
            this.inAir = true;
        }

        if(this.moveForward && !this.moveBackward){
            moving = true;
            if((this.moveLeft || this.moveRight) && !(this.moveLeft && this.moveRight)){

                if(this.sprinting){
                    this.velocity.z -= this.zSpeed * delta * this.speedMultiplier;
                }else{
                    this.velocity.z -= this.zSpeed * delta;
                }

            }else{
                
                if(this.sprinting){
                    this.velocity.z -= this.speed * delta * this.speedMultiplier;
                }else{
                    this.velocity.z -= this.speed * delta;
                }

            }
        }
        
        else if(this.moveBackward && !this.moveForward){
            moving = true;
            if((this.moveLeft || this.moveRight) && !(this.moveLeft && this.moveRight)){
                this.velocity.z += this.zSpeed * delta;
            }else{
                this.velocity.z += this.speed * delta;
            }

        }

        if(this.moveLeft && !this.moveRight){
            moving = true;
            if((this.moveForward || this.moveBackward) && !(this.moveForward && this.moveBackward)){
                this.velocity.x -= this.xSpeed * delta;
            }else{
                this.velocity.x -= this.speed * delta;
            }
        }
        
        else if(this.moveRight && !this.moveLeft){
            moving = true;
            if((this.moveForward || this.moveBackward) && !(this.moveForward && this.moveBackward)){
                this.velocity.x += this.xSpeed * delta;
            }else{
                this.velocity.x += this.speed * delta;
            }
        }
        
        if(!moving){
            if(Math.abs(this.velocity.x) < 0.005) this.velocity.x = 0;
            if(Math.abs(this.velocity.z) < 0.005) this.velocity.z = 0;
        }

        this.yawObject.translateX(this.velocity.x * delta * this.speedMultiplier);
        this.yawObject.translateY(this.velocity.y * delta * this.speedMultiplier);
        this.yawObject.translateZ(this.velocity.z * delta * this.speedMultiplier);

        if(this.yawObject.position.y < 6){
            this.yawObject.position.y = 6;
            this.velocity.y = 0;
            this.inAir = false;
        }
        

    }
    getObject(){
        return this.yawObject;
    }
    getCamera(){
        return camera;
    }
};
/*
    getDirection(){
        let direction = new Three.Vector3(0, 0, -1);
        let rotation = new Three.Euler(0, 0, 0, 'YXZ');

        return function (v) {

            rotation.set(this.pitchObject.rotation.x, this.yawObject.rotation.y, 0);

            v.copy(direction).applyEuler(rotation);

            return v;

        };
    }();
*/