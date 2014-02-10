window.onload = function(){
	canvas = document.getElementById("canvas");
	c = canvas.getContext("2d");
	
	start_game = false;
	initialize_game();
	setInterval(mainloop, 25);
}

function initialize_game(){
	left_pressed = false;
	right_pressed = false;

	direction = 1;
	level = 0;
	score = 0;
	alive = true;
	invader_count = 0;
	game_over = false;
	pause = false;
    lives = 3;

	img = new Image();
	Invader1 = new Image();
	Invader2 = new Image();
	Invader3 = new Image(); 
	explosion_green = new Image();
	explosion_blue = new Image();
	explosion_purple = new Image();
    explosion_ship = new Image();

	img.src = "Ship.png";
	explosion_green.src = "explosion_green.png";
	explosion_blue.src = "explosion_blue.png";
	explosion_purple.src = "explosion_purple.png";
    explosion_ship.src = "Explosion.png";


	// Alien images are from Flarnie M on opengameart.org
	Invader1.src = "Alien.png";
	Invader2.src = "Alien2.png";
	Invader3.src = "Alien3.png";
	
	ship = new Player();
	score_obj = new Info();
	game_over_obj = new GameOver();
	start_game_obj = new StartGame();
	if (start_game)
		big_list = [ship, score_obj];
	else
		big_list = [start_game_obj]
	/* Explosions are put in a separate list because we want
	  * them to be drawn on top of everything else. 
	  */
	explosion_list = [];
}

function create_invaders(){
	var init_x = 30;
	var init_y = 30;
	for (var i = 0; i < 8; i++) {
		x = new Invader(init_x, init_y + 100, null, 1);
		x2 = new Invader(init_x, init_y + 50, x, 2);
		x3 = new Invader(init_x, init_y, x2, 3);
		big_list.push(x);
		big_list.push(x2);
		big_list.push(x3);
		init_x += 50;
		invader_count += 3;
	}
}

function mainloop(){
	c.fillStyle="Black"
	c.fillRect(0,0,canvas.width,canvas.height);
	update_direction(); // update direction of invaders if required
	if (invader_count == 0 && pause == false && lives > 0 && start_game){
		level++;
		direction = 1;
		big_list.push(new LevelScreen());
		pause = true;
	}

	/* iterate through list of objects backwards to avoid 
	 * problems with iteration after removing objects.
	 */
	for (i = big_list.length-1; i >= 0; i--) {
		object = big_list[i];
		object.move();
		object.draw();

		if (object.name == "Bullet") {
			for (i2=0; i2<big_list.length; i2++) {
				object2 = big_list[i2];
				if (object2.name == "Invader" && collision(object, object2)) {
					score += object2.score;
					invader_count--;

					for (var i3=0;i3<big_list.length;i3++){
						var i3_obj = big_list[i3];
						if (i3_obj.name == "Invader" && i3_obj.below == object2){
							i3_obj.below = null;
						}
					}

                    explosion_list.push(new Explosion(object2.x+4*direction, object2.y-5, object2.type));
					_remove(object);
					_remove(object2);
					break;
				}
			}
		}

		else if (object.name == "InvaderBullet" || object.name == "Invader") {
			for (i2=0; i2<big_list.length; i2++) {
				object2 = big_list[i2];
				if (object2.name == "Player" && collision(object, object2)) {
                    _remove(object);
                    lives--;
                    if (object.name == "Invader")
                    	invader_count--;
                    var e = new Explosion(object2.x, object2.y, 4);
                    explosion_list.push(e);
                    if (lives == 0){
					   end_game();
					   i=0; // Reset the mainloop counter
                    }
					break;
				}
			}
		}
	}

    // Now do the explosions.
    for (var e=0;e<explosion_list.length;e++){
            var e_obj = explosion_list[e];
            e_obj.move();
            e_obj.draw();
    }
}

window.addEventListener("keydown", handler, true);
window.addEventListener("keyup", handler2, true);

