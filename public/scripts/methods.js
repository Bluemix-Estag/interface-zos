$(document).ready(function () {
    startMainThread();
    var conta = getSession('user');
    getSaldo(conta);
    getCICS();
    getDBTransactions();
    getDBPrograms();
    updateCICS();
});


// Get Saldo
function getSaldo(conta) {
    switch (conta) {
        case 'conta1':
            conta = '10';
            break;
        case 'conta2':
            conta = '20';
            break;
        case 'conta3':
            conta = '30';
            break;
        case 'conta4':
            conta = '40';
            break;
    }
    xhrGet('/getSaldo?conta=' + conta, function (result) {
        console.log("Resulto do saldo: " + result);
        var saldo = result;
        document.getElementById('valor-saldo').innerText = saldo;
    }, function (error) {
        console.log(error);
        document.getElementById('total_balance').innerHTML = 'Saldo indisponível, tente mais tarde por favor.'
    });
}


// GetCICS
function getCICS() {
    xhrGet('/getCICSStatus', function (result) {
        var result = JSON.parse(result);
        var total_transactions = result['L_TOTAL_TRANSACS'];
        var total_program_uses = result['L_TOTAL_PROGRAM_USES'];
        var total_trans_cpu_time = result['L_TOTAL_TRANS_CPU_TIME'];
        var cpu_time = result['L_ADRESSPACE_ACUM_CPU_TIME'];

        document.getElementById('total_transactions').innerHTML = total_transactions;
        document.getElementById('total_programs').innerHTML = total_program_uses;
        document.getElementById('cpu_time').innerHTML = total_trans_cpu_time;
        document.getElementById('total_cpu_time').innerHTML = cpu_time;

    }, function (error) {
        document.getElementById('total_transactions').innerHTML = 'Serviço indisponível';
        document.getElementById('total_programs').innerHTML = 'Serviço indisponível';
        document.getElementById('cpu_time').innerHTML = 'Serviço indisponível';
        document.getElementById('total_cpu_time').innerHTML = 'Serviço indisponível';
    });
}

// GetDB Transactions
function getDBTransactions() {
    xhrGet('/getDBTransactions', function (result) {
        var result = JSON.parse(result);
        var transactionsArr = [];
        var labelsTArr = [];
        var sizeOfResult = result.length;
        for (var i in result) {
            transactionsArr.push(result[i]['L_TOTAL_TRANSACS']);
            labelsTArr.push("T" + i);
        }
        var newTransactionArr = unshiftTo(transactionsArr, 20);
        var newLblArr = unshiftTo(labelsTArr, 20)
        createChart('transactionsChart', newTransactionArr, newLblArr);
    }, function (error) {
        console.log('Erro no Get')
    });
}

// GetDB Programs
function getDBPrograms() {
    xhrGet('/getDBPrograms', function (result) {
        var result = JSON.parse(result);
        console.log('Resulto do dbprog' + result);
        var programsArr = [];
        var labelsArr = [];
        var sizeOfResult = result.length;
        for (var i in result) {
            programsArr.push(result[i]['L_TOTAL_PROGRAM_USES']);
            labelsArr.push("T" + i);
        }
        var newProgramArr = unshiftTo(programsArr, 20);
        newLblPArr = unshiftTo(labelsArr,20);
        createChart('programsChart', newProgramArr, newLblPArr);
    }, function (error) {
        console.log('Erro no Get')
    });
}

// UpdateCICS
function updateCICS() {
    setInterval(function () {
        xhrGet('/getCICSStatus', function (result) {
            var result = JSON.parse(result);
            var cicsStatus = result;
            var info = {
                "info": cicsStatus
            }
            xhrPost('/pushDB', info, function (response) {
                console.log('POST com sucesso');
            }, function (err) {
                console.log('Erro no POST')
            })
        }, function (error) {
            console.log('Erro no GET');
        });
    }, 60000 * 120);
}


// Session
function getSession(name) {
    if (typeof (Storage) !== "undefined") {
        // Code for localStorage/sessionStorage.
        return sessionStorage.getItem(name);
    } else {
        // Sorry! No Web Storage support.. use cookie instead..
        return getCookie(name);
    }
}

function logout() {

    if (confirm('Deseja efetuar logout?') == true) {
        deleteSession('user');
        window.location = '/';
    }
}

// Loading Activity
function startLoadingActivity(elementId) {
    document.getElementById(elementId).innerHTML = '<div class="preloader-wrapper small active">' +
        '<div class="spinner-layer spinner-purple-only">' +
        '<div class="circle-clipper left">' +
        '<div class="circle"></div></div>' +
        '<div class="gap-patch">' +
        '<div class="circle"></div></div>' +
        '<div class="circle-clipper right">' +
        '<div class="circle"></div></div></div></div>';
}

function stopLoadingActivity(elementId) {
    document.getElementById(elementId).innerHTML = '';
}

// Start Loading Thread
function startMainThread() {
    startLoadingActivity('total_transactions');
    startLoadingActivity('total_programs');
    startLoadingActivity('cpu_time');
    startLoadingActivity('total_cpu_time');
}

// Clear DIV
function clearDiv(elementId) {
    document.getElementById(elementId).innerHTML = '';
}

// Clear Transactions
function clearTransactions() {
    clearDiv('total_transactions');
    clearDiv('total_programs');
    clearDiv('cpu_time');
    clearDiv('total_cpu_time');
}


