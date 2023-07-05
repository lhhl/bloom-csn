const storageName = 'playersData'
let playerData = []

$(document).ready(function() {
  // Retrieve player names from local storage
  playerData = localStorage.getItem(storageName) || [];

  if (playerData.length > 0) {
    startGame();
  }

  // Add event listener to the text area input event
  $("#pointsTextarea").on("input", function() {
    clearTimeout(window.inputTimer);
    const val = $("#pointsTextarea").val();
    if (val == '') return
    window.inputTimer = setTimeout(calculatePoints, 3000);
  });

  // Add event listener for the "Start Game" button
  $("#startButton").click(function() {
    storePlayerNames();
    console.log(playerData.length);
    if (playerData.length > 0) {
      startGame();
    }
  });

  $("#resetButton").click(function() {
    if (!confirm("Are you sure you want to reset the game?")) return;
    resetGame();
  });

  $("#restartGame").click(function() {
    if (!confirm("Are you sure you want to restart the game?")) return;
    localStorage.clear();
    location.href = '';
  });

  $("#rejectPoints").click(function() {
    refreshData();
    closeModal();
    $("#pointsTextarea").select();
  });

  $("#showTotal").click(function() {
    $("#pointsTable tfoot").toggle();
  })

  $("#showPayment").click(function() {
    calculatePaybackAmounts();
  })

  $("#pointsTable tbody").on("click", "tr", function() {
    if (!confirm("Are you sure you want to delete this game?")) return;
    const index = $(this).attr('index');
    playerData = playerData.map(player => {
      player.points.splice(index, 1);
      return player;
    })
    localStorage.setItem(storageName, JSON.stringify(playerData));
    generateTableRows();
  });
});

function storePlayerNames() {
  // Retrieve player names
  var playerAName = $("#playerA").val().trim().toLowerCase();
  var playerBName = $("#playerB").val().trim().toLowerCase();
  var playerCName = $("#playerC").val().trim().toLowerCase();
  var playerDName = $("#playerD").val().trim().toLowerCase();

  if (!playerAName || !playerBName || !playerCName || !playerDName) {
    alert('Player name is required');
    return;
  }

  // Update player names in the table
  $("#playerAName").text(playerAName);
  $("#playerBName").text(playerBName);
  $("#playerCName").text(playerCName);
  $("#playerDName").text(playerDName);

  // Create players object with names
  playerData = [
    { name: playerAName, points: [] },
    { name: playerBName, points: [] },
    { name: playerCName, points: [] },
    { name: playerDName, points: [] }
  ];

  // Store players' data in local storage
  localStorage.setItem(storageName, JSON.stringify(playerData));
}

function startGame() {
  generateTableRows();

  // Show the game section
  $("#gameSection").removeClass("hidden");
  $("#playersForm").hide();
}

function refreshData() {
  playerData = JSON.parse(localStorage.getItem(storageName));
}

function generateTableRows() {
  refreshData()
  let tableHead = $("#pointsTable thead");
  let tableBody = $("#pointsTable tbody");
  let tableFoot = $("#pointsTable tfoot");
  tableHead.empty();
  tableBody.empty();
  tableFoot.empty();
  const thClass = 'border border-gray-400 font-medium p-2 text-black text-left bg-gray-200';
  const tfClass = 'border border-gray-400 font-medium p-2 text-black text-left bg-purple-100';
  const tdClass = 'border border-gray-400 py-1 px-4 text-black'

  let headRow = [];
  let bodyRow = [];
  let footRow = [];
  let i = 1;
  headRow.push(`<tr>`);

  // Create a row for each player
  for (let player of playerData) {
    headRow.push(`<th class='${thClass} text-center'>${player.name.toUpperCase()}</th>`);

    i++;
  }

  headRow.push("</tr>");
  tableHead.append(headRow.join(''));

  for (let k = 0; k < playerData[0].points?.length; k++) {
    bodyRow.push(`<tr index="${k}">`);
    playerData.forEach(player => {
      let point = player?.points[k]
      point = point > 0 ? `<span class="text-red-500 font-bold">${point}</span>` : point
      bodyRow.push(`<td class='${tdClass}'>${point}</td>`)
    })
    bodyRow.push('</tr>')
  }
  tableBody.append(bodyRow.join())

  playerData.forEach(player => {
    let total = player.points.reduce((a, b) => a + b, 0)
    total = total > 0 ? `<span class="text-red-500 font-bold">${total}</span>` : total
    footRow.push(`<td class='${tfClass}'>${total}</td>`)
  })
  tableFoot.append(footRow.join())
  
  if (playerData[0].points.length > 3) {
    $("#pointsTable .head2").show();
  } else {
    $("#pointsTable .head2").hide();
  }

  setTimeout(() => {  $("#pointsTextarea").focus(); }, 0);
  $("#gameCount").text(playerData[0].points.length);
  $('#payment').hide();
}

