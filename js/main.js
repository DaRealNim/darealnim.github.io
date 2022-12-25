var sf;
var board;
var $board = $('#board')

var stockfish_depth = 2;
var stockfish_skill = 0;
var oldscore = 0;
var score = 0;

var canplay = false;
var isBookPhase = true;
var gaveClue = false;

var lastplayermove = "";
var bestmoveforplayer = "";
var lastbestmoveforplayer = "";
var lbmfp_description = "";
var lbmfp_piece = "";
var stockfish_todo = "";
var nxtCoachMove = null;
var playercolor = ""

const chess = new Chess();
$("#cluebutton").hide();
$("#whitechoicebutton").hide();
$("#blackchoicebutton").hide();
$("#randomchoicebutton").hide();
$("#prevbestmovebutton").hide();
$("#evaluatebutton").hide();

const colorChosenEvent = new Event('colorChosen');
const stockfishReadyEvent = new Event('stockfishReady');

Stockfish().then((engine) => {
    sf = engine;
    document.dispatchEvent(stockfishReadyEvent);
});

function updateSkillLevel() {
    let value = document.getElementById("skill").value;
    stockfish_skill = value;
    $("#skillUI").html(value+" / 20");
}

function updateSearchDepth() {
    let value = document.getElementById("depth").value;
    stockfish_depth = value;
    $("#depthUI").html(value+" / 25");
}

function findBookOpening() {
    let currpgn = chess.pgn();
    let result = openingsdict.find(op => op.pgn == currpgn);
    if (typeof result !== "undefined") {
        return result.name;
    }
    return "";
}

function giveclue() {
    if (bestmoveforplayer != "") {
        let start = bestmoveforplayer.slice(0, 2);
        let end = bestmoveforplayer.slice(2, 4);
        let piece = letterToPieceName(board.position()[start].charAt(1));
        $board.find('.square-' + start).addClass('highlight-bestmove')    
        if (!gaveClue) {
            chatMsg("You should move your "+piece+".");
            $("#cluebutton").html("Where ?");
            gaveClue = true;
        } else {
            chatMsg("Move your "+piece+" here.");
            $board.find('.square-' + end).addClass('highlight-bestmove');
            $("#cluebutton").hide();
        }
    }
}

function givePrevBest() {
    let start = lastbestmoveforplayer.slice(0, 2);
    let end = lastbestmoveforplayer.slice(2, 4);
    let piece = letterToPieceName(lbmfp_piece);
    $board.find('.square-' + start).addClass('highlight-lastbest');
    $board.find('.square-' + end).addClass('highlight-lastbest');
    chatMsg("You should've moved your "+piece+" this way.");
    $("#prevbestmovebutton").hide();
}

function giveEval() {
    if (is_between(score, -100, 100)) {
        chatMsg("The position is currently relatively equal.");
    }
    if (is_between(score, -300, -100)) {
        chatMsg("I have the advantage.");
    }
    if (is_between(score, -500, -300)) {
        chatMsg("I'm currently winning.");
    }
    if (score < -500) {
        chatMsg("There's not much hope for you right now.");
    }
    if (is_between(score, 100, 300)) {
        chatMsg("You're in favor.");
    }
    if (is_between(score, 300, 500)) {
        chatMsg("The game is yours.");
    }
    if (score > 500) {
        chatMsg("You're crushing me.");
    }
}

function setColor(color) {
    if (color == "random")
        color = (getRandomInt(0, 1) == 0) ? "white" : "black";
    chatMsg("Alright, you'll play "+color+".");
    board.orientation(color);
    board.start(true);
    $("#whitechoicebutton").hide();
    $("#blackchoicebutton").hide();
    $("#randomchoicebutton").hide();
    $("#cluebutton").show();
    playercolor = color;
    document.dispatchEvent(colorChosenEvent);
}

function loadFEN() {
    let fen = $("#feninput").val()
    chess.load(fen);
    board.position(fen);
}

board = ChessBoard('board', {
    draggable: true,
    
    onDragStart: (src, piece, position, orientation) => {
        let legalmoves = chess.moves({square: src, verbose: true});
        legalmoves.forEach((m) => $('.square-'+m.to).prepend('<div class="dot"/>'));
    },

    onDrop: (src, target, piece, newpos, oldpos, orientation) => {
        if (canplay) {
            let ispromotion;
            if (playercolor == "white")
                ispromotion = (piece.charAt(1) == 'P' && src.charAt(1) == '7' && target.charAt(1) == '8');
            else
                ispromotion = (piece.charAt(1) == 'p' && src.charAt(1) == '2' && target.charAt(1) == '1');
            let move;
            move = chess.move({from: src, to: target, promotion: ispromotion ? $("#promote").val() : ""});
            if (move == null) {
                $('div.dot').remove();
                return "snapback";
            }
            $("#prevbestmovebutton").hide();
            if (isBookPhase) {
                let bookmove = findBookOpening();
                if (bookmove == "") {
                    isBookPhase = false;
                } else {    
                    logBookMove(bookmove, true, analyzeboard(chess));
                }
            }
            
            canplay = false
            lastplayermove = move;
            postMove(move, board, chess, $board);
            stockfish_todo = "evaluate_player_move";
            sf.postMessage("position fen " + chess.fen());
            sf.postMessage("setoption name Skill Level value 20");
            sf.postMessage("go depth 15");
            $('div.dot').remove();
        } else {
            $('div.dot').remove();  
            return "snapback";
        }
        
    },

});


