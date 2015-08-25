module.exports = {
    getPlayerById:getPlayerById,
    getHumanById:getHumanById
}

var util = require("util");
var io = require("socket.io");
var uuid = require("node-uuid");
var Player = require("./player.js").Player;
var Human = require("./human.js").Human;

var socket, clients = {}, players = [], humans = [];

var serverPort = process.env.OPENSHIFT_NODEJS_PORT || 4200
var serverIp = process.env.OPENSHIFT_NODEJS_IP || "127.0.0.1"

function main(){
    socket = io.listen(serverPort);
    util.log("Listen on port: " + serverPort);

    setInterval(checkForCollisions, 2);
    setEventHandlers();
}

function setEventHandlers(){
    socket.on("connection", onConnect);
}

function onConnect(client){
    util.log("Client connected: " + client.id);

    clients[client.id] = client;

    client.on("what is my id", onWhatIsMyId);
    client.on("disconnect", onDisconnect);
    client.on("new player", onNewPlayer);
    client.on("move player", onMovePlayer);
    client.on("new human", onNewHuman);
    client.on("move human", onMoveHuman);
    client.on("shoot", onShoot);
}

function onWhatIsMyId(){
    console.log("Client requesting their id: " + this.id);

    socket.emit("your id", {id:this.id});
}

function onDisconnect(){
    util.log("Client disconnected: " + this.id);

    delete clients[this.id];

    var removePlayer = getPlayerById(this.id);

    if(removePlayer){
        players.splice(players.indexOf(removePlayer), 1); // Remove removePlayer from players array

        this.broadcast.emit("remove player", {id: this.id});

        var h = humans;
        util.log("Killing all humans belonging to the disconnected client of which there are: " + h.length);
        for(var i = 0; i < h.length; i++){
            util.log(i + ": This id: " + this.id + " human's owner id: " + h[i].playerId);
            if(h[i].playerId == this.id){
                killHuman(h[i]);
            }
        }

        if(players.length == 0) // quick hack because everything broke
            humans = [];        // Remind me to not do a multiplayer LD again

        console.log(humans);
    }else{
        util.log("Player not found: " + this.id);
    }
}

function onNewPlayer(data){
    util.log("New player id:" + this.id + ", name:" + data.name + " x:" + data.x + ", y:" + data.y + ", zombieTexture:" + data.zombieTexture + ")");

    var player = new Player(this.id, data.x, data.y, data.zombieTexture, data.name);

    this.broadcast.emit("new player", player.getSendableObject());

    util.log("Send all existing players to the new player");
    for(var i = 0; i < players.length; i++){
        this.emit("new player", players[i].getSendableObject());
    }
    util.log("Send all existing humans to the new player");
    for(var i = 0; i < humans.length; i++){
        util.log("SENDING EXISTING HUMANS TO NEW PLAYER");
        console.log(humans[i]);
        this.emit("new human", humans[i].getSendableObject());
    }

    players.push(player);

    console.log(players);
}

function onMovePlayer(data){
    var player = getPlayerById(this.id);

    if(player){
        player.move(data.x, data.y);

        this.broadcast.emit("move player", {id:player.id, x:player.x, y:player.y});
    }else{
        util.log("Player not found: " + this.id);
    }
}

function onMoveHuman(data){
    var human = getHumanById(data.id);

    if(human){
        //util.log("Moving to x: " + data.x + ", y: " + data.y);
        human.move(data.x, data.y);
        for(var id in clients){
            if(!clients.hasOwnProperty(id))
                continue;

            if(id != human.playerId)
                clients[id].emit("move human", human.getSendableObject());
        }
    }
}

function onNewHuman(data){
    util.log("New human: " + data.id);

    if(humans.length > 3 + (players.length ^ 2) || humans.length > 75){ // If there are already too many humans tell the client to the kill the newly created human
        util.log("Human population too large: " + humans.length + " killing newly created human");
        this.emit("kill human", {id:data.id, noBlood:true});
        return;
    }

    var human = new Human(data.id, data.x, data.y, data.humanTexture, data.playerId);
    humans.push(human);

    this.broadcast.emit("new human", human.getSendableObject());
}

function onShoot(data){
    var player = data.player;
    var human = data.human;

    if(player && human){
        util.log(human.id + " is shooting at: " + player.id);

        socket.sockets.emit("shoot", data);
    }
}

function checkForCollisions(){
    for(var i = 0; i < players.length; i++){
        var player = players[i];
        for(var j = 0; j < humans.length; j++){
            var human = humans[j];

            if(Math.abs(player.x - human.x) < 100 && Math.abs(human.y - player.y) < 10){
                killHuman(human);
                player.score++;
                var c = clients[player.id];
                if(c)
                    c.emit("new score", player.getSendableObject());
            }
        }
    }
}

function killHuman(human){
    util.log("Killing human: " + human.id);

    humans.splice(humans.indexOf(humans), 1);

    setTimeout(function(h){
        socket.sockets.emit("kill human", h.getSendableObject());
    }, 0, human);
}

function getPlayerById(id){
    for(var i = 0; i < players.length; i++){
        if(players[i].id == id)
            return players[i];
    }
    return false;
}

function getHumanById(id){
    for(var i = 0; i < humans.length; i++){
        if(humans[i].id == id)
            return humans[i];
    }
    return false;
}


main();
