var http = require('http');
var x = 0;
var players = [];
var balls = [];
var nouns = ['personality', 'speaker', 'instance', 'village', 'housing', 'football', 'user', 'meaning', 'operation', 'ability', 'blood', 'bedroom', 'skill', 'addition', 'newspaper', 'heart', 'world', 'drawing', 'worker', 'imagination', 'knowledge', 'understanding', 'nature', 'student', 'promotion', 'mall', 'performance', 'inflation', 'equipment', 'weakness', 'hotel', 'ad', 'person', 'currency', 'preference', 'investment', 'physics', 'maintenance', 'leadership', 'month', 'assumption', 'consequence', 'possession', 'mixture', 'perspective', 'explanation', 'buyer', 'permission', 'variety', 'wealth', 'manager', 'delivery', 'lady', 'intention', 'anxiety', 'queen', 'emphasis', 'fishing', 'loss', 'sympathy', 'oven', 'dirt', 'chemistry', 'assignment', 'farmer', 'camera', 'breath', 'economics', 'bread', 'king', 'painting', 'emotion', 'independence', 'software', 'possibility', 'funeral', 'population', 'poet', 'variation', 'hat', 'discussion', 'year', 'disk', 'university', 'alcohol', 'measurement', 'thanks', 'food', 'passion', 'quantity', 'history', 'assistance', 'elevator', 'gate', 'editor', 'apartment', 'bath', 'piano', 'definition', 'historian'];
var adjectives = ['weak', 'sudden', 'hot', 'inner', 'mad', 'lonely', 'wonderful', 'basic', 'former', 'accurate', 'automatic', 'existing', 'able', 'healthy', 'popular', 'federal', 'boring', 'nice', 'capable', 'large', 'relevant', 'willing', 'unfair', 'important', 'technical', 'pleasant', 'competitive', 'environmental', 'reasonable', 'distinct', 'angry', 'obvious', 'electronic', 'exciting', 'traditional', 'interesting', 'odd', 'sexual', 'suitable', 'eastern', 'emotional', 'rare', 'financial', 'different', 'significant', 'used', 'expensive', 'severe', 'cultural', 'critical', 'educational', 'powerful', 'careful', 'strong', 'alive', 'unhappy', 'guilty', 'responsible', 'lucky', 'friendly', 'every', 'huge', 'scared', 'civil', 'substantial', 'useful', 'famous', 'dangerous', 'afraid', 'psychological', 'happy', 'comprehensive', 'consistent', 'recent', 'cute', 'suspicious', 'unable', 'united', 'impressive', 'wooden', 'administrative', 'acceptable', 'additional', 'medical', 'hungry', 'typical', 'embarrassed', 'foreign', 'asleep', 'massive', 'sorry', 'nervous', 'numerous', 'known', 'confident', 'informal', 'visible', 'political', 'practical', 'old'];
var powerups = [];
spawnPowerUps();
var server = http.createServer(function (req, res) {
    res.end('hello');
});
server.listen(8000,'0.0.0.0');
var io = require('socket.io').listen(server);
io.on('connection', function(socket){
	players.push(new Player(socket.id));
	socket.emit('id', { id: socket.id });
	var poweruparray = [];
	for (var i = 0; i < powerups.length; ++i) {
	    poweruparray.push({x: powerups[i].getX(), y: powerups[i].getY(), size: powerups[i].getSize(), color: powerups[i].getColor()});
	}
	socket.emit('initpowers', poweruparray);
	socket.on('disconnect', function(){
		for(var i = 0; i < players.length; ++i){
			if(players[i].getId() == socket.id){
				players.splice(i,1);
			}
		}
		var array = [];
		for(var i = 0; i < players.length;++i){
			array.push({x:players[i].getX(), y:players[i].getY()});
		}
		io.sockets.emit('allplayers', array);
	});
    socket.on('keydown', function(key){
		for(var i = 0; i < players.length; ++i){
			if(players[i].getId() == key.uuid){
				players[i].keyDown(key.key);
				players[i].update();
				io.sockets.emit('moveresponse', {x: players[i].getX(),y:players[i].getY()});
			}
		}
		var array = [];
		for(var i = 0; i < players.length;++i){
		    array.push({ x: players[i].getX(), y: players[i].getY(), score: players[i].getScore(), id: players[i].getId(), name: players[i].getName() });
		}
		io.sockets.emit('allplayers', array);
    });
	socket.on('keyup', function(key){
		for(var i = 0; i < players.length; ++i){
			if(players[i].getId() == key.uuid){
				players[i].keyUp(key.key);
				players[i].update();
            }
		}
		var array = [];
		for(var i = 0; i < players.length;++i){
		    array.push({ x: players[i].getX(), y: players[i].getY(), score: players[i].getScore(), id: players[i].getId(), name: players[i].getName() });
		}
		io.sockets.emit('allplayers', array);
    });
	socket.on('mouseup', function(data){
	    var size = 20;
	    findPlayerById(socket.id);
	    findPlayerById(socket.id).loseAmmo();
	    balls.push(new Ball(Math.cos(-1 * data.theta) * 15 + findPlayerById(socket.id).getDX(), Math.sin(-1 * data.theta) * 15 + findPlayerById(socket.id).getDY(), size, data.x, data.y, socket.id));
	});
	
});

