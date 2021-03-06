var cars = {};
var gameName = "game1";
var rotationKey = "car_ROTATION";

var stageAccess = null;
var raceStarted = false;
var container = null;
var deletedPost;

function orderCarsOnTheStart(){
  var y = 0;
  var x = 0;
  for(var key in cars){
    cars[key].p.x = 600 - (100 * x);
    cars[key].p.y = 880 + (72 * y);
    if(y++ == 3){
      y = 0;
      x++;
    }
  }
}

window.onload = function(){
    var Q = window.Q = Quintus({ audioSupported: [ 'mp3' ] }).include("Sprites, Scenes,Anim,UI,Touch,Audio").setup({ width: 1920, height: 1080 }).touch().enableSound();

    Q.load(["PENEK.png","tree_up.png","tree_right.png","Tree_down_2.png","Tree_down_1.png","SENO_right.png","SENO_keft.png","ZNAK.png","down_left.png","down_right.png","center.png","arrow.png","wind.png","song.mp3","3.png","1_animation.png","2_animation.png","4_animation.png"], function() {

        Q.sheet("ment","2_animation.png",{tilew: 90,tileh: 45,sx: 0,sy: 0});
        Q.sheet("car","1_animation.png",{tilew: 75,tileh: 33,sx: 0,sy: 0});
        Q.sheet("pig","4_animation.png",{tilew: 96,tileh: 36,sx: 0,sy: 0});
        Q.sheet("tank","3.png",{tilew: 140,tileh: 63,sx: 0,sy: 0});

        Q.animations('ment', {run: { frames: [0,1,2], rate: 1/3,loop:true}});
        Q.animations('car', {run: { frames: [0,1,2], rate: 1/3,loop:true}});
        Q.animations('pig', {run: { frames: [0,1,2], rate: 1/3,loop:true}});
        Q.animations('tank', {run: { frames: [0,1,2], rate: 1/3,loop:true}});

        var fbRef = new Firebase("https://intense-heat-6899.firebaseio.com/racegame/" + gameName);
        fbRef.child("cars").on("value", function(snapshot) {
            var gotCars = snapshot.val();

            for(key in gotCars){
                if(!cars[key] && stageAccess != null){
                    cars[key] = new Q.Car({direction:new Q.CarDirection()});
                    stageAccess.insert(cars[key]);
                    stageAccess.insert(cars[key].p.direction);
                    cars[key].play("run");
                    orderCarsOnTheStart();
                }

                var p = cars[key].p;

                p.omega = gotCars[key][rotationKey];
                if(p.omega < 10 && p.omega > -10){
                    p.omega = 0;
                }
            }
        });

        fbRef.child("cars").on("child_removed", function(snapshot) {
          if(cars[snapshot.key()]){
            var car = cars[snapshot.key()]
            car.p.direction.destroy();
            car.destroy();
            delete cars[snapshot.key()];
          }
        });


        fbRef.child("cars").on("child_removed", function(snapshot) {
          if(cars[snapshot.key()]){
            var car = cars[snapshot.key()].destroy();
            delete cars[snapshot.key()];
          }
        });

        Q.Sprite.extend("CarDirection", {
            init: function(p) {
                p = p || {};
                p.asset = "arrow.png";
                p.points = [[0,0]];
                p.x = 10;
                p.y = 500;
                p.w = 1;
                p.h = 1;
                p.cy = 300;
                p.scale = 0.03;
                this._super(p);
            }
        });

        Q.Sprite.extend("Decor", {
            init: function(p) {
                p = p || {};
                p.points = [[0,0]];
                p.cx = 0;
                p.cy = 0;
                p.type = Q.SPRITE_UI;
                p.scale = 1;
                this._super(p);
            }
        });

        Q.Sprite.extend("Wind", {
            init: function(p) {
                p = p || {};
                p.asset = "wind.png";
                p.points = [[0,0]];
                p.cx = 166/2;
                p.cy = 166/2;
                p.type = Q.SPRITE_UI;
                p.scale = 1;
                p.omega = 50;
                this._super(p);
            },
            step: function(dt) {
                 this.p.angle += dt * (this.p.omega);
            }
        });

        Q.Sprite.extend("Car", {
            init: function(p) {
                p = p || {};

                switch(Math.floor((Math.random() * 4) + 1)){
                    case 1:
                        p.sprite = 'car';
                        p.sheet = 'car';
                        p.w = 75;
                        p.h = 33;
                        break;
                    case 2:
                        p.sprite = 'pig';
                        p.sheet = 'pig';
                        p.w = 90;
                        p.h = 36;
                        break;
                    case 3:
                        p.sprite = 'tank';
                        p.sheet = 'tank';
                        p.w = 140;
                        p.h = 63;
                        break;
                    case 4:
                        p.sprite = 'ment';
                        p.sheet = 'ment';
                        p.w = 90;
                        p.h = 45;
                        break;
                }
                p.z = 1;
                p.passedControlPoints = 0;
                p.points = [[-(p.w/2),-(p.h/2)],[p.w/2,-(p.h/2)],[p.w/2,p.h/2],[-(p.w/2),p.h/2]];
                p.cx = p.w/2;
                p.cy = p.h/2;
                p.type = 1;
                p.dx = 0;
                p.dy = 0;
                p.speed = 80;
                p.scale = 1;
                this._super(p);
                this.add("animation");
            },
            step: function(dt) {
                var p = this.p;
                var r = p.angle * (Math.PI/180);

                if(raceStarted){
                  p.angle += dt * (p.omega * 2);

                  if(raceStarted){
                      p.dx = Math.floor(Math.cos(r)*p.speed);
                      p.dy = Math.floor(Math.sin(r)*p.speed);
                      p.x += p.dx * dt;
                      p.y += p.dy * dt;
                  }

                  var maxCol = 6, collided = false;
                  while((collided = this.stage.search(this)) && maxCol > 0) {
                      if(collided) {
                          if(collided.obj.p.counter){

                              if(collided.obj.p.finish){
                                  if(p.passedControlPoints == true){
                                      p.passedControlPoints = false;
                                      raceStarted = false;
                                      container = stageAccess.insert(new Q.UI.Container({fill: "gray",border: 5,shadow: 10,shadowColor: "rgba(0,0,0,0.5)",y: 50,x: 150}));
                                      stageAccess.insert(new Q.UI.Text({label: "Dat Player is a winner!",color: "white",x: 0,y: 0}),container);
                                      container.fit(20,20);
                                      orderCarsOnTheStart();
                                  }
                              }else{
                                p.passedControlPoints = true
                              }
                          }else{
                              //this.p.x -= collided.separate[0];
                              //this.p.y -= collided.separate[1];
                              this.p.x +=collided.normalX;
                              this.p.y +=collided.normalY;
                          }
                      }
                      maxCol--;
                  }
                }
                var cursor = p.direction.p;

                cursor.x = this.p.x + Math.floor(Math.cos(r)*40);
                cursor.y = this.p.y + Math.floor(Math.sin(r)*40);
                cursor.angle = this.p.angle + this.p.omega;

            }
        });

        Q.Sprite.extend("Wall", {
            init: function(p) {
                p = p || {};
                p.points = [[0,0],[p.w,0],[p.w,p.h],[0,p.h]];
                p.cx = 0;
                p.cy = 0;
                p.type = 1;
                p.scale = 1;
                this._super(p);
            },
            step: function(dt) {

            }
        });

        Q.Sprite.extend("Circle", {
            init: function(p) {
                p = p || {};
                p.points = [];
                for(var angle = 0; angle<360;angle+=30){
                    var r = angle * (Math.PI/180);
                    var x = Math.floor(Math.cos(r)*p.r);
                    var y = Math.floor(Math.sin(r)*p.r);
                    p.points.push([x,y]);
                }
                p.w = p.r *2;
                p.h = p.r *2;
                p.cx = p.r;
                p.cy = p.r;
                this._super(p);
            }
        });

        Q.scene("Race",new Q.Scene(function(stage) {
            stageAccess = stage;

            // wals
            stageAccess.insert(new Q.Wall({w:1920,h:10,x:0,y:0}));//top
            stageAccess.insert(new Q.Wall({w:1920,h:10,x:0,y:1070}));//bottom
            stageAccess.insert(new Q.Wall({w:10,h:1080,x:0,y:0}));//left
            stageAccess.insert(new Q.Wall({w:10,h:1080,x:1910,y:0}));//right

            //rectangles
            stageAccess.insert(new Q.Wall({w:520,h:120,x:0,y:0})); // top left block
            stageAccess.insert(new Q.Wall({w:575,h:100,x:1920-565,y:1080-80})); //bottom right block
            stageAccess.insert(new Q.Wall({w:250,h:700,x:-260,y:1265-450,angle:316})); // bottom left block

            stageAccess.insert(new Q.Wall({w:500,h:290,x:430,y:520,angle:335})); // middle block1
            stageAccess.insert(new Q.Wall({w:460,h:260,x:900,y:320})); // middle block2

            stageAccess.insert(new Q.Wall({w:50,h:180,x:200,y:200,angle:15}));// truck 1 tail
            stageAccess.insert(new Q.Wall({w:50,h:90,x:153,y:400,angle:345}));//truck 1 head

            stageAccess.insert(new Q.Wall({w:50,h:180,x:560,y:445,angle:240}));//truck 2 tail
            stageAccess.insert(new Q.Wall({w:50,h:90,x:533,y:400,angle:100}));//truck 2 head

            stageAccess.insert(new Q.Wall({w:65,h:150,x:1465,y:395,angle:15}));//who knows what is it

            //stageAccess.insert(new Q.Circle({x:700,y:80,r:30}));// pile 1 top
            //stageAccess.insert(new Q.Circle({x:1520,y:680,r:30}));// pile 2 middle in middle right
            stageAccess.insert(new Q.Circle({x:1747,y:820,r:25}));// pile 3 almost bottom right
            stageAccess.insert(new Q.Circle({x:145,y:633,r:20}));// pile 5 middle left
            //stageAccess.insert(new Q.Circle({x:70,y:650,r:30}));// pile 6 under middle left

            stageAccess.insert(new Q.Circle({x:1530,y:715,r:5}));// pile 6 under middle left

            // 5 trees in row topp in middle
            //stageAccess.insert(new Q.Circle({x:1000,y:275,r:10}));// tree
            //stageAccess.insert(new Q.Circle({x:1040,y:270,r:10}));// tree
            //stageAccess.insert(new Q.Circle({x:1080,y:270,r:10}));// tree
            stageAccess.insert(new Q.Circle({x:1102,y:232,r:5}));// tree
            //stageAccess.insert(new Q.Circle({x:1160,y:260,r:10}));// tree

            // three tree in the middle
            //stageAccess.insert(new Q.Circle({x:990,y:660,r:10}));// tree
            //stageAccess.insert(new Q.Circle({x:1040,y:630,r:10}));// tree
            //stageAccess.insert(new Q.Circle({x:1070,y:610,r:10}));// tree

            // three tree in the right
            stageAccess.insert(new Q.Circle({x:1745,y:495,r:5}));// tree
            //stageAccess.insert(new Q.Circle({x:1880,y:510,r:10}));// tree
            //stageAccess.insert(new Q.Circle({x:1880,y:570,r:10}));// tree

            // 4 trees in row topp in middle
            //stageAccess.insert(new Q.Circle({x:960,y:1020,r:10}));// tree
            //stageAccess.insert(new Q.Circle({x:1000,y:1000,r:10}));// tree
            //stageAccess.insert(new Q.Circle({x:1040,y:960,r:10}));// tree
            stageAccess.insert(new Q.Circle({x:1068,y:920,r:5}));// tree
            stageAccess.insert(new Q.Circle({x:1305,y:867,r:5}));// tree

            stageAccess.insert(new Q.Wall({counter:true, w:500,h:10,x:1380,y:420}));
            stageAccess.insert(new Q.Wall({counter:true,w:10,h:500,x:700,y:820,angle:350,finish:true}));

            stage.insert(new Q.UI.Button({label: "Press to START RACE!",y: 70,x: 1750,fill: "#990000",border: 5,shadow: 10,shadowColor: "rgba(0,0,0,0.5)"}, function() {
              //Q.audio.play('song.mp3');
              var startIn = 3;
              var counter = function(){

                  fbRef.update({setCenter:Math.floor((Math.random() * 900000) + 1) + "-" + Math.floor((Math.random() * 900000) + 1)});

                  container = stage.insert(new Q.UI.Container({fill: "gray",border: 5,shadow: 10,shadowColor: "rgba(0,0,0,0.5)",y: 50,x: 150}));
                  stage.insert(new Q.UI.Text({label: "Starts in " + startIn,color: "white",x: 0,y: 0}),container);
                  container.fit(20,20);
                  if(startIn > 0){
                      startIn--;
                      setTimeout(function(){container.destroy();counter();},1000);
                  }else{
                      container.destroy();
                      raceStarted = true;
                  }
              };
            counter();
            }));

        }));


        Q.scene("Foreground",new Q.Scene(function(stage) {
          stage.insert(new Q.Decor({x:434,y:260,asset:"center.png"}));
          stage.insert(new Q.Decor({x:0,y:695,asset:"down_left.png"}));
          stage.insert(new Q.Wind({x:174,y:855,z:2}));
          stage.insert(new Q.Decor({x:1350,y:953,asset:"down_right.png"}));

          stage.insert(new Q.Decor({x:1715,y:750,asset:"SENO_right.png"}));
          stage.insert(new Q.Decor({x:114,y:570,asset:"SENO_keft.png"}));
          stage.insert(new Q.Decor({x:1510,y:610,asset:"ZNAK.png"}));
          stage.insert(new Q.Decor({x:1700,y:380,asset:"tree_right.png"}));
          stage.insert(new Q.Decor({x:1060,y:118,asset:"tree_up.png"}));
          stage.insert(new Q.Decor({x:1350,y:953,asset:"PENEK.png"}));
          stage.insert(new Q.Decor({x:1027,y:808,asset:"Tree_down_1.png"}));
          stage.insert(new Q.Decor({x:1262,y:755,asset:"Tree_down_2.png"}));
        }));

        Q.stageScene("Race",0);
        Q.stageScene("Foreground",1);

/*
        Q.debug = true;
        Q.debugFill = true;
        //*/

    });
};