function calculatePoints() {
  clearTimeout(window.inputTimer);
  // Retrieve points input
  var pointsInput = $("#pointsTextarea").val().trim();
  pointsInput = pointsInput.toLowerCase();
  pointsInput = pointsInput.replace(/(cộng)/g, '+');
  pointsInput = pointsInput.replace(/(\+\s)/g, '+');

  // Split points input into an array
  var pointsArray = pointsInput.split(" ");
  const scoredPlayer = [];
  let remainingPoint = 0;
  const setOfPoints = []


  if (pointsInput.includes('tới trắng')) {
    const existedPlayer = playerData.find(player => player.name == pointsArray[0]);
    if (!existedPlayer) {
      refreshData()
      showError(`The player is not existed`)
      return
    }

    playerData.forEach(player => {
      if (player.name == pointsArray[0]) {
        player.points.push(39)
        setOfPoints.push({name: player.name, point: 39})
      } else {
        setOfPoints.push({name: player.name, point: -13})
        player.points.push(-13)
      }
    })

    return showPoints(setOfPoints);
  }

  // Process the points input and calculate total points
  for (var i = 0; i < pointsArray.length; i += 2) {
    var playerName = pointsArray[i].trim().toLowerCase();
    if (scoredPlayer.includes(playerName)) continue;

    let point = checkPoint(pointsArray[i + 1].trim().toLowerCase());
    if (point === false) {
      refreshData();
      showError(`The input score is invalid`);
      return;
    }
    let existedIndex = -1;
    const existedPlayer = playerData.find((p,i) => {
      if (checkName(p.name, playerName)) {
        existedIndex = i
        return true;
      }
      return false;
    })

    if (!existedPlayer) continue;

    point = point.includes('+') ? parseInt(point) : parseInt(point) * -1;
    scoredPlayer.push(playerName);
    playerData[existedIndex].points.push(point);
    remainingPoint += point

    setOfPoints.push({name: playerName, point})
  }

  if (scoredPlayer.length < playerData.length - 1) {
    refreshData()
    showError(`Please input score for ${playerData.length - 1} player`)
    return
  }

  playerData.forEach(player => {
    if (scoredPlayer.includes(player.name)) return
    const point = 0 - remainingPoint
    player.points.push(point)
    setOfPoints.push({name: player.name, point})
  })

  showPoints(setOfPoints)
}

function checkPoint(point) {
  const parsedPoint = parseInt(point)
  if (!isNaN(parsedPoint)) return point
  let prefix = ''

  console.log(point)
  console.log(point.substring(0, 1))

  if (point.substring(0, 1) == '+') {
    prefix = '+';
    point = point.substring(1, point.length);
  }

  console.log(point)

  const textToIntMap = {
    'không': '0',
    'một': '1',
    'hai': '2',
    'ba': '3',
    'bốn': '4',
    'năm': '5',
    'sáu': '6',
    'bảy': '7',
    'tám': '8',
    'chín': '9',
    'mười': '10'
  }

  if (textToIntMap[point]) return `${prefix}${textToIntMap[point]}`

  return false
}

function checkName(name1, name2) {
  return name1 == name2 || name1.includes(name2) || name2.includes(name1);
}

function showPoints(setOfPoints) {
  $("#pointsTextarea").blur();
  const tdClass = 'pr-5 pb-14 text-right';
  let tableBody = $("#setOfPoints tbody");
  let bodyRow = [];

  tableBody.empty();

  setOfPoints.forEach(row => {
    bodyRow.push(`<tr><td class="${tdClass}">${row.name.toUpperCase()}:</td><td class="${tdClass}">${row.point}</td></tr>`)
  })

  tableBody.append(bodyRow.join())
  
  openModal()
}

function updatePoints() {
  // Store updated players' data in local storage
  localStorage.setItem(storageName, JSON.stringify(playerData));

  $("#pointsTextarea").val('');
  closeModal()
  generateTableRows()
}

function showError(message) {
  var errorBoard = $("#errorBoard");
  errorBoard.text(message);
  errorBoard.show();

  // Hide the error message after 3 seconds
  setTimeout(function() {
    errorBoard.hide();
  }, 3000);
}

function resetGame() {
  playerData = playerData.map(player => {
    player.points = []
    return player
  })

  localStorage.setItem(storageName, JSON.stringify(playerData));
  generateTableRows();
}


function openModal() {
  // Show the modal
  $("#pointsModal").removeClass("hidden");

  window.modalTimer = setTimeout(updatePoints, 5000);

  // Generate and display the table of points
}

function closeModal() {
  // Hide the modal
  clearTimeout(window.modalTimer);
  $("#pointsModal").addClass("hidden");
}

function calculatePaybackAmounts() {
  const payments = {};
  playerData.forEach(player => {
    let total = player.points.reduce((a, b) => a + b, 0)
    payments[player.name] = total
  })

  var paybackAmounts = {};

  var balances = {};
  var creditors = [];
  var debtors = [];

  // Calculate individual balances and separate creditors and debtors
  for (var person in payments) {
    var amount = payments[person];
    balances[person] = amount;

    if (amount > 0) {
      creditors.push({ person: person, balance: amount });
    } else if (amount < 0) {
      debtors.push({ person: person, balance: Math.abs(amount) });
    }
  }

  // Sort balances in descending order
  creditors.sort((a, b) => b.balance - a.balance);
  debtors.sort((a, b) => b.balance - a.balance);

  // Calculate payback amounts
  while (creditors.length > 0 && debtors.length > 0) {
    var creditor = creditors[0];
    var debtor = debtors[0];

    var amount = Math.min(debtor.balance, creditor.balance);
    var paybackAmount = { person: debtor.person, amount: amount };

    if (!paybackAmounts[creditor.person]) {
      paybackAmounts[creditor.person] = [];
    }
    paybackAmounts[creditor.person].push(paybackAmount);

    debtor.balance -= amount;
    creditor.balance -= amount;

    if (debtor.balance === 0) {
      debtors.shift();
    }

    if (creditor.balance === 0) {
      creditors.shift();
    }
  }

  const text = [];

  // Print the payback amounts
  for (var person in paybackAmounts) {
    var paybacks = paybackAmounts[person];
    for (var i = 0; i < paybacks.length; i++) {
      var payback = paybacks[i];
      text.push(`${payback.person.toUpperCase()} chuyển ${person.toLocaleUpperCase()} <span class="text-red-600">${payback.amount}K</span>`);
    }
  }

  $('#payment').html(`<p> - ${text.join('</p><p> - ')}</p>`);
  $('#payment').show();
}