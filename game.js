'use strict';

function Board() {
  this._DIM = 9;
  this._CENTER = Math.floor(this._DIM / 2);
  this.EMPTY = 0;
  this.BLOCK = 1;
  this.TARGET = 2;
  this.newGame();
}

Board.prototype._newBoard = function() {
  var self = this;
  var dim = self._DIM;
  var res = [];
  for (var i = 0; i < dim; i++) {
    var row = [];
    for (var j = 0; j < dim; j++) {
      row[j] = self.EMPTY;
    }
    res.push(row);
  }
  return res;
};

Board.prototype._randInt = function(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

Board.prototype._randPos = function() {
  var self = this;
  return self._randInt(0, self._DIM-1);
};

Board.prototype._putTarget = function() {
  var self = this;
  self.Target = [self._CENTER, self._CENTER];
  self.Cells[self.Target[0]][self.Target[1]] = self.TARGET;
};

Board.prototype._genTerrain = function() {
  var self = this;
  var minBlocks = Math.floor(self._DIM * self._DIM / 10);
  var blocks = self._randInt(minBlocks, minBlocks * 2);
  for (var i = 0; i < blocks; i++) {
    var row, col;
    do {
      row = self._randPos();
      col = self._randPos();
    } while (self.Cells[row][col] !== self.EMPTY);
    self.Cells[row][col] = self.BLOCK;
  }
};

Board.prototype._isValid = function(row, col) {
  var self = this;
  return row >= 0 && row < self._DIM && col >= 0 && col < self._DIM && self.Cells[row][col] === self.EMPTY;
};

Board.prototype._neighbors = function(row, col) {
  var self = this;
  var dr = [0, -1, -1, 0, 1, 1];
  var dc;
  if (row % 2 === 0) {
    dc = [-1, -1, 0, 1, 0, -1];
  } else {
    dc = [-1, 0, 1, 1, 1, 0];
  }
  var res = [];
  for (var i = 0; i < dr.length; i++) {
    var nr = row + dr[i];
    var nc = col + dc[i];
    if (self._isValid(nr, nc)) {
      res.push([nr, nc]);
    }
  }
  return res;
};

Board.prototype.newGame = function() {
  var self = this;
  self.Cells = self._newBoard();
  self.Surrounded = false;
  self._putTarget();
  self._genTerrain();
  self.Moves = 0;
};

function NodeSet() {
  this._set = {};
}

NodeSet.prototype._hash = function(node) {
  return 'h' + (node.row * 97 + node.col);
};

NodeSet.prototype.add = function(node) {
  var self = this;
  self._set[self._hash(node)] = true;
};

NodeSet.prototype.has = function(node) {
  var self = this;
  return self._set.hasOwnProperty(self._hash(node));
};

Board.prototype._isEscapeNode = function(node) {
  var self = this;
  return node.row === 0 || node.col === 0 || node.row === self._DIM-1 || node.col === self._DIM-1;
};

Board.prototype._getNextParent = function(node) {
  var n = node;
  if (n.parent !== null) {
    while (n.parent.parent !== null) {
      n = n.parent;
    }
    return n;
  }
  return n;
};

Board.prototype._getNextMove = function() {
  var self = this;
  var queue = [];
  var visited = new NodeSet();
  var node = {row: self.Target[0], col: self.Target[1], dist: 0, parent: null};
  var minDir = { node: node, dist: Number.MAX_VALUE};
  var maxDir = { node: node, dist: 0};
  visited.add(node);
  queue.push(node);
  while (queue.length > 0) {
    node = queue.shift();
    if (self._isEscapeNode(node)) {
      if (minDir.dist > node.dist) {
        minDir.dist = node.dist;
        minDir.node = node;
      }
    }
    if (maxDir.dist < node.dist) {
      maxDir.dist = node.dist;
      maxDir.node = node;
    }
    var nbs = self._neighbors(node.row, node.col);
    for (var i = 0; i < nbs.length; i++) {
      var n = {row: nbs[i][0], col: nbs[i][1], dist: node.dist+1, parent: node};
      if (!visited.has(n)) {
        queue.push(n);
        visited.add(n);
      }
    }
  }
  if (minDir.dist === Number.MAX_VALUE) {
    self.Surrounded = true;
    return self._getNextParent(maxDir.node);
  }
  return self._getNextParent(minDir.node);
};

Board.prototype._move = function() {
  var self = this;
  var node = self._getNextMove();
  self.Cells[self.Target[0]][self.Target[1]] = self.EMPTY;
  self.Target = [node.row, node.col];
  self.Cells[self.Target[0]][self.Target[1]] = self.TARGET;
};

Board.prototype.block = function(row, col) {
  var self = this;
  if (self.Cells[row][col] === self.EMPTY) {
    self.Cells[row][col] = self.BLOCK;
    self.moves += 1;
    self._move();
  }
};

Board.prototype.lose = function() {
  var self = this;
  return self.Target[0] === 0 || self.Target[0] === self._DIM-1 || self.Target[1] === 0 || self.Target[1] === self._DIM-1;
};

Board.prototype.win = function() {
  var self = this;
  var nbs = self._neighbors(self.Target[0], self.Target[1]);
  for (var i = 0; i < nbs.length; i++) {
    if (self.Cells[nbs[i][0]][nbs[i][1]] !== self.BLOCK) {
      return false;
    }
  }
  return true;
};
