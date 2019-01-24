var url_google = '/interface/googleSignIn'
var url_facebook = '/interface/facebookSignIn'
var url_mail = '/interface/mailSignIn'


function onGoogleSignIn(googleUser) {
    var profile = googleUser.getBasicProfile();
    console.log('ID: ' + profile.getId()); // Do not send to your backend! Use an ID token instead.
    console.log('Name: ' + profile.getName());
    console.log('Image URL: ' + profile.getImageUrl());
    console.log('Email: ' + profile.getEmail()); // This is null if the 'email' scope is not present.

    var user_obj = {
        id_google: profile.getId(),
        name: profile.getName(),
        image_url: profile.getImageUrl(),
        email: profile.getEmail()
    }

    //console.log(profile.getEmail());

    //SEND TOKEN TO BACKEND
    var id_token = googleUser.getAuthResponse().id_token;

    execute_post(url_google, { tokenid: id_token, user: user_obj });
}

function onFacebookSignIn(facebookData) {
    var id_token = facebookData.authResponse.accessToken;
    var userData = getUserData();

    var user_obj = {
        id_facebook: userData.id,
        name: userData.name,
        image_url: "",
        email: userData.email
    }    

    execute_post(url_facebook, {tokenid: id_token, user: user_obj });
}

function onMailSignIn() {
    execute_post(url_mail);
}


function execute_post(url, params) {
    // Send it to /interface
    $.ajax({
        url: url,
        data: params,
        type: 'POST',
        contentType: 'application/x-www-form-urlencoded'
    })
        .then(res => {
            if (res.logged = true) {
                console.log('Signed in as');
                window.location.href = "/interface";
            }
            else {
                $('#error_msg').show();
            }
        })
        .catch(err => {
            // If the promise resolves with an error, log it in console
            console.log(err);
        });
}


// FACEBOOK //////////////////////////////////////////////////////////////
var FB;

window.fbAsyncInit = function() {
    FB.init({
        appId      : '2178730182445130',
        cookie     : true,
        xfbml      : true,
        version    : 'v3.2'
    });
    checkLoginState();
    FB.AppEvents.logPageView();
    
};

(function(d, s, id){
    var js, fjs = d.getElementsByTagName(s)[0];
    if (d.getElementById(id)) {return;}
    js = d.createElement(s); js.id = id;
    js.src = "https://connect.facebook.net/en_US/sdk.js";
    fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));


        //checkLoginState();


// FUNCTIONS
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
        getUserData();
    } else {
        // The person is not logged into your app or we are unable to tell.
        console.log("FAI IL LOGIN");
    }
}

function checkLoginState() {
    FB.getLoginStatus(function(response) {
        statusChangeCallback(response);
    });
}

function logout() {
    FB.logout(function(response) {
        checkLoginState();
        // Person is now logged out
    });
}

function login() {
    FB.login(
        function(response) {
            if (response.authResponse) {
             console.log('Welcome!  Fetching your information.... ');
             FB.api('/me?fields=id,name,email', function(response) {
                 console.log(response);
             });
         } 
         else {
            console.log('User cancelled login or did not fully authorize.');
        }
    },
    {scope:'email'}
    );
}

function getUserData() {
    FB.api('/me?fields=name,email', function(response) {
        console.log(response);  //response is the basic user object
        return response;
    });
}
//////////////////////////////////////////////////////////////////////////

/* Make the page perform a POST request
function execute_post(url, params) {
    // The rest of this code assumes you are not using a library.
    // It can be made less wordy if you use one.
    var form = document.createElement("form");
    form.setAttribute("method", "post");
    form.setAttribute("action", http_path + url);

    for(var key in params) {
        if(params.hasOwnProperty(key)) {
            var hiddenField = document.createElement("input");
            hiddenField.setAttribute("type", "hidden");
            hiddenField.setAttribute("name", key);
            hiddenField.setAttribute("value", params[key]);

            form.appendChild(hiddenField);
        }
    }

    document.body.appendChild(form);
    form.submit();
}*/