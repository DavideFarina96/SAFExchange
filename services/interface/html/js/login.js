var url_google = '/account/googleSignIn'
var url_facebook = '/account/facebookSignIn'
var url_login_mail = '/account/mailSignIn'
var url_register_mail = '/account/mailRegister'


function onGoogleSignIn(googleUser) {
    var profile = googleUser.getBasicProfile();
    console.log('ID: ' + profile.getId());
    console.log('Name: ' + profile.getName());
    console.log('Image URL: ' + profile.getImageUrl());
    console.log('Email: ' + profile.getEmail());

    var user_obj = {
        id_google: profile.getId(),
        name: profile.getName(),
        image_url: profile.getImageUrl(),
        email: profile.getEmail()
    }

    // Send token to backend
    var id_token = googleUser.getAuthResponse().id_token;

    execute_post(url_google, { tokenid: id_token, user: user_obj }, (() => { $('#error_msg').show(); }));
}

function onFacebookSignIn(facebookData) {
    var id_token = facebookData.authResponse.accessToken;

    FB.api('/me?fields=name,email', function (response) {
        console.log(response);  // Response is the basic user object
        var userData = response;

        var user_obj = {
            id_facebook: userData.id,
            name: userData.name,
            image_url: 'http://graph.facebook.com/' + userData.id + '/picture?type=square',
            email: userData.email
        }

        execute_post(url_facebook, { tokenid: id_token, user: user_obj }, (() => { $('#error_msg').show(); }));
    });
}

function onMailLogin() {
    var email = $('#ma-box-email').val()
    var psw = $('#ma-box-password').val()

    execute_post(url_login_mail, { email: email, password: psw }, (() => { $('#ma-error-wrong-login').show() }));
}

function onMailRegister() {
    var email = $('#ma-box-email').val()
    var username = $('#ma-box-username').val()
    var image_url = 'https://www.iconspng.com/images/-abstract-user-icon-1/-abstract-user-icon-1.jpg'
    var psw = $('#ma-box-password').val()
    var re_psw = $('#ma-box-repeat-password').val()

    if (psw != re_psw)
        $('#ma-error-different-passwords').show()
    else
        execute_post(url_register_mail, { email: email, name: username, image_url: image_url, password: psw },
             (() => { $('#ma-error-register').show() }));
}


function execute_post(url, params, err_callback) {
    // Perform login / register by calling /account
    $.ajax({
        url: url,
        data: params,
        type: 'POST',
        contentType: 'application/x-www-form-urlencoded'
    })
        .then(res => {
            console.log(res)
            if (res.success) {
                window.location.href = "/interface";
            }
            else {
                // If there was an error call the callback function provided in the params
                err_callback()
            }
        })
        .catch(err => {
            // If the promise resolves with an error, log it in console
            console.log(err);
        });
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

function statusChangeCallback(response) {
    console.log('statusChangeCallback');
    console.log(response);
    // The response object is returned with a status field that lets the
    // app know the current login status of the person.
    // Full docs on the response object can be found in the documentation
    // for FB.getLoginStatus().
    if (response.status === 'connected') {
        // Logged into your app and Facebook.
        onFacebookSignIn(response);
        console.log("SEI LOGGATO");
    } else {
        // The person is not logged into your app or we are unable to tell.
        console.log("FAI IL LOGIN");
    }
}

function checkLoginState() {
    FB.getLoginStatus(function (response) {
        statusChangeCallback(response);
    });
}

function login() {
    FB.login(
        function (response) {
            if (response.authResponse) {
                onFacebookSignIn(response);
            }
            else {
                console.log('User cancelled login or did not fully authorize.');
            }
        },
        { scope: 'email' }
    );
}


// LISTENER /////////////////////////////////////////////////////////////
$('#btn-mail-account').click(e => {
    $('#box-mail-account').show()
})

$('#ma-box-login').click(e => {
    onMailLogin()
})

$('#ma-box-register').click(e => {
    onMailRegister()
})

$('#ma-box-cancel').click(e => {
    $('#box-mail-account').hide()
})

$('#ma-login-msg').on('click', e => {
    $('.ma-login-elem').hide()
    $('.ma-register-elem').show()
})

$('#ma-register-msg').on('click', e => {
    $('.ma-login-elem').show()
    $('.ma-register-elem').hide()
})