function getValidation() {

    var data = {
        "login": document.getElementById('username').value || null,
        "password": document.getElementById('password').value || null
    };
    document.getElementById('submit-btn').innerHTML = '<img src="/images/loading.gif" style="width:30px;height:30px;">';

    xhrPost('/login', data, function (response) {
        document.getElementById('submit-btn').innerHTML = 'Login';
        if (response.authenticated) {
            setSession("user",data.login);            
            window.location = '/index';
        } else {
            alert('Wrong username');
            setTimeout(function(){
                window.location = '/';
            }, 2000);
        }
    }, function (err) {
        alert(err);
    })
}


function checkLoggedUser(){
    var pageSplit = location.pathname.split('/');
    var pageName = pageSplit[pageSplit.length - 1];

    if(sessionCheck('user')){
        
    }else{
        alert(pageName);
    }
}

checkLoggedUser();