document.addEventListener('stockfishReady', (e) => {
    sf.addMessageListener((line) => {
        if (line.includes("info")) {
            if (stockfish_todo == "evaluate_player_move") {
                let lline = line.split(" ");
                score = -1 * parseInt(lline[lline.indexOf("cp")+1])
            }
            return;
        }
    
        if (line.includes("bestmove")) {
            if (stockfish_todo == "evaluate_player_move") {
                board.position(chess.fen());
                // console.log("    [scoreanalysis] last move : " + (score-oldscore));
                if (!isBookPhase) {
                    logMove(lastplayermove, bestmoveforplayer == lastplayermove.from+lastplayermove.to ? "best move" : score_to_movestrength(score-oldscore), chess);
                }
                if (score-oldscore <= -50 && !isBookPhase)
                    $("#prevbestmovebutton").show();
                // console.log("    [scoreanalysis] score : " + score);
                // console.log("    [analysis] actual best move : "+line.split(" ")[1]);
                oldscore = score;
                stockfish_todo = "play";
                sf.postMessage("setoption name Skill Level value "+stockfish_skill);
                sf.postMessage("go depth "+stockfish_depth);
                return;
            }
    
            if (stockfish_todo == "play") {
                // console.log("    [play] "+line)
                let move = line.split(" ")[1];
                move = move.slice(0, 2) + "-" + move.slice(2, 4);
                if (move == null)
                    return
                nxtCoachMove = chess.move(move, { sloppy: true });
                board.position(chess.fen());
                // console.log(nxtCoachMove);
                if (isBookPhase) {
                    let bookmove = findBookOpening();
                    if (bookmove == "") {
                        isBookPhase = false;
                    } else {
                        logBookMove(bookmove, false, analyzeboard(chess));
                    }
                }
                $("#feninput").val(chess.fen())
                sf.postMessage("position fen " + chess.fen());
                stockfish_todo = "find_best_player_move";
                sf.postMessage("setoption name Skill Level value 20");
                sf.postMessage("go depth 15");
                return;
            }
    
            if (stockfish_todo == "find_best_player_move") {
                let move = line.split(" ")[1];
                // console.log("    [analysis] best for player is "+move);
                lastbestmoveforplayer = bestmoveforplayer;
                if(lastbestmoveforplayer != "") {
                    console.log("Last best move for player was "+lastbestmoveforplayer);
                    let pm = chess.undo()
                    let pm2 = chess.undo()
                    let m = chess.move(lastbestmoveforplayer, {sloppy: true});
                    if (m != null) {
                        lbmfp_piece = m.piece;
                        console.log(lbmfp_piece);
                        chess.undo();
                    }
                    chess.move(pm2);
                    chess.move(pm);
                }
                bestmoveforplayer = move;
                // let tmp1 = chess.undo()
                // let tmp2 = chess.undo()
                // if (tmp1)
                // let bm = chess.move(move, {sloppy : true});
                // if (bm != null)
                //     lastbestmovedescription = moveDescription(bm, analyzeboard(chess));
                // chess.undo()
                // chess.move(tmp2);
                // chess.move(tmp1);
                $board.find('.' + 'square-55d63').removeClass('highlight-bestmove');
                $board.find('.' + 'square-55d63').removeClass('highlight-lastbest');
                $("#cluebutton").html("Get a hint");
                $("#cluebutton").show();
                
                gaveClue = false;
                stockfish_todo = "";
                board.move(nxtCoachMove.from + "-" + nxtCoachMove.to);
                postMove(nxtCoachMove, board, chess, $board);
                canplay = true;
                return;
            }
        }
    });

    $(window).resize(board.resize)
    sf.postMessage("uci");
    sf.postMessage("ucinewgame");
});

$("skill").val(5);
$("depth").val(3);
updateSkillLevel();
updateSearchDepth();

document.addEventListener('colorChosen', (e) => {
    $("#evaluatebutton").show();
    $("#feninput").val(chess.fen())
    if(playercolor == "black") {
        stockfish_todo = "play";
        sf.postMessage("setoption name Skill Level value "+stockfish_skill);
        sf.postMessage("go depth "+stockfish_depth);
    } else {
        chatMsg("Go ahead.");
        canplay = true;
    }
});

// sf.postMessage("position fen "+startfen);
chatMsg("Hello! I will be your chess coach today.");
setTimeout(() => {
    chatMsg("How about a little game? Which side do you want to play?");
    $("#whitechoicebutton").show();
    $("#blackchoicebutton").show();
    $("#randomchoicebutton").show();
}, 1000);
