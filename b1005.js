var fs = require("fs");
var cv = require('opencv');
var bebop = require('node-bebop');
var GamePad = require( 'node-gamepad' );
var controller = new GamePad( 'ps4/dualshock4' );
controller.connect();
var spawn = require('child_process').spawn;


var drone = bebop.createClient();
var window = new cv.NamedWindow('Video', 0);
var ffmpeg;
var startTime = new Date().getTime();
var lastTime = startTime;
var pd = {x:0, y:0};
var pd2 = {x:0, y:0};
var mode = 'manual';
var stage = 'search';


drone.connect(function() {
    drone.MediaStreaming.videoEnable(1);
    drone.MediaStreaming.videoStreamMode(0);
    drone.on('ready', function(){
	    //drone.land();
	    controller.on( 'share:press', function() {		
		killFfmpeg();
	    });
	    controller.on( 'l1:press', function() {
		    console.log('mode:auto');
		    mode = 'auto';
	    });
	    controller.on( 'r1:press', function() {
		    console.log('mode:manual');
		    mode = 'manual';
	    });
	    controller.on( 'triangle:press', function() {
		    drone.takeOff();
		    startFfmpeg();
	    });
	    controller.on( 'x:press', function() {
		drone.stop();
	    });
	    controller.on( 'circle:press', function() {
		drone.land();
	    });
	    controller.on('right:move', function(od) {
		var cdx = Math.round(od.x / 40);
		var cdy = Math.round(od.y / 40);
		
		if (Math.abs(pd.x - cdx) > 0 || Math.abs(pd.y - cdy) > 0){
		    pd.x = cdx;
		    pd.y = cdy;
		    
		    if (cdx == 3 && cdy == 3){
			console.log('stop');
			drone.stop();
		    } else {
			if (cdx == 3){
			    console.log('right 0');
			    drone.right(0);
			} else if (cdx > 3){
			    console.log('right ' + norm(cdx));
			    drone.right(norm(cdx));
			} else if (cdx < 3){
			    console.log('left ' + norm(cdx));
			    drone.left(norm(cdx));
			} 
			if (cdy == 3){
			    console.log('forward 0');
			    drone.forward(0);
			} else if (cdy > 3){
			    console.log('backward ' + norm(cdy));
			    drone.backward(norm(cdy) * 3);
			} else if (cdy < 3){
			    console.log('forward ' + norm(cdy));
			    drone.forward(norm(cdy) * 3);
			}
		    }
		    
		}
		
	    });

	    controller.on('left:move', function(od) {
		var cdx = Math.round(od.x / 40);
		var cdy = Math.round(od.y / 40);
		
		if (Math.abs(pd2.x - cdx) > 0 || Math.abs(pd2.y - cdy) > 0){
		    pd2.x = cdx;
		    pd2.y = cdy;
		    
		    if (cdx == 3 && cdy == 3){
			drone.stop();
		    } else {
			if (cdx == 3){
			    drone.clockwise(0);
			} else if (cdx > 3){
			    drone.clockwise(norm(cdx) * 4);
			} else if (cdx < 3){
			    drone.counterClockwise(norm(cdx) * 4);
			} 
			if (cdy == 3){
			    drone.down(0);
			} else if (cdy > 3){
			    drone.down(norm(cdy));
			} else if (cdy < 3){
			    drone.up(norm(cdy));
			}
		    }
		}
	    });
    });
});



function norm(val){
    return Math.abs(val - 3) * 8;
}

function stopd(drone){
    console.log('stop');
    setTimeout(function(){
	    drone.stop();
	}, 1000);
}
function readImage(tbuf){

    cv.readImage(tbuf, function(err, im){
	    try{
		if (im.width() && im.width() > 100 && im.height() && im.height() > 100){
		    //console.log('W:' + im.width());
		    //console.log('H:' + im.height());
		    im.detectObject(cv.FACE_CASCADE, {}, function(err, faces){
			    if(faces){
				for (var i=0;i<faces.length; i++){
				    var x = faces[i];
				    im.ellipse(x.x + x.width/2, x.y + x.height/2, x.width/2, x.height/2);
				}
				if(mode == 'auto'){
				    autoPilot(faces);
				}
			    }
			    
			    window.show(im);
			    window.blockingWaitKey(0, 10);		
			});
		    

		}
	    } catch(eer) {
		console.log('ERROR3: ' + eer);
	    }
	});
}

function autoPilot(faces){
    if (stage == 'search'){
	searchTarget(faces);
    } else if (stage == 'coogle'){
	coogle();
    }

}



function abs_x(x){
    return Math.abs(x - 428);
}

function abs_y(y){
    return Math.abs(y - 240);
}

function searchTarget(faces){
    var face = {
	x: 0,
	y: 0,
	w: 0,
	h: 0
    };
    for (var i=0; i<faces.length; i++){
	var x = faces[i];
	if (abs_x(face.x) > abs_x(x.x) && x.width < 200){
	    face.x = x.x;
	    face.y = x.y;
	    face.w = x.width;
	    face.h = x.height;
	} else if (x.width > face.w){
	    //face.x = x.x;
	    //face.y = x.y;
	    //face.w = x.width;
	    //face.h = x.height;
	}
    }
    var x_s = false;
    if (face.x > 448){
	drone.right(3);
    } else if (face.x < 408){
	drone.left(3);
    } else {
	x_s = true;
    }
    var y_s = false;
    if (face.y > 380){
	drone.down(1);
    } else if (face.y < 340){
	drone.up(1);
    } else {
	y_s = true;
    }

    var z_s = false;
    if (face.w > 50){
	drone.backward(3);
    } else if (face.w < 40){
	drone.forward(3);
    } else {
	z_s = true;
    }
    if (x_s && y_s && z_s){
	drone.stop();
	doCoogle();
    } else {
	stopAfter();
    } 
    
    //console.log('X:' + face.x + ' Y:' + face.y + ' W:' + face.w + 'H:' + face.h);
}
function coogle(){


}

function doCoogle(){
    stage = 'coogle';
    drone.forward(25);
    setTimeout(function(){
	    drone.stop();
	}, 5000);
    setTimeout(function(){
	    drone.land();
	}, 7000);
}

function stopAfter(){
    setTimeout(function(){
	    drone.stop();
	}, 600);
}

function startFfmpeg(){
    console.log('ffmpeg start');
    var count = 0;
    var buf;
    ffmpeg = spawn('ffmpeg', ['-protocol_whitelist', 'file,udp,rtp', '-i', 'bebop.sdp', '-f', 'image2', '-r', '1', '-updatefirst', '1', 'pipe:1']);
    ffmpeg.stdout.on('data', function(bdata){
	    try{
		var thisTime = new Date().getTime();
		if ((thisTime - lastTime) < 200){
		    buf = Buffer.concat([buf, bdata], buf.length + bdata.length);
		} else {
		    if(count > 1){
			readImage(buf);
			console.log(count);
		    }
		    count ++;
		    buf = bdata;
		}
		lastTime = thisTime;
	    } catch(err){
		console.log('ERROR1: ' + err);
	    }
	});
    ffmpeg.stderr.on('data', function(bdata){
	    //console.log('ffmpeg:warn');
	});
    
}

function killFfmpeg(){
    try{
	ffmpeg.kill();
	console.log('finish');
	process.exit(1);
    } catch (ex){}
}
