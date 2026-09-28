const tiles = [...document.querySelectorAll('.tile')];
const start = document.querySelector('#start');
const status = document.querySelector('#status');
const word = document.querySelector('#word');
const game = document.querySelector('main');
const progress = document.querySelector('.progress');
const bars = [...progress.children];
const rounds = 5;
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
let sequence = [], position = 0, secret = '';
let finished = false;

function reset() {
  finished = false;
  sequence = [];
  position = 0;
  word.hidden = true;
  word.textContent = '';
  status.textContent = 'Simon Says';
  start.textContent = 'Start Game';
  game.classList.add('idle');
  bars.forEach(bar => bar.classList.remove('filled'));
  progress.setAttribute('aria-valuenow', 0);
  enableTiles(false);
}

function enableTiles(enabled) {
  tiles.forEach(tile => tile.disabled = !enabled);
}

async function flash(index) {
  tiles[index].classList.add('active');
  await wait(500);
  tiles[index].classList.remove('active');
  await wait(200);
}

async function nextRound() {
  position = 0;
  sequence.push(Math.floor(Math.random() * tiles.length));
  status.textContent = `Watch · ${sequence.length} / ${rounds}`;
  await wait(600);
  for (const index of sequence) await flash(index);
  status.textContent = `Your turn · ${sequence.length} / ${rounds}`;
  enableTiles(true);
}

function finish(message) {
  enableTiles(false);
  status.textContent = message;
  finished = true;
  start.textContent = 'Back to Start';
  start.disabled = false;
}

async function choose(index) {
  if (tiles[index].disabled) return;
  enableTiles(false);
  await flash(index);
  if (index !== sequence[position]) {
    finish('Try again');
    return;
  }
  position++;
  if (position < sequence.length) {
    enableTiles(true);
    return;
  }
  bars[sequence.length - 1].classList.add('filled');
  progress.setAttribute('aria-valuenow', sequence.length);
  if (sequence.length < rounds) {
    nextRound();
  } else {
    word.textContent = secret;
    word.hidden = false;
    finish('Well done!');
  }
}

start.addEventListener('click', async () => {
  if (finished) {
    reset();
    return;
  }
  start.disabled = true;
  game.classList.remove('idle');
  word.hidden = true;
  sequence = [];
  try {
    const response = await fetch('reward.json', { cache: 'no-store' });
    const data = await response.json();
    secret = data.word;
  } catch {
    finish('Could not load the word. Please try again.');
    return;
  }
  nextRound();
});

tiles.forEach((tile, index) => tile.addEventListener('click', () => choose(index)));
document.addEventListener('keydown', event => {
  const index = '1234567890qwerty'.indexOf(event.key.toLowerCase());
  if (!event.repeat && !event.ctrlKey && !event.metaKey && !event.altKey && event.key.length === 1 && index !== -1) {
    event.preventDefault();
    choose(index);
  }
});
