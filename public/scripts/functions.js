var logged;

$(document).ready(function () {
    $('.collapsible').collapsible();
    var opened = false;
    $('#arrow').click(function () {
        if (!opened) {
            document.getElementById('arrow').firstChild.innerHTML = "keyboard_arrow_up";
            opened = true;
            revealGraph();
        } else {
            document.getElementById('arrow').firstChild.innerHTML = "keyboard_arrow_down";
            opened = false;
        }


    });
});


function closeBtn() {
    $('#card_do_saldo').html('');
}




function getInfo() {
    var username = getSession('user');
    xhrGet('/getInfo?user=' + username, function (data) {
        console.log("Deu certo" + data);
        var saldo = data.saldo;
        var score = data.score;
        var conta = data.conta;
        // // // // // // // //
        document.getElementById('card_do_saldo').innerHTML =
            '<div class="card-panel teal" style="background-color: white !important;box-shadow: none;"><span class="black-text card-title" id="saldo" style="text-align:center !important;"><h4>Saldo</h4><p style="color: green !important">R$' + saldo + ',00<p></span></div>';

        document.getElementById('valor_conta').style.textAlign = 'center';
        document.getElementById('valor_conta').innerHTML = 'Conta:<a href="#">' + conta + '</a>';
        document.getElementById('card-rate1').innerHTML =
            '<div class="card-content" id="card-rate"><span class="card-title grey-text text-darken-4">Seu Rate</span><p class="z-depth-1" style="width: 150px !important; text-align:center; font-size: 22pt;"><a href="#">' + score + '</a></p><p class="z-depth-1" style="width: 150px !important; text-align:center;margin-top:2px; !important; height:40px;"><a href="#"><i class="material-icons" id="sentiment_icon">sentiment_satisfied</i></a></p></div>';

        document.getElementById('saldo').innerHTML =
            '<h4 class="card-title grey-text">Saldo</h4><p style="color: green !important">R$' + saldo + ',00<p></span>';
        logged = true;



    }, function (err) {

    });



}



function checkLoggedUser() {
    var pageSplit = location.pathname.split('/');
    var pageName = pageSplit[pageSplit.length - 1];

    if (sessionCheck('user')) {

    } else {
        if (pageName == 'index') {
            window.location = '/';
        }
    }
}

checkLoggedUser();


getInfo();

function logout() {

    if (confirm('Deseja efetuar logout?') == true) {
        deleteSession('user');
        window.location = '/';
    }
}

function eventFire(el, etype) {
    if (el.fireEvent) {
        el.fireEvent('on' + etype);
    } else {
        var evObj = document.createEvent('Events');
        evObj.initEvent(etype, true, false);
        el.dispatchEvent(evObj);
    }
}
var myPieChart;


var x;
var y;
var values = [];
var dates = [];


function drawProgress(progress) {
    // //Historico Plotly
    // Doughnut chart
    var ctx = document.getElementById('myChart').getContext('2d');
    var data = {
        labels : ['Usado','Livre'],
        datasets: [{
            label : 'Uso',
            data: [progress, 100 - progress],
            backgroundColor: ['#6a1b9a', '#eee']
        }]
    };

    document.getElementById('valor-progresso').style.width = progress + 'px';
    document.getElementById('valor-progresso').style.backgroundColor = '#6a1b9a !important';
    myPieChart = new Chart(ctx, {
        type: 'doughnut',
        data: data,
        options: {
            cutoutPercentage: 50,
            animation: {
                animateScale: true,
                animateRotate: true
            },
            responsive: true
        }
    });
}

function drawLine(points, dates) {
    var ctx2 = document.getElementById('lineChart').getContext('2d');

    var myChart = new Chart(ctx2, {
        type: 'line',
        data: {
            labels: dates.map(function (date) {
                return date.split('T')[1].split('-')[0];
            }),
            datasets: [{
                label: '% de Uso',
                data: points,
                borderWidth: 0
            }]
        },
        options: {
            showLines: true,
            spanGaps: false,
            responsive: true
        }
    });
}

$(document).ready(function () {
    // $('ul.tabs').tabs('select_tab', 'tab_id');
    $('ul.tabs').tabs();
});