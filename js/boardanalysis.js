function check(line, column, fromline, fromcolumn, board, boardstate, piece) {
    if (line < 0 || line >= 8 || column < 0 || column >= 8)
        return true;
    let c = board[line][column];
    if (typeof c === "undefined")
        return true;
    if (c != null) {
        let ob = {from: piece, frompos: [fromline, fromcolumn], totype: c.type, topos: [line, column], frompiececode: piece.type+line+column, topiececode: c.type+line+column};
        if (c.color != piece.color)
            boardstate.threats.push(ob);
        else
            boardstate.defenses.push(ob);
        return true;
    }
    return false;
}

function checkLines(board, boardstate, fromline, fromcolumn, piece) {
    //check up the file
    for(let line = fromline-1; line >= 0; line--) {
        if (check(line, fromcolumn, fromline, fromcolumn, board, boardstate, piece))
            break;
    }

    //check down the file
    for(let line = fromline+1; line < 8; line++) {
        if (check(line, fromcolumn, fromline, fromcolumn, board, boardstate, piece))
            break;
    }

    //check left of the line
    for(let column = fromcolumn-1; column >= 0; column--) {
        if (check(fromline, column, fromline, fromcolumn, board, boardstate, piece))
            break;
    }

    //check right of the line
    for(let column = fromcolumn+1; column < 8; column++) {
        if (check(fromline, column, fromline, fromcolumn, board, boardstate, piece))
            break;
    }
}

function checkDiagonals(board, boardstate, fromline, fromcolumn, piece) {
    //up left
    for(let line = fromline-1, column = fromcolumn-1; line >= 0 && column >= 0; line--, column--) {
        if (check(line, column, fromline, fromcolumn, board, boardstate, piece))
            break;
    }

    //up right
    for(let line = fromline-1, column = fromcolumn+1; line >= 0 && column < 8; line--, column++) {
        if (check(line, column, fromline, fromcolumn, board, boardstate, piece))
            break;
    }

    //down left
    for(let line = fromline+1, column = fromcolumn-1; line < 8 && column >= 0; line++, column--) {
        if (check(line, column, fromline, fromcolumn, board, boardstate, piece))
            break;
    }

    //down right
    for(let line = fromline+1, column = fromcolumn+1; line < 8 && column < 8; line++, column++) {
        if (check(line, column, fromline, fromcolumn, board, boardstate, piece))
            break;
    }
}

function analyzeboard(chess) {
    let board = chess.board();
    let boardstate = {
        threats: [],
        defenses: [],
        pins: [],
        forks: [],
    };
    for(let line = 0; line < 8; line++) {
        for(let column = 0; column < 8; column++) {
            let piece = board[line][column];
            if (piece == null)
                continue;
            switch(piece.type) {
                case "p":
                    let cy = piece.color == "w" ? line-1 : line+1;
                    check(cy, column-1, line, column, board, boardstate, piece);
                    check(cy, column+1, line, column, board, boardstate, piece);
                    break;

                case "r":
                    checkLines(board, boardstate, line, column, piece);
                    break;

                case "b":
                    checkDiagonals(board, boardstate, line, column, piece);
                    break;

                case "q":
                    checkLines(board, boardstate, line, column, piece);
                    checkDiagonals(board, boardstate, line, column, piece);
                    break;

                case "n":
                    check(line-1, column-2, line, column, board, boardstate, piece);
                    check(line-2, column-1, line, column, board, boardstate, piece);
                    check(line-2, column+1, line, column, board, boardstate, piece);
                    check(line-1, column+2, line, column, board, boardstate, piece);
                    check(line+1, column+2, line, column, board, boardstate, piece);
                    check(line+2, column+1, line, column, board, boardstate, piece);
                    check(line+2, column-1, line, column, board, boardstate, piece);
                    check(line+1, column-2, line, column, board, boardstate, piece);
                    break;

                case "k":
                    for(let l = line-1; l <= line+1; l++) {
                        for(let c = column-1; c <= column+1; c++) {
                            if (l != line && c != column)
                                check(l, c, line, column, board, boardstate, piece);
                        }
                    }
                    break;
            }
        }
    }

    return boardstate;
}