function Player(){
	this.name="Player";
	this.h = 36;
	this.s = 10; // movement speed
	this.x = canvas.width/2-this.h/2;
	this.y = canvas.height - this.h;
	this.move = function(){
		if (left_pressed){
			if (this.x > 0 )
				this.x -= this.s;	
		} 
		if (right_pressed){
			if (this.x < canvas.width-this.h)
				this.x += this.s;
		}
	}
	this.draw = function(){
		c.drawImage(img, this.x, this.y); 
	}
}

function _remove(x){
	big_list.splice(big_list.indexOf(x), 1);	
}

function _remove_explosion(x){
    explosion_list.splice(explosion_list.indexOf(x), 1);
}

function Bullet(){
	this.name="Bullet";
	this.s = 7; // movement speed
	this.h = 15;
	this.x = ship.x + this.h;
	this.y = ship.y;
	this.color="red"
	this.move = function(){
		this.y -= this.s;
		if (this.y < 0){
			_remove(this);
		}
	}
	this.draw = function(){
		c.fillStyle=this.color;
		c.fillRect(this.x, this.y, 5, this.h);
	}
}

function InvaderBullet(x,y,type){
	this.name = "InvaderBullet";
	this.s = 5;
	this.h = 10;
	this.x = x;
	this.y = y;
	this.type = type;
	if (type==1) this.color = "#84F476"; // green
	else if (type==2) this.color = "#76C6F4"; // blue
	else this.color = "#E176F4"; //purple
	this.move = function(){
		this.y += this.s;
		if (this.y > canvas.height){
			_remove(this);
		}
	}
	this.draw = function(){
		c.fillStyle=this.color;
		c.fillRect(this.x, this.y, 5, this.h);
	}
}

function Invader(x, y, below, type){
	this.name = "Invader";
	this.x = x;
	this.y = y;
	this.s = 1 + level; // initial movement speed
	this.h=40;
	this.type = type;
	if (this.type == 1)
		this.img = Invader1;
	else if (this.type == 2)
		this.img = Invader2;
	else
		this.img = Invader3;

	this.move_down = false;
	this.c = 0;
	/* The invader below you. To find out who's above you, loop through all
	 * invaders and see who has their below set to you.
	 */
	this.below = below;
	this.score = 10 * this.type;

	this.move_all_down = function(){ // move down and speed up
		for (var obj1=0; obj1<big_list.length;obj1++){
			var o = big_list[obj1];
			if (o.name == "Invader"){
				o.s += 0.5; // speed up the invaders
				o.move_down =true;
			}
		}
	}
	this.draw = function(){
		c.drawImage(this.img, this.x, this.y);
	}
	this.move = function(){		
		if (this.move_down){
			this.y += 5;
			if (this.c > 4){
				this.move_down = false;
				this.c = 0;
			}
			this.c += 1;
		}
		else{
			this.x += direction * this.s;
		}

		if (this.y > canvas.height-this.h){
			end_game();
		}

		// Every now and then spit out a bullet
		if (this.below == null && Math.random()< 0.005){
			var start_x = this.x+this.h/2;
			var start_y = this.y+this.h;
			big_list.push(new InvaderBullet(start_x, start_y, this.type));
		}
	}
}

function Explosion(x,y, type){
    this.x = x;
    this.y = y;
    this.c = 0;
    this.sc = 1;
    this.get_img = function(type){
        if (type == 1)
            return explosion_green;
        if (type == 2)
            return explosion_blue;
        if (type == 3)
            return explosion_purple;
        return explosion_ship;
    }
    this.img = this.get_img(type)
    this.draw = function(){
        var scale_width = explosion_green.width * this.sc;
        var scale_height = explosion_green.height * this.sc;
        c.drawImage(this.img, this.x, this.y, scale_width, scale_height);
    }
    this.move = function(){
        if (this.c > 2){
            _remove_explosion(this);
            this.c = 0;
        }
        this.c += 1;
        this.sc += 0.08; // Increase the scale
        this.x -= 1.8; // Offset the increasing scale
        this.y -= 0.4;
    }
}