setInterval(function(){
    var arr = [];
	for(var i = 0; i < balls.length; ++i){
	    balls[i].update();
		arr.push({x: balls[i].getX(), y: balls[i].getY(), size: balls[i].getSize(), uuid: balls[i].getId()});	
		if (balls[i].getDX() == 0 && balls[i].getDY() == 0) {
		    balls.splice(i, 1);
		}
	}
	collisions();
	var array = [];
	for (var i = 0; i < players.length; ++i) {
		array.push({x:players[i].getX(), y:players[i].getY(), score: players[i].getScore(), id: players[i].getId(), name: players[i].getName()});
	}
	io.sockets.emit('allplayers', array);
	io.sockets.emit('ballupdate', arr);
	for (var i = 0; i < players.length; ++i) {
	    players[i].updatePowerups();
	    if (players[i].getScore() <= 0) {
	        players.splice(i, 1);
	    }
	}
}, 66 );

function collisions() {
    for (var j = 0; j < players.length; ++j) {
        for (var i = 0; i < balls.length; ++i) {
            if ((balls[i].getX() + 20) > (players[j].getX() - balls[i].getSize()) && (balls[i].getX() + 20) < (players[j].getX()+ players[j].getWidth())) {
                if (balls[i].getY() > (players[j].getY() - balls[i].getSize() * 2) && (balls[i].getY()  + 20)< (players[j].getY() + players[j].getHeight())) {
                    if (balls[i].getId() !== players[j].getId()) {
                        findPlayerById(balls[i].getId()).setScore(Math.floor(findPlayerById(balls[i].getId()).getScore() * 1.1));
                        players[j].setScore(players[j].getScore() -  findPlayerById(balls[i].getId()).getDamage());
                        //players[j].decScore();
                        balls.splice(i, 1);
                    }
                }
            }
        }
    }
    for (var j = 0; j < players.length; ++j) {
        for (var i = 0; i < powerups.length; ++i) {
            if(powerups[i].getX() < (players[j].getX() + players[j].getWidth()/2) && (powerups[i].getX() + powerups[i].getSize()) > (players[j].getX() - players[j].getWidth() /2 )){
                if ((powerups[i].getY() + powerups[i].getSize() * 2 - 5) > (players[j].getY()) && powerups[i].getY() < (players[j].getY() + players[j].getHeight()/2)) {
                    powerups[i].onCollide(players[j]);
                    players[j].addPowerUp(powerups[i]);
                    powerups.splice(i, 1);
                    spawnSinglePowerUp(Math.floor(Math.random() * 181));
                    var poweruparray = [];
                    for (var i = 0; i < powerups.length; ++i) {
                        poweruparray.push({ x: powerups[i].getX(), y: powerups[i].getY(), size: powerups[i].getSize(), color: powerups[i].getColor() });
                    }
                    io.sockets.emit('initpowers', poweruparray);
                }
            }
        }
    }
}
function findPlayerById(id) {
    for (var i = 0; i < players.length; ++i) {
        if (players[i].getId() == id) {
            return players[i];
        }
    }
}
function spawnPowerUps() {
    for (var i = 0; i < 180; ++i) {
        spawnSinglePowerUp(i);
    }
}
function spawnSinglePowerUp(theta) {
    var radius = Math.floor(Math.random() * 301) + Math.floor(Math.random() * 301) - 301
    radius += (Math.abs(radius)/radius) * 1;
    var random = Math.floor(Math.random() * 3);
    var scale = 25;
    if (random == 0) { //healthup
        powerups.push(new PowerUp(function (player) {
            player.setScore(player.getScore() + 20);
        }, radius * Math.cos(theta) * scale, radius * Math.sin(theta) * scale, '#ffa0a0', "health"));
    }
    else if (random == 1) { //double damage
        powerups.push(new PowerUp(function (player) {
            player.setDamage(player.getDamage() + 12);
        }, radius * Math.cos(theta) * scale, radius * Math.sin(theta) * scale, '#7f7fff', "dd"));
    }
    else if (random == 2) { //speed
        powerups.push(new PowerUp(function (player) {
            player.setSpeed(player.getSpeed() + 5);
        }, radius * Math.cos(theta) * scale, radius * Math.sin(theta) * scale, '#4B0082', "speed"));
    }
}
function spawnPowerUpsTest() {
    powerups.push(new PowerUp(function (player) {
        console.log('hit');
    }, 40, 40, '#FFF'));
}
function PowerUp(onCollide, xLoc, yLoc, color, name) {
    this.onCollide = onCollide;
    var xLoc = xLoc;
    var id = -1;
    var yLoc = yLoc;
    var startTime;
    var name = name;
    var color = color
    var size = 30;
    this.draw = function () {
        ctx.fillStyle = color;
        ctx.fillRect(xLoc, yLoc, size, size);
    }
    this.getX = function(){
        return xLoc;
    }
    this.getY = function(){
        return yLoc;
    }
    this.update = function () {
        if (new Date().getTime() - startTime > 5000) {
            findPlayerById(id).removePowerUpsById(id);
        }
    }
    this.getSize = function(){
        return size;
    }
    this.getName = function () {
        return name;
    }
    this.setId = function (n) {
        startTime = new Date().getTime();
        id = n;
    }
    this.getId = function () {
        return id;
    }
    this.getColor = function () {
        return color;
    }
}

