var Human = function(id, x, y, humanTexture, playerId){
    this.id = id;
    this.x = x;
    this.y = y;
    this.humanTexture = humanTexture;
    this.playerId = playerId;
}

Human.prototype.move = function(x, y){
    this.x = x;
    this.y = y;
}

Human.prototype.getSendableObject = function(){
    return {id:this.id, x:this.x, y:this.y, humanTexture:this.humanTexture, playerId:this.playerId};
}

module.exports.Human = Human;
