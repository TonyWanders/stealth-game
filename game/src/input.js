// Nightshift: The Meridian Vault - keyboard and mouse input.
// WASD or arrows to move, Shift to sneak, Q or click to throw a coin,
// M to mute, R to restart the level, P to pause, Enter to start or continue.
export function makeInput(canvas) {
  const keys = new Set();
  let clickPoint = null;
  let clickQueued = false;

  function key(e) {
    return e.key.toLowerCase();
  }

  window.addEventListener('keydown', (e) => {
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key(e))) e.preventDefault();
    keys.add(key(e));
    if (key(e) === 'q') clickQueued = true;
  });
  window.addEventListener('keyup', (e) => keys.delete(key(e)));
  window.addEventListener('blur', () => keys.clear());

  canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    clickPoint = { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
    clickQueued = true;
  });

  function read() {
    const state = {
      left: keys.has('a') || keys.has('arrowleft'),
      right: keys.has('d') || keys.has('arrowright'),
      up: keys.has('w') || keys.has('arrowup'),
      down: keys.has('s') || keys.has('arrowdown'),
      sneak: keys.has('shift'),
      throwCoin: clickQueued,
      throwX: clickPoint ? clickPoint.x : 0,
      throwY: clickPoint ? clickPoint.y : 0,
      enter: keys.has('enter'),
      restart: keys.has('r'),
      pause: keys.has('p'),
      mute: keys.has('m'),
    };
    clickQueued = false;
    return state;
  }

  function consume(code) {
    keys.delete(code);
  }

  return { read, consume };
}