function Ball(dx, dy, size, xLoc, yLoc, uuid) {
    var dx = dx;
    var dy = dy;
    var size = size;
    var xLoc = xLoc;
    var yLoc = yLoc;
    var uuid = uuid;
    this.getX = function () {
        return xLoc;
    };
    this.getY = function () {
        return yLoc;
    };
    this.getSize = function () {
        return size;
    };
    this.getId = function () {
        return uuid;
    };
    this.getDX = function () {
        return dx;
    }
    this.getDY = function () {
        return dy;
    }
    this.update = function () {
        xLoc += dx;
        yLoc += dy;
        if (Math.abs(dx) > 1) {
            dx *= .97;
        }
        else {
            dx = 0;
        }
        if (Math.abs(dy) > 1) {
            dy *= .97;
        }
        else {
            dy = 0;
        }
    }
}
function Player(uuid) {
    var xLoc = 6;
    var yLoc = 0;
    var dx = 0;
    var dy = 0;
    var activepowerups = [];
    var uuid = uuid;
    var width = 50;
    var name = adjectives[Math.floor(Math.random() * adjectives.length + 1)] + nouns[Math.floor(Math.random() * nouns.length + 1)];
    var height = 50;
    var speed = 7;
    var score = 100;
    var damage = 12;
    var w, a, s, d;
    this.draw = function () {
        ctx.fillStyle = "#EE0000";
        ctx.fillRect(WIDTH / 2 - width / 2, HEIGHT / 2 - height / 2, width, height);
    }
    this.keyDown = function (key) {
        if (key == 87) {  //W
            w = true;
        }
        if (key == 65) {  //A
            a = true;
        }
        if (key == 83) {  //S
            s = true;
        }
        if (key == 68) {  //D
            d = true;
        }
    }
    this.removePowerUpsById = function (id) {
        for (var i = 0; i < activepowerups.length; ++i) {
            if (activepowerups[i].getId() == id) {
                if (activepowerups[i].getName() == "health") {
                }
                if (activepowerups[i].getName() == "dd") {
                    damage -= 12;
                }
                if (activepowerups[i].getName() == "speed") {
                    speed -= 5;
                }
                activepowerups.splice(i, 1);
            }
        }
    }
    this.keyUp = function (key) {
        if (key == 87) {  //W
            w = false;
        }
        if (key == 65) {  //A
            a = false;
        }
        if (key == 83) {  //S
            s = false;
        }
        if (key == 68) {  //D
            d = false;
        }
    }
    this.update = function () {
        if (w) {  //W
            dy = -1 * speed;
        }
        if (a) {  //A
            dx = -1 * speed;
        }
        if (s) {  //S
            dy = speed;
        }
        if (d) {  //D
            dx = speed;
        }
        if (!w && !s) {
            dy = 0;
        }
        if (!a && !d) {
            dx = 0;
        }
        xLoc += dx;
        yLoc += dy;
    }
    this.updatePowerups = function () {
        for (var i = 0; i < activepowerups.length; ++i) {
            activepowerups[i].update();
        }
    }
    this.getScore = function () {
        return score;
    }
    this.setScore = function (n) {
        score = n;
    }
    this.getDamage = function () {
        return damage;
    }
    this.setDamage = function (n) {
        damage = n;
    }
    this.getX = function () {
        return xLoc;
    }
    this.getY = function () {
        return yLoc;
    }
    this.getId = function () {
        return uuid;
    }
    this.getName = function () {
        return name;
    }
    this.addPowerUp = function (pu) {
        activepowerups.push(pu);
        activepowerups[activepowerups.length - 1].setId(uuid);
    }
    this.getSpeed = function () {
        return speed;
    }
    this.setSpeed = function (n) {
        speed = n;
    }
    this.getHeight = function () {
        return height;
    }
    this.getWidth = function () {
        return width;
    }
    this.getDX = function () {
        return dx;
    }
    this.loseAmmo = function () {
        score -= 3;
    }
    this.getDY = function () {
        return dy;
    }
    this.getScore = function () {
        return score;
    }
    this.decScore = function () {
        score = Math.floor(score * .9);
    }
}