function Info(){
	this.color = "white";
	this.draw = function(){
		c.fillStyle=this.color;
		c.font = "16px pixelfont";
		this.text = "Score: " + score;
		var level_text = "Level: "+ level;
		c.textAlign = "left";
		c.fillText(this.text, 0, 16);

        var lives_text = "Lives: " + lives;
        c.textAlign = "center";
        c.fillText(lives_text, canvas.width/2,16);

		c.textAlign = "right";
		c.fillText(level_text, canvas.width,16);
	}
	this.move = function(){}
}

function GameOver(){
	this.text = "GAME OVER";
	this.text2 = "Press ENTER to restart";

	this.draw = function(){
		// Final score
		c.textAlign = "center";
		c.fillStyle = "white";
		c.font = "20px pixelfont";
		// final score
		c.fillText("Final score: " + score, canvas.width/2, 20);
		// GAME OVER
		c.font = "50px pixelfont";
		c.fillText(this.text, canvas.width/2, canvas.height/2);
		// enter to continue
		c.font = "30px pixelfont";
		c.fillText(this.text2, canvas.width/2, canvas.height/2+130)
	}
	this.move = function(){};
}

function LevelScreen(){
	this.size = 50;
	this.c = 0;
	this.draw = function(){
		c.fillStyle="white";
		c.textAlign = "center";
		c.font = this.size + "px pixelfont";
		c.fillText("Level " + level, canvas.width/2, canvas.height/2);
	}
	this.move = function(){
		if (this.c > 25){
			_remove(this);
			create_invaders();	
			this.c = 0;
			pause = false;
		}
		this.c += 1;
	}
}

function StartGame(){
	this.draw = function(){
		c.fillStyle="white";
		c.textAlign="center";
		c.font = "bold 50px pixelfont";
		c.fillText("press ENTER to play", canvas.width/2, canvas.height/2);
	}
	this.move=function(){}
}

function update_direction(){
	for (var index = 0;index<big_list.length;index++){
		var obj = big_list[index];
		if (obj.name == "Invader"){
			var hit_left = false;
			var hit_right = false;
			var new_x = obj.x + direction * obj.s;

			if (!hit_left && new_x < 0){
				hit_left = true;
			}
			else if (!hit_right && new_x > canvas.width-obj.h){
				hit_right = true;
			}

			if (hit_right || hit_left){
				direction = -direction;
				hit_right = false;
				hit_left = false;
				obj.move_all_down();
				return;
			}
		}
	}
}

function collision(o1,o2){
	// Sides of the object
	var left1 = o1.x;
	var right1 = o1.x + o1.h;
	var top1 = o1.y;
	var bottom1 = o1.y + o1.h;

	var left2 = o2.x;
	var right2 = o2.x + o2.h;
	var top2 = o2.y;
	var bottom2 = o2.y + o2.h;

	return !(bottom1 <= top2 || 
			 top1 >= bottom2 ||
			 right1 <= left2 ||
			 left1 >= right2);
}

function end_game() {
	alive = false;
	big_list = [game_over_obj]
	game_over= true;
}

// Handler for key down
function handler(event){

	var key = event.which;

	if (key == 37){ // left
		left_pressed = true;
	}
	if (key  == 39){ // right
		right_pressed = true;
	}

	if (key == 13){
		if (!start_game){
			start_game=true;
			big_list = [ship, score_obj];
		}

		if (!alive)
			initialize_game();
	}
}

// Handler for key up
function handler2(event){
	var key = event.which;
	if (key == 37){ // left
		left_pressed = false;
	}
	if (key  == 39){ // right
		right_pressed = false;
	}

	if (key == 32 && alive && start_game){ // space
		var bullet = new Bullet();
		big_list.push(bullet);
	}	

}
