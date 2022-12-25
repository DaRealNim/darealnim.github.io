function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function playSound(sound) {
	switch(sound) {
		case "piece":
			new Audio('sounds/piece'+getRandomInt(1, 8)+'.wav').play();
			break;
	}
}

function get_piece_positions(chess, piece) {
	return [].concat(...chess.board()).map((p, index) => {
		if (p !== null && p.type === piece.type && p.color === piece.color) {
		return index
		}
	}).filter(Number.isInteger).map((piece_index) => {
		const row = 'abcdefgh'[piece_index % 8]
		const column = Math.ceil((64 - piece_index) / 8)
		return row + column
	})
}

function is_between(a, b, c) {
	return (b <= a && a <= c);
}

function score_to_movestrength(score) {
	if(is_between(score, -100, -50)) {
		return "inaccuracy";
	}
	if (is_between(score, -300, -100)) {
		return "mistake";
	}
	if (score < -300)
		return "blunder";
	if (score > 30)
		return "good";
	if (score > 100)
		return "very good";
	if (score > 500)
		return "brilliant";
	return "ok";
}

function letterToPieceName(l) {
	switch (l.toLowerCase()) {
		case "p":
			return "pawn";
		case "n":
			return "knight";
		case "b":
			return "bishop";
		case "r":
			return "rook";
		case "k":
			return "king";
		case "q":
			return "queen";
	}
}

function getPieceStartingPos(piece) {  //{color, type}
	switch(piece.type) {
		case "q":
			return (piece.color == "w") ? ["d1"] : ["d8"];
		case "b":
			return (piece.color == "w") ? ["c1", "f1"] : ["d8", "f8"];
		case "n":
			return (piece.color == "w") ? ["b1", "g1"] : ["b8", "g8"];
		case "r":
			return (piece.color == "w") ? ["a1", "h1"] : ["a8", "h8"];
        default:
            return [];
	}
}

function stateObjTag(obj) {
    return obj.from.color+obj.from.type+obj.frompos[0]+obj.frompos[1]+obj.totype+obj.topos[0]+obj.topos[1];
}

function stateObjArrayTags(arr) {
    let ret = [];
    for (let i=0; i<arr.length; i++) {
        ret.push(stateObjTag(arr[i]));
    }
    return ret;
}

function comparePos(p1, p2) {
    return p1[0] == p2[0] && p1[1] == p2[1];
}

function posStringToPosArray(ps, color) {
	let line = (color == "w") ? 8-parseInt(ps.charAt(1)) : parseInt(ps.charAt(1))-1;
	let column = (color == "w") ? ps.charCodeAt(0)-97 : 8-(ps.charCodeAt(0)-96);
    return [line, column];
}