// Reload Data
function reloadData() {
    clearTransactions();
    startMainThread();
    var conta = getSession('user');
    getSaldo(conta);
    getCICS();
    getDBTransactions();
    getDBPrograms();

}

// Reload Transactions
function reloadTransactions() {
    startLoadingActivity('total_transactions');
    xhrGet('/getCICSStatus', function (result) {
        var result = JSON.parse(result);
        var total_transactions = result['L_TOTAL_TRANSACS'];

        document.getElementById('total_transactions').innerHTML = total_transactions;

    }, function (error) {
        document.getElementById('total_transactions').innerHTML = 'Serviço indisponível';
    });
}

// Reload Programs
function reloadPrograms() {
    startLoadingActivity('total_programs');
    xhrGet('/getCICSStatus', function (result) {
        var result = JSON.parse(result);
        var total_program_uses = result['L_TOTAL_PROGRAM_USES'];

        document.getElementById('total_programs').innerHTML = total_program_uses;

    }, function (error) {
        document.getElementById('total_programs').innerHTML = 'Serviço indisponível';
    });
}

// Reload CPU
function reloadCpu() {
    startLoadingActivity('cpu_time');
    xhrGet('/getCICSStatus', function (result) {
        var result = JSON.parse(result);
        var total_trans_cpu_time = result['L_TOTAL_TRANS_CPU_TIME'];
        document.getElementById('cpu_time').innerHTML = total_trans_cpu_time;
    }, function (error) {
        document.getElementById('cpu_time').innerHTML = 'Serviço indisponível';
    });
}


// Reload TOTAL CPU
function reloadCpuTotal() {
    startLoadingActivity('total_cpu_time');
    xhrGet('/getCICSStatus', function (result) {
        var result = JSON.parse(result);
        var cpu_time = result['L_ADRESSPACE_ACUM_CPU_TIME'];
        document.getElementById('total_cpu_time').innerHTML = cpu_time;
    }, function (error) {
        document.getElementById('total_cpu_time').innerHTML = 'Serviço indisponível';
    });
}

// Reload Saldo
function reloadSaldo() {
    startLoadingActivity('total_balance')
    var conta = getSession('user');
    switch (conta) {
        case 'conta1':
            conta = '10';
            break;
        case 'conta2':
            conta = '20';
            break;
        case 'conta3':
            conta = '30';
            break;
        case 'conta4':
            conta = '40';
            break;
    }
    xhrGet('/getSaldo?conta=' + conta, function (result) {
        
        document.getElementById('total_balance').innerHTML = 'R$<span id="valor-saldo"></span>';
        var saldo = result;
        document.getElementById('valor-saldo').innerText = saldo;
    }, function (error) {
        console.log(error);
        document.getElementById('total_balance').innerHTML = 'Saldo indisponível, tente mais tarde por favor.'
    });
}

// Return MOCKED credit rate
function getCreditRate() {
    var loan_value = document.getElementById('loan_value').value;

    if (loan_value == '') {
        alert('Por favor preencha o campo do valor do crédito');
        $('#loanBtn').prop('disabled', true);
    } else {
        console.log('Valor');
        var value = parseInt(loan_value);
        if (value > 0 && value < 500) {
            loanCardContent(5, 'sentiment_dissatisfied');
        } else if (value >= 500 && value < 1000) {
            loanCardContent(3, 'sentiment_neutral');
        } else if (value >= 1000) {
            loanCardContent(1, 'tag_faces');
        } else {
            alert('Valor inválido');
        }
    }
}

// Enables loan
function enableLoan() {
    $('#loanBtn').prop('disabled', false);
}

// Created Loan Card content
function loanCardContent(credit, rate) {
    document.getElementById('loan_result').innerHTML = '<div class="card"><div class="card-content black-text">' +
        '<div class="row">' +
        '<div class="input-field col s12">' +
        '<input type="text" class="validate" disabled value="Score de Crédito" style="text-align: center;font-size: 22pt;color: black;"">' +
        '</div>' +
        '<div class="input-field col s12">' +
        '<input type="text" class="validate" disabled value="' + credit + '" style="text-align: center;font-size: 22pt;color: #6a1b9a;"">' +
        '</div>' +
        '<div class="col s6 offset-s3 center"><i class="material-icons purple-text" style="width: auto;height: 40px;">' + rate + '</i></div>'
    '</div></div></div>';
}

// Chart Creator
function createChart(chartID, dataArr, labelsArr) {
    var ctx = document.getElementById(chartID).getContext('2d');
    var myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labelsArr,
            datasets: [{
                label: '#',
                data: dataArr,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.2)',
                    'rgba(54, 162, 235, 0.2)',
                    'rgba(255, 206, 86, 0.2)',
                    'rgba(75, 192, 192, 0.2)',
                    'rgba(153, 102, 255, 0.2)',
                    'rgba(255, 159, 64, 0.2)'
                ],
                borderColor: [
                    'rgba(255,99,132,1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)'
                ],
                borderWidth: 0,
                fill: false
            }]
        },
        options: {
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: false
                    }
                }]
            },
            responsive: true
        }
    });
}

// Returns array with only 30 elements
function unshiftTo(array, to) {
    var array = array;
    while (array.length > to) {
        array.shift();
    }
    return array;
}