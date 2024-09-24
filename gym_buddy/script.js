// used to set the times to short values
let debug_mode = true;

let timerDiv = document.getElementById('timer');
let topRightDiv = document.getElementById('topRightDiv');
let go_button = document.getElementById('go_button');
let go_button_text = document.getElementById('go_button_text');
let status_bar = document.getElementById('status_bar');

// the main variable tracking progress in the scheduled defined in program
let program_index = 0;

//used to control the untimed portion of the program
let stop_timer = false;
let stop_countdown = false;
//controls the start button, restricting it to one click, reset by cancel
let start_button_clicked = false;

// the set data
//label, countdown time (0 for countup), beep interval, timer bg color
const rest_seconds = 30;
const program = [
  ["Get ready for bike", 15, 5, "orange"],
  ["RIDE!", 30, 5, "red"],
  ["Rest", rest_seconds, 10, "green"],
  ["Arnies", 0, "Done", "red"],
  ["Rest", rest_seconds, 10, "green"],
  ["Curls", 0, "Done", "red"],
  ["Rest", rest_seconds, 10, "green"],
  ["Floor: Bird Dog, Pushups, Plank, Crunches", 0, "Done", "red"],
  ["Rest", rest_seconds, 10, "green"],
  ["Lift", 0, "Done", "red"]
];

//debugging
if (debug_mode) {
  program.forEach(item => {
    if (item[1] > 0) item[1] = 5;
  });

}

const program_count = program.length;

function setTimerText(text) {
  timerDiv.innerText = text;
}

const context = new (window.AudioContext || window.webkitAudioContext)();
function beep() {
  //console.debug("beep");
  const o = context.createOscillator();
  const g = context.createGain();
  o.connect(g);
  g.connect(context.destination);
  o.start();
  g.gain.exponentialRampToValueAtTime(0.00001, context.currentTime + 0.5);
  o.stop(context.currentTime + 0.5); // Stop the oscillator after 0.5 seconds
}

// runs the countdown
function countdown(countdown_secs, beep_freq, bg_color) {
  stop_timer = true;  //cancel the countup if it's running
  stop_countdown = false;
  timerDiv.style.backgroundColor = bg_color;

  return new Promise((resolve) => {
    let intervalId = setInterval(() => {

      if (stop_countdown) {
        clearInterval(intervalId);
        resolve(); // Resolve the promise when countdown reaches 0
      }

      setTimerText(countdown_secs);
      if (countdown_secs <= 3 && countdown_secs > 0) {
        beep();
      }
      else if (countdown_secs % beep_freq === 0) {
        beep();
      }

      if (countdown_secs === 0) {
        clearInterval(intervalId);
        resolve(); // Resolve the promise when countdown reaches 0
      } else {
        countdown_secs--;
      }
    }, 1000);
  });
}

function run_timer() {
  stop_timer = false
  stop_countdown = true;  //avoid clash

  timerDiv.style.backgroundColor = "black";
  let seconds = 0;
  const interval_id = setInterval(() => {
    if (stop_timer) {
      clearInterval(interval_id);
      return;
    }
    seconds++;
    setTimerText(seconds);
  }, 1000);
}

function focus_row(row, highlight = false) {

  if (row == null) return;

  //toggle the status of a button if there is one
  var row_button = row.querySelector('button');
  if (row_button != null) {
    row_button.disabled = !highlight;
    console.debug("row_button.disabled:" + highlight)
  }

  if (highlight) {
    row.style.fontWeight = 'bold';
    row.style.backgroundColor = 'yellow';
  }
  else {
    row.style.fontWeight = '';
    row.style.backgroundColor = '';
  }
}

function run_exercise() {

  if (program_index > program_count) {
    set_status('');
    return;
  }

  exercise = program[program_index];
  if (exercise == null) return;

  set_status(exercise[0], exercise[3]);

  //set the first row highlight
  if (program_index == 0) {
    focus_row(get_row_by_id(program_index), true);
  }

  if (exercise[1] == 0) {
    //a 0 duration exercise is an untimed exercise
    //end processing which will be restarted by the button
    //start the timer counting up from 0
    set_button_text("Done");
    go_button.onclick = done_button_onClick;
    dimable_go_button(false);

    run_timer();
    return;
  }
  else {
    dimable_go_button();
    countdown(exercise[1], exercise[2], exercise[3]).then(() => {
      init_next_exercise();
      run_exercise();
    });
  };
};


function done_button_onClick() {
  stop_timer = true;
  stop_countdown = true;  //safety

  //resume
  init_next_exercise();
  run_exercise();
}

// move to the next exercise in the program
// and change the UI focus
function init_next_exercise() {
  //clear the currently selected row
  //active_row = document.getElementById("row_ex_" + program_index);
  focus_row(get_row_by_id(program_index), false);

  //increment the counter
  program_index += 1;

  //reset in case
  stop_timer = true;
  stop_countdown = true;

  //we're done
  if (program_index > program_count) {
    set_status('');
    return;
  }

  //highlight the active row
  focus_row(get_row_by_id(program_index), true);

}

function get_row_by_id(id) {
  return document.getElementById("row_ex_" + id);
}

function cancel_program() {
  stop_timer = true;
  stop_countdown = true;
  start_button_clicked = false;

  //clear all the rows in the table
  var all_rows = document.getElementById('program_table').getElementsByTagName('tr');
  for (var i = 0; i < all_rows.length; i++) {
    focus_row(get_row_by_id(i), false);
  }
  set_status('');
  program_index = 999;
  run_exercise();
}

function start_button_click() {
  //start_button_clicked is set to false by definition
  if (start_button_clicked) return;

  start_button_clicked = true;
  stop_timer = false;
  stop_countdown = false;
  program_index = 0
  run_exercise();
}

//set the text and background color of the status display
function set_status(text, bgcolor = null) {
  next = '';
  if(bgcolor !== null){
    //not using this. set the background color of the status bar
    //status_bar.style.backgroundColor = bgcolor
  }
  if(text.toLowerCase() == 'rest'){
    //TODO get the next exercise
    nextercise = program[program_index + 1];
    if (nextercise != null){
      text = text + '. Next up: ' + nextercise[0];
    }
  }

  status_bar.innerText = text;
}

function set_button_text(text){
  go_button_text.innerText = text;
}

//disable and dim the main go/done button
function dimable_go_button(dimable=true){
  opacity = 1;
  if(dimable){
    opacity = 0.25
  }
  go_button.style.opacity = opacity;
  go_button.style.disabled = dimable;

}

// populate the program UI
const table = document.getElementById("program_table");
var row_index = 0;
program.forEach(item => {
  duration = item[1];
  const row = table.insertRow();
  row.id = "row_ex_" + row_index;
  const cell1 = row.insertCell(0);
  const cell2 = row.insertCell(1);

  cell1.textContent = item[0];
  cell1.color = item[3];

  if (duration == 0) {
    /* the major Go button will now do this
    const button = document.createElement("button");
    button.textContent = item[2];
    button.id = "button_ex_" + row_index;
    button.className = "done_button";
    button.onclick = done_button_onClick;
    button.disabled = true;
    console.debug(button.id);
    cell2.appendChild(button);
    */
  }
  else {
    cell2.textContent = item[1];
  }
  row_index += 1;
});