var oldboardstate = {
    threats: [],
    defenses: [],
    pins: [],
    forks: [],
};

var lastbookmovename = "";

function chatMsg(msg) {
    $("#chatbuttons").before("> "+msg+"<br>");
    // $("#chat").append("> "+msg+"<br>");
    var elem = document.getElementById('chat');
    elem.scrollTop = elem.scrollHeight;
}

function sayRandomPhrase() {
    let phrase = arguments[getRandomInt(0, arguments.length-1)];
    if (phrase != "")
        chatMsg(phrase);
}

function logBookMove(move, isplayerturn, boardstate) {
    if (move == lastbookmovename)
        return;
    if (isplayerturn) {
        sayRandomPhrase(
            "That's the "+move+".",
            "The "+move+". Interesting.",
            "The "+move+".",
        );
    } else {
        sayRandomPhrase(
            "I'm playing the "+move+".",
            "Here's the "+move+".",
            "The "+move+"."
        );
    }

    oldboardstate = boardstate;
    lastbookmovename = move;

}

function moveDescription(move, boardState) {

    console.log("========================");

    console.log(boardState, oldboardstate);

    let descs = [];

    let newStates = {
        threats: [],
        defenses: [],
        pins: [],
        forks: [],
    };
    for (const [key, value] of Object.entries(newStates)) {
        newStates[key] = boardState[key].filter(x => !stateObjArrayTags(oldboardstate[key]).includes(stateObjTag(x)));
    }
    oldboardstate = boardState;

    console.log(newStates);

    //check for developpement
    // console.log(getPieceStartingPos({type: move.piece, color: move.color}));
    // console.log(move);
    if(getPieceStartingPos({type: move.piece, color: move.color}).includes(move.from)) {
        descs.push("Developping the "+letterToPieceName(move.piece));
    }

    if(move.san == "O-O" || move.san == "o-o") {
        descs.push("Castling kingside");
    }

    if(move.san == "O-O-O" || move.san == "o-o-o") {
        descs.push("Castling queenside");
    }

    // console.log(posStringToPosArray(move.to))

    for(let i = 0; i < newStates.threats.length; i++) {
        if(newStates.threats[i].from.color == move.color && comparePos(newStates.threats[i].frompos, posStringToPosArray(move.to, move.color))) {
            descs.push("Attacking my "+letterToPieceName(newStates.threats[i].totype) + " with your "+letterToPieceName(newStates.threats[i].from.type));
        }
    }

    for(let i = 0; i < newStates.defenses.length; i++) {
        if(newStates.defenses[i].from.color == move.color
            && comparePos(newStates.defenses[i].frompos, posStringToPosArray(move.to, move.color))
            && (boardState.threats.reduce((prev, current) => prev.concat(current.frompiececode), [])).includes(newStates.defenses[i].topiececode)
        ) {
            descs.push("Defending your "+letterToPieceName(newStates.defenses[i].totype) + " with your "+letterToPieceName(newStates.defenses[i].from.type))
        }
    }
      

    //TODO check for winning captures

    //TODO check for forks

    //TODO check for pins

    //TODO check for skewers

    if(descs.length == 0)
        return "";
    if(descs.length == 1)
        return descs[0]+".";

    output = "";
    for (let i = 0; i < descs.length-1; i++) {
        output += ((i==0) ? descs[i] : descs[i].toLowerCase()) + ", ";
    }
    output += " and " + descs[descs.length-1].toLowerCase() + ".";
    return output;
}

function postMove(move, board, chess, $board) {
	if (chess.in_check()) {
		let piece = { type: 'k', color: 'w' };
		if(move.color == "w")
			piece.color = 'b';
		let pos = get_piece_positions(chess, piece)[0];
		// console.log("CHECK AT "+pos);
		$board.find('.square-' + pos).addClass('highlight-check')
	} else {
		$board.find('.' + 'square-55d63').removeClass('highlight-check');
	}
	playSound("piece");

    if (chess.game_over()) {
        if(chess.in_checkmate())
            chatMsg("Checkmate.");
    
        if(chess.in_stalemate())
            chatMsg("That's stalemate.");
        else if (chess.in_draw())
            chatMsg("A draw.");
    }
}

function logMove(move, move_eval, chess) {
    let boardstate = analyzeboard(chess);
    switch(move_eval) {
        case "ok":
            sayRandomPhrase(
                "Hm hm. "+moveDescription(move, boardstate),
                "Sure. "+moveDescription(move, boardstate),
                "Okay. "+moveDescription(move, boardstate),
                moveDescription(move, boardstate),
            );
            break;
        case "good":
            sayRandomPhrase(
                "Good move. "+moveDescription(move, boardstate),
                "Yes. "+moveDescription(move, boardstate),
                "Alright. "+moveDescription(move, boardstate)
            );
            break;
        case "very good":
            sayRandomPhrase(
                "Excellent move. "+moveDescription(move, boardstate),
                "Very good. "+moveDescription(move, boardstate),
            );
            break;
        case "best move":
            sayRandomPhrase(
                "That's the best move. "+moveDescription(move, boardstate),
                "Exactly. "+moveDescription(move, boardstate),
                "Precisely. "+moveDescription(move, boardstate),
            );
            break;
        case "inaccuracy":
            sayRandomPhrase(
                "Ahem...",
                "Not what I thought you should play.",
                "Not what I thought you should play. But let's continue.",
                "Not the best move.",
            );
            break;
        case "mistake":
            sayRandomPhrase(
                "That was a mistake.",
                "A mistake.",
                "Watch out.",
                "Not a good move.",
            );
            break;
        case "blunder":
            sayRandomPhrase(
                "Oof.",
                "A blunder.",
                "God, no.",
                "You really should'nt have done that.",
            )
            break;
    }
}