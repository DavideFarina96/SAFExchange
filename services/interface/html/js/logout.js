function completeLogout(user) {
    switch (user.logged_with) {
        case "GOOGLE":
            googleLogout(); break;

        case "FACEBOOK":
            facebookLogout(); break;

        case "MAIL":
            mailLogout(); break;
    }
}


// GOOGLE
function googleLogout() {
    var auth2 = gapi.auth2.getAuthInstance();
    auth2.signOut().then(function () {
        console.log('User signed out.');
    });
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
    checkLoginState();
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
    FB.logout(function (response) {
        checkLoginState();
        // Person is now logged out
    });
}

