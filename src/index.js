import React from 'react';
import ReactDOM from 'react-dom';
import Board from './board-component';
import './index.css';

import openSocket from 'socket.io-client';
const socket = openSocket(process.env.API_URL || 'http://192.168.0.104:4000');

var uuid = require('uuid4');
var playerId = uuid();

class Game extends React.Component {
  constructor() {
    const defaultState = {
      history: [{
        squares: Array(9).fill(null),
      }],
      xIsNext: true,
      stepNumber: 0,
      canMove: false,
    };

    super();
    this.state = JSON.parse(JSON.stringify(defaultState));

    socket.on('connect', () => {
      socket.emit('new_player', playerId);

      socket.on('state', (state) => {
        this.setState(state);
      });
      socket.on('player_move', () => {
        this.setState({
          canMove: true
        });
      });
      socket.on('reset', () => {
        this.setState(defaultState);
      });

    });

  }

  handleClick(i) {
    const history = this.state.history.slice(0, this.state.stepNumber + 1);
    const current = history[history.length - 1];
    const squares = current.squares.slice();
    if(!this.state.canMove || calculateWinner(squares) || squares[i]) {
      return;
    }
    squares[i] = this.state.xIsNext ? 'X' : 'O';
    const state = {
      history: history.concat([{
        squares: squares,
      }]),
      stepNumber: history.length,
      xIsNext: !this.state.xIsNext,
      canMove: false
    }

    this.setState(state);
    socket.emit('move', state);
  }

  render() {
    if(this.state) {
      const history = this.state.history;
      const current = history[this.state.stepNumber];
      const winner = calculateWinner(current.squares);

      let status;
      if(winner) {
        status = 'Winner:' + winner;
      } else {
        status = 'Next player: ' + (this.state.xIsNext ? 'X' : 'O');
      }

      let who = this.state.canMove ? 'Your move!' : 'Opposite player move';

      return (
        <div className="game">
          <div className="game-board">
            <Board
              squares={current.squares}
              onClick={(i) => {this.handleClick(i)}} 
            />
          </div>
          <div className="game-info">
            <div>{status}</div>
            <div>{who}</div>
          </div>
        </div>
      );
    }
    return null;
  }
}

// ========================================

ReactDOM.render(
  <Game />,
  document.getElementById('root')
);

function calculateWinner(squares) {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];

  for(let i=0; i < lines.length; ++i) {
    const [a, b, c] = lines[i];
    if(squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return squares[a];
    }
  }
  return null;
}