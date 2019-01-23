var url_google = '/interface/googleSignIn'
var url_mail = '/interface/mailSignIn'


function onGoogleSignIn(googleUser) {
    var profile = googleUser.getBasicProfile();
    console.log('ID: ' + profile.getId()); // Do not send to your backend! Use an ID token instead.
    console.log('Name: ' + profile.getName());
    console.log('Image URL: ' + profile.getImageUrl());
    console.log('Email: ' + profile.getEmail()); // This is null if the 'email' scope is not present.

    //console.log(profile.getEmail());

    //SEND TOKEN TO BACKEND
    var id_token = googleUser.getAuthResponse().id_token;

    execute_post(url_google, { tokenid: id_token });
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
                console.log('Signed in as: ' + res);
                window.location.href = http_path;
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