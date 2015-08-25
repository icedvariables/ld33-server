var Player = function(id, x, y, zombieTexture, name){
    this.id = id;
    this.x = x;
    this.y = y;
    this.zombieTexture = zombieTexture;
    this.name = name;
    this.score = 0;
}

Player.prototype.move = function(x, y){
    // TODO: If it becomes a problem, check for teleport/speed/etc hacks

    this.x = x;
    this.y = y;
}

Player.prototype.getSendableObject = function(){
    return {id:this.id, x:this.x, y:this.y, zombieTexture:this.zombieTexture, name:this.name, score:this.score};
}

module.exports.Player = Player;
