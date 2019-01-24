function completeLogout(logged_with) {
    console.log(logged_with)

    switch (logged_with) {
        case "GOOGLE":
            googleLogout(); break;

        case "FACEBOOK":
            facebookLogout(); break;

        case "MAIL":
            mailLogout(); break;
    }
}

function loggedOut(){
    $('#logging_out_msg').hide()
    $('#error_msg').hide()
    $('#logged_out_msg').show()
}

function errorLogginOut(){
    $('#logging_out_msg').hide()
    $('#logged_out_msg').hide()
    $('#error_msg').show()
}


// GOOGLE
function googleLogout() {
    gapi.load('auth2', function() {
        gapi.auth2.init();
      });
    
    var auth2 = gapi.auth2.getAuthInstance();
    auth2.signOut().then(loggedOut).catch(errorLogginOut);
}

// MAIL
function mailLogout() {
    // LOG OUT
}

// FACEBOOK //////////////////////////////////////////////////////////////
var FB;

window.fbAsyncInit = function () {
    FB.init({
        appId: '2178730182445130',
        cookie: true,
        xfbml: true,
        version: 'v3.2'
    });
    FB.AppEvents.logPageView();

};

(function (d, s, id) {
    var js, fjs = d.getElementsByTagName(s)[0];
    if (d.getElementById(id)) { return; }
    js = d.createElement(s); js.id = id;
    js.src = "https://connect.facebook.net/en_US/sdk.js";
    fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));


function facebookLogout() {
    FB.logout(loggedOut);